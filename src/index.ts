import { serve } from '@hono/node-server';
import fs from 'node:fs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';

// Load .env configuration on startup if present
if (fs.existsSync('.env')) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.warn('[Env] Failed to load .env:', err);
  }
}
import { analyzeGoldCandles, SignalDirection, getLockedClosedHistory } from './indicators.js';
import {
  ALL_SYMBOLS,
  ALL_TIMEFRAMES,
  getLatestSpotQuote,
  getMarketCandles,
  getSilverCandles,
  getMt5Status,
  ingestMt5Feed,
  initRealtimeMarketEngine,
  isMt5Connected,
  subscribeToTicks,
  SupportedSymbol,
  SupportedTimeframe,
  SYMBOL_CONFIGS,
} from './marketData.js';
import { MQL5_EA_SCRIPT, PYTHON_MT5_SCRIPT } from './mt5Scripts.js';
import { DASHBOARD_HTML } from './dashboardHtml.js';
import { getAllStoredD1Entries, getD1Status, initD1Database, queryD1TradeHistory } from './d1Database.js';
import {
  checkAndBroadcastMilestone,
  checkAndBroadcastSetup,
  formatTelegramSignalCard,
  getTelegramStatus,
  saveTelegramConfig,
  sendTelegramMessage,
  sendTelegramTestPing,
} from './telegram.js';

const app = new Hono();

app.use('*', cors());

void initRealtimeMarketEngine();
void initD1Database();

let localChartsJs = '';
try {
  if (fs.existsSync('public/lightweight-charts.js')) {
    localChartsJs = fs.readFileSync('public/lightweight-charts.js', 'utf8');
  }
} catch {}

app.get('/js/lightweight-charts.js', (c: any) => {
  if (localChartsJs) {
    return c.text(localChartsJs, 200, { 'Content-Type': 'application/javascript; charset=utf-8' });
  }
  return c.redirect('https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js');
});

function parseSymbol(raw: any): SupportedSymbol {
  const s = String(raw || 'XAUUSD').toUpperCase().replace(/[^A-Z]/g, '');
  if (s.includes('BTC')) return 'BTCUSD';
  if (s.includes('ETH')) return 'ETHUSD';
  if (s.includes('SOL')) return 'SOLUSD';
  return 'XAUUSD';
}

const handleRoot = (c: any) => c.html(DASHBOARD_HTML);

app.get('/', handleRoot);
app.get('/api', handleRoot);

app.get('/api/symbols', (c: any) =>
  c.json({
    symbols: ALL_SYMBOLS.map((s) => SYMBOL_CONFIGS[s]),
  })
);

const handleSignal = async (c: any) => {
  const rawTf = (c.req.query('tf') || c.req.query('timeframe') || '15m').toLowerCase();
  const tf: SupportedTimeframe = ALL_TIMEFRAMES.includes(rawTf as SupportedTimeframe)
    ? (rawTf as SupportedTimeframe)
    : '15m';
  const symbol = parseSymbol(c.req.query('symbol'));

  const { candles, source, spotQuote } = await getMarketCandles(symbol, tf);
  const silverCandles = symbol === 'XAUUSD' ? await getSilverCandles(tf) : undefined;
  const analysis = analyzeGoldCandles(candles, tf, source, symbol, silverCandles);

  return c.json({
    ...analysis,
    spotQuote,
    symbolConfig: SYMBOL_CONFIGS[symbol],
  });
};

app.get('/api/signal', handleSignal);
app.get('/signal', handleSignal);

app.get('/api/scalp', async (c: any) => {
  const rawTf = (c.req.query('tf') || c.req.query('timeframe') || '1m').toLowerCase();
  const tf: SupportedTimeframe = ALL_TIMEFRAMES.includes(rawTf as SupportedTimeframe)
    ? (rawTf as SupportedTimeframe)
    : '1m';
  const symbol = parseSymbol(c.req.query('symbol'));
  const { candles, source, spotQuote } = await getMarketCandles(symbol, tf);
  const silverCandles = symbol === 'XAUUSD' ? await getSilverCandles(tf) : undefined;
  const analysis = analyzeGoldCandles(candles, tf, source, symbol, silverCandles);
  const ts = analysis.tradeSetup;
  const timing = ts?.entryTiming;
  const price = analysis.currentPrice;
  const dir: string = ts?.direction || 'NONE';

  const is1m = tf === '1m';
  const defaultSlDist = is1m ? 1.80 : 3.00;
  const defaultTp1Dist = is1m ? 2.20 : 4.00;
  const defaultTp2Dist = is1m ? 4.00 : 7.00;

  // Safeguard: For BUY SL must be below price, for SELL SL must be above price
  let safeSl = ts?.stopLoss || (dir === 'LONG' || dir === 'BUY' ? price - defaultSlDist : price + defaultSlDist);
  if ((dir === 'LONG' || dir === 'BUY') && safeSl >= price) {
    safeSl = price - defaultSlDist;
  } else if ((dir === 'SHORT' || dir === 'SELL') && safeSl <= price) {
    safeSl = price + defaultSlDist;
  }

  let safeTp1 = ts?.tp1 || (dir === 'LONG' || dir === 'BUY' ? price + defaultTp1Dist : price - defaultTp1Dist);
  let safeTp2 = ts?.tp2 || (dir === 'LONG' || dir === 'BUY' ? price + defaultTp2Dist : price - defaultTp2Dist);

  const timingState: string = (timing?.state || 'WAIT') as string;
  const hasTimingTrigger = timingState === 'ENTER_NOW' || timingState === 'ZONE_ENTRY' || timingState === 'TRIGGERED_ZONE';
  const canExecute = (analysis.signal === 'BUY' || analysis.signal === 'SELL' || ts?.isActionable === true || hasTimingTrigger) && dir !== 'NONE' && analysis.score >= 55;

  return c.json({
    symbol,
    timeframe: tf,
    direction: dir,
    score: analysis.score,
    grade: analysis.setupGrade,
    isActionable: ts?.isActionable || false,
    canExecute,
    timingState,
    currentPrice: price,
    entry: ts?.entry || price,
    stopLoss: safeSl,
    tp1: safeTp1,
    tp2: safeTp2,
  });
});

