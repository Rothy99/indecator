export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>XAU/USD — The 4-Confluence Master Strategy Terminal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/js/lightweight-charts.js"></script>
  <script>
    if (typeof LightweightCharts === 'undefined') {
      document.write('<script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"><\\/script>');
    }
  </script>
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
              <span id="headerSymbolTitle" class="font-extrabold text-sm sm:text-base tracking-tight text-white">XAU/USD MASTER</span>
              <span class="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE 0.8s
              </span>
            </div>
            <span id="sourceBadge" class="text-[10px] sm:text-[11px] text-slate-400 block truncate max-w-[220px] sm:max-w-none">⚡ 4-Confluence V3.0 (Sweep + MSS + FVG CE 50% + H1 EMA) • 1:1.5 & 1:2.5 R:R</span>
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

      <!-- Multi-Asset Switcher + Timeframe Selector + Circuit Breaker + Cloudflare D1 Indicator -->
      <div class="flex items-center justify-between sm:justify-end gap-2 w-full lg:w-auto flex-wrap">
        <!-- Multi-Asset Switcher: Gold & Major Crypto -->
        <div class="inline-flex rounded-lg bg-slate-900 p-0.5 sm:p-1 border border-slate-800 overflow-x-auto gap-0.5">
          <button onclick="switchSymbol('XAUUSD')" id="sym-XAUUSD" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-black transition-all bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
            <span>🪙</span><span>Gold</span>
          </button>
          <button onclick="switchSymbol('BTCUSD')" id="sym-BTCUSD" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-1">
            <span>₿</span><span>BTC</span>
          </button>
          <button onclick="switchSymbol('ETHUSD')" id="sym-ETHUSD" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-1">
            <span>Ξ</span><span>ETH</span>
          </button>
          <button onclick="switchSymbol('SOLUSD')" id="sym-SOLUSD" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-1">
            <span>◎</span><span>SOL</span>
          </button>
        </div>

        <div id="d1DbPill" title="Cloudflare D1 Local SQLite Database (d59c377c-934d-43b9-b00a-dee0c947be28)" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>🗄️ D1 Local: Active</span>
        </div>

        <div id="circuitBreakerPill" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          🛡️ Breaker: 0/2
        </div>

        <!-- Audio Alert Chimes & Keyboard Shortcuts Helper -->
        <button id="soundToggleBtn" onclick="toggleAudio()" class="px-2 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold mono bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1" title="Toggle audio chime alerts (Hotkey: M)">
          <span id="soundIcon">🔊</span>
          <span class="hidden sm:inline" id="soundLabel">Sound ON</span>
        </button>

        <button onclick="toggleHotkeysModal(true)" class="px-2 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold mono bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-300 transition flex items-center gap-1" title="Trading hotkeys cheatsheet (Hotkey: ?)">
          <span>⌨️</span>
          <span class="hidden md:inline">Shortcuts</span>
        </button>

      </div>
    </div>
  </header>

    <main class="max-w-[1600px] w-full mx-auto px-3 sm:px-4 py-2 sm:py-3 flex-1 space-y-3">

    <!-- ========================================================================= -->
    <!-- TIER 1: INSTITUTIONAL MARKET CONTEXT & KILLZONE (PANORAMIC STRIP)          -->
    <!-- ========================================================================= -->
    <section class="panel rounded-xl px-3 sm:px-4 py-2 border-slate-800 bg-slate-950/80 shadow-sm flex flex-wrap items-center justify-between gap-2.5 text-xs">
      <!-- Session Killzone Window (GMT+7 Phnom Penh & UTC) -->
      <div class="flex items-center gap-2 flex-wrap">
        <span id="sessionBadge" class="px-2.5 py-0.5 rounded text-[11px] font-black mono bg-amber-400 text-slate-950">SESSION</span>
        <span id="sessionClock" class="mono text-xs font-bold text-white">--:-- GMT+7 | --:-- UTC</span>
        <span id="sessionActionText" class="text-[11px] text-slate-400 hidden xl:inline border-l border-slate-800 pl-2">Loading session killzone rules...</span>
      </div>

      <!-- Institutional Liquidity Levels (PDH, PDL, Asian High, Asian Low) -->
      <div class="flex items-center gap-1.5 sm:gap-2 mono flex-wrap">
        <div class="bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
          <span class="text-[9px] text-slate-400 uppercase font-bold">PDH</span>
          <span id="lvlPdh" class="text-xs font-black text-rose-300">$----</span>
        </div>
        <div class="bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
          <span class="text-[9px] text-slate-400 uppercase font-bold">PDL</span>
          <span id="lvlPdl" class="text-xs font-black text-emerald-300">$----</span>
        </div>
        <div class="bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
          <span class="text-[9px] text-amber-400/80 uppercase font-bold">Asian H</span>
          <span id="lvlAsianHigh" class="text-xs font-black text-amber-300">$----</span>
        </div>
        <div class="bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
          <span class="text-[9px] text-amber-400/80 uppercase font-bold">Asian L</span>
          <span id="lvlAsianLow" class="text-xs font-black text-amber-300">$----</span>
        </div>
      </div>

      <!-- Macro News Guard & MT5 Spread Buffer -->
      <div class="flex items-center gap-2">
        <span id="newsStatusBadge" class="px-2 py-0.5 rounded text-[10px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">NEWS CLEAR</span>
        <span id="spreadNoticeBox" class="text-[11px] mono text-emerald-400 font-bold hidden sm:inline">Spread: -- pt</span>
        <span id="newsStatusNote" class="hidden"></span>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- TIER 2: THE MAIN TRADING DESK (2-COLUMN UNIFIED FLOW)                      -->
    <!-- Left: 6-TF Ribbon + Lightweight Chart + 3-Step Strategy & Scoring Matrix  -->
    <!-- Right: Complete Active Execution Ticket (Hero Banner + Risk Calculator)  -->
    <!-- ========================================================================= -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">

      <!-- LEFT COLUMN: CHART & CONFLUENCE ANALYSIS (~65% WIDTH) -->
      <div class="xl:col-span-7 2xl:col-span-8 space-y-4">

        <!-- 6-Timeframe Interactive Ribbon (Top of Chart) -->
        <div id="mtfEasyContainer" class="panel rounded-2xl p-3.5 space-y-2.5">
          <div class="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
            <span class="font-extrabold uppercase tracking-wider text-[11px] text-amber-300 flex items-center gap-2">
              <span>⚡ Multi-Timeframe Status Strip</span>
              <span class="text-[10px] text-slate-400 font-normal hidden sm:inline">(Click any chip to switch active chart & setup)</span>
            </span>
            <span class="mono text-[10px] text-slate-400 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Real-Time P&L
            </span>
          </div>
          <div id="mtfEasyStripContainer" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <!-- Populated dynamically with 6 sleek interactive chips -->
          </div>
        </div>

        <!-- Interactive Lightweight Chart -->
        <div class="panel rounded-2xl p-4 flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div class="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
              <span class="font-extrabold text-white flex items-center gap-2">
                <span id="chartTfLabel" class="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black mono text-xs">15M</span>
                <span>Institutional 50/200 EMA & Key Levels</span>
              </span>
              <span class="flex items-center gap-1.5 text-purple-400 font-bold mono text-[11px]">
                <span class="w-3 h-0.5 bg-purple-400 inline-block"></span>50 EMA (Slope)
              </span>
              <span class="flex items-center gap-1.5 text-sky-400 font-bold mono text-[11px]">
                <span class="w-3 h-0.5 bg-sky-400 inline-block"></span>200 EMA (Macro)
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="togglePriceLines()" id="toggleLinesBtn" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 transition hover:bg-emerald-500/25">
                SL / TP / PDH-PDL Lines: ON
              </button>
              <button onclick="resetChartZoom()" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition">
                Fit Chart
              </button>
            </div>
          </div>
          <div id="priceChart" class="w-full h-[360px] sm:h-[450px] rounded-xl overflow-hidden bg-slate-950/70 border border-slate-900"></div>
        </div>

        <!-- Strategy Confluence & 100-Point Quantitative Matrix (Collapsible Clean Bar) -->
        <details id="confluenceDetails" class="panel rounded-xl p-3 sm:p-3.5 border-slate-800 space-y-2.5 group transition-all">
          <summary class="flex items-center justify-between cursor-pointer list-none select-none">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[10px] font-black mono bg-amber-400 text-slate-950 uppercase">V3.0 STRATEGY</span>
              <span class="text-xs font-extrabold text-white">4-Confluence V3.0 Checklist & 100-Point Quality Matrix</span>
              <span class="text-[10px] text-slate-400 hidden sm:inline">(A+ 90/100 · 7 Pillars · 0.25% Max Risk)</span>
            </div>
            <div class="flex items-center gap-2">
              <span id="quantScoreBadge" class="mono text-xs font-black px-2.5 py-0.5 rounded bg-amber-400 text-slate-950">--/100 PTS</span>
              <span class="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </div>
          </summary>
          <div class="pt-2.5 border-t border-slate-800/80 space-y-3">
            <div id="quantVerdictBanner" class="p-2 rounded-xl border text-center font-black mono text-xs bg-slate-900 border-slate-700 text-slate-300">
              EVALUATING 100-POINT MATRIX...
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <!-- 3-Step Strategy Checklist -->
              <div class="space-y-2">
                <div class="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  🎯 3-Step Strategy Checklist
                </div>
                <div id="m15ChecklistContainer" class="space-y-1.5">
                  <!-- Populated dynamically -->
                </div>
              </div>
              <!-- Quantitative 100-Point Scoring Matrix -->
              <div class="space-y-2">
                <div class="text-[11px] font-extrabold uppercase tracking-wider text-white">
                  ⚖️ Scoring Matrix Pillars
                </div>
                <div id="quantPillarsContainer" class="space-y-1.5">
                  <!-- Populated dynamically -->
                </div>
              </div>
            </div>
          </div>
        </details>

      </div>

      <!-- RIGHT COLUMN: THE HERO EXECUTION TICKET (~35% WIDTH) -->
      <div class="xl:col-span-5 2xl:col-span-4 space-y-4">

        <section id="heroBanner" class="panel rounded-2xl p-4 sm:p-5 banner-wait transition-all space-y-4 border-2 border-amber-500/40 shadow-xl shadow-amber-500/5">
          <!-- Execution Ticket Header -->
          <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-3">
            <div class="flex items-center gap-2">
              <span id="gradeBadge" class="px-2.5 py-1 rounded-md text-xs font-black mono bg-amber-400 text-slate-950 shadow-sm">GRADE --</span>
              <span id="activationBadge" class="px-2.5 py-1 rounded-md text-xs font-black mono bg-slate-900 text-amber-300 border border-amber-500/40">
                STATUS
              </span>
            </div>
            <span id="structureTag" class="mono text-[11px] font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">--</span>
          </div>

          <!-- Big Live Position Status / Floating P&L -->
          <div id="liveLifecycleBox" class="p-3.5 rounded-xl bg-slate-950/95 border-2 border-slate-700 space-y-2 shadow-inner">
            <div class="flex items-center justify-between">
              <span id="lifecycleTitle" class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">ENTRY EXECUTION STATE</span>
              <span id="lifecycleEntryTag" class="mono text-xs font-bold text-white">Entry: $----.--</span>
            </div>
            <div id="lifecyclePnlBig" class="mono text-2xl sm:text-3xl font-black text-amber-300">--</div>
            <p id="lifecycleSubText" class="text-xs text-slate-300">--</p>

            <!-- Visual Target Progress Bar (Entry -> TP1 -> TP2 / SL) -->
            <div id="tradeProgressBarWrap" class="pt-2 border-t border-slate-800/80 space-y-1.5 hidden">
              <div class="flex items-center justify-between text-[10px] mono">
                <span id="progSlVal" class="text-rose-400 font-bold">SL: $--</span>
                <span id="progEntryVal" class="text-amber-300 font-black">Entry: $--</span>
                <span id="progTp1Val" class="text-emerald-400 font-bold">TP1: $--</span>
                <span id="progTp2Val" class="text-emerald-300 font-extrabold">TP2: $--</span>
              </div>
              <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex border border-slate-800 relative">
                <div id="tradeProgressBar" class="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300" style="width: 0%"></div>
              </div>
              <div class="flex items-center justify-between text-[9px] text-slate-400 font-bold">
                <span id="progDistSl">-- pt to SL</span>
                <span id="progStatusText" class="text-amber-300 font-extrabold">Progress: 0%</span>
                <span id="progDistTp1">-- pt to TP1</span>
              </div>
            </div>
          </div>

          <!-- Dual Entry Options (Option A: Market Price vs Option B: FVG PRO Retest) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div id="marketEntryCard" onclick="copyValue('marketEntryVal')" class="cursor-pointer p-3 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-500 transition">
              <div class="flex items-center justify-between">
                <span id="marketCardTitle" class="text-[10px] font-extrabold uppercase text-slate-300">Option A: Market</span>
                <span id="marketEntryStatusTag" class="px-1.5 py-0.5 rounded text-[9px] font-black mono bg-slate-800 text-slate-300">--</span>
              </div>
              <div id="marketEntryVal" class="mono text-xl sm:text-2xl font-black text-white mt-1">$----.--</div>
              <div id="marketEntryNote" class="text-[10px] text-slate-400 mt-0.5">Live MT5 Spot Price</div>
            </div>

            <div id="waitEntryCard" onclick="copyValue('waitEntryVal')" class="cursor-pointer p-3 rounded-xl bg-amber-500/10 border-2 border-amber-400/70 hover:border-amber-300 transition">
              <div class="flex items-center justify-between">
                <span id="waitCardTitle" class="text-[10px] font-extrabold uppercase text-amber-300">Option B: FVG Limit</span>
                <span id="waitOrderTypeTag" class="px-1.5 py-0.5 rounded text-[9px] font-black mono bg-amber-400 text-slate-950">LIMIT / RETEST</span>
              </div>
              <div id="waitEntryVal" class="mono text-xl sm:text-2xl font-black text-amber-300 mt-1">$----.--</div>
              <div id="waitEntryNote" class="text-[10px] text-amber-200/80 mt-0.5">Retest to CE 50%</div>
            </div>
          </div>

          <!-- Precision Coordinates: Hard SL, TP1 (1:2 R:R), TP2 (1:3 R:R) -->
          <div class="space-y-2">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Execution Coordinates</span>
              <span class="text-[9px] text-slate-500 font-normal">Click any value to copy</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div onclick="copyValue('setupSl')" class="cursor-pointer p-2.5 rounded-xl bg-rose-950/35 border border-rose-500/45 hover:border-rose-400 transition">
                <span class="text-[9px] font-bold uppercase text-rose-300 block">🛑 Hard SL</span>
                <div id="setupSl" class="mono text-base sm:text-lg font-black text-rose-400 mt-0.5">$----.--</div>
                <span id="setupSlPips" class="mono text-[10px] text-rose-300/80 block leading-tight">Risk: -- pt</span>
              </div>

              <div onclick="copyValue('setupTp1')" class="cursor-pointer p-2.5 rounded-xl bg-emerald-950/35 border border-emerald-500/45 hover:border-emerald-400 transition">
                <span class="text-[9px] font-bold uppercase text-emerald-300 block">🎯 TP 1 (1:1.5)</span>
                <div id="setupTp1" class="mono text-base sm:text-lg font-black text-emerald-400 mt-0.5">$----.--</div>
                <span id="setupTp1Pips" class="mono text-[10px] text-emerald-300/80 block leading-tight">+-- pt (BE)</span>
              </div>

              <div onclick="copyValue('setupTp2')" class="cursor-pointer p-2.5 rounded-xl bg-emerald-950/55 border border-emerald-400/60 hover:border-emerald-300 transition">
                <span class="text-[9px] font-bold uppercase text-emerald-200 block">🏆 TP 2 (1:2.5)</span>
                <div id="setupTp2" class="mono text-base sm:text-lg font-black text-emerald-300 mt-0.5">$----.--</div>
                <span id="setupTp2Pips" class="mono text-[10px] text-emerald-200/90 block leading-tight">+-- pt (Runner)</span>
              </div>
            </div>
          </div>

          <!-- Strict 1% Risk Calculator (MT5 Lot Size Sizer) -->
          <div class="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-2">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>⚖️ Strict 1% Risk Calculator</span>
              <span class="text-[9px] text-amber-400 mono font-bold">Rule 4: Never >2%</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label class="text-[9px] text-slate-400 font-bold block">Account Equity ($)</label>
                <input id="calcBalance" type="number" value="1000" oninput="updateRiskCalc()" class="w-full mt-0.5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-bold mono text-xs" />
              </div>
              <div>
                <label class="text-[9px] text-slate-400 font-bold block">Risk % (Max 2%)</label>
                <input id="calcRiskPct" type="number" value="1.0" max="2.0" step="0.25" oninput="updateRiskCalc()" class="w-full mt-0.5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-bold mono text-xs" />
              </div>
            </div>

            <!-- Quick Equity & Risk Presets -->
            <div class="flex items-center gap-1 pt-1 overflow-x-auto pb-0.5 text-[10px]">
              <span class="text-[9px] text-slate-500 uppercase font-bold mr-0.5">Preset:</span>
              <button type="button" onclick="setEquityPreset(500)" id="preset-eq-500" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold mono border border-slate-800">$500</button>
              <button type="button" onclick="setEquityPreset(1000)" id="preset-eq-1000" class="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-black mono border border-amber-400/40">$1K</button>
              <button type="button" onclick="setEquityPreset(5000)" id="preset-eq-5000" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold mono border border-slate-800">$5K</button>
              <button type="button" onclick="setEquityPreset(10000)" id="preset-eq-10000" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold mono border border-slate-800">$10K</button>
              <span class="text-slate-700 mx-0.5">|</span>
              <button type="button" onclick="setRiskPreset(0.25)" id="preset-rk-025" class="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black mono border border-amber-400">0.25% (V3.0)</button>
              <button type="button" onclick="setRiskPreset(0.5)" id="preset-rk-05" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold mono border border-slate-800">0.5%</button>
              <button type="button" onclick="setRiskPreset(1.0)" id="preset-rk-10" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold mono border border-slate-800">1.0%</button>
              <button type="button" onclick="setRiskPreset(2.0)" id="preset-rk-20" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-rose-300 font-bold mono border border-slate-800">2.0%</button>
            </div>

            <div class="grid grid-cols-3 gap-1.5 text-center text-xs pt-1">
              <div class="p-1 rounded bg-slate-900 border border-slate-800">
                <span class="text-[8px] text-slate-400 uppercase block">1R Risk</span>
                <span id="calcRiskUsd" class="mono text-[11px] font-bold text-rose-400">-$2.50</span>
              </div>
              <div class="p-1 rounded bg-amber-400/15 border border-amber-400/40">
                <span class="text-[8px] text-amber-300 uppercase block">MT5 Lots</span>
                <span id="calcLots" class="mono text-[11px] font-black text-amber-300">0.01 Lots</span>
              </div>
              <div class="p-1 rounded bg-slate-900 border border-slate-800">
                <span class="text-[8px] text-slate-400 uppercase block">1:1.5 / 1:2.5 Profit</span>
                <span id="calcRewardUsd" class="mono text-[11px] font-bold text-emerald-400">+$3.75 / +$6.25</span>
              </div>
            </div>
          </div>

          <!-- Dual 1-Click Copy Actions (Full Setup + Fast MT5 One-Liner) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onclick="copyTradeSignal()" class="py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 transition shadow-lg shadow-amber-400/20 active:scale-[0.99] flex items-center justify-center gap-1.5">
              <span>📋 Copy Setup</span>
            </button>
            <button onclick="copyFastOrder()" class="py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-400/50 transition active:scale-[0.99] flex items-center justify-center gap-1.5" title="Copy compact MT5 order syntax (Hotkey: C)">
              <span>⚡ Fast MT5 Format</span>
            </button>
          </div>
        </section>

      </div>

    </div>

    <!-- ========================================================================= -->
    <!-- TIER 3: UNIFIED MULTI-TIMEFRAME & TRADE HISTORY HUB (CLEAN TABBED DRAWER)  -->
    <!-- All-TF Matrix Grid • MTF Table • 85%+ Setups • Signals Log • 20-Trd Journal-->
    <!-- ========================================================================= -->
    <section class="panel rounded-2xl p-4 sm:p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 class="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <span>Historical & Multi-Timeframe Analysis Hub</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Access the 6-TF Matrix, 85%+ high-confidence setups, activated signals log, and 20-trade discipline journal.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <div class="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 flex-wrap gap-1">
            <button id="btnViewTable" onclick="setMtfView('table')" class="px-3 py-1.5 rounded-lg text-xs font-black bg-amber-400 text-slate-950 transition shadow-sm">
              📊 Multi-TF Table
            </button>
            <button id="btnViewGrid" onclick="setMtfView('grid')" class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">
              🔲 6-TF Grid
            </button>
            <button id="btnViewConfident" onclick="setMtfView('confident')" class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">
              ⭐ 85%+ Setups
            </button>
            <button id="btnViewSignals" onclick="setMtfView('signals')" class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">
              📜 Active Entry Log
            </button>
            <button id="btnViewJournal" onclick="setMtfView('journal')" class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">
              📘 D1 Trade History
            </button>
            <button id="btnViewFeed" onclick="setMtfView('feed')" class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">
              ⚡ Blotter Feed
            </button>
            <!-- Hidden easy button preserved for backward compatibility -->
            <button id="btnViewEasy" onclick="setMtfView('grid')" style="display:none"></button>
          </div>
          <span id="mtfMasterSummary" class="text-xs text-slate-300 font-semibold hidden lg:inline">--</span>
          <span id="mtfMasterBadge" class="px-2.5 py-1 rounded-md text-xs font-black mono bg-slate-800 text-amber-300">--</span>
        </div>
      </div>

            <!-- Tab Pane 1: Multi-Timeframe Alignment Table (Default Primary Table View) -->
      <div id="mtfTableContainer" data-scroll-key="mtf-table-wrap" onscroll="onInnerScroll(this)" class="overflow-x-auto rounded-xl border border-slate-800/80">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 uppercase text-[11px] bg-slate-950/70">
              <th class="py-2.5 px-3">Timeframe</th>
              <th class="py-2.5 px-3">Structure & Grade</th>
              <th class="py-2.5 px-3">50 & 200 EMA</th>
              <th class="py-2.5 px-3">Activation Status</th>
              <th class="py-2.5 px-3 bg-slate-900/90 border-x border-slate-800">Live P&L or Wait Distance</th>
              <th class="py-2.5 px-3 text-amber-300 font-extrabold bg-amber-400/10 border-x border-amber-400/20">📍 Entry Price</th>
              <th class="py-2.5 px-3">Structural SL (+0.2x ATR)</th>
              <th class="py-2.5 px-3">TP 1 (1:1.5 • 50% + BE)</th>
              <th class="py-2.5 px-3">TP 2 (1:2.5 • Runner)</th>
              <th class="py-2.5 px-3">Win Rate</th>
              <th class="py-2.5 px-3 text-right">Copy</th>
            </tr>
          </thead>
          <tbody id="mtfMatrixBody" class="divide-y divide-slate-800/70 mono">
            <!-- Populated dynamically -->
          </tbody>
        </table>
      </div>

      <!-- Tab Pane 2: 6-Timeframe Responsive Cards Grid -->
      <div id="mtfGridContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3 hidden">
        <!-- Populated dynamically with responsive cards -->
      </div>

      <!-- Tab Pane 3: ⭐ 85%+ High-Confidence Setups per Timeframe -->
      <div id="mtfConfidentContainer" class="space-y-3 hidden">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
          <span class="text-slate-300 font-bold">⭐ All 85%+ High-Confidence Entries Across 6 Timeframes:</span>
          <div class="flex gap-2">
            <button onclick="toggleAllCollapses(true)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition">Expand All</button>
            <button onclick="toggleAllCollapses(false)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition">Collapse All</button>
          </div>
        </div>
        <div id="highConfidenceCollapseContainer" class="space-y-3">
          <!-- Populated dynamically with collapsible timeframes -->
        </div>
        <div id="matrixConfidentCardsContainer" class="space-y-2.5 hidden">
          <!-- Backup container populated dynamically -->
        </div>
      </div>

      <!-- Tab Pane 4: Active Timeframe Entry Logs & Real-Time Orders -->
      <div id="tabSignalsContainer" class="space-y-3 hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
          <div>
            <p class="text-xs text-slate-300 font-bold">
              Active Timeframe Entry Logs & Live Confluence Triggers
            </p>
            <p class="text-[11px] text-slate-400">
              Verified historical & live signals across all timeframes with Hard Structural SL, 1:1.5 & 1:2.5 targets.
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
        <div data-scroll-key="all-signals-table-wrap" onscroll="onInnerScroll(this)" class="overflow-x-auto rounded-xl border border-slate-800/60">
          <table class="w-full text-left border-collapse text-xs min-w-[800px] sm:min-w-full">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 uppercase text-[11px] bg-slate-950/70">
                <th class="py-2.5 px-3">Time</th>
                <th class="py-2.5 px-3">TF</th>
                <th class="py-2.5 px-3">Signal</th>
                <th class="py-2.5 px-3">Grade</th>
                <th class="py-2.5 px-3 text-amber-300 font-extrabold bg-amber-400/10 border-x border-amber-400/20">📍 Entry Price</th>
                <th class="py-2.5 px-3 text-rose-400">Structural SL (+0.2x ATR)</th>
                <th class="py-2.5 px-3 text-emerald-400">TP 1 (1:1.5 • 50% + BE)</th>
                <th class="py-2.5 px-3 text-emerald-300">TP 2 (1:2.5 • Runner)</th>
                <th class="py-2.5 px-3">Confluence Trigger</th>
                <th class="py-2.5 px-3">Outcome</th>
                <th class="py-2.5 px-3 text-right">Net Move</th>
                <th class="py-2.5 px-3 text-center">Copy</th>
              </tr>
            </thead>
            <tbody id="allSignalsTableBody" class="divide-y divide-slate-800/60 mono">
              <!-- Populated dynamically -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab Pane 5: Cloudflare D1 Historical Trade Blotter & Rule-Adherence Analytics -->
      <div id="tabJournalContainer" class="space-y-4 hidden">
        <!-- Analytics Performance Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Win Rate</span>
            <div id="d1StatWinRate" class="text-xl font-black text-amber-300 mono mt-1">--%</div>
            <div id="d1StatWinLoss" class="text-[10px] text-slate-400 mt-0.5">-- W / -- L / -- BE</div>
          </div>
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Net P&L</span>
            <div id="d1StatNetPnl" class="text-xl font-black text-emerald-400 mono mt-1">+$0.00</div>
            <div id="d1StatPnlSub" class="text-[10px] text-slate-400 mt-0.5">Net points / oz</div>
          </div>
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Profit Factor</span>
            <div id="d1StatProfitFactor" class="text-xl font-black text-white mono mt-1">--</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Gross Wins / Losses</div>
          </div>
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average R:R</span>
            <div id="d1StatAvgRr" class="text-xl font-black text-white mono mt-1">--</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Target: 1:2.0+</div>
          </div>
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-3 col-span-2 sm:col-span-1">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">D1 Persistence</span>
            <div id="d1StatTotalTrades" class="text-xl font-black text-amber-300 mono mt-1">-- trades</div>
            <div class="text-[10px] text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Cloudflare D1 Local
            </div>
          </div>
        </div>

        <!-- Multi-Criteria Filter and Action Bar -->
        <div class="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2.5">
            <!-- Timeframe Chips -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] font-bold text-slate-400 uppercase mr-1">Timeframe:</span>
              <div class="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 flex-wrap gap-0.5">
                <button onclick="setD1HistoryFilter('timeframe', 'ALL')" id="d1flt-tf-ALL" class="px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950">ALL</button>
                <button onclick="setD1HistoryFilter('timeframe', '1m')" id="d1flt-tf-1m" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M1</button>
                <button onclick="setD1HistoryFilter('timeframe', '5m')" id="d1flt-tf-5m" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M5</button>
                <button onclick="setD1HistoryFilter('timeframe', '15m')" id="d1flt-tf-15m" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M15</button>
                <button onclick="setD1HistoryFilter('timeframe', '30m')" id="d1flt-tf-30m" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M30</button>
                <button onclick="setD1HistoryFilter('timeframe', '1h')" id="d1flt-tf-1h" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">H1</button>
                <button onclick="setD1HistoryFilter('timeframe', '4h')" id="d1flt-tf-4h" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">H4</button>
              </div>
            </div>

            <!-- Grade Filter -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] font-bold text-slate-400 uppercase mr-1">Grade:</span>
              <div class="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 flex-wrap gap-0.5">
                <button onclick="setD1HistoryFilter('grade', 'ALL')" id="d1flt-gr-ALL" class="px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950">ALL</button>
                <button onclick="setD1HistoryFilter('grade', '90PLUS')" id="d1flt-gr-90PLUS" class="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">⭐ 90%+ ONLY</button>
              </div>
            </div>

            <!-- Outcome Filter -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] font-bold text-slate-400 uppercase mr-1">Outcome:</span>
              <div class="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 flex-wrap gap-0.5">
                <button onclick="setD1HistoryFilter('outcome', 'ALL')" id="d1flt-oc-ALL" class="px-2 py-1 rounded text-xs font-black bg-amber-400 text-slate-950">ALL</button>
                <button onclick="setD1HistoryFilter('outcome', 'WINS')" id="d1flt-oc-WINS" class="px-2 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">WINS</button>
                <button onclick="setD1HistoryFilter('outcome', 'TP2_HIT')" id="d1flt-oc-TP2_HIT" class="px-2 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">🏆 TP2</button>
                <button onclick="setD1HistoryFilter('outcome', 'TP1_HIT')" id="d1flt-oc-TP1_HIT" class="px-2 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">✅ TP1</button>
                <button onclick="setD1HistoryFilter('outcome', 'BE_EXIT')" id="d1flt-oc-BE_EXIT" class="px-2 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">🛡️ BE</button>
                <button onclick="setD1HistoryFilter('outcome', 'SL_HIT')" id="d1flt-oc-SL_HIT" class="px-2 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">❌ SL</button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-800/60">
            <!-- Search Filter -->
            <div class="relative flex-1 min-w-[200px]">
              <input type="text" id="d1HistorySearch" oninput="onD1SearchChange(this.value)" placeholder="Search reason, price, or date..." class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 mono">
            </div>

            <!-- Limit and Actions -->
            <div class="flex items-center gap-2 flex-wrap">
              <label class="text-[11px] text-slate-400 font-bold uppercase">Rows:</label>
              <select id="d1HistoryLimitSelect" onchange="setD1HistoryLimit(this.value)" class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 mono">
                <option value="50">50 rows</option>
                <option value="100" selected>100 rows</option>
                <option value="250">250 rows</option>
                <option value="500">500 rows</option>
              </select>

              <button onclick="exportHistoryCsv()" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1.5">
                <span>📥 Export CSV</span>
              </button>
              <button onclick="copyHistorySummary()" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1.5">
                <span>📋 Copy Summary</span>
              </button>
              <button onclick="fetchD1History(true)" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30 transition flex items-center gap-1.5">
                <span>🔄 Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div class="text-[10px] text-slate-500 block sm:hidden font-mono">← Swipe table sideways on mobile →</div>

        <!-- High Performance History Table -->
        <div data-scroll-key="d1-history-table-wrap" onscroll="onInnerScroll(this)" class="overflow-x-auto rounded-xl border border-slate-800/80">
          <table class="w-full text-left border-collapse text-xs min-w-[850px] sm:min-w-full">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 uppercase text-[11px] bg-slate-950/80 sticky top-0">
                <th class="py-2.5 px-3">#</th>
                <th class="py-2.5 px-3">Date & Time</th>
                <th class="py-2.5 px-3">TF</th>
                <th class="py-2.5 px-3">Dir</th>
                <th class="py-2.5 px-3 text-amber-300">Grade & Score</th>
                <th class="py-2.5 px-3 text-amber-300 font-extrabold bg-amber-400/10 border-x border-amber-400/20">📍 Entry Price</th>
                <th class="py-2.5 px-3 text-rose-400">Hard SL</th>
                <th class="py-2.5 px-3 text-emerald-400">TP 1 (1:1.5)</th>
                <th class="py-2.5 px-3 text-emerald-300">TP 2 (1:2.5)</th>
                <th class="py-2.5 px-3">Outcome</th>
                <th class="py-2.5 px-3">Achieved R:R</th>
                <th class="py-2.5 px-3 text-right">Net P&L</th>
                <th class="py-2.5 px-3">Confluence Reason</th>
              </tr>
            </thead>
            <tbody id="journalTableBody" class="divide-y divide-slate-800/60 mono">
              <!-- Populated dynamically from Cloudflare D1 Local SQLite -->
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between text-xs text-slate-500 pt-1 px-1">
          <span id="d1HistoryStatusText">Loading D1 history records...</span>
          <span class="mono text-[11px]">Database: D1 Local SQLite (data/d1_local.sqlite)</span>
        </div>
      </div>

      <!-- Tab Pane 6: Real-Time Institutional Blotter Feed -->
      <div id="tabFeedContainer" class="space-y-3 hidden">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="font-extrabold uppercase text-emerald-400 tracking-wider">⚡ Real-Time Institutional Blotter</span>
            <span class="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">SSE 0.8s Sub-Second Stream</span>
          </div>
          <div class="flex items-center gap-3 text-[11px] text-slate-400">
            <span id="termStreamStatus" class="text-emerald-400 font-bold">● CONNECTED</span>
            <span id="termTickCounter" class="text-amber-300">Ticks: 0</span>
            <button onclick="clearTerminalLogs()" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition">Clear</button>
          </div>
        </div>
        <div id="realtimeTerminalLogs" class="h-64 overflow-y-auto space-y-1 text-[11px] text-slate-300 select-none scrollbar-thin divide-y divide-slate-900/60 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 mono">
          <div class="text-slate-500 py-0.5">[SYSTEM] Terminal initialized. Subscribed to sub-second tick stream...</div>
        </div>
      </div>

    </section>

    <!-- Real-Time Institutional Stream Status Ticker (Compact Footer) -->
    <div class="panel rounded-xl px-3 py-1.5 border-slate-800 bg-slate-950/80 mono text-[11px] flex items-center justify-between text-slate-400">
      <div class="flex items-center gap-2 overflow-hidden">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
        <span class="text-emerald-400 font-bold shrink-0">FEED:</span>
        <span id="latestTickMarquee" class="text-slate-300 truncate">Subscribed to sub-second tick stream...</span>
      </div>
      <div class="flex items-center gap-3 shrink-0 ml-2">
        <button onclick="setMtfView('feed')" class="text-amber-400 hover:text-amber-300 font-bold text-[10px] uppercase">Open Blotter ↗</button>
      </div>
    </div>

  </main>

  <!-- Keyboard Shortcuts Cheatsheet Modal -->
  <div id="hotkeysModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm hidden flex items-center justify-center p-4" onclick="if(event.target===this) toggleHotkeysModal(false)">
    <div class="panel rounded-2xl max-w-md w-full p-5 space-y-4 border-amber-500/40 shadow-2xl shadow-amber-500/10">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <span class="text-lg">⌨️</span>
          <h3 class="text-sm font-extrabold uppercase text-white tracking-wider">Trading Desk Shortcuts</h3>
        </div>
        <button onclick="toggleHotkeysModal(false)" class="text-slate-400 hover:text-white text-base">✕</button>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs mono">
        <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span class="text-slate-300">1 – 6</span>
          <span class="text-amber-300 font-bold">1m – 4h TFs</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span class="text-slate-300">C</span>
          <span class="text-amber-300 font-bold">Copy Setup</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span class="text-slate-300">T</span>
          <span class="text-amber-300 font-bold">Cycle Tabs</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span class="text-slate-300">F</span>
          <span class="text-amber-300 font-bold">Fit Chart</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span class="text-slate-300">L</span>
          <span class="text-amber-300 font-bold">SL/TP Lines</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span class="text-slate-300">M</span>
          <span class="text-amber-300 font-bold">Mute Audio</span>
        </div>
      </div>
      <p class="text-[11px] text-slate-400 text-center">Press <kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300">ESC</kbd> or click outside to close.</p>
    </div>
  </div>

  <div id="copyToast" class="fixed bottom-5 right-5 z-50 hidden px-4 py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-xl">
    Copied!
  </div>

  <script>
    let currentSymbol = localStorage.getItem('selectedSymbol') || 'XAUUSD';
    let currentTf = '15m';
    let signalListFilter = 'ALL';
    let showPriceLines = true;
    let currentAnalysis = null;
    let latestMtfData = null;
    let lastKnownBid = null;
    let lastCandleBar = null;
    let currentEventSource = null;

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

    function getAssetUnitInfo() {
      if (currentSymbol === 'BTCUSD') return { mult: 1, unit: 'pts', asset: 'BTC', label: 'BTC/USD' };
      if (currentSymbol === 'ETHUSD') return { mult: 10, unit: 'pts', asset: 'ETH', label: 'ETH/USD' };
      if (currentSymbol === 'SOLUSD') return { mult: 10, unit: 'pts', asset: 'SOL', label: 'SOL/USD' };
      return { mult: 10, unit: 'pips', asset: 'oz', label: 'XAU/USD' };
    }

    function switchSymbol(sym) {
      if (currentSymbol === sym) return;
      currentSymbol = sym;
      localStorage.setItem('selectedSymbol', sym);
      updateSymbolButtons();
      lastKnownBid = null;
      lastGridSig = '';
      lastTableSig = '';
      lastHighConfSig = '';
      connectRealtimeTickStream();
      loadSignalData();
    }

    function updateSymbolButtons() {
      ['XAUUSD', 'BTCUSD', 'ETHUSD', 'SOLUSD'].forEach((s) => {
        const btn = document.getElementById('sym-' + s);
        if (!btn) return;
        if (s === currentSymbol) {
          btn.className = 'px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-black transition-all bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm';
        } else {
          btn.className = 'px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-1';
        }
      });
      const headerTitle = document.getElementById('headerSymbolTitle');
      if (headerTitle) {
        const map = { XAUUSD: 'XAU/USD MASTER', BTCUSD: 'BTC/USD MASTER', ETHUSD: 'ETH/USD MASTER', SOLUSD: 'SOL/USD MASTER' };
        headerTitle.textContent = map[currentSymbol] || currentSymbol + ' MASTER';
      }
    }

    // Scroll Persistence & DOM Stabilization State
    const savedScrollPositions = new Map();
    let lastGridSig = '';
    let lastTableSig = '';
    let lastHighConfSig = '';

    function onInnerScroll(el) {
      if (!el) return;
      const key = el.getAttribute('data-scroll-key') || el.id;
      if (key) {
        savedScrollPositions.set(key, { top: el.scrollTop, left: el.scrollLeft });
      }
    }

    function saveAllScrollStates() {
      savedScrollPositions.set('__window__', { top: window.scrollY, left: window.scrollX });
      document.querySelectorAll('[data-scroll-key]').forEach((el) => {
        const key = el.getAttribute('data-scroll-key');
        if (key) {
          savedScrollPositions.set(key, { top: el.scrollTop, left: el.scrollLeft });
        }
      });
    }

    function restoreAllScrollStates() {
      const win = savedScrollPositions.get('__window__');
      if (win && (window.scrollY !== win.top || window.scrollX !== win.left)) {
        window.scrollTo(win.left, win.top);
      }
      savedScrollPositions.forEach((pos, key) => {
        if (key === '__window__') return;
        const el = document.querySelector(\`[data-scroll-key="\${key}"]\`) || document.getElementById(key);
        if (el) {
          el.scrollTop = pos.top;
          el.scrollLeft = pos.left;
        }
      });
    }

    let mtfViewMode = 'table';
    let terminalTickCount = 0;

    function appendTerminalLog(type, text) {
      const container = document.getElementById('realtimeTerminalLogs');
      if (!container) return;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const div = document.createElement('div');
      div.className = 'py-0.5 flex items-start gap-2';
      let badgeColor = 'bg-slate-800 text-slate-300';
      if (type.includes('UP')) badgeColor = 'bg-emerald-500/20 text-emerald-400 font-bold';
      else if (type.includes('DN') || type.includes('DOWN')) badgeColor = 'bg-rose-500/20 text-rose-400 font-bold';
      else if (type === 'SIGNAL') badgeColor = 'bg-amber-400/20 text-amber-300 font-bold';
      else if (type === 'STATUS' || type === 'EXEC') badgeColor = 'bg-sky-500/20 text-sky-300 font-bold';

      div.innerHTML = '<span class="text-slate-500">[' + timeStr + ']</span><span class="px-1.5 py-0.2 rounded text-[9px] ' + badgeColor + '">' + type + '</span><span class="text-slate-200">' + text + '</span>';
      container.appendChild(div);
      while (container.childNodes.length > 50) {
        container.removeChild(container.firstChild);
      }
      container.scrollTop = container.scrollHeight;
      terminalTickCount++;
      const countEl = document.getElementById('termTickCounter');
      if (countEl) countEl.textContent = 'Ticks: ' + terminalTickCount;
      const marquee = document.getElementById('latestTickMarquee');
      if (marquee) marquee.textContent = '[' + type + '] ' + text;
    }

    function clearTerminalLogs() {
      const container = document.getElementById('realtimeTerminalLogs');
      if (container) container.innerHTML = '<div class="text-slate-500 py-0.5">[SYSTEM] Terminal logs cleared. Active stream ongoing...</div>';
    }

    try {
      const savedMode = localStorage.getItem('indecator_view_mode');
      if (savedMode && ['table', 'grid', 'confident', 'signals', 'journal', 'feed'].includes(savedMode)) {
        mtfViewMode = savedMode;
      }
    } catch {}

    function setMtfView(mode) {
      if (mode === 'easy') mode = 'table';
      mtfViewMode = mode;
      try { localStorage.setItem('indecator_view_mode', mode); } catch {}
      const tabPanes = {
        grid: document.getElementById('mtfGridContainer'),
        table: document.getElementById('mtfTableContainer'),
        confident: document.getElementById('mtfConfidentContainer'),
        signals: document.getElementById('tabSignalsContainer'),
        journal: document.getElementById('tabJournalContainer'),
        feed: document.getElementById('tabFeedContainer'),
      };
      const tabBtns = {
        grid: document.getElementById('btnViewGrid'),
        table: document.getElementById('btnViewTable'),
        confident: document.getElementById('btnViewConfident'),
        signals: document.getElementById('btnViewSignals'),
        journal: document.getElementById('btnViewJournal'),
        feed: document.getElementById('btnViewFeed'),
      };

      Object.entries(tabPanes).forEach(([k, el]) => {
        if (el) el.classList.toggle('hidden', k !== mode);
      });

      const activeBtnCls = 'px-3 py-1.5 rounded-lg text-xs font-black bg-amber-400 text-slate-950 transition shadow-sm';
      const inactiveBtnCls = 'px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition';

      Object.entries(tabBtns).forEach(([k, btn]) => {
        if (btn) btn.className = k === mode ? activeBtnCls : inactiveBtnCls;
      });

      if (mode === 'journal') {
        fetchD1History();
      }
    }

    function initCharts() {
      const priceEl = document.getElementById('priceChart');
      if (!priceEl) return;
      if (typeof LightweightCharts === 'undefined') {
        console.warn('LightweightCharts not ready yet, retrying in 500ms...');
        setTimeout(initCharts, 500);
        return;
      }
      try {
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
          if (!priceChart || !priceEl) return;
          const isMob = window.innerWidth < 640;
          priceChart.applyOptions({
            width: priceEl.clientWidth,
            height: isMob ? 360 : 450,
          });
        });

        if (window.ResizeObserver && priceEl) {
          const ro = new ResizeObserver(() => {
            if (priceChart && priceEl.clientWidth > 0) {
              priceChart.applyOptions({ width: priceEl.clientWidth });
            }
          });
          ro.observe(priceEl);
        }
      } catch (err) {
        console.warn('initCharts error caught:', err);
      }
    }

    function connectRealtimeTickStream() {
      if (currentEventSource) {
        try { currentEventSource.close(); } catch {}
      }
      const es = new EventSource('/api/stream?symbol=' + currentSymbol);
      currentEventSource = es;
      es.addEventListener('tick', (ev) => {
        try {
          const quote = JSON.parse(ev.data);
          if (quote.symbol && quote.symbol !== currentSymbol) return;
          updateLiveSpotTicker(quote);
        } catch {}
      });
      es.onerror = () => {
        try { es.close(); } catch {}
        setTimeout(connectRealtimeTickStream, 2000);
      };
    }

    function updateLiveSpotTicker(quote) {
      if (!quote || !quote.bid) return;
      const bid = Number(quote.bid);
      const ask = Number(quote.ask);
      const spread = Number(quote.spreadPips);
      const uInfo = getAssetUnitInfo();

      document.getElementById('livePrice').textContent = '$' + bid.toFixed(2);
      document.getElementById('liveAsk').textContent = '$' + ask.toFixed(2);
      const spreadPoints = (spread * uInfo.mult).toFixed(0);
      document.getElementById('liveSpread').textContent = spreadPoints + ' ' + uInfo.unit + ' (' + spread.toFixed(1) + ')';
      const spBadge = document.getElementById('spreadGuardBadge');
      if (spBadge) {
        const maxSp = currentSymbol === 'BTCUSD' ? 10.0 : currentSymbol === 'ETHUSD' ? 15.0 : 25.0;
        if (spread <= maxSp) {
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
          appendTerminalLog('TICK_UP', quote.symbol + ' Bid: $' + bid.toFixed(2) + ' (▲) | Ask: $' + ask.toFixed(2) + ' | Spread: ' + spreadPoints + ' ' + uInfo.unit);
        } else {
          boxEl.classList.add('tick-down');
          arrowEl.textContent = '▼';
          arrowEl.className = 'text-base font-bold text-rose-400';
          appendTerminalLog('TICK_DN', quote.symbol + ' Bid: $' + bid.toFixed(2) + ' (▼) | Ask: $' + ask.toFixed(2) + ' | Spread: ' + spreadPoints + ' ' + uInfo.unit);
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
          const pips = diff * uInfo.mult;
          const sign = pips >= 0 ? '+' : '';
          const isProf = pips >= 0;
          const pipsStr = pips.toFixed(1);
          const diffStr = Math.abs(diff).toFixed(2);
          bigEl.textContent = (isProf ? '🟢 IN PROFIT: ' : '🔴 IN LOSS: ') + sign + pipsStr + ' ' + uInfo.unit + ' (' + sign + '$' + diffStr + '/' + uInfo.asset + ')';
          bigEl.className = 'mono text-xl sm:text-2xl font-black ' + (isProf ? 'text-emerald-400' : 'text-rose-400');
          if (badgeEl) {
            badgeEl.textContent = isProf ? '🟢 ACTIVATED • IN PROFIT' : '🔴 ACTIVATED • IN LOSS';
            badgeEl.className = 'px-3 py-1 rounded-md text-xs font-black mono uppercase tracking-wider ' +
              (isProf ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50' : 'bg-rose-500/25 text-rose-300 border border-rose-500/50');
          }
          updateTradeProgressBar(lc, currentAnalysis.tradeSetup.entryTiming, bid);
        } else if (!lc.isActivated) {
          const distPips = (Math.abs(bid - lc.entryPrice) * uInfo.mult).toFixed(1);
          const entryStr = lc.entryPrice.toFixed(2);
          bigEl.textContent = '⏳ WAIT FVG/OB RETEST: ' + distPips + ' ' + uInfo.unit + ' away ($' + entryStr + ')';
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
            const pips = diff * uInfo.mult;
            const sign = pips >= 0 ? '+' : '';
            const colorClass = pips >= 0 ? 'text-emerald-400' : 'text-rose-400';
            const pipsStr = pips.toFixed(1);
            const diffStr = Math.abs(diff).toFixed(2);
            pnlHtml = '<span class="font-black ' + colorClass + '">' + sign + pipsStr + ' ' + uInfo.unit + ' (' + sign + '$' + diffStr + '/' + uInfo.asset + ')</span>';
          } else {
            const distPips = (Math.abs(bid - lc.entryPrice) * uInfo.mult).toFixed(1);
            const entryStr = lc.entryPrice.toFixed(2);
            const prevMatch = (lc.pnlStatusText || '').match(/Prev:[^→]+/);
            const prevText = prevMatch ? prevMatch[0].trim() : '';
            if (prevText) {
              pnlHtml = '<span class="text-amber-300 font-bold leading-relaxed break-words block w-full text-center">⏳ ' + prevText + ' → Wait @ $' + entryStr + ' (' + distPips + uInfo.unit[0] + ')</span>';
            } else {
              pnlHtml = '<span class="text-amber-300 font-bold leading-relaxed break-words block w-full text-center">⏳ Wait ' + distPips + uInfo.unit[0] + ' for FVG/OB @ $' + entryStr + '</span>';
            }
          }
          if (gridCell) gridCell.innerHTML = pnlHtml;
          if (tableCell) tableCell.innerHTML = pnlHtml;

          const easyCell = document.getElementById('easy-strip-pnl-' + tf);
          if (easyCell) {
            if (lc.isActivated) {
              const diff = lc.direction === 'BUY' ? bid - lc.entryPrice : lc.entryPrice - bid;
              const pips = diff * uInfo.mult;
              const sign = pips >= 0 ? '+' : '';
              const colorClass = pips >= 0 ? 'text-emerald-400' : 'text-rose-400';
              const pipsStr = pips.toFixed(1);
              const diffStr = Math.abs(diff).toFixed(2);
              easyCell.innerHTML = '<span class="font-black ' + colorClass + '">' + sign + pipsStr + uInfo.unit[0] + ' (' + sign + '$' + diffStr + ')</span>';
            } else {
              easyCell.innerHTML = '<span class="text-amber-300 font-bold">⏳ Wait</span>';
            }
          }
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
              const pips = (diff * uInfo.mult).toFixed(0);
              const pipsStr = (diff >= 0 ? '+' : '') + pips + uInfo.unit[0];
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
              const pips = diff * uInfo.mult;
              const sign = diff >= 0 ? '+' : '';
              const isProf = diff >= 0;
              const pipsStr = pips.toFixed(1) + uInfo.unit[0];
              const diffStr = Math.abs(diff).toFixed(2);
              const bgCls = isProf ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

              const els = document.querySelectorAll('.conf-live-pnl-' + tf + '-' + s.time);
              els.forEach((el) => {
                el.innerHTML = '<span class="px-2 py-0.5 rounded font-black mono text-[10px] border ' + bgCls + '">' +
                  (isProf ? '🟢' : '🔴') + ' RUNNING: ' + sign + '$' + diffStr + '/' + uInfo.asset + ' (' + sign + pipsStr + ')</span>';
              });
            } else if (s.outcome === 'WAIT_CONFIRMATION') {
              const distPips = (Math.abs(bid - s.entry) * 10).toFixed(1);
              const entryStr = s.entry.toFixed(2);
              const els = document.querySelectorAll('.conf-live-pnl-' + tf + '-' + s.time);
              els.forEach((el) => {
                el.innerHTML = '<span class="px-2 py-0.5 rounded font-bold mono text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">' +
                  '⏳ WAIT: ' + distPips + 'p away ($' + entryStr + ')</span>';
              });
            }
          });
        });
      }
    }

    function clearSetupPriceLines() {
      if (!candleSeries) return;
      activePriceLines.forEach((l) => { try { candleSeries.removePriceLine(l); } catch {} });
      activePriceLines = [];
    }

    function drawSetupPriceLines(setup, liq) {
      if (!candleSeries) return;
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
          title: '🎯 TP1 (1:1.5 • 50%+BE) $' + (lc ? lc.tp1 : setup.tp1).toFixed(2),
        }),
        candleSeries.createPriceLine({
          price: lc ? lc.tp2 : setup.tp2,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: LightweightCharts.LineStyle.Solid,
          axisLabelVisible: true,
          title: '🏆 TP2 (1:2.5 RUNNER) $' + (lc ? lc.tp2 : setup.tp2).toFixed(2),
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
          fetch(\`/api/signal?tf=\${currentTf}&symbol=\${currentSymbol}\`),
          fetch(\`/api/mtf?symbol=\${currentSymbol}\`)
        ]);

        if (!sigRes.ok || !mtfRes.ok) {
          const [f1, f2] = await Promise.all([
            fetch(\`/signal?tf=\${currentTf}&symbol=\${currentSymbol}\`),
            fetch(\`/mtf?symbol=\${currentSymbol}\`)
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
      const uInfo = getAssetUnitInfo();
      saveOpenCollapses();
      saveAllScrollStates();
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
        const uInfo = getAssetUnitInfo();

        // 0. Render Easy View: 6-Timeframe Quick Status Strip (Compact, High-Focus)
        const easyStripContainer = document.getElementById('mtfEasyStripContainer');
        if (easyStripContainer) {
          easyStripContainer.innerHTML = order.map((tf) => {
            const r = mtf.timeframes[tf];
            if (!r || !r.entryTiming?.lifecycle) return '';
            const lc = r.entryTiming.lifecycle;
            const isSelected = tf === currentTf;
            const cardBorder = isSelected
              ? 'border-2 border-amber-400 bg-amber-400/[0.14] shadow-md shadow-amber-400/25 ring-2 ring-amber-400/50 scale-[1.02]'
              : 'border border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-900/95';
            const dirBg = lc.direction === 'BUY'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            const pnlHtml = lc.isActivated
              ? (lc.floatingPips >= 0
                  ? '<span class="text-emerald-400 font-black">+' + lc.floatingPips.toFixed(1) + uInfo.unit[0] + ' (+$' + lc.floatingDollarsPerOz.toFixed(2) + ')</span>'
                  : '<span class="text-rose-400 font-black">' + lc.floatingPips.toFixed(1) + uInfo.unit[0] + ' (-$' + Math.abs(lc.floatingDollarsPerOz).toFixed(2) + ')</span>')
              : '<span class="text-amber-300 font-bold">⏳ Wait FVG</span>';

            return \`
              <div onclick="switchTimeframe('\${tf}')" class="rounded-xl p-2.5 transition-all cursor-pointer flex flex-col justify-between \${cardBorder}">
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <span class="px-2 py-0.5 rounded text-[11px] font-black mono bg-slate-800 uppercase \${isSelected ? 'text-amber-300' : 'text-white'}">\${TF_LABELS[tf] || tf.toUpperCase()}</span>
                  <div class="flex items-center gap-1">
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-black border \${dirBg}">\${lc.direction}</span>
                    \${isSelected ? '<span class="px-1 py-0.2 rounded text-[8px] font-black bg-amber-400 text-slate-950 uppercase tracking-tighter shadow-sm">ACTIVE</span>' : ''}
                  </div>
                </div>
                <div class="flex items-center justify-between text-xs my-1 bg-slate-950/80 px-2 py-1 rounded border border-slate-800/80">
                  <span class="text-[9px] uppercase font-bold text-slate-400">\${lc.isActivated ? 'P&L' : 'STATE'}</span>
                  <span id="easy-strip-pnl-\${tf}" class="mono text-[11px] font-black">\${pnlHtml}</span>
                </div>
                <div class="text-[10px] mono text-slate-400 flex items-center justify-between pt-1">
                  <span class="text-[9px] uppercase text-slate-500">Entry:</span>
                  <span class="font-extrabold text-amber-300">$\${lc.entryPrice.toFixed(2)}</span>
                </div>
              </div>
            \`;
          }).join('');
        }

        // 1. Render Responsive 6-Timeframe Card Grid (Default View with Scroll Retention)
        const gridContainer = document.getElementById('mtfGridContainer');
        if (gridContainer) {
          const currentGridSig = String(currentTf) + '_' + order.map((tf) => {
            const r = mtf.timeframes[tf];
            const conf = (mtf.highConfidenceByTf && mtf.highConfidenceByTf[tf]) || [];
            const confStr = conf.map((c) => String(c.time) + '_' + String(c.outcome) + '_' + String(c.isLiveCurrent)).join(',');
            return String(tf) + ':' + String(r?.grade) + ':' + String(r?.probability) + ':' + String(r?.entryTiming?.lifecycle?.activationState) + ':' + confStr;
          }).join('|');

          if (currentGridSig !== lastGridSig) {
            lastGridSig = currentGridSig;
            saveAllScrollStates();
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

                  <!-- Live P&L or Distance Box (Streamlined & Compact) -->
                  <div class="px-2.5 py-2 rounded-lg bg-slate-950/90 border border-slate-800/80 mb-2.5 flex items-center justify-between shadow-inner">
                    <span class="text-[9px] uppercase font-bold text-slate-400">\${lc.isActivated ? 'LIVE P&L' : 'STATUS'}</span>
                    <div id="mtf-grid-pnl-\${tf}" class="mono text-xs font-black">
                      \${pnlCellHtml}
                    </div>
                  </div>

                  <!-- Key Execution Grid (Entry, Hard SL, TP1, TP2) -->
                  <div class="grid grid-cols-2 gap-1.5 mono mb-3">
                    <div class="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-between">
                      <span class="text-[9px] uppercase font-bold text-amber-400/80">📍 Entry</span>
                      <span class="font-black text-amber-300 text-xs">$\${lc.entryPrice.toFixed(2)}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                      <span class="text-[9px] uppercase font-bold text-rose-400/80">🛑 Hard SL</span>
                      <span class="font-bold text-rose-400 text-xs">$\${lc.stopLoss.toFixed(2)}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <span class="text-[9px] uppercase font-bold text-emerald-400/80">🎯 TP1 (1:1.5)</span>
                      <span class="font-bold text-emerald-400 text-xs">$\${lc.tp1.toFixed(2)}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                      <span class="text-[9px] uppercase font-bold text-emerald-300/80">🏆 TP2 (1:2.5)</span>
                      <span class="font-extrabold text-emerald-300 text-xs">$\${lc.tp2.toFixed(2)}</span>
                    </div>
                  </div>

                  <!-- Collapsible 85%+ Entries for this Timeframe Card -->
                  <div class="mb-3" onclick="event.stopPropagation();">
                    <details id="card-conf-\${tf}" \${isCardConfOpen ? 'open' : ''} ontoggle="onCollapseToggle(this)" class="group rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                      <summary class="cursor-pointer py-1.5 px-2.5 flex items-center justify-between text-xs select-none hover:bg-slate-800/60 transition">
                        <span class="font-extrabold text-amber-300 text-[11px] flex items-center gap-1.5">
                          <span>⚡ Activations</span>
                          <span class="px-1.5 py-0.2 rounded text-[10px] font-black \${confSigs.length > 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}">\${confSigs.length}</span>
                        </span>
                        <span class="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div data-scroll-key="card-conf-scroll-\${tf}" onscroll="onInnerScroll(this)" class="p-2 border-t border-slate-800/80 bg-slate-950 space-y-2 max-h-[220px] overflow-y-auto">
                        \${(() => {
                          if (confSigs.length === 0) {
                            return '<div class="text-[11px] text-slate-500 text-center py-2 mono">No activations recorded yet</div>';
                          }
                          let cardClosedCounter = 1;
                          return confSigs.map((cs) => {
                            const cIsB = cs.type === 'BUY';
                            const cTypeCls = cIsB ? 'text-emerald-400' : 'text-rose-400';
                            const isAct = cs.outcome === 'ACTIVE';
                            const curBid = lastKnownBid || cs.entry;
                            const diff = cIsB ? curBid - cs.entry : cs.entry - curBid;
                            const pips = diff * uInfo.mult;
                            const isProf = diff >= 0;
                            const sign = isProf ? '+' : '';

                            let outBadge = '';
                            if (isAct) {
                              outBadge = '<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-500/25 text-sky-300 border border-sky-400/50 animate-pulse">⚡ LIVE ACTIVATED</span>';
                            } else if (cs.outcome === 'TP2_HIT') {
                              outBadge = '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">🏆 TP2 (1:2.5)</span>';
                            } else if (cs.outcome === 'TP1_HIT') {
                              outBadge = '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">✅ TP1 (1:1.5)</span>';
                            } else if (cs.outcome === 'BE_EXIT') {
                              outBadge = '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">🛡️ BE</span>';
                            } else {
                              outBadge = '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300">❌ SL</span>';
                            }

                            let livePnlHtml = '';
                            if (isAct) {
                              livePnlHtml = '<div class="conf-live-pnl-' + (cs.timeframe || tf) + '-' + cs.time + ' pt-1">' +
                                '<span class="px-2 py-0.5 rounded font-black mono text-[10px] border ' + (isProf ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40') + '">' +
                                (isProf ? '🟢' : '🔴') + ' RUNNING: ' + sign + '$' + Math.abs(diff).toFixed(2) + '/oz (' + sign + pips.toFixed(1) + 'p)' +
                                '</span></div>';
                            } else {
                              livePnlHtml = '<div class="pt-1 text-[10px] font-bold ' + ((cs.pnlDollarsPerOz || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400') + '">Outcome: ' + ((cs.pnlDollarsPerOz || 0) >= 0 ? '+' : '') + '$' + (cs.pnlDollarsPerOz || 0).toFixed(2) + '/oz</div>';
                            }

                            const liveHeaderBadge = isAct
                              ? '<span class="px-1 py-0.2 rounded text-[8px] font-black bg-sky-500 text-slate-950">LIVE</span>'
                              : '';

                            const cardBorder = isAct
                              ? 'border-sky-500/50 bg-sky-950/20 ring-1 ring-sky-500/30'
                              : 'border-slate-800 bg-slate-900/90';

                            const entryNumLabel = isAct
                              ? 'LIVE'
                              : '#' + (cardClosedCounter++);

                            return '<div class="p-2 rounded-lg ' + cardBorder + ' text-xs space-y-1">' +
                              '<div class="flex items-center justify-between text-[11px]">' +
                              '<div class="flex items-center gap-1.5">' +
                              liveHeaderBadge +
                              '<span class="font-black mono ' + cTypeCls + '">' + cs.type + ' ' + entryNumLabel + '</span>' +
                              '<span class="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px]">' + cs.grade + ' ' + (cs.probability || cs.confidence) + '%</span>' +
                              '</div>' +
                              outBadge +
                              '</div>' +
                              '<div class="mono text-[11px] space-y-0.5 text-slate-300 pt-0.5">' +
                              '<div class="text-amber-300 font-bold">• <strong>entry</strong>: ' + cs.entry.toFixed(2) + '</div>' +
                              '<div class="text-rose-400">• <strong>stop loss</strong>: ' + cs.stopLoss.toFixed(2) + '</div>' +
                              '<div class="text-emerald-400">• <strong>tp1</strong>: ' + cs.tp1.toFixed(2) + '</div>' +
                              '<div class="text-emerald-300 font-extrabold">• <strong>tp2</strong>: ' + cs.tp2.toFixed(2) + '</div>' +
                              '</div>' +
                              livePnlHtml +
                              '</div>';
                          }).join('');
                        })()}
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
            restoreAllScrollStates();
            requestAnimationFrame(restoreAllScrollStates);
          } else {
            // Keep DOM elements intact; update live status & P&L cells without wiping scroll!
            order.forEach((tf) => {
              const r = mtf.timeframes[tf];
              if (!r || !r.entryTiming?.lifecycle) return;
              const lc = r.entryTiming.lifecycle;
              const pnlEl = document.getElementById('mtf-grid-pnl-' + tf);
              if (pnlEl) {
                pnlEl.innerHTML = lc.isActivated
                  ? \`<span class="font-black \${lc.floatingPips >= 0 ? 'text-emerald-400' : 'text-rose-400'}">\${lc.pnlStatusText}</span>\`
                  : \`<span class="text-amber-300 font-bold leading-relaxed break-words block w-full text-center">⏳ \${lc.pnlStatusText}</span>\`;
              }
            });
          }
        }

        // 2. Render Full Table View (Alternative with Signature Comparison)
        const tableBody = document.getElementById('mtfMatrixBody');
        if (tableBody) {
          const currentTableSig = String(currentTf) + '_' + order.map((tf) => {
            const r = mtf.timeframes[tf];
            return String(tf) + ':' + String(r?.grade) + ':' + String(r?.probability) + ':' + String(r?.entryTiming?.lifecycle?.activationState);
          }).join('|');

          if (currentTableSig !== lastTableSig) {
            lastTableSig = currentTableSig;
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
          } else {
            order.forEach((tf) => {
              const r = mtf.timeframes[tf];
              if (!r || !r.entryTiming?.lifecycle) return;
              const lc = r.entryTiming.lifecycle;
              const pnlCell = document.getElementById('mtf-table-pnl-' + tf);
              if (pnlCell) {
                pnlCell.innerHTML = lc.isActivated
                  ? \`<span class="font-black \${lc.floatingPips >= 0 ? 'text-emerald-400' : 'text-rose-400'}">\${lc.pnlStatusText}</span>\`
                  : \`<span class="text-amber-300 font-bold leading-relaxed break-words">⏳ \${lc.pnlStatusText}</span>\`;
              }
            });
          }
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
      const mktTitle = document.getElementById('marketCardTitle');
      if (lc.isActivated) {
        if (mktTitle) mktTitle.textContent = 'Active Position (Locked Entry)';
        document.getElementById('marketEntryVal').textContent = '$' + lc.entryPrice.toFixed(2);
        document.getElementById('marketEntryStatusTag').textContent = '🔒 ENTRY LOCKED';
        document.getElementById('marketEntryStatusTag').className = 'px-2 py-0.5 rounded text-[10px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse';
        document.getElementById('marketEntryNote').textContent = 'Locked @ Execution • ' + lc.pnlStatusText;

        document.getElementById('waitEntryVal').textContent = '$' + lc.tp1.toFixed(2);
        document.getElementById('waitCardTitle').textContent = 'TARGET 1: 1:1.5 R:R (50% PARTIAL + BE)';
        document.getElementById('waitOrderTypeTag').textContent = '1:1.5 TP1';
        document.getElementById('waitEntryNote').textContent = 'Move SL to Breakeven @ $' + lc.entryPrice.toFixed(2) + ' when hit';
      } else {
        if (mktTitle) mktTitle.textContent = 'Option A: Market Price (Now)';
        document.getElementById('marketEntryVal').textContent = '$' + et.marketEntry.toFixed(2);
        document.getElementById('marketEntryStatusTag').textContent = et.isLate ? '⚠️ LATE CHASE' : 'SPOT NOW';
        document.getElementById('marketEntryStatusTag').className = 'px-2 py-0.5 rounded text-[10px] font-black mono bg-slate-800 text-slate-300';
        document.getElementById('marketEntryNote').textContent = 'Live MT5 Spot Price';

        document.getElementById('waitEntryVal').textContent = '$' + lc.entryPrice.toFixed(2);
        document.getElementById('waitCardTitle').textContent = 'Option B: FVG PRO Retest (CE 50%)';
        document.getElementById('waitOrderTypeTag').textContent = et.recommendedOrderType;
        document.getElementById('waitEntryNote').textContent = 'Retest to Consequent Encroachment (CE 50%)';
      }

      document.getElementById('setupSl').textContent = '$' + lc.stopLoss.toFixed(2);
      document.getElementById('setupSlPips').textContent = 'Structural SL (+0.2x ATR): -' + et.riskPips.toFixed(0) + ' pips ($' + et.riskDollars.toFixed(2) + '/oz)';
      document.getElementById('setupTp1').textContent = '$' + lc.tp1.toFixed(2);
      document.getElementById('setupTp1Pips').textContent = '+' + et.rewardTp1Pips.toFixed(0) + ' pips (1:1.5 • 50% + BE)';
      document.getElementById('setupTp2').textContent = '$' + lc.tp2.toFixed(2);
      document.getElementById('setupTp2Pips').textContent = '+' + et.rewardTp2Pips.toFixed(0) + ' pips (1:2.5 Runner)';

      updateRiskCalc();
      updateTradeProgressBar(lc, et, data.currentPrice);

      // Rule 3: Quantitative 100-Point Scoring Matrix
      if (data.scoringMatrix) {
        const qm = data.scoringMatrix;
        const qBadge = document.getElementById('quantScoreBadge');
        qBadge.textContent = qm.totalScore + '/100 PTS';
        qBadge.className = 'mono text-xs font-black px-2.5 py-1 rounded ' +
          (qm.totalScore >= 90 ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300');

        const vBanner = document.getElementById('quantVerdictBanner');
        if (qm.allMandatoryConfluencesPassed && (qm.grade === 'A+' || qm.totalScore >= 90)) {
          vBanner.textContent = '🛡️ V3.0 A+ QUALIFIED (4/4 MANDATORY PASSED): ' + qm.actionVerdict;
          vBanner.className = 'p-2.5 rounded-xl border text-center font-black mono text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm';
        } else if (!qm.allMandatoryConfluencesPassed) {
          vBanner.textContent = '⛔ DISQUALIFIED: MISSING MANDATORY CONFLUENCE (' + qm.actionVerdict + ')';
          vBanner.className = 'p-2.5 rounded-xl border text-center font-black mono text-xs bg-rose-500/20 text-rose-300 border-rose-500/40';
        } else if (qm.grade === 'A') {
          vBanner.textContent = '⚠️ GRADE A (80-89 PTS): DEMO ONLY — ' + qm.actionVerdict;
          vBanner.className = 'p-2.5 rounded-xl border text-center font-black mono text-xs bg-amber-500/20 text-amber-300 border-amber-500/40';
        } else {
          vBanner.textContent = '✋ STAND ASIDE: ' + qm.actionVerdict + ' (' + qm.totalScore + '/100 PTS)';
          vBanner.className = 'p-2.5 rounded-xl border text-center font-black mono text-xs bg-rose-500/20 text-rose-300 border-rose-500/40';
        }

        const pList = qm.v3Pillars ? [
          qm.v3Pillars.liquiditySweep,
          qm.v3Pillars.mssDisplacement,
          qm.v3Pillars.fvgQuality,
          qm.v3Pillars.ema50_200Regime,
          qm.v3Pillars.h4TrendConfirmation,
          qm.v3Pillars.sessionAndNews,
          qm.v3Pillars.executionAndCosts
        ].filter(Boolean) : (qm.pillars ? [qm.pillars.macroNews, qm.pillars.marketStructure, qm.pillars.emaRsiFilter, qm.pillars.killzoneSweep, qm.pillars.m15CandleFvg] : []);

        document.getElementById('quantPillarsContainer').innerHTML = pList.map((item) => {
          const passPill = item.passed
            ? '<span class="px-2 py-0.5 rounded text-[10px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">+' + item.awardedPoints + '/' + item.maxPoints + ' PTS</span>'
            : '<span class="px-2 py-0.5 rounded text-[10px] font-black mono bg-rose-500/20 text-rose-300 border border-rose-500/30">+' + item.awardedPoints + '/' + item.maxPoints + ' PTS</span>';
          const borderClass = item.passed ? 'border-slate-800' : 'border-rose-500/20';
          return '<div class="p-2.5 rounded-xl bg-slate-900/90 border ' + borderClass + ' space-y-1">' +
            '<div class="flex items-center justify-between gap-2">' +
              '<span class="text-xs font-bold text-white">' + item.name + '</span>' +
              passPill +
            '</div>' +
            '<p class="text-[11px] text-slate-400">' + item.notes + '</p>' +
          '</div>';
        }).join('');
      }

      // Rule 5: 20-Trade Rule-Adherence Journal Rendering
      if (data.journal) {
        renderJournalTable(data.journal);
      }

      // Chart Update (Clean 50 EMA & 200 EMA Only)
      const chartTfLabel = document.getElementById('chartTfLabel');
      if (chartTfLabel) chartTfLabel.textContent = data.timeframe.toUpperCase();
      if (candleSeries && ema50Series && ema200Series && data.series) {
        try {
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
          const markers = (data.historicalSignals || [])
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
        } catch (chartErr) {
          console.warn('Chart render error:', chartErr);
        }
      }
      restoreAllScrollStates();
      requestAnimationFrame(restoreAllScrollStates);
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
      const tp1Usd = Math.round(riskUsd * 1.5 * 100) / 100;
      const tp2Usd = Math.round(riskUsd * 2.5 * 100) / 100;

      document.getElementById('calcRiskUsd').textContent = '-$' + riskUsd.toFixed(2);
      document.getElementById('calcLots').textContent = lots.toFixed(2) + ' Lots';
      document.getElementById('calcRewardUsd').textContent = '+$' + tp1Usd.toFixed(2) + ' / +$' + tp2Usd.toFixed(2);
      updatePresetActiveStyles();
    }

    function setEquityPreset(amt) {
      const el = document.getElementById('calcBalance');
      if (el) {
        el.value = amt;
        updateRiskCalc();
      }
    }

    function setRiskPreset(pct) {
      const el = document.getElementById('calcRiskPct');
      if (el) {
        el.value = pct.toFixed(1);
        updateRiskCalc();
      }
    }

    function updatePresetActiveStyles() {
      const balance = parseFloat(document.getElementById('calcBalance')?.value) || 1000;
      const riskPct = parseFloat(document.getElementById('calcRiskPct')?.value) || 1.0;
      [500, 1000, 5000, 10000].forEach((amt) => {
        const btn = document.getElementById('preset-eq-' + amt);
        if (!btn) return;
        if (balance === amt) {
          btn.className = 'px-1.5 py-0.5 rounded bg-amber-400/25 text-amber-300 font-black mono border border-amber-400/60 shadow-sm';
        } else {
          btn.className = 'px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold mono border border-slate-800';
        }
      });
      [
        { key: '05', val: 0.5 },
        { key: '10', val: 1.0 },
        { key: '15', val: 1.5 },
        { key: '20', val: 2.0 },
      ].forEach(({ key, val }) => {
        const btn = document.getElementById('preset-rk-' + key);
        if (!btn) return;
        if (Math.abs(riskPct - val) < 0.05) {
          btn.className = 'px-1.5 py-0.5 rounded bg-amber-400/25 text-amber-300 font-black mono border border-amber-400/60 shadow-sm';
        } else {
          btn.className = 'px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold mono border border-slate-800';
        }
      });
    }

    function updateTradeProgressBar(lc, et, bid) {
      const wrap = document.getElementById('tradeProgressBarWrap');
      if (!wrap) return;
      if (!lc || !lc.isActivated) {
        wrap.classList.add('hidden');
        return;
      }
      wrap.classList.remove('hidden');

      const entry = lc.entryPrice;
      const sl = lc.stopLoss;
      const tp1 = lc.tp1;
      const tp2 = lc.tp2;
      const isBuy = lc.direction === 'BUY';

      document.getElementById('progSlVal').textContent = 'SL: $' + sl.toFixed(2);
      document.getElementById('progEntryVal').textContent = 'Entry: $' + entry.toFixed(2);
      document.getElementById('progTp1Val').textContent = 'TP1: $' + tp1.toFixed(2);
      document.getElementById('progTp2Val').textContent = 'TP2: $' + tp2.toFixed(2);

      const uInfo = getAssetUnitInfo();
      const totalDistanceToTp1 = Math.abs(tp1 - entry);
      const currentDistanceToEntry = isBuy ? (bid - entry) : (entry - bid);

      let pct = 0;
      if (totalDistanceToTp1 > 0) {
        pct = Math.max(0, Math.min(100, Math.round((currentDistanceToEntry / totalDistanceToTp1) * 100)));
      }

      const bar = document.getElementById('tradeProgressBar');
      if (bar) {
        bar.style.width = pct + '%';
        if (currentDistanceToEntry >= 0) {
          bar.className = 'h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300';
        } else {
          bar.className = 'h-full bg-rose-500 transition-all duration-300';
        }
      }

      const pipsToSl = (Math.abs(bid - sl) * uInfo.mult).toFixed(0);
      const pipsToTp1 = (Math.abs(tp1 - bid) * uInfo.mult).toFixed(0);
      document.getElementById('progDistSl').textContent = pipsToSl + ' ' + uInfo.unit + ' to SL';
      document.getElementById('progDistTp1').textContent = pipsToTp1 + ' ' + uInfo.unit + ' to TP1';
      document.getElementById('progStatusText').textContent = pct + '% to TP1';
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
      const uInfo = getAssetUnitInfo();
      const container = document.getElementById('highConfidenceCollapseContainer');
      const matrixContainer = document.getElementById('matrixConfidentCardsContainer');
      if (!container && !matrixContainer) return;

      const order = ['15m', '5m', '1m', '30m', '1h', '4h'];
      const currentHighConfSig = order.map((tf) => {
        const sigs = highConfidenceByTf[tf] || [];
        const sigsStr = sigs.map((s) => String(s.time) + '_' + String(s.outcome) + '_' + String(s.isLiveCurrent) + '_' + Number(s.pnlDollarsPerOz || 0).toFixed(1)).join(',');
        return String(tf) + ':' + sigsStr;
      }).join('|');

      if (currentHighConfSig === lastHighConfSig) {
        return;
      }
      lastHighConfSig = currentHighConfSig;

      saveAllScrollStates();

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

          let closedIdx = 1;
          const cards = sigs.slice(0, 10).map((s) => {
            const isLive = Boolean(s.isLiveCurrent);
            const isAct = s.outcome === 'ACTIVE';
            const dt = isLive && isAct
              ? '⚡ LIVE ACTIVATED'
              : new Date(s.time * 1000).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            const isB = s.type === 'BUY';
            const typeCls = isB ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
            const curBid = lastKnownBid || s.entry;
            const diff = isB ? curBid - s.entry : s.entry - curBid;
            const pips = diff * uInfo.mult;
            const isProf = diff >= 0;
            const sign = isProf ? '+' : '';

            let outBadge = '';
            if (isAct) {
              outBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-sky-500/25 text-sky-300 border border-sky-400/50 animate-pulse">⚡ LIVE ACTIVATED</span>';
            } else if (s.outcome === 'TP2_HIT') {
              outBadge = '<span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/25 text-emerald-300 font-bold">🏆 TP2 (1:2.5)</span>';
            } else if (s.outcome === 'TP1_HIT') {
              outBadge = '<span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 font-bold">✅ TP1 (1:1.5)</span>';
            } else if (s.outcome === 'BE_EXIT') {
              outBadge = '<span class="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 font-bold">🛡️ BE</span>';
            } else {
              outBadge = '<span class="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold">❌ SL</span>';
            }

            const copyTxt = s.type + ' ' + tf.toUpperCase() + ' @ ' + s.entry.toFixed(2) + ' | SL: ' + s.stopLoss.toFixed(2) + ' | TP1: ' + s.tp1.toFixed(2) + ' | TP2: ' + s.tp2.toFixed(2);

            let pnlDisplayHtml = '';
            if (isAct) {
              pnlDisplayHtml = '<div class="conf-live-pnl-' + tf + '-' + s.time + '">' +
                   '<span class="px-2 py-0.5 rounded font-black mono text-[10px] border ' + (isProf ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40') + '">' +
                     (isProf ? '🟢' : '🔴') + ' RUNNING: ' + sign + '$' + Math.abs(diff).toFixed(2) + '/oz (' + sign + pips.toFixed(1) + 'p)' +
                   '</span>' +
                 '</div>';
            } else {
              pnlDisplayHtml = '<div class="conf-live-pnl-' + tf + '-' + s.time + '"><span class="text-[11px] text-slate-400">P&L: <strong class="' + ((s.pnlDollarsPerOz || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400') + '">' + ((s.pnlDollarsPerOz || 0) >= 0 ? '+' : '') + '$' + (s.pnlDollarsPerOz || 0).toFixed(2) + '</strong></span></div>';
            }

            const cardBorder = isAct
              ? 'border-sky-500/60 bg-sky-950/25 ring-1 ring-sky-500/40'
              : 'border-slate-800/90 bg-slate-950/80';

            const liveBadge = isAct
              ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-sky-500 text-slate-950">LIVE</span>'
              : '';

            const entryLabel = isAct
              ? 'LIVE'
              : '#' + (closedIdx++);

            return \`
              <div class="p-3 rounded-xl \${cardBorder} hover:border-amber-400/40 transition flex flex-col justify-between">
                <div class="flex items-center justify-between gap-1 mb-2">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    \${liveBadge}
                    <span class="px-1.5 py-0.5 rounded text-[11px] font-black mono \${typeCls}">\${s.type} \${entryLabel}</span>
                    <span class="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">\${s.grade} \${s.probability || s.confidence}%</span>
                    <span class="text-[11px] \${isLive ? 'text-amber-300 font-bold' : 'text-slate-400'}">\${dt}</span>
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
                  <span class="px-2 py-0.5 rounded text-[11px] font-black bg-amber-400 text-slate-950">\${sigs.length} Activations</span>
                  <span class="hidden sm:inline text-xs text-slate-400 font-sans">• Strict 1:1.5 / 1:2.5 R:R</span>
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
      restoreAllScrollStates();
      requestAnimationFrame(restoreAllScrollStates);
    }

    function copySignalOrder(tf, entry, sl, tp1, tp2, dir) {
      const text = currentSymbol + ' ' + dir + ' ' + Number(entry).toFixed(2) + ' SL ' + Number(sl).toFixed(2) + ' TP1 ' + Number(tp1).toFixed(2) + ' TP2 ' + Number(tp2).toFixed(2);
      navigator.clipboard.writeText(text);
      playChime('chime');
      showToast('📋 Copied ' + tf.toUpperCase() + ' ' + dir + ' @ $' + Number(entry).toFixed(2));
    }

    function renderAllHighProbSignalsTable(allSignals) {
      const filtered = signalListFilter === '90PLUS'
        ? allSignals.filter((s) => s.probability >= 82 || s.grade === 'A+' || s.grade === 'A')
        : signalListFilter === 'ALL'
        ? allSignals
        : allSignals.filter((s) => s.timeframe === signalListFilter);

      const tbody = document.getElementById('allSignalsTableBody');
      if (!tbody) return;
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="py-4 text-center text-slate-500">No active signals found in current scan window</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map((s) => {
        const dt = new Date(s.time * 1000).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const isB = s.type === 'BUY';
        const sigCls = isB
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
        const outBadge = s.outcome === 'TP2_HIT'
          ? '<span class="px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 font-bold">🏆 1:2.5 RUNNER HIT</span>'
          : s.outcome === 'TP1_HIT'
          ? '<span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">✅ 1:1.5 PARTIAL + BE</span>'
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
            <td class="py-2.5 px-3 text-center">
              <button onclick="event.stopPropagation(); copySignalOrder('\${s.timeframe}', \${s.entry}, \${s.stopLoss}, \${s.tp1}, \${s.tp2}, '\${s.type}')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-bold text-[10px] transition">Copy</button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    // Cloudflare D1 Historical Performance & Trade Log Suite
    const d1HistoryState = {
      timeframe: 'ALL',
      grade: 'ALL',
      outcome: 'ALL',
      limit: 100,
      search: '',
      data: null,
      isLoading: false
    };

    function setD1HistoryFilter(type, value) {
      if (type === 'timeframe') {
        d1HistoryState.timeframe = value;
        ['ALL', '1m', '5m', '15m', '30m', '1h', '4h'].forEach((id) => {
          const btn = document.getElementById('d1flt-tf-' + id);
          if (!btn) return;
          btn.className = id === value
            ? 'px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950'
            : 'px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white';
        });
      } else if (type === 'grade') {
        d1HistoryState.grade = value;
        ['ALL', '90PLUS'].forEach((id) => {
          const btn = document.getElementById('d1flt-gr-' + id);
          if (!btn) return;
          btn.className = id === value
            ? 'px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950'
            : 'px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white';
        });
      } else if (type === 'outcome') {
        d1HistoryState.outcome = value;
        ['ALL', 'WINS', 'TP2_HIT', 'TP1_HIT', 'BE_EXIT', 'SL_HIT'].forEach((id) => {
          const btn = document.getElementById('d1flt-oc-' + id);
          if (!btn) return;
          btn.className = id === value
            ? 'px-2 py-1 rounded text-xs font-black bg-amber-400 text-slate-950'
            : 'px-2 py-1 rounded text-xs font-bold text-slate-400 hover:text-white';
        });
      }
      fetchD1History(true);
    }

    function setD1HistoryLimit(val) {
      d1HistoryState.limit = parseInt(val, 10) || 100;
      fetchD1History(true);
    }

    function onD1SearchChange(query) {
      d1HistoryState.search = (query || '').toLowerCase().trim();
      if (d1HistoryState.data) {
        renderD1History(d1HistoryState.data);
      }
    }

    async function fetchD1History(force) {
      if (d1HistoryState.isLoading && !force) return;
      d1HistoryState.isLoading = true;
      const statusEl = document.getElementById('d1HistoryStatusText');
      if (statusEl) statusEl.textContent = 'Querying Cloudflare D1 Local database...';

      try {
        const params = new URLSearchParams();
        if (d1HistoryState.timeframe && d1HistoryState.timeframe !== 'ALL') {
          params.append('timeframe', d1HistoryState.timeframe);
        }
        if (d1HistoryState.outcome && d1HistoryState.outcome !== 'ALL') {
          params.append('outcome', d1HistoryState.outcome);
        }
        if (d1HistoryState.grade && d1HistoryState.grade !== 'ALL') {
          params.append('grade', d1HistoryState.grade);
        }
        params.append('limit', String(d1HistoryState.limit || 100));

        const res = await fetch('/api/history?' + params.toString());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        d1HistoryState.data = json;
        renderD1History(json);
      } catch (err) {
        console.error('fetchD1History error:', err);
        if (statusEl) statusEl.textContent = 'Failed to load D1 history: ' + (err.message || String(err));
      } finally {
        d1HistoryState.isLoading = false;
      }
    }

    function renderD1History(result) {
      if (!result) return;
      const stats = result.stats || {};
      const winRateEl = document.getElementById('d1StatWinRate');
      const winLossEl = document.getElementById('d1StatWinLoss');
      const netPnlEl = document.getElementById('d1StatNetPnl');
      const profitFactorEl = document.getElementById('d1StatProfitFactor');
      const avgRrEl = document.getElementById('d1StatAvgRr');
      const totalTradesEl = document.getElementById('d1StatTotalTrades');
      const statusEl = document.getElementById('d1HistoryStatusText');

      if (winRateEl) winRateEl.textContent = (typeof stats.winRate === 'number' ? stats.winRate.toFixed(1) : '--') + '%';
      if (winLossEl) winLossEl.textContent = (stats.wins || 0) + ' W / ' + (stats.losses || 0) + ' L / ' + (stats.beExits || 0) + ' BE';
      if (netPnlEl) {
        const pnl = stats.totalNetPnl || 0;
        netPnlEl.className = 'text-xl font-black mono mt-1 ' + (pnl >= 0 ? 'text-emerald-400' : 'text-rose-400');
        netPnlEl.textContent = (pnl >= 0 ? '+' : '') + '$' + pnl.toFixed(2);
      }
      if (profitFactorEl) profitFactorEl.textContent = typeof stats.profitFactor === 'number' ? stats.profitFactor.toFixed(2) : '--';
      if (avgRrEl) avgRrEl.textContent = stats.avgRr || '--';
      if (totalTradesEl) totalTradesEl.textContent = (stats.totalTrades || 0).toLocaleString() + ' trades';

      const tbody = document.getElementById('journalTableBody');
      if (!tbody) return;

      let list = result.trades || [];
      if (d1HistoryState.search) {
        const q = d1HistoryState.search;
        list = list.filter((t) => {
          return (t.reason && t.reason.toLowerCase().includes(q))
            || (t.timeframe && t.timeframe.toLowerCase().includes(q))
            || (t.direction && t.direction.toLowerCase().includes(q))
            || (t.dateIso && t.dateIso.toLowerCase().includes(q))
            || String(t.entryPrice).includes(q)
            || String(t.tradeNumber).includes(q);
        });
      }

      if (statusEl) {
        statusEl.textContent = 'Displaying ' + list.length + ' of ' + (stats.totalTrades || list.length) + ' trades (Filter: ' + d1HistoryState.timeframe + ' / ' + d1HistoryState.outcome + ')';
      }

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="py-6 text-center text-slate-500 font-sans">No historical trades found matching filter criteria</td></tr>';
        return;
      }

      tbody.innerHTML = list.map((t) => {
        const dt = t.dateIso ? new Date(t.dateIso).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : (new Date(t.time * 1000).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }));
        const isB = t.direction === 'BUY';
        const dirCls = isB ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
        const outStr = String(t.outcome || '').toUpperCase();
        const outBadge = outStr.includes('TP2')
          ? '<span class="px-2 py-0.5 rounded font-black text-[11px] bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">🏆 TP2 (1:2.5)</span>'
          : outStr.includes('TP1')
          ? '<span class="px-2 py-0.5 rounded font-black text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">✅ TP1 (1:1.5)</span>'
          : outStr.includes('BE')
          ? '<span class="px-2 py-0.5 rounded font-black text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30">🛡️ BE EXIT</span>'
          : outStr.includes('SL')
          ? '<span class="px-2 py-0.5 rounded font-black text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40">❌ SL HIT (-1R)</span>'
          : '<span class="px-2 py-0.5 rounded font-bold text-[11px] bg-sky-500/20 text-sky-300">' + outStr + '</span>';

        const pnl = Number(t.pnlDollars || 0);
        const pnlCls = pnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';

        return \`
          <tr class="hover:bg-slate-900/60 transition">
            <td class="py-2.5 px-3 text-slate-500 font-bold">\${t.tradeNumber}</td>
            <td class="py-2.5 px-3 text-slate-300">\${dt}</td>
            <td class="py-2.5 px-3"><span class="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold uppercase text-[11px]">\${t.timeframe}</span></td>
            <td class="py-2.5 px-3 \${dirCls}">\${t.direction}</td>
            <td class="py-2.5 px-3"><span class="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">\${t.grade || 'A'}</span> <span class="font-bold text-white ml-1">\${t.score}%</span></td>
            <td class="py-2.5 px-3 font-black text-amber-300 bg-amber-400/10 border-x border-amber-400/20">$\${Number(t.entryPrice).toFixed(2)}</td>
            <td class="py-2.5 px-3 text-rose-400">$\${Number(t.stopLoss).toFixed(2)}</td>
            <td class="py-2.5 px-3 text-emerald-400">$\${Number(t.tp1).toFixed(2)}</td>
            <td class="py-2.5 px-3 text-emerald-300 font-bold">$\${Number(t.tp2).toFixed(2)}</td>
            <td class="py-2.5 px-3">\${outBadge}</td>
            <td class="py-2.5 px-3 font-black mono text-white">\${t.achievedRr || '--'}</td>
            <td class="py-2.5 px-3 text-right \${pnlCls}">\${pnl >= 0 ? '+' : ''}$\${pnl.toFixed(2)}</td>
            <td class="py-2.5 px-3 text-slate-300 font-sans truncate max-w-[200px]" title="\${t.reason || ''}">\${t.reason || '--'}</td>
          </tr>
        \`;
      }).join('');
    }

    function exportHistoryCsv() {
      if (!d1HistoryState.data || !d1HistoryState.data.trades || d1HistoryState.data.trades.length === 0) {
        showToast('No trade records to export');
        return;
      }
      const headers = ['Trade_Num', 'Timestamp', 'Date_UTC', 'Timeframe', 'Direction', 'Score', 'Grade', 'Entry_Price', 'Stop_Loss', 'TP1', 'TP2', 'Outcome', 'Achieved_RR', 'Net_PnL_USD', 'Net_Pips', 'Reason'];
      const rows = d1HistoryState.data.trades.map((t) => [
        t.tradeNumber,
        t.time,
        '"' + (t.dateIso || '') + '"',
        t.timeframe,
        t.direction,
        t.score,
        t.grade,
        Number(t.entryPrice).toFixed(2),
        Number(t.stopLoss).toFixed(2),
        Number(t.tp1).toFixed(2),
        Number(t.tp2).toFixed(2),
        t.outcome,
        '"' + (t.achievedRr || '') + '"',
        Number(t.pnlDollars || 0).toFixed(2),
        t.pips || 0,
        '"' + (t.reason || '').replace(/"/g, '""') + '"'
      ].join(','));
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', 'indecator_d1_history_' + currentSymbol + '_' + new Date().toISOString().slice(0, 10) + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📥 Exported ' + rows.length + ' D1 Trades to CSV');
    }

    function copyHistorySummary() {
      if (!d1HistoryState.data || !d1HistoryState.data.stats) {
        showToast('No statistics loaded yet');
        return;
      }
      const s = d1HistoryState.data.stats;
      const text = '📊 INDECATOR D1 PERFORMANCE JOURNAL [' + currentSymbol + ']\\n'
        + 'Total Stored in D1: ' + s.totalTrades + ' trades\\n'
        + 'Win Rate: ' + s.winRate.toFixed(1) + '% (' + s.wins + 'W / ' + s.losses + 'L / ' + s.beExits + 'BE)\\n'
        + 'Profit Factor: ' + s.profitFactor.toFixed(2) + '\\n'
        + 'Average R:R: ' + s.avgRr + '\\n'
        + 'Total Net P&L: ' + (s.totalNetPnl >= 0 ? '+' : '') + '$' + s.totalNetPnl.toFixed(2) + '\\n'
        + 'Filter: Timeframe=' + d1HistoryState.timeframe + ' | Outcome=' + d1HistoryState.outcome + ' | Grade=' + d1HistoryState.grade;
      navigator.clipboard.writeText(text);
      showToast('📋 Copied D1 Performance Summary');
    }

    function renderJournalTable(journalEntries) {
      if (!d1HistoryState.data) {
        fetchD1History();
      }
    }

    function copyTfOrder(tf) {
      if (!latestMtfData || !latestMtfData.timeframes[tf]) return;
      const uInfo = getAssetUnitInfo();
      const r = latestMtfData.timeframes[tf];
      const et = r.entryTiming;
      const lc = et.lifecycle;
      const text = (currentSymbol === 'XAUUSD' ? '🪙' : '⚡') + ' ' + uInfo.label + ' [' + tf.toUpperCase() + '] — 4-CONFLUENCE V3.0 (Grade ' + r.grade + ' • ' + r.probability + '%)\\n'
        + '📊 Structure: ' + (r.ictStructure ? r.ictStructure.marketStructure : 'N/A') + ' | ' + lc.statusBadge + '\\n'
        + '📍 Entry (CE 50% FVG): $' + lc.entryPrice.toFixed(2) + ' (' + et.recommendedOrderType + ')\\n'
        + '🛑 Hard Structural SL (+0.2x ATR): $' + lc.stopLoss.toFixed(2) + ' (-' + et.riskPips.toFixed(0) + ' ' + uInfo.unit + ')\\n'
        + '🎯 TP 1 (1:1.5 RR • Take 50% + Move SL→BE): $' + lc.tp1.toFixed(2) + ' (+' + et.rewardTp1Pips.toFixed(0) + ' ' + uInfo.unit + ')\\n'
        + '🏆 TP 2 (1:2.5 RR • Runner): $' + lc.tp2.toFixed(2) + ' (+' + et.rewardTp2Pips.toFixed(0) + ' ' + uInfo.unit + ')';
      navigator.clipboard.writeText(text);
      showToast('Copied ' + uInfo.label + ' ' + tf.toUpperCase() + ' Setup!');
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

    function copyFastOrder() {
      if (!currentAnalysis || !currentAnalysis.tradeSetup) return;
      const uInfo = getAssetUnitInfo();
      const et = currentAnalysis.tradeSetup.entryTiming;
      const lc = et.lifecycle;
      const orderType = lc.direction === 'BUY'
        ? (lc.isActivated ? 'BUY' : 'BUY LIMIT')
        : (lc.isActivated ? 'SELL' : 'SELL LIMIT');
      const text = currentSymbol + ' ' + orderType + ' ' + lc.entryPrice.toFixed(2) + ' SL ' + lc.stopLoss.toFixed(2) + ' TP1 ' + lc.tp1.toFixed(2) + ' TP2 ' + lc.tp2.toFixed(2);
      navigator.clipboard.writeText(text);
      playChime('chime');
      showToast('⚡ Copied Fast Order: ' + orderType + ' @ $' + lc.entryPrice.toFixed(2));
    }

    // Audio Chime Synthesizer via Native Web Audio API
    let audioContext = null;
    let soundEnabled = true;
    try {
      const s = localStorage.getItem('indecator_sound');
      if (s !== null) soundEnabled = s === 'true';
    } catch {}

    function initAudioContext() {
      if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioCtx();
      }
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
    }

    function toggleAudio() {
      soundEnabled = !soundEnabled;
      try { localStorage.setItem('indecator_sound', soundEnabled); } catch {}
      updateAudioButton();
      if (soundEnabled) {
        initAudioContext();
        playChime('chime');
        showToast('🔊 Audio Alerts Enabled');
      } else {
        showToast('🔇 Audio Alerts Muted');
      }
    }

    function updateAudioButton() {
      const btn = document.getElementById('soundToggleBtn');
      if (!btn) return;
      const icon = document.getElementById('soundIcon');
      const lbl = document.getElementById('soundLabel');
      if (soundEnabled) {
        btn.className = 'px-2 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold mono bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30 transition flex items-center gap-1';
        if (icon) icon.textContent = '🔊';
        if (lbl) lbl.textContent = 'Sound ON';
      } else {
        btn.className = 'px-2 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold mono bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-300 transition flex items-center gap-1';
        if (icon) icon.textContent = '🔇';
        if (lbl) lbl.textContent = 'Muted';
      }
    }

    function playChime(type) {
      if (!soundEnabled) return;
      try {
        initAudioContext();
        if (!audioContext) return;
        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        if (type === 'tp') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.1);
          osc.frequency.setValueAtTime(783.99, now + 0.2);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.45);
        } else if (type === 'sl') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.setValueAtTime(1318.51, now + 0.08);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.start(now);
          osc.stop(now + 0.28);
        }
      } catch {}
    }

    function toggleHotkeysModal(show) {
      const modal = document.getElementById('hotkeysModal');
      if (!modal) return;
      if (show === undefined) {
        modal.classList.toggle('hidden');
      } else if (show) {
        modal.classList.remove('hidden');
      } else {
        modal.classList.add('hidden');
      }
    }

    // Keyboard Shortcuts Listener for Pro Traders
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      const key = e.key.toUpperCase();
      if (['1', '2', '3', '4', '5', '6'].includes(key)) {
        const tfMap = { '1': '1m', '2': '5m', '3': '15m', '4': '30m', '5': '1h', '6': '4h' };
        if (tfMap[key]) {
          e.preventDefault();
          switchTimeframe(tfMap[key]);
          showToast('⏱️ Timeframe: ' + tfMap[key].toUpperCase());
        }
      } else if (key === 'C') {
        e.preventDefault();
        copyTradeSignal();
      } else if (key === 'F') {
        e.preventDefault();
        resetChartZoom();
        showToast('🔍 Chart Zoom Reset');
      } else if (key === 'L') {
        e.preventDefault();
        togglePriceLines();
      } else if (key === 'T') {
        e.preventDefault();
        const modes = ['table', 'grid', 'confident', 'signals', 'journal', 'feed'];
        const nextIdx = (modes.indexOf(mtfViewMode) + 1) % modes.length;
        setMtfView(modes[nextIdx]);
        showToast('📑 Tab: ' + modes[nextIdx].toUpperCase());
      } else if (key === 'M') {
        e.preventDefault();
        toggleAudio();
      } else if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        toggleHotkeysModal();
      } else if (key === 'ESCAPE') {
        toggleHotkeysModal(false);
      }
    });

    function startApp() {
      try { updateAudioButton(); } catch (e) { console.error('updateAudioButton err:', e); }
      try { setMtfView(mtfViewMode); } catch (e) { console.error('setMtfView err:', e); }
      try { updateSymbolButtons(); } catch (e) { console.error('updateSymbolButtons err:', e); }
      try { initCharts(); } catch (e) { console.error('initCharts err:', e); }
      try { connectRealtimeTickStream(); } catch (e) { console.error('stream err:', e); }
      try { fetchD1History(); } catch (e) { console.error('fetchD1History err:', e); }
      loadSignalData();
      setInterval(loadSignalData, 2000);
      setInterval(() => {
        if (mtfViewMode === 'journal') fetchD1History();
      }, 10000);
    }

    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', startApp);
    } else {
      startApp();
    }
  </script>
</body>
</html>`;
