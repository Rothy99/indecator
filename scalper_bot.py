import os
import sys
import time
import requests
import io
import MetaTrader5 as mt5

# Fix console encoding on Windows to support emojis and symbols
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# --- Configuration ---
API_URL = "http://127.0.0.1:3000/api/scalp"
SYMBOL = "XAUUSD"                 # Strictly Gold (XAUUSD -> XAUUSDc)
TIMEFRAMES = ["1m"]               # 1-Minute Quick Trade Focus
LOT_SIZE = 0.01                   # Fixed Micro-Lot: 0.01
MAX_OPEN_TRADES = 5               # Up to 5 Concurrent Entries
MIN_SPACING = 0.35                # Minimum $0.35 spacing between entries
ENTRY_COOLDOWN = 12               # Smooth 12s interval between scale-in entries
BE_PROFIT_TRIGGER = 0.10          # Fast BE Trigger: +$0.10 profit moves SL to +$0.05
BE_BUFFER = 0.05                  # Guaranteed Profit locked in (+5 cents)
TEST_MODE = False                 # Live MT5 Real Execution
MIN_SCORE = 50                    # Minimum Quality Score
if "--min-score" in sys.argv:
    try:
        MIN_SCORE = int(sys.argv[sys.argv.index("--min-score") + 1])
    except Exception:
        pass
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
    return target

def get_open_positions(broker_sym):
    positions = mt5.positions_get(symbol=broker_sym)
    if not positions:
        return []
    return [p for p in positions if p.magic == MAGIC_NUMBER]

def check_and_manage_breakeven(broker_sym):
    active_positions = get_open_positions(broker_sym)
    if not active_positions:
        return
    tick = mt5.symbol_info_tick(broker_sym)
    if not tick:
        return
    digits = mt5.symbol_info(broker_sym).digits if mt5.symbol_info(broker_sym) else 2

    for p in active_positions:
        cur_price = tick.bid if p.type == mt5.POSITION_TYPE_BUY else tick.ask
        target_sl = None

        if p.type == mt5.POSITION_TYPE_BUY:
            gain = cur_price - p.price_open
            if gain >= 0.50:
                target_sl = round(p.price_open + 0.20, digits)
            elif gain >= 0.15:
                target_sl = round(p.price_open + 0.10, digits)
            elif gain >= 0.10:
                target_sl = round(p.price_open + 0.05, digits)

            if target_sl and target_sl > p.sl + 0.005:
                req = {
                    "action": mt5.TRADE_ACTION_SLTP,
                    "position": p.ticket,
                    "symbol": broker_sym,
                    "sl": target_sl,
                    "tp": p.tp,
                }
                res = mt5.order_send(req)
                if res.retcode == mt5.TRADE_RETCODE_DONE:
                    print(f"\n[TIER-BE] BUY #{p.ticket} Gain: +${gain:.2f} -> SL moved to {target_sl} (+${target_sl - p.price_open:.2f} locked)")

        elif p.type == mt5.POSITION_TYPE_SELL:
            gain = p.price_open - cur_price
            if gain >= 0.50:
                target_sl = round(p.price_open - 0.20, digits)
            elif gain >= 0.15:
                target_sl = round(p.price_open - 0.10, digits)
            elif gain >= 0.10:
                target_sl = round(p.price_open - 0.05, digits)

            if target_sl and (p.sl == 0 or target_sl < p.sl - 0.005):
                req = {
                    "action": mt5.TRADE_ACTION_SLTP,
                    "position": p.ticket,
                    "symbol": broker_sym,
                    "sl": target_sl,
                    "tp": p.tp,
                }
                res = mt5.order_send(req)
                if res.retcode == mt5.TRADE_RETCODE_DONE:
                    print(f"\n[TIER-BE] SELL #{p.ticket} Gain: +${gain:.2f} -> SL moved to {target_sl} (+${p.price_open - target_sl:.2f} locked)")

def is_far_enough_from_existing(price, active_positions, min_spacing):
    for p in active_positions:
        if abs(price - p.price_open) < min_spacing:
            return False
    return True

