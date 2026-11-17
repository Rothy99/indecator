# Indecator — Project Context & Architecture Reference

> **Multi-Asset (Gold & Crypto) 4-Confluence Institutional Trading Terminal & Signal Engine**  
> Built with **Hono**, **TypeScript**, **Node.js**, and **Cloudflare D1 SQLite**.

---

## 1. Project Overview

Indecator is a low-latency, institutional-grade market analysis dashboard and automated trade signal terminal engineered for **Gold (XAU/USD)**, **Bitcoin (BTC/USD)**, **Ethereum (ETH/USD)**, and **Solana (SOL/USD)**.

It pairs strict **ICT (Inner Circle Trader) Smart Money Concepts** (Liquidity Sweeps, Market Structure Shifts, Fair Value Gaps) with quantitative indicators (50/200 EMA trend regime, ATR volatility bands, RSI, MACD) across 6 simultaneous timeframes (`1m`, `5m`, `15m`, `30m`, `1h`, `4h`).

---

## 2. Technical Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | [Hono v4](https://hono.dev/) with `@hono/node-server` and native fetch standards |
| **Language & Runtime** | TypeScript 5.7+ running on Node.js 22+ (with native `node:sqlite` DatabaseSync) |
| **Database** | Cloudflare D1 Local SQLite (`data/d1_local.sqlite`) in WAL mode with fallback to Cloudflare D1 REST API |
| **Real-Time Streaming** | Server-Sent Events (SSE) `/api/stream` + simulated live tick generator |
| **Charting Engine** | Lightweight Charts v4.2+ (Canvas-rendered candlestick, volume & dynamic SL/TP overlays) |
| **Styling & UI** | Tailwind CSS CDN with dark institutional terminal aesthetic |
| **Audio Synthesizer** | Native Web Audio API procedural chime synthesizer (Sine chime, Triangle win, Sawtooth SL) |

---

## 3. Database & Persistence Layer (`src/d1Database.ts`)

The database architecture operates in a **LOCAL_FIRST** mode, persisting trade entries to disk even without Cloudflare credentials.

### Database Location & Files
- Primary SQLite File: `data/d1_local.sqlite`
- Write-Ahead Log: `data/d1_local.sqlite-wal`
- Shared Memory: `data/d1_local.sqlite-shm`
- Cloudflare D1 UUID: `d59c377c-934d-43b9-b00a-dee0c947be28`

### SQLite Schema (`trade_entries`)
```sql
CREATE TABLE IF NOT EXISTS trade_entries (
  id TEXT PRIMARY KEY,
  timeframe TEXT NOT NULL,
  time INTEGER NOT NULL,
  type TEXT NOT NULL,                -- 'BUY' | 'SELL'
  grade TEXT NOT NULL,               -- 'A+' | 'A' | 'B' | 'C'
  probability INTEGER NOT NULL,      -- 0 to 100%
  confidence INTEGER NOT NULL,       -- 0 to 100%
  entry REAL NOT NULL,               -- Locked entry price
  stop_loss REAL NOT NULL,           -- Hard SL (1.5x ATR beyond sweep wick)
  tp1 REAL NOT NULL,                 -- 1:2 Take Profit target
  tp2 REAL NOT NULL,                 -- 1:3+ Liquidity Runner target
  be_trigger REAL NOT NULL,          -- Price level that triggers move to BE
  hit_be_lock INTEGER DEFAULT 0,     -- 1 = SL moved to BE
  hit_tp1 INTEGER DEFAULT 0,         -- 1 = TP1 achieved
  hit_tp2 INTEGER DEFAULT 0,         -- 1 = TP2 achieved
  hit_sl INTEGER DEFAULT 0,          -- 1 = SL hit
  outcome TEXT DEFAULT 'ACTIVE',     -- 'ACTIVE' | 'TP1_HIT' | 'TP2_HIT' | 'BE_EXIT' | 'SL_HIT'
  pnl_dollars_per_oz REAL DEFAULT 0, -- Net P&L in USD/oz or points
  reason TEXT,                       -- Confluence justification
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trade_tf_time ON trade_entries(timeframe, time DESC);
CREATE INDEX IF NOT EXISTS idx_trade_outcome ON trade_entries(outcome);
```

