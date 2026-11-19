"""
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
