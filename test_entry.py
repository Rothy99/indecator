import io
import sys
import MetaTrader5 as mt5

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 60)
print("TEST ENTRY: LIVE 0.01 LOT SCALP ON XAUUSDc")
print("=" * 60)

if not mt5.initialize():
    print(f"[ERROR] MT5 Init failed: {mt5.last_error()}")
    sys.exit(1)

term = mt5.terminal_info()
if not term.trade_allowed:
    print("\n[ACTION REQUIRED IN MT5]")
    print("MT5 Algo Trading is currently DISABLED (Red icon on top toolbar).")
    print("👉 Please click 'Algo Trading' on the MT5 top toolbar (or press Ctrl + E) to turn it GREEN!")
    print("Then run this command again.\n")
    mt5.shutdown()
    sys.exit(1)

symbol = "XAUUSDc"
mt5.symbol_select(symbol, True)
tick = mt5.symbol_info_tick(symbol)
if not tick:
    print(f"[ERROR] Cannot get price for {symbol}")
    mt5.shutdown()
    sys.exit(1)

price = tick.ask
sl = round(price - 3.0, 2)   # $3.00 stop loss for 1m scalp
tp1 = round(price + 4.5, 2)  # $4.50 take profit for 1m scalp

request = {
    "action": mt5.TRADE_ACTION_DEAL,
    "symbol": symbol,
    "volume": 0.01,
    "type": mt5.ORDER_TYPE_BUY,
    "price": price,
    "sl": sl,
    "tp": tp1,
    "deviation": 20,
    "magic": 992601,
    "comment": "Indecator Scalp Test",
    "type_time": mt5.ORDER_TIME_GTC,
    "type_filling": mt5.ORDER_FILLING_IOC,
}

print(f"[SENDING ORDER] BUY 0.01 {symbol} @ ${price:.2f} | SL: ${sl:.2f} | TP: ${tp1:.2f}...")
res = mt5.order_send(request)

if res.retcode == mt5.TRADE_RETCODE_DONE:
    print(f"\n✅ [SUCCESS] Order Executed! Ticket #{res.order} filled at ${res.price:.2f}!")
    print(f"Check your MT5 terminal: you will see the open position at the bottom under 'Trade' tab.")
else:
    print(f"\n❌ [FAILED] Code: {res.retcode} | {res.comment}")

mt5.shutdown()