const handleMtf = async (c: any) => {
  const symbol = parseSymbol(c.req.query('symbol'));
  const results = await Promise.all(
    ALL_TIMEFRAMES.map(async (tf) => {
      const { candles, source } = await getMarketCandles(symbol, tf);
      const silverCandles = symbol === 'XAUUSD' ? await getSilverCandles(tf) : undefined;
      return { tf, analysis: analyzeGoldCandles(candles, tf, source, symbol, silverCandles) };
    })
  );

  const tfMap: Record<string, any> = {};
  const allHighProbSignals: any[] = [];

  for (const { tf, analysis } of results) {
    tfMap[tf] = {
      timeframe: tf,
      signal: analysis.signal,
      grade: analysis.setupGrade,
      probability: analysis.probability,
      gatesPassed: analysis.gatesPassed,
      totalGates: analysis.totalGates,
      marketRegime: analysis.marketRegime,
      score: analysis.score,
      price: analysis.currentPrice,
      entry: analysis.tradeSetup.entry,
      pullbackEntry: analysis.tradeSetup.optimalPullbackEntry,
      stopLoss: analysis.tradeSetup.stopLoss,
      tp1: analysis.tradeSetup.tp1,
      tp2: analysis.tradeSetup.tp2,
      riskPips: analysis.tradeSetup.riskPips,
      rewardTp1Pips: analysis.tradeSetup.rewardTp1Pips,
      rewardTp2Pips: analysis.tradeSetup.rewardTp2Pips,
      direction: analysis.tradeSetup.direction,
      isActionable: analysis.tradeSetup.isActionable,
      entryTiming: analysis.tradeSetup.entryTiming,
      ictStructure: analysis.ictStructure,
      liquidityLevels: analysis.liquidityLevels,
      ema50: analysis.indicators.ema50,
      ema200: analysis.indicators.ema200,
      rsi14: analysis.indicators.rsi14,
      winRate: analysis.backtest.winRate,
      wins: analysis.backtest.wins,
      losses: analysis.backtest.losses,
      netPnlPerOz: analysis.backtest.netPnlPerOz,
      consecutiveLossesToday: analysis.backtest.consecutiveLossesToday,
      circuitBreakerTripped: analysis.backtest.circuitBreakerTripped,
      summaryReason: analysis.summaryReason,
      scoringMatrix: analysis.scoringMatrix,
      spreadGuard: analysis.spreadGuard,
      journal: analysis.journal,
      currentCandlePattern: analysis.currentCandlePattern,
      recentCandlePatterns: analysis.recentCandlePatterns,
      smartMoney: analysis.smartMoney,
    };

    for (const sig of analysis.historicalSignals) {
      allHighProbSignals.push({
        ...sig,
        timeframe: tf,
      });
    }
  }

  allHighProbSignals.sort((a, b) => b.time - a.time);

  // H4 + H1 + M15 Master Structure Alignment
  const h4Score = tfMap['4h']?.score ?? 0;
  const h1Score = tfMap['1h']?.score ?? 0;
  const m15Score = tfMap['15m']?.score ?? 0;
  const weightedScore = Math.round(h4Score * 0.35 + h1Score * 0.35 + m15Score * 0.3);

  let masterSignal: SignalDirection = 'WAIT';
  if (weightedScore >= 72) masterSignal = 'STRONG BUY';
  else if (weightedScore >= 48) masterSignal = 'BUY';
  else if (weightedScore <= -72) masterSignal = 'STRONG SELL';
  else if (weightedScore <= -48) masterSignal = 'SELL';

  const bullCount = Object.values(tfMap).filter((x: any) => x.score > 0 && x.gatesPassed >= 4).length;
  const bearCount = Object.values(tfMap).filter((x: any) => x.score < 0 && x.gatesPassed >= 4).length;

  let alignmentSummary = `H4 + H1 + M15 Structure: ${weightedScore >= 0 ? 'Bullish Bias' : 'Bearish Bias'}`;
  if (bullCount >= 5) alignmentSummary = `Strong Bullish Alignment (${bullCount}/6 TFs Above 50/200 EMA)`;
  else if (bearCount >= 5) alignmentSummary = `Strong Bearish Alignment (${bearCount}/6 TFs Below 50/200 EMA)`;

  const refSession = results.find((r) => r.tf === '15m')?.analysis.session ?? results[0].analysis.session;

  const highConfidenceByTf: Record<string, any[]> = {};
  for (const { tf, analysis } of results) {
    const rawSignals = analysis.historicalSignals || [];
    const lc = analysis.tradeSetup?.entryTiming?.lifecycle;
    const entries: any[] = [];

    // 1. If currently activated, include the active position as Entry #0 (⚡ LIVE ACTIVATED)
    if (lc && lc.isActivated) {
      entries.push({
        isLiveCurrent: true,
        time: lc.activatedTime || Math.floor(Date.now() / 1000),
        timeframe: tf,
        type: lc.direction as 'BUY' | 'SELL',
        grade: analysis.setupGrade,
        probability: analysis.probability,
        confidence: analysis.probability,
        entry: lc.entryPrice,
        stopLoss: lc.stopLoss,
        tp1: lc.tp1,
        tp2: lc.tp2,
        outcome: 'ACTIVE',
        pnlDollarsPerOz: lc.floatingDollarsPerOz || 0,
        isActivated: true,
        activationState: lc.activationState,
        statusBadge: lc.statusBadge,
        pnlStatusText: lc.pnlStatusText,
        distanceToEntryPips: 0,
        reason: lc.summaryText || '4-Confluence Setup',
      });
    }

    // 2. Add all previously activated & completed trades (#1, #2, #3...) in strict chronological order
    for (const s of rawSignals) {
      if (entries.length >= 15) break;
      // Skip if this signal is the active trade we already added above
      if (s.outcome === 'ACTIVE' && entries.some((e) => e.isLiveCurrent && e.isActivated)) {
        continue;
      }
      entries.push(s);
    }

    highConfidenceByTf[tf] = entries;
  }

  // Automatic Telegram Channel Broadcast for High-Confidence Setups (Strictly 1H & 15M)
  for (const { tf, analysis } of results) {
    if (tf !== '1h' && tf !== '15m') continue;
    const uInfo = SYMBOL_CONFIGS[symbol];
    const qm = analysis.scoringMatrix;
    const ts = analysis.tradeSetup;
    const lc = ts?.entryTiming?.lifecycle;

    // Check & broadcast actionable A+ / 90%+ setups
    if (
      qm &&
      qm.allMandatoryConfluencesPassed &&
      (analysis.setupGrade === 'A+' || qm.totalScore >= 90) &&
      ts &&
      ts.isActionable
    ) {
      void checkAndBroadcastSetup({
        symbol,
        displayName: uInfo.displayName,
        assetIcon: uInfo.icon,
        timeframe: tf,
        type: ts.direction === 'LONG' ? 'BUY' : 'SELL',
        grade: analysis.setupGrade || 'A+',
        probability: analysis.probability,
        score: qm.totalScore,
        allMandatoryPassed: qm.allMandatoryConfluencesPassed,
        entry: ts.entry,
        stopLoss: ts.stopLoss,
        tp1: ts.tp1,
        tp2: ts.tp2,
        riskPips: ts.riskPips,
        rewardTp1Pips: ts.rewardTp1Pips,
        rewardTp2Pips: ts.rewardTp2Pips,
        pipUnit: uInfo.unitLabel || 'pips',
        reason: analysis.summaryReason || `${tf.toUpperCase()} 4-Confluence A+ Confirmed`,
        plannedRiskUsd: ts.v3Config?.plannedRiskUsd,
        positionSize: ts.v3Config?.positionSize,
        positionUnit: ts.v3Config?.positionUnit,
        time: Math.floor(Date.now() / 1000),
      });
    }

    // Check & broadcast trade activation and milestones (Strictly 1H & 15M)
    if (lc && lc.isActivated) {
      // 1. Broadcast Trade Activated (Entry Tapped & Filled)
      void checkAndBroadcastMilestone({
        symbol,
        displayName: uInfo.displayName,
        assetIcon: uInfo.icon,
        timeframe: tf,
        type: lc.direction,
        stage: 'ACTIVATED',
        entry: lc.entryPrice,
        targetPrice: lc.tp1,
        signalTime: lc.activatedTime || 0,
        pips: 0,
        pipUnit: uInfo.unitLabel || 'pips',
      });

      if (lc.hitTp2) {
        void checkAndBroadcastMilestone({
          symbol,
          displayName: uInfo.displayName,
          assetIcon: uInfo.icon,
          timeframe: tf,
          type: lc.direction,
          stage: 'TP2',
          entry: lc.entryPrice,
          targetPrice: lc.tp2,
          signalTime: lc.activatedTime || 0,
          pips: ts.rewardTp2Pips,
          pipUnit: uInfo.unitLabel || 'pips',
        });
      } else if (lc.hitTp1) {
        void checkAndBroadcastMilestone({
          symbol,
          displayName: uInfo.displayName,
          assetIcon: uInfo.icon,
          timeframe: tf,
          type: lc.direction,
          stage: 'TP1',
          entry: lc.entryPrice,
          targetPrice: lc.tp1,
          signalTime: lc.activatedTime || 0,
          pips: ts.rewardTp1Pips,
          pipUnit: uInfo.unitLabel || 'pips',
        });
      } else if (lc.hitSl) {
        void checkAndBroadcastMilestone({
          symbol,
          displayName: uInfo.displayName,
          assetIcon: uInfo.icon,
          timeframe: tf,
          type: lc.direction,
          stage: 'SL',
          entry: lc.entryPrice,
          targetPrice: lc.stopLoss,
          signalTime: lc.activatedTime || 0,
          pips: ts.riskPips,
          pipUnit: uInfo.unitLabel || 'pips',
        });
      }
    }
  }

  return c.json({
    symbol: SYMBOL_CONFIGS[symbol].displayName,
    symbolCode: symbol,
    symbolConfig: SYMBOL_CONFIGS[symbol],
    spotQuote: getLatestSpotQuote(symbol),
    session: refSession,
    updatedAt: new Date().toISOString(),
    masterSignal,
    weightedScore,
    alignmentSummary,
    timeframes: tfMap,
    highConfidenceByTf,
    allHighProbSignals: allHighProbSignals.slice(0, 60),
  });
};

