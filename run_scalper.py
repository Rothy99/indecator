import os
import sys
import time
import subprocess
import psutil

if sys.platform == "win32":
    import io
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 65)
print("  🚀 INDECATOR AUTONOMOUS GOLD SCALPER — 1-CLICK LAUNCHER")
print("=" * 65)

# 1. Ensure MT5 is running
def is_mt5_running():
    for p in psutil.process_iter(['name']):
        if p.info['name'] and 'terminal64' in p.info['name'].lower():
            return True
    return False

if not is_mt5_running():
    print("[1/3] Starting MetaTrader 5 Terminal...")
    subprocess.run(['wmic', 'process', 'call', 'create', r'C:\Program Files\MetaTrader 5\terminal64.exe'], capture_output=True)
    time.sleep(4)
else:
    print("[1/3] MetaTrader 5 Terminal is already running.")

# 2. Check & Enable Algo Trading
import MetaTrader5 as mt5

if not mt5.initialize():
    print("[ERROR] Could not connect to MetaTrader 5 IPC!")
    input("\nPress Enter to exit...")
    sys.exit(1)

term = mt5.terminal_info()
if not term.trade_allowed:
    print("[2/3] Enabling Algo Trading (Ctrl + E)...")
    subprocess.run(['schtasks', '/run', '/tn', 'ToggleTrade'], capture_output=True)
    time.sleep(2)

term = mt5.terminal_info()
algo_status = "ENABLED (GREEN)" if term.trade_allowed else "DISABLED (PRESS CTRL+E IN MT5)"
print(f"[2/3] Algo Trading Status: {algo_status}")

acc = mt5.account_info()
print(f"[3/3] Account: {acc.login} | Balance: ${acc.balance:.2f} | Broker: {acc.company}")
print("=" * 65)
print("  ⚡ SCALPER IS ACTIVE: Scanning 1M Gold (XAUUSDc)...")
print("  🎯 Strategy: 1:2 R:R | Continuous Dynamic Trailing Ratchet")
print("  🔒 Rules: Spacing >= $0.80 | Max 5 Entries | 65%+ Confidence")
print("=" * 65)
print("\n[NOTE] Keep this window open while trading. Press Ctrl+C to stop.\n")

# Run the scalper loop
try:
    from scalper_bot import main as run_bot
    run_bot()
except KeyboardInterrupt:
    print("\n\n[INFO] Scalper paused by user. Existing SL/TP levels remain protected on broker.")
    mt5.shutdown()