### Immutable Entry Locking Rule
Once a signal activates on any timeframe:
1. Entry price, hard stop loss, TP1, and TP2 are **immutable**.
2. Live market price updates simulate real order lifecycle:
   - When price reaches TP1: **50% position is closed at 1:2 RR** and Stop Loss is automatically moved to **Breakeven (BE)**.
   - If price reverses to entry: position exits as **`BE_EXIT` (+$0.00)**.
   - If price continues to TP2: remainder exits as **`TP2_HIT` (1:3+ RR)**.
   - If price reaches Hard SL: exits as **`SL_HIT` (-1.0R)**.
3. Every state transition updates `data/d1_local.sqlite` idempotently via `INSERT ... ON CONFLICT(id) DO UPDATE`.

---

## 4. Signal Generation & 4-Confluence Strategy V3.0 (`src/indicators.ts`)

Indecator operates on the **4-Confluence Strategy V3.0 — Low-Risk XAU/USD & Crypto**, transitioning the engine to a capital-preservation-first trading system with a strict 90/100 A+ setup filter and separate configurations for Gold and Crypto.

### Core Principles
- **Capital Preservation First**: Fewer trades, smaller risk, stronger confirmation, zero chasing, zero revenge trading.
- **4/4 Mandatory Confluences**: All 4 foundational conditions must pass independently; any missing confluence results in automatic disqualification (`DISQUALIFIED / STAND ASIDE`), regardless of numerical score.
- **90/100 Setup Quality Score**: An institutional scoring system requiring 90/100 points for an A+ grade. *(Note: 90+ quality score denotes high structural alignment, not a guaranteed 90% win rate).*
- **0.25% Max Initial Risk**: Maximum account risk of 0.25% per trade ($25 on a $10,000 equity base).
- **Strict Money Management**:
  - Max 0.50% combined open risk across all markets.
  - Max 0.50% daily loss limit (stops trading after 2 consecutive losses per day).
  - Max 1.50% weekly loss limit.
  - Maximum 2 new entries per day across all instruments.
  - Exactly 1 open trade per instrument.
  - Strict circuit breaker at 3.0% monthly drawdown.

### The Four Mandatory Conditions
1. **Liquidity Sweep**:
   - SELL: Price sweeps a predefined high (PDH, Asian High, or H1/H4 swing high), and an M15 candle closes back below that level. Breakouts holding above are rejected.
   - BUY: Price sweeps a predefined low (PDL, Asian Low, or H1/H4 swing low), and an M15 candle closes back above that level. Breakdowns holding below are rejected.
   - Levels must be identifiable prior to the sweep.
2. **Market Structure Shift (MSS) & Displacement**:
   - Requires confirmed candle-body close beyond the internal swing point (wick-only breaks rejected).
   - Displacement candle body must measure $\ge 1.0\times\text{ATR}(14)$ with close in the outer 25% of range.
3. **Fair Value Gap (FVG)**:
   - Fresh, unfilled imbalance created by the MSS displacement candle.
   - Entry placed at Consequent Encroachment (CE 50% midpoint).
   - Order expires after 4 completed M15 candles if unfilled.
4. **EMA 50 / 200 Regime Filter**:
   - Standardized on H1: BUY requires H1 price > EMA 50 > EMA 200 with EMA 50 rising. SELL requires H1 price < EMA 50 < EMA 200 with EMA 50 falling.
   - H4 trend confirmation required for top A+ tiering.

