import io
import sys
import time
import MetaTrader5 as mt5

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 60)
print("ACTIVE BREAKEVEN WATCHER: WAITING FOR GREEN ALGO BUTTON")
print("=" * 60)

if not mt5.initialize():
    sys.exit(1)

for i in range(120):
    term = mt5.terminal_info()
    if term and term.trade_allowed:
        positions = mt5.positions_get(symbol="XAUUSDc")
        if positions:
            for p in positions:
                if p.ticket == 4548799447 or (p.price_current >= p.price_open + 0.50 and p.sl < p.price_open + 0.05):
                    be_sl = round(p.price_open + 0.10, 3)
                    req = {
                        "action": mt5.TRADE_ACTION_SLTP,
                        "position": p.ticket,
                        "symbol": "XAUUSDc",
                        "sl": be_sl,
                        "tp": p.tp,
                    }
                    res = mt5.order_send(req)
                    if res.retcode == mt5.TRADE_RETCODE_DONE:
                        print(f"\n✅ SUCCESS! Ticket #{p.ticket} Stop Loss moved to {be_sl} (Secured +$0.10 Profit)!")
        mt5.shutdown()
        sys.exit(0)
    time.sleep(1)

mt5.shutdown()
