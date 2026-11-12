export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>XAU/USD — The 4-Confluence Master Strategy Terminal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700;800&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      background-color: #060911;
      color: #f8fafc;
    }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .panel {
      background: #0c1220;
      border: 1px solid #1e293b;
    }
    @keyframes flashUp {
      0% { background-color: rgba(16, 185, 129, 0.4); }
      100% { background-color: transparent; }
    }
    @keyframes flashDown {
      0% { background-color: rgba(244, 63, 94, 0.4); }
      100% { background-color: transparent; }
    }
    .tick-up { animation: flashUp 0.45s ease-out; }
    .tick-down { animation: flashDown 0.45s ease-out; }
    .banner-buy {
      background: linear-gradient(135deg, rgba(6, 78, 59, 0.5) 0%, #0c1220 65%);
      border: 1.5px solid rgba(16, 185, 129, 0.65);
    }
    .banner-sell {
      background: linear-gradient(135deg, rgba(136, 19, 55, 0.5) 0%, #0c1220 65%);
      border: 1.5px solid rgba(244, 63, 94, 0.65);
    }
    .banner-wait {
      background: linear-gradient(135deg, rgba(120, 53, 15, 0.38) 0%, #0c1220 65%);
      border: 1.5px solid rgba(245, 158, 11, 0.55);
    }
    .overflow-x-auto {
      -webkit-overflow-scrolling: touch;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col">

  <!-- Top Bar: MT5 Spot XAU/USD + Live Session Killzone Clock (GMT+7 Phnom Penh / UTC) -->
  <header class="border-b border-slate-800 bg-[#060911]/95 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-[1600px] mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
      <div class="flex items-center gap-2 sm:gap-4 flex-wrap w-full lg:w-auto justify-between lg:justify-start">
        <div class="flex items-center gap-2 sm:gap-2.5">
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-400 flex items-center justify-center font-black text-slate-950 text-xs mono shrink-0">
            4-CONF
          </div>
          <div>
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span class="font-extrabold text-sm sm:text-base tracking-tight text-white">XAU/USD MASTER</span>
              <span class="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE 0.8s
              </span>
            </div>
            <span id="sourceBadge" class="text-[10px] sm:text-[11px] text-slate-400 block truncate max-w-[220px] sm:max-w-none">50/200 EMA • RSI • ICT FVG/OB • 1:2/1:3</span>
          </div>
        </div>

        <!-- Live Bid / Ask / Spread Box (Mobile Optimized) -->
        <div id="priceBox" class="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 transition-colors w-full sm:w-auto justify-between sm:justify-start">
          <div>
            <span class="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block">MT5 BID</span>
            <span id="livePrice" class="mono text-lg sm:text-2xl font-black text-white tracking-tight">$----.--</span>
          </div>
          <div class="border-l border-slate-800 pl-2 sm:pl-3">
            <span class="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block">MT5 ASK</span>
            <span id="liveAsk" class="mono text-sm sm:text-base font-bold text-amber-300">$----.--</span>
          </div>
          <div class="border-l border-slate-800 pl-2 sm:pl-3">
            <span class="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block">SPREAD</span>
            <span id="liveSpread" class="mono text-[11px] sm:text-xs font-bold text-emerald-400">-- pt</span>
          </div>
          <span id="spreadGuardBadge" class="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">SPREAD OK</span>
          <span id="priceDirArrow" class="text-sm sm:text-base font-bold text-amber-400">●</span>
        </div>
      </div>

      <!-- Timeframe Selector + Circuit Breaker Indicator -->
      <div class="flex items-center justify-between sm:justify-end gap-2 w-full lg:w-auto flex-wrap">
        <div id="circuitBreakerPill" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          🛡️ Breaker: 0/2
        </div>

        <div class="inline-flex rounded-lg bg-slate-900 p-0.5 sm:p-1 border border-slate-800 overflow-x-auto">
          <button onclick="switchTimeframe('1m')" id="tf-1m" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white">M1</button>
          <button onclick="switchTimeframe('5m')" id="tf-5m" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white">M5</button>
          <button onclick="switchTimeframe('15m')" id="tf-15m" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-bold transition-all bg-amber-400 text-slate-950">M15</button>
          <button onclick="switchTimeframe('30m')" id="tf-30m" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white">M30</button>
          <button onclick="switchTimeframe('1h')" id="tf-1h" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white">H1</button>
          <button onclick="switchTimeframe('4h')" id="tf-4h" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white">H4</button>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-[1600px] w-full mx-auto px-4 py-4 flex-1 space-y-4">

    <!-- ========================================================================= -->
    <!-- CONFLUENCE 1 & 4 BAR: SESSION KILLZONE (GMT+7 / UTC) + PDH/PDL/ASIAN BOX  -->
    <!-- ========================================================================= -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-3">
      <!-- Session Killzone Window (GMT+7 Phnom Penh & UTC) -->
      <div class="lg:col-span-5 panel rounded-xl p-3.5 border-amber-500/30 flex items-center justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span id="sessionBadge" class="px-2.5 py-0.5 rounded text-xs font-black mono bg-amber-400 text-slate-950">SESSION</span>
            <span id="sessionClock" class="mono text-xs font-bold text-white">--:-- GMT+7 | --:-- UTC</span>
          </div>
          <p id="sessionActionText" class="text-xs text-slate-300 leading-snug">Loading session killzone rules...</p>
        </div>
      </div>

      <!-- Institutional Liquidity Levels (PDH, PDL, Asian High, Asian Low) -->
      <div class="lg:col-span-4 panel rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mono">
        <div class="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
          <span class="text-[9px] sm:text-[10px] text-slate-400 font-bold block">PDH (Prev High)</span>
          <span id="lvlPdh" class="text-xs sm:text-sm font-extrabold text-rose-300">$----</span>
        </div>
        <div class="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
          <span class="text-[9px] sm:text-[10px] text-slate-400 font-bold block">PDL (Prev Low)</span>
          <span id="lvlPdl" class="text-xs sm:text-sm font-extrabold text-emerald-300">$----</span>
        </div>
        <div class="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
          <span class="text-[9px] sm:text-[10px] text-amber-300/80 font-bold block">Asian High</span>
          <span id="lvlAsianHigh" class="text-xs sm:text-sm font-extrabold text-amber-300">$----</span>
        </div>
        <div class="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
          <span class="text-[9px] sm:text-[10px] text-amber-300/80 font-bold block">Asian Low</span>
          <span id="lvlAsianLow" class="text-xs sm:text-sm font-extrabold text-amber-300">$----</span>
        </div>
      </div>

      <!-- Confluence 1: Red Folder News Guard & MT5 Spread Buffer -->
      <div class="lg:col-span-3 panel rounded-xl p-3.5 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">1. Macro & Spread Guard</span>
          <span id="newsStatusBadge" class="px-2 py-0.5 rounded text-[10px] font-black mono bg-emerald-500/20 text-emerald-300">CLEAR</span>
        </div>
        <div id="spreadNoticeBox" class="text-[11px] mono text-emerald-300 mt-1 font-semibold">
          Spread: -- pt (Max 25pt) • Ask buffer active
        </div>
        <p id="newsStatusNote" class="text-[10px] text-slate-400 mt-0.5 leading-tight">Stay flat 15m before/after Red Folder CPI/NFP/FOMC.</p>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- ALL-TIMEFRAME 4-CONFLUENCE MATRIX (RESPONSIVE GRID & TABLE VIEW)            -->
    <!-- ========================================================================= -->
    <section class="panel rounded-2xl p-4 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div>
          <h2 class="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <span>All Timeframes 4-Confluence Entry Matrix</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 uppercase">Responsive Grid</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Take <span class="text-emerald-400 font-bold">50% Partial Profit at 1:2 R:R (TP1) + Move SL to Breakeven</span>, and let remaining run to <span class="text-emerald-300 font-bold">1:3 R:R (TP2)</span>.
          </p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <div class="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 flex-wrap gap-0.5">
            <button id="btnViewGrid" onclick="setMtfView('grid')" class="px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950 transition shadow-sm">
              🔲 Grid View
            </button>
            <button id="btnViewTable" onclick="setMtfView('table')" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white transition">
              📋 Table View
            </button>
            <button id="btnViewConfident" onclick="setMtfView('confident')" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white transition">
              ⭐ 85%+ Entries View
            </button>
          </div>
          <span id="mtfMasterSummary" class="text-xs text-slate-300 font-semibold hidden md:inline">--</span>
          <span id="mtfMasterBadge" class="px-2.5 py-1 rounded-md text-xs font-black mono bg-slate-800 text-amber-300">--</span>
        </div>
      </div>

      <!-- Responsive 6-Timeframe Card Grid (Default, Perfect for Mobile & Desktop) -->
      <div id="mtfGridContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
        <!-- Populated dynamically with responsive cards -->
      </div>

      <!-- Alternative Full Table View (Toggleable) -->
      <div id="mtfTableContainer" class="overflow-x-auto hidden">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <th class="py-2.5 px-2.5">Timeframe</th>
              <th class="py-2.5 px-2.5">Structure & Grade</th>
              <th class="py-2.5 px-2.5">50 & 200 EMA</th>
              <th class="py-2.5 px-2.5">Activation Status</th>
              <th class="py-2.5 px-2.5 bg-slate-900/90 border-x border-slate-800">Live P&L or Wait Distance</th>
              <th class="py-2.5 px-2.5 text-amber-300 font-extrabold bg-amber-400/10 border-x border-amber-400/20">📍 Entry Price</th>
              <th class="py-2.5 px-2.5">Hard SL (1.5x ATR)</th>
              <th class="py-2.5 px-2.5">TP 1 (1:2 • 50% + BE)</th>
              <th class="py-2.5 px-2.5">TP 2 (1:3 • H4 Runner)</th>
              <th class="py-2.5 px-2.5">Win Rate</th>
              <th class="py-2.5 px-2.5 text-right">Copy</th>
            </tr>
          </thead>
          <tbody id="mtfMatrixBody" class="divide-y divide-slate-800/70 mono">
            <!-- Populated dynamically -->
          </tbody>
        </table>
      </div>

      <!-- Alternative 85%+ Entries View (Directly Inside Matrix Card) -->
      <div id="mtfConfidentContainer" class="space-y-3 hidden">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
          <span class="text-slate-300 font-bold">⭐ All 85%+ High-Confidence Entries Across 6 Timeframes:</span>
          <div class="flex gap-2">
            <button onclick="toggleAllCollapses(true)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition">Expand All</button>
            <button onclick="toggleAllCollapses(false)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition">Collapse All</button>
          </div>
        </div>
        <div id="matrixConfidentCardsContainer" class="space-y-2.5">
          <!-- Populated dynamically -->
        </div>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- SELECTED TIMEFRAME: HERO CARD + EXACT 3-STEP M15 ENTRY CHECKLIST          -->
    <!-- ========================================================================= -->
    <section id="heroBanner" class="rounded-2xl p-5 banner-wait transition-all">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <!-- Left 5 Cols: Activation Status, Live P&L, & Exact 3-Step M15 Entry Checklist -->
        <div class="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-6">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span id="gradeBadge" class="px-2.5 py-1 rounded-md text-xs font-black mono bg-amber-400 text-slate-950">GRADE --</span>
              <span id="activationBadge" class="px-2.5 py-1 rounded-md text-xs font-black mono bg-slate-900 text-amber-300 border border-amber-500/40">
                STATUS
              </span>
            </div>
            <span id="structureTag" class="mono text-[11px] font-bold text-slate-300">--</span>
          </div>

          <div id="liveLifecycleBox" class="p-3.5 rounded-xl bg-slate-950/90 border-2 border-slate-700 space-y-1">
            <div class="flex items-center justify-between">
              <span id="lifecycleTitle" class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">ENTRY EXECUTION STATE</span>
              <span id="lifecycleEntryTag" class="mono text-xs font-bold text-white">Entry: $----.--</span>
            </div>
            <div id="lifecyclePnlBig" class="mono text-xl sm:text-2xl font-black text-amber-300">--</div>
            <p id="lifecycleSubText" class="text-xs text-slate-300">--</p>
          </div>

          <!-- Exact 3-Step M15 Entry Checklist -->
          <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
            <div class="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
              🎯 Exact 3-Step ICT / Price Action Entry Checklist
            </div>
            <div id="m15ChecklistContainer" class="space-y-1.5">
              <!-- Populated dynamically -->
            </div>
          </div>

          <button onclick="copyTradeSignal()" class="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition">
            📋 Copy 4-Confluence Setup (1:2 Partial + 1:3 Runner)
          </button>
        </div>

        <!-- Right 7 Cols: Entry Options + Hard SL ($3–$5) + 1:2 TP1 + 1:3 TP2 + Strict 1% Risk Calculator -->
        <div class="lg:col-span-7 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div id="marketEntryCard" onclick="copyValue('marketEntryVal')" class="cursor-pointer p-3 rounded-xl bg-slate-900/90 border border-slate-700 transition">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-extrabold uppercase text-slate-300">Option A: Market Price (Now)</span>
                <span id="marketEntryStatusTag" class="px-2 py-0.5 rounded text-[10px] font-black mono bg-slate-800 text-slate-300">--</span>
              </div>
              <div id="marketEntryVal" class="mono text-2xl font-black text-white mt-1">$----.--</div>
              <div id="marketEntryNote" class="text-[11px] text-slate-400 mt-0.5">Live MT5 Spot Price</div>
            </div>

            <div id="waitEntryCard" onclick="copyValue('waitEntryVal')" class="cursor-pointer p-3 rounded-xl bg-amber-500/10 border-2 border-amber-400/70 transition">
              <div class="flex items-center justify-between">
                <span id="waitCardTitle" class="text-[11px] font-extrabold uppercase text-amber-300">Option B: FVG / OB / 50 EMA Entry</span>
                <span id="waitOrderTypeTag" class="px-2 py-0.5 rounded text-[10px] font-black mono bg-amber-400 text-slate-950">LIMIT / RETEST</span>
              </div>
              <div id="waitEntryVal" class="mono text-2xl font-black text-amber-300 mt-1">$----.--</div>
              <div id="waitEntryNote" class="text-[11px] text-amber-200/80 mt-0.5">Wait for FVG / Order Block + Rejection Close</div>
            </div>
          </div>

          <!-- Hard SL (1.5x ATR), TP1 (1:2 R:R 50% Partial + BE), TP2 (1:3 R:R Runner) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div onclick="copyValue('setupSl')" class="cursor-pointer p-3 rounded-xl bg-rose-950/35 border border-rose-500/45 hover:border-rose-400 transition">
              <span class="text-[10px] font-bold uppercase text-rose-300 block">🛑 Hard SL (1.5x ATR Dynamic)</span>
              <div id="setupSl" class="mono text-lg sm:text-xl font-black text-rose-400 mt-1">$----.--</div>
              <span id="setupSlPips" class="mono text-[11px] text-rose-300/80 mt-0.5 block">Risk: -- pips ($--/oz)</span>
            </div>

            <div onclick="copyValue('setupTp1')" class="cursor-pointer p-3 rounded-xl bg-emerald-950/35 border border-emerald-500/45 hover:border-emerald-400 transition">
              <span class="text-[10px] font-bold uppercase text-emerald-300 block">🎯 TP 1 (1:2 RR • Take 50% + BE)</span>
              <div id="setupTp1" class="mono text-lg sm:text-xl font-black text-emerald-400 mt-1">$----.--</div>
              <span id="setupTp1Pips" class="mono text-[11px] text-emerald-300/80 mt-0.5 block">+-- pips (Move SL→BE)</span>
            </div>

            <div onclick="copyValue('setupTp2')" class="cursor-pointer p-3 rounded-xl bg-emerald-950/55 border border-emerald-400/60 hover:border-emerald-300 transition">
              <span class="text-[10px] font-bold uppercase text-emerald-200 block">🏆 TP 2 (1:3 RR • H4 Runner)</span>
              <div id="setupTp2" class="mono text-lg sm:text-xl font-black text-emerald-300 mt-1">$----.--</div>
              <span id="setupTp2Pips" class="mono text-[11px] text-emerald-200/90 mt-0.5 block">+-- pips (3× Reward)</span>
            </div>
          </div>

          <!-- Universal Risk Rule: Strict 1% Risk Per Trade Calculator -->
          <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 items-center text-xs">
            <div>
              <label class="text-[10px] text-slate-400 font-bold block">Account Equity ($)</label>
              <input id="calcBalance" type="number" value="1000" oninput="updateRiskCalc()" class="w-full mt-0.5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-bold mono" />
            </div>
            <div>
              <label class="text-[10px] text-slate-400 font-bold block">Strict Risk % (Max 2%)</label>
              <input id="calcRiskPct" type="number" value="1.0" max="2.0" step="0.25" oninput="updateRiskCalc()" class="w-full mt-0.5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-bold mono" />
            </div>
            <div class="text-center p-1.5 rounded bg-slate-900 border border-slate-800">
              <span class="text-[9px] text-slate-400 uppercase block">1R Risk ($)</span>
              <span id="calcRiskUsd" class="mono font-bold text-rose-400">-$10.00</span>
            </div>
            <div class="text-center p-1.5 rounded bg-amber-400/15 border border-amber-400/40">
              <span class="text-[9px] text-amber-300 uppercase block">MT5 Lot Size</span>
              <span id="calcLots" class="mono font-black text-amber-300">0.02 Lots</span>
            </div>
            <div class="col-span-2 sm:col-span-1 text-center p-1.5 rounded bg-slate-900 border border-slate-800">
              <span class="text-[9px] text-slate-400 uppercase block">1:2 / 1:3 Profit</span>
              <span id="calcRewardUsd" class="mono font-bold text-emerald-400">+$20 / +$30</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- 3. CLEAN CHART (50 EMA & 200 EMA ONLY + LIQUIDITY LINES) & 4 CONFLUENCES  -->
    <!-- ========================================================================= -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div class="lg:col-span-8 panel rounded-2xl p-4 flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div class="flex flex-wrap items-center gap-4 text-xs">
            <span class="font-bold text-white flex items-center gap-2">
              <span id="chartTfLabel" class="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black mono">15M</span>
              XAU/USD Chart (Clean 50 EMA & 200 EMA + Liquidity Levels)
            </span>
            <span class="flex items-center gap-1.5 text-purple-400 font-bold mono"><span class="w-3 h-0.5 bg-purple-400 inline-block"></span>50 EMA (Slope Filter)</span>
            <span class="flex items-center gap-1.5 text-sky-400 font-bold mono"><span class="w-3 h-0.5 bg-sky-400 inline-block"></span>200 EMA (Macro Baseline)</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="togglePriceLines()" id="toggleLinesBtn" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              SL / TP / PDH-PDL Lines: ON
            </button>
            <button onclick="resetChartZoom()" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700">
              Fit Chart
            </button>
          </div>
        </div>
        <div id="priceChart" class="w-full h-[320px] sm:h-[430px] rounded-xl overflow-hidden"></div>
      </div>

      <div class="lg:col-span-4 panel rounded-2xl p-4 space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">Quantitative 100-Point Scoring Matrix</h3>
            <p class="text-[11px] text-slate-400">Rule 3: Only execute 90–100 pts. ≤85 pts is an automatic pass.</p>
          </div>
          <span id="quantScoreBadge" class="mono text-xs font-black px-2.5 py-1 rounded bg-amber-400 text-slate-950">--/100 PTS</span>
        </div>
        
        <!-- Action Verdict Banner -->
        <div id="quantVerdictBanner" class="p-2.5 rounded-xl border text-center font-black mono text-xs bg-slate-900 border-slate-700 text-slate-300">
          EVALUATING 100-POINT MATRIX...
        </div>

        <div id="quantPillarsContainer" class="space-y-2">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- ⭐ 85%+ HIGH-CONFIDENCE ENTRIES (COLLAPSIBLE PER TIMEFRAME)                -->
    <!-- ========================================================================= -->
    <section class="panel rounded-2xl p-4 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 class="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <span>⭐ 85%+ High-Confidence Entries</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 uppercase">Collapsible per Timeframe</span>
          </h2>
          <p class="text-xs text-slate-400">
            Institutional Grade A / A+ entries with 85%+ confidence (Limit 5 per timeframe) with entry, stop loss, and 1:2 / 1:3 targets.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="toggleAllCollapses(true)" class="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition">Expand All</button>
          <button onclick="toggleAllCollapses(false)" class="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition">Collapse All</button>
        </div>
      </div>

      <div id="highConfidenceCollapseContainer" class="space-y-3">
        <!-- Populated dynamically -->
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- 4. ACTIVATED SIGNALS LOG ACROSS TIMEFRAMES (1:2 & 1:3 R:R OUTCOMES)       -->
    <!-- ========================================================================= -->
    <section class="panel rounded-2xl p-4 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 class="text-sm font-extrabold uppercase tracking-wider text-white">
            4-Confluence Activated Signals Log (1:2 Partial + BE & 1:3 Runner Outcomes)
          </h2>
          <p class="text-xs text-slate-400">
            Verified signals across M1, M5, M15, M30, H1, and H4 using Hard SL ($3–$5) and 1:2 / 1:3 Risk-to-Reward.
          </p>
        </div>

        <div class="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800 flex-wrap gap-1">
          <button onclick="filterSignalList('90PLUS')" id="flt-90PLUS" class="px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950 shadow-sm">⭐ 90%+ ONLY</button>
          <button onclick="filterSignalList('ALL')" id="flt-ALL" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">ALL TFs</button>
          <button onclick="filterSignalList('1m')" id="flt-1m" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M1</button>
          <button onclick="filterSignalList('5m')" id="flt-5m" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M5</button>
          <button onclick="filterSignalList('15m')" id="flt-15m" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M15</button>
          <button onclick="filterSignalList('30m')" id="flt-30m" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M30</button>
          <button onclick="filterSignalList('1h')" id="flt-1h" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">H1</button>
          <button onclick="filterSignalList('4h')" id="flt-4h" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">H4</button>
        </div>
      </div>

      <div class="text-[10px] text-slate-500 block sm:hidden font-mono">← Swipe table sideways on mobile →</div>
      <div class="overflow-x-auto rounded-xl border border-slate-800/60">
        <table class="w-full text-left border-collapse text-xs min-w-[700px] sm:min-w-full">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <th class="py-2.5 px-3">Time</th>
              <th class="py-2.5 px-3">TF</th>
              <th class="py-2.5 px-3">Signal</th>
              <th class="py-2.5 px-3">Grade</th>
              <th class="py-2.5 px-3 text-amber-300 font-extrabold bg-amber-400/10 border-x border-amber-400/20">📍 Entry Price</th>
              <th class="py-2.5 px-3">Hard SL (1.5x ATR)</th>
              <th class="py-2.5 px-3">TP 1 (1:2 • 50% + BE)</th>
              <th class="py-2.5 px-3">TP 2 (1:3 • Runner)</th>
              <th class="py-2.5 px-3">Confluence Trigger</th>
              <th class="py-2.5 px-3">Outcome</th>
              <th class="py-2.5 px-3 text-right">Net Move ($/oz)</th>
            </tr>
          </thead>
          <tbody id="allSignalsTableBody" class="divide-y divide-slate-800/60 mono">
            <!-- Populated dynamically -->
          </tbody>
        </table>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- 5. RULE 5: 20-TRADE RULE-ADHERENCE JOURNAL TABLE                          -->
    <!-- ========================================================================= -->
    <section class="panel rounded-2xl p-4 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 class="text-sm font-extrabold uppercase tracking-wider text-white">
            📘 20-Trade Rule-Adherence Journal (Confluence 90%+, M15 Close & MT5 Spread Log)
          </h2>
          <p class="text-xs text-slate-400">
            Rule 5: Judge your execution by discipline across 20 consecutive trades. Logged with Score (90%+ only), M15 close wait, entry spread, and achieved R:R.
          </p>
        </div>
        <div id="journalStatsBadge" class="px-3 py-1 rounded-lg text-xs font-black mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          20-Trade Win Rate: --%
        </div>
      </div>

      <div class="text-[10px] text-slate-500 block sm:hidden font-mono">← Swipe table sideways on mobile →</div>
      <div class="overflow-x-auto rounded-xl border border-slate-800/60">
        <table class="w-full text-left border-collapse text-xs min-w-[700px] sm:min-w-full">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <th class="py-2.5 px-3">#</th>
              <th class="py-2.5 px-3">Time</th>
              <th class="py-2.5 px-3">TF</th>
              <th class="py-2.5 px-3">Dir</th>
              <th class="py-2.5 px-3 text-amber-300">Score (90%+)</th>
              <th class="py-2.5 px-3">M15 Close Waited</th>
              <th class="py-2.5 px-3">Spread @ Entry</th>
              <th class="py-2.5 px-3">Entry Price</th>
              <th class="py-2.5 px-3 text-rose-400">Stop-Loss</th>
              <th class="py-2.5 px-3 text-emerald-400">TP 1 (1:2)</th>
              <th class="py-2.5 px-3 text-emerald-300">TP 2 (1:3+)</th>
              <th class="py-2.5 px-3">Outcome</th>
              <th class="py-2.5 px-3">Achieved R:R</th>
              <th class="py-2.5 px-3 text-right">Net P&L ($/oz)</th>
            </tr>
          </thead>
          <tbody id="journalTableBody" class="divide-y divide-slate-800/60 mono">
            <!-- Populated dynamically -->
          </tbody>
        </table>
      </div>
    </section>

  </main>

  <div id="copyToast" class="fixed bottom-5 right-5 z-50 hidden px-4 py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-xl">
    Copied!
  </div>

  <script>
    let currentTf = '15m';
    let signalListFilter = 'ALL';
    let showPriceLines = true;
    let currentAnalysis = null;
    let latestMtfData = null;
    let lastKnownBid = null;
    let lastCandleBar = null;

    let priceChart, candleSeries, ema50Series, ema200Series;
    let activePriceLines = [];

    const TF_LABELS = {
      '1m': 'M1 Scalp',
      '5m': 'M5 Scalp',
      '15m': 'M15 Primary',
      '30m': 'M30 Intraday',
      '1h': 'H1 Filter',
      '4h': 'H4 Structure'
    };

    let mtfViewMode = 'grid';

    function setMtfView(mode) {
      mtfViewMode = mode;
      const gridEl = document.getElementById('mtfGridContainer');
      const tableEl = document.getElementById('mtfTableContainer');
      const confEl = document.getElementById('mtfConfidentContainer');
      const btnGrid = document.getElementById('btnViewGrid');
      const btnTable = document.getElementById('btnViewTable');
      const btnConf = document.getElementById('btnViewConfident');

      if (gridEl) gridEl.classList.toggle('hidden', mode !== 'grid');
      if (tableEl) tableEl.classList.toggle('hidden', mode !== 'table');
      if (confEl) confEl.classList.toggle('hidden', mode !== 'confident');

      if (btnGrid) {
        btnGrid.className = mode === 'grid'
          ? 'px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950 transition shadow-sm'
          : 'px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white transition';
      }
      if (btnTable) {
        btnTable.className = mode === 'table'
          ? 'px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950 transition shadow-sm'
          : 'px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white transition';
      }
      if (btnConf) {
        btnConf.className = mode === 'confident'
          ? 'px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950 transition shadow-sm'
          : 'px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white transition';
      }
    }

    function initCharts() {
      const priceEl = document.getElementById('priceChart');
      priceChart = LightweightCharts.createChart(priceEl, {
        layout: {
          background: { type: 'solid', color: '#0c1220' },
          textColor: '#94a3b8',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: 'rgba(30, 41, 59, 0.45)' },
          horzLines: { color: 'rgba(30, 41, 59, 0.45)' },
        },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#1e293b' },
        timeScale: { borderColor: '#1e293b', timeVisible: true, secondsVisible: false },
        height: window.innerWidth < 640 ? 320 : 430,
      });

      candleSeries = priceChart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderUpColor: '#10b981',
        borderDownColor: '#f43f5e',
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
      });

      // Clean 2-Indicator Setup: 50 EMA (Purple) & 200 EMA (Sky Blue)
      ema50Series = priceChart.addLineSeries({ color: '#a855f7', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
      ema200Series = priceChart.addLineSeries({ color: '#38bdf8', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });

      window.addEventListener('resize', () => {
        const isMob = window.innerWidth < 640;
        priceChart.applyOptions({
          width: priceEl.clientWidth,
          height: isMob ? 320 : 430,
        });
      });
    }

    function connectRealtimeTickStream() {
      const es = new EventSource('/api/stream');
      es.addEventListener('tick', (ev) => {
        try {
          const quote = JSON.parse(ev.data);
          updateLiveSpotTicker(quote);
        } catch {}
      });
      es.onerror = () => {
        es.close();
        setTimeout(connectRealtimeTickStream, 2000);
      };
    }

    function updateLiveSpotTicker(quote) {
      if (!quote || !quote.bid) return;
      const bid = Number(quote.bid);
      const ask = Number(quote.ask);
      const spread = Number(quote.spreadPips);

      document.getElementById('livePrice').textContent = '$' + bid.toFixed(2);
      document.getElementById('liveAsk').textContent = '$' + ask.toFixed(2);
      const spreadPoints = (spread * 10).toFixed(0);
      document.getElementById('liveSpread').textContent = spreadPoints + ' pt (' + spread.toFixed(1) + 'p)';
      const spBadge = document.getElementById('spreadGuardBadge');
      if (spBadge) {
        if (spread <= 2.5) {
          spBadge.textContent = 'SPREAD OK';
          spBadge.className = 'px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        } else {
          spBadge.textContent = 'WIDE SPREAD';
          spBadge.className = 'px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black mono bg-rose-500 text-white animate-pulse';
        }
      }

      const boxEl = document.getElementById('priceBox');
      const arrowEl = document.getElementById('priceDirArrow');

      if (lastKnownBid !== null && bid !== lastKnownBid) {
        boxEl.classList.remove('tick-up', 'tick-down');
        void boxEl.offsetWidth;
        if (bid > lastKnownBid) {
          boxEl.classList.add('tick-up');
          arrowEl.textContent = '▲';
          arrowEl.className = 'text-base font-bold text-emerald-400';
        } else {
          boxEl.classList.add('tick-down');
          arrowEl.textContent = '▼';
          arrowEl.className = 'text-base font-bold text-rose-400';
        }
      }
      lastKnownBid = bid;

      if (lastCandleBar && candleSeries) {
        lastCandleBar.close = bid;
        if (bid > lastCandleBar.high) lastCandleBar.high = bid;
        if (bid < lastCandleBar.low) lastCandleBar.low = bid;
        try { candleSeries.update(lastCandleBar); } catch {}
      }

      // Live update the Hero Card P&L on every incoming MT5 sub-second tick
      if (currentAnalysis && currentAnalysis.tradeSetup && currentAnalysis.tradeSetup.entryTiming && currentAnalysis.tradeSetup.entryTiming.lifecycle) {
        const lc = currentAnalysis.tradeSetup.entryTiming.lifecycle;
        const bigEl = document.getElementById('lifecyclePnlBig');
        const badgeEl = document.getElementById('activationBadge');
        if (lc.isActivated && !lc.hitTp2 && !lc.hitSl) {
          const diff = lc.direction === 'BUY' ? bid - lc.entryPrice : lc.entryPrice - bid;
          const pips = diff * 10;
          const sign = pips >= 0 ? '+' : '';
          const isProf = pips >= 0;
          const pipsStr = pips.toFixed(1);
          const diffStr = Math.abs(diff).toFixed(2);
          bigEl.textContent = (isProf ? '🟢 IN PROFIT: ' : '🔴 IN LOSS: ') + sign + pipsStr + ' pips (' + sign + '$' + diffStr + '/oz)';
          bigEl.className = 'mono text-xl sm:text-2xl font-black ' + (isProf ? 'text-emerald-400' : 'text-rose-400');
          if (badgeEl) {
            badgeEl.textContent = isProf ? '🟢 ACTIVATED • IN PROFIT' : '🔴 ACTIVATED • IN LOSS';
            badgeEl.className = 'px-3 py-1 rounded-md text-xs font-black mono uppercase tracking-wider ' +
              (isProf ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50' : 'bg-rose-500/25 text-rose-300 border border-rose-500/50');
          }
        } else if (!lc.isActivated) {
          const distPips = (Math.abs(bid - lc.entryPrice) * 10).toFixed(1);
          const entryStr = lc.entryPrice.toFixed(2);
          bigEl.textContent = '⏳ WAIT FVG/OB RETEST: ' + distPips + 'p away ($' + entryStr + ')';
          bigEl.className = 'mono text-xl sm:text-2xl font-black text-amber-300';
          if (badgeEl) {
            badgeEl.textContent = '⏳ WAIT FVG / OB CONFIRMATION';
            badgeEl.className = 'px-3 py-1 rounded-md text-xs font-black mono uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40';
          }
        }
      }

      // Live update ALL All-Timeframe Grid Cards & Table rows on every MT5 sub-second tick
      if (latestMtfData && latestMtfData.timeframes) {
        const order = ['1m', '5m', '15m', '30m', '1h', '4h'];
        order.forEach((tf) => {
          const gridCell = document.getElementById('mtf-grid-pnl-' + tf);
          const tableCell = document.getElementById('mtf-table-pnl-' + tf);
          if (!gridCell && !tableCell) return;
          const r = latestMtfData.timeframes[tf];
          if (!r || !r.entryTiming || !r.entryTiming.lifecycle) return;
          const lc = r.entryTiming.lifecycle;
          let pnlHtml = '';
          if (lc.isActivated) {
            const diff = lc.direction === 'BUY' ? bid - lc.entryPrice : lc.entryPrice - bid;
            const pips = diff * 10;
            const sign = pips >= 0 ? '+' : '';
            const colorClass = pips >= 0 ? 'text-emerald-400' : 'text-rose-400';
            const pipsStr = pips.toFixed(1);
            const diffStr = Math.abs(diff).toFixed(2);
            pnlHtml = '<span class="font-black ' + colorClass + '">' + sign + pipsStr + ' pips (' + sign + '$' + diffStr + '/oz)</span>';
          } else {
            const distPips = (Math.abs(bid - lc.entryPrice) * 10).toFixed(1);
            const entryStr = lc.entryPrice.toFixed(2);
            const prevMatch = (lc.pnlStatusText || '').match(/Prev:[^→]+/);
            const prevText = prevMatch ? prevMatch[0].trim() : '';
            if (prevText) {
              pnlHtml = '<span class="text-amber-300 font-bold leading-relaxed break-words block w-full text-center">⏳ ' + prevText + ' → Wait @ $' + entryStr + ' (' + distPips + 'p)</span>';
            } else {
              pnlHtml = '<span class="text-amber-300 font-bold leading-relaxed break-words block w-full text-center">⏳ Wait ' + distPips + 'p for FVG/OB @ $' + entryStr + '</span>';
            }
          }
          if (gridCell) gridCell.innerHTML = pnlHtml;
          if (tableCell) tableCell.innerHTML = pnlHtml;
        });
      }

      // Live update Active Running rows in the Signals Log table on every tick
      if (latestMtfData && latestMtfData.allHighProbSignals) {
        latestMtfData.allHighProbSignals.forEach((s) => {
          if (s.outcome === 'ACTIVE') {
            const diff = s.type === 'BUY' ? bid - s.entry : s.entry - bid;
            s.pnlDollarsPerOz = diff;
            const pnlCell = document.getElementById('sig-pnl-' + s.timeframe + '-' + s.time);
            if (pnlCell) {
              const sign = diff >= 0 ? '+' : '';
              const pips = (diff * 10).toFixed(0);
              const pipsStr = (diff >= 0 ? '+' : '') + pips + 'p';
              const isProf = diff >= 0;
              pnlCell.innerHTML = '<span class="px-2 py-0.5 rounded font-black ' +
                (isProf ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-rose-500/20 text-rose-300 border border-rose-400/40') +
                '">' + sign + '$' + diff.toFixed(2) + ' (' + pipsStr + ')</span>';
            }
          }
        });
      }

      // Live update all Active cards in highConfidenceByTf (both in grid cards and dedicated view)
      if (latestMtfData && latestMtfData.highConfidenceByTf) {
        Object.entries(latestMtfData.highConfidenceByTf).forEach(([tf, sigs]) => {
          (sigs || []).forEach((s) => {
            if (s.outcome === 'ACTIVE') {
              const diff = s.type === 'BUY' ? bid - s.entry : s.entry - bid;
              const pips = diff * 10;
              const sign = diff >= 0 ? '+' : '';
              const isProf = diff >= 0;
              const pipsStr = pips.toFixed(1) + 'p';
              const diffStr = Math.abs(diff).toFixed(2);
              const bgCls = isProf ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

              const els = document.querySelectorAll('.conf-live-pnl-' + tf + '-' + s.time);
              els.forEach((el) => {
                el.innerHTML = '<span class="px-2 py-0.5 rounded font-black mono text-[10px] border ' + bgCls + '">' +
                  (isProf ? '🟢' : '🔴') + ' RUNNING: ' + sign + '$' + diffStr + '/oz (' + sign + pipsStr + ')</span>';
              });
            }
          });
        });
      }
    }

    function clearSetupPriceLines() {
      activePriceLines.forEach((l) => { try { candleSeries.removePriceLine(l); } catch {} });
      activePriceLines = [];
    }

    function drawSetupPriceLines(setup, liq) {
      clearSetupPriceLines();
      if (!showPriceLines || !setup) return;

      const et = setup.entryTiming;
      const lc = et?.lifecycle;
      const entryLinePrice = lc ? lc.entryPrice : setup.entry;

      activePriceLines.push(
        candleSeries.createPriceLine({
          price: entryLinePrice,
          color: lc?.isActivated ? '#38bdf8' : '#fbbf24',
          lineWidth: 2,
          lineStyle: LightweightCharts.LineStyle.Dashed,
          axisLabelVisible: true,
          title: (lc?.isActivated ? '⚡ ACTIVE ENTRY $' : '⏳ FVG/OB WAIT $') + entryLinePrice.toFixed(2),
        }),
        candleSeries.createPriceLine({
          price: lc ? lc.stopLoss : setup.stopLoss,
          color: '#f43f5e',
          lineWidth: 2,
          lineStyle: LightweightCharts.LineStyle.Solid,
          axisLabelVisible: true,
          title: '🛑 HARD SL $' + (lc ? lc.stopLoss : setup.stopLoss).toFixed(2),
        }),
        candleSeries.createPriceLine({
          price: lc ? lc.tp1 : setup.tp1,
          color: '#34d399',
          lineWidth: 2,
          lineStyle: LightweightCharts.LineStyle.Dashed,
          axisLabelVisible: true,
          title: '🎯 TP1 (1:2 • 50%+BE) $' + (lc ? lc.tp1 : setup.tp1).toFixed(2),
        }),
        candleSeries.createPriceLine({
          price: lc ? lc.tp2 : setup.tp2,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: LightweightCharts.LineStyle.Solid,
          axisLabelVisible: true,
          title: '🏆 TP2 (1:3 RUNNER) $' + (lc ? lc.tp2 : setup.tp2).toFixed(2),
        })
      );

      if (liq) {
        activePriceLines.push(
          candleSeries.createPriceLine({
            price: liq.asianHigh,
            color: 'rgba(251, 191, 36, 0.45)',
            lineWidth: 1,
            lineStyle: LightweightCharts.LineStyle.Dotted,
            axisLabelVisible: true,
            title: 'ASIAN HIGH',
          }),
          candleSeries.createPriceLine({
            price: liq.asianLow,
            color: 'rgba(251, 191, 36, 0.45)',
            lineWidth: 1,
            lineStyle: LightweightCharts.LineStyle.Dotted,
            axisLabelVisible: true,
            title: 'ASIAN LOW',
          })
        );
      }
    }

    function activationBadgeStyle(state) {
      if (state === 'TP2_HIT_PROFIT') return 'bg-emerald-400 text-slate-950 font-black';
      if (state === 'TP1_HIT_RUNNING') return 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 font-black';
      if (state === 'ACTIVATED_PROFIT') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 font-black';
      if (state === 'ACTIVATED_LOSS') return 'bg-rose-500/25 text-rose-300 border border-rose-500/50 font-black';
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold';
    }

    async function loadSignalData() {
      try {
        let [sigRes, mtfRes] = await Promise.all([
          fetch(\`/api/signal?tf=\${currentTf}\`),
          fetch('/api/mtf')
        ]);

        if (!sigRes.ok || !mtfRes.ok) {
          const [f1, f2] = await Promise.all([
            fetch(\`/signal?tf=\${currentTf}\`),
            fetch('/mtf')
          ]);
          if (f1.ok) sigRes = f1;
          if (f2.ok) mtfRes = f2;
        }

        if (!sigRes.ok || !mtfRes.ok) {
          console.warn('API fetch warning:', sigRes.status, mtfRes.status);
          return;
        }

        const data = await sigRes.json();
        const mtf = await mtfRes.json();
        currentAnalysis = data;
        latestMtfData = mtf;
        renderDashboard(data, mtf);
      } catch (e) {
        console.error('Signal data fetch error:', e);
      }
    }

    function renderDashboard(data, mtf) {
      saveOpenCollapses();
      if (data.spotQuote) updateLiveSpotTicker(data.spotQuote);

      // Session & Killzone Bar (GMT+7 Phnom Penh & UTC)
      if (data.session) {
        const s = data.session;
        const sBadge = document.getElementById('sessionBadge');
        sBadge.textContent = s.name;
        sBadge.className = 'px-2.5 py-0.5 rounded text-xs font-black mono ' +
          (s.isKillzone ? 'bg-emerald-400 text-slate-950' : 'bg-amber-400 text-slate-950');
        document.getElementById('sessionClock').textContent = \`\${s.gmt7Time} (Phnom Penh) • \${s.utcTime}\`;
        document.getElementById('sessionActionText').textContent = s.behaviorAndAction;

        const nBadge = document.getElementById('newsStatusBadge');
        nBadge.textContent = s.newsGuardStatus === 'CLEAR' ? '✅ CLEAR' : '⚠️ RED FOLDER WINDOW';
        nBadge.className = 'px-2 py-0.5 rounded text-[10px] font-black mono ' +
          (s.newsGuardStatus === 'CLEAR' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500 text-white');
        document.getElementById('newsStatusNote').textContent = s.newsGuardNote;
      }

      // Liquidity Levels (PDH, PDL, Asian High, Asian Low)
      if (data.liquidityLevels) {
        const l = data.liquidityLevels;
        document.getElementById('lvlPdh').textContent = '$' + l.pdh.toFixed(1);
        document.getElementById('lvlPdl').textContent = '$' + l.pdl.toFixed(1);
        document.getElementById('lvlAsianHigh').textContent = '$' + l.asianHigh.toFixed(1);
        document.getElementById('lvlAsianLow').textContent = '$' + l.asianLow.toFixed(1);
      }

      // 2-Loss Daily Circuit Breaker
      const cbPill = document.getElementById('circuitBreakerPill');
      const lossesToday = data.backtest?.consecutiveLossesToday ?? 0;
      if (data.backtest?.circuitBreakerTripped) {
        cbPill.textContent = \`🛑 CIRCUIT BREAKER TRIPPED (\${lossesToday}/2 Losses — Stop Trading Today)\`;
        cbPill.className = 'px-2.5 py-1.5 rounded-lg text-xs font-extrabold mono bg-rose-500 text-white';
      } else {
        cbPill.textContent = \`🛡️ Circuit Breaker: \${lossesToday}/2 Consecutive Losses\`;
        cbPill.className = 'px-2.5 py-1.5 rounded-lg text-xs font-extrabold mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
      }

      // All-Timeframe Matrix (Responsive Grid + Table)
      if (mtf && mtf.timeframes) {
        document.getElementById('mtfMasterSummary').textContent = mtf.alignmentSummary;
        document.getElementById('mtfMasterBadge').textContent = \`MASTER: \${mtf.masterSignal}\`;

        const order = ['1m', '5m', '15m', '30m', '1h', '4h'];

        // 1. Render Responsive 6-Timeframe Card Grid (Default View)
        const gridContainer = document.getElementById('mtfGridContainer');
        if (gridContainer) {
          gridContainer.innerHTML = order.map((tf) => {
            const r = mtf.timeframes[tf];
            if (!r || !r.entryTiming?.lifecycle) return '';
            const et = r.entryTiming;
            const lc = et.lifecycle;
            const confSigs = (mtf.highConfidenceByTf && mtf.highConfidenceByTf[tf]) || [];
            const cardDetailId = 'card-conf-' + tf;
            const isCardConfOpen = openedCollapseIds.has(cardDetailId);
            const isSelected = tf === currentTf;
            const cardCls = isSelected
              ? 'border-2 border-amber-400 bg-amber-400/[0.08] shadow-lg shadow-amber-400/10 ring-1 ring-amber-400/30'
              : 'border border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-900/95';

            const dirColor = lc.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400';
            const dirIcon = lc.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL';
            const structShort = r.ictStructure?.marketStructure?.includes('UPTREND') ? 'HH+HL' : 'LH+LL';
            const emaBadge = r.ictStructure?.ema50And200Filter?.includes('BULLISH')
              ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300">Above 50/200</span>'
              : r.ictStructure?.ema50And200Filter?.includes('BEARISH')
              ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300">Below 50/200</span>'
              : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300">Transition</span>';

            const pnlCellHtml = lc.isActivated
              ? \`<span class="font-black \${lc.floatingPips >= 0 ? 'text-emerald-400' : 'text-rose-400'}">\${lc.pnlStatusText}</span>\`
              : \`<span class="text-amber-300 font-bold leading-relaxed break-words block w-full text-center">⏳ \${lc.pnlStatusText}</span>\`;

            return \`
              <div onclick="switchTimeframe('\${tf}')" class="rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between overflow-visible \${cardCls}">
                <!-- Header -->
                <div class="flex items-center justify-between gap-1 mb-2">
                  <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded text-xs font-black mono bg-slate-800 text-amber-300 uppercase">\${TF_LABELS[tf] || tf.toUpperCase()}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950">\${r.grade} \${r.probability}%</span>
                  </div>
                  <span class="text-xs font-black \${dirColor}">\${dirIcon} (\${structShort})</span>
                </div>

                <!-- Indicators Sub-Bar -->
                <div class="flex items-center justify-between gap-1 mb-2 text-xs">
                  \${emaBadge}
                  <span class="px-2 py-0.5 rounded text-[10px] \${activationBadgeStyle(lc.activationState)}">\${lc.statusBadge}</span>
                </div>

                <!-- Live P&L or Distance Box (Full Text, Never Cut Off) -->
                <div class="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 mb-2.5 overflow-visible">
                  <div class="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>LIVE STATUS & P&L</span>
                  </div>
                  <div id="mtf-grid-pnl-\${tf}" class="mono text-xs sm:text-[12px] font-black text-center min-h-[64px] h-auto py-2.5 px-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-center shadow-inner overflow-visible">
                    \${pnlCellHtml}
                  </div>
                </div>

                <!-- Key Execution Grid (Entry, Hard SL, TP1, TP2) -->
                <div class="grid grid-cols-2 gap-1.5 mono mb-3">
                  <div class="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
                    <div class="text-[9px] uppercase font-bold text-amber-400/80">📍 Entry</div>
                    <div class="font-black text-amber-300 text-xs">$\${lc.entryPrice.toFixed(2)}</div>
                  </div>
                  <div class="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <div class="text-[9px] uppercase font-bold text-rose-400/80">🛑 Hard SL</div>
                    <div class="font-bold text-rose-400 text-xs">$\${lc.stopLoss.toFixed(2)}</div>
                  </div>
                  <div class="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div class="text-[9px] uppercase font-bold text-emerald-400/80">🎯 TP1 (1:2)</div>
                    <div class="font-bold text-emerald-400 text-xs">$\${lc.tp1.toFixed(2)}</div>
                  </div>
                  <div class="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                    <div class="text-[9px] uppercase font-bold text-emerald-300/80">🏆 TP2 (1:3)</div>
                    <div class="font-extrabold text-emerald-300 text-xs">$\${lc.tp2.toFixed(2)}</div>
                  </div>
                </div>

                <!-- Collapsible 85%+ Entries for this Timeframe Card -->
                <div class="mb-3" onclick="event.stopPropagation();">
                  <details id="card-conf-\${tf}" \${isCardConfOpen ? 'open' : ''} ontoggle="onCollapseToggle(this)" class="group rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                    <summary class="cursor-pointer py-1.5 px-2.5 flex items-center justify-between text-xs select-none hover:bg-slate-800/60 transition">
                      <span class="font-extrabold text-amber-300 text-[11px] flex items-center gap-1.5">
                        <span>⭐ Top 85%+ Entries</span>
                        <span class="px-1.5 py-0.2 rounded text-[10px] font-black \${confSigs.length > 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}">\${confSigs.length}</span>
                      </span>
                      <span class="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div class="p-2 border-t border-slate-800/80 bg-slate-950 space-y-2 max-h-[220px] overflow-y-auto">
                      \${confSigs.length === 0
                        ? '<div class="text-[11px] text-slate-500 text-center py-2 mono">No 85%+ entries in scan window</div>'
                        : confSigs.map((cs, cIdx) => {
                            const cIsB = cs.type === 'BUY';
                            const cTypeCls = cIsB ? 'text-emerald-400' : 'text-rose-400';
                            const isAct = cs.outcome === 'ACTIVE';
                            const curBid = lastKnownBid || cs.entry;
                            const diff = cIsB ? curBid - cs.entry : cs.entry - curBid;
                            const pips = diff * 10;
                            const isProf = diff >= 0;
                            const sign = isProf ? '+' : '';
                            const outBadge = isAct
                              ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/40">⚡ ACTIVE</span>'
                              : cs.outcome === 'TP2_HIT'
                              ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">🏆 TP2 (1:3)</span>'
                              : cs.outcome === 'TP1_HIT'
                              ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">✅ TP1 (1:2)</span>'
                              : cs.outcome === 'BE_EXIT'
                              ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">🛡️ BE</span>'
                              : '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300">❌ SL</span>';

                            const livePnlHtml = isAct
                              ? \`<div class="conf-live-pnl-\${cs.timeframe || tf}-\${cs.time} pt-1">
                                   <span class="px-2 py-0.5 rounded font-black mono text-[10px] border \${isProf ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}">
                                     \${isProf ? '🟢' : '🔴'} RUNNING: \${sign}$\${Math.abs(diff).toFixed(2)}/oz (\${sign}\${pips.toFixed(1)}p)
                                   </span>
                                 </div>\`
                              : \`<div class="pt-1 text-[10px] font-bold \${(cs.pnlDollarsPerOz || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}">Outcome: \${(cs.pnlDollarsPerOz || 0) >= 0 ? '+' : ''}$\${(cs.pnlDollarsPerOz || 0).toFixed(2)}/oz</div>\`;

                            return \`
                              <div class="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                                <div class="flex items-center justify-between text-[11px]">
                                  <div class="flex items-center gap-1.5">
                                    <span class="font-black mono \${cTypeCls}">\${cs.type} #\${cIdx + 1}</span>
                                    <span class="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px]">\${cs.grade} \${cs.probability || cs.confidence}%</span>
                                  </div>
                                  \${outBadge}
                                </div>
                                <div class="mono text-[11px] space-y-0.5 text-slate-300 pt-0.5">
                                  <div class="text-amber-300 font-bold">• <strong>entry</strong>: \${cs.entry.toFixed(2)}</div>
                                  <div class="text-rose-400">• <strong>stop loss</strong>: \${cs.stopLoss.toFixed(2)}</div>
                                  <div class="text-emerald-400">• <strong>tp1</strong>: \${cs.tp1.toFixed(2)}</div>
                                  <div class="text-emerald-300 font-extrabold">• <strong>tp2</strong>: \${cs.tp2.toFixed(2)}</div>
                                </div>
                                \${livePnlHtml}
                              </div>
                            \`;
                          }).join('')
                      }
                    </div>
                  </details>
                </div>

                <!-- Footer -->
                <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span class="text-slate-400 text-[11px]">Win: <strong class="text-emerald-400">\${r.winRate.toFixed(0)}%</strong></span>
                  <button onclick="event.stopPropagation(); copyTfOrder('\${tf}')" class="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] shadow-sm transition">
                    Copy MT5
                  </button>
                </div>
              </div>
            \`;
          }).join('');
        }

        // 2. Render Full Table View (Alternative)
        const tableBody = document.getElementById('mtfMatrixBody');
        if (tableBody) {
          tableBody.innerHTML = order.map((tf) => {
            const r = mtf.timeframes[tf];
            if (!r || !r.entryTiming?.lifecycle) return '';
            const et = r.entryTiming;
            const lc = et.lifecycle;
            const isSelected = tf === currentTf;
            const rowBg = isSelected ? 'bg-amber-400/10 border-l-4 border-l-amber-400' : 'hover:bg-slate-900/70';

            const dirColor = lc.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400';
            const dirIcon = lc.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL';
            const structShort = r.ictStructure?.marketStructure?.includes('UPTREND') ? 'HH+HL' : 'LH+LL';
            const emaShort = r.ictStructure?.ema50And200Filter?.includes('BULLISH')
              ? '<span class="text-emerald-400">Above 50/200</span>'
              : r.ictStructure?.ema50And200Filter?.includes('BEARISH')
              ? '<span class="text-rose-400">Below 50/200</span>'
              : '<span class="text-amber-300">Transition</span>';

            const pnlCellHtml = lc.isActivated
              ? \`<span class="font-black \${lc.floatingPips >= 0 ? 'text-emerald-400' : 'text-rose-400'}">\${lc.pnlStatusText}</span>\`
              : \`<span class="text-amber-300 font-bold leading-relaxed break-words">⏳ \${lc.pnlStatusText}</span>\`;

            return \`
              <tr onclick="switchTimeframe('\${tf}')" class="cursor-pointer transition \${rowBg}">
                <td class="py-2.5 px-2.5 font-extrabold text-white">\${TF_LABELS[tf] || tf.toUpperCase()}</td>
                <td class="py-2.5 px-2.5">
                  <span class="font-black \${dirColor}">\${dirIcon} (\${structShort})</span>
                  <span class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950">\${r.grade} \${r.probability}%</span>
                </td>
                <td class="py-2.5 px-2.5 font-bold">\${emaShort}</td>
                <td class="py-2.5 px-2.5"><span class="px-2 py-0.5 rounded text-[10px] \${activationBadgeStyle(lc.activationState)}">\${lc.statusBadge}</span></td>
                <td id="mtf-table-pnl-\${tf}" class="py-2.5 px-2.5 bg-slate-900/60 border-x border-slate-800/80">\${pnlCellHtml}</td>
                <td class="py-2.5 px-2.5 font-black text-amber-300 bg-amber-400/10 border-x border-amber-400/20">$\${lc.entryPrice.toFixed(2)}</td>
                <td class="py-2.5 px-2.5 text-rose-400 font-bold">$\${lc.stopLoss.toFixed(2)} <span class="text-[10px] text-rose-300/70">($\${et.riskDollars.toFixed(1)})</span></td>
                <td class="py-2.5 px-2.5 text-emerald-400 font-bold">$\${lc.tp1.toFixed(2)} <span class="text-[10px] text-emerald-300/70">(+\${et.rewardTp1Pips.toFixed(0)}p)</span></td>
                <td class="py-2.5 px-2.5 text-emerald-300 font-extrabold">$\${lc.tp2.toFixed(2)} <span class="text-[10px] text-emerald-200/80">(+\${et.rewardTp2Pips.toFixed(0)}p)</span></td>
                <td class="py-2.5 px-2.5"><span class="text-emerald-400 font-bold">\${r.winRate.toFixed(0)}%</span></td>
                <td class="py-2.5 px-2.5 text-right">
                  <button onclick="event.stopPropagation(); copyTfOrder('\${tf}')" class="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px]">Copy</button>
                </td>
              </tr>
            \`;
          }).join('');
        }

        renderAllHighProbSignalsTable(mtf.allHighProbSignals || []);
        renderHighConfidenceCollapse(mtf.highConfidenceByTf || {});
      }

      // Hero Card & Exact 3-Step M15 Entry Checklist
      const ts = data.tradeSetup;
      const et = ts.entryTiming;
      const lc = et.lifecycle;

      document.getElementById('gradeBadge').textContent = \`\${data.timeframe.toUpperCase()} • GRADE \${data.setupGrade} (\${data.probability}%)\`;
      document.getElementById('activationBadge').textContent = lc.statusBadge;
      document.getElementById('structureTag').textContent = data.ictStructure?.marketStructure || '';

      document.getElementById('lifecycleEntryTag').textContent = \`\${lc.direction} Entry: $\${lc.entryPrice.toFixed(2)}\`;
      document.getElementById('lifecyclePnlBig').textContent = lc.pnlStatusText;
      document.getElementById('lifecycleSubText').textContent = lc.summaryText;

      // Render 3-Step M15 Checklist
      document.getElementById('m15ChecklistContainer').innerHTML = (data.m15Checklist || []).map((item) => {
        const icon = item.passed ? '✅' : '⏳';
        return \`
          <div class="p-2 rounded-lg bg-slate-900/90 border \${item.passed ? 'border-emerald-500/30' : 'border-slate-800'} flex items-start justify-between gap-2 text-xs">
            <div>
              <div class="font-bold text-white">\${icon} \${item.title}</div>
              <div class="mono text-[11px] text-amber-300 mt-0.5">\${item.valueText}</div>
            </div>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-black mono \${item.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}">\${item.passed ? 'CONFIRMED' : 'WAIT'}</span>
          </div>
        \`;
      }).join('');

      // Entry Cards & Hard SL (1.5x ATR dynamic rule) + 1:2 TP1 + 1:3 TP2
      document.getElementById('marketEntryVal').textContent = '$' + et.marketEntry.toFixed(2);
      document.getElementById('waitEntryVal').textContent = '$' + lc.entryPrice.toFixed(2);
      document.getElementById('marketEntryStatusTag').textContent = et.isLate ? '⚠️ LATE CHASE' : 'SPOT NOW';
      document.getElementById('waitOrderTypeTag').textContent = et.recommendedOrderType;

      document.getElementById('setupSl').textContent = '$' + lc.stopLoss.toFixed(2);
      document.getElementById('setupSlPips').textContent = '1.5x ATR SL: -' + et.riskPips.toFixed(0) + ' pips ($' + et.riskDollars.toFixed(2) + '/oz)';
      document.getElementById('setupTp1').textContent = '$' + lc.tp1.toFixed(2);
      document.getElementById('setupTp1Pips').textContent = '+' + et.rewardTp1Pips.toFixed(0) + ' pips (1:2 • 50% + BE)';
      document.getElementById('setupTp2').textContent = '$' + lc.tp2.toFixed(2);
      document.getElementById('setupTp2Pips').textContent = '+' + et.rewardTp2Pips.toFixed(0) + ' pips (1:3 H4 Runner)';

      updateRiskCalc();

      // Rule 3: Quantitative 100-Point Scoring Matrix
      if (data.scoringMatrix) {
        const qm = data.scoringMatrix;
        const qBadge = document.getElementById('quantScoreBadge');
        qBadge.textContent = qm.totalScore + '/100 PTS';
        qBadge.className = 'mono text-xs font-black px-2.5 py-1 rounded ' +
          (qm.totalScore >= 90 ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300');

        const vBanner = document.getElementById('quantVerdictBanner');
        if (qm.isTradeable) {
          vBanner.textContent = '🎯 90%+ QUALIFIED: ' + qm.actionVerdict;
          vBanner.className = 'p-2.5 rounded-xl border text-center font-black mono text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm';
        } else {
          vBanner.textContent = '✋ STAND ASIDE: ' + qm.actionVerdict + ' (' + qm.totalScore + '/100 PTS)';
          vBanner.className = 'p-2.5 rounded-xl border text-center font-black mono text-xs bg-rose-500/20 text-rose-300 border-rose-500/40';
        }

        const p = qm.pillars;
        const pList = [p.macroNews, p.marketStructure, p.emaRsiFilter, p.killzoneSweep, p.m15CandleFvg];
        document.getElementById('quantPillarsContainer').innerHTML = pList.map((item) => {
          const passPill = item.passed
            ? '<span class="px-2 py-0.5 rounded text-[10px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">+' + item.awardedPoints + '/' + item.maxPoints + ' PTS</span>'
            : '<span class="px-2 py-0.5 rounded text-[10px] font-black mono bg-rose-500/20 text-rose-300 border border-rose-500/30">+' + item.awardedPoints + '/' + item.maxPoints + ' PTS</span>';
          return \`
            <div class="p-2.5 rounded-xl bg-slate-900/90 border \${item.passed ? 'border-slate-800' : 'border-rose-500/20'} space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-bold text-white">\${item.name}</span>
                \${passPill}
              </div>
              <p class="text-[11px] text-slate-400">\${item.notes}</p>
            </div>
          \`;
        }).join('');
      }

      // Rule 5: 20-Trade Rule-Adherence Journal Rendering
      if (data.journal) {
        renderJournalTable(data.journal);
      }

      // Chart Update (Clean 50 EMA & 200 EMA Only)
      document.getElementById('chartTfLabel').textContent = data.timeframe.toUpperCase();
      const candles = [], ema50 = [], ema200 = [];
      data.series.forEach((pt) => {
        candles.push({ time: pt.time, open: pt.open, high: pt.high, low: pt.low, close: pt.close });
        if (pt.ema50 !== null) ema50.push({ time: pt.time, value: pt.ema50 });
        if (pt.ema200 !== null) ema200.push({ time: pt.time, value: pt.ema200 });
      });

      candleSeries.setData(candles);
      ema50Series.setData(ema50);
      ema200Series.setData(ema200);
      lastCandleBar = candles[candles.length - 1] ? { ...candles[candles.length - 1] } : null;

      const minTime = candles[0]?.time ?? 0;
      const markers = data.historicalSignals
        .filter((s) => s.time >= minTime)
        .sort((a, b) => a.time - b.time)
        .map((s) => ({
          time: s.time,
          position: s.type === 'BUY' ? 'belowBar' : 'aboveBar',
          color: s.type === 'BUY' ? '#10b981' : '#f43f5e',
          shape: s.type === 'BUY' ? 'arrowUp' : 'arrowDown',
          text: \`\${s.grade} \${s.type}\`,
        }));
      candleSeries.setMarkers(markers);
      drawSetupPriceLines(ts, data.liquidityLevels);
    }

    function updateRiskCalc() {
      if (!currentAnalysis) return;
      const balance = parseFloat(document.getElementById('calcBalance').value) || 1000;
      let riskPct = parseFloat(document.getElementById('calcRiskPct').value) || 1.0;
      if (riskPct > 2.0) {
        riskPct = 2.0;
        document.getElementById('calcRiskPct').value = '2.0';
      }
      const riskUsd = balance * (riskPct / 100);
      const et = currentAnalysis.tradeSetup.entryTiming;
      const slDollars = Math.max(1.0, et.riskDollars || 4.0);

      // 1 Standard Lot = 100 oz ($1 move = $100)
      const lots = Math.max(0.01, Math.round((riskUsd / (slDollars * 100)) * 100) / 100);
      const tp1Usd = Math.round(riskUsd * 2);
      const tp2Usd = Math.round(riskUsd * 3);

      document.getElementById('calcRiskUsd').textContent = '-$' + riskUsd.toFixed(2);
      document.getElementById('calcLots').textContent = lots.toFixed(2) + ' Lots';
      document.getElementById('calcRewardUsd').textContent = \`+$\${tp1Usd} / +$\${tp2Usd}\`;
    }

    let openedCollapseIds = new Set(['page-conf-15m', 'matrix-conf-15m']);

    function saveOpenCollapses() {
      document.querySelectorAll('details[id]').forEach((el) => {
        if (el.open) openedCollapseIds.add(el.id);
        else openedCollapseIds.delete(el.id);
      });
    }

    function onCollapseToggle(el) {
      if (!el || !el.id) return;
      if (el.open) openedCollapseIds.add(el.id);
      else openedCollapseIds.delete(el.id);
    }

    function toggleAllCollapses(expand) {
      document.querySelectorAll('details[id]').forEach((el) => {
        el.open = expand;
        if (expand) openedCollapseIds.add(el.id);
        else openedCollapseIds.delete(el.id);
      });
    }

    const TF_COLLAPSE_TITLES = {
      '15m': '15Mins (15m)',
      '1m': '1Min (1m)',
      '5m': '5Mins (5m)',
      '30m': '30Mins (30m)',
      '1h': '1Hour (1h)',
      '4h': '4Hours (4h)',
    };

    function renderHighConfidenceCollapse(highConfidenceByTf) {
      const container = document.getElementById('highConfidenceCollapseContainer');
      const matrixContainer = document.getElementById('matrixConfidentCardsContainer');
      if (!container && !matrixContainer) return;

      const order = ['15m', '5m', '1m', '30m', '1h', '4h'];

      const generateHtmlForPrefix = (prefix) => {
        return order.map((tf, index) => {
          const sigs = highConfidenceByTf[tf] || [];
          const title = TF_COLLAPSE_TITLES[tf] || tf.toUpperCase();
          const detailId = prefix + '-conf-' + tf;
          const isOpen = openedCollapseIds.has(detailId) || (index === 0 && !openedCollapseIds.has('init-done'));

          if (sigs.length === 0) {
            return \`
              <details id="\${detailId}" \${isOpen ? 'open' : ''} ontoggle="onCollapseToggle(this)" class="group rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <summary class="cursor-pointer p-3 sm:p-4 flex items-center justify-between gap-2 select-none bg-slate-900/90 group-open:bg-slate-800/80 hover:bg-slate-800/50 transition">
                  <div class="flex items-center gap-2.5">
                    <span class="font-extrabold text-white text-sm mono">\${title}</span>
                    <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400">0 Entries (85%+)</span>
                  </div>
                  <span class="text-xs text-slate-500">None Available</span>
                </summary>
                <div class="p-3 text-xs text-slate-500 text-center mono">No 85%+ entries in current window</div>
              </details>
            \`;
          }

          const cards = sigs.slice(0, 5).map((s, idx) => {
            const dt = new Date(s.time * 1000).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            const isB = s.type === 'BUY';
            const typeCls = isB ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
            const isAct = s.outcome === 'ACTIVE';
            const curBid = lastKnownBid || s.entry;
            const diff = isB ? curBid - s.entry : s.entry - curBid;
            const pips = diff * 10;
            const isProf = diff >= 0;
            const sign = isProf ? '+' : '';
            const outBadge = isAct
              ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/40 animate-pulse">⚡ ACTIVE</span>'
              : s.outcome === 'TP2_HIT'
              ? '<span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/25 text-emerald-300 font-bold">🏆 TP2 (1:3)</span>'
              : s.outcome === 'TP1_HIT'
              ? '<span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 font-bold">✅ TP1 (1:2)</span>'
              : s.outcome === 'BE_EXIT'
              ? '<span class="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 font-bold">🛡️ BE</span>'
              : '<span class="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold">❌ SL</span>';

            const copyTxt = \`\${s.type} \${tf.toUpperCase()} @ \${s.entry} | SL: \${s.stopLoss} | TP1: \${s.tp1} | TP2: \${s.tp2}\`;

            const pnlDisplayHtml = isAct
              ? \`<div class="conf-live-pnl-\${tf}-\${s.time}">
                   <span class="px-2 py-0.5 rounded font-black mono text-[10px] border \${isProf ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}">
                     \${isProf ? '🟢' : '🔴'} RUNNING: \${sign}$\${Math.abs(diff).toFixed(2)}/oz (\${sign}\${pips.toFixed(1)}p)
                   </span>
                 </div>\`
              : \`<div class="conf-live-pnl-\${tf}-\${s.time}"><span class="text-[11px] text-slate-400">P&L: <strong class="\${(s.pnlDollarsPerOz || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}">\${(s.pnlDollarsPerOz || 0) >= 0 ? '+' : ''}$\${(s.pnlDollarsPerOz || 0).toFixed(2)}</strong></span></div>\`;

            return \`
              <div class="p-3 rounded-xl bg-slate-950/80 border \${isAct ? 'border-sky-500/40 bg-sky-950/20' : 'border-slate-800/90'} hover:border-amber-400/40 transition flex flex-col justify-between">
                <div class="flex items-center justify-between gap-1 mb-2">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-1.5 py-0.5 rounded text-[11px] font-black mono \${typeCls}">\${s.type} #\${idx + 1}</span>
                    <span class="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">\${s.grade} \${s.probability || s.confidence}%</span>
                    <span class="text-[11px] text-slate-400">\${dt}</span>
                  </div>
                  \${outBadge}
                </div>

                <div class="mono text-xs space-y-1 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 mb-2">
                  <div class="text-amber-300 font-black">• <strong>entry</strong>: \${s.entry.toFixed(2)}</div>
                  <div class="text-rose-400 font-semibold">• <strong>stop loss</strong>: \${s.stopLoss.toFixed(2)}</div>
                  <div class="text-emerald-400 font-semibold">• <strong>tp1</strong>: \${s.tp1.toFixed(2)}</div>
                  <div class="text-emerald-300 font-extrabold">• <strong>tp2</strong>: \${s.tp2.toFixed(2)}</div>
                </div>

                <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                  \${pnlDisplayHtml}
                  <button onclick="navigator.clipboard.writeText('\${copyTxt}'); showToast('Copied: \${copyTxt}');" class="px-2 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 text-[10px] font-bold transition">
                    Copy
                  </button>
                </div>
              </div>
            \`;
          }).join('');

          return \`
            <details id="\${detailId}" \${isOpen ? 'open' : ''} ontoggle="onCollapseToggle(this)" class="group rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-sm">
              <summary class="cursor-pointer p-3 sm:p-4 flex items-center justify-between gap-2 select-none bg-slate-900/90 group-open:bg-slate-850 hover:bg-slate-800/60 transition">
                <div class="flex items-center gap-2.5">
                  <span class="font-black text-amber-300 text-sm mono uppercase">\${title}</span>
                  <span class="px-2 py-0.5 rounded text-[11px] font-black bg-amber-400 text-slate-950">\${sigs.length} Entries (85%+)</span>
                  <span class="hidden sm:inline text-xs text-slate-400 font-sans">• Strict 1:2 / 1:3 R:R</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-amber-400/80 font-bold group-open:hidden">Expand ▶</span>
                  <span class="text-xs text-slate-400 font-bold hidden group-open:inline">Collapse ▼</span>
                </div>
              </summary>
              <div class="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/40">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                  \${cards}
                </div>
              </div>
            </details>
          \`;
        }).join('');
      };

      if (container) container.innerHTML = generateHtmlForPrefix('page');
      if (matrixContainer) matrixContainer.innerHTML = generateHtmlForPrefix('matrix');
      openedCollapseIds.add('init-done');
    }

    function renderAllHighProbSignalsTable(allSignals) {
      const filtered = signalListFilter === '90PLUS'
        ? allSignals.filter((s) => s.probability >= 82 || s.grade === 'A+' || s.grade === 'A')
        : signalListFilter === 'ALL'
        ? allSignals
        : allSignals.filter((s) => s.timeframe === signalListFilter);

      const tbody = document.getElementById('allSignalsTableBody');
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="py-4 text-center text-slate-500">No 90%+ confident signals found in current scan window</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map((s) => {
        const dt = new Date(s.time * 1000).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const isB = s.type === 'BUY';
        const sigCls = isB
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
        const outBadge = s.outcome === 'TP2_HIT'
          ? '<span class="px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 font-bold">🏆 1:3 RUNNER HIT</span>'
          : s.outcome === 'TP1_HIT'
          ? '<span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">✅ 1:2 PARTIAL + BE</span>'
          : s.outcome === 'SL_HIT'
          ? '<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">❌ SL HIT (-1R)</span>'
          : '<span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">⚡ ACTIVE RUNNING</span>';
        const pnlColor = s.pnlDollarsPerOz >= 0 ? 'text-emerald-400' : 'text-rose-400';
        const pnlHtml = s.outcome === 'ACTIVE'
          ? '<span class="px-2 py-0.5 rounded font-black ' + (s.pnlDollarsPerOz >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-rose-500/20 text-rose-300 border border-rose-400/40') + '">' + (s.pnlDollarsPerOz >= 0 ? '+' : '') + '$' + s.pnlDollarsPerOz.toFixed(2) + ' (' + (s.pnlDollarsPerOz * 10).toFixed(0) + 'p)</span>'
          : '<span class="font-bold ' + pnlColor + '">' + (s.pnlDollarsPerOz >= 0 ? '+' : '') + '$' + s.pnlDollarsPerOz.toFixed(2) + '</span>';

        return \`
          <tr onclick="switchTimeframe('\${s.timeframe}')" class="hover:bg-slate-900/70 cursor-pointer transition">
            <td class="py-2.5 px-3 text-slate-300">\${dt}</td>
            <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold uppercase">\${s.timeframe}</span></td>
            <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded font-black \${sigCls}">\${s.type}</span></td>
            <td class="py-2.5 px-3"><span class="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">\${s.grade}</span> <span class="text-white font-bold ml-1">\${s.probability}%</span></td>
            <td class="py-2.5 px-3 font-black text-amber-300 bg-amber-400/10 border-x border-amber-400/20">$\${s.entry.toFixed(2)}</td>
            <td class="py-2.5 px-3 text-rose-400 font-semibold">$\${s.stopLoss.toFixed(2)}</td>
            <td class="py-2.5 px-3 text-emerald-400 font-semibold">$\${s.tp1.toFixed(2)}</td>
            <td class="py-2.5 px-3 text-emerald-300 font-bold">$\${s.tp2.toFixed(2)}</td>
            <td class="py-2.5 px-3 text-slate-300 font-sans">\${s.reason}</td>
            <td class="py-2.5 px-3">\${outBadge}</td>
            <td id="sig-pnl-\${s.timeframe}-\${s.time}" class="py-2.5 px-3 text-right">\${pnlHtml}</td>
          </tr>
        \`;
      }).join('');
    }

    function renderJournalTable(journalEntries) {
      const tbody = document.getElementById('journalTableBody');
      if (!tbody) return;
      if (!journalEntries || journalEntries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" class="py-4 text-center text-slate-500">No journal entries recorded yet</td></tr>';
        return;
      }

      const wins = journalEntries.filter((j) => j.finalOutcome.includes('TP1') || j.finalOutcome.includes('TP2')).length;
      const closed = journalEntries.filter((j) => j.finalOutcome !== 'RUNNING').length;
      const winPct = closed > 0 ? Math.round((wins / closed) * 100) : 0;
      const statsBadge = document.getElementById('journalStatsBadge');
      if (statsBadge) {
        statsBadge.textContent = '20-Trade Win Rate: ' + winPct + '% (' + wins + 'W / ' + (closed - wins) + 'L)';
      }

      tbody.innerHTML = journalEntries.map((j) => {
        const dt = new Date(j.timestamp * 1000).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const isB = j.direction === 'BUY';
        const dirCls = isB ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
        const outBadge = j.finalOutcome.includes('TP2')
          ? '<span class="px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 font-bold">🏆 TP2 (1:3+)</span>'
          : j.finalOutcome.includes('TP1')
          ? '<span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">✅ TP1 (1:2)</span>'
          : j.finalOutcome.includes('BE')
          ? '<span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold">🛡️ BE EXIT</span>'
          : j.finalOutcome.includes('SL')
          ? '<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">❌ SL HIT (-1R)</span>'
          : '<span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">⚡ RUNNING</span>';

        const pnlCls = j.netPnlPerOz >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';

        return \`
          <tr class="hover:bg-slate-900/60 transition">
            <td class="py-2.5 px-3 text-slate-400 font-bold">\${j.tradeNumber}</td>
            <td class="py-2.5 px-3 text-slate-300">\${dt}</td>
            <td class="py-2.5 px-3 uppercase text-amber-300 font-extrabold">\${j.timeframe}</td>
            <td class="py-2.5 px-3 \${dirCls}">\${j.direction}</td>
            <td class="py-2.5 px-3 font-black text-amber-400">\${j.confluenceScore}%</td>
            <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300">YES ✓</span></td>
            <td class="py-2.5 px-3 text-slate-300">\${j.spreadAtEntry.toFixed(1)} pt</td>
            <td class="py-2.5 px-3 text-amber-300 font-bold">$\${j.entryPrice.toFixed(2)}</td>
            <td class="py-2.5 px-3 text-rose-400">$\${j.stopLoss.toFixed(2)}</td>
            <td class="py-2.5 px-3 text-emerald-400">$\${j.tp1.toFixed(2)}</td>
            <td class="py-2.5 px-3 text-emerald-300 font-bold">$\${j.tp2.toFixed(2)}</td>
            <td class="py-2.5 px-3">\${outBadge}</td>
            <td class="py-2.5 px-3 font-black mono text-white">\${j.achievedRr}</td>
            <td class="py-2.5 px-3 text-right \${pnlCls}">\${j.netPnlPerOz >= 0 ? '+' : ''}$\${j.netPnlPerOz.toFixed(2)}</td>
          </tr>
        \`;
      }).join('');
    }

    function copyTfOrder(tf) {
      if (!latestMtfData || !latestMtfData.timeframes[tf]) return;
      const r = latestMtfData.timeframes[tf];
      const et = r.entryTiming;
      const lc = et.lifecycle;
      const text = \`🪙 XAU/USD [\${tf.toUpperCase()}] — 4-CONFLUENCE MASTER SETUP (Grade \${r.grade} • \${r.probability}%)
📊 Structure: \${r.ictStructure?.marketStructure} | \${lc.statusBadge}
📍 Entry: $\${lc.entryPrice.toFixed(2)} (\${et.recommendedOrderType})
🛑 Hard Stop-Loss ($3–$5): $\${lc.stopLoss.toFixed(2)} (-\${et.riskPips.toFixed(0)} pips)
🎯 TP 1 (1:2 RR • Take 50% + Move SL→BE): $\${lc.tp1.toFixed(2)} (+\${et.rewardTp1Pips.toFixed(0)} pips)
🏆 TP 2 (1:3 RR • H4 Liquidity Runner): $\${lc.tp2.toFixed(2)} (+\${et.rewardTp2Pips.toFixed(0)} pips)\`;
      navigator.clipboard.writeText(text);
      showToast(\`Copied \${tf.toUpperCase()} 4-Confluence Setup!\`);
    }

    function filterSignalList(tf) {
      signalListFilter = tf;
      ['90PLUS', 'ALL', '1m', '5m', '15m', '30m', '1h', '4h'].forEach((id) => {
        const btn = document.getElementById('flt-' + id);
        if (!btn) return;
        btn.className = id === tf
          ? 'px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950 shadow-sm'
          : 'px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white';
      });
      if (latestMtfData) renderAllHighProbSignalsTable(latestMtfData.allHighProbSignals || []);
    }

    function switchTimeframe(tf) {
      currentTf = tf;
      ['1m', '5m', '15m', '30m', '1h', '4h'].forEach((id) => {
        const btn = document.getElementById('tf-' + id);
        if (!btn) return;
        btn.className = id === tf
          ? 'px-2.5 py-1.5 rounded-md text-xs font-bold transition-all bg-amber-400 text-slate-950'
          : 'px-2.5 py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white';
      });
      loadSignalData();
    }

    function togglePriceLines() {
      showPriceLines = !showPriceLines;
      document.getElementById('toggleLinesBtn').textContent = 'SL / TP / PDH-PDL Lines: ' + (showPriceLines ? 'ON' : 'OFF');
      if (currentAnalysis) drawSetupPriceLines(currentAnalysis.tradeSetup, currentAnalysis.liquidityLevels);
    }

    function resetChartZoom() {
      priceChart.timeScale().fitContent();
    }

    function showToast(msg) {
      const t = document.getElementById('copyToast');
      t.textContent = msg;
      t.classList.remove('hidden');
      setTimeout(() => t.classList.add('hidden'), 2000);
    }

    function copyValue(elId) {
      const txt = document.getElementById(elId).textContent.replace('$', '').trim();
      navigator.clipboard.writeText(txt);
      showToast('Copied: ' + txt);
    }

    function copyTradeSignal() {
      if (!currentAnalysis) return;
      copyTfOrder(currentAnalysis.timeframe);
    }

    window.addEventListener('DOMContentLoaded', () => {
      initCharts();
      connectRealtimeTickStream();
      loadSignalData();
      setInterval(loadSignalData, 2000);
    });
  </script>
</body>
</html>`;
