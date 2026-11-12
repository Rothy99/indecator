import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { analyzeGoldCandles, SignalDirection } from './indicators.js';
import {
  ALL_TIMEFRAMES,
  getGoldCandles,
  getLatestSpotQuote,
  initRealtimeMarketEngine,
  subscribeToTicks,
  SupportedTimeframe,
} from './marketData.js';
import { DASHBOARD_HTML } from './dashboardHtml.js';

const app = new Hono();

app.use('*', cors());

void initRealtimeMarketEngine();

const handleRoot = (c: any) => c.html(DASHBOARD_HTML);

app.get('/', handleRoot);
app.get('/api', handleRoot);

const handleSignal = async (c: any) => {
  const rawTf = (c.req.query('tf') || '15m').toLowerCase();
  const tf: SupportedTimeframe = ALL_TIMEFRAMES.includes(rawTf as SupportedTimeframe)
    ? (rawTf as SupportedTimeframe)
    : '15m';

  const { candles, source, spotQuote } = await getGoldCandles(tf);
  const analysis = analyzeGoldCandles(candles, tf, source);

  return c.json({
    ...analysis,
    spotQuote,
  });
};

app.get('/api/signal', handleSignal);
app.get('/signal', handleSignal);

const handleMtf = async (c: any) => {
  const results = await Promise.all(
    ALL_TIMEFRAMES.map(async (tf) => {
      const { candles, source } = await getGoldCandles(tf);
      return { tf, analysis: analyzeGoldCandles(candles, tf, source) };
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
    const hist = (analysis.historicalSignals || [])
      .filter((s: any) => (s.probability || s.confidence) >= 85);

    const lc = analysis.tradeSetup?.entryTiming?.lifecycle;
    const entries: any[] = [];

    if (lc) {
      const isAct = Boolean(lc.isActivated);
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
        outcome: isAct ? 'ACTIVE' : 'WAIT_CONFIRMATION',
        pnlDollarsPerOz: lc.floatingDollarsPerOz || 0,
        isActivated: isAct,
        activationState: lc.activationState,
        statusBadge: lc.statusBadge,
        pnlStatusText: lc.pnlStatusText,
        distanceToEntryPips: lc.distanceToEntryPips || 0,
        reason: lc.summaryText || '4-Confluence Setup',
      });
    }

    for (const s of hist) {
      if (entries.length >= 6) break;
      // Skip duplicate if already represented by active live entry
      if (s.outcome === 'ACTIVE' && entries.some((e) => e.isLiveCurrent && e.isActivated)) {
        continue;
      }
      entries.push(s);
    }

    highConfidenceByTf[tf] = entries.slice(0, 5);
  }

  return c.json({
    symbol: 'XAU/USD',
    spotQuote: getLatestSpotQuote(),
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
  return streamSSE(c, async (stream) => {
    let closed = false;
    stream.onAbort(() => {
      closed = true;
    });

    await stream.writeSSE({
      event: 'tick',
      data: JSON.stringify(getLatestSpotQuote()),
    });

    const unsubscribe = subscribeToTicks((quote) => {
      if (!closed) {
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

const handleHealth = (c: any) =>
  c.json({ status: 'ok', service: 'xauusd-4-confluence-master-strategy', spotQuote: getLatestSpotQuote() });

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
      console.log(`✨ XAU/USD 4-Confluence Master Strategy Terminal running at http://localhost:${info.port}`);
    }
  );
}

export default app;