app.get('/api/mtf', handleMtf);
app.get('/mtf', handleMtf);

interface RadarSignal {
  symbol: SupportedSymbol;
  symbolName: string;
  symbolIcon: string;
  timeframe: SupportedTimeframe;
  direction: 'BUY' | 'SELL';
  grade: 'A+' | 'A' | 'B' | 'C';
  score: number;
  allMandatoryPassed: boolean;
  currentPrice: number;
  entry: number;
  pullbackEntry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  riskPips: number;
  rewardTp1Pips: number;
  rewardTp2Pips: number;
  pipUnit: string;
  proximityState: 'IN_ZONE' | 'APPROACHING' | 'ACTIVE' | 'PENDING' | 'LATE';
  proximityBadge: string;
  distanceToLimitPoints: number;
  distanceToLimitPips: number;
  distanceLabel: string;
  entryTimingState: string;
  isActivated: boolean;
  pnlStatusText: string;
  actionRecommendation: string;
  reason: string;
  candlePattern?: string;
  candleIcon?: string;
}

let cachedRadarData: { timestamp: number; signals: RadarSignal[]; summary: any } | null = null;

const handleRadar = async (c: any) => {
  const now = Date.now();
  if (cachedRadarData && now - cachedRadarData.timestamp < 3000) {
    return c.json({ status: 'ok', cached: true, ...cachedRadarData });
  }

  const allScanResults = await Promise.all(
    ALL_SYMBOLS.flatMap((sym) =>
      ALL_TIMEFRAMES.map(async (tf) => {
        try {
          const { candles, source } = await getMarketCandles(sym, tf);
          const silverCandles = sym === 'XAUUSD' ? await getSilverCandles(tf) : undefined;
          const analysis = analyzeGoldCandles(candles, tf, source, sym, silverCandles);
          return { sym, tf, analysis };
        } catch {
          return null;
        }
      })
    )
  );

  const signals: RadarSignal[] = [];

  for (const item of allScanResults) {
    if (!item) continue;
    const { sym, tf, analysis } = item;
    const cfg = SYMBOL_CONFIGS[sym];
    const ts = analysis.tradeSetup;
    const qm = analysis.scoringMatrix;
    const lc = ts?.entryTiming?.lifecycle;
    const score = qm?.totalScore ?? analysis.score ?? 0;
    const grade = analysis.setupGrade || 'B';
    const isActionable = ts?.isActionable || false;
    const isActivated = lc?.isActivated || false;

    // Filter for actionable signals or active trades with decent quality (>= 70 or A/A+ or activated)
    if (!isActionable && !isActivated && score < 70) continue;
    if (ts.direction === 'NONE') continue;

    const currentPrice = analysis.currentPrice;
    const pullbackEntry = ts.optimalPullbackEntry || ts.entry;
    const pipMultiplier = cfg.pipMultiplier || 10;
    const pointsDiff = Math.abs(currentPrice - pullbackEntry);
    const pipsDiff = Number((pointsDiff * pipMultiplier).toFixed(1));
    const pctDiff = (pointsDiff / currentPrice) * 100;

    let proximityState: 'IN_ZONE' | 'APPROACHING' | 'ACTIVE' | 'PENDING' | 'LATE' = 'PENDING';
    let proximityBadge = '📋 PENDING';
    let distanceLabel = `${pipsDiff} ${cfg.unitLabel}`;
    let actionRecommendation = `Set CE Limit at ${pullbackEntry}`;

    if (isActivated) {
      proximityState = 'ACTIVE';
      proximityBadge = lc.hitTp1 ? '🏆 TP1 HIT' : '⚡ IN FLIGHT';
      distanceLabel = lc.pnlStatusText || 'Trade in Progress';
      actionRecommendation = lc.hitTp1 ? 'TP1 hit! Runner to TP2 active' : 'Position live: manage risk';
    } else if (pctDiff <= 0.08 || pipsDiff <= (sym === 'BTCUSD' ? 20 : 2.5)) {
      proximityState = 'IN_ZONE';
      proximityBadge = '🔥 IN ENTRY ZONE';
      distanceLabel = `${pipsDiff} ${cfg.unitLabel} to CE Limit`;
      actionRecommendation = `⚡ ENTER NOW at $${currentPrice.toFixed(2)} or CE Limit $${pullbackEntry.toFixed(2)}`;
    } else if (pctDiff <= 0.35 || pipsDiff <= (sym === 'BTCUSD' ? 100 : 15)) {
      proximityState = 'APPROACHING';
      proximityBadge = '⏳ APPROACHING';
      distanceLabel = `${pipsDiff} ${cfg.unitLabel} to CE Limit`;
      actionRecommendation = `🎯 Place CE 50% Limit Order at $${pullbackEntry.toFixed(2)}`;
    } else if (ts.entryTiming?.isLate) {
      proximityState = 'LATE';
      proximityBadge = '⚠️ WAIT RETEST';
      distanceLabel = `Moved +${pipsDiff} ${cfg.unitLabel}`;
      actionRecommendation = `Price extended: wait for pullback to $${pullbackEntry.toFixed(2)}`;
    } else {
      proximityState = 'PENDING';
      proximityBadge = '📋 PENDING PULLBACK';
      distanceLabel = `${pipsDiff} ${cfg.unitLabel} to CE Limit`;
      actionRecommendation = `Watch for pullback to $${pullbackEntry.toFixed(2)}`;
    }

    signals.push({
      symbol: sym,
      symbolName: cfg.displayName,
      symbolIcon: cfg.icon,
      timeframe: tf,
      direction: ts.direction === 'LONG' ? 'BUY' : 'SELL',
      grade,
      score,
      allMandatoryPassed: qm?.allMandatoryConfluencesPassed ?? false,
      currentPrice,
      entry: ts.entry,
      pullbackEntry,
      stopLoss: ts.stopLoss,
      tp1: ts.tp1,
      tp2: ts.tp2,
      riskPips: ts.riskPips,
      rewardTp1Pips: ts.rewardTp1Pips,
      rewardTp2Pips: ts.rewardTp2Pips,
      pipUnit: cfg.unitLabel || 'pips',
      proximityState,
      proximityBadge,
      distanceToLimitPoints: Number(pointsDiff.toFixed(2)),
      distanceToLimitPips: pipsDiff,
      distanceLabel,
      entryTimingState: ts.entryTiming?.state || 'WAIT_CONFIRMATION',
      isActivated,
      pnlStatusText: lc?.pnlStatusText || '',
      actionRecommendation,
      reason: analysis.summaryReason || `${tf.toUpperCase()} Confluence Setup`,
      candlePattern: analysis.currentCandlePattern?.badge || '',
      candleIcon: analysis.currentCandlePattern?.icon || '',
    });
  }

  // Sort: Priority 1 = IN_ZONE, Priority 2 = ACTIVE, Priority 3 = APPROACHING, Priority 4 = PENDING, Priority 5 = LATE
  const statePriority: Record<string, number> = {
    IN_ZONE: 1,
    ACTIVE: 2,
    APPROACHING: 3,
    PENDING: 4,
    LATE: 5,
  };

  signals.sort((a, b) => {
    const pA = statePriority[a.proximityState] || 99;
    const pB = statePriority[b.proximityState] || 99;
    if (pA !== pB) return pA - pB;
    return b.score - a.score;
  });

  const summary = {
    totalSignals: signals.length,
    inZoneCount: signals.filter((s) => s.proximityState === 'IN_ZONE').length,
    activeCount: signals.filter((s) => s.proximityState === 'ACTIVE').length,
    approachingCount: signals.filter((s) => s.proximityState === 'APPROACHING').length,
    aPlusCount: signals.filter((s) => s.grade === 'A+' || s.score >= 90).length,
    updatedAt: new Date().toISOString(),
  };

  cachedRadarData = {
    timestamp: now,
    signals,
    summary,
  };

  return c.json({ status: 'ok', cached: false, signals, summary });
};