### 7-Pillar 100-Point Quality Matrix
| Pillar | Focus | Max Points |
| :--- | :--- | :--- |
| **1. Liquidity Sweep Quality** | Clear prior level, false breakout wick rejection | 20 pts |
| **2. MSS & Displacement Quality** | Full body candle close > 1.0–1.2x ATR | 25 pts |
| **3. FVG Quality** | Fresh imbalance, CE 50% retest, 4-bar expiry | 20 pts |
| **4. EMA 50/200 Alignment** | H1 regime alignment & rising/falling slope | 15 pts |
| **5. H4 Trend Confirmation** | Higher-timeframe macro order flow support | 10 pts |
| **6. Session & News Filter** | London/NY killzone, 30m news blackouts | 5 pts |
| **7. Execution Quality** | Spread tolerance, slip buffer & cost model | 5 pts |

- **Grade A+ (90–100 pts)**: Eligible for execution after validation.
- **Grade A (80–89 pts)**: Demo only.
- **Grade B (65–79 pts) / C (<65 pts)**: Stand aside, no trade.

### Take-Profit & Stop-Loss Architecture
- **Structural Stop-Loss**: Located beyond the sweep extreme + **0.2x ATR buffer** (never widened).
- **TP1 (+1.5R)**: Close 50% position and immediately adjust Stop-Loss to Breakeven (BE).
- **TP2 (+2.5R)**: Close remaining 50% at opposing liquidity runner.
- **Gross Expectancy**: $0.5 \times 1.5\text{R} + 0.5 \times 2.5\text{R} = \mathbf{+2.0R}$ net gain when both targets execute.

### Instrument Separation
- **Gold (XAU/USD)**: London (07:00–10:00 UTC) & New York (12:00–15:00 UTC) killzones; Asian session (00:00–08:00 UTC) range reference; 30m high-impact US news exclusion; lot sizing based on 100 oz contracts.
- **Crypto (BTC/ETH)**: 24/7 continuous trading; Previous UTC Day (00:00 UTC) high/low; US macro news event blackouts; spot or 1x isolated sizing.

---

## 5. API Endpoints Reference (`src/index.ts`)

| Route | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Main interactive institutional dashboard HTML terminal |
| `/api/scan` | `GET` | Complete multi-asset, multi-timeframe analysis payload (`?symbol=XAUUSD&timeframe=15m`) |
| `/api/history` | `GET` | D1 database historical query (`?timeframe=ALL&outcome=ALL&grade=ALL&limit=100`) |
| `/api/stream` | `GET` | Server-Sent Events (SSE) live tick data stream (1–2s tick frequency) |
| `/api/database` | `GET` | Raw inspection of all active and closed trade entries |
| `/api/database/status` | `GET` | Health check for Cloudflare D1 local SQLite and Cloudflare API credentials |

### `/api/history` Query Response Format:
```json
{
  "trades": [
    {
      "tradeNumber": 1,
      "time": 1731639900,
      "dateIso": "2024-11-15T02:45:00.000Z",
      "timeframe": "15m",
      "direction": "SELL",
      "score": 92,
      "grade": "A+",
      "entryPrice": 2684.50,
      "stopLoss": 2688.20,
      "tp1": 2677.10,
      "tp2": 2669.70,
      "outcome": "TP2_HIT",
      "achievedRr": "1:3.0+",
      "pnlDollars": 14.80,
      "pips": 148,
      "reason": "15m BEARISH SWEEP + FVG TAP"
    }
  ],
  "stats": {
    "totalTrades": 2304,
    "wins": 1243,
    "losses": 528,
    "beExits": 532,
    "winRate": 54.0,
    "totalNetPnl": 415539.81,
    "profitFactor": 14.19,
    "avgRr": "1:1.8"
  },
  "source": "d1_sqlite"
}
```

---

## 6. Frontend Dashboard Architecture (`src/dashboardHtml.ts`)

The single-page terminal UI is divided into modular functional components:

### A. Panoramic Top Bar & Symbol Switcher
- Live asset toggle buttons: **🪙 Gold (XAU/USD)**, **⚡ Bitcoin (BTC/USD)**, **🔷 Ethereum (ETH/USD)**, **🟣 Solana (SOL/USD)**.
- System metrics: Spread display, ATR, Current Price, Active Session (London / New York / Asian).
- Sound toggle: Web Audio API chime generator for win/loss alerts.

