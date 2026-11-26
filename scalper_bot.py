"""
Indecator Autonomous 1M / 3M High-Speed Scalping Bot
Executes institutional A+ SMC Scalping trades automatically on MetaTrader 5.
"""
import time
import requests
import MetaTrader5 as mt5

# --- Configuration ---
API_URL = "http://127.0.0.1:3000/api/signal"
SYMBOL = "XAUUSD"          # Target Symbol (XAUUSD, BTCUSD, ETHUSD, SOLUSD)
TIMEFRAME = "1m"           # Scalping Timeframe: '1m', '3m', or '5m'
TEST_MODE = False          # False = Live MT5 Order Execution | True = Simulation / Paper Trading
LOT_SIZE = 0.01            # Test Fixed Lot Size (e.g. 0.01)
RISK_PERCENT = 0.5         # Risk % of equity if dynamic sizing enabled
MIN_SCORE = 85             # Minimum SMC Confluence Score (85+ for High Quality A+)
MAGIC_NUMBER = 992601

def get_broker_symbol(target):
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
    return target

def has_open_position(broker_sym):
    positions = mt5.positions_get(symbol=broker_sym)
    if positions:
        for p in positions:
            if p.magic == MAGIC_NUMBER:
                return True
    return False

def execute_order(broker_sym, direction, entry, sl, tp1, tp2):
    tick = mt5.symbol_info_tick(broker_sym)
    if not tick:
        print(f"⚠️ Cannot get current tick for {broker_sym}")
        return

    info = mt5.symbol_info(broker_sym)
    digits = info.digits if info else 2

    price = tick.ask if direction in ['BUY', 'LONG'] else tick.bid
    order_type = mt5.ORDER_TYPE_BUY if direction in ['BUY', 'LONG'] else mt5.ORDER_TYPE_SELL

    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": broker_sym,
        "volume": float(LOT_SIZE),
        "type": order_type,
        "price": price,
        "sl": round(sl, digits),
        "tp": round(tp2 if tp2 > 0 else tp1, digits),
        "deviation": 20,
        "magic": MAGIC_NUMBER,
        "comment": f"Indecator {TIMEFRAME} Scalp",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    if TEST_MODE:
        print(f"🧪 [SIMULATION] Would execute {direction} on {broker_sym} @ {price} | SL: {sl} | TP1: {tp1} | TP2: {tp2}")
        return

    res = mt5.order_send(request)
    if res.retcode != mt5.TRADE_RETCODE_DONE:
        print(f"❌ Order failed: {res.comment} (code {res.retcode})")
    else:
        print(f"✅ [MT5 EXECUTED] Ticket #{res.order} {direction} {LOT_SIZE} lots @ {price} | SL: {sl} | TP1: {tp1} | TP2: {tp2}")

def main():
    print("=" * 60)
    print(f"⚡ INDECATOR AUTONOMOUS SCALPER BOT [{TIMEFRAME.upper()}]")
    print(f"Mode: {'🧪 SIMULATION / DRY RUN' if TEST_MODE else '🚀 LIVE MT5 EXECUTION'}")
    print("=" * 60)

    if not mt5.initialize():
        print(f"❌ MT5 initialization failed: {mt5.last_error()}")
        return

    acc = mt5.account_info()
    broker_name = acc.company if acc else "Unknown"
    account_login = acc.login if acc else 0
    print(f"Connected to MT5: Broker={broker_name}, Account={account_login}")

    broker_sym = get_broker_symbol(SYMBOL)
    print(f"Target Symbol: {SYMBOL} -> Broker Symbol: {broker_sym}")
    print("Scanning for High-Confidence A+ Scalp Setups every 1.5s...\n")

    while True:
        try:
            # Query Indecator Scalper Signal Engine
            res = requests.get(f"{API_URL}?symbol={SYMBOL}&timeframe={TIMEFRAME}", timeout=2.0)
            if res.status_code == 200:
                data = res.json()
                ts = data.get('tradeSetup', {})
                score = data.get('score', 0)
                grade = data.get('setupGrade', '')
                is_actionable = ts.get('isActionable', False)
                direction = ts.get('direction', 'NONE')
                entry = ts.get('entry', 0)
                sl = ts.get('stopLoss', 0)
                tp1 = ts.get('tp1', 0)
                tp2 = ts.get('tp2', 0)

                # Check if position already open
                already_open = has_open_position(broker_sym)

                if is_actionable and score >= MIN_SCORE and direction in ['LONG', 'SHORT', 'BUY', 'SELL']:
                    if not already_open:
                        print(f"\n🎯 [TRIGGERED] Grade {grade} ({score}/100) {direction} on {SYMBOL} [{TIMEFRAME}]")
                        execute_order(broker_sym, direction, entry, sl, tp1, tp2)
                    else:
                        print(f"⏳ Signal active ({direction} @ {entry}), but trade already open. Managing runner...")
                else:
                    # Heartbeat status
                    print(f"\r[{time.strftime('%H:%M:%S')}] {SYMBOL} [{TIMEFRAME}] Spot: ${data.get('currentPrice', 0):.2f} | Score: {score}/100 ({grade}) | State: {data.get('marketRegime', 'SCANNING')}", end="", flush=True)

        except Exception as e:
            pass

        time.sleep(1.5)

if __name__ == "__main__":
    main()