app.get('/api/radar', handleRadar);
app.get('/radar', handleRadar);

const handleStream = (c: any) => {
  const symbol = parseSymbol(c.req.query('symbol'));
  return streamSSE(c, async (stream) => {
    let closed = false;
    stream.onAbort(() => {
      closed = true;
    });

    await stream.writeSSE({
      event: 'tick',
      data: JSON.stringify(getLatestSpotQuote(symbol)),
    });

    const unsubscribe = subscribeToTicks((quote) => {
      if (!closed && quote.symbol === symbol) {
        void stream.writeSSE({
          event: 'tick',
          data: JSON.stringify(quote),
        });
      }
    });

    while (!closed) {
      await stream.sleep(1000);
    }
    unsubscribe();
  });
};

app.get('/api/stream', handleStream);
app.get('/stream', handleStream);

app.get('/api/d1/status', (c: any) =>
  c.json({ status: 'ok', d1: getD1Status() })
);
app.get('/d1/status', (c: any) =>
  c.json({ status: 'ok', d1: getD1Status() })
);

app.get('/api/d1/entries', (c: any) =>
  c.json({ status: 'ok', d1: getD1Status(), entries: getAllStoredD1Entries() })
);
app.get('/d1/entries', (c: any) =>
  c.json({ status: 'ok', d1: getD1Status(), entries: getAllStoredD1Entries() })
);

