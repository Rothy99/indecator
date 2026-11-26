import io
import sys
import time
import MetaTrader5 as mt5

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 60)
print("LISTENING FOR ALGO TRADING (GREEN BUTTON)...")
print("=" * 60)

if not mt5.initialize():
    print(f"[ERROR] MT5 Init failed: {mt5.last_error()}")
    sys.exit(1)

symbol = "XAUUSDc"
mt5.symbol_select(symbol, True)

# Wait up to 600 seconds (10 mins) for the user to turn Algo Trading ON
for i in range(600):
    term = mt5.terminal_info()
    if term and term.trade_allowed:
        print("\n>>> ALGO TRADING DETECTED GREEN! EXECUTING TEST ORDER NOW... <<<")
        tick = mt5.symbol_info_tick(symbol)
        price = tick.ask
        sl = round(price - 3.0, 2)
        tp = round(price + 4.5, 2)

        req = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": 0.01,
            "type": mt5.ORDER_TYPE_BUY,
            "price": price,
            "sl": sl,
            "tp": tp,
            "deviation": 20,
            "magic": 992601,
            "comment": "Indecator Test Entry",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        res = mt5.order_send(req)
        if res.retcode == mt5.TRADE_RETCODE_DONE:
            print(f"\nSUCCESS! Test Order Executed! Ticket #{res.order} filled at ${res.price:.2f} on {symbol}!")
            print("Look at the bottom of your MT5 window: the position is OPEN and visible!")
        else:
            print(f"\nOrder failed: {res.comment} (code {res.retcode})")
        mt5.shutdown()
        sys.exit(0)

    time.sleep(1)

print("\nTimed out waiting for Algo Trading button to turn GREEN.")
mt5.shutdown()
