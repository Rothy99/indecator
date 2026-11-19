export const MQL5_EA_SCRIPT = `//+------------------------------------------------------------------+
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
      string cStr = StringFormat("{\\"time\\":%d,\\"open\\":%.2f,\\"high\\":%.2f,\\"low\\":%.2f,\\"close\\":%.2f,\\"volume\\":%d}",
         (long)rates[i].time, rates[i].open, rates[i].high, rates[i].low, rates[i].close, (long)rates[i].tick_volume);
      candlesJson += cStr;
      if(i > 0) candlesJson += ",";
   }
   candlesJson += "]";
   
   string payload = StringFormat(
      "{\\"broker\\":\\"%s\\",\\"account\\":%d,\\"symbol\\":\\"%s\\",\\"timeframe\\":\\"%s\\",\\"bid\\":%.2f,\\"ask\\":%.2f,\\"spread\\":%.1f,\\"timestamp\\":%d,\\"candles\\":%s}",
      company, login, _Symbol, EnumToString(_Period), bid, ask, (double)spread, (long)TimeCurrent(), candlesJson
   );
   
   char postData[];
   char result[];
   string resultHeaders;
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1);
   
   string headers = "Content-Type: application/json\\r\\n";
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
`;

export const PYTHON_MT5_SCRIPT = `"""
Indecator MT5 Real-Time Python Bridge
Connects to live MetaTrader 5 on Windows and streams real-time ticks & M15 candles to Indecator Terminal.
Requirement: pip install MetaTrader5 requests
"""
import time
import requests
import MetaTrader5 as mt5

TERMINAL_URL = "http://localhost:3000/api/mt5/feed"
SYMBOLS = ["XAUUSD", "BTCUSD", "ETHUSD", "SOLUSD"]

def run_bridge():
    if not mt5.initialize():
        print(f"❌ Failed to initialize MT5: {mt5.last_error()}")
        return

    account_info = mt5.account_info()
    broker = account_info.company if account_info else "MetaTrader 5"
    account = account_info.login if account_info else 0
    print(f"⚡ MT5 Connected: Broker={broker}, Account={account}")
    print(f"🚀 Streaming real-time data to {TERMINAL_URL}...")

    while True:
        for sym in SYMBOLS:
            tick = mt5.symbol_info_tick(sym)
            if tick is None:
                continue
            
            # Fetch last 60 candles on M15
            rates = mt5.copy_rates_from_pos(sym, mt5.TIMEFRAME_M15, 0, 60)
            candles = []
            if rates is not None:
                for r in rates:
                    candles.append({
                        "time": int(r['time']),
                        "open": float(r['open']),
                        "high": float(r['high']),
                        "low": float(r['low']),
                        "close": float(r['close']),
                        "volume": int(r['tick_volume'])
                    })

            payload = {
                "broker": broker,
                "account": account,
                "symbol": sym,
                "timeframe": "15m",
                "bid": tick.bid,
                "ask": tick.ask,
                "spread": (tick.ask - tick.bid) * (10 if "XAU" in sym else 1),
                "timestamp": int(time.time()),
                "candles": candles
            }

            try:
                requests.post(TERMINAL_URL, json=payload, timeout=1.5)
            except Exception:
                pass

        time.sleep(1.0)

if __name__ == "__main__":
    run_bridge()
`;