### B. High-Timeframe Context Bar
- Panoramic overview of Daily/H4 bias, Asian High/Low sweep status, and HTF order flow.
- Collapsible 4-Confluence Checklist drawer.

### C. Live Interactive Charting
- TradingView Lightweight Charts with candlestick data.
- Horizontal overlays for Hard SL (rose), TP1 (emerald), TP2 (bright green), and Breakeven trigger (amber).

### D. Multi-Timeframe Hub Tabs
1. **`📊 Multi-TF Table`**: Matrix alignment across all 6 timeframes with live P&L, structure, and 1-click order copying.
2. **`🔲 6-TF Grid`**: Card grid layout showing each timeframe's current signal, grade, and setup.
3. **`⭐ 85%+ Setups`**: Collapsible accordion view isolating only A/A+ institutional setups.
4. **`🌊 Trade Entry Flow`**: Visual 4-stage lifecycle pipeline (Sweep ➔ MSS Displacement ➔ CE 50% Entry ➔ TP1 +1.5R & BE Lock ➔ TP2 +2.5R Runner) with real-time progression tracker, live SSE tick updates, status filtering, and dual Flow/Table toggle.
5. **`📘 D1 Trade History`**: Full performance journal queried from D1 SQLite with:
   - Analytical stats strip (Win Rate, Total Net P&L, Profit Factor, Avg R:R, Total Records).
   - Timeframe filter chips (`ALL`, `M1`, `M5`, `M15`, `M30`, `H1`, `H4`).
   - Outcome filter chips (`ALL`, `WINS`, `TP2`, `TP1`, `BE`, `SL`).
   - Grade filter (`ALL`, `⭐ 90%+ ONLY`).
   - Live search input + row selector (`50`, `100`, `250`, `500`).
   - `📥 Export CSV` (instant `.csv` download).
   - `📋 Copy Summary` (formatted text performance summary).
6. **`⚡ Blotter Feed`**: Real-time terminal log feed showing tick events, fills, and price updates.

---

## 7. Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `1` – `6` | Switch timeframe (`1` = 1m, `2` = 5m, `3` = 15m, `4` = 30m, `5` = 1h, `6` = 4h) |
| `C` | Copy full trade order setup to clipboard |
| `F` | Reset chart zoom / fit content |
| `L` | Toggle chart price lines (SL, TP1, TP2, PDH, PDL) |
| `T` | Cycle through MTF view tabs |
| `M` | Toggle audio chime alerts (Mute / Sound ON) |
| `?` or `Shift + /` | Open Keyboard Shortcuts modal |
| `ESC` | Close modal / collapse drawer |

---

## 8. Telegram Channel Broadcast Hub (`src/telegram.ts`)

Indecator features an automated and on-demand Telegram notification bridge tailored specifically for streaming **4-Confluence V3.0 High-Confidence Setups (`Grade A+`, Score ≥ 90/100, 4/4 mandatory confluences passed)** and trade lifecycle milestone notifications.

### Capabilities & Architecture
- **Automated Broadcast**: When the scanner detects a new actionable trade setup meeting the A+ criteria ($\ge 90$ points, 4/4 mandatory confluences passed), an institutional HTML signal card is broadcast directly to the configured Telegram channel.
- **Milestone Broadcast**: Real-time push alerts when trades reach key execution stages:
  - `TP1 (+1.5R) Hit`: 50% partial profit trimmed, Stop Loss moved to Breakeven (`BE`).
  - `TP2 (+2.5R Runner) Hit`: 100% full liquidity target reached.
- **In-Memory Deduplication**: Uses a cache key `${symbol}:${timeframe}:${signalTime}:${direction}:${stage}` to prevent duplicate alerts across fast poll loops.
- **HTML Message Formatting**: Native Telegram HTML formatting with formatted pricing, pip calculations, risk management values, emoji status badges, and timestamping.
- **Manual 1-Click Broadcast**: Terminal UI buttons (Hero card, Entry Flow cards, Table view) permit traders to push any setup directly to Telegram with immediate toast feedback.
- **Status & Ping API**: Built-in verification test ping and connection status inspection endpoints.

