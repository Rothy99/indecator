import { serve } from '@hono/node-server';
import fs from 'node:fs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
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
import { getAllStoredD1Entries, getD1Status, initD1Database } from './d1Database.js';

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

app.post('/api/d1/init', async (c: any) => {
  const success = await initD1Database(c.env?.DB);
  return c.json({ status: success ? 'ok' : 'fallback', d1: getD1Status() });
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