def execute_order(broker_sym, direction, entry, sl, tp1, tp2, tf, order_idx):
    tick = mt5.symbol_info_tick(broker_sym)
    if not tick:
        return

    term = mt5.terminal_info()
    if not term.trade_allowed:
        return False

    info = mt5.symbol_info(broker_sym)
    digits = info.digits if info else 2

    is_buy = direction in ['BUY', 'LONG']
    price = tick.ask if is_buy else tick.bid
    order_type = mt5.ORDER_TYPE_BUY if is_buy else mt5.ORDER_TYPE_SELL
    final_tp = tp2 if tp2 > 0 else tp1

    # Safety checks
    if is_buy and sl >= price:
        sl = price - 2.50
    elif not is_buy and sl <= price:
        sl = price + 2.50

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
        "comment": f"Indecator Scalp #{order_idx}",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    res = mt5.order_send(request)
    if res.retcode == mt5.TRADE_RETCODE_DONE:
        print(f"\n[SUCCESS] Scalp #{order_idx}/5 Executed: Ticket #{res.order} @ ${res.price:.2f} | SL: ${sl:.2f} | TP: ${final_tp:.2f}")
        return True
    elif res.retcode != 10027:
        print(f"\n[ERROR] Order failed: {res.comment} (code {res.retcode})")
    return False

def main():
    print("=" * 65)
    print("INDECATOR 1-MINUTE QUICK SCALPER (SMOOTH 5-ENTRY SCALING)")
    print(f"Lot Size: {LOT_SIZE} | Max Open Trades: {MAX_OPEN_TRADES} | BE: +${BE_PROFIT_TRIGGER:.2f}")
    print("=" * 65)

    if not mt5.initialize():
        print(f"[ERROR] MT5 initialization failed: {mt5.last_error()}")
        return

    acc = mt5.account_info()
    print(f"[OK] Connected: Broker={acc.company}, Account={acc.login}, Balance=${acc.balance:.2f}")
    broker_sym = get_broker_symbol(SYMBOL)
    print(f"[OK] Target: {SYMBOL} -> Broker: {broker_sym}")
    print(f"[OK] Quick Scalper Primed | 1m Timeframe | Max {MAX_OPEN_TRADES} Entries\n")

    spot = 0
    last_signal_time = 0

    while True:
        try:
            # 1. Manage Breakeven on ALL active positions
            check_and_manage_breakeven(broker_sym)

            # 2. Check current open positions
            active_positions = get_open_positions(broker_sym)
            open_count = len(active_positions)
            total_pnl = sum(p.profit for p in active_positions)

            term = mt5.terminal_info()
            algo_status = "ALGO ON" if term.trade_allowed else "PAUSED (PRESS CTRL+E IN MT5)"

            if open_count > 0:
                pos_status = f"{open_count}/5 POSITIONS OPEN | PnL: ${total_pnl:+.2f} | [{algo_status}]"
            else:
                pos_status = f"0/5 OPEN (SCANNING 1M) | [{algo_status}]"

            # 3. If fewer than 5 entries and Algo Trading is enabled, check 1m signal
            now = time.time()
            cooldown_remaining = max(0, int(ENTRY_COOLDOWN - (now - last_signal_time)))

            if open_count < MAX_OPEN_TRADES and term.trade_allowed and cooldown_remaining == 0:
                res = requests.get(f"{API_URL}?symbol={SYMBOL}&tf=1m", timeout=2.0)
                if res.status_code == 200:
                    data = res.json()
                    score = data.get('score', 0)
                    is_actionable = data.get('isActionable', False)
                    timing_state = data.get('timingState', 'WAIT')
                    direction = data.get('direction', 'NONE')
                    entry = data.get('entry', 0)
                    sl = data.get('stopLoss', 0)
                    tp1 = data.get('tp1', 0)
                    tp2 = data.get('tp2', 0)
                    spot = data.get('currentPrice', spot)

                    can_enter = (is_actionable or timing_state in ['ENTER_NOW', 'ZONE_ENTRY', 'TRIGGERED_ZONE', 'WAIT_CONFIRMATION'])
                    if can_enter and score >= MIN_SCORE and direction in ['LONG', 'SHORT', 'BUY', 'SELL']:
                        # Verify price spacing from existing trades
                        if is_far_enough_from_existing(spot, active_positions, MIN_SPACING):
                            success = execute_order(broker_sym, direction, entry, sl, tp1, tp2, "1m", open_count + 1)
                            if success:
                                last_signal_time = now

            # Heartbeat print
            print(f"\r[{time.strftime('%H:%M:%S')}] {broker_sym} ${spot:.2f} | {pos_status}   ", end="", flush=True)

        except Exception as e:
            pass

        time.sleep(1.0)

if __name__ == "__main__":
    main()
