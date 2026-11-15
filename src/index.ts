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
import { analyzeGoldCandles, SignalDirection } from './indicators.js';
import {
  ALL_SYMBOLS,
  ALL_TIMEFRAMES,
  getLatestSpotQuote,
  getMarketCandles,
  initRealtimeMarketEngine,
  subscribeToTicks,
  SupportedSymbol,
  SupportedTimeframe,
  SYMBOL_CONFIGS,
} from './marketData.js';
import { DASHBOARD_HTML } from './dashboardHtml.js';
import { getAllStoredD1Entries, getD1Status, initD1Database, queryD1TradeHistory } from './d1Database.js';
import {
  checkAndBroadcastMilestone,
  checkAndBroadcastSetup,
  formatTelegramSignalCard,
  getTelegramStatus,
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
  const rawTf = (c.req.query('tf') || '15m').toLowerCase();
  const tf: SupportedTimeframe = ALL_TIMEFRAMES.includes(rawTf as SupportedTimeframe)
    ? (rawTf as SupportedTimeframe)
    : '15m';
  const symbol = parseSymbol(c.req.query('symbol'));

  const { candles, source, spotQuote } = await getMarketCandles(symbol, tf);
  const analysis = analyzeGoldCandles(candles, tf, source, symbol);

  return c.json({
    ...analysis,
    spotQuote,
    symbolConfig: SYMBOL_CONFIGS[symbol],
  });
};

app.get('/api/signal', handleSignal);
app.get('/signal', handleSignal);

const handleMtf = async (c: any) => {
  const symbol = parseSymbol(c.req.query('symbol'));
  const results = await Promise.all(
    ALL_TIMEFRAMES.map(async (tf) => {
      const { candles, source } = await getMarketCandles(symbol, tf);
      return { tf, analysis: analyzeGoldCandles(candles, tf, source, symbol) };
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

  // Automatic Telegram Channel Broadcast for High-Confidence Setups & Milestones
  for (const { tf, analysis } of results) {
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

    // Check & broadcast milestone updates (TP1 hit / TP2 hit)
    if (lc && lc.isActivated) {
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

app.post('/api/telegram/test', async (c: any) => {
  let customChatId: string | undefined;
  try {
    const body = await c.req.json();
    if (body && body.chatId) customChatId = String(body.chatId).trim();
  } catch {}
  const res = await sendTelegramTestPing(customChatId);
  return c.json(res);
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

export default app;
