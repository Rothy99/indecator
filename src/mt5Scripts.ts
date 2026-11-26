export const MQL5_EA_SCRIPT = `//+------------------------------------------------------------------+
//|                                              IndecatorBridge.mq5 |
//|                     Copyright 2026, Indecator Institutional SMC  |
//|                 Real-Time Bridge for Gold & Crypto Terminal      |
//+------------------------------------------------------------------+
#property copyright "Indecator SMC Terminal"
#property link      "http://localhost:3000"
#property version   "3.20"
#property strict

input string InpServerUrl    = "http://127.0.0.1:3000/api/mt5/feed"; // Terminal Ingestion URL
input int    InpThrottleMs   = 500;                                   // Minimum Push Interval (ms)
input int    InpBarsToSend   = 60;                                    // Number of Completed Candles

ulong lastPushMs = 0;
bool g_firstPushOk = false;

string GetTfCode(ENUM_TIMEFRAMES tf)
{
   switch(tf)
   {
      case PERIOD_M1:  return "1m";
      case PERIOD_M5:  return "5m";
      case PERIOD_M15: return "15m";
      case PERIOD_M30: return "30m";
      case PERIOD_H1:  return "1h";
      case PERIOD_H4:  return "4h";
      case PERIOD_D1:  return "1d";
      default:         return "15m";
   }
}

int OnInit()
{
   Print("⚡ Indecator MT5 Real-Time Bridge started for ", _Symbol, " [", GetTfCode(_Period), "]");
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   Print("⏹ Indecator MT5 Bridge stopped.");
}

void OnTick()
{
   ulong nowMs = GetTickCount64();
   if(nowMs - lastPushMs < (ulong)InpThrottleMs) return;
   
   PushDataToTerminal();
}

void PushDataToTerminal()
{
   lastPushMs = GetTickCount64();
   
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   string company = AccountInfoString(ACCOUNT_COMPANY);
   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   int copied = CopyRates(_Symbol, _Period, 0, InpBarsToSend, rates);
   if(copied <= 0) return;
   
   if(bid <= 0)
   {
      bid = rates[0].close;
      ask = rates[0].close;
   }
   
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
      company, login, _Symbol, GetTfCode(_Period), bid, ask, (double)spread, (long)TimeCurrent(), candlesJson
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
      PrintFormat("⚠️ WebRequest to %s failed (error %d)", InpServerUrl, err);
      if(err == 4060)
      {
         Print("⚠️ WebRequest Error 4060: Please add 'http://127.0.0.1:3000' and 'http://localhost:3000' to MT5 Allowed URLs: Tools -> Options -> Expert Advisors -> Allow WebRequest!");
      }
   }
   else if(!g_firstPushOk)
   {
      g_firstPushOk = true;
      PrintFormat("✅ Indecator Bridge: Connected & streaming %s to %s!", _Symbol, InpServerUrl);
   }
}
`;

export const PYTHON_MT5_SCRIPT = `"""
Indecator MT5 Real-Time Python Bridge
Connects to live MetaTrader 5 on Windows and streams real-time ticks & candles (M15, M5, H1) to Indecator Terminal.
Requirement: pip install MetaTrader5 requests
"""
import time
import requests
import MetaTrader5 as mt5

TERMINAL_URL = "http://localhost:3000/api/mt5/feed"
TARGET_SYMBOLS = ["XAUUSD", "BTCUSD", "ETHUSD", "SOLUSD"]

def resolve_broker_symbol(target):
    info = mt5.symbol_info(target)
    if info:
        mt5.symbol_select(target, True)
        return target
    all_syms = mt5.symbols_get()
    if all_syms:
        for s in all_syms:
            name = s.name.upper()
            if target == "XAUUSD" and ("XAU" in name or "GOLD" in name):
                mt5.symbol_select(s.name, True)
                return s.name
            if target == "BTCUSD" and "BTC" in name and "USD" in name:
                mt5.symbol_select(s.name, True)
                return s.name
            if target == "ETHUSD" and "ETH" in name and "USD" in name:
                mt5.symbol_select(s.name, True)
                return s.name
            if target == "SOLUSD" and "SOL" in name and "USD" in name:
                mt5.symbol_select(s.name, True)
                return s.name
    return None

def fetch_candles(sym, mt5_tf, count=60):
    rates = mt5.copy_rates_from_pos(sym, mt5_tf, 0, count)
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
    return candles

def run_bridge():
    print("Connecting to MetaTrader 5...")
    if not mt5.initialize():
        print(f"❌ Failed to initialize MT5: {mt5.last_error()}")
        print("💡 Ensure MetaTrader 5 is running and logged in.")
        return

    account_info = mt5.account_info()
    broker = account_info.company if account_info else "MetaTrader 5"
    account = account_info.login if account_info else 0
    print(f"⚡ MT5 Connected: Broker={broker}, Account={account}")
    print(f"🚀 Streaming real-time data to {TERMINAL_URL}...")

    symbol_map = {}
    for tgt in TARGET_SYMBOLS:
        mapped = resolve_broker_symbol(tgt)
        if mapped:
            symbol_map[tgt] = mapped
            print(f"  ✓ {tgt} mapped to broker symbol '{mapped}'")
        else:
            print(f"  ⚠️ {tgt} not found in broker market watch")

    last_candle_push = 0

    while True:
        now = time.time()
        push_candles = (now - last_candle_push) >= 2.0

        for tgt, broker_sym in symbol_map.items():
            tick = mt5.symbol_info_tick(broker_sym)
            if tick is None or tick.bid <= 0:
                continue

            payload = {
                "broker": broker,
                "account": account,
                "symbol": tgt,
                "timeframe": "15m",
                "bid": tick.bid,
                "ask": tick.ask,
                "spread": round((tick.ask - tick.bid) * (10 if "XAU" in tgt else 1), 1),
                "timestamp": int(now * 1000)
            }

            if push_candles:
                candles_15m = fetch_candles(broker_sym, mt5.TIMEFRAME_M15, 60)
                if candles_15m:
                    payload["candles"] = candles_15m

                candles_5m = fetch_candles(broker_sym, mt5.TIMEFRAME_M5, 60)
                if candles_5m:
                    try:
                        requests.post(TERMINAL_URL, json={
                            "broker": broker,
                            "account": account,
                            "symbol": tgt,
                            "timeframe": "5m",
                            "bid": tick.bid,
                            "ask": tick.ask,
                            "spread": payload["spread"],
                            "timestamp": int(now * 1000),
                            "candles": candles_5m
                        }, timeout=0.8)
                    except Exception:
                        pass

            try:
                requests.post(TERMINAL_URL, json=payload, timeout=0.8)
            except Exception:
                pass

        if push_candles:
            last_candle_push = now

        time.sleep(0.3)

if __name__ == "__main__":
    run_bridge()
`;
