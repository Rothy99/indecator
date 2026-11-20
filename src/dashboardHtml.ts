export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#060911" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
    :root {
      --bg-main: #07090e;
      --bg-panel: #0d121f;
      --bg-panel-elevated: #111728;
      --border-subtle: rgba(255, 255, 255, 0.07);
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-main);
      color: #f1f5f9;
      -webkit-tap-highlight-color: transparent;
      letter-spacing: -0.01em;
    }
    .mono {
      font-family: 'JetBrains Mono', monospace;
      font-feature-settings: "tnum" on, "zero" on;
    }
    .panel {
      background: var(--bg-panel);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4);
    }
    .panel-clean {
      background: rgba(13, 18, 31, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
    }
    @keyframes flashUp {
      0% { background-color: rgba(16, 185, 129, 0.3); }
      100% { background-color: transparent; }
    }
    @keyframes flashDown {
      0% { background-color: rgba(244, 63, 94, 0.3); }
      100% { background-color: transparent; }
    }
    .tick-up { animation: flashUp 0.45s ease-out; }
    .tick-down { animation: flashDown 0.45s ease-out; }
    .banner-buy {
      background: linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, #0d121f 70%);
      border: 1px solid rgba(16, 185, 129, 0.45);
    }
    .banner-sell {
      background: linear-gradient(135deg, rgba(136, 19, 55, 0.3) 0%, #0d121f 70%);
      border: 1px solid rgba(244, 63, 94, 0.45);
    }
    .banner-wait {
      background: linear-gradient(135deg, rgba(120, 53, 15, 0.22) 0%, #0d121f 70%);
      border: 1px solid rgba(245, 158, 11, 0.35);
    }
    /* Minimal sleek scrollbars */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.12); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
    .safe-pb { padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0px)); }
    .safe-pt { padding-top: max(0.5rem, env(safe-area-inset-top, 0px)); }
    @media (max-width: 640px) {
      body { padding-bottom: 4.5rem; }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col">

  <!-- Institutional Sticky Header -->
  <header class="border-b border-slate-800/80 bg-[#07090e]/95 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-[1600px] mx-auto px-3 sm:px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2">
      <!-- Left: Brand + Symbol Switcher Segmented Control -->
      <div class="flex items-center justify-between w-full md:w-auto gap-3">
        <div class="flex items-center gap-2.5 shrink-0">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center font-black text-slate-950 text-xs mono shrink-0 shadow-sm shadow-amber-400/20">
            4C
          </div>
          <div>
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span id="headerSymbolTitle" class="font-extrabold text-sm sm:text-base tracking-tight text-white">XAU/USD</span>
              <span class="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE
              </span>
            </div>
            <span id="sourceBadge" class="text-[10px] text-slate-400 block truncate max-w-[200px] sm:max-w-none">4-Confluence V3.0 (Sweep + MSS + FVG CE 50%)</span>
          </div>
        </div>

        <!-- Segmented Symbol Selector Pills -->
        <div class="inline-flex rounded-lg bg-slate-900/90 p-0.5 border border-slate-800/90 gap-0.5">
          <button onclick="switchSymbol('XAUUSD')" id="sym-XAUUSD" class="px-2.5 py-1 rounded-md text-xs font-black transition-all bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
            <span>🪙</span><span class="hidden xs:inline">Gold</span>
          </button>
          <button onclick="switchSymbol('BTCUSD')" id="sym-BTCUSD" class="px-2.5 py-1 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-1">
            <span>₿</span><span class="hidden xs:inline">BTC</span>
          </button>
          <button onclick="switchSymbol('ETHUSD')" id="sym-ETHUSD" class="px-2.5 py-1 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-1">
            <span>Ξ</span><span class="hidden xs:inline">ETH</span>
          </button>
          <button onclick="switchSymbol('SOLUSD')" id="sym-SOLUSD" class="px-2.5 py-1 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-1">
            <span>◎</span><span class="hidden xs:inline">SOL</span>
          </button>
        </div>

        <!-- Mobile utility shortcuts -->
        <div class="flex items-center gap-1 md:hidden">
          <button onclick="openMt5Modal()" class="p-1.5 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1" title="MetaTrader 5 Real-Time Live Feed">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-500" id="mt5StatusDotMob"></span>
            <span>⚡</span>
          </button>
          <button onclick="openTelegramModal()" class="p-1.5 rounded-lg text-xs font-bold bg-sky-500/10 border border-sky-500/30 text-sky-300" title="Telegram">
            <span>📱</span>
          </button>
          <button onclick="toggleAudio()" class="p-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-300" title="Sound">
            <span id="soundIconMob">🔊</span>
          </button>
          <button onclick="toggleHotkeysModal(true)" class="p-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-300" title="Shortcuts">
            <span>⌨️</span>
          </button>
        </div>
      </div>

      <!-- Right: Live Price Ticker + Desktop Utility Badges -->
      <div class="flex items-center justify-between md:justify-end gap-2.5 w-full md:w-auto">
        <!-- Live Bid / Ask / Spread Combined Ticker Box -->
        <div id="priceBox" class="flex items-center gap-2 sm:gap-3 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800/90 transition-colors">
          <div>
            <span class="text-[8px] uppercase font-bold text-slate-400 block leading-none">BID</span>
            <span id="livePrice" class="mono text-base sm:text-xl font-black text-white tracking-tight">$----.--</span>
          </div>
          <div class="border-l border-slate-800 pl-2">
            <span class="text-[8px] uppercase font-bold text-slate-400 block leading-none">ASK</span>
            <span id="liveAsk" class="mono text-xs sm:text-sm font-bold text-amber-300">$----.--</span>
          </div>
          <div class="border-l border-slate-800 pl-2">
            <span class="text-[8px] uppercase font-bold text-slate-400 block leading-none">SPREAD</span>
            <span id="liveSpread" class="mono text-[10px] sm:text-xs font-bold text-emerald-400">-- pt</span>
          </div>
          <span id="spreadGuardBadge" class="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">OK</span>
          <span id="priceDirArrow" class="text-xs sm:text-sm font-bold text-amber-400">●</span>
        </div>

        <!-- Desktop Status & Utility Badges -->
        <div class="hidden md:flex items-center gap-1.5">
          <button id="mt5HeaderBtn" onclick="openMt5Modal()" class="px-2.5 py-1.5 rounded-lg text-xs font-bold mono bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition flex items-center gap-1.5" title="MetaTrader 5 Real-Time Live Feed Status & Bridge">
            <span class="w-2 h-2 rounded-full bg-slate-500" id="mt5StatusDot"></span>
            <span>⚡</span>
            <span class="hidden lg:inline" id="mt5HeaderLabel">MT5 Bridge</span>
          </button>

          <div id="d1DbPill" title="Cloudflare D1 Local SQLite Database" class="px-2 py-1.5 rounded-lg text-xs font-bold mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="hidden lg:inline">D1 Active</span>
          </div>

          <div id="circuitBreakerPill" class="px-2 py-1.5 rounded-lg text-xs font-bold mono bg-slate-900 text-slate-300 border border-slate-800">
            <span>🛡️ 0/2</span>
          </div>

          <button id="telegramHeaderBtn" onclick="openTelegramModal()" class="px-2 py-1.5 rounded-lg text-xs font-bold mono bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition flex items-center gap-1" title="Telegram">
            <span class="w-2 h-2 rounded-full bg-slate-500" id="telegramStatusDot"></span>
            <span>📱</span>
          </button>

          <button id="soundToggleBtn" onclick="toggleAudio()" class="px-2 py-1.5 rounded-lg text-xs font-bold mono bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white transition flex items-center gap-1" title="Sound (M)">
            <span id="soundIcon">🔊</span>
          </button>

          <button onclick="toggleHotkeysModal(true)" class="px-2 py-1.5 rounded-lg text-xs font-bold mono bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-amber-300 transition flex items-center gap-1" title="Shortcuts (?)">
            <span>⌨️</span>
          </button>
        </div>
      </div>
    </div>
  </header>

    <main class="max-w-[1600px] w-full mx-auto px-2.5 sm:px-4 py-2 sm:py-3 flex-1 space-y-3">

    <!-- ========================================================================= -->
    <!-- TIER 1: INSTITUTIONAL MARKET CONTEXT & KILLZONE (PANORAMIC STRIP)          -->
    <!-- ========================================================================= -->
    <section class="panel-clean rounded-xl px-3 py-2 border border-slate-800/70 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
      <!-- Session Killzone Window (GMT+7 Phnom Penh & UTC) -->
      <div class="flex items-center gap-2 flex-wrap">
        <span id="sessionBadge" class="px-2 py-0.5 rounded text-[10px] font-black mono bg-amber-400 text-slate-950">SESSION</span>
        <span id="sessionClock" class="mono text-xs font-bold text-white">--:-- GMT+7 | --:-- UTC</span>
        <span id="sessionActionText" class="text-[11px] text-slate-400 hidden xl:inline border-l border-slate-800/80 pl-2">Loading session killzone rules...</span>
      </div>

      <!-- Institutional Liquidity Levels (PDH, PDL, Asian High, Asian Low) -->
      <div class="flex items-center gap-1.5 sm:gap-2 mono overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
        <div class="bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1.5 shrink-0">
          <span class="text-[9px] text-slate-400 uppercase font-semibold">PDH</span>
          <span id="lvlPdh" class="text-xs font-black text-rose-300">$----</span>
        </div>
        <div class="bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1.5 shrink-0">
          <span class="text-[9px] text-slate-400 uppercase font-semibold">PDL</span>
          <span id="lvlPdl" class="text-xs font-black text-emerald-300">$----</span>
        </div>
        <div class="bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1.5 shrink-0">
          <span class="text-[9px] text-amber-400/80 uppercase font-semibold">Asian H</span>
          <span id="lvlAsianHigh" class="text-xs font-black text-amber-300">$----</span>
        </div>
        <div class="bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1.5 shrink-0">
          <span class="text-[9px] text-amber-400/80 uppercase font-semibold">Asian L</span>
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
    <!-- CROSS-MARKET SIGNAL RADAR & QUICK SCANNER (A+ 90%+ & ACTIVE SIGNALS)      -->
    <!-- ========================================================================= -->
    <section id="signalRadarSection" class="panel rounded-xl p-3 sm:p-3.5 space-y-2.5 border border-slate-800/80 shadow-md">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-2">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <div>
            <div class="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-2">
              <span>🎯 Cross-Market Signal Radar</span>
              <span id="radarCountBadge" class="mono text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                Scanning...
              </span>
            </div>
            <p class="text-[10px] text-slate-400 hidden xs:block">
              Auto-scans Gold &amp; Crypto across 6 Timeframes • One-click switch &amp; trade
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Filter Tabs -->
          <div class="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] mono">
            <button id="radarFilterAll" onclick="setRadarFilter('ALL')" class="px-2 py-1 rounded font-black bg-amber-400 text-slate-950 transition">
              All
            </button>
            <button id="radarFilterInZone" onclick="setRadarFilter('IN_ZONE')" class="px-2 py-1 rounded font-bold text-slate-400 hover:text-white transition">
              🔥 In Zone
            </button>
            <button id="radarFilterAPlus" onclick="setRadarFilter('A_PLUS')" class="px-2 py-1 rounded font-bold text-slate-400 hover:text-white transition">
              ⭐ A+ 90%
            </button>
            <button id="radarFilterActive" onclick="setRadarFilter('ACTIVE')" class="px-2 py-1 rounded font-bold text-slate-400 hover:text-white transition">
              ⚡ In Flight
            </button>
          </div>

          <button onclick="fetchSignalRadar()" id="btnRadarRefresh" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1" title="Rescan all symbols and timeframes">
            <span id="radarRefreshIcon">🔄</span>
            <span class="hidden sm:inline text-[11px]">Rescan</span>
          </button>
        </div>
      </div>

      <!-- Radar Carousel -->
      <div class="relative group">
        <div id="radarCardsContainer" class="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x scroll-smooth">
          <div class="text-xs text-slate-500 py-3 italic">Scanning cross-market signals...</div>
        </div>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- TIER 2: THE MAIN TRADING DESK (2-COLUMN UNIFIED FLOW)                      -->
    <!-- Left: 6-TF Ribbon + Lightweight Chart + 3-Step Strategy & Scoring Matrix  -->
    <!-- Right: Complete Active Execution Ticket (Hero Banner + Risk Calculator)  -->
    <!-- ========================================================================= -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">

      <!-- LEFT COLUMN: CHART & CONFLUENCE ANALYSIS (~65% WIDTH) -->
      <div id="mainLeftColumn" class="xl:col-span-7 2xl:col-span-8 space-y-3.5 transition-all">

        <!-- 6-Timeframe Interactive Ribbon (Top of Chart) -->
        <div id="mtfEasyContainer" class="panel-clean rounded-xl p-2.5 sm:p-3 space-y-2 border border-slate-800/80">
          <div class="flex items-center justify-between text-xs border-b border-slate-800/60 pb-1.5">
            <span class="font-extrabold uppercase tracking-wider text-[11px] text-amber-300 flex items-center gap-2">
              <span>⚡ Multi-Timeframe Status Strip</span>
              <span class="text-[10px] text-slate-400 font-normal hidden sm:inline">(Click any chip to switch active chart & setup)</span>
            </span>
            <span class="mono text-[10px] text-slate-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Real-Time P&L
            </span>
          </div>
          <div id="mtfEasyStripContainer" class="flex overflow-x-auto sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2 pb-1 sm:pb-0 scrollbar-none snap-x">
            <!-- Populated dynamically with 6 sleek interactive chips -->
          </div>
        </div>

        <!-- Real-Time Candle Identification & Smart Money Anatomy -->
        <div id="liveCandleIdentifierBox" class="panel-clean rounded-xl p-3 border border-slate-800/80 space-y-2.5 shadow-sm">
          <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/60 pb-2">
            <div class="flex items-center gap-2">
              <span id="candlePatternIcon" class="text-base sm:text-lg">🕯️</span>
              <div>
                <span class="text-[9px] font-black uppercase tracking-wider text-slate-400">Live Candle Identification &amp; Anatomy</span>
                <div id="candlePatternName" class="text-xs sm:text-sm font-black text-white">Analyzing Real-Time Candle...</div>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <span id="candlePatternBadge" class="px-2 py-0.5 rounded text-[10px] font-black mono bg-slate-800 text-amber-300 border border-slate-700/80">
                CALCULATING
              </span>
              <span id="candleRangeRatio" class="mono text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                1.0x ATR
              </span>
            </div>
          </div>

          <!-- Anatomy Proportions & Visual Ratio Bar -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center text-xs">
            <!-- Proportion Breakdown Bar -->
            <div class="md:col-span-7 space-y-1">
              <div class="flex items-center justify-between text-[10px] mono">
                <span id="candleLowerWickPct" class="text-amber-300 font-bold">Lower Wick: --%</span>
                <span id="candleBodyPct" class="text-emerald-400 font-black">Body: --%</span>
                <span id="candleUpperWickPct" class="text-rose-400 font-bold">Upper Wick: --%</span>
              </div>
              <div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex border border-slate-800">
                <div id="candleLowerWickBar" class="h-full bg-amber-400/80 transition-all duration-300" style="width: 20%"></div>
                <div id="candleBodyBar" class="h-full bg-emerald-400 transition-all duration-300" style="width: 60%"></div>
                <div id="candleUpperWickBar" class="h-full bg-rose-400/80 transition-all duration-300" style="width: 20%"></div>
              </div>
            </div>

            <!-- ICT Smart Money Interpretation -->
            <div class="md:col-span-5 text-[10px] sm:text-[11px] text-slate-300 border-l border-slate-800/80 pl-2.5 leading-snug">
              <span class="font-extrabold text-amber-300">Smart Money: </span>
              <span id="candleIctMeaning">Scanning real-time candle for displacement, sweep wicks, or engulfing flow...</span>
            </div>
          </div>

          <!-- Recent Completed Candles Recognition Flow -->
          <div class="pt-1.5 border-t border-slate-800/60 flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
            <span class="text-[9px] font-black uppercase text-slate-500 shrink-0">Recent Flow:</span>
            <div id="recentCandlesFlowContainer" class="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>

        <!-- Interactive Big Pro Chart Container -->
        <div id="chartPanelWrapper" class="panel rounded-xl p-2.5 sm:p-3.5 flex flex-col gap-2.5 border border-slate-800/80 shadow-md">
          <!-- Top Row: Timeframe, EMA legends, Crosshair Inspection Pill & Controls -->
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <span class="font-extrabold text-white flex items-center gap-1.5">
                <span id="chartTfLabel" class="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black mono text-xs">15M</span>
                <span class="text-[11px] sm:text-xs">PRO CHART</span>
              </span>
              <span class="flex items-center gap-1 text-purple-400 font-bold mono text-[10px] sm:text-[11px]">
                <span class="w-2 sm:w-2.5 h-0.5 bg-purple-400 inline-block"></span>50 EMA
              </span>
              <span class="flex items-center gap-1 text-sky-400 font-bold mono text-[10px] sm:text-[11px]">
                <span class="w-2 sm:w-2.5 h-0.5 bg-sky-400 inline-block"></span>200 EMA
              </span>
            </div>

            <!-- Live Crosshair Telemetry Pill -->
            <div id="chartCandleInspectPill" class="mono text-[10px] sm:text-[11px] text-slate-300 bg-slate-950/80 px-2.5 py-0.5 rounded border border-slate-800 hidden sm:flex items-center gap-2">
              <span class="text-amber-400 font-bold">INSPECT:</span>
              <span id="chartInspectText">Move cursor over candles to inspect FVG, OB &amp; levels</span>
            </div>

            <!-- Toolbar Controls: Smart Money Filter, Height, Lines, Focus, Fit -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <!-- Smart Money Overlay Filter Pills -->
              <div class="inline-flex rounded-lg bg-slate-950/90 p-0.5 border border-slate-800 text-[10px] mono">
                <button id="smFilterAll" onclick="setSmartMoneyOverlayFilter('ALL')" class="px-2 py-0.5 rounded font-black bg-amber-400 text-slate-950 transition" title="Show all FVG, Order Blocks, Sweeps and Signals">
                  ⚡ ALL
                </button>
                <button id="smFilterFvg" onclick="setSmartMoneyOverlayFilter('FVG')" class="px-2 py-0.5 rounded font-bold text-slate-400 hover:text-white transition" title="Show Fair Value Gaps only">
                  📦 FVG
                </button>
                <button id="smFilterOb" onclick="setSmartMoneyOverlayFilter('OB')" class="px-2 py-0.5 rounded font-bold text-slate-400 hover:text-white transition" title="Show Order Blocks only">
                  🧱 OB
                </button>
                <button id="smFilterSig" onclick="setSmartMoneyOverlayFilter('SIGNALS')" class="px-2 py-0.5 rounded font-bold text-slate-400 hover:text-white transition" title="Show A+ Signals only">
                  🎯 SIGNALS
                </button>
              </div>

              <!-- Chart Height Sizer -->
              <div class="inline-flex rounded-lg bg-slate-950/90 p-0.5 border border-slate-800 text-[10px] mono hidden md:inline-flex">
                <button id="btnSize560" onclick="setChartHeight(560)" class="px-1.5 py-0.5 rounded font-bold text-slate-400 hover:text-white transition">
                  560px
                </button>
                <button id="btnSize680" onclick="setChartHeight(680)" class="px-1.5 py-0.5 rounded font-black bg-slate-800 text-amber-300 transition">
                  680px
                </button>
                <button id="btnSize820" onclick="setChartHeight(820)" class="px-1.5 py-0.5 rounded font-bold text-slate-400 hover:text-white transition">
                  820px
                </button>
              </div>

              <!-- Focus / Full-Width Mode -->
              <button onclick="toggleChartFocusMode()" id="btnChartFocus" class="px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-slate-900 border border-slate-700/80 text-amber-300 hover:bg-slate-800 transition flex items-center gap-1" title="Toggle Full-Width Focused Chart View">
                <span>🖥️</span>
                <span class="hidden sm:inline" id="btnChartFocusLabel">Focus</span>
              </button>

              <button onclick="toggleRRBox()" id="toggleRRBoxBtn" class="px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 transition hover:bg-emerald-500/30" title="Toggle TradingView-Style Long/Short Risk:Reward Position Tool">
                📐 R:R Tool: ON
              </button>

              <button onclick="togglePriceLines()" id="toggleLinesBtn" class="px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 transition hover:bg-emerald-500/20">
                Lines: ON
              </button>
              <button onclick="resetChartZoom()" class="px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-slate-800/90 text-slate-300 hover:bg-slate-700 transition">
                Fit
              </button>
            </div>
          </div>

          <!-- Active Smart Money Telemetry Strip (FVG & Order Block Live Status) -->
          <div id="chartSmartMoneyStrip" class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <!-- Active FVG Telemetry -->
            <div id="chartActiveFvgCard" class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-emerald-400 font-extrabold text-xs">📦 FVG:</span>
                <span id="chartActiveFvgText" class="mono text-[11px] text-slate-300 truncate">Scanning Fair Value Gaps...</span>
              </div>
              <span id="chartActiveFvgBadge" class="mono text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">--</span>
            </div>

            <!-- Active Order Block (OB) Telemetry -->
            <div id="chartActiveObCard" class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-purple-400 font-extrabold text-xs">🧱 OB:</span>
                <span id="chartActiveObText" class="mono text-[11px] text-slate-300 truncate">Scanning Order Blocks...</span>
              </div>
              <span id="chartActiveObBadge" class="mono text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">--</span>
            </div>

            <!-- Sweeps & MSS Telemetry -->
            <div id="chartActiveSweepCard" class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-amber-400 font-extrabold text-xs">⚡ SWEEP:</span>
                <span id="chartActiveSweepText" class="mono text-[11px] text-slate-300 truncate">Scanning Liquidity Sweeps...</span>
              </div>
              <span id="chartActiveSweepBadge" class="mono text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">--</span>
            </div>
          </div>

          <!-- Big Pro Chart Canvas -->
          <div id="priceChart" class="w-full h-[380px] sm:h-[580px] lg:h-[650px] rounded-lg overflow-hidden bg-slate-950/80 border border-slate-900 transition-all relative"></div>
        </div>

        <!-- Strategy Confluence & 100-Point Quantitative Matrix (Collapsible Clean Bar) -->
        <details id="confluenceDetails" class="panel rounded-xl p-3 border border-slate-800/80 space-y-2 group transition-all">
          <summary class="flex items-center justify-between cursor-pointer list-none select-none">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[10px] font-black mono bg-amber-400 text-slate-950 uppercase">V3.0 STRATEGY</span>
              <span class="text-xs font-extrabold text-white">4-Confluence V3.0 Checklist & 100-Point Quality Matrix</span>
              <span class="text-[10px] text-slate-400 hidden sm:inline">(A+ 90/100 · 7 Pillars · 0.25% Max Risk)</span>
            </div>
            <div class="flex items-center gap-2">
              <span id="quantScoreBadge" class="mono text-xs font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950">--/100 PTS</span>
              <span class="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </div>
          </summary>
          <div class="pt-2.5 border-t border-slate-800/80 space-y-3">
            <div id="quantVerdictBanner" class="p-2 rounded-lg border text-center font-black mono text-xs bg-slate-900 border-slate-700 text-slate-300">
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
      <div id="mainRightColumn" class="xl:col-span-5 2xl:col-span-4 space-y-3.5 transition-all">

        <section id="heroBanner" class="panel rounded-xl p-3.5 sm:p-4 banner-wait transition-all space-y-3.5 border border-slate-800/90 shadow-lg">
          <!-- Execution Ticket Header -->
          <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/70 pb-2.5">
            <div class="flex items-center gap-2">
              <span id="gradeBadge" class="px-2 py-0.5 rounded text-xs font-black mono bg-amber-400 text-slate-950 shadow-sm">GRADE --</span>
              <span id="activationBadge" class="px-2 py-0.5 rounded text-xs font-black mono bg-slate-900 text-amber-300 border border-amber-500/40">
                STATUS
              </span>
            </div>
            <span id="structureTag" class="mono text-[11px] font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">--</span>
          </div>

          <!-- Big Live Position Status / Floating P&L -->
          <div id="liveLifecycleBox" class="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
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

          <!-- Live Entry Zone Proximity Meter & 1-Click Order Execution -->
          <div id="entryProximityBox" class="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span id="entryProximityDot" class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>Optimal Entry Proximity</span>
              </span>
              <span id="entryProximityBadge" class="mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                CALCULATING...
              </span>
            </div>
            <div class="flex items-baseline justify-between">
              <div>
                <span id="entryProximityTitle" class="text-xs sm:text-sm font-black text-white">Distance to CE 50%</span>
                <p id="entryProximitySubtitle" class="text-[10px] text-slate-400 mt-0.5">Optimal limit order positioned at Consequent Encroachment</p>
              </div>
              <div class="text-right">
                <div id="entryProximityDiff" class="mono text-xs sm:text-sm font-extrabold text-amber-300">-- pt</div>
                <div id="entryProximityPct" class="mono text-[9px] text-slate-400">--% from limit</div>
              </div>
            </div>
            <!-- Quick 1-Click Order Execution Bar -->
            <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              <button id="btnExecMarket" onclick="executeMarketCopy()" class="py-2 px-2.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center justify-center gap-1 shadow-sm active:scale-[0.98]">
                <span>⚡ Copy Market</span>
              </button>
              <button id="btnExecLimit" onclick="executeLimitCopy()" class="py-2 px-2.5 rounded-lg text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition flex items-center justify-center gap-1 shadow-md shadow-amber-400/20 active:scale-[0.98]">
                <span>🎯 Copy CE Limit</span>
              </button>
            </div>
          </div>

          <!-- Dual Entry Options (Option A: Market Price vs Option B: FVG PRO Retest) -->
          <div class="grid grid-cols-2 gap-2">
            <div id="marketEntryCard" onclick="copyValue('marketEntryVal')" class="cursor-pointer p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
              <div class="flex items-center justify-between">
                <span id="marketCardTitle" class="text-[9px] font-extrabold uppercase text-slate-400">Option A: Market</span>
                <span id="marketEntryStatusTag" class="px-1 py-0.2 rounded text-[8px] font-black mono bg-slate-800 text-slate-300">--</span>
              </div>
              <div id="marketEntryVal" class="mono text-base sm:text-xl font-black text-white mt-1">$----.--</div>
              <div id="marketEntryNote" class="text-[9px] text-slate-400 mt-0.5 truncate">Live MT5 Spot Price</div>
            </div>

            <div id="waitEntryCard" onclick="copyValue('waitEntryVal')" class="cursor-pointer p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/50 hover:border-amber-400 transition">
              <div class="flex items-center justify-between">
                <span id="waitCardTitle" class="text-[9px] font-extrabold uppercase text-amber-300">Option B: FVG Limit</span>
                <span id="waitOrderTypeTag" class="px-1 py-0.2 rounded text-[8px] font-black mono bg-amber-400 text-slate-950">CE 50%</span>
              </div>
              <div id="waitEntryVal" class="mono text-base sm:text-xl font-black text-amber-300 mt-1">$----.--</div>
              <div id="waitEntryNote" class="text-[9px] text-amber-200/80 mt-0.5 truncate">Retest to CE 50%</div>
            </div>
          </div>

          <!-- Precision Coordinates: Hard SL, TP1 (1:2 R:R), TP2 (1:3 R:R) -->
          <div class="space-y-1.5">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Execution Coordinates</span>
              <span class="text-[9px] text-slate-500 font-normal">Click any value to copy</span>
            </div>
            <div class="grid grid-cols-3 gap-1.5">
              <div onclick="copyValue('setupSl')" class="cursor-pointer p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 hover:border-rose-400/60 transition">
                <span class="text-[8px] font-bold uppercase text-rose-300 block truncate">🛑 Hard SL</span>
                <div id="setupSl" class="mono text-xs sm:text-base font-black text-rose-400 mt-0.5">$----.--</div>
                <span id="setupSlPips" class="mono text-[9px] text-rose-300/80 block leading-tight truncate">Risk: -- pt</span>
              </div>

              <div onclick="copyValue('setupTp1')" class="cursor-pointer p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-400/60 transition">
                <span class="text-[8px] font-bold uppercase text-emerald-300 block truncate">🎯 TP 1 (1:1.5)</span>
                <div id="setupTp1" class="mono text-xs sm:text-base font-black text-emerald-400 mt-0.5">$----.--</div>
                <span id="setupTp1Pips" class="mono text-[9px] text-emerald-300/80 block leading-tight truncate">+-- pt (BE)</span>
              </div>

              <div onclick="copyValue('setupTp2')" class="cursor-pointer p-2 rounded-lg bg-emerald-950/30 border border-emerald-400/40 hover:border-emerald-300/60 transition">
                <span class="text-[8px] font-bold uppercase text-emerald-200 block truncate">🏆 TP 2 (1:2.5)</span>
                <div id="setupTp2" class="mono text-xs sm:text-base font-black text-emerald-300 mt-0.5">$----.--</div>
                <span id="setupTp2Pips" class="mono text-[9px] text-emerald-200/90 block leading-tight truncate">+-- pt (Runner)</span>
              </div>
            </div>
          </div>

          <!-- Strict 1% Risk Calculator (MT5 Lot Size Sizer) -->
          <div class="bg-slate-950/80 p-2.5 sm:p-3 rounded-lg border border-slate-800 space-y-2">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>⚖️ Strict Risk Calculator</span>
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
            <div class="flex items-center gap-1 pt-0.5 overflow-x-auto scrollbar-none pb-0.5 text-[10px]">
              <span class="text-[9px] text-slate-500 uppercase font-bold mr-0.5 shrink-0">Preset:</span>
              <button type="button" onclick="setEquityPreset(500)" id="preset-eq-500" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold mono border border-slate-800 shrink-0">$500</button>
              <button type="button" onclick="setEquityPreset(1000)" id="preset-eq-1000" class="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-black mono border border-amber-400/40 shrink-0">$1K</button>
              <button type="button" onclick="setEquityPreset(5000)" id="preset-eq-5000" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold mono border border-slate-800 shrink-0">$5K</button>
              <button type="button" onclick="setEquityPreset(10000)" id="preset-eq-10000" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold mono border border-slate-800 shrink-0">$10K</button>
              <span class="text-slate-700 mx-0.5 shrink-0">|</span>
              <button type="button" onclick="setRiskPreset(0.25)" id="preset-rk-025" class="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black mono border border-amber-400 shrink-0">0.25% (V3.0)</button>
              <button type="button" onclick="setRiskPreset(0.5)" id="preset-rk-05" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold mono border border-slate-800 shrink-0">0.5%</button>
              <button type="button" onclick="setRiskPreset(1.0)" id="preset-rk-10" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold mono border border-slate-800 shrink-0">1.0%</button>
              <button type="button" onclick="setRiskPreset(2.0)" id="preset-rk-20" class="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-rose-300 font-bold mono border border-slate-800 shrink-0">2.0%</button>
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
                <span class="text-[8px] text-slate-400 uppercase block">1:1.5 / 1:2.5</span>
                <span id="calcRewardUsd" class="mono text-[10px] sm:text-[11px] font-bold text-emerald-400">+$3.75 / +$6.25</span>
              </div>
            </div>
          </div>

          <!-- 1-Click Copy & Push to Telegram Actions -->
          <div class="grid grid-cols-3 gap-1.5">
            <button onclick="copyTradeSignal()" class="py-2.5 px-2.5 rounded-lg font-black text-xs sm:text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 transition shadow-md shadow-amber-400/20 active:scale-[0.99] flex items-center justify-center gap-1">
              <span>📋</span><span class="hidden xs:inline">Copy</span><span> Setup</span>
            </button>
            <button onclick="copyFastOrder()" class="py-2.5 px-2.5 rounded-lg font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 transition active:scale-[0.99] flex items-center justify-center gap-1" title="Copy compact MT5 order syntax (Hotkey: C)">
              <span>⚡</span><span class="hidden xs:inline">Fast </span><span>MT5</span>
            </button>
            <button onclick="broadcastCurrentToTelegram()" class="py-2.5 px-2.5 rounded-lg font-bold text-xs sm:text-sm bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition active:scale-[0.99] flex items-center justify-center gap-1" title="Push this setup to your Telegram Channel">
              <span>📢</span><span class="hidden xs:inline">Telegram</span>
            </button>
          </div>
        </section>

      </div>

    </div>

    <!-- ========================================================================= -->
    <!-- TIER 3: UNIFIED MULTI-TIMEFRAME & TRADE HISTORY HUB (CLEAN TABBED DRAWER)  -->
    <!-- All-TF Matrix Grid • MTF Table • 85%+ Setups • Signals Log • 20-Trd Journal-->
    <!-- ========================================================================= -->
    <section class="panel rounded-xl p-3.5 sm:p-4 space-y-3.5 border border-slate-800/80">
      <div class="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/70 pb-2.5">
        <div>
          <h2 class="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <span>Historical &amp; Multi-Timeframe Analysis Hub</span>
          </h2>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Access the 6-TF Matrix, 85%+ high-confidence setups, activated signals log, and 20-trade discipline journal.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div class="flex items-center overflow-x-auto flex-nowrap scrollbar-none gap-0.5 p-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs w-full sm:w-auto">
            <button id="btnViewTable" onclick="setMtfView('table')" class="whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md text-xs font-black bg-amber-400 text-slate-950 transition shadow-sm">
              📊 Multi-TF Table
            </button>
            <button id="btnViewGrid" onclick="setMtfView('grid')" class="whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md text-xs font-bold text-slate-400 hover:text-white transition">
              🔲 6-TF Grid
            </button>
            <button id="btnViewConfident" onclick="setMtfView('confident')" class="whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md text-xs font-bold text-slate-400 hover:text-white transition">
              ⭐ 85%+ Setups
            </button>
            <button id="btnViewSignals" onclick="setMtfView('signals')" class="whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md text-xs font-bold text-slate-400 hover:text-white transition">
              🌊 Trade Entry Flow
            </button>
            <button id="btnViewJournal" onclick="setMtfView('journal')" class="whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md text-xs font-bold text-slate-400 hover:text-white transition">
              📘 D1 Trade History
            </button>
            <button id="btnViewFeed" onclick="setMtfView('feed')" class="whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md text-xs font-bold text-slate-400 hover:text-white transition">
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

      <!-- Tab Pane 4: Active Timeframe Entry Logs & Real-Time Orders (Execution Flow) -->
      <div id="tabSignalsContainer" class="space-y-3.5 hidden">
        <!-- Flow Header & Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-extrabold uppercase tracking-wider text-white">🌊 Trade Entry Execution Flow</span>
              <span id="entryFlowCountBadge" class="px-2 py-0.5 rounded text-[10px] font-black mono bg-amber-400 text-slate-950">-- SETUPS</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">
              Visual 4-Stage Lifecycle: Sweep ➔ MSS Displacement ➔ FVG CE 50% Entry ➔ TP1 (+1.5R & BE) ➔ TP2 Runner (+2.5R)
            </p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <!-- View Mode Switch: Flow View vs Table View -->
            <div class="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button id="btnSigViewFlow" onclick="setEntryListViewMode('flow')" class="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-400 text-slate-950 shadow-sm transition">
                🌊 Flow View
              </button>
              <button id="btnSigViewTable" onclick="setEntryListViewMode('table')" class="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">
                📋 Table View
              </button>
            </div>

            <!-- Timeframe Filter Buttons -->
            <div class="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 overflow-x-auto scrollbar-none flex-nowrap max-w-full gap-1">
              <button onclick="filterSignalList('90PLUS')" id="flt-90PLUS" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-400 text-slate-950 shadow-sm">⭐ 90%+ ONLY</button>
              <button onclick="filterSignalList('ALL')" id="flt-ALL" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white">ALL TFs</button>
              <button onclick="filterSignalList('1m')" id="flt-1m" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white">M1</button>
              <button onclick="filterSignalList('5m')" id="flt-5m" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white">M5</button>
              <button onclick="filterSignalList('15m')" id="flt-15m" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white">M15</button>
              <button onclick="filterSignalList('30m')" id="flt-30m" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white">M30</button>
              <button onclick="filterSignalList('1h')" id="flt-1h" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white">H1</button>
              <button onclick="filterSignalList('4h')" id="flt-4h" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white">H4</button>
            </div>
          </div>
        </div>

        <!-- Outcome Filter Chips & Analytical Mini-Metrics Strip -->
        <div class="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
          <!-- Outcome Filter Chips -->
          <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-nowrap max-w-full pb-0.5">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Status:</span>
            <button id="flt-st-ALL" onclick="filterSignalOutcome('ALL')" class="whitespace-nowrap shrink-0 px-2 py-0.5 rounded text-[11px] font-black bg-amber-400 text-slate-950">ALL</button>
            <button id="flt-st-ACTIVE" onclick="filterSignalOutcome('ACTIVE')" class="whitespace-nowrap shrink-0 px-2 py-0.5 rounded text-[11px] font-bold text-sky-400 hover:bg-slate-800">⚡ ACTIVE</button>
            <button id="flt-st-TP2" onclick="filterSignalOutcome('TP2')" class="whitespace-nowrap shrink-0 px-2 py-0.5 rounded text-[11px] font-bold text-emerald-300 hover:bg-slate-800">🏆 TP2 (+2.5R)</button>
            <button id="flt-st-TP1" onclick="filterSignalOutcome('TP1')" class="whitespace-nowrap shrink-0 px-2 py-0.5 rounded text-[11px] font-bold text-emerald-400 hover:bg-slate-800">✅ TP1 (+1.5R)</button>
            <button id="flt-st-BE" onclick="filterSignalOutcome('BE')" class="whitespace-nowrap shrink-0 px-2 py-0.5 rounded text-[11px] font-bold text-amber-300 hover:bg-slate-800">🛡️ BE EXITS</button>
            <button id="flt-st-SL" onclick="filterSignalOutcome('SL')" class="whitespace-nowrap shrink-0 px-2 py-0.5 rounded text-[11px] font-bold text-rose-400 hover:bg-slate-800">❌ SL</button>
          </div>

          <!-- Mini Metrics Summary -->
          <div class="flex items-center gap-3 font-mono text-[11px] text-slate-300">
            <span>Win Rate: <strong id="flowWinRate" class="text-emerald-400 font-black">--%</strong></span>
            <span>Target: <strong class="text-amber-300 font-bold">+2.0R Net</strong></span>
            <span>Risk/Trade: <strong class="text-white font-bold">0.25%</strong></span>
          </div>
        </div>

        <!-- View Pane 1: Flow Cards Pipeline (Default) -->
        <div id="allSignalsFlowContainer" class="space-y-3">
          <!-- Populated dynamically with rich Flow Cards -->
        </div>

        <!-- View Pane 2: High-Density Data Table (Alternative) -->
        <div id="allSignalsTableWrap" data-scroll-key="all-signals-table-wrap" onscroll="onInnerScroll(this)" class="overflow-x-auto rounded-xl border border-slate-800/60 hidden">
          <div class="text-[10px] text-slate-500 block sm:hidden font-mono p-2">← Swipe table sideways on mobile →</div>
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
            <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-nowrap max-w-full">
              <span class="text-[11px] font-bold text-slate-400 uppercase mr-1 shrink-0">Timeframe:</span>
              <div class="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 flex-nowrap gap-0.5">
                <button onclick="setD1HistoryFilter('timeframe', 'ALL')" id="d1flt-tf-ALL" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950">ALL</button>
                <button onclick="setD1HistoryFilter('timeframe', '1m')" id="d1flt-tf-1m" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M1</button>
                <button onclick="setD1HistoryFilter('timeframe', '5m')" id="d1flt-tf-5m" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M5</button>
                <button onclick="setD1HistoryFilter('timeframe', '15m')" id="d1flt-tf-15m" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M15</button>
                <button onclick="setD1HistoryFilter('timeframe', '30m')" id="d1flt-tf-30m" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">M30</button>
                <button onclick="setD1HistoryFilter('timeframe', '1h')" id="d1flt-tf-1h" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">H1</button>
                <button onclick="setD1HistoryFilter('timeframe', '4h')" id="d1flt-tf-4h" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">H4</button>
              </div>
            </div>

            <!-- Grade Filter -->
            <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-nowrap">
              <span class="text-[11px] font-bold text-slate-400 uppercase mr-1 shrink-0">Grade:</span>
              <div class="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 flex-nowrap gap-0.5">
                <button onclick="setD1HistoryFilter('grade', 'ALL')" id="d1flt-gr-ALL" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded text-xs font-black bg-amber-400 text-slate-950">ALL</button>
                <button onclick="setD1HistoryFilter('grade', '90PLUS')" id="d1flt-gr-90PLUS" class="whitespace-nowrap shrink-0 px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">⭐ 90%+ ONLY</button>
              </div>
            </div>

            <!-- Outcome Filter -->
            <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-nowrap max-w-full">
              <span class="text-[11px] font-bold text-slate-400 uppercase mr-1 shrink-0">Outcome:</span>
              <div class="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 flex-nowrap gap-0.5">
                <button onclick="setD1HistoryFilter('outcome', 'ALL')" id="d1flt-oc-ALL" class="whitespace-nowrap shrink-0 px-2 py-1 rounded text-xs font-black bg-amber-400 text-slate-950">ALL</button>
                <button onclick="setD1HistoryFilter('outcome', 'WINS')" id="d1flt-oc-WINS" class="whitespace-nowrap shrink-0 px-2 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">WINS</button>
                <button onclick="setD1HistoryFilter('outcome', 'TP2_HIT')" id="d1flt-oc-TP2_HIT" class="whitespace-nowrap shrink-0 px-2 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">🏆 TP2</button>
                <button onclick="setD1HistoryFilter('outcome', 'TP1_HIT')" id="d1flt-oc-TP1_HIT" class="whitespace-nowrap shrink-0 px-2 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">✅ TP1</button>
                <button onclick="setD1HistoryFilter('outcome', 'BE_EXIT')" id="d1flt-oc-BE_EXIT" class="whitespace-nowrap shrink-0 px-2 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">🛡️ BE</button>
                <button onclick="setD1HistoryFilter('outcome', 'SL_HIT')" id="d1flt-oc-SL_HIT" class="whitespace-nowrap shrink-0 px-2 py-1 rounded text-xs font-bold text-slate-400 hover:text-white">❌ SL</button>
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
  <div id="hotkeysModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm hidden flex items-center justify-center p-3 sm:p-4" onclick="if(event.target===this) toggleHotkeysModal(false)">
    <div class="panel rounded-2xl max-w-md w-full p-4 sm:p-5 space-y-3 sm:space-y-4 border-amber-500/40 shadow-2xl shadow-amber-500/10 max-h-[90vh] overflow-y-auto">
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

  <!-- Telegram Channel Broadcast Settings & Test Modal -->
  <div id="telegramModal" class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm hidden flex items-center justify-center p-3 sm:p-4" onclick="if(event.target===this) toggleTelegramModal(false)">
    <div class="panel rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-3 sm:space-y-4 border-sky-500/40 shadow-2xl shadow-sky-500/10 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <span class="text-xl">📱</span>
          <div>
            <h3 class="text-sm font-extrabold uppercase text-white tracking-wider">Telegram Channel Broadcast Hub</h3>
            <p class="text-[11px] text-slate-400">Stream 4-Confluence V3.0 High-Confidence (A+) setups to your community</p>
          </div>
        </div>
        <button onclick="toggleTelegramModal(false)" class="text-slate-400 hover:text-white text-base">✕</button>
      </div>

      <!-- Current Status Card -->
      <div id="tgStatusCard" class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Connection Status</span>
          <span id="tgStatusPill" class="px-2 py-0.5 rounded text-[10px] font-black mono bg-slate-800 text-slate-400">Checking...</span>
        </div>
        <div class="flex items-center justify-between text-xs mono">
          <span class="text-slate-400">Target Channel:</span>
          <span id="tgTargetChannel" class="text-white font-bold">Not configured</span>
        </div>
        <div class="flex items-center justify-between text-xs mono">
          <span class="text-slate-400">Filter Level:</span>
          <span class="text-amber-300 font-bold">Grade A+ (Score ≥ 90 PTS • 4/4 Confluences)</span>
        </div>
      </div>

      <!-- Test Broadcast Action -->
      <div class="space-y-2">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Send Test Alert</label>
        <div class="flex gap-2">
          <input type="text" id="tgCustomChatInput" placeholder="Optional Chat ID / Channel (leave blank for .env default)" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 mono">
          <button id="tgSendTestBtn" onclick="sendTelegramTestAlert()" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 whitespace-nowrap">
            <span>🚀 Send Test</span>
          </button>
        </div>
        <div id="tgTestResult" class="text-[11px] font-mono hidden p-2 rounded-lg"></div>
      </div>

      <!-- Setup Instructions Accordion -->
      <details class="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-2 group">
        <summary class="cursor-pointer font-bold text-amber-300 flex items-center justify-between select-none">
          <span>📖 How to connect your Telegram Channel (3 Steps)</span>
          <span class="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="pt-2 text-slate-300 space-y-2 leading-relaxed text-[11px]">
          <p><strong>1. Create a Bot:</strong> Open <a href="https://t.me/BotFather" target="_blank" class="text-sky-400 underline">@BotFather</a> on Telegram, send <code>/newbot</code>, and copy your Bot API Token.</p>
          <p><strong>2. Add Bot to Channel:</strong> Create a public or private channel on Telegram, go to Channel Settings ➔ Administrators ➔ Add your bot with <em>"Post Messages"</em> permission.</p>
          <p><strong>3. Save to .env:</strong> Open your project's <code>.env</code> file and add:</p>
          <pre class="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-amber-200 mono select-all">TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNo...
TELEGRAM_CHAT_ID=@your_channel_username
TELEGRAM_AUTO_BROADCAST=true
TELEGRAM_MIN_SCORE=90</pre>
          <p class="text-slate-400">Restart the server or click <em>Send Test</em> above to confirm!</p>
        </div>
      </details>

      <div class="flex items-center justify-between pt-1">
        <span class="text-[10px] text-slate-500">Only verified 4/4 mandatory A+ setups are broadcasted</span>
        <button onclick="toggleTelegramModal(false)" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">Close</button>
      </div>
    </div>
  </div>

  <!-- MetaTrader 5 Real-Time Live Bridge Modal -->
  <div id="mt5Modal" class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm hidden flex items-center justify-center p-3 sm:p-4" onclick="if(event.target===this) toggleMt5Modal(false)">
    <div class="panel rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-3 sm:space-y-4 border-amber-500/40 shadow-2xl shadow-amber-500/10 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <span class="text-xl">⚡</span>
          <div>
            <h3 class="text-sm font-extrabold uppercase text-white tracking-wider">MetaTrader 5 Real-Time Live Bridge</h3>
            <p class="text-[11px] text-slate-400">Stream live broker ticks &amp; candles directly into Indecator</p>
          </div>
        </div>
        <button onclick="toggleMt5Modal(false)" class="text-slate-400 hover:text-white text-base">✕</button>
      </div>

      <!-- Live Diagnostics Status Card -->
      <div id="mt5DiagnosticsBox" class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">MT5 Bridge Connection</span>
          <span id="mt5ModalStatusBadge" class="px-2 py-0.5 rounded text-[10px] font-black mono bg-slate-800 text-slate-400">
            AWAITING FEED
          </span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
          <div class="p-2 rounded bg-slate-950 border border-slate-800">
            <span class="text-[9px] text-slate-500 uppercase block">Broker</span>
            <span id="mt5DiagBroker" class="font-bold text-white truncate block">--</span>
          </div>
          <div class="p-2 rounded bg-slate-950 border border-slate-800">
            <span class="text-[9px] text-slate-500 uppercase block">Account</span>
            <span id="mt5DiagAccount" class="font-bold text-amber-300 truncate block">--</span>
          </div>
          <div class="p-2 rounded bg-slate-950 border border-slate-800">
            <span class="text-[9px] text-slate-500 uppercase block">Latency</span>
            <span id="mt5DiagLatency" class="font-bold text-emerald-400 block">-- ms</span>
          </div>
          <div class="p-2 rounded bg-slate-950 border border-slate-800">
            <span class="text-[9px] text-slate-500 uppercase block">Updates</span>
            <span id="mt5DiagUpdates" class="font-bold text-sky-400 block">0</span>
          </div>
        </div>
      </div>

      <!-- Quick 3-Step Setup Instructions -->
      <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-2">
        <div class="font-extrabold text-amber-300 flex items-center justify-between">
          <span>🚀 2-Minute MT5 Setup Instructions</span>
        </div>
        <ol class="space-y-1.5 list-decimal list-inside text-slate-300 text-[11px] leading-relaxed">
          <li>In MT5, click <strong class="text-white">Tools → Options → Expert Advisors</strong>.</li>
          <li>Check <strong class="text-white">&quot;Allow WebRequest for listed URL&quot;</strong> and add: <code class="bg-slate-900 px-1 py-0.5 rounded text-amber-300">http://localhost:3000</code></li>
          <li>Click <strong class="text-white">Download EA (.mq5)</strong> below and save to MT5 <code class="bg-slate-900 px-1 py-0.5 rounded text-slate-300">MQL5/Experts/</code>.</li>
          <li>Compile in MetaEditor and drag onto your Gold or Crypto chart!</li>
        </ol>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800">
        <a href="/api/mt5/ea" download="IndecatorBridge.mq5" class="py-2.5 px-3 rounded-xl font-black text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition flex items-center justify-center gap-1.5 shadow-md">
          <span>📥 Download MQL5 EA (.mq5)</span>
        </a>
        <a href="/api/mt5/python" download="mt5_bridge.py" class="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition flex items-center justify-center gap-1.5">
          <span>🐍 Python MT5 Bridge (.py)</span>
        </a>
      </div>

      <div class="flex items-center justify-between pt-1">
        <button onclick="testMt5Ping()" class="text-xs text-amber-400 hover:underline flex items-center gap-1">
          <span>🔄 Send Ingestion Test Ping</span>
        </button>
        <button onclick="toggleMt5Modal(false)" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">Close</button>
      </div>
    </div>
  </div>

  <!-- Fixed Mobile Bottom Quick-Action Bar (sm:hidden) -->
  <div id="mobileBottomBar" class="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 safe-pb flex items-center justify-between shadow-2xl sm:hidden">
    <div class="flex items-center gap-2">
      <div onclick="switchTimeframe(getNextTimeframe())" class="cursor-pointer px-2 py-1 rounded bg-slate-800 border border-slate-700 text-amber-300 font-black mono text-xs uppercase flex items-center gap-1 active:scale-95 transition" title="Tap to switch timeframe">
        <span id="mobTfBadge">15M</span>
        <span class="text-[9px] text-slate-400">▼</span>
      </div>
      <div>
        <div class="flex items-center gap-1.5">
          <span id="mobSignalType" class="px-1.5 py-0.2 rounded text-[10px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">BUY</span>
          <span id="mobPrice" class="mono text-xs font-black text-white">$----.--</span>
        </div>
        <div class="flex items-center gap-1 text-[9px] mono text-slate-400">
          <span id="mobGradeScore" class="text-amber-300 font-bold">A+ 95%</span>
          <span>•</span>
          <span id="mobPnl" class="font-bold text-emerald-400">+$0.00</span>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-1.5">
      <button onclick="copyTradeSignal()" class="px-2.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs transition active:scale-95 shadow-md flex items-center gap-1">
        <span>📋</span><span>Copy</span>
      </button>
      <button onclick="broadcastCurrentToTelegram()" class="px-2 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold text-xs transition active:scale-95" title="Push to Telegram">
        <span>📢</span>
      </button>
      <button onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs active:scale-95" title="Back to top">
        <span>⬆️</span>
      </button>
    </div>
  </div>

  <div id="copyToast" class="fixed bottom-16 sm:bottom-5 right-5 z-50 hidden px-4 py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-xl">
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

    // Cross-Market Signal Radar State
    let radarSignals = [];
    let radarFilter = 'ALL';
    let isRadarScanning = false;

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

    function switchSymbolAndTf(sym, tf) {
      let changed = false;
      if (currentSymbol !== sym) {
        currentSymbol = sym;
        localStorage.setItem('selectedSymbol', sym);
        updateSymbolButtons();
        lastKnownBid = null;
        lastGridSig = '';
        lastTableSig = '';
        lastHighConfSig = '';
        connectRealtimeTickStream();
        changed = true;
      }
      if (currentTf !== tf) {
        currentTf = tf;
        ['1m', '5m', '15m', '30m', '1h', '4h'].forEach((id) => {
          const btn = document.getElementById('tf-' + id);
          if (!btn) return;
          btn.className = id === tf
            ? 'px-2.5 py-1.5 rounded-md text-xs font-bold transition-all bg-amber-400 text-slate-950'
            : 'px-2.5 py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white';
        });
        changed = true;
      }
      loadSignalData();
      renderSignalRadar();
      const hero = document.getElementById('heroBanner');
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function setRadarFilter(filter) {
      radarFilter = filter;
      const map = { ALL: 'radarFilterAll', IN_ZONE: 'radarFilterInZone', A_PLUS: 'radarFilterAPlus', ACTIVE: 'radarFilterActive' };
      ['ALL', 'IN_ZONE', 'A_PLUS', 'ACTIVE'].forEach((f) => {
        const btn = document.getElementById(map[f]);
        if (!btn) return;
        if (f === filter) {
          btn.className = 'px-2 py-1 rounded font-black bg-amber-400 text-slate-950 transition';
        } else {
          btn.className = 'px-2 py-1 rounded font-bold text-slate-400 hover:text-white transition';
        }
      });
      renderSignalRadar();
    }

    async function fetchSignalRadar() {
      if (isRadarScanning) return;
      isRadarScanning = true;
      const refreshIcon = document.getElementById('radarRefreshIcon');
      if (refreshIcon) refreshIcon.classList.add('animate-spin');

      try {
        const res = await fetch('/api/radar');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.signals && Array.isArray(data.signals)) {
          radarSignals = data.signals;
          renderSignalRadar();
          const badge = document.getElementById('radarCountBadge');
          if (badge && data.summary) {
            badge.textContent = data.summary.totalSignals + ' Signals (' + data.summary.inZoneCount + ' In Zone • ' + data.summary.aPlusCount + ' A+)';
          }
        }
      } catch (err) {
        console.warn('Failed to fetch radar signals:', err);
      } finally {
        isRadarScanning = false;
        if (refreshIcon) refreshIcon.classList.remove('animate-spin');
      }
    }

    function renderSignalRadar() {
      const container = document.getElementById('radarCardsContainer');
      if (!container) return;

      let filtered = radarSignals;
      if (radarFilter === 'IN_ZONE') {
        filtered = radarSignals.filter((s) => s.proximityState === 'IN_ZONE');
      } else if (radarFilter === 'A_PLUS') {
        filtered = radarSignals.filter((s) => s.grade === 'A+' || s.score >= 90);
      } else if (radarFilter === 'ACTIVE') {
        filtered = radarSignals.filter((s) => s.isActivated || s.proximityState === 'ACTIVE');
      }

      if (filtered.length === 0) {
        container.innerHTML = [
          '<div class="w-full py-5 text-center text-xs text-slate-400 panel rounded-xl border border-dashed border-slate-800">',
          '<span>No setups found matching filter: <strong class="text-amber-300">' + radarFilter + '</strong>. Tap </span>',
          '<button onclick="setRadarFilter(\\'ALL\\')" class="text-amber-400 font-bold underline">All Setups</button>',
          '<span> to view all live market signals.</span>',
          '</div>'
        ].join('');
        return;
      }

      container.innerHTML = filtered.map((s) => {
        const isSelected = s.symbol === currentSymbol && s.timeframe === currentTf;
        const isZone = s.proximityState === 'IN_ZONE';
        const isActive = s.proximityState === 'ACTIVE' || s.isActivated;
        const isApproaching = s.proximityState === 'APPROACHING';
        const isBuy = s.direction === 'BUY';

        let cardBorder = 'border-slate-800/80 hover:border-slate-700';
        let cardBg = 'bg-slate-900/60 hover:bg-slate-900/80';
        if (isSelected) {
          cardBorder = 'border-amber-400/80 shadow-md shadow-amber-400/10';
          cardBg = 'bg-amber-400/10';
        } else if (isZone) {
          cardBorder = 'border-emerald-500/50 shadow-md shadow-emerald-500/10';
          cardBg = 'bg-emerald-950/20';
        } else if (isActive) {
          cardBorder = 'border-sky-500/40 shadow-md shadow-sky-500/10';
          cardBg = 'bg-sky-950/20';
        }

        let proxBadgeHtml = '';
        if (isZone) {
          proxBadgeHtml = '<span class="px-2 py-0.5 rounded text-[9px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>IN ENTRY ZONE</span>';
        } else if (isActive) {
          proxBadgeHtml = '<span class="px-2 py-0.5 rounded text-[9px] font-black mono bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>' + s.proximityBadge + '</span>';
        } else if (isApproaching) {
          proxBadgeHtml = '<span class="px-2 py-0.5 rounded text-[9px] font-black mono bg-amber-500/20 text-amber-300 border border-amber-500/40">⏳ SET LIMIT</span>';
        } else {
          proxBadgeHtml = '<span class="px-2 py-0.5 rounded text-[9px] font-black mono bg-slate-800 text-slate-400">' + s.proximityBadge + '</span>';
        }

        const dirBadge = isBuy
          ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">🟢 BUY</span>'
          : '<span class="px-1.5 py-0.5 rounded text-[10px] font-black mono bg-rose-500/20 text-rose-300 border border-rose-500/30">🔴 SELL</span>';

        const gradeBadge = (s.grade === 'A+' || s.score >= 90)
          ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-black mono bg-amber-400 text-slate-950 shadow-sm">⭐ ' + s.grade + ' ' + s.score + 'pts</span>'
          : '<span class="px-1.5 py-0.5 rounded text-[9px] font-black mono bg-slate-800 text-slate-300">' + s.grade + ' ' + s.score + 'pts</span>';

        return [
          '<div onclick="switchSymbolAndTf(\\'' + s.symbol + '\\', \\'' + s.timeframe + '\\')" class="min-w-[270px] sm:min-w-[290px] max-w-[310px] shrink-0 p-3 rounded-xl border ' + cardBorder + ' ' + cardBg + ' space-y-2 cursor-pointer transition active:scale-[0.99] snap-start">',
          '<div class="flex items-center justify-between">',
          '<div class="flex items-center gap-1.5">',
          '<span class="text-base">' + s.symbolIcon + '</span>',
          '<span class="font-extrabold text-xs text-white">' + s.symbolName + '</span>',
          '<span class="px-1.5 py-0.2 rounded text-[10px] font-black mono bg-slate-800 text-amber-300">' + s.timeframe.toUpperCase() + '</span>',
          '</div>',
          '<div class="flex items-center gap-1">',
          dirBadge,
          '</div>',
          '</div>',

          '<div class="flex items-center justify-between text-xs">',
          gradeBadge,
          proxBadgeHtml,
          '</div>',

          '<div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 grid grid-cols-2 gap-1.5 text-[11px] mono">',
          '<div>',
          '<span class="text-[9px] text-slate-500 uppercase block">CE 50% Limit</span>',
          '<span class="font-black text-amber-300">$' + s.pullbackEntry.toFixed(2) + '</span>',
          '</div>',
          '<div class="text-right">',
          '<span class="text-[9px] text-slate-500 uppercase block">Distance</span>',
          '<span class="font-bold ' + (isZone ? 'text-emerald-400' : 'text-slate-300') + '">' + s.distanceLabel + '</span>',
          '</div>',
          '<div class="pt-1 border-t border-slate-800/60">',
          '<span class="text-[9px] text-slate-500 uppercase block">Hard SL</span>',
          '<span class="font-bold text-rose-400">$' + s.stopLoss.toFixed(2) + '</span>',
          '</div>',
          '<div class="pt-1 border-t border-slate-800/60 text-right">',
          '<span class="text-[9px] text-slate-500 uppercase block">Target 1</span>',
          '<span class="font-bold text-emerald-400">$' + s.tp1.toFixed(2) + '</span>',
          '</div>',
          '</div>',

          '<button onclick="event.stopPropagation(); switchSymbolAndTf(\\'' + s.symbol + '\\', \\'' + s.timeframe + '\\')" class="w-full py-1.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 ' + (isZone ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-md shadow-emerald-400/20' : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700') + '">',
          '<span>⚡ Inspect & Trade</span>',
          '<span>→</span>',
          '</button>',
          '</div>'
        ].join('');
      }).join('');
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

      const activeBtnCls = 'whitespace-nowrap shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black bg-amber-400 text-slate-950 transition shadow-sm';
      const inactiveBtnCls = 'whitespace-nowrap shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition';

      Object.entries(tabBtns).forEach(([k, btn]) => {
        if (btn) btn.className = k === mode ? activeBtnCls : inactiveBtnCls;
      });

      if (mode === 'journal') {
        fetchD1History();
      }
    }

    let currentChartHeight = window.innerWidth < 640 ? 380 : 620;
    let isChartFocusMode = false;
    let smartMoneyOverlayFilter = 'ALL';

    function setChartHeight(h) {
      currentChartHeight = h;
      const priceEl = document.getElementById('priceChart');
      if (priceEl) {
        priceEl.style.height = h + 'px';
      }
      if (priceChart && priceEl) {
        priceChart.applyOptions({ height: h, width: priceEl.clientWidth });
        priceChart.timeScale().fitContent();
        if (typeof scheduleRRBoxOverlay === 'function') scheduleRRBoxOverlay();
      }
      const b560 = document.getElementById('btnSize560');
      const b680 = document.getElementById('btnSize680');
      const b820 = document.getElementById('btnSize820');
      if (b560) b560.className = h === 560 ? 'px-1.5 py-0.5 rounded font-black bg-slate-800 text-amber-300 transition' : 'px-1.5 py-0.5 rounded font-bold text-slate-400 hover:text-white transition';
      if (b680) b680.className = h === 680 ? 'px-1.5 py-0.5 rounded font-black bg-slate-800 text-amber-300 transition' : 'px-1.5 py-0.5 rounded font-bold text-slate-400 hover:text-white transition';
      if (b820) b820.className = h === 820 ? 'px-1.5 py-0.5 rounded font-black bg-slate-800 text-amber-300 transition' : 'px-1.5 py-0.5 rounded font-bold text-slate-400 hover:text-white transition';
      showToast('📐 Chart Height: ' + h + 'px');
    }

    function toggleChartFocusMode() {
      isChartFocusMode = !isChartFocusMode;
      const colLeft = document.getElementById('mainLeftColumn');
      const colRight = document.getElementById('mainRightColumn');
      const btn = document.getElementById('btnChartFocus');
      const label = document.getElementById('btnChartFocusLabel');

      if (isChartFocusMode) {
        if (colLeft) colLeft.className = 'xl:col-span-12 space-y-3.5 transition-all';
        if (colRight) colRight.className = 'xl:col-span-12 space-y-3.5 transition-all pt-3 border-t border-slate-800';
        if (btn) btn.className = 'px-2 py-1 rounded-md text-[10px] sm:text-xs font-black bg-amber-400 text-slate-950 transition flex items-center gap-1 shadow-sm';
        if (label) label.textContent = 'Exit Focus';
        setChartHeight(720);
        showToast('🖥️ Full-Width Focus Mode ON');
      } else {
        if (colLeft) colLeft.className = 'xl:col-span-7 2xl:col-span-8 space-y-3.5 transition-all';
        if (colRight) colRight.className = 'xl:col-span-5 2xl:col-span-4 space-y-3.5 transition-all';
        if (btn) btn.className = 'px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-slate-900 border border-slate-700/80 text-amber-300 hover:bg-slate-800 transition flex items-center gap-1';
        if (label) label.textContent = 'Focus';
        setChartHeight(window.innerWidth < 640 ? 380 : 620);
        showToast('Standard 2-Column Mode');
      }
    }

    function setSmartMoneyOverlayFilter(filter) {
      smartMoneyOverlayFilter = filter;
      const btnAll = document.getElementById('smFilterAll');
      const btnFvg = document.getElementById('smFilterFvg');
      const btnOb = document.getElementById('smFilterOb');
      const btnSig = document.getElementById('smFilterSig');

      const activeCls = 'px-2 py-0.5 rounded font-black bg-amber-400 text-slate-950 transition';
      const inactiveCls = 'px-2 py-0.5 rounded font-bold text-slate-400 hover:text-white transition';

      if (btnAll) btnAll.className = filter === 'ALL' ? activeCls : inactiveCls;
      if (btnFvg) btnFvg.className = filter === 'FVG' ? activeCls : inactiveCls;
      if (btnOb) btnOb.className = filter === 'OB' ? activeCls : inactiveCls;
      if (btnSig) btnSig.className = filter === 'SIGNALS' ? activeCls : inactiveCls;

      if (currentAnalysis) {
        updateChartSmartMoneyMarkers(currentAnalysis);
      }
      showToast('🏷️ Overlay: ' + filter);
    }

    function updateChartSmartMoneyMarkers(data) {
      if (!candleSeries || !data) return;
      const markers = [];
      const candles = data.series || [];
      const minTime = candles[0]?.time ?? 0;

      // 1. Historical Signals (A+, A, etc.)
      if (smartMoneyOverlayFilter === 'ALL' || smartMoneyOverlayFilter === 'SIGNALS') {
        const sigs = (data.historicalSignals || []).filter((s) => s.time >= minTime);
        for (let i = 0; i < sigs.length; i++) {
          const s = sigs[i];
          markers.push({
            time: s.time,
            position: s.type === 'BUY' ? 'belowBar' : 'aboveBar',
            color: s.type === 'BUY' ? '#10b981' : '#f43f5e',
            shape: s.type === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: (s.grade || 'A') + ' ' + s.type,
          });
        }
      }

      // 2. Fair Value Gaps (FVGs)
      if (data.smartMoney && Array.isArray(data.smartMoney.fvgs)) {
        if (smartMoneyOverlayFilter === 'ALL' || smartMoneyOverlayFilter === 'FVG') {
          const fvgs = data.smartMoney.fvgs.filter((f) => f.time >= minTime);
          for (let i = 0; i < fvgs.length; i++) {
            const f = fvgs[i];
            const isBull = f.direction === 'BULLISH';
            markers.push({
              time: f.time,
              position: isBull ? 'belowBar' : 'aboveBar',
              color: isBull ? '#34d399' : '#fb7185',
              shape: 'circle',
              text: (isBull ? '+FVG' : '-FVG') + (f.isMitigated ? '' : ' 🔥'),
            });
          }
        }
      }

      // 3. Order Blocks (OBs)
      if (data.smartMoney && Array.isArray(data.smartMoney.orderBlocks)) {
        if (smartMoneyOverlayFilter === 'ALL' || smartMoneyOverlayFilter === 'OB') {
          const obs = data.smartMoney.orderBlocks.filter((o) => o.time >= minTime);
          for (let i = 0; i < obs.length; i++) {
            const o = obs[i];
            const isBull = o.direction === 'BULLISH';
            markers.push({
              time: o.time,
              position: isBull ? 'belowBar' : 'aboveBar',
              color: isBull ? '#a855f7' : '#e11d48',
              shape: 'square',
              text: isBull ? 'BULL OB' : 'BEAR OB',
            });
          }
        }
      }

      // 4. Liquidity Sweeps
      if (data.smartMoney && Array.isArray(data.smartMoney.sweeps)) {
        if (smartMoneyOverlayFilter === 'ALL') {
          const swps = data.smartMoney.sweeps.filter((w) => w.time >= minTime);
          for (let i = 0; i < swps.length; i++) {
            const w = swps[i];
            markers.push({
              time: w.time,
              position: w.direction === 'BULLISH' ? 'belowBar' : 'aboveBar',
              color: '#fbbf24',
              shape: w.direction === 'BULLISH' ? 'arrowUp' : 'arrowDown',
              text: '⚡ SWEEP',
            });
          }
        }
      }

      markers.sort((a, b) => a.time - b.time);
      try {
        candleSeries.setMarkers(markers);
      } catch (err) {
        console.warn('setMarkers error:', err);
      }

      updateSmartMoneyTelemetryStrip(data);
    }

    function updateSmartMoneyTelemetryStrip(data) {
      if (!data || !data.smartMoney) return;
      const sm = data.smartMoney;

      // FVG Card
      const fvgText = document.getElementById('chartActiveFvgText');
      const fvgBadge = document.getElementById('chartActiveFvgBadge');
      if (sm.activeFvg) {
        const af = sm.activeFvg;
        if (fvgText) fvgText.textContent = (af.direction === 'BULLISH' ? '🟢 Bullish ' : '🔴 Bearish ') + '$' + af.low.toFixed(2) + ' - $' + af.high.toFixed(2) + ' (CE: $' + af.cePrice.toFixed(2) + ')';
        if (fvgBadge) {
          fvgBadge.textContent = af.isMitigated ? 'MITIGATED' : '🔥 UNFILLED';
          fvgBadge.className = af.isMitigated ? 'mono text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0' : 'mono text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 shrink-0';
        }
      } else {
        if (fvgText) fvgText.textContent = 'No unmitigated FVG in active zone';
        if (fvgBadge) { fvgBadge.textContent = 'CLEAR'; fvgBadge.className = 'mono text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 shrink-0'; }
      }

      // Order Block Card
      const obText = document.getElementById('chartActiveObText');
      const obBadge = document.getElementById('chartActiveObBadge');
      if (sm.activeOrderBlock) {
        const ao = sm.activeOrderBlock;
        if (obText) obText.textContent = (ao.direction === 'BULLISH' ? '🟣 Bullish OB ' : '🔴 Bearish OB ') + '$' + ao.low.toFixed(2) + ' - $' + ao.high.toFixed(2) + ' (Mean: $' + ao.cePrice.toFixed(2) + ')';
        if (obBadge) {
          obBadge.textContent = ao.isMitigated ? 'TESTED' : '🧱 DEFENSE';
          obBadge.className = ao.isMitigated ? 'mono text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0' : 'mono text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0';
        }
      } else {
        if (obText) obText.textContent = 'No active order block';
        if (obBadge) { obBadge.textContent = 'NONE'; obBadge.className = 'mono text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 shrink-0'; }
      }

      // Sweep Card
      const swText = document.getElementById('chartActiveSweepText');
      const swBadge = document.getElementById('chartActiveSweepBadge');
      if (sm.sweeps && sm.sweeps.length > 0) {
        const lastSw = sm.sweeps[sm.sweeps.length - 1];
        if (swText) swText.textContent = lastSw.subText || 'Liquidity sweep confirmed';
        if (swBadge) {
          swBadge.textContent = 'PURGED';
          swBadge.className = 'mono text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0';
        }
      } else {
        if (swText) swText.textContent = 'Scanning for Asian/PDH/PDL sweeps';
        if (swBadge) { swBadge.textContent = 'READY'; swBadge.className = 'mono text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 shrink-0'; }
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
            background: { type: 'solid', color: '#07090e' },
            textColor: '#94a3b8',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
          },
          grid: {
            vertLines: { color: 'rgba(30, 41, 59, 0.35)' },
            horzLines: { color: 'rgba(30, 41, 59, 0.35)' },
          },
          crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
          rightPriceScale: { borderColor: '#1e293b' },
          timeScale: { borderColor: '#1e293b', timeVisible: true, secondsVisible: false },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: false,
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
          height: window.innerWidth < 640 ? 380 : currentChartHeight,
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

        priceEl.style.position = 'relative';
        let rrCanvas = document.getElementById('rrBoxOverlay');
        if (!rrCanvas && priceEl) {
          rrCanvas = document.createElement('canvas');
          rrCanvas.id = 'rrBoxOverlay';
          rrCanvas.style.position = 'absolute';
          rrCanvas.style.top = '0';
          rrCanvas.style.left = '0';
          rrCanvas.style.width = '100%';
          rrCanvas.style.height = '100%';
          rrCanvas.style.pointerEvents = 'none';
          rrCanvas.style.zIndex = '5';
          priceEl.appendChild(rrCanvas);
        }

        priceChart.timeScale().subscribeVisibleTimeRangeChange(() => {
          if (typeof scheduleRRBoxOverlay === 'function') scheduleRRBoxOverlay();
        });
        priceChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
          if (typeof scheduleRRBoxOverlay === 'function') scheduleRRBoxOverlay();
        });

        priceChart.subscribeCrosshairMove((param) => {
          const inspectPill = document.getElementById('chartInspectText');
          if (!inspectPill) return;
          if (!param || !param.time || !param.seriesPrices) {
            inspectPill.textContent = 'Move cursor over candles to inspect FVG, OB & levels';
            return;
          }
          const priceData = param.seriesPrices.get(candleSeries);
          if (!priceData) return;
          const o = priceData.open != null ? priceData.open.toFixed(2) : '--';
          const h = priceData.high != null ? priceData.high.toFixed(2) : '--';
          const l = priceData.low != null ? priceData.low.toFixed(2) : '--';
          const c = priceData.close != null ? priceData.close.toFixed(2) : '--';
          const diff = (priceData.close - priceData.open).toFixed(2);
          const sign = priceData.close >= priceData.open ? '+' : '';
          inspectPill.textContent = 'O: $' + o + ' H: $' + h + ' L: $' + l + ' C: $' + c + ' (' + sign + diff + ')';
        });

        window.addEventListener('resize', () => {
          if (!priceChart || !priceEl) return;
          const isMob = window.innerWidth < 640;
          priceChart.applyOptions({
            width: priceEl.clientWidth,
            height: isMob ? 380 : currentChartHeight,
          });
          if (typeof scheduleRRBoxOverlay === 'function') scheduleRRBoxOverlay();
        });

        if (window.ResizeObserver && priceEl) {
          const ro = new ResizeObserver(() => {
            if (priceChart && priceEl.clientWidth > 0) {
              priceChart.applyOptions({ width: priceEl.clientWidth });
              if (typeof scheduleRRBoxOverlay === 'function') scheduleRRBoxOverlay();
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

      // Live update Active Running rows in the Signals Log table and Flow Cards on every tick
      if (latestMtfData && latestMtfData.allHighProbSignals) {
        latestMtfData.allHighProbSignals.forEach((s) => {
          if (s.outcome === 'ACTIVE') {
            const diff = s.type === 'BUY' ? bid - s.entry : s.entry - bid;
            s.pnlDollarsPerOz = diff;
            const sign = diff >= 0 ? '+' : '';
            const pips = (diff * uInfo.mult).toFixed(1);
            const pipsStr = (diff >= 0 ? '+' : '') + pips + ' ' + uInfo.unit;
            const isProf = diff >= 0;

            const pnlCell = document.getElementById('sig-pnl-' + s.timeframe + '-' + s.time);
            if (pnlCell) {
              pnlCell.innerHTML = '<span class="px-2 py-0.5 rounded font-black ' +
                (isProf ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-rose-500/20 text-rose-300 border border-rose-400/40') +
                '">' + sign + '$' + diff.toFixed(2) + ' (' + pipsStr + ')</span>';
            }

            const flowPnl = document.getElementById('sig-flow-pnl-' + s.timeframe + '-' + s.time);
            if (flowPnl) {
              flowPnl.className = 'px-2.5 py-1 rounded-md text-xs font-black mono border ' +
                (isProf ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50' : 'bg-rose-500/20 text-rose-300 border-rose-400/50');
              flowPnl.textContent = sign + '$' + Math.abs(diff).toFixed(2) + ' (' + sign + pipsStr + ')';
            }

            const tp1Dist = Math.abs(s.tp1 - s.entry);
            let pct = 0;
            if (tp1Dist > 0) {
              pct = Math.max(0, Math.min(100, Math.round((diff / tp1Dist) * 60)));
            }
            const flowBar = document.getElementById('sig-flow-bar-' + s.timeframe + '-' + s.time);
            if (flowBar) {
              flowBar.style.width = pct + '%';
              flowBar.className = 'h-full rounded-full transition-all duration-300 ' + (isProf ? 'bg-emerald-400' : 'bg-rose-500');
            }
            const flowText = document.getElementById('sig-flow-progtext-' + s.timeframe + '-' + s.time);
            if (flowText) {
              flowText.textContent = pct + '% (' + sign + pipsStr + ')';
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

      if (typeof scheduleRRBoxOverlay === 'function') scheduleRRBoxOverlay();
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

      if (currentAnalysis && currentAnalysis.smartMoney) {
        const sm = currentAnalysis.smartMoney;
        if (sm.activeFvg && !sm.activeFvg.isMitigated) {
          activePriceLines.push(
            candleSeries.createPriceLine({
              price: sm.activeFvg.cePrice,
              color: sm.activeFvg.direction === 'BULLISH' ? 'rgba(52, 211, 153, 0.8)' : 'rgba(251, 113, 133, 0.8)',
              lineWidth: 1,
              lineStyle: LightweightCharts.LineStyle.Dotted,
              axisLabelVisible: true,
              title: (sm.activeFvg.direction === 'BULLISH' ? '🟢 +FVG CE 50% $' : '🔴 -FVG CE 50% $') + sm.activeFvg.cePrice.toFixed(2),
            })
          );
        }
        if (sm.activeOrderBlock && !sm.activeOrderBlock.isMitigated) {
          activePriceLines.push(
            candleSeries.createPriceLine({
              price: sm.activeOrderBlock.cePrice,
              color: 'rgba(168, 85, 247, 0.8)',
              lineWidth: 1,
              lineStyle: LightweightCharts.LineStyle.Dotted,
              axisLabelVisible: true,
              title: '🧱 OB MEAN $' + sm.activeOrderBlock.cePrice.toFixed(2),
            })
          );
        }
      }
    }

    let showRRBox = true;
    let selectedRRSetup = null;
    let rrAnimFrame = null;

    function scheduleRRBoxOverlay() {
      if (rrAnimFrame) return;
      rrAnimFrame = requestAnimationFrame(() => {
        rrAnimFrame = null;
        renderRRBoxOverlay();
      });
    }

    function toggleRRBox() {
      showRRBox = !showRRBox;
      const btn = document.getElementById('toggleRRBoxBtn');
      if (btn) {
        btn.textContent = '📐 R:R Tool: ' + (showRRBox ? 'ON' : 'OFF');
        btn.className = showRRBox
          ? 'px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 transition hover:bg-emerald-500/30'
          : 'px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 transition hover:bg-slate-700';
      }
      scheduleRRBoxOverlay();
      showToast('📐 TradingView R:R Tool: ' + (showRRBox ? 'ON' : 'OFF'));
    }

    function selectSignalForRR(sig) {
      if (!sig) return;
      selectedRRSetup = sig;
      scheduleRRBoxOverlay();
      showToast('📐 Focused: ' + (sig.type || sig.direction) + ' @ $' + Number(sig.entry).toFixed(2));
    }

    function renderRRBoxOverlay() {
      const priceEl = document.getElementById('priceChart');
      const canvas = document.getElementById('rrBoxOverlay');
      if (!priceEl || !canvas || !candleSeries || !priceChart) return;

      const rect = priceEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (!showRRBox) {
        ctx.restore();
        return;
      }

      const setup = selectedRRSetup || (currentAnalysis && currentAnalysis.tradeSetup);
      if (!setup) {
        ctx.restore();
        return;
      }

      const et = setup.entryTiming;
      const lc = et ? et.lifecycle : null;
      const entryPrice = Number((setup.entryPrice != null ? setup.entryPrice : (lc ? lc.entryPrice : setup.entry)) || 0);
      const stopLoss = Number((setup.stopLoss != null ? setup.stopLoss : (lc ? lc.stopLoss : setup.stopLoss)) || 0);
      const tp = Number((setup.tp2 != null ? setup.tp2 : (lc ? lc.tp2 : (setup.tp1 || 0))) || 0);
      const tp1 = Number((setup.tp1 != null ? setup.tp1 : (lc ? lc.tp1 : 0)) || 0);

      if (!entryPrice || !stopLoss || !tp) {
        ctx.restore();
        return;
      }

      const rawDir = String(setup.direction || setup.type || (lc && lc.direction) || 'BUY').toUpperCase();
      const isLong = rawDir === 'LONG' || rawDir === 'BUY';

      // Helper to convert price to Y coordinate
      const yEntry = candleSeries.priceToCoordinate(entryPrice);
      if (yEntry === null || typeof yEntry !== 'number' || isNaN(yEntry)) {
        ctx.restore();
        return;
      }

      function resolveY(price) {
        if (price == null || price === 0) return null;
        const y = candleSeries.priceToCoordinate(price);
        if (typeof y === 'number' && !isNaN(y)) return y;
        if (typeof lastKnownBid === 'number' && Math.abs(lastKnownBid - entryPrice) > 0.05) {
          const yBid = candleSeries.priceToCoordinate(lastKnownBid);
          if (typeof yBid === 'number' && !isNaN(yBid)) {
            const pxPerUnit = (yEntry - yBid) / (lastKnownBid - entryPrice);
            return yEntry - (price - entryPrice) * pxPerUnit;
          }
        }
        return null;
      }

      let yStop = resolveY(stopLoss);
      let yTarget = resolveY(tp);
      const yTp1 = tp1 ? resolveY(tp1) : null;

      if (yStop === null) yStop = isLong ? Math.min(rect.height - 15, yEntry + 100) : Math.max(15, yEntry - 100);
      if (yTarget === null) yTarget = isLong ? Math.max(15, yEntry - 180) : Math.min(rect.height - 15, yEntry + 180);

      const clampedYEntry = Math.max(8, Math.min(rect.height - 8, yEntry));
      const clampedYStop = Math.max(8, Math.min(rect.height - 8, yStop));
      const clampedYTarget = Math.max(8, Math.min(rect.height - 8, yTarget));

      // Calculate horizontal boundaries (X1 and X2)
      const plotWidth = priceChart.timeScale().width() || (rect.width - 65);
      const maxX = Math.max(80, plotWidth - 10);

      const candles = (currentAnalysis && currentAnalysis.series) || [];
      const lastBar = candles[candles.length - 1];
      const setupTime = (lc && lc.time) || (et && et.signalTime) || setup.time;

      let x1 = null;
      if (setupTime) {
        x1 = priceChart.timeScale().timeToCoordinate(setupTime);
      }
      if (x1 === null || x1 === undefined || x1 < 10) {
        const barsAgo = (et && et.barsSinceCross) ? Math.max(5, Math.min(45, et.barsSinceCross)) : 14;
        const targetIdx = Math.max(0, candles.length - 1 - barsAgo);
        if (candles[targetIdx]) {
          x1 = priceChart.timeScale().timeToCoordinate(candles[targetIdx].time);
        }
      }
      if (x1 === null || x1 === undefined || x1 < 10) {
        x1 = Math.max(15, maxX - 260);
      }

      const xLatest = lastBar ? (priceChart.timeScale().timeToCoordinate(lastBar.time) || (maxX - 80)) : (maxX - 80);
      let x2 = Math.min(maxX, Math.max(x1 + 140, xLatest + 110));
      if (x1 > xLatest) {
        x1 = Math.max(10, xLatest - 120);
      }
      if (x2 - x1 < 90) {
        x1 = Math.max(10, x2 - 90);
      }

      const boxW = x2 - x1;

      // Calculate vertical boxes
      const targetTop = isLong ? Math.min(clampedYTarget, clampedYEntry) : Math.min(clampedYEntry, clampedYTarget);
      const targetBottom = isLong ? Math.max(clampedYTarget, clampedYEntry) : Math.max(clampedYEntry, clampedYTarget);
      const targetH = Math.max(2, targetBottom - targetTop);

      const stopTop = isLong ? Math.min(clampedYEntry, clampedYStop) : Math.min(clampedYStop, clampedYEntry);
      const stopBottom = isLong ? Math.max(clampedYEntry, clampedYStop) : Math.max(clampedYStop, clampedYEntry);
      const stopH = Math.max(2, stopBottom - stopTop);

      function drawRoundRect(rx, ry, rw, rh, rad) {
        ctx.beginPath();
        ctx.moveTo(rx + rad, ry);
        ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, rad);
        ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, rad);
        ctx.arcTo(rx, ry + rh, rx, ry, rad);
        ctx.arcTo(rx, ry, rx + rw, ry, rad);
        ctx.closePath();
      }

      // 1. Draw Green Target Box (Profit Zone)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
      ctx.fillRect(x1, targetTop, boxW, targetH);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.strokeRect(x1, targetTop, boxW, targetH);

      // 2. Draw Red Stop Box (Risk Zone)
      ctx.fillStyle = 'rgba(244, 63, 94, 0.24)';
      ctx.fillRect(x1, stopTop, boxW, stopH);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1;
      ctx.strokeRect(x1, stopTop, boxW, stopH);

      // 3. Draw Entry Divider Line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, clampedYEntry);
      ctx.lineTo(x2, clampedYEntry);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Subtle TP1 intermediate target line if within target box
      if (yTp1 !== null && yTp1 >= targetTop && yTp1 <= targetBottom && Math.abs(yTp1 - clampedYEntry) > 10) {
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x1, yTp1);
        ctx.lineTo(x2, yTp1);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillStyle = '#34d399';
        ctx.textAlign = 'left';
        ctx.fillText('TP1 (1:1.5) $' + tp1.toFixed(2), x1 + 6, yTp1 - 3);
      }

      // 5. Draw 6 TradingView Corner Handle Anchors [ ]
      function drawHandle(hx, hy) {
        const s = 6;
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(hx - s / 2, hy - s / 2, s, s);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(hx - s / 2, hy - s / 2, s, s);
      }

      drawHandle(x1, isLong ? targetTop : stopTop);
      drawHandle(x2, isLong ? targetTop : stopTop);
      drawHandle(x1, clampedYEntry);
      drawHandle(x2, clampedYEntry);
      drawHandle(x1, isLong ? stopBottom : targetBottom);
      drawHandle(x2, isLong ? stopBottom : targetBottom);

      // 6. Metrics Calculations
      const centerX = (x1 + x2) / 2;
      const curPrice = (typeof lastKnownBid === 'number' && lastKnownBid > 0) ? lastKnownBid : entryPrice;
      const diff = isLong ? (curPrice - entryPrice) : (entryPrice - curPrice);
      const isProf = diff >= 0;
      const sign = isProf ? '+' : '';
      const uInfo = getAssetUnitInfo();
      const pips = (diff * uInfo.mult).toFixed(1);
      const diffDollars = Math.abs(diff).toFixed(2);
      const riskDist = Math.abs(entryPrice - stopLoss);
      const rewardDist = Math.abs(tp - entryPrice);
      const rrRatio = (rewardDist / Math.max(0.01, riskDist)).toFixed(2);
      const qty = (setup.v3Config && setup.v3Config.positionSize ? setup.v3Config.positionSize : 1.0).toFixed(3);

      // 7. Center Floating Info Badge (TradingView Style)
      const badgeW = Math.min(220, boxW - 16);
      const badgeH = 44;
      const badgeX = centerX - badgeW / 2;
      let badgeY = isLong ? (clampedYEntry - badgeH - 12) : (clampedYEntry + 12);
      badgeY = Math.max(8, Math.min(rect.height - badgeH - 8, badgeY));

      ctx.fillStyle = 'rgba(8, 28, 32, 0.94)';
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 1.5;
      drawRoundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillStyle = isProf ? '#34d399' : '#f87171';
      ctx.textAlign = 'center';
      const pnlLine = (lc && lc.isActivated)
        ? ('Open P&L: ' + sign + diffDollars + ' (' + sign + pips + uInfo.unit[0] + '), Qty: ' + qty)
        : ('Pending: $' + entryPrice.toFixed(2) + ' (' + (isProf ? '+' : '') + pips + uInfo.unit[0] + '), Qty: ' + qty);
      ctx.fillText(pnlLine, centerX, badgeY + 17);

      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText('Risk/Reward Ratio: ' + rrRatio, centerX, badgeY + 33);

      // 8. Stop Loss Badge at Stop Level
      const slDist = Math.abs(entryPrice - stopLoss);
      const slPct = ((slDist / entryPrice) * 100).toFixed(2);
      const slPips = (slDist * uInfo.mult).toFixed(0);
      const slText = 'Stop: $' + stopLoss.toFixed(2) + ' (' + slPct + '%) -' + slPips + ' ' + uInfo.unit;

      ctx.font = 'bold 10px JetBrains Mono, monospace';
      const slMetrics = ctx.measureText(slText);
      const slPillW = slMetrics.width + 16;
      const slPillH = 20;
      const slPillX = centerX - slPillW / 2;
      const slPillY = isLong ? Math.min(rect.height - 24, clampedYStop + 4) : Math.max(4, clampedYStop - 24);

      ctx.fillStyle = '#ef4444';
      drawRoundRect(slPillX, slPillY, slPillW, slPillH, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(slText, centerX, slPillY + 14);

      // 9. Target Badge at Target Level
      const tpDist = Math.abs(tp - entryPrice);
      const tpPct = ((tpDist / entryPrice) * 100).toFixed(2);
      const tpPips = (tpDist * uInfo.mult).toFixed(0);
      const tpText = 'Target: $' + tp.toFixed(2) + ' (' + tpPct + '%) +' + tpPips + ' ' + uInfo.unit;

      const tpMetrics = ctx.measureText(tpText);
      const tpPillW = tpMetrics.width + 16;
      const tpPillH = 20;
      const tpPillX = centerX - tpPillW / 2;
      const tpPillY = isLong ? Math.max(4, clampedYTarget - 24) : Math.min(rect.height - 24, clampedYTarget + 4);

      ctx.fillStyle = '#10b981';
      drawRoundRect(tpPillX, tpPillY, tpPillW, tpPillH, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(tpText, centerX, tpPillY + 14);

      ctx.restore();
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
        cbPill.innerHTML = \`<span class="hidden sm:inline">🛑 CIRCUIT BREAKER TRIPPED (\${lossesToday}/2 Losses)</span><span class="sm:hidden">🛑 TRIPPED</span>\`;
        cbPill.className = 'px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold mono bg-rose-500 text-white';
      } else {
        cbPill.innerHTML = \`<span class="hidden sm:inline">🛡️ Breaker: \${lossesToday}/2 Losses</span><span class="sm:hidden">🛡️ \${lossesToday}/2</span>\`;
        cbPill.className = 'px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
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
              ? 'border border-amber-400 bg-amber-400/10 shadow-sm shadow-amber-400/20'
              : 'border border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80';
            const dirBg = lc.direction === 'BUY'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            const pnlHtml = lc.isActivated
              ? (lc.floatingPips >= 0
                  ? '<span class="text-emerald-400 font-black">+' + lc.floatingPips.toFixed(1) + uInfo.unit[0] + ' (+$' + lc.floatingDollarsPerOz.toFixed(2) + ')</span>'
                  : '<span class="text-rose-400 font-black">' + lc.floatingPips.toFixed(1) + uInfo.unit[0] + ' (-$' + Math.abs(lc.floatingDollarsPerOz).toFixed(2) + ')</span>')
              : '<span class="text-amber-300 font-bold">⏳ Wait FVG</span>';

            return \`
              <div onclick="switchTimeframe('\${tf}')" class="rounded-xl p-2 sm:p-2.5 transition-all cursor-pointer flex flex-col justify-between min-w-[125px] sm:min-w-0 snap-start shrink-0 sm:shrink \${cardBorder}">
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

      try { updateMobileBottomBar(data, lc); } catch {}

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
      try { updateEntryProximityMeter(data, lc, et); } catch (e) { console.error('proximity err:', e); }
      try { updateLiveCandleIdentifier(data); } catch (e) { console.error('candle identifier err:', e); }

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

          updateChartSmartMoneyMarkers(data);
          drawSetupPriceLines(ts, data.liquidityLevels);
          if (typeof scheduleRRBoxOverlay === 'function') scheduleRRBoxOverlay();
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

    function updateEntryProximityMeter(data, lc, et) {
      const box = document.getElementById('entryProximityBox');
      const badge = document.getElementById('entryProximityBadge');
      const dot = document.getElementById('entryProximityDot');
      const title = document.getElementById('entryProximityTitle');
      const sub = document.getElementById('entryProximitySubtitle');
      const diffEl = document.getElementById('entryProximityDiff');
      const pctEl = document.getElementById('entryProximityPct');
      if (!box || !badge || !dot || !title || !diffEl) return;

      const currentPrice = data.currentPrice;
      const pullbackEntry = (data.tradeSetup && data.tradeSetup.optimalPullbackEntry) || (lc && lc.entryPrice) || (et && et.recommendedEntry) || currentPrice;
      const unitInfo = getAssetUnitInfo();
      const pointsDiff = Math.abs(currentPrice - pullbackEntry);
      const pipsDiff = pointsDiff * (unitInfo.mult || 10);
      const pctDiff = (pointsDiff / (currentPrice || 1)) * 100;

      if (lc && lc.isActivated) {
        box.className = 'p-3 rounded-xl bg-emerald-950/20 border-2 border-emerald-500/50 space-y-2 transition-all shadow-md';
        badge.className = 'mono text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500 text-slate-950 flex items-center gap-1';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>ACTIVE IN FLIGHT';
        dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
        title.textContent = lc.hitTp1 ? '🏆 Target 1 Hit — SL at Breakeven' : '⚡ Live Position Running';
        title.className = 'text-xs sm:text-sm font-black text-emerald-300';
        sub.textContent = lc.pnlStatusText || 'Targeting TP1 & TP2 runners';
        diffEl.textContent = lc.floatingPips ? (lc.floatingPips >= 0 ? '+' : '') + lc.floatingPips.toFixed(1) + ' ' + unitInfo.unit : '$' + lc.entryPrice.toFixed(2);
        diffEl.className = 'mono text-xs sm:text-sm font-extrabold ' + ((lc.floatingDollarsPerOz || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400');
        pctEl.textContent = 'Active Execution';
      } else if (pctDiff <= 0.08 || (currentSymbol === 'BTCUSD' ? pointsDiff <= 25 : pointsDiff <= 0.35)) {
        box.className = 'p-3 rounded-xl bg-emerald-950/40 border-2 border-emerald-400 space-y-2 transition-all shadow-lg shadow-emerald-500/10';
        badge.className = 'mono text-[10px] font-black px-2.5 py-0.5 rounded bg-emerald-400 text-slate-950 flex items-center gap-1 animate-pulse';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-950"></span>READY TO ENTER NOW';
        dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-ping';
        title.textContent = '🔥 Price is in Optimal FVG Entry Zone!';
        title.className = 'text-xs sm:text-sm font-black text-emerald-300';
        sub.textContent = 'Spot price is at Consequent Encroachment (CE 50%). Execute Market or Limit order immediately!';
        diffEl.textContent = pointsDiff.toFixed(2) + ' pt (' + pipsDiff.toFixed(0) + ' ' + unitInfo.unit + ')';
        diffEl.className = 'mono text-xs sm:text-sm font-extrabold text-emerald-400';
        pctEl.textContent = pctDiff.toFixed(2) + '% from limit';
      } else if (pctDiff <= 0.35 || (currentSymbol === 'BTCUSD' ? pointsDiff <= 100 : pointsDiff <= 1.8)) {
        box.className = 'p-3 rounded-xl bg-amber-950/30 border-2 border-amber-400/80 space-y-2 transition-all shadow-md';
        badge.className = 'mono text-[10px] font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950';
        badge.textContent = '⏳ PLACE LIMIT ORDER';
        dot.className = 'w-2 h-2 rounded-full bg-amber-400';
        title.textContent = 'Approaching CE 50% Pullback Level';
        title.className = 'text-xs sm:text-sm font-black text-amber-300';
        sub.textContent = 'Setup confirmed! Place pending Limit Order at $' + pullbackEntry.toFixed(2) + ' and wait for fill.';
        diffEl.textContent = pointsDiff.toFixed(2) + ' pt (' + pipsDiff.toFixed(0) + ' ' + unitInfo.unit + ')';
        diffEl.className = 'mono text-xs sm:text-sm font-extrabold text-amber-300';
        pctEl.textContent = pctDiff.toFixed(2) + '% to limit';
      } else if (et && et.isLate) {
        box.className = 'p-3 rounded-xl bg-slate-900/90 border border-slate-700 space-y-2 transition-all';
        badge.className = 'mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400';
        badge.textContent = '⚠️ EXTENDED — WAIT RETEST';
        dot.className = 'w-2 h-2 rounded-full bg-slate-500';
        title.textContent = 'Price Extended Beyond Origin';
        title.className = 'text-xs sm:text-sm font-black text-slate-200';
        sub.textContent = 'Do not chase market price! Wait for retest pullback to CE 50% ($' + pullbackEntry.toFixed(2) + ').';
        diffEl.textContent = '+' + pointsDiff.toFixed(2) + ' pt extended';
        diffEl.className = 'mono text-xs sm:text-sm font-extrabold text-slate-400';
        pctEl.textContent = pctDiff.toFixed(2) + '% beyond';
      } else {
        box.className = 'p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 transition-all';
        badge.className = 'mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400';
        badge.textContent = '📋 PENDING PULLBACK';
        dot.className = 'w-2 h-2 rounded-full bg-slate-600';
        title.textContent = 'Awaiting Retest to FVG Midpoint';
        title.className = 'text-xs sm:text-sm font-black text-slate-300';
        sub.textContent = 'Pending CE 50% Limit level positioned at $' + pullbackEntry.toFixed(2);
        diffEl.textContent = pointsDiff.toFixed(2) + ' pt';
        diffEl.className = 'mono text-xs sm:text-sm font-extrabold text-slate-300';
        pctEl.textContent = pctDiff.toFixed(2) + '% away';
      }
    }

    function updateLiveCandleIdentifier(data) {
      if (!data) return;
      const cp = data.currentCandlePattern;
      if (!cp) return;

      const iconEl = document.getElementById('candlePatternIcon');
      const nameEl = document.getElementById('candlePatternName');
      const badgeEl = document.getElementById('candlePatternBadge');
      const ratioEl = document.getElementById('candleRangeRatio');
      const lowerPctEl = document.getElementById('candleLowerWickPct');
      const bodyPctEl = document.getElementById('candleBodyPct');
      const upperPctEl = document.getElementById('candleUpperWickPct');
      const lowerBar = document.getElementById('candleLowerWickBar');
      const bodyBar = document.getElementById('candleBodyBar');
      const upperBar = document.getElementById('candleUpperWickBar');
      const ictMeaningEl = document.getElementById('candleIctMeaning');

      const isBullish = Boolean(cp.isBullish || cp.direction === 'BULLISH');
      const isBearish = Boolean(cp.isBearish || cp.direction === 'BEARISH');

      if (iconEl) iconEl.textContent = cp.icon || '🕯️';
      if (nameEl) {
        const sentiment = isBullish ? ' (Bullish Flow)' : isBearish ? ' (Bearish Flow)' : ' (Consolidation)';
        nameEl.textContent = (cp.name || 'Live Candle') + sentiment;
      }

      if (badgeEl) {
        badgeEl.textContent = cp.badge || (cp.pattern || cp.classification || 'NEUTRAL').toUpperCase().replace('_', ' ');
        if (cp.isDisplacement || cp.pattern === 'MARUBOZU_BULL' || cp.pattern === 'MARUBOZU_BEAR' || cp.pattern === 'ENGULFING_BULL' || cp.pattern === 'ENGULFING_BEAR') {
          badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-black mono ' + (isBullish ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' : 'bg-rose-500/30 text-rose-300 border border-rose-500/50');
        } else if (cp.isSweepWick || cp.pattern === 'PINBAR_BULL_HAMMER' || cp.pattern === 'PINBAR_BEAR_SHOOTING') {
          badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-black mono bg-amber-400 text-slate-950 shadow-sm font-extrabold';
        } else {
          badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-black mono bg-slate-800 text-slate-300 border border-slate-700';
        }
      }

      const ratioVal = cp.atrRatio != null ? cp.atrRatio : (cp.rangeVsAtr != null ? cp.rangeVsAtr : 1.0);
      if (ratioEl) {
        ratioEl.textContent = ratioVal.toFixed(1) + 'x ATR';
        if (ratioVal >= 1.5) {
          ratioEl.className = 'mono text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/50 animate-pulse';
        } else {
          ratioEl.className = 'mono text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800';
        }
      }

      const bodyPct = (cp.bodyPct != null ? cp.bodyPct : 50).toFixed(1);
      const upperPct = (cp.upperWickPct != null ? cp.upperWickPct : 25).toFixed(1);
      const lowerPct = (cp.lowerWickPct != null ? cp.lowerWickPct : 25).toFixed(1);

      if (lowerPctEl) lowerPctEl.textContent = 'Lower Wick: ' + lowerPct + '%';
      if (bodyPctEl) bodyPctEl.textContent = 'Body: ' + bodyPct + '%';
      if (upperPctEl) upperPctEl.textContent = 'Upper Wick: ' + upperPct + '%';

      if (lowerBar) lowerBar.style.width = lowerPct + '%';
      if (bodyBar) {
        bodyBar.style.width = bodyPct + '%';
        bodyBar.className = 'h-full transition-all duration-300 ' + (isBullish ? 'bg-emerald-400' : isBearish ? 'bg-rose-500' : 'bg-amber-400');
      }
      if (upperBar) upperBar.style.width = upperPct + '%';

      if (ictMeaningEl) {
        ictMeaningEl.textContent = cp.ictSignificance || 'Monitoring candle flow for institutional displacement...';
      }

      const flowBox = document.getElementById('recentCandlesFlowContainer');
      if (flowBox && Array.isArray(data.recentCandlePatterns) && data.recentCandlePatterns.length > 0) {
        const chips = [];
        const recents = data.recentCandlePatterns.slice(-7);
        for (let i = 0; i < recents.length; i++) {
          const c = recents[i];
          const isLast = i === recents.length - 1;
          const cBull = Boolean(c.isBullish || c.direction === 'BULLISH');
          const cBear = Boolean(c.isBearish || c.direction === 'BEARISH');
          const bgCol = cBull
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            : cBear
            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            : 'bg-slate-800/60 border-slate-700 text-slate-400';
          chips.push(
            '<div class="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] mono shrink-0 ' + bgCol + (isLast ? ' ring-1 ring-amber-400' : '') + '">' +
            '<span>' + (c.icon || '🕯️') + '</span>' +
            '<span class="font-bold">' + (c.name.split(' ')[0] || 'Bar') + '</span>' +
            '<span class="text-[8px] opacity-75">(' + c.bodyPct.toFixed(0) + '%)</span>' +
            (isLast ? '<span class="text-[8px] bg-amber-400 text-slate-950 font-black px-1 rounded ml-0.5">NOW</span>' : '') +
            '</div>'
          );
        }
        flowBox.innerHTML = chips.join('');
      }
    }

    function executeMarketCopy() {
      if (!currentAnalysis || !currentAnalysis.tradeSetup) {
        showToast('⚠️ No active setup to execute');
        return;
      }
      const ts = currentAnalysis.tradeSetup;
      const uInfo = getAssetUnitInfo();
      const dir = ts.direction === 'LONG' ? 'BUY' : 'SELL';
      const price = currentAnalysis.currentPrice;
      const lots = document.getElementById('calcLots')?.textContent || '0.01 Lots';
      const sl = ts.stopLoss.toFixed(2);
      const tp1 = ts.tp1.toFixed(2);
      const tp2 = ts.tp2.toFixed(2);
      const text = uInfo.label + ' ' + dir + ' MARKET @ $' + price.toFixed(2) + ' | SL: $' + sl + ' | TP1: $' + tp1 + ' | TP2: $' + tp2 + ' | Vol: ' + lots;
      navigator.clipboard.writeText(text);
      try { playChime('chime'); } catch {}
      showToast('⚡ Copied Market Order: ' + dir + ' @ $' + price.toFixed(2));
    }

    function executeLimitCopy() {
      if (!currentAnalysis || !currentAnalysis.tradeSetup) {
        showToast('⚠️ No active setup to execute');
        return;
      }
      const ts = currentAnalysis.tradeSetup;
      const uInfo = getAssetUnitInfo();
      const dir = ts.direction === 'LONG' ? 'BUY LIMIT' : 'SELL LIMIT';
      const limitPrice = (ts.optimalPullbackEntry || ts.entry).toFixed(2);
      const lots = document.getElementById('calcLots')?.textContent || '0.01 Lots';
      const sl = ts.stopLoss.toFixed(2);
      const tp1 = ts.tp1.toFixed(2);
      const tp2 = ts.tp2.toFixed(2);
      const text = uInfo.label + ' ' + dir + ' (CE 50% FVG) @ $' + limitPrice + ' | SL: $' + sl + ' | TP1: $' + tp1 + ' | TP2: $' + tp2 + ' | Vol: ' + lots;
      navigator.clipboard.writeText(text);
      try { playChime('chime'); } catch {}
      showToast('🎯 Copied CE Limit Order: ' + dir + ' @ $' + limitPrice);
    }

    function getNextTimeframe() {
      const tfs = ['1m', '5m', '15m', '30m', '1h', '4h'];
      const idx = tfs.indexOf(currentTimeframe);
      return tfs[(idx + 1) % tfs.length];
    }

    function updateMobileBottomBar(data, lc) {
      const tfEl = document.getElementById('mobTfBadge');
      const typeEl = document.getElementById('mobSignalType');
      const priceEl = document.getElementById('mobPrice');
      const gradeEl = document.getElementById('mobGradeScore');
      const pnlEl = document.getElementById('mobPnl');

      if (tfEl) tfEl.textContent = (currentTimeframe || '15m').toUpperCase();
      if (priceEl && data && data.price) priceEl.textContent = '$' + Number(data.price).toFixed(2);
      if (typeEl && data) {
        const isB = (data.tradeSetup?.direction || 'BUY') === 'LONG' || data.signal === 'BUY';
        typeEl.textContent = isB ? 'BUY' : 'SELL';
        typeEl.className = isB
          ? 'px-1.5 py-0.2 rounded text-[10px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          : 'px-1.5 py-0.2 rounded text-[10px] font-black mono bg-rose-500/20 text-rose-300 border border-rose-500/30';
      }
      if (gradeEl && data) {
        gradeEl.textContent = (data.setupGrade || 'A+') + ' ' + (data.probability || 95) + '%';
      }
      if (pnlEl && lc) {
        if (lc.isActivated) {
          const isProf = lc.floatingDollarsPerOz >= 0;
          pnlEl.textContent = (isProf ? '+' : '') + '$' + lc.floatingDollarsPerOz.toFixed(2);
          pnlEl.className = 'font-bold ' + (isProf ? 'text-emerald-400' : 'text-rose-400');
        } else {
          pnlEl.textContent = 'Wait FVG';
          pnlEl.className = 'font-bold text-amber-300';
        }
      }
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

    let entryListViewMode = 'flow';
    try {
      const saved = localStorage.getItem('indecator_entry_view');
      if (saved === 'flow' || saved === 'table') entryListViewMode = saved;
    } catch {}
    let entryListStatusFilter = 'ALL';

    function setEntryListViewMode(mode) {
      entryListViewMode = mode;
      try { localStorage.setItem('indecator_entry_view', mode); } catch {}
      const btnFlow = document.getElementById('btnSigViewFlow');
      const btnTable = document.getElementById('btnSigViewTable');
      const flowWrap = document.getElementById('allSignalsFlowContainer');
      const tblWrap = document.getElementById('allSignalsTableWrap');
      if (btnFlow) btnFlow.className = mode === 'flow'
        ? 'px-2.5 py-1 rounded-lg text-xs font-black bg-amber-400 text-slate-950 shadow-sm transition'
        : 'px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition';
      if (btnTable) btnTable.className = mode === 'table'
        ? 'px-2.5 py-1 rounded-lg text-xs font-black bg-amber-400 text-slate-950 shadow-sm transition'
        : 'px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition';
      if (flowWrap) flowWrap.classList.toggle('hidden', mode !== 'flow');
      if (tblWrap) tblWrap.classList.toggle('hidden', mode !== 'table');
    }

    function filterSignalOutcome(outcome) {
      entryListStatusFilter = outcome;
      ['ALL', 'ACTIVE', 'TP2', 'TP1', 'BE', 'SL'].forEach((st) => {
        const btn = document.getElementById('flt-st-' + st);
        if (!btn) return;
        btn.className = st === outcome
          ? 'px-2 py-0.5 rounded text-[11px] font-black bg-amber-400 text-slate-950'
          : 'px-2 py-0.5 rounded text-[11px] font-bold text-slate-400 hover:bg-slate-800';
      });
      if (latestMtfData) renderAllHighProbSignalsTable(latestMtfData.allHighProbSignals || []);
    }

    function renderAllHighProbSignalsTable(allSignals) {
      if (!Array.isArray(allSignals)) return;

      let list = signalListFilter === '90PLUS'
        ? allSignals.filter((s) => s.probability >= 82 || s.grade === 'A+' || s.grade === 'A')
        : signalListFilter === 'ALL'
        ? allSignals
        : allSignals.filter((s) => s.timeframe === signalListFilter);

      if (entryListStatusFilter !== 'ALL') {
        if (entryListStatusFilter === 'ACTIVE') list = list.filter((s) => s.outcome === 'ACTIVE');
        else if (entryListStatusFilter === 'TP2') list = list.filter((s) => s.outcome === 'TP2_HIT');
        else if (entryListStatusFilter === 'TP1') list = list.filter((s) => s.outcome === 'TP1_HIT');
        else if (entryListStatusFilter === 'BE') list = list.filter((s) => s.outcome === 'BE_EXIT');
        else if (entryListStatusFilter === 'SL') list = list.filter((s) => s.outcome === 'SL_HIT');
      }

      const countEl = document.getElementById('entryFlowCountBadge');
      if (countEl) countEl.textContent = list.length + ' SETUPS';

      const closed = list.filter((s) => s.outcome !== 'ACTIVE');
      const wins = closed.filter((s) => s.outcome === 'TP1_HIT' || s.outcome === 'TP2_HIT').length;
      const wr = closed.length > 0 ? ((wins / closed.length) * 100).toFixed(0) : '0';
      const wrEl = document.getElementById('flowWinRate');
      if (wrEl) wrEl.textContent = wr + '% (' + wins + '/' + closed.length + ')';

      const uInfo = getAssetUnitInfo();
      const flowContainer = document.getElementById('allSignalsFlowContainer');
      const tbody = document.getElementById('allSignalsTableBody');

      // 1. Render Step Flow View
      if (flowContainer) {
        if (list.length === 0) {
          flowContainer.innerHTML = '<div class="p-8 text-center text-slate-500 rounded-2xl border border-slate-800/80 bg-slate-900/40 mono text-xs">No trade entry flows matching current filter criteria</div>';
        } else {
          flowContainer.innerHTML = list.map((s) => {
            const dt = new Date(s.time * 1000).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            const isB = s.type === 'BUY';
            const curBid = lastKnownBid || s.entry;
            const diff = isB ? curBid - s.entry : s.entry - curBid;
            const livePips = (diff * uInfo.mult).toFixed(1);
            const isProf = diff >= 0;
            const sign = isProf ? '+' : '';

            const slDistance = Math.abs(s.entry - s.stopLoss);
            const slPips = (slDistance * uInfo.mult).toFixed(0);
            const tp1Distance = Math.abs(s.tp1 - s.entry);
            const tp1Pips = (tp1Distance * uInfo.mult).toFixed(0);
            const tp2Distance = Math.abs(s.tp2 - s.entry);
            const tp2Pips = (tp2Distance * uInfo.mult).toFixed(0);

            let pct = 0;
            if (s.outcome === 'TP2_HIT') pct = 100;
            else if (s.outcome === 'TP1_HIT') pct = 60;
            else if (s.outcome === 'BE_EXIT') pct = 50;
            else if (s.outcome === 'SL_HIT') pct = 0;
            else if (s.outcome === 'ACTIVE') {
              if (tp1Distance > 0) {
                pct = Math.max(0, Math.min(100, Math.round((diff / tp1Distance) * 60)));
              }
            }

            let outBadge = '';
            let cardBorder = 'border-slate-800';
            if (s.outcome === 'ACTIVE') {
              cardBorder = 'border-sky-500/40 shadow-sky-500/5';
              outBadge = '<span class="px-2.5 py-1 rounded-md text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-400/50 animate-pulse flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>⚡ LIVE IN FLIGHT</span>';
            } else if (s.outcome === 'TP2_HIT') {
              cardBorder = 'border-emerald-500/40 shadow-emerald-500/5';
              outBadge = '<span class="px-2.5 py-1 rounded-md text-xs font-black bg-emerald-500/25 text-emerald-300 border border-emerald-500/50">🏆 TP2 RUNNER HIT (+2.5R)</span>';
            } else if (s.outcome === 'TP1_HIT') {
              cardBorder = 'border-emerald-500/30';
              outBadge = '<span class="px-2.5 py-1 rounded-md text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">✅ TP1 HIT (+1.5R • BE LOCKED)</span>';
            } else if (s.outcome === 'BE_EXIT') {
              cardBorder = 'border-amber-500/30';
              outBadge = '<span class="px-2.5 py-1 rounded-md text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">🛡️ BREAKEVEN EXIT (+$0.00)</span>';
            } else {
              cardBorder = 'border-rose-500/30';
              outBadge = '<span class="px-2.5 py-1 rounded-md text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">❌ STOP LOSS HIT (-1.0R)</span>';
            }

            let pnlBadge = '';
            if (s.outcome === 'ACTIVE') {
              pnlBadge = '<span id="sig-flow-pnl-' + s.timeframe + '-' + s.time + '" class="px-2.5 py-1 rounded-md text-xs font-black mono border ' +
                (isProf ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50' : 'bg-rose-500/20 text-rose-300 border-rose-400/50') + '">' +
                sign + '$' + Math.abs(diff).toFixed(2) + ' (' + sign + livePips + ' ' + uInfo.unit + ')</span>';
            } else {
              const p = Number(s.pnlDollarsPerOz || 0);
              const isP = p >= 0;
              pnlBadge = '<span class="px-2.5 py-1 rounded-md text-xs font-black mono ' +
                (isP ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20') + '">' +
                (isP ? '+' : '') + '$' + p.toFixed(2) + '</span>';
            }

            const stage1Passed = true;
            const stage3Passed = s.outcome === 'TP1_HIT' || s.outcome === 'TP2_HIT' || s.outcome === 'BE_EXIT';
            const stage4Passed = s.outcome === 'TP2_HIT';

            return '<div data-tf="' + s.timeframe + '" onclick="onEntryFlowCardClick(this)" class="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border ' + cardBorder + ' hover:border-amber-400/50 transition cursor-pointer shadow-md space-y-3">' +
              '<div class="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">' +
                '<div class="flex items-center gap-2 flex-wrap">' +
                  '<span class="px-2.5 py-1 rounded-md text-xs font-black mono bg-slate-800 text-amber-300 uppercase">' + s.timeframe + '</span>' +
                  '<span class="px-2.5 py-1 rounded-md text-xs font-black mono border ' + (isB ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40') + '">' +
                    (isB ? '🟢 BUY' : '🔴 SELL') +
                  '</span>' +
                  '<span class="px-2 py-0.5 rounded text-[10px] font-black mono bg-amber-400 text-slate-950">' + s.grade + ' ' + s.probability + '%</span>' +
                  '<span class="text-xs text-slate-400 font-mono">' + dt + '</span>' +
                  '<span class="text-xs text-slate-400 hidden md:inline">• ' + (s.reason || 'Confluence Confirmed') + '</span>' +
                '</div>' +
                '<div class="flex items-center gap-2">' +
                  outBadge +
                  pnlBadge +
                  '<button data-tf="' + s.timeframe + '" data-entry="' + s.entry + '" data-sl="' + s.stopLoss + '" data-tp1="' + s.tp1 + '" data-tp2="' + s.tp2 + '" data-dir="' + s.type + '" onclick="onEntryCopyBtnClick(this, event)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-bold text-xs transition">📋 Copy</button>' +
                  '<button data-tf="' + s.timeframe + '" onclick="onEntryTelegramBtnClick(this, event)" class="px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 hover:border-sky-400 font-bold text-xs transition flex items-center gap-1" title="Push this setup to Telegram Channel">📢 Telegram</button>' +
                '</div>' +
              '</div>' +

              '<div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">' +
                '<div class="p-2.5 rounded-xl bg-slate-950/80 border ' + (stage1Passed ? 'border-emerald-500/30' : 'border-slate-800') + ' space-y-1">' +
                  '<div class="flex items-center justify-between text-[10px] uppercase font-extrabold">' +
                    '<span class="text-slate-400">1. SWEEP & MSS</span>' +
                    '<span class="text-emerald-400 font-bold">✓ PASS</span>' +
                  '</div>' +
                  '<p class="text-xs text-white font-semibold truncate">' + (s.reason || 'Session Liquidity Swept') + '</p>' +
                  '<p class="text-[10px] text-slate-400">Displacement Body Close Confirmed</p>' +
                '</div>' +

                '<div class="p-2.5 rounded-xl bg-slate-950/80 border border-amber-400/30 space-y-1">' +
                  '<div class="flex items-center justify-between text-[10px] uppercase font-extrabold">' +
                    '<span class="text-amber-300">2. CE 50% ENTRY</span>' +
                    '<span class="text-white font-black mono">$' + s.entry.toFixed(2) + '</span>' +
                  '</div>' +
                  '<p class="text-xs text-white font-semibold">Limit FVG Retest Order</p>' +
                  '<div class="flex items-center justify-between text-[10px] text-slate-400">' +
                    '<span>SL: $' + s.stopLoss.toFixed(2) + '</span>' +
                    '<span class="text-rose-400 font-bold">-' + slPips + ' ' + uInfo.unit + ' (0.25% Risk)</span>' +
                  '</div>' +
                '</div>' +

                '<div class="p-2.5 rounded-xl bg-slate-950/80 border ' + (stage3Passed ? 'border-emerald-500/40' : (s.outcome === 'SL_HIT' ? 'border-rose-500/20' : 'border-slate-800')) + ' space-y-1">' +
                  '<div class="flex items-center justify-between text-[10px] uppercase font-extrabold">' +
                    '<span class="text-emerald-400">3. TP1 (+1.5R) & BE</span>' +
                    '<span class="text-white font-black mono">$' + s.tp1.toFixed(2) + '</span>' +
                  '</div>' +
                  '<p class="text-xs ' + (stage3Passed ? 'text-emerald-300 font-bold' : 'text-slate-300') + '">' +
                    (stage3Passed ? '✓ 50% Trim & SL Moved to BE' : (s.outcome === 'ACTIVE' ? 'Target in flight' : 'Target +1.5R')) +
                  '</p>' +
                  '<div class="flex items-center justify-between text-[10px] text-slate-400">' +
                    '<span>Reward: +' + tp1Pips + ' ' + uInfo.unit + '</span>' +
                    '<span class="text-emerald-400 font-bold">Risk-Free Lock</span>' +
                  '</div>' +
                '</div>' +

                '<div class="p-2.5 rounded-xl bg-slate-950/80 border ' + (stage4Passed ? 'border-emerald-400/50' : (s.outcome === 'SL_HIT' ? 'border-rose-500/20' : 'border-slate-800')) + ' space-y-1">' +
                  '<div class="flex items-center justify-between text-[10px] uppercase font-extrabold">' +
                    '<span class="text-emerald-300">4. TP2 (+2.5R RUNNER)</span>' +
                    '<span class="text-white font-black mono">$' + s.tp2.toFixed(2) + '</span>' +
                  '</div>' +
                  '<p class="text-xs ' + (stage4Passed ? 'text-emerald-300 font-black' : (s.outcome === 'BE_EXIT' ? 'text-amber-300' : 'text-slate-300')) + '">' +
                    (stage4Passed ? '🏆 Full Target Hit (+2.5R)' : (s.outcome === 'BE_EXIT' ? 'Protected @ Breakeven' : 'Opposing Liquidity')) +
                  '</p>' +
                  '<div class="flex items-center justify-between text-[10px] text-slate-400">' +
                    '<span>Reward: +' + tp2Pips + ' ' + uInfo.unit + '</span>' +
                    '<span class="text-emerald-300 font-bold">+2.0R Net Gross</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              '<div class="pt-1.5 border-t border-slate-800/60 space-y-1">' +
                '<div class="flex items-center justify-between text-[10px] font-mono text-slate-400">' +
                  '<span>Progress: <strong id="sig-flow-progtext-' + s.timeframe + '-' + s.time + '" class="text-amber-300 font-bold">' + pct + '%</strong></span>' +
                  '<span>Entry $' + s.entry.toFixed(2) + ' ➔ TP1 $' + s.tp1.toFixed(2) + ' ➔ TP2 $' + s.tp2.toFixed(2) + '</span>' +
                '</div>' +
                '<div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">' +
                  '<div id="sig-flow-bar-' + s.timeframe + '-' + s.time + '" class="h-full rounded-full transition-all duration-300 ' +
                    (s.outcome === 'TP2_HIT' ? 'bg-emerald-400' : (s.outcome === 'TP1_HIT' ? 'bg-emerald-500' : (s.outcome === 'BE_EXIT' ? 'bg-amber-400' : (s.outcome === 'SL_HIT' ? 'bg-rose-500' : (isProf ? 'bg-emerald-400' : 'bg-rose-500'))))) +
                    '" style="width: ' + pct + '%"></div>' +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('');
        }
      }

      // 2. Render Compact Table View
      if (tbody) {
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="12" class="py-4 text-center text-slate-500">No active signals found in current scan window</td></tr>';
        } else {
          tbody.innerHTML = list.map((s) => {
            const dt = new Date(s.time * 1000).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            const isB = s.type === 'BUY';
            const sigCls = isB
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
            const outBadge = s.outcome === 'TP2_HIT'
              ? '<span class="px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 font-bold">🏆 1:2.5 RUNNER HIT</span>'
              : s.outcome === 'TP1_HIT'
              ? '<span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">✅ 1:1.5 PARTIAL + BE</span>'
              : s.outcome === 'BE_EXIT'
              ? '<span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold">🛡️ BE EXIT</span>'
              : s.outcome === 'SL_HIT'
              ? '<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">❌ SL HIT (-1R)</span>'
              : '<span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">⚡ ACTIVE RUNNING</span>';
            const pnlColor = s.pnlDollarsPerOz >= 0 ? 'text-emerald-400' : 'text-rose-400';
            const pnlHtml = s.outcome === 'ACTIVE'
              ? '<span class="px-2 py-0.5 rounded font-black ' + (s.pnlDollarsPerOz >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-rose-500/20 text-rose-300 border border-rose-400/40') + '">' + (s.pnlDollarsPerOz >= 0 ? '+' : '') + '$' + s.pnlDollarsPerOz.toFixed(2) + ' (' + (s.pnlDollarsPerOz * 10).toFixed(0) + 'p)</span>'
              : '<span class="font-bold ' + pnlColor + '">' + (s.pnlDollarsPerOz >= 0 ? '+' : '') + '$' + s.pnlDollarsPerOz.toFixed(2) + '</span>';

            return '<tr data-tf="' + s.timeframe + '" onclick="onEntryFlowCardClick(this)" class="hover:bg-slate-900/70 cursor-pointer transition">' +
              '<td class="py-2.5 px-3 text-slate-300">' + dt + '</td>' +
              '<td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold uppercase">' + s.timeframe + '</span></td>' +
              '<td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded font-black ' + sigCls + '">' + s.type + '</span></td>' +
              '<td class="py-2.5 px-3"><span class="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">' + s.grade + '</span> <span class="text-white font-bold ml-1">' + s.probability + '%</span></td>' +
              '<td class="py-2.5 px-3 font-black text-amber-300 bg-amber-400/10 border-x border-amber-400/20">$' + s.entry.toFixed(2) + '</td>' +
              '<td class="py-2.5 px-3 text-rose-400 font-semibold">$' + s.stopLoss.toFixed(2) + '</td>' +
              '<td class="py-2.5 px-3 text-emerald-400 font-semibold">$' + s.tp1.toFixed(2) + '</td>' +
              '<td class="py-2.5 px-3 text-emerald-300 font-bold">$' + s.tp2.toFixed(2) + '</td>' +
              '<td class="py-2.5 px-3 text-slate-300 font-sans">' + (s.reason || '') + '</td>' +
              '<td class="py-2.5 px-3">' + outBadge + '</td>' +
              '<td id="sig-pnl-' + s.timeframe + '-' + s.time + '" class="py-2.5 px-3 text-right">' + pnlHtml + '</td>' +
              '<td class="py-2.5 px-3 text-center">' +
                '<div class="flex items-center justify-center gap-1">' +
                  '<button data-tf="' + s.timeframe + '" data-entry="' + s.entry + '" data-sl="' + s.stopLoss + '" data-tp1="' + s.tp1 + '" data-tp2="' + s.tp2 + '" data-dir="' + s.type + '" onclick="onEntryCopyBtnClick(this, event)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-bold text-[10px] transition">Copy</button>' +
                  '<button data-tf="' + s.timeframe + '" onclick="onEntryTelegramBtnClick(this, event)" class="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 hover:border-sky-400 font-bold text-[10px] transition" title="Push to Telegram">📢</button>' +
                '</div>' +
              '</td>' +
            '</tr>';
          }).join('');
        }
      }
    }

    function onEntryFlowCardClick(el) {
      const tf = el.getAttribute('data-tf');
      if (tf) switchTimeframe(tf);
    }

    function onEntryCopyBtnClick(btn, e) {
      if (e) e.stopPropagation();
      const tf = btn.getAttribute('data-tf') || '15m';
      const entry = Number(btn.getAttribute('data-entry') || 0);
      const sl = Number(btn.getAttribute('data-sl') || 0);
      const tp1 = Number(btn.getAttribute('data-tp1') || 0);
      const tp2 = Number(btn.getAttribute('data-tp2') || 0);
      const dir = btn.getAttribute('data-dir') || 'BUY';
      copySignalOrder(tf, entry, sl, tp1, tp2, dir);
    }

    function onEntryTelegramBtnClick(btn, e) {
      if (e) e.stopPropagation();
      const tf = btn.getAttribute('data-tf') || '15m';
      broadcastTfToTelegram(tf);
    }

    let telegramConfig = {
      isConfigured: false,
      chatId: '',
      autoBroadcast: true,
      minScore: 90
    };

    async function fetchTelegramStatus() {
      try {
        const res = await fetch('/api/telegram/status');
        if (!res.ok) return;
        const data = await res.json();
        telegramConfig = data;
        updateTelegramUI();
      } catch (e) {
        console.error('fetchTelegramStatus err:', e);
      }
    }

    function updateTelegramUI() {
      const dot = document.getElementById('telegramStatusDot');
      const pill = document.getElementById('tgStatusPill');
      const target = document.getElementById('tgTargetChannel');
      if (telegramConfig.isConfigured) {
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
        if (pill) {
          pill.className = 'px-2 py-0.5 rounded text-[10px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
          pill.textContent = 'ONLINE (Ready)';
        }
        if (target) {
          target.textContent = telegramConfig.chatId || 'Configured via .env';
          target.className = 'text-emerald-300 font-bold';
        }
      } else {
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-400';
        if (pill) {
          pill.className = 'px-2 py-0.5 rounded text-[10px] font-black mono bg-amber-500/20 text-amber-300 border border-amber-500/40';
          pill.textContent = 'NEEDS BOT TOKEN / CHAT ID';
        }
        if (target) {
          target.textContent = 'Not configured in .env';
          target.className = 'text-amber-300 font-bold';
        }
      }
    }

    function toggleTelegramModal(show) {
      const modal = document.getElementById('telegramModal');
      if (!modal) return;
      if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        fetchTelegramStatus();
      } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }

    function openTelegramModal() {
      toggleTelegramModal(true);
    }

    async function sendTelegramTestAlert() {
      const input = document.getElementById('tgCustomChatInput');
      const btn = document.getElementById('tgSendTestBtn');
      const resDiv = document.getElementById('tgTestResult');
      const customChatId = input ? input.value.trim() : '';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳ Sending...</span>';
      }
      if (resDiv) {
        resDiv.className = 'text-[11px] font-mono hidden p-2 rounded-lg';
        resDiv.textContent = '';
      }

      try {
        const res = await fetch('/api/telegram/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: customChatId || undefined })
        });
        const data = await res.json();
        if (resDiv) {
          resDiv.classList.remove('hidden');
          if (data.ok) {
            resDiv.className = 'text-[11px] font-mono p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
            resDiv.textContent = '✅ ' + (data.message || 'Test broadcast sent successfully!');
            fetchTelegramStatus();
          } else {
            resDiv.className = 'text-[11px] font-mono p-2.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40';
            resDiv.textContent = '❌ Failed: ' + (data.error || 'Check bot token & channel permissions');
          }
        }
      } catch (err) {
        if (resDiv) {
          resDiv.classList.remove('hidden');
          resDiv.className = 'text-[11px] font-mono p-2.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40';
          resDiv.textContent = '❌ Network Error: ' + err.message;
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>🚀 Send Test</span>';
        }
      }
    }

    async function broadcastTfToTelegram(tf) {
      if (!currentMtfData || !currentMtfData.timeframes) {
        showCopyToast('⚠️ No active data loaded yet');
        return;
      }
      const tfData = currentMtfData.timeframes[tf];
      if (!tfData) {
        showCopyToast('⚠️ Timeframe ' + tf + ' not found');
        return;
      }
      const signal = tfData.signal;
      if (!signal || signal.type === 'WAIT') {
        showCopyToast('⚠️ Timeframe ' + tf + ' currently has no active signal');
        return;
      }

      showCopyToast('📡 Broadcasting to Telegram...');
      try {
        const res = await fetch('/api/telegram/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signal: signal,
            symbol: currentSymbol || 'XAUUSD',
            timeframe: tf,
            bypassScoreFilter: true
          })
        });
        const data = await res.json();
        if (data.ok) {
          showCopyToast('📢 Broadcasted to Telegram!');
        } else {
          showCopyToast('❌ ' + (data.error || 'Failed to send to Telegram'));
          openTelegramModal();
        }
      } catch (e) {
        showCopyToast('❌ Error: ' + e.message);
      }
    }

    function broadcastCurrentToTelegram() {
      broadcastTfToTelegram(currentTimeframe);
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
      selectedRRSetup = null;
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
      document.getElementById('toggleLinesBtn').textContent = 'Lines: ' + (showPriceLines ? 'ON' : 'OFF');
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
      const icon = document.getElementById('soundIcon');
      const iconMob = document.getElementById('soundIconMob');
      const lbl = document.getElementById('soundLabel');
      if (soundEnabled) {
        if (btn) btn.className = 'px-2 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold mono bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30 transition flex items-center gap-1';
        if (icon) icon.textContent = '🔊';
        if (iconMob) iconMob.textContent = '🔊';
        if (lbl) lbl.textContent = 'Sound ON';
      } else {
        if (btn) btn.className = 'px-2 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold mono bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-300 transition flex items-center gap-1';
        if (icon) icon.textContent = '🔇';
        if (iconMob) iconMob.textContent = '🔇';
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

    async function fetchMt5Status() {
      try {
        const res = await fetch('/api/mt5/status');
        if (!res.ok) return;
        const st = await res.json();

        const dotDesktop = document.getElementById('mt5StatusDot');
        const dotMob = document.getElementById('mt5StatusDotMob');
        const headerLabel = document.getElementById('mt5HeaderLabel');
        const modalBadge = document.getElementById('mt5ModalStatusBadge');
        const diagBroker = document.getElementById('mt5DiagBroker');
        const diagAccount = document.getElementById('mt5DiagAccount');
        const diagLatency = document.getElementById('mt5DiagLatency');
        const diagUpdates = document.getElementById('mt5DiagUpdates');

        if (st.connected) {
          if (dotDesktop) dotDesktop.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
          if (dotMob) dotMob.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
          if (headerLabel) headerLabel.textContent = (st.broker ? st.broker.slice(0, 10) : 'MT5') + ' (' + (st.latencyMs != null ? st.latencyMs + 'ms' : 'LIVE') + ')';
          if (modalBadge) {
            modalBadge.textContent = 'CONNECTED • ' + (st.latencyMs != null ? st.latencyMs + 'ms' : 'REALTIME');
            modalBadge.className = 'px-2 py-0.5 rounded text-[10px] font-black mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
          }
          if (diagBroker) diagBroker.textContent = st.broker || 'MT5 Terminal';
          if (diagAccount) diagAccount.textContent = st.account ? '#' + st.account : 'Live Account';
          if (diagLatency) diagLatency.textContent = (st.latencyMs != null ? st.latencyMs : '<1') + ' ms';
          if (diagUpdates) diagUpdates.textContent = String(st.feedCount || 0);
        } else {
          if (dotDesktop) dotDesktop.className = 'w-2 h-2 rounded-full bg-slate-600';
          if (dotMob) dotMob.className = 'w-2 h-2 rounded-full bg-slate-600';
          if (headerLabel) headerLabel.textContent = 'MT5 Offline';
          if (modalBadge) {
            modalBadge.textContent = 'AWAITING FEED';
            modalBadge.className = 'px-2 py-0.5 rounded text-[10px] font-black mono bg-slate-800 text-slate-400 border border-slate-700';
          }
          if (diagBroker) diagBroker.textContent = '--';
          if (diagAccount) diagAccount.textContent = '--';
          if (diagLatency) diagLatency.textContent = '-- ms';
          if (diagUpdates) diagUpdates.textContent = String(st.feedCount || 0);
        }
      } catch (e) {
        console.error('fetchMt5Status err:', e);
      }
    }

    function toggleMt5Modal(show) {
      const modal = document.getElementById('mt5Modal');
      if (!modal) return;
      if (show === undefined) {
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
          modal.classList.add('flex');
          fetchMt5Status();
        } else {
          modal.classList.remove('flex');
        }
      } else if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        fetchMt5Status();
      } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }

    function openMt5Modal() {
      toggleMt5Modal(true);
    }

    async function testMt5Ping() {
      try {
        const price = (currentAnalysis && currentAnalysis.currentPrice) ? currentAnalysis.currentPrice : 2650.0;
        const testPayload = {
          symbol: currentSymbol || 'XAUUSD',
          broker: 'MetaQuotes-Demo',
          account: 8829103,
          bid: price,
          ask: price + 0.25,
          timestamp: Date.now()
        };
        const res = await fetch('/api/mt5/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });
        const out = await res.json();
        if (out.ok) {
          showToast('⚡ MT5 Ping Received! Feed status updated.');
          fetchMt5Status();
          loadSignalData();
        } else {
          showToast('⚠️ Ping rejected: ' + (out.error || 'Unknown'));
        }
      } catch (err) {
        showToast('❌ Failed to ping MT5 feed: ' + err.message);
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
      } else if (key === 'R') {
        e.preventDefault();
        fetchSignalRadar();
        showToast('🎯 Radar Rescanned');
      } else if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        toggleHotkeysModal();
      } else if (key === 'ESCAPE') {
        toggleHotkeysModal(false);
        toggleTelegramModal(false);
        toggleMt5Modal(false);
      }
    });

    function startApp() {
      try { updateAudioButton(); } catch (e) { console.error('updateAudioButton err:', e); }
      try { fetchTelegramStatus(); } catch (e) { console.error('fetchTelegramStatus err:', e); }
      try { fetchMt5Status(); } catch (e) { console.error('fetchMt5Status err:', e); }
      try { setMtfView(mtfViewMode); } catch (e) { console.error('setMtfView err:', e); }
      try { setEntryListViewMode(entryListViewMode); } catch (e) { console.error('setEntryListViewMode err:', e); }
      try { updateSymbolButtons(); } catch (e) { console.error('updateSymbolButtons err:', e); }
      try { initCharts(); } catch (e) { console.error('initCharts err:', e); }
      try { connectRealtimeTickStream(); } catch (e) { console.error('stream err:', e); }
      try { fetchD1History(); } catch (e) { console.error('fetchD1History err:', e); }
      try { fetchSignalRadar(); } catch (e) { console.error('fetchSignalRadar err:', e); }
      loadSignalData();
      setInterval(loadSignalData, 2000);
      setInterval(fetchSignalRadar, 5000);
      setInterval(fetchMt5Status, 3000);
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
