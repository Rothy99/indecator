"""
Indecator Autonomous 1M / 3M High-Speed Scalping Bot
Executes institutional A+ SMC Scalping trades automatically on MetaTrader 5 with 0.01 Lot Size.
"""
import sys
import time
import requests
import MetaTrader5 as mt5

# Ensure UTF-8 output on Windows
if sys.platform == "win32" and hasattr(sys.stdout, 'buffer'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# --- Configuration ---
API_URL = "http://127.0.0.1:3000/api/signal"
SYMBOL = "XAUUSD"                 # Target Symbol (XAUUSD, BTCUSD, ETHUSD, SOLUSD)
TIMEFRAMES = ["1m", "3m"]         # Scalping Timeframes scanned simultaneously
LOT_SIZE = 0.01                   # Fixed Micro-Lot Size: 0.01
TEST_MODE = False                 # False = Live MT5 Real Execution | True = Simulation / Dry Run
MIN_SCORE = 85                    # Minimum SMC Confluence Score (85+ for High Quality A+)
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

def check_and_manage_breakeven(broker_sym):
    positions = mt5.positions_get(symbol=broker_sym)
    if not positions:
        return
    for p in positions:
        if p.magic != MAGIC_NUMBER:
            continue
        tick = mt5.symbol_info_tick(broker_sym)
        if not tick:
            continue
        cur_price = tick.bid if p.type == mt5.POSITION_TYPE_BUY else tick.ask
        digits = mt5.symbol_info(broker_sym).digits if mt5.symbol_info(broker_sym) else 2

        # When price reaches ~45% towards TP, automatically move SL to Breakeven (+0.10 buffer)
        if p.type == mt5.POSITION_TYPE_BUY:
            if p.tp > p.price_open and cur_price >= p.price_open + (p.tp - p.price_open) * 0.45 and p.sl < p.price_open:
                be_sl = round(p.price_open + 0.10, digits)
                req = {
                    "action": mt5.TRADE_ACTION_SLTP,
                    "position": p.ticket,
                    "symbol": broker_sym,
                    "sl": be_sl,
                    "tp": p.tp,
                }
                res = mt5.order_send(req)
                if res.retcode == mt5.TRADE_RETCODE_DONE:
                    print(f"\n[BREAKEVEN] Moved SL to {be_sl} on Ticket #{p.ticket} (Position is now 100% Risk-Free!)")
        elif p.type == mt5.POSITION_TYPE_SELL:
            if p.tp < p.price_open and cur_price <= p.price_open - (p.price_open - p.tp) * 0.45 and (p.sl == 0 or p.sl > p.price_open):
                be_sl = round(p.price_open - 0.10, digits)
                req = {
                    "action": mt5.TRADE_ACTION_SLTP,
                    "position": p.ticket,
                    "symbol": broker_sym,
                    "sl": be_sl,
                    "tp": p.tp,
                }
                res = mt5.order_send(req)
                if res.retcode == mt5.TRADE_RETCODE_DONE:
                    print(f"\n[BREAKEVEN] Moved SL to {be_sl} on Ticket #{p.ticket} (Position is now 100% Risk-Free!)")

def execute_order(broker_sym, direction, entry, sl, tp1, tp2, tf):
    tick = mt5.symbol_info_tick(broker_sym)
    if not tick:
        print(f"[WARN] Cannot get current tick for {broker_sym}")
        return

    info = mt5.symbol_info(broker_sym)
    digits = info.digits if info else 2

    price = tick.ask if direction in ['BUY', 'LONG'] else tick.bid
    order_type = mt5.ORDER_TYPE_BUY if direction in ['BUY', 'LONG'] else mt5.ORDER_TYPE_SELL

    final_tp = tp2 if tp2 > 0 else tp1

    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": broker_sym,
        "volume": float(LOT_SIZE),
        "type": order_type,
        "price": price,
        "sl": round(sl, digits),
        "tp": round(final_tp, digits),
        "deviation": 20,
        "magic": MAGIC_NUMBER,
        "comment": f"Indecator {tf} 0.01",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    if TEST_MODE:
        print(f"\n[SIMULATION] Would execute {direction} {LOT_SIZE} lot on {broker_sym} @ {price} | SL: {sl} | TP1: {tp1} | TP2: {tp2}")
        return

    res = mt5.order_send(request)
    if res.retcode != mt5.TRADE_RETCODE_DONE:
        print(f"\n[ERROR] Order failed: {res.comment} (code {res.retcode})")
    else:
        print(f"\n[MT5 EXECUTED] Ticket #{res.order} {direction} {LOT_SIZE} lots @ {price} | SL: {sl} | TP1: {tp1} | TP2: {tp2}")

def main():
    print("=" * 65)
    print("INDECATOR AUTONOMOUS SCALPER BOT [1M & 3M]")
    print(f"Fixed Lot Size: {LOT_SIZE} Lot | Max Open Trades: 1")
    print(f"Mode: {'SIMULATION / DRY RUN' if TEST_MODE else 'LIVE MT5 REAL EXECUTION'}")
    print("=" * 65)

    if not mt5.initialize():
        print(f"[ERROR] MT5 initialization failed: {mt5.last_error()}")
        return

    acc = mt5.account_info()
    broker_name = acc.company if acc else "Unknown"
    account_login = acc.login if acc else 0
    balance = acc.balance if acc else 0
    equity = acc.equity if acc else 0
    print(f"[OK] Connected to MT5: Broker={broker_name}, Account={account_login}")
    print(f"[OK] Account Balance: ${balance:.2f} | Equity: ${equity:.2f}")

    broker_sym = get_broker_symbol(SYMBOL)
    print(f"[OK] Target Symbol: {SYMBOL} -> Broker Symbol: {broker_sym}")
    print(f"[OK] Monitoring timeframes {TIMEFRAMES} for High-Confidence Setups (Score >= {MIN_SCORE})...\n")

    spot = 0
    while True:
        try:
            # Check running trade for automatic breakeven management
            check_and_manage_breakeven(broker_sym)

            already_open = has_open_position(broker_sym)

            for tf in TIMEFRAMES:
                res = requests.get(f"{API_URL}?symbol={SYMBOL}&timeframe={tf}", timeout=2.0)
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
                    spot = data.get('currentPrice', 0)

                    if is_actionable and score >= MIN_SCORE and direction in ['LONG', 'SHORT', 'BUY', 'SELL']:
                        if not already_open:
                            print(f"\n[TRIGGERED] Grade {grade} ({score}/100) {direction} on {SYMBOL} [{tf}] @ ${entry:.2f}")
                            execute_order(broker_sym, direction, entry, sl, tp1, tp2, tf)
                            break
                        else:
                            pass

            # Heartbeat print
            status_text = "ACTIVE TRADE RUNNING" if already_open else "SCANNING FOR ENTRY"
            print(f"\r[{time.strftime('%H:%M:%S')}] {SYMBOL} [{broker_sym}] Spot: ${spot:.2f} | Lot: {LOT_SIZE} | Status: {status_text}", end="", flush=True)

        except Exception as e:
            pass

        time.sleep(1.2)

if __name__ == "__main__":
    main()