app.get('/api/history', (c: any) => {
  const timeframe = c.req.query('timeframe') || 'ALL';
  const outcome = c.req.query('outcome') || 'ALL';
  const grade = c.req.query('grade') || 'ALL';
  const limit = Number(c.req.query('limit')) || 100;
  const report = queryD1TradeHistory({ timeframe, outcome, grade, limit });
  return c.json({ status: 'ok', d1: getD1Status(), ...report });
});
app.get('/history', (c: any) => {
  const timeframe = c.req.query('timeframe') || 'ALL';
  const outcome = c.req.query('outcome') || 'ALL';
  const grade = c.req.query('grade') || 'ALL';
  const limit = Number(c.req.query('limit')) || 100;
  const report = queryD1TradeHistory({ timeframe, outcome, grade, limit });
  return c.json({ status: 'ok', d1: getD1Status(), ...report });
});

app.post('/api/d1/init', async (c: any) => {
  const success = await initD1Database(c.env?.DB);
  return c.json({ status: success ? 'ok' : 'fallback', d1: getD1Status() });
});

// Telegram Channel Integration Endpoints
app.get('/api/telegram/status', (c: any) => c.json(getTelegramStatus()));

app.post('/api/telegram/configure', async (c: any) => {
  try {
    const body = await c.req.json();
    const res = await saveTelegramConfig(body);
    if (!res.success) {
      return c.json({ success: false, error: res.error }, 400);
    }
    return c.json({
      success: true,
      botUsername: res.botUsername,
      status: getTelegramStatus(),
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/telegram/test', async (c: any) => {
  let customChatId: string | undefined;
  try {
    const body = await c.req.json();
    if (body && body.chatId) customChatId = String(body.chatId).trim();
  } catch {}
  const res = await sendTelegramTestPing(customChatId);
  return c.json(res);
});

app.post('/api/telegram/push-now', async (c: any) => {
  try {
    const rawTf = (c.req.query('tf') || '15m').toLowerCase();
    if (rawTf === '5m' && !c.req.query('force')) {
      return c.json({
        success: false,
        error: 'Standalone 5M broadcast is disabled. 5M is strictly used as entry confirmation for 15M and 1H setups only.',
      }, 200);
    }

    const tf: SupportedTimeframe = rawTf === '1h' ? '1h' : '15m';
    const symbol: SupportedSymbol = 'XAUUSD';
    const uInfo = SYMBOL_CONFIGS[symbol];

    const { candles, source } = await getMarketCandles(symbol, tf);
    const silverCandles = await getSilverCandles(tf);
    const analysis = analyzeGoldCandles(candles, tf, source, symbol, silverCandles);
    const qm = analysis.scoringMatrix;
    const ts = analysis.tradeSetup;

    const score = qm?.totalScore ?? analysis.score;
    const prob = analysis.probability;
    const is95Plus = (score >= 95 || prob >= 95) && (analysis.setupGrade === 'A+' || analysis.setupGrade === 'A');

    if (!is95Plus && !c.req.query('force')) {
      return c.json({
        success: false,
        error: `Current ${tf.toUpperCase()} setup is Grade ${analysis.setupGrade || 'C'} (${score}/100 PTS, ${prob}% prob). Telegram push is strictly restricted to 95%+ setups.`,
        grade: analysis.setupGrade || 'C',
        score,
        probability: prob
      }, 200);
    }

    const isConfirmed = ts.entryTiming?.state === 'ENTER_NOW';
    if (!isConfirmed && !c.req.query('force')) {
      return c.json({
        success: false,
        error: `Setup is NOT confirmed yet! Status: ${ts.entryTiming?.badgeText || 'WAITING CONFIRMATION'}. System is waiting for FVG CE 50% mitigation & candle confirmation before pushing.`,
        timingState: ts.entryTiming?.state,
        grade: analysis.setupGrade
      }, 200);
    }

    // Check 5M entry confirmation (user rule: 5mins push confirm entry for 15mins and 1h, only)
    const { candles: candles5m, source: source5m } = await getMarketCandles(symbol, '5m');
    const silverCandles5m = await getSilverCandles('5m');
    const analysis5m = analyzeGoldCandles(candles5m, '5m', source5m, symbol, silverCandles5m);
    const ts5m = analysis5m.tradeSetup;
    const lc5m = ts5m?.entryTiming?.lifecycle;

    const is5mAligned = ts5m && ts5m.direction === ts.direction;
    const is5mConfirmed = is5mAligned && (
      ts5m?.entryTiming?.state === 'ENTER_NOW' ||
      Boolean(lc5m?.isActivated)
    );

    if (!is5mConfirmed && !c.req.query('force')) {
      return c.json({
        success: false,
        error: `5M entry confirmation is pending! 5M state: ${ts5m?.entryTiming?.state || 'UNKNOWN'} (${ts5m?.direction}). Waiting for 5M candle to confirm entry for ${tf.toUpperCase()}.`,
        is5mAligned,
        tf5mDirection: ts5m?.direction,
        tf5mTimingState: ts5m?.entryTiming?.state,
        grade: analysis.setupGrade
      }, 200);
    }

    const isEnterNow = ts.entryTiming?.state === 'ENTER_NOW';
    const entryPrice = isEnterNow ? analysis.currentPrice : (ts.optimalPullbackEntry || ts.entry);
    const orderType = isEnterNow
      ? (ts.direction === 'LONG' ? 'BUY MARKET' : 'SELL MARKET')
      : (ts.direction === 'LONG' ? 'BUY LIMIT (FVG Pullback)' : 'SELL LIMIT (FVG Pullback)');

    const card = formatTelegramSignalCard({
      symbol,
      displayName: uInfo.displayName,
      assetIcon: uInfo.icon,
      timeframe: tf,
      type: ts.direction === 'LONG' ? 'BUY' : 'SELL',
      orderType,
      grade: analysis.setupGrade || 'A',
      probability: analysis.probability || 88,
      score: qm?.totalScore || analysis.score || 85,
      allMandatoryPassed: qm?.allMandatoryConfluencesPassed ?? true,
      entry: entryPrice,
      stopLoss: ts.stopLoss,
      tp1: ts.tp1,
      tp2: ts.tp2,
      riskPips: ts.riskPips,
      rewardTp1Pips: ts.rewardTp1Pips,
      rewardTp2Pips: ts.rewardTp2Pips,
      pipUnit: uInfo.unitLabel || 'pips',
      reason: analysis.summaryReason || `Live Real-Time ${tf.toUpperCase()} SMC Analysis`,
      plannedRiskUsd: ts.v3Config?.plannedRiskUsd || 25,
      positionSize: ts.v3Config?.positionSize || 0.03,
      positionUnit: ts.v3Config?.positionUnit || 'lots',
      smcSuite: analysis.smartMoney?.smcSuite,
      time: Math.floor(Date.now() / 1000),
      entryConfirmedBy5m: is5mConfirmed,
    });

    const res = await sendTelegramMessage(card);
    return c.json({
      success: res.success,
      messageId: res.messageId,
      entry: entryPrice,
      orderType,
      timeframe: tf,
      entryConfirmedBy5m: is5mConfirmed
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/telegram/broadcast', async (c: any) => {
  try {
    const body = await c.req.json();
    if (!body) return c.json({ success: false, error: 'Missing signal body' }, 400);

    const sym = (body.symbol || 'XAUUSD') as SupportedSymbol;
    const uInfo = SYMBOL_CONFIGS[sym] || SYMBOL_CONFIGS['XAUUSD'];

    const messageHtml = formatTelegramSignalCard({
      symbol: sym,
      displayName: body.displayName || uInfo.displayName,
      assetIcon: body.assetIcon || uInfo.icon,
      timeframe: body.timeframe || '15m',
      type: body.type || 'BUY',
      grade: body.grade || 'A+',
      probability: Number(body.probability || 95),
      score: Number(body.score || 95),
      allMandatoryPassed: body.allMandatoryPassed !== false,
      entry: Number(body.entry || 0),
      stopLoss: Number(body.stopLoss || 0),
      tp1: Number(body.tp1 || 0),
      tp2: Number(body.tp2 || 0),
      riskPips: Number(body.riskPips || 0),
      rewardTp1Pips: Number(body.rewardTp1Pips || 0),
      rewardTp2Pips: Number(body.rewardTp2Pips || 0),
      pipUnit: body.pipUnit || uInfo.unitLabel || 'pips',
      reason: body.reason || 'Manual broadcast from terminal',
      plannedRiskUsd: Number(body.plannedRiskUsd || 25),
      positionSize: body.positionSize,
      positionUnit: body.positionUnit,
      time: body.time,
    });

    const res = await sendTelegramMessage(messageHtml, body.chatId);
    return c.json(res);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// MT5 Real-Time Integration & Bridge Endpoints
app.get('/api/mt5/status', (c: any) => c.json(getMt5Status()));
app.get('/mt5/status', (c: any) => c.json(getMt5Status()));

app.post('/api/mt5/feed', async (c: any) => {
  try {
    const body = await c.req.json();
    const res = ingestMt5Feed(body);
    return c.json(res);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});
app.post('/mt5/feed', async (c: any) => {
  try {
    const body = await c.req.json();
    const res = ingestMt5Feed(body);
    return c.json(res);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/mt5/ea', (c: any) => {
  return c.text(MQL5_EA_SCRIPT, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Disposition': 'attachment; filename="IndecatorBridge.mq5"',
  });
});

app.get('/api/mt5/python', (c: any) => {
  return c.text(PYTHON_MT5_SCRIPT, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Disposition': 'attachment; filename="mt5_bridge.py"',
  });
});

const handleHealth = (c: any) => {
  const symbol = parseSymbol(c.req.query('symbol'));
  return c.json({
    status: 'ok',
    service: 'multi-asset-4-confluence-master-strategy',
    symbol,
    spotQuote: getLatestSpotQuote(symbol),
    d1Database: getD1Status(),
  });
};

app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

const port = Number(process.env.PORT) || 3000;

if (!process.env.VERCEL) {
  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`✨ Multi-Asset (Gold & Crypto) 4-Confluence Terminal running at http://localhost:${info.port}`);
    }
  );
}

// Autonomous 24/7 High-Confidence Scanner for Telegram Channel Alerts
let isScanningTelegram = false;
async function runAutonomousTelegramScanner() {
  if (isScanningTelegram) return;
  const cfg = getTelegramStatus();
  if (!cfg.enabled || !cfg.autoBroadcast) return;

  isScanningTelegram = true;
  try {
    const symbol: SupportedSymbol = 'XAUUSD';
    const uInfo = SYMBOL_CONFIGS[symbol];
    const scanTfs: SupportedTimeframe[] = ['1h', '15m'];

    for (const tf of scanTfs) {
      const { candles, source } = await getMarketCandles(symbol, tf);
      if (!candles || candles.length === 0) continue;
      const silverCandles = await getSilverCandles(tf);
      const analysis = analyzeGoldCandles(candles, tf, source, symbol, silverCandles);
      const qm = analysis.scoringMatrix;
      const ts = analysis.tradeSetup;
      const lc = ts?.entryTiming?.lifecycle;

      // Strictly push ONLY when 95%+ AND fully CONFIRMED (ENTER_NOW)
      const score = qm?.totalScore ?? analysis.score;
      const prob = analysis.probability;
      const is95Plus = ts && (score >= 95 || prob >= 95) && (analysis.setupGrade === 'A+' || analysis.setupGrade === 'A');
      const isConfirmed = ts?.entryTiming?.state === 'ENTER_NOW';

      // 5M Entry Confirmation Gate: 5-minute candle confirms the entry for 15M and 1H
      const { candles: candles5m, source: source5m } = await getMarketCandles(symbol, '5m');
      const silverCandles5m = await getSilverCandles('5m');
      const analysis5m = analyzeGoldCandles(candles5m, '5m', source5m, symbol, silverCandles5m);
      const ts5m = analysis5m.tradeSetup;
      const lc5m = ts5m?.entryTiming?.lifecycle;

      const is5mAligned = ts5m && ts5m.direction === ts.direction;
      const is5mEntryConfirmed = is5mAligned && (
        ts5m?.entryTiming?.state === 'ENTER_NOW' ||
        Boolean(lc5m?.isActivated)
      );

      // Patiently wait: do NOT broadcast unless 15M/1H is 95%+ Grade A+ AND 5M confirms the entry
      if (is95Plus && isConfirmed && is5mEntryConfirmed) {
        const entryPrice = lc?.isActivated && lc?.entryPrice ? lc.entryPrice : analysis.currentPrice;
        const orderType = ts.direction === 'LONG' ? 'BUY MARKET' : 'SELL MARKET';
        const lastBarTime = lc?.isActivated && lc?.activatedTime
          ? lc.activatedTime
          : (candles[candles.length - 1]?.time || Math.floor(Date.now() / 1000));

        await checkAndBroadcastSetup({
          symbol,
          displayName: uInfo.displayName,
          assetIcon: uInfo.icon,
          timeframe: tf,
          type: ts.direction === 'LONG' ? 'BUY' : 'SELL',
          orderType,
          grade: analysis.setupGrade || 'A',
          probability: analysis.probability,
          score: qm?.totalScore || analysis.score || 80,
          allMandatoryPassed: qm?.allMandatoryConfluencesPassed ?? true,
          entry: entryPrice,
          stopLoss: ts.stopLoss,
          tp1: ts.tp1,
          tp2: ts.tp2,
          riskPips: ts.riskPips,
          rewardTp1Pips: ts.rewardTp1Pips,
          rewardTp2Pips: ts.rewardTp2Pips,
          pipUnit: uInfo.unitLabel || 'pips',
          reason: analysis.summaryReason || `${tf.toUpperCase()} SMC Institutional Setup`,
          plannedRiskUsd: ts.v3Config?.plannedRiskUsd,
          positionSize: ts.v3Config?.positionSize,
          positionUnit: ts.v3Config?.positionUnit,
          smcSuite: analysis.smartMoney?.smcSuite,
          time: lastBarTime,
          isActivated: Boolean(lc?.isActivated),
          entryConfirmedBy5m: true,
        });
      }

      // 1. Broadcast trade activation (Entry Tapped & Filled) - only for fresh activations within 5 minutes
      if (lc && lc.isActivated && lc.activatedTime && (Date.now() / 1000 - lc.activatedTime) < 300) {
        await checkAndBroadcastMilestone({
          symbol,
          displayName: uInfo.displayName,
          assetIcon: uInfo.icon,
          timeframe: tf,
          type: lc.direction as 'BUY' | 'SELL',
          stage: 'ACTIVATED',
          entry: lc.entryPrice,
          targetPrice: lc.tp1,
          signalTime: lc.activatedTime || Math.floor(Date.now() / 1000),
          pips: 0,
          pipUnit: uInfo.unitLabel || 'pips',
        });
      }

      // 2. Broadcast milestone notifications (TP1 hit, TP2 hit, SL hit) for currently active trade
      if (lc) {
        if (lc.hitTp2 || lc.activationState === 'TP2_HIT_PROFIT') {
          await checkAndBroadcastMilestone({
            symbol,
            displayName: uInfo.displayName,
            assetIcon: uInfo.icon,
            timeframe: tf,
            type: lc.direction as 'BUY' | 'SELL',
            stage: 'TP2',
            entry: lc.entryPrice,
            targetPrice: lc.tp2,
            signalTime: lc.activatedTime || Math.floor(Date.now() / 1000),
            pips: Math.abs(lc.currentPrice - lc.entryPrice) * (uInfo.pipMultiplier || 10),
            pipUnit: uInfo.unitLabel || 'pips',
          });
        } else if (lc.hitTp1 || lc.activationState === 'TP1_HIT_RUNNING') {
          await checkAndBroadcastMilestone({
            symbol,
            displayName: uInfo.displayName,
            assetIcon: uInfo.icon,
            timeframe: tf,
            type: lc.direction as 'BUY' | 'SELL',
            stage: 'TP1',
            entry: lc.entryPrice,
            targetPrice: lc.tp1,
            signalTime: lc.activatedTime || Math.floor(Date.now() / 1000),
            pips: Math.abs(lc.currentPrice - lc.entryPrice) * (uInfo.pipMultiplier || 10),
            pipUnit: uInfo.unitLabel || 'pips',
          });
        } else if (lc.hitSl || lc.activationState === 'SL_HIT_LOSS') {
          await checkAndBroadcastMilestone({
            symbol,
            displayName: uInfo.displayName,
            assetIcon: uInfo.icon,
            timeframe: tf,
            type: lc.direction as 'BUY' | 'SELL',
            stage: 'SL',
            entry: lc.entryPrice,
            targetPrice: lc.stopLoss,
            signalTime: lc.activatedTime || Math.floor(Date.now() / 1000),
            pips: Math.abs(lc.entryPrice - lc.stopLoss) * (uInfo.pipMultiplier || 10),
            pipUnit: uInfo.unitLabel || 'pips',
          });
        }
      }

      // 3. Check recently closed trade history (catches trades archived right upon hitting SL/TP/BE)
      const closedHistory = getLockedClosedHistory(symbol, tf);
      const lastClosed = closedHistory && closedHistory.length > 0 ? closedHistory[0] : null;
      if (lastClosed && lastClosed.time && (Date.now() / 1000 - lastClosed.time) < 1800) {
        if (lastClosed.outcome === 'TP2_HIT') {
          await checkAndBroadcastMilestone({
            symbol,
            displayName: uInfo.displayName,
            assetIcon: uInfo.icon,
            timeframe: tf,
            type: lastClosed.type as 'BUY' | 'SELL',
            stage: 'TP2',
            entry: lastClosed.entry,
            targetPrice: lastClosed.tp2,
            signalTime: lastClosed.time,
            pips: Math.abs(lastClosed.tp2 - lastClosed.entry) * (uInfo.pipMultiplier || 10),
            pipUnit: uInfo.unitLabel || 'pips',
          });
        } else if (lastClosed.outcome === 'TP1_HIT') {
          await checkAndBroadcastMilestone({
            symbol,
            displayName: uInfo.displayName,
            assetIcon: uInfo.icon,
            timeframe: tf,
            type: lastClosed.type as 'BUY' | 'SELL',
            stage: 'TP1',
            entry: lastClosed.entry,
            targetPrice: lastClosed.tp1,
            signalTime: lastClosed.time,
            pips: Math.abs(lastClosed.tp1 - lastClosed.entry) * (uInfo.pipMultiplier || 10),
            pipUnit: uInfo.unitLabel || 'pips',
          });
        } else if (lastClosed.outcome === 'SL_HIT') {
          await checkAndBroadcastMilestone({
            symbol,
            displayName: uInfo.displayName,
            assetIcon: uInfo.icon,
            timeframe: tf,
            type: lastClosed.type as 'BUY' | 'SELL',
            stage: 'SL',
            entry: lastClosed.entry,
            targetPrice: lastClosed.stopLoss,
            signalTime: lastClosed.time,
            pips: Math.abs(lastClosed.entry - lastClosed.stopLoss) * (uInfo.pipMultiplier || 10),
            pipUnit: uInfo.unitLabel || 'pips',
          });
        } else if (lastClosed.outcome === 'BE_EXIT') {
          await checkAndBroadcastMilestone({
            symbol,
            displayName: uInfo.displayName,
            assetIcon: uInfo.icon,
            timeframe: tf,
            type: lastClosed.type as 'BUY' | 'SELL',
            stage: 'BE_EXIT',
            entry: lastClosed.entry,
            targetPrice: lastClosed.entry,
            signalTime: lastClosed.time,
            pips: 0,
            pipUnit: uInfo.unitLabel || 'pips',
          });
        }
      }
    }
  } catch (err: any) {
    // Non-blocking background catch
  } finally {
    isScanningTelegram = false;
  }
}

// Run autonomous scanner every 15 seconds
setInterval(runAutonomousTelegramScanner, 15000);

export default app;
