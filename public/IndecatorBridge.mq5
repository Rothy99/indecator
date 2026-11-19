//+------------------------------------------------------------------+
//|                                              IndecatorBridge.mq5 |
//|                     Copyright 2026, Indecator Institutional SMC  |
//|                 Real-Time Bridge for Gold & Crypto Terminal      |
//+------------------------------------------------------------------+
#property copyright "Indecator SMC Terminal"
#property link      "http://localhost:3000"
#property version   "3.00"
#property strict

input string InpServerUrl    = "http://localhost:3000/api/mt5/feed"; // Terminal Ingestion URL
input int    InpTimerSeconds = 1;                                    // Push Frequency (Seconds)
input int    InpBarsToSend   = 60;                                   // Number of Completed Candles

datetime lastPushTime = 0;

int OnInit()
{
   Print("Indecator MT5 Real-Time Bridge started for ", _Symbol);
   EventSetTimer(InpTimerSeconds);
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("Indecator MT5 Bridge stopped.");
}

void OnTimer()
{
   PushDataToTerminal();
}

void OnTick()
{
   datetime current = TimeCurrent();
   if(current - lastPushTime >= InpTimerSeconds)
   {
      PushDataToTerminal();
   }
}

void PushDataToTerminal()
{
   lastPushTime = TimeCurrent();
   
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   string company = AccountInfoString(ACCOUNT_COMPANY);
   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   int copied = CopyRates(_Symbol, _Period, 0, InpBarsToSend, rates);
   if(copied <= 0) return;
   
   string candlesJson = "[";
   for(int i = copied - 1; i >= 0; i--)
   {
      string cStr = StringFormat("{\"time\":%d,\"open\":%.2f,\"high\":%.2f,\"low\":%.2f,\"close\":%.2f,\"volume\":%d}",
         (long)rates[i].time, rates[i].open, rates[i].high, rates[i].low, rates[i].close, (long)rates[i].tick_volume);
      candlesJson += cStr;
      if(i > 0) candlesJson += ",";
   }
   candlesJson += "]";
   
   string payload = StringFormat(
      "{\"broker\":\"%s\",\"account\":%d,\"symbol\":\"%s\",\"timeframe\":\"%s\",\"bid\":%.2f,\"ask\":%.2f,\"spread\":%.1f,\"timestamp\":%d,\"candles\":%s}",
      company, login, _Symbol, EnumToString(_Period), bid, ask, (double)spread, (long)TimeCurrent(), candlesJson
   );
   
   char postData[];
   char result[];
   string resultHeaders;
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1);
   
   string headers = "Content-Type: application/json\r\n";
   int res = WebRequest("POST", InpServerUrl, headers, 1000, postData, result, resultHeaders);
   if(res == -1)
   {
      int err = GetLastError();
      if(err == 4060)
      {
         Print("WebRequest Error 4060: Please add 'http://localhost:3000' to MT5 Allowed URLs in Tools -> Options -> Expert Advisors -> Allow WebRequest!");
      }
   }
}