### Environment Configuration (`.env`)
```bash
TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRstUVwxyz"
TELEGRAM_CHAT_ID="@your_channel_or_group"
TELEGRAM_AUTO_BROADCAST=true
TELEGRAM_MIN_SCORE=90
```

### REST Endpoints
- `GET /api/telegram/status`: Returns current bot connection status, masked channel ID, auto-broadcast flag, and minimum score threshold.
- `POST /api/telegram/test`: Dispatches a verification test ping to confirm bot setup & channel admin permissions.
- `POST /api/telegram/broadcast`: Broadcasts a trade setup card to Telegram with optional channel override.

---

## 9. Mobile Responsiveness & Touch UX Architecture

The terminal is engineered for seamless operation on mobile devices (smartphones, tablets) with native app ergonomics:
- **Fluid Header**: Re-organized into two compact rows on screens < 640px; title and quick action icons on top, scrollable asset switcher (`🪙 Gold`, `₿ BTC`, `Ξ ETH`, `◎ SOL`), and compact live bid/ask/spread ticker below.
- **Horizontal Swipeable MTF Rail**: Timeframe chips (`1m` to `4h`) transform from a vertical grid into a smooth horizontal touch-scrolling rail with CSS scroll-snap (`snap-x`), preserving screen real-estate.
- **Side-by-Side Dual Entry & Coordinates**: Market vs FVG Limit entry options render side-by-side (`grid-cols-2`), and execution coordinates (Hard SL, TP1, TP2) sit on a single 3-column row (`grid-cols-3`), saving over 200px of vertical scrolling.
- **Touch-Optimized Lightweight Chart**: Enhanced with `handleScroll: { vertTouchDrag: false }` so traders can scroll the page vertically without getting their touch gestures trapped in the chart canvas.
- **Swipeable Drawer & Filter Rails**: Tab selectors and filter chips (Timeframe, Grade, Outcome) glide horizontally on mobile with zero text wrapping.
- **Fixed Mobile Bottom Quick-Action Bar**: An always-visible bottom bar (`sm:hidden`) featuring active Timeframe cycle button, live price ticker, signal status badge, 1-tap `📋 Copy Setup`, and `📢 Telegram` broadcast button.

---

## 10. Directory Structure

```
d:/hono/indecator/
├── data/
│   ├── d1_local.sqlite          # Primary SQLite D1 database (WAL mode)
│   ├── d1_local.sqlite-wal      # SQLite Write-Ahead Log
│   └── d1_local.sqlite-shm      # SQLite Shared Memory index
├── public/
│   └── lightweight-charts.js    # Local copy of charting library
├── src/
│   ├── d1Database.ts            # D1 SQLite query engine, migrations, and aggregate analytics
│   ├── dashboardHtml.ts         # High-performance single-page terminal UI & client scripts
│   ├── indicators.ts            # ICT 4-confluence calculation, EMA, RSI, MACD, ATR, swing detection
│   ├── marketData.ts            # Multi-asset price generators, tick feeds, and synthetic OHLCV
│   ├── telegram.ts              # Telegram Bot API integration, message formatter & deduplication
│   └── index.ts                 # Hono application entry point, REST API routes & SSE stream
├── .env                         # Local environment configuration
├── .env.example                 # Cloudflare D1 environment credentials template
├── package.json                 # Node.js project manifest & scripts
├── tsconfig.json                # TypeScript compiler configuration
├── wrangler.toml                # Cloudflare Workers & D1 configuration binding
└── CONTEXT.md                   # This architecture and reference documentation
```

---

## 10. Development & Deployment Commands

```bash
# Start local development server with auto-restart on file changes
npm run dev

# Start production server
npm start

# Compile TypeScript
npm run build

# Deploy to Cloudflare Workers (requires Wrangler login)
npx wrangler deploy
```
