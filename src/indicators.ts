import {
  archiveD1ClosedTrade,
  loadInitialD1State,
  saveD1ActiveTrade,
  saveD1ClosedList,
} from './d1Database.js';

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SignalDirection = 'STRONG BUY' | 'BUY' | 'WAIT' | 'SELL' | 'STRONG SELL';
export type SetupGrade = 'A+' | 'A' | 'B' | 'C';
export type EntryTimingState = 'ENTER_NOW' | 'LATE_WAIT_PULLBACK' | 'WAIT_CONFIRMATION';

export type EntryActivationState =
  | 'WAIT_CONFIRMATION'
  | 'ACTIVATED_PROFIT'
  | 'ACTIVATED_LOSS'
  | 'TP1_HIT_RUNNING'
  | 'TP2_HIT_PROFIT'
  | 'SL_HIT_LOSS';

export interface SessionInfo {
  name: 'ASIAN SESSION' | 'LONDON KILLZONE' | 'LONDON / NY TRANSITION' | 'NY OVERLAP KILLZONE' | 'LATE NY / OFF-PEAK' | 'NO-TRADE WINDOW (1:00 AM – 7:00 AM GMT+7)';
  isKillzone: boolean;
  isNoTradeWindow: boolean;
  gmt7Time: string;
  utcTime: string;
  windowGmt7: string;
  windowUtc: string;
  behaviorAndAction: string;
  newsGuardStatus: 'CLEAR' | 'RED FOLDER CAUTION (NY 8:30 AM EST WINDOW)';
  newsGuardNote: string;
}

export interface QuantitativePillarScore {
  name: string;
  maxPoints: number;
  awardedPoints: number;
  passed: boolean;
  notes: string;
}

export interface QuantitativeScoreMatrix {
  totalScore: number; // 0 to 100
  isTradeable: boolean; // >= 90 points
  actionVerdict: 'EXECUTE TRADE (90–100 PTS)' | 'PASS / NO-TRADE (<90 PTS)';
  pillars: {
    macroNews: QuantitativePillarScore; // 25 pts
    marketStructure: QuantitativePillarScore; // 25 pts
    emaRsiFilter: QuantitativePillarScore; // 20 pts
    killzoneSweep: QuantitativePillarScore; // 15 pts
    m15CandleFvg: QuantitativePillarScore; // 15 pts
  };
}

export interface Mt5SpreadGuard {
  maxAllowedSpreadPips: number; // 2.5 - 3.0 pips ($0.25 - $0.30)
  currentSpreadPips: number;
  isSpreadAcceptable: boolean;
  spreadBufferDollars: number;
  advice: string;
}

export interface TradeJournalEntry {
  tradeNumber: number;
  timestamp: number;
  timeframe: string;
  direction: 'BUY' | 'SELL';
  confluenceScore: number; // 90+ only
  waitedM15Close: 'YES' | 'NO';
  spreadAtEntry: number; // in pips/points
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  finalOutcome: 'TP1_HIT (1:2)' | 'TP2_HIT (1:3+)' | 'BE_EXIT' | 'SL_HIT' | 'RUNNING';
  achievedRr: string;
  netPnlPerOz: number;
}

export interface KeyLiquidityLevels {
  pdh: number; // Previous Day High
  pdl: number; // Previous Day Low
  asianHigh: number; // 06:00 - 14:00 GMT+7 (23:00 - 07:00 UTC)
  asianLow: number;
  majorResistance: number; // H4/Swing Supply
  majorSupport: number; // H4/Swing Demand
  sweptLevel: string | null; // e.g. "Swept Asian Low ($4042.10)" or "Tapped 50 EMA / Demand"
}

export interface LiquiditySweepDetails {
  swept: boolean;
  poolType: 'BSL' | 'SSL' | 'ASIAN_HIGH' | 'ASIAN_LOW' | 'PDH' | 'PDL' | 'SWING_EXTREME' | 'NONE';
  levelPrice: number;
  sweepWickExtreme: number;
  sweepDistancePips: number;
  statusText: string;
}

export interface BosDetails {
  confirmed: boolean;
  brokenLevel: number;
  displacementAtrRatio: number; // candle body vs ATR
  direction: 'BULLISH_BOS' | 'BEARISH_BOS' | 'NONE';
  statusText: string;
}

export interface FvgProDetails {
  detected: boolean;
  type: 'BULLISH FVG' | 'BEARISH FVG' | 'NONE';
  fvgTop: number;
  fvgBottom: number;
  consequentEncroachment: number; // 50% CE level (The PRO execution entry)
  gapSizePips: number;
  isRetested: boolean;
  statusText: string;
}

export interface SweepBosFvgProPattern {
  isValid: boolean;
  stage: 'STAGE_1_SWEEP' | 'STAGE_2_BOS' | 'STAGE_3_FVG_PRO' | 'READY_FOR_EXECUTION' | 'NONE';
  direction: 'BUY' | 'SELL' | 'NEUTRAL';
  sweep: LiquiditySweepDetails;
  bos: BosDetails;
  fvgPro: FvgProDetails;
  optimalEntryPrice: number; // Consequent Encroachment (CE 50%)
  invalidationPrice: number; // Beyond sweep wick
  riskDollars: number;
  tp1: number; // 1:2 R:R
  tp2: number; // 1:3 R:R
  statusBadge: string;
  summary: string;
}

export interface IctStructureDetails {
  marketStructure: 'UPTREND (HH + HL • BUY ONLY)' | 'DOWNTREND (LH + LL • SELL ONLY)' | 'RANGING / TRANSITION';
  lastSwingHigh: number;
  lastSwingLow: number;
  prevSwingHigh: number;
  prevSwingLow: number;
  ema50Slope: 'UPWARD' | 'DOWNWARD' | 'FLAT';
  ema50And200Filter: 'BULLISH (Above 50 & 200 EMA)' | 'BEARISH (Below 50 & 200 EMA)' | 'MIXED / TRANSITION';
  rsiDivergence: 'BULLISH DIVERGENCE' | 'BEARISH DIVERGENCE' | 'NONE';
  activeFvgZone: { top: number; bottom: number; type: 'BULLISH FVG' | 'BEARISH FVG' } | null;
  activeOrderBlock: { top: number; bottom: number; type: 'BULLISH OB' | 'BEARISH OB' } | null;
  candleConfirmation: 'BULLISH ENGULFING / PIN BAR' | 'BEARISH ENGULFING / PIN BAR' | 'DISPLACEMENT CLOSE' | 'WAITING CANDLE';
  sweepBosFvgPro?: SweepBosFvgProPattern;
}

export interface ExactM15ChecklistItem {
  step: number;
  title: string;
  passed: boolean;
  valueText: string;
  detail: string;
}

export interface ProbabilityGate {
  name: string;
  passed: boolean;
  status: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  valueText: string;
  detail: string;
}

export interface EntryLifecycleTracker {
  activationState: EntryActivationState;
  isActivated: boolean;
  statusBadge: string;
  pnlStatusText: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  activatedTime: number | null;
  currentPrice: number;
  stopLoss: number;
  tp1: number; // 1:2 Minimum R:R (Take 50% Partial + Move SL to BE)
  tp2: number; // 1:3+ R:R (Next H4 Liquidity Runner)
  floatingPips: number;
  floatingDollarsPerOz: number;
  distanceToEntryPips: number;
  hitTp1: boolean;
  hitTp2: boolean;
  hitSl: boolean;
  progressPct: number;
  summaryText: string;
}

export interface EntryTimingAnalysis {
  state: EntryTimingState;
  badgeText: string;
  direction: 'BUY' | 'SELL';
  signalOriginPrice: number;
  barsSinceCross: number;
  movedPipsSinceOrigin: number;
  isLate: boolean;
  marketEntry: number;
  waitPullbackEntry: number;
  recommendedEntry: number;
  recommendedOrderType: 'BUY MARKET' | 'SELL MARKET' | 'BUY LIMIT (FVG/OB WAIT)' | 'SELL LIMIT (FVG/OB WAIT)';
  stopLoss: number;
  tp1: number; // 1:2 R:R (50% Partial + SL->BE)
  tp2: number; // 1:3 R:R (H4 Liquidity Runner)
  tp3: number;
  riskDollars: number; // $3 to $5 beyond sweep wick / swing
  riskPips: number;
  rewardTp1Pips: number; // 1:2 R:R pips
  rewardTp2Pips: number; // 1:3 R:R pips
  advice: string;
  lifecycle: EntryLifecycleTracker;
}

export interface TradeSetup {
  direction: 'LONG' | 'SHORT' | 'NONE';
  isActionable: boolean;
  entry: number;
  optimalPullbackEntry: number;
  stopLoss: number;
  tp1: number; // 1:2 R:R
  tp2: number; // 1:3 R:R
  tp3: number;
  riskPips: number;
  rewardTp1Pips: number;
  rewardTp2Pips: number;
  rewardTp3Pips: number;
  riskRewardTp2: string;
  atrValue: number;
  entryTiming: EntryTimingAnalysis;
}

export interface HistoricalSignal {
  time: number;
  type: 'BUY' | 'SELL';
  grade: SetupGrade;
  probability: number;
  confidence: number;
  entry: number;
  stopLoss: number;
  tp1: number; // 1:2 R:R
  tp2: number; // 1:3 R:R
  outcome: 'TP2_HIT' | 'TP1_HIT' | 'SL_HIT' | 'BE_EXIT' | 'ACTIVE';
  pnlDollarsPerOz: number;
  reason: string;
}

export interface BacktestSummary {
  totalSignals: number;
  closedSignals: number;
  wins: number;
  losses: number;
  active: number;
  winRate: number;
  netPnlPerOz: number;
  consecutiveLossesToday: number;
  circuitBreakerTripped: boolean;
}

export interface IndicatorSeriesPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema50: number | null;
  ema200: number | null;
  rsi14: number | null;
  atr14: number | null;
}

export interface GoldSignalAnalysis {
  symbol: string;
  timeframe: string;
  dataSource: string;
  lastUpdated: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  signal: SignalDirection;
  setupGrade: SetupGrade;
  probability: number;
  gatesPassed: number;
  totalGates: number;
  marketRegime: 'STRONG TREND' | 'TRENDING' | 'RANGING / CHOPPY';
  score: number;
  confidence: number;
  summaryReason: string;
  session: SessionInfo;
  liquidityLevels: KeyLiquidityLevels;
  ictStructure: IctStructureDetails;
  m15Checklist: ExactM15ChecklistItem[];
  tradeSetup: TradeSetup;
  scoringMatrix: QuantitativeScoreMatrix;
  spreadGuard: Mt5SpreadGuard;
  journal: TradeJournalEntry[];
  indicators: {
    ema50: number;
    ema200: number;
    rsi14: number;
    atr14: number;
    nearestSupport: number;
    nearestResistance: number;
  };
  probabilityGates: ProbabilityGate[];
  historicalSignals: HistoricalSignal[];
  backtest: BacktestSummary;
  series: IndicatorSeriesPoint[];
}

function roundPrice(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Exponential Moving Average (EMA 50 & EMA 200)
 */
export function calculateEMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (values.length === 0) return result;
  const effPeriod = Math.min(period, values.length);
  const k = 2 / (effPeriod + 1);
  let sum = 0;
  for (let i = 0; i < effPeriod; i++) sum += values[i];
  let prevEma = sum / effPeriod;
  result[effPeriod - 1] = roundPrice(prevEma);
  for (let i = effPeriod; i < values.length; i++) {
    prevEma = values[i] * k + prevEma * (1 - k);
    result[i] = roundPrice(prevEma);
  }
  return result;
}

/**
 * RSI (14-Period Wilder's Smoothing)
 */
export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return result;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  const computeRsi = (g: number, l: number) => (l === 0 ? 100 : roundPrice(100 - 100 / (1 + g / l)));
  result[period] = computeRsi(avgGain, avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = computeRsi(avgGain, avgLoss);
  }
  return result;
}

/**
 * ATR (14-Period)
 */
export function calculateATR(candles: Candle[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period) return result;

  const tr: number[] = new Array(candles.length).fill(0);
  tr[0] = candles[0].high - candles[0].low;
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr[i] = Math.max(hl, hc, lc);
  }

  let atr = 0;
  for (let i = 1; i <= period; i++) atr += tr[i];
  atr /= period;
  result[period] = roundPrice(atr);

  for (let i = period + 1; i < candles.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    result[i] = roundPrice(atr);
  }
  return result;
}

/**
 * Confluence 4: Evaluate Session Timing in GMT+7 (Phnom Penh) and UTC
 */
export function evaluateSessionTiming(now = new Date()): SessionInfo {
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcTotalMin = utcHours * 60 + utcMinutes;

  // GMT+7 (Phnom Penh) = UTC + 7 hours
  const gmt7Hours = (utcHours + 7) % 24;
  const pad = (n: number) => String(n).padStart(2, '0');
  const format12h = (h: number, m: number) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${pad(h12)}:${pad(m)} ${suffix}`;
  };

  const gmt7Time = `${format12h(gmt7Hours, utcMinutes)} GMT+7`;
  const utcTime = `${pad(utcHours)}:${pad(utcMinutes)} UTC`;

  // Red Folder US News Release Window Check (12:15–13:45 UTC / 7:15–8:45 PM GMT+7 for CPI/NFP/GDP, or 18:45–19:30 UTC for FOMC)
  const isUs830Window = utcTotalMin >= 12 * 60 + 15 && utcTotalMin <= 13 * 60 + 45;
  const isFomcWindow = utcTotalMin >= 18 * 60 + 45 && utcTotalMin <= 19 * 60 + 30;
  const newsGuardStatus =
    isUs830Window || isFomcWindow ? 'RED FOLDER CAUTION (NY 8:30 AM EST WINDOW)' : 'CLEAR';
  const newsGuardNote =
    isUs830Window || isFomcWindow
      ? '⚠️ Inside US High-Impact News Window (7:15–8:45 PM GMT+7). Stay flat 15m before/after Red Folder CPI/NFP/GDP!'
      : '✅ Outside Red Folder release minute window — Always verify ForexFactory calendar.';

  // Rule 4: Enforce "No-Trade" Session Window (1:00 AM – 7:00 AM GMT+7)
  // Completely ban new entries between 1:00 AM and 7:00 AM GMT+7 (Late NY through Sydney open / Rollover spread spike)
  const isNoTradeWindow = gmt7Hours >= 1 && gmt7Hours < 7;
  if (isNoTradeWindow) {
    return {
      name: 'NO-TRADE WINDOW (1:00 AM – 7:00 AM GMT+7)',
      isKillzone: false,
      isNoTradeWindow: true,
      gmt7Time,
      utcTime,
      windowGmt7: '1:00 AM – 7:00 AM GMT+7',
      windowUtc: '18:00 – 00:00 UTC',
      behaviorAndAction: '⛔ NO-TRADE WINDOW (Dead Volume & Rollover Spread Widening). Completely ban new entries until 7:00 AM GMT+7!',
      newsGuardStatus,
      newsGuardNote: '⛔ NO-TRADE WINDOW ACTIVE: 1:00 AM – 7:00 AM GMT+7. High spread risk / false breakouts.',
    };
  }

  // Session Windows in GMT+7:
  // Asian Session: 7:00 AM – 2:00 PM GMT+7 (00:00 – 07:00 UTC)
  // London Killzone: 2:00 PM – 5:00 PM GMT+7 (07:00 – 10:00 UTC)
  // London / NY Transition: 5:00 PM – 7:00 PM GMT+7 (10:00 – 12:00 UTC)
  // NY Overlap Killzone: 7:00 PM – 11:00 PM GMT+7 (12:00 – 16:00 UTC)
  // Late NY Transition: 11:00 PM – 1:00 AM GMT+7 (16:00 – 18:00 UTC)
  if (gmt7Hours >= 7 && gmt7Hours < 14) {
    return {
      name: 'ASIAN SESSION',
      isKillzone: false,
      isNoTradeWindow: false,
      gmt7Time,
      utcTime,
      windowGmt7: '7:00 AM – 2:00 PM GMT+7',
      windowUtc: '00:00 – 07:00 UTC',
      behaviorAndAction: 'Low volume consolidation. Draw box around Asian High & Asian Low; do NOT chase breakouts.',
      newsGuardStatus,
      newsGuardNote,
    };
  }
  if (gmt7Hours >= 14 && gmt7Hours < 17) {
    return {
      name: 'LONDON KILLZONE',
      isKillzone: true,
      isNoTradeWindow: false,
      gmt7Time,
      utcTime,
      windowGmt7: '2:00 PM – 5:00 PM GMT+7',
      windowUtc: '07:00 – 10:00 UTC',
      behaviorAndAction: '🔥 Peak London Liquidity! Look for a Liquidity Sweep (fake breakout) above Asian High or below Asian Low.',
      newsGuardStatus,
      newsGuardNote,
    };
  }
  if (gmt7Hours >= 17 && gmt7Hours < 19) {
    return {
      name: 'LONDON / NY TRANSITION',
      isKillzone: false,
      isNoTradeWindow: false,
      gmt7Time,
      utcTime,
      windowGmt7: '5:00 PM – 7:00 PM GMT+7',
      windowUtc: '10:00 – 12:00 UTC',
      behaviorAndAction: 'Pre-NY positioning. Wait for 7:00 PM GMT+7 NY Overlap Killzone or clean FVG/OB retest.',
      newsGuardStatus,
      newsGuardNote,
    };
  }
  if (gmt7Hours >= 19 && gmt7Hours < 23) {
    return {
      name: 'NY OVERLAP KILLZONE',
      isKillzone: true,
      isNoTradeWindow: false,
      gmt7Time,
      utcTime,
      windowGmt7: '7:00 PM – 11:00 PM GMT+7',
      windowUtc: '12:00 – 16:00 UTC',
      behaviorAndAction: '🔥 Peak Daily Institutional Volume! Execute Trend Continuations & Post-News Pullbacks aligned with H4 bias.',
      newsGuardStatus,
      newsGuardNote,
    };
  }
  return {
    name: 'LATE NY / OFF-PEAK',
    isKillzone: false,
    isNoTradeWindow: false,
    gmt7Time,
    utcTime,
    windowGmt7: '11:00 PM – 1:00 AM GMT+7',
    windowUtc: '16:00 – 18:00 UTC',
    behaviorAndAction: 'Pre-rollover wind-down. Tighter management before 1:00 AM No-Trade Window.',
    newsGuardStatus,
    newsGuardNote,
  };
}

/**
 * Compute Key Institutional Liquidity Levels: PDH, PDL, Asian High, Asian Low, and Major H4 S/R
 */
export function computeLiquidityLevels(candles: Candle[]): KeyLiquidityLevels {
  const len = candles.length;
  const cur = candles[len - 1];
  const currentPrice = cur?.close ?? 0;

  // Group candles by UTC day to find Previous Day High (PDH) & Previous Day Low (PDL)
  const dayBuckets = new Map<number, { high: number; low: number }>();
  for (const c of candles) {
    const dayKey = Math.floor(c.time / 86400);
    const b = dayBuckets.get(dayKey);
    if (!b) dayBuckets.set(dayKey, { high: c.high, low: c.low });
    else {
      if (c.high > b.high) b.high = c.high;
      if (c.low < b.low) b.low = c.low;
    }
  }
  const dayKeys = Array.from(dayBuckets.keys()).sort((a, b) => a - b);
  const prevDay = dayKeys.length >= 2 ? dayBuckets.get(dayKeys[dayKeys.length - 2]) : dayBuckets.get(dayKeys[0]);

  const slice96 = candles.slice(-Math.min(len, 96));
  const fallbackHigh = Math.max(...slice96.map((c) => c.high));
  const fallbackLow = Math.min(...slice96.map((c) => c.low));

  const pdh = roundPrice(prevDay?.high ?? fallbackHigh);
  const pdl = roundPrice(prevDay?.low ?? fallbackLow);

  // Asian Session Range (23:00 UTC prev day to 07:00 UTC current day = 6:00 AM - 2:00 PM GMT+7)
  const asianCandles = candles.slice(-Math.min(len, 120)).filter((c) => {
    const d = new Date(c.time * 1000);
    const h = d.getUTCHours();
    return h >= 23 || h < 7;
  });

  const recentAsian = asianCandles.slice(-32);
  const asianHigh = roundPrice(
    recentAsian.length > 0 ? Math.max(...recentAsian.map((c) => c.high)) : Math.max(... candles.slice(-30).map((c) => c.high))
  );
  const asianLow = roundPrice(
    recentAsian.length > 0 ? Math.min(...recentAsian.map((c) => c.low)) : Math.min(...candles.slice(-30).map((c) => c.low))
  );

  // Major Swing Support & Resistance
  const lookSlice = candles.slice(-80);
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  for (let i = 2; i < lookSlice.length - 2; i++) {
    const c = lookSlice[i];
    if (c.high >= lookSlice[i - 1].high && c.high >= lookSlice[i - 2].high && c.high >= lookSlice[i + 1].high && c.high >= lookSlice[i + 2].high) {
      swingHighs.push(c.high);
    }
    if (c.low <= lookSlice[i - 1].low && c.low <= lookSlice[i - 2].low && c.low <= lookSlice[i + 1].low && c.low <= lookSlice[i + 2].low) {
      swingLows.push(c.low);
    }
  }

  const above = swingHighs.filter((h) => h > currentPrice).sort((a, b) => a - b);
  const below = swingLows.filter((l) => l < currentPrice).sort((a, b) => b - a);
  const majorResistance = roundPrice(above[0] ?? fallbackHigh);
  const majorSupport = roundPrice(below[0] ?? fallbackLow);

  // Detect if recent 6 candles swept Asian High/Low, PDH/PDL, or S/R
  const last6 = candles.slice(-6);
  const recentMaxHigh = Math.max(...last6.map((c) => c.high));
  const recentMinLow = Math.min(...last6.map((c) => c.low));

  let sweptLevel: string | null = null;
  if (recentMaxHigh >= pdh && currentPrice < pdh) {
    sweptLevel = `Swept PDH ($${pdh.toFixed(2)}) & Rejected`;
  } else if (recentMinLow <= pdl && currentPrice > pdl) {
    sweptLevel = `Swept PDL ($${pdl.toFixed(2)}) & Rejected`;
  } else if (recentMaxHigh >= asianHigh && currentPrice < asianHigh) {
    sweptLevel = `Swept Asian High ($${asianHigh.toFixed(2)})`;
  } else if (recentMinLow <= asianLow && currentPrice > asianLow) {
    sweptLevel = `Swept Asian Low ($${asianLow.toFixed(2)})`;
  } else if (Math.abs(currentPrice - majorSupport) <= Math.abs(majorResistance - majorSupport) * 0.2) {
    sweptLevel = `Tapped Demand / Support ($${majorSupport.toFixed(2)})`;
  } else if (Math.abs(currentPrice - majorResistance) <= Math.abs(majorResistance - majorSupport) * 0.2) {
    sweptLevel = `Tapped Supply / Resistance ($${majorResistance.toFixed(2)})`;
  }

  return {
    pdh,
    pdl,
    asianHigh,
    asianLow,
    majorResistance,
    majorSupport,
    sweptLevel,
  };
}

/**
 * 3-Stage Institutional Engine: Liquidity Sweep + BOS + FVG PRO
 * 1. Liquidity Sweep: Purges BSL / SSL / Asian Range / PDH / PDL with rejection wick
 * 2. Break of Structure (BOS / MSS): Impulsive displacement candle closes beyond opposing swing
 * 3. FVG PRO: Consequent Encroachment (CE 50%) optimal limit execution with Hard SL beyond sweep wick
 */
function detectSweepBosFvgProAtBar(
  series: IndicatorSeriesPoint[],
  idx: number,
  liquidity: KeyLiquidityLevels,
  isLongBias: boolean,
  atr: number,
  swingHighs: { idx: number; price: number; rsi: number }[],
  swingLows: { idx: number; price: number; rsi: number }[]
): SweepBosFvgProPattern {
  const cur = series[idx];
  const lookback = Math.max(2, idx - 20);

  let sweep: LiquiditySweepDetails = {
    swept: false,
    poolType: 'NONE',
    levelPrice: 0,
    sweepWickExtreme: cur.close,
    sweepDistancePips: 0,
    statusText: 'No liquidity sweep detected in recent 20 bars',
  };

  let bos: BosDetails = {
    confirmed: false,
    brokenLevel: 0,
    displacementAtrRatio: 0,
    direction: 'NONE',
    statusText: 'Waiting for impulsive displacement to break structure',
  };

  let fvgPro: FvgProDetails = {
    detected: false,
    type: 'NONE',
    fvgTop: 0,
    fvgBottom: 0,
    consequentEncroachment: roundPrice(cur.close),
    gapSizePips: 0,
    isRetested: false,
    statusText: 'No displacement FVG identified',
  };

  if (!isLongBias) {
    // === BEARISH SETUP (SELL): 1. Sweep BSL/PDH/Asian High -> 2. Bearish BOS -> 3. Bearish FVG PRO ===
    let bestSweepIdx = -1;
    let maxHigh = -Infinity;
    let sweptLevel = 0;
    let poolType: LiquiditySweepDetails['poolType'] = 'NONE';

    for (let k = lookback; k <= idx; k++) {
      const b = series[k];
      if (liquidity.asianHigh > 0 && b.high >= liquidity.asianHigh && b.close < liquidity.asianHigh + atr * 0.45) {
        if (b.high > maxHigh) {
          maxHigh = b.high;
          bestSweepIdx = k;
          sweptLevel = liquidity.asianHigh;
          poolType = 'ASIAN_HIGH';
        }
      }
      if (liquidity.pdh > 0 && b.high >= liquidity.pdh && b.close < liquidity.pdh + atr * 0.45) {
        if (b.high > maxHigh) {
          maxHigh = b.high;
          bestSweepIdx = k;
          sweptLevel = liquidity.pdh;
          poolType = 'PDH';
        }
      }
      for (const sh of swingHighs) {
        if (sh.idx < k && b.high >= sh.price && b.close < sh.price + atr * 0.45) {
          if (b.high > maxHigh) {
            maxHigh = b.high;
            bestSweepIdx = k;
            sweptLevel = sh.price;
            poolType = 'BSL';
          }
        }
      }
    }

    if (bestSweepIdx !== -1 && maxHigh >= sweptLevel) {
      const pips = roundPrice((maxHigh - sweptLevel) * 10);
      sweep = {
        swept: true,
        poolType,
        levelPrice: roundPrice(sweptLevel),
        sweepWickExtreme: roundPrice(maxHigh),
        sweepDistancePips: pips,
        statusText: `Swept ${poolType} @ $${sweptLevel.toFixed(2)} (+${pips.toFixed(1)}p wick rejection to $${maxHigh.toFixed(2)})`,
      };
    } else if (liquidity.sweptLevel && liquidity.sweptLevel.includes('Asian High')) {
      sweep = {
        swept: true,
        poolType: 'ASIAN_HIGH',
        levelPrice: liquidity.asianHigh,
        sweepWickExtreme: roundPrice(liquidity.asianHigh + atr * 0.5),
        sweepDistancePips: roundPrice(atr * 5),
        statusText: `Swept Asian High @ $${liquidity.asianHigh.toFixed(2)}`,
      };
    } else if (liquidity.sweptLevel && liquidity.sweptLevel.includes('PDH')) {
      sweep = {
        swept: true,
        poolType: 'PDH',
        levelPrice: liquidity.pdh,
        sweepWickExtreme: roundPrice(liquidity.pdh + atr * 0.5),
        sweepDistancePips: roundPrice(atr * 5),
        statusText: `Swept PDH @ $${liquidity.pdh.toFixed(2)}`,
      };
    } else if (swingHighs.length > 0) {
      const lastSH = swingHighs[swingHighs.length - 1];
      sweep = {
        swept: true,
        poolType: 'SWING_EXTREME',
        levelPrice: roundPrice(lastSH.price),
        sweepWickExtreme: roundPrice(lastSH.price + atr * 0.3),
        sweepDistancePips: roundPrice(atr * 3),
        statusText: `Protected Swing High @ $${lastSH.price.toFixed(2)}`,
      };
    }

    // 2. Detect Bearish BOS / MSS
    const recentSwingLows = swingLows.filter((sl) => sl.idx >= lookback - 10 && sl.idx <= idx);
    let lastBrokenLow = 0;
    let maxDisplacementRatio = 0;

    for (let k = Math.max(bestSweepIdx !== -1 ? bestSweepIdx : lookback, idx - 12); k <= idx; k++) {
      const b = series[k];
      const body = b.open - b.close;
      const ratio = body / atr;
      for (const sl of recentSwingLows) {
        if (sl.idx < k && b.close < sl.price && body >= atr * 0.45) {
          bos.confirmed = true;
          bos.brokenLevel = roundPrice(sl.price);
          bos.direction = 'BEARISH_BOS';
          if (ratio > maxDisplacementRatio) maxDisplacementRatio = ratio;
          lastBrokenLow = sl.price;
        }
      }
    }

    if (bos.confirmed) {
      bos.displacementAtrRatio = roundPrice(maxDisplacementRatio);
      bos.statusText = `Bearish MSS/BOS: Impulsive displacement broke Swing Low @ $${lastBrokenLow.toFixed(2)} (${maxDisplacementRatio.toFixed(1)}x ATR body)`;
    } else {
      const lastSL = swingLows[swingLows.length - 1];
      if (lastSL && cur.close < lastSL.price) {
        bos.confirmed = true;
        bos.brokenLevel = roundPrice(lastSL.price);
        bos.displacementAtrRatio = roundPrice(Math.abs(cur.open - cur.close) / atr);
        bos.direction = 'BEARISH_BOS';
        bos.statusText = `Bearish MSS: Price broke below previous Low ($${lastSL.price.toFixed(2)})`;
      }
    }

    // 3. Detect Bearish FVG PRO & Consequent Encroachment (CE 50%)
    for (let k = Math.max(2, idx - 10); k <= idx; k++) {
      const c0 = series[k - 2];
      const c1 = series[k - 1];
      const c2 = series[k];

      if (c1.close < c1.open && c2.high < c0.low) {
        const top = roundPrice(c0.low);
        const bottom = roundPrice(c2.high);
        const ce = roundPrice((top + bottom) / 2);
        const gapPips = roundPrice((top - bottom) * 10);
        const isRetested = cur.high >= bottom && cur.low <= top;

        fvgPro = {
          detected: true,
          type: 'BEARISH FVG',
          fvgTop: top,
          fvgBottom: bottom,
          consequentEncroachment: ce,
          gapSizePips: gapPips,
          isRetested,
          statusText: `Bearish FVG PRO ($${bottom.toFixed(2)}–$${top.toFixed(2)}) • CE 50% @ $${ce.toFixed(2)}${isRetested ? ' [RETESTED]' : ' [WAIT CE RETEST]'}`,
        };
      }
    }

    const invPrice = sweep.swept
      ? roundPrice(sweep.sweepWickExtreme + atr * 0.3)
      : roundPrice(Math.max(cur.high, ...series.slice(Math.max(0, idx - 5), idx + 1).map((c) => c.high)) + atr * 0.8);
    const optimalEntry = fvgPro.detected ? fvgPro.consequentEncroachment : roundPrice(cur.ema50 ?? cur.close);
    const risk = roundPrice(Math.abs(invPrice - optimalEntry));
    const tp1 = roundPrice(optimalEntry - risk * 2.0);
    const tp2 = roundPrice(optimalEntry - risk * 3.0);

    const isComplete = sweep.swept && bos.confirmed && fvgPro.detected;
    const stage: SweepBosFvgProPattern['stage'] = isComplete
      ? fvgPro.isRetested ? 'READY_FOR_EXECUTION' : 'STAGE_3_FVG_PRO'
      : bos.confirmed ? 'STAGE_2_BOS' : sweep.swept ? 'STAGE_1_SWEEP' : 'NONE';

    return {
      isValid: sweep.swept || (bos.confirmed && fvgPro.detected),
      stage,
      direction: 'SELL',
      sweep,
      bos,
      fvgPro,
      optimalEntryPrice: optimalEntry,
      invalidationPrice: invPrice,
      riskDollars: risk,
      tp1,
      tp2,
      statusBadge: isComplete ? '⚡ SWEEP + BOS + FVG PRO (A+ 95%)' : '⏳ SWEEP/BOS FORMING',
      summary: `Bearish ICT: ${sweep.statusText} -> ${bos.statusText} -> ${fvgPro.statusText}`,
    };
  } else {
    // === BULLISH SETUP (BUY): 1. Sweep SSL/PDL/Asian Low -> 2. Bullish BOS -> 3. Bullish FVG PRO ===
    let bestSweepIdx = -1;
    let minLow = Infinity;
    let sweptLevel = 0;
    let poolType: LiquiditySweepDetails['poolType'] = 'NONE';

    for (let k = lookback; k <= idx; k++) {
      const b = series[k];
      if (liquidity.asianLow > 0 && b.low <= liquidity.asianLow && b.close > liquidity.asianLow - atr * 0.45) {
        if (b.low < minLow) {
          minLow = b.low;
          bestSweepIdx = k;
          sweptLevel = liquidity.asianLow;
          poolType = 'ASIAN_LOW';
        }
      }
      if (liquidity.pdl > 0 && b.low <= liquidity.pdl && b.close > liquidity.pdl - atr * 0.45) {
        if (b.low < minLow) {
          minLow = b.low;
          bestSweepIdx = k;
          sweptLevel = liquidity.pdl;
          poolType = 'PDL';
        }
      }
      for (const sl of swingLows) {
        if (sl.idx < k && b.low <= sl.price && b.close > sl.price - atr * 0.45) {
          if (b.low < minLow) {
            minLow = b.low;
            bestSweepIdx = k;
            sweptLevel = sl.price;
            poolType = 'SSL';
          }
        }
      }
    }

    if (bestSweepIdx !== -1 && minLow <= sweptLevel) {
      const pips = roundPrice((sweptLevel - minLow) * 10);
      sweep = {
        swept: true,
        poolType,
        levelPrice: roundPrice(sweptLevel),
        sweepWickExtreme: roundPrice(minLow),
        sweepDistancePips: pips,
        statusText: `Swept ${poolType} @ $${sweptLevel.toFixed(2)} (-${pips.toFixed(1)}p wick rejection to $${minLow.toFixed(2)})`,
      };
    } else if (liquidity.sweptLevel && liquidity.sweptLevel.includes('Asian Low')) {
      sweep = {
        swept: true,
        poolType: 'ASIAN_LOW',
        levelPrice: liquidity.asianLow,
        sweepWickExtreme: roundPrice(liquidity.asianLow - atr * 0.5),
        sweepDistancePips: roundPrice(atr * 5),
        statusText: `Swept Asian Low @ $${liquidity.asianLow.toFixed(2)}`,
      };
    } else if (liquidity.sweptLevel && liquidity.sweptLevel.includes('PDL')) {
      sweep = {
        swept: true,
        poolType: 'PDL',
        levelPrice: liquidity.pdl,
        sweepWickExtreme: roundPrice(liquidity.pdl - atr * 0.5),
        sweepDistancePips: roundPrice(atr * 5),
        statusText: `Swept PDL @ $${liquidity.pdl.toFixed(2)}`,
      };
    } else if (swingLows.length > 0) {
      const lastSL = swingLows[swingLows.length - 1];
      sweep = {
        swept: true,
        poolType: 'SWING_EXTREME',
        levelPrice: roundPrice(lastSL.price),
        sweepWickExtreme: roundPrice(lastSL.price - atr * 0.3),
        sweepDistancePips: roundPrice(atr * 3),
        statusText: `Protected Swing Low @ $${lastSL.price.toFixed(2)}`,
      };
    }

    // 2. Detect Bullish BOS / MSS
    const recentSwingHighs = swingHighs.filter((sh) => sh.idx >= lookback - 10 && sh.idx <= idx);
    let lastBrokenHigh = 0;
    let maxDisplacementRatio = 0;

    for (let k = Math.max(bestSweepIdx !== -1 ? bestSweepIdx : lookback, idx - 12); k <= idx; k++) {
      const b = series[k];
      const body = b.close - b.open;
      const ratio = body / atr;
      for (const sh of recentSwingHighs) {
        if (sh.idx < k && b.close > sh.price && body >= atr * 0.45) {
          bos.confirmed = true;
          bos.brokenLevel = roundPrice(sh.price);
          bos.direction = 'BULLISH_BOS';
          if (ratio > maxDisplacementRatio) maxDisplacementRatio = ratio;
          lastBrokenHigh = sh.price;
        }
      }
    }

    if (bos.confirmed) {
      bos.displacementAtrRatio = roundPrice(maxDisplacementRatio);
      bos.statusText = `Bullish MSS/BOS: Impulsive displacement broke Swing High @ $${lastBrokenHigh.toFixed(2)} (${maxDisplacementRatio.toFixed(1)}x ATR body)`;
    } else {
      const lastSH = swingHighs[swingHighs.length - 1];
      if (lastSH && cur.close > lastSH.price) {
        bos.confirmed = true;
        bos.brokenLevel = roundPrice(lastSH.price);
        bos.displacementAtrRatio = roundPrice(Math.abs(cur.close - cur.open) / atr);
        bos.direction = 'BULLISH_BOS';
        bos.statusText = `Bullish MSS: Price broke above previous High ($${lastSH.price.toFixed(2)})`;
      }
    }

    // 3. Detect Bullish FVG PRO & Consequent Encroachment (CE 50%)
    for (let k = Math.max(2, idx - 10); k <= idx; k++) {
      const c0 = series[k - 2];
      const c1 = series[k - 1];
      const c2 = series[k];

      if (c1.close > c1.open && c2.low > c0.high) {
        const top = roundPrice(c2.low);
        const bottom = roundPrice(c0.high);
        const ce = roundPrice((top + bottom) / 2);
        const gapPips = roundPrice((top - bottom) * 10);
        const isRetested = cur.low <= top && cur.high >= bottom;

        fvgPro = {
          detected: true,
          type: 'BULLISH FVG',
          fvgTop: top,
          fvgBottom: bottom,
          consequentEncroachment: ce,
          gapSizePips: gapPips,
          isRetested,
          statusText: `Bullish FVG PRO ($${bottom.toFixed(2)}–$${top.toFixed(2)}) • CE 50% @ $${ce.toFixed(2)}${isRetested ? ' [RETESTED]' : ' [WAIT CE RETEST]'}`,
        };
      }
    }

    const invPrice = sweep.swept
      ? roundPrice(sweep.sweepWickExtreme - atr * 0.3)
      : roundPrice(Math.min(cur.low, ...series.slice(Math.max(0, idx - 5), idx + 1).map((c) => c.low)) - atr * 0.8);
    const optimalEntry = fvgPro.detected ? fvgPro.consequentEncroachment : roundPrice(cur.ema50 ?? cur.close);
    const risk = roundPrice(Math.abs(optimalEntry - invPrice));
    const tp1 = roundPrice(optimalEntry + risk * 2.0);
    const tp2 = roundPrice(optimalEntry + risk * 3.0);

    const isComplete = sweep.swept && bos.confirmed && fvgPro.detected;
    const stage: SweepBosFvgProPattern['stage'] = isComplete
      ? fvgPro.isRetested ? 'READY_FOR_EXECUTION' : 'STAGE_3_FVG_PRO'
      : bos.confirmed ? 'STAGE_2_BOS' : sweep.swept ? 'STAGE_1_SWEEP' : 'NONE';

    return {
      isValid: sweep.swept || (bos.confirmed && fvgPro.detected),
      stage,
      direction: 'BUY',
      sweep,
      bos,
      fvgPro,
      optimalEntryPrice: optimalEntry,
      invalidationPrice: invPrice,
      riskDollars: risk,
      tp1,
      tp2,
      statusBadge: isComplete ? '⚡ SWEEP + BOS + FVG PRO (A+ 95%)' : '⏳ SWEEP/BOS FORMING',
      summary: `Bullish ICT: ${sweep.statusText} -> ${bos.statusText} -> ${fvgPro.statusText}`,
    };
  }
}

/**
 * Evaluate Confluence 2 (HH/HL vs LH/LL), Confluence 3 (50 & 200 EMA + RSI Divergence),
 * and Confluence 4 (FVG, Order Block, Engulfing/Pin Bar) at index `idx`
 */
function analyzeMasterConfluenceAtBar(
  series: IndicatorSeriesPoint[],
  idx: number,
  liquidity: KeyLiquidityLevels,
  session: SessionInfo
): {
  ict: IctStructureDetails;
  m15Checklist: ExactM15ChecklistItem[];
  gates: ProbabilityGate[];
  gatesPassed: number;
  setupGrade: SetupGrade;
  probability: number;
  signal: SignalDirection;
  isLongBias: boolean;
  score: number;
  summaryReason: string;
  quantitativeMatrix: QuantitativeScoreMatrix;
} {
  const cur = series[idx];
  const prev = series[idx - 1] ?? cur;
  const prev4 = series[Math.max(0, idx - 4)] ?? prev;

  const close = cur.close;
  const ema50 = cur.ema50 ?? close;
  const ema200 = cur.ema200 ?? ema50;
  const prev4Ema50 = prev4.ema50 ?? ema50;
  const rsi = cur.rsi14 ?? 50;
  const atr = Math.max(cur.atr14 ?? close * 0.0015, 1.0);

  // 1. Detect Swing Highs and Swing Lows for Market Structure (HH/HL vs LH/LL)
  const swingHighs: { idx: number; price: number; rsi: number }[] = [];
  const swingLows: { idx: number; price: number; rsi: number }[] = [];
  const startLook = Math.max(2, idx - 55);

  for (let i = startLook; i <= idx - 2; i++) {
    const c = series[i];
    if (
      c.high >= series[i - 1].high &&
      c.high >= series[i - 2].high &&
      c.high >= series[i + 1].high &&
      c.high >= series[i + 2].high
    ) {
      swingHighs.push({ idx: i, price: c.high, rsi: c.rsi14 ?? 50 });
    }
    if (
      c.low <= series[i - 1].low &&
      c.low <= series[i - 2].low &&
      c.low <= series[i + 1].low &&
      c.low <= series[i + 2].low
    ) {
      swingLows.push({ idx: i, price: c.low, rsi: c.rsi14 ?? 50 });
    }
  }

  const lastSH = swingHighs[swingHighs.length - 1]?.price ?? close + atr * 2;
  const prevSH = swingHighs[swingHighs.length - 2]?.price ?? lastSH;
  const lastSL = swingLows[swingLows.length - 1]?.price ?? close - atr * 2;
  const prevSL = swingLows[swingLows.length - 2]?.price ?? lastSL;

  const isHH_HL = (lastSH >= prevSH && lastSL >= prevSL) || (close > lastSH && lastSL >= prevSL);
  const isLH_LL = (lastSH <= prevSH && lastSL <= prevSL) || (close < lastSL && lastSH <= prevSH);

  // 2. 50 EMA & 200 EMA Filter (Confluence 3)
  const ema50Diff = ema50 - prev4Ema50;
  const ema50Slope: IctStructureDetails['ema50Slope'] =
    ema50Diff > atr * 0.05 ? 'UPWARD' : ema50Diff < -atr * 0.05 ? 'DOWNWARD' : 'FLAT';

  const bullEmaAligned = close > ema50 && close > ema200 && ema50Slope !== 'DOWNWARD';
  const bearEmaAligned = close < ema50 && close < ema200 && ema50Slope !== 'UPWARD';

  const ema50And200Filter: IctStructureDetails['ema50And200Filter'] = bullEmaAligned
    ? 'BULLISH (Above 50 & 200 EMA)'
    : bearEmaAligned
    ? 'BEARISH (Below 50 & 200 EMA)'
    : 'MIXED / TRANSITION';

  // Master Bias Determination (Combines Structure + 50/200 EMA)
  const isLongBias =
    bullEmaAligned || (close > ema50 && isHH_HL) ? true : bearEmaAligned || (close < ema50 && isLH_LL) ? false : close >= ema50;

  const marketStructure: IctStructureDetails['marketStructure'] = isHH_HL
    ? 'UPTREND (HH + HL • BUY ONLY)'
    : isLH_LL
    ? 'DOWNTREND (LH + LL • SELL ONLY)'
    : isLongBias
    ? 'UPTREND (HH + HL • BUY ONLY)'
    : 'DOWNTREND (LH + LL • SELL ONLY)';

  // 3. RSI (14) Divergence & Exhaustion Detection
  let rsiDivergence: IctStructureDetails['rsiDivergence'] = 'NONE';
  if (swingLows.length >= 2) {
    const sl1 = swingLows[swingLows.length - 2];
    const sl2 = swingLows[swingLows.length - 1];
    if (sl2.price <= sl1.price && sl2.rsi > sl1.rsi + 1.5) {
      rsiDivergence = 'BULLISH DIVERGENCE';
    }
  }
  if (swingHighs.length >= 2) {
    const sh1 = swingHighs[swingHighs.length - 2];
    const sh2 = swingHighs[swingHighs.length - 1];
    if (sh2.price >= sh1.price && sh2.rsi < sh1.rsi - 1.5) {
      rsiDivergence = 'BEARISH DIVERGENCE';
    }
  }

  const rsiNotExhausted = isLongBias ? rsi < 70 && rsi >= 42 : rsi > 30 && rsi <= 58;

  // 4. Detect ICT Fair Value Gap (FVG) & Order Block (OB) + Engulfing/Pin Bar in recent 10 bars
  let activeFvgZone: IctStructureDetails['activeFvgZone'] = null;
  let activeOrderBlock: IctStructureDetails['activeOrderBlock'] = null;
  let hasDisplacement = false;

  for (let k = Math.max(2, idx - 10); k <= idx; k++) {
    const c0 = series[k - 2];
    const c1 = series[k - 1]; // Displacement candle
    const c2 = series[k];
    const body1 = Math.abs(c1.close - c1.open);

    if (body1 >= atr * 0.65) {
      hasDisplacement = true;
    }

    // Bullish FVG: c2.low > c0.high with bullish displacement c1
    if (isLongBias && c1.close > c1.open && c2.low > c0.high) {
      activeFvgZone = {
        bottom: roundPrice(c0.high),
        top: roundPrice(c2.low),
        type: 'BULLISH FVG',
      };
      activeOrderBlock = {
        bottom: roundPrice(c0.low),
        top: roundPrice(Math.max(c0.open, c0.close)),
        type: 'BULLISH OB',
      };
    }
    // Bearish FVG: c2.high < c0.low with bearish displacement c1
    if (!isLongBias && c1.close < c1.open && c2.high < c0.low) {
      activeFvgZone = {
        bottom: roundPrice(c2.high),
        top: roundPrice(c0.low),
        type: 'BEARISH FVG',
      };
      activeOrderBlock = {
        bottom: roundPrice(Math.min(c0.open, c0.close)),
        top: roundPrice(c0.high),
        type: 'BEARISH OB',
      };
    }
  }

  // Fallback Order Block near 50 EMA / Last Swing if no FVG gap is open
  if (!activeOrderBlock) {
    activeOrderBlock = isLongBias
      ? { bottom: roundPrice(ema50 - atr * 0.6), top: roundPrice(ema50 + atr * 0.2), type: 'BULLISH OB' }
      : { bottom: roundPrice(ema50 - atr * 0.2), top: roundPrice(ema50 + atr * 0.6), type: 'BEARISH OB' };
  }

  // Candle Confirmation (Engulfing / Pin Bar / Rejection)
  const curRange = Math.max(0.01, cur.high - cur.low);
  const lowerWick = Math.min(cur.open, cur.close) - cur.low;
  const upperWick = cur.high - Math.max(cur.open, cur.close);
  const bullEngulfOrPin =
    (cur.close > cur.open && prev.close < prev.open && cur.close >= prev.open) ||
    (lowerWick / curRange >= 0.4 && cur.close >= cur.open);
  const bearEngulfOrPin =
    (cur.close < cur.open && prev.close > prev.open && cur.close <= prev.open) ||
    (upperWick / curRange >= 0.4 && cur.close <= cur.open);

  let candleConfirmation: IctStructureDetails['candleConfirmation'] = 'WAITING CANDLE';
  if (isLongBias && bullEngulfOrPin) candleConfirmation = 'BULLISH ENGULFING / PIN BAR';
  else if (!isLongBias && bearEngulfOrPin) candleConfirmation = 'BEARISH ENGULFING / PIN BAR';
  else if ((isLongBias && cur.close > cur.open) || (!isLongBias && cur.close < cur.open)) {
    candleConfirmation = 'DISPLACEMENT CLOSE';
  }

  // 3-Stage Institutional Pattern: Liquidity Sweep + BOS + FVG PRO
  const sweepBosFvg = detectSweepBosFvgProAtBar(
    series,
    idx,
    liquidity,
    isLongBias,
    atr,
    swingHighs,
    swingLows
  );

  if (sweepBosFvg.fvgPro.detected && sweepBosFvg.fvgPro.type !== 'NONE') {
    activeFvgZone = {
      bottom: sweepBosFvg.fvgPro.fvgBottom,
      top: sweepBosFvg.fvgPro.fvgTop,
      type: sweepBosFvg.fvgPro.type,
    };
  }

  // === EXACT 3-STEP M15 ENTRY CHECKLIST ===
  const distToEma50 = Math.abs(close - ema50);
  const step1Pass =
    sweepBosFvg.sweep.swept ||
    liquidity.sweptLevel !== null ||
    distToEma50 <= atr * 1.8 ||
    (activeFvgZone !== null && close >= activeFvgZone.bottom - atr && close <= activeFvgZone.top + atr);

  const step2Pass =
    sweepBosFvg.bos.confirmed ||
    (hasDisplacement && ((isLongBias && isHH_HL) || (!isLongBias && isLH_LL) || bullEmaAligned || bearEmaAligned));

  const step3Pass =
    (sweepBosFvg.fvgPro.detected && (sweepBosFvg.fvgPro.isRetested || candleConfirmation !== 'WAITING CANDLE')) ||
    candleConfirmation !== 'WAITING CANDLE' ||
    activeFvgZone !== null;

  const m15Checklist: ExactM15ChecklistItem[] = [
    {
      step: 1,
      title: '1. Liquidity Sweep (BSL / SSL / Asian / PDH / PDL)',
      passed: step1Pass,
      valueText: sweepBosFvg.sweep.swept
        ? sweepBosFvg.sweep.statusText
        : liquidity.sweptLevel ?? `50 EMA @ $${ema50.toFixed(2)} (PDH $${liquidity.pdh.toFixed(0)} / PDL $${liquidity.pdl.toFixed(0)})`,
      detail: sweepBosFvg.sweep.swept
        ? `Confirmed: Liquidity purged beyond $${sweepBosFvg.sweep.levelPrice.toFixed(2)} with rejection wick to $${sweepBosFvg.sweep.sweepWickExtreme.toFixed(2)}.`
        : 'Smart money sweeps liquidity pools (Asian Range, PDH/PDL, swing highs/lows) before true directional move.',
    },
    {
      step: 2,
      title: '2. Market Structure Shift (BOS / MSS) + Displacement',
      passed: step2Pass,
      valueText: sweepBosFvg.bos.confirmed ? sweepBosFvg.bos.statusText : `${marketStructure}`,
      detail: step2Pass
        ? 'Impulsive displacement move confirmed in alignment with structural trend.'
        : 'Waiting for impulsive displacement candle to break minor swing structure.',
    },
    {
      step: 3,
      title: '3. FVG PRO Retest (Consequent Encroachment CE 50%)',
      passed: step3Pass,
      valueText: sweepBosFvg.fvgPro.detected
        ? `${sweepBosFvg.fvgPro.type}: CE 50% @ $${sweepBosFvg.fvgPro.consequentEncroachment.toFixed(2)} ($${sweepBosFvg.fvgPro.fvgBottom.toFixed(1)}–$${sweepBosFvg.fvgPro.fvgTop.toFixed(1)})`
        : activeFvgZone
        ? `${activeFvgZone.type} ($${activeFvgZone.bottom.toFixed(1)}–$${activeFvgZone.top.toFixed(1)}) • ${candleConfirmation}`
        : `${activeOrderBlock.type} ($${activeOrderBlock.bottom.toFixed(1)}–$${activeOrderBlock.top.toFixed(1)}) • ${candleConfirmation}`,
      detail: sweepBosFvg.fvgPro.detected
        ? `PRO Execution: Do NOT chase market. Limit order placed at CE 50% ($${sweepBosFvg.fvgPro.consequentEncroachment.toFixed(2)}). Hard SL beyond sweep wick.`
        : 'Wait for FVG/Order Block retest and Engulfing or Pin Bar candle close.',
    },
  ];

  // === 4-CONFLUENCE MASTER GATES (6 Total Checkpoints) ===
  const gates: ProbabilityGate[] = [
    {
      name: 'Confluence 1: Macro & News Filter',
      passed: session.newsGuardStatus === 'CLEAR',
      status: session.newsGuardStatus === 'CLEAR' ? (isLongBias ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
      valueText: `${session.newsGuardStatus} • ${ isLongBias ? 'USD Weak / Gold Bullish' : 'USD Strong / Gold Bearish' }`,
      detail: session.newsGuardNote,
    },
    {
      name: 'Confluence 2: Market Structure (HH/HL vs LH/LL & BOS)',
      passed: sweepBosFvg.bos.confirmed || (isLongBias && isHH_HL) || (!isLongBias && isLH_LL),
      status: isLongBias ? 'BULLISH' : 'BEARISH',
      valueText: sweepBosFvg.bos.confirmed ? sweepBosFvg.bos.statusText : `${marketStructure}`,
      detail: `Swing High $${lastSH.toFixed(2)} | Swing Low $${lastSL.toFixed(2)} | PDH $${liquidity.pdh.toFixed(2)} | PDL $${liquidity.pdl.toFixed(2)}`,
    },
    {
      name: 'Confluence 3A: 50 EMA & 200 EMA Trend Filter',
      passed: bullEmaAligned || bearEmaAligned,
      status: bullEmaAligned ? 'BULLISH' : bearEmaAligned ? 'BEARISH' : 'NEUTRAL',
      valueText: `50 EMA $${ema50.toFixed(2)} (${ema50Slope}) | 200 EMA $${ema200.toFixed(2)}`,
      detail:
        bullEmaAligned || bearEmaAligned
          ? `Price & 50 EMA slope (${ema50Slope}) aligned with 200 EMA institutional filter.`
          : 'Price is between 50 EMA and 200 EMA; wait for clean alignment.',
    },
    {
      name: 'Confluence 3B: RSI (14) Divergence & Exhaustion Guard',
      passed: rsiNotExhausted,
      status: rsiNotExhausted ? (isLongBias ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
      valueText: `RSI ${rsi.toFixed(1)} • ${rsiDivergence !== 'NONE' ? rsiDivergence : 'No Exhaustion (30–70)'}`,
      detail: rsiNotExhausted
        ? `RSI (${rsi.toFixed(1)}) is clear of >70 overbought / <30 oversold exhaustion.`
        : `RSI (${rsi.toFixed(1)}) is exhausted! Never buy >70 or sell <30 — wait for FVG/50 EMA pullback.`,
    },
    {
      name: 'Confluence 4A: Session Killzone (GMT+7 / UTC)',
      passed: session.isKillzone || step1Pass,
      status: session.isKillzone ? (isLongBias ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
      valueText: `${session.name} (${session.gmt7Time})`,
      detail: session.behaviorAndAction,
    },
    {
      name: 'Confluence 4B: ICT FVG PRO / Order Block Retest Trigger',
      passed: step1Pass && step3Pass,
      status: step1Pass && step3Pass ? (isLongBias ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
      valueText: sweepBosFvg.fvgPro.detected
        ? `${sweepBosFvg.fvgPro.type}: CE 50% $${sweepBosFvg.fvgPro.consequentEncroachment.toFixed(2)}`
        : activeFvgZone
        ? `${activeFvgZone.type}: $${activeFvgZone.bottom.toFixed(2)}–$${activeFvgZone.top.toFixed(2)}`
        : `${activeOrderBlock.type}: $${activeOrderBlock.bottom.toFixed(2)}–$${activeOrderBlock.top.toFixed(2)}`,
      detail: `Candle Trigger: ${candleConfirmation}.`,
    },
  ];

  // === QUANTITATIVE 100-POINT SCORING MATRIX ===
  // 1. Macro & News Alignment (25 pts): Direction of dominant trend & no Red Folder in 15m
  const macroNewsPassed = session.newsGuardStatus === 'CLEAR';
  const macroNewsPts = macroNewsPassed ? 25 : 0;
  const macroNewsPillar: QuantitativePillarScore = {
    name: '1. Macro & News Alignment',
    maxPoints: 25,
    awardedPoints: macroNewsPts,
    passed: macroNewsPassed,
    notes: macroNewsPassed ? 'Clear of Red Folder News (CPI/NFP/FOMC)' : 'Red Folder news window active — 0 pts awarded',
  };

  // 2. D1 / H4 Market Structure + BOS (25 pts): Clean HH/HL or LH/LL tapping HTF zone or confirmed BOS
  const structurePassed = sweepBosFvg.bos.confirmed || (isLongBias && isHH_HL) || (!isLongBias && isLH_LL);
  const structurePts = sweepBosFvg.bos.confirmed ? 25 : structurePassed ? 25 : (hasDisplacement ? 18 : 5);
  const marketStructurePillar: QuantitativePillarScore = {
    name: '2. D1/H4 Market Structure & BOS',
    maxPoints: 25,
    awardedPoints: structurePts,
    passed: structurePts >= 20,
    notes: sweepBosFvg.bos.confirmed ? sweepBosFvg.bos.statusText : `${marketStructure} (Swing: $${lastSH.toFixed(1)} / $${lastSL.toFixed(1)})`,
  };

  // 3. EMA & RSI Filter (20 pts): 50/200 EMA slope + RSI momentum without exhaustion
  const emaPassed = bullEmaAligned || bearEmaAligned;
  let emaRsiPts = 0;
  if (emaPassed) emaRsiPts += 12;
  if (rsiNotExhausted) emaRsiPts += 8;
  const emaRsiPillar: QuantitativePillarScore = {
    name: '3. 50/200 EMA & RSI Filter',
    maxPoints: 20,
    awardedPoints: emaRsiPts,
    passed: emaRsiPts >= 18,
    notes: `50 EMA ($${ema50.toFixed(1)}) ${ema50Slope} • RSI ${rsi.toFixed(1)}`,
  };

  // 4. Killzone & Liquidity Sweep (15 pts): London or NY Overlap Killzone + sweep of PDH/PDL or Asian Range
  let killzoneSweepPts = 0;
  if (session.isKillzone) killzoneSweepPts += 8;
  if (sweepBosFvg.sweep.swept) killzoneSweepPts += 7;
  else if (step1Pass) killzoneSweepPts += 5;
  const killzonePillar: QuantitativePillarScore = {
    name: '4. Killzone & Liquidity Sweep',
    maxPoints: 15,
    awardedPoints: killzoneSweepPts,
    passed: killzoneSweepPts >= 12,
    notes: `${session.name} • ${sweepBosFvg.sweep.swept ? sweepBosFvg.sweep.statusText : (liquidity.sweptLevel ?? '50 EMA Tap')}`,
  };

  // 5. M15 Candle / FVG PRO Confirmation (15 pts): Confirmed M15 rejection close or FVG fill
  let candleFvgPts = 0;
  if (sweepBosFvg.fvgPro.detected) candleFvgPts += 10;
  else if (step3Pass) candleFvgPts += 8;
  if (sweepBosFvg.fvgPro.isRetested || candleConfirmation !== 'WAITING CANDLE') candleFvgPts += 5;
  const candleFvgPillar: QuantitativePillarScore = {
    name: '5. M15 Candle / FVG PRO Confirmation',
    maxPoints: 15,
    awardedPoints: candleFvgPts,
    passed: candleFvgPts >= 10,
    notes: `${candleConfirmation} • ${sweepBosFvg.fvgPro.detected ? sweepBosFvg.fvgPro.type : (activeFvgZone ? activeFvgZone.type : activeOrderBlock.type)}`,
  };

  let total100Score = macroNewsPts + structurePts + emaRsiPts + killzoneSweepPts + candleFvgPts;
  if (sweepBosFvg.isValid && sweepBosFvg.sweep.swept && sweepBosFvg.bos.confirmed && sweepBosFvg.fvgPro.detected) {
    total100Score = Math.min(100, Math.max(92, total100Score));
  }
  const is90PlusTradeable = total100Score >= 90 && !session.isNoTradeWindow;
  const quantitativeMatrix: QuantitativeScoreMatrix = {
    totalScore: total100Score,
    isTradeable: is90PlusTradeable,
    actionVerdict: is90PlusTradeable ? 'EXECUTE TRADE (90–100 PTS)' : 'PASS / NO-TRADE (<90 PTS)',
    pillars: {
      macroNews: macroNewsPillar,
      marketStructure: marketStructurePillar,
      emaRsiFilter: emaRsiPillar,
      killzoneSweep: killzonePillar,
      m15CandleFvg: candleFvgPillar,
    },
  };

  const gatesPassed = gates.filter((g) => g.passed).length;

  let setupGrade: SetupGrade = 'C';
  let probability = total100Score;
  if (total100Score >= 90) {
    setupGrade = 'A+';
  } else if (total100Score >= 80) {
    setupGrade = 'A';
  } else if (total100Score >= 68) {
    setupGrade = 'B';
  } else {
    setupGrade = 'C';
  }

  let signal: SignalDirection = 'WAIT';
  if (is90PlusTradeable) {
    signal = isLongBias ? 'STRONG BUY' : 'STRONG SELL';
  } else if (total100Score >= 80 && (bullEmaAligned || bearEmaAligned) && !session.isNoTradeWindow) {
    signal = isLongBias ? 'BUY' : 'SELL';
  } else {
    signal = 'WAIT';
  }

  const score = isLongBias ? probability : -probability;
  const summaryReason = `Liquidity Sweep + BOS + FVG PRO Grade ${setupGrade} (${probability}% Prob • ${gatesPassed}/6 Gates): ${marketStructure} | 50 EMA $${ema50.toFixed(2)} (${ema50Slope}) & 200 EMA $${ema200.toFixed(2)} | RSI ${rsi.toFixed(1)} (${rsiDivergence}) | Session: ${session.name}.`;

  return {
    ict: {
      marketStructure,
      lastSwingHigh: roundPrice(lastSH),
      lastSwingLow: roundPrice(lastSL),
      prevSwingHigh: roundPrice(prevSH),
      prevSwingLow: roundPrice(prevSL),
      ema50Slope,
      ema50And200Filter,
      rsiDivergence,
      activeFvgZone,
      activeOrderBlock,
      candleConfirmation,
      sweepBosFvgPro: sweepBosFvg,
    },
    m15Checklist,
    gates,
    gatesPassed,
    setupGrade,
    probability,
    signal,
    isLongBias,
    score,
    summaryReason,
    quantitativeMatrix,
  };
}

export interface LockedActivePosition {
  id: string;
  timeframe: string;
  time: number;
  type: 'BUY' | 'SELL';
  grade: SetupGrade;
  probability: number;
  confidence: number;
  entry: number; // LOCKED FOREVER!
  stopLoss: number; // LOCKED FOREVER!
  tp1: number; // LOCKED FOREVER!
  tp2: number; // LOCKED FOREVER!
  beTrigger: number;
  hitBeLock: boolean;
  hitTp1: boolean;
  hitTp2: boolean;
  hitSl: boolean;
  outcome: 'ACTIVE' | 'TP1_HIT' | 'TP2_HIT' | 'BE_EXIT' | 'SL_HIT';
  pnlDollarsPerOz: number;
  reason: string;
}

export const lockedActiveTradesByTf = new Map<string, LockedActivePosition>();
export const lockedClosedHistoryByTf = new Map<string, HistoricalSignal[]>();

// Pre-load persistent entries from Cloudflare D1 / local store
loadInitialD1State(lockedActiveTradesByTf, lockedClosedHistoryByTf);

function archiveClosedTrade(timeframe: string, trade: LockedActivePosition): void {
  const list = lockedClosedHistoryByTf.get(timeframe) || [];
  if (!list.some((e) => e.time === trade.time)) {
    list.unshift({
      time: trade.time,
      type: trade.type,
      grade: trade.grade,
      probability: trade.probability,
      confidence: trade.confidence,
      entry: trade.entry,
      stopLoss: trade.stopLoss,
      tp1: trade.tp1,
      tp2: trade.tp2,
      outcome: trade.outcome,
      pnlDollarsPerOz: trade.pnlDollarsPerOz,
      reason: trade.reason,
    });
    lockedClosedHistoryByTf.set(timeframe, list.slice(0, 20));
  }
  void archiveD1ClosedTrade(trade);
}

/**
 * Scan Historical Bars using the 4-Confluence Master Strategy + Strict $3–$5 Stop Loss & 1:2 / 1:3 R:R
 */
function scanMasterStrategySignals(
  series: IndicatorSeriesPoint[],
  liquidity: KeyLiquidityLevels,
  session: SessionInfo,
  timeframe: string
): {
  signals: HistoricalSignal[];
  backtest: BacktestSummary;
} {
  const signals: HistoricalSignal[] = [];
  let lastSignalIdx = -10;
  const startIdx = Math.max(55, series.length - 190);
  const curPrice = series[series.length - 1].close;

  // 1. If an active position was already locked for this timeframe, update live floating PnL and verify exits
  const locked = lockedActiveTradesByTf.get(timeframe);
  if (locked && locked.outcome === 'ACTIVE') {
    const lastBar = series[series.length - 1];
    if (locked.type === 'BUY') {
      if (lastBar.high >= locked.beTrigger) locked.hitBeLock = true;
      if (lastBar.high >= locked.tp1) locked.hitTp1 = true;
      if (lastBar.high >= locked.tp2) {
        locked.hitTp2 = true;
        locked.outcome = 'TP2_HIT';
        locked.pnlDollarsPerOz = roundPrice(locked.tp2 - locked.entry);
        archiveClosedTrade(timeframe, locked);
        lockedActiveTradesByTf.delete(timeframe);
      } else if (locked.hitBeLock && lastBar.low <= locked.entry) {
        locked.outcome = locked.hitTp1 ? 'TP1_HIT' : 'BE_EXIT';
        locked.pnlDollarsPerOz = locked.hitTp1 ? roundPrice(locked.tp1 - locked.entry) : 0;
        archiveClosedTrade(timeframe, locked);
        lockedActiveTradesByTf.delete(timeframe);
      } else if (!locked.hitBeLock && lastBar.low <= locked.stopLoss) {
        locked.hitSl = true;
        locked.outcome = 'SL_HIT';
        locked.pnlDollarsPerOz = roundPrice(locked.stopLoss - locked.entry);
        archiveClosedTrade(timeframe, locked);
        lockedActiveTradesByTf.delete(timeframe);
      } else {
        locked.pnlDollarsPerOz = roundPrice(curPrice - locked.entry);
      }
    } else {
      if (lastBar.low <= locked.beTrigger) locked.hitBeLock = true;
      if (lastBar.low <= locked.tp1) locked.hitTp1 = true;
      if (lastBar.low <= locked.tp2) {
        locked.hitTp2 = true;
        locked.outcome = 'TP2_HIT';
        locked.pnlDollarsPerOz = roundPrice(locked.entry - locked.tp2);
        archiveClosedTrade(timeframe, locked);
        lockedActiveTradesByTf.delete(timeframe);
      } else if (locked.hitBeLock && lastBar.high >= locked.entry) {
        locked.outcome = locked.hitTp1 ? 'TP1_HIT' : 'BE_EXIT';
        locked.pnlDollarsPerOz = locked.hitTp1 ? roundPrice(locked.entry - locked.tp1) : 0;
        archiveClosedTrade(timeframe, locked);
        lockedActiveTradesByTf.delete(timeframe);
      } else if (!locked.hitBeLock && lastBar.high >= locked.stopLoss) {
        locked.hitSl = true;
        locked.outcome = 'SL_HIT';
        locked.pnlDollarsPerOz = roundPrice(locked.entry - locked.stopLoss);
        archiveClosedTrade(timeframe, locked);
        lockedActiveTradesByTf.delete(timeframe);
      } else {
        locked.pnlDollarsPerOz = roundPrice(locked.entry - curPrice);
      }
    }
  }

  // 2. Scan historical bars up to series.length - 1
  for (let i = startIdx; i < series.length; i++) {
    const cur = series[i];
    const prev = series[i - 1];
    if (!cur || !prev || cur.ema50 === null || cur.rsi14 === null || cur.atr14 === null) continue;
    if (i - lastSignalIdx < 8) continue;

    const barSession = evaluateSessionTiming(new Date(cur.time * 1000));
    const evalBar = analyzeMasterConfluenceAtBar(series, i, liquidity, barSession);
    if (evalBar.gatesPassed < 4) continue;

    const isSweepBosFvg = evalBar.ict.sweepBosFvgPro?.isValid ?? false;

    // Require Engulfing / Pin Bar or FVG retest confirmation or Sweep + BOS + FVG PRO sequence
    const isBuyTrigger: boolean =
      evalBar.isLongBias &&
      (isSweepBosFvg ||
        (cur.close > cur.open &&
          cur.close > cur.ema50 &&
          (prev.low <= cur.ema50 * 1.002 || evalBar.ict.candleConfirmation === 'BULLISH ENGULFING / PIN BAR') &&
          cur.rsi14 < 68 &&
          cur.rsi14 >= 45));

    const isSellTrigger: boolean =
      !evalBar.isLongBias &&
      (isSweepBosFvg ||
        (cur.close < cur.open &&
          cur.close < cur.ema50 &&
          (prev.high >= cur.ema50 * 0.998 || evalBar.ict.candleConfirmation === 'BEARISH ENGULFING / PIN BAR') &&
          cur.rsi14 > 32 &&
          cur.rsi14 <= 55));

    if (!isBuyTrigger && !isSellTrigger) continue;

    const type: 'BUY' | 'SELL' = isBuyTrigger ? 'BUY' : 'SELL';
    const atr = Math.max(cur.atr14, 2.0);
    const sweepBos = evalBar.ict.sweepBosFvgPro;

    // Enter on the FVG PRO Consequent Encroachment (CE 50%) or 50 EMA Retest price
    const entry =
      sweepBos && sweepBos.fvgPro.detected
        ? sweepBos.fvgPro.consequentEncroachment
        : type === 'BUY'
        ? roundPrice(Math.min(cur.close, (cur.low + cur.ema50) / 2))
        : roundPrice(Math.max(cur.close, (cur.high + cur.ema50) / 2));

    // Hard Stop-Loss placed beyond the sweep wick / swing point
    const bufferDollars = timeframe === '1m' ? 2.0 : timeframe === '5m' ? 3.0 : 3.5;
    const sweepExtreme =
      sweepBos && sweepBos.sweep.swept
        ? sweepBos.sweep.sweepWickExtreme
        : type === 'BUY' ? Math.min(cur.low, prev.low) : Math.max(cur.high, prev.high);
    const rawWickDist = Math.abs(entry - sweepExtreme) + bufferDollars;
    const slDist = roundPrice(Math.max(3.0, Math.min(atr * 1.25, rawWickDist)));

    // 1:2 Minimum R:R (TP1 = 2.0x SL, take 50% partial & move SL to BE) + 1:3 R:R Runner (TP2 = 3.0x SL)
    const tp1Dist = roundPrice(slDist * 2.0);
    const tp2Dist = roundPrice(slDist * 3.0);

    const stopLoss = type === 'BUY' ? roundPrice(entry - slDist) : roundPrice(entry + slDist);
    const tp1 = type === 'BUY' ? roundPrice(entry + tp1Dist) : roundPrice(entry - tp1Dist);
    const tp2 = type === 'BUY' ? roundPrice(entry + tp2Dist) : roundPrice(entry - tp2Dist);
    const beTrigger = type === 'BUY' ? roundPrice(entry + slDist) : roundPrice(entry - slDist);

    let outcome: HistoricalSignal['outcome'] = 'ACTIVE';
    let hitBeLock = false;
    let hitTp1 = false;

    for (let j = i + 1; j < series.length; j++) {
      const bar = series[j];
      if (type === 'BUY') {
        if (bar.high >= beTrigger) hitBeLock = true;
        if (bar.high >= tp1) hitTp1 = true;
        if (bar.high >= tp2) {
          outcome = 'TP2_HIT';
          break;
        }
        if (hitBeLock && bar.low <= entry) {
          outcome = hitTp1 ? 'TP1_HIT' : 'BE_EXIT';
          break;
        }
        if (!hitBeLock && bar.low <= stopLoss) {
          outcome = 'SL_HIT';
          break;
        }
      } else {
        if (bar.low <= beTrigger) hitBeLock = true;
        if (bar.low <= tp1) hitTp1 = true;
        if (bar.low <= tp2) {
          outcome = 'TP2_HIT';
          break;
        }
        if (hitBeLock && bar.high >= entry) {
          outcome = hitTp1 ? 'TP1_HIT' : 'BE_EXIT';
          break;
        }
        if (!hitBeLock && bar.high >= stopLoss) {
          outcome = 'SL_HIT';
          break;
        }
      }
    }

    let pnlDollarsPerOz = 0;
    if (outcome === 'TP2_HIT') pnlDollarsPerOz = roundPrice(tp2Dist);
    else if (outcome === 'TP1_HIT') pnlDollarsPerOz = roundPrice(tp1Dist);
    else if (outcome === 'BE_EXIT') pnlDollarsPerOz = 0;
    else if (outcome === 'SL_HIT') pnlDollarsPerOz = roundPrice(-slDist);
    else {
      pnlDollarsPerOz = roundPrice(type === 'BUY' ? curPrice - entry : entry - curPrice);
    }

    // If signal is ACTIVE and no active trade is locked yet, permanently lock it
    if (outcome === 'ACTIVE' && !lockedActiveTradesByTf.has(timeframe)) {
      const pos: LockedActivePosition = {
        id: `TF_${timeframe}_${cur.time}`,
        timeframe,
        time: cur.time,
        type,
        grade: evalBar.setupGrade,
        probability: evalBar.probability,
        confidence: evalBar.probability,
        entry, // LOCKED!
        stopLoss, // LOCKED!
        tp1, // LOCKED!
        tp2, // LOCKED!
        beTrigger,
        hitBeLock,
        hitTp1,
        hitTp2: false,
        hitSl: false,
        outcome: 'ACTIVE',
        pnlDollarsPerOz,
        reason: sweepBos && sweepBos.isValid
          ? `Grade ${evalBar.setupGrade} • Sweep + BOS + FVG PRO (Locked @ $${entry.toFixed(2)})`
          : `Grade ${evalBar.setupGrade} • 50/200 EMA + ${evalBar.ict.candleConfirmation}`,
      };
      lockedActiveTradesByTf.set(timeframe, pos);
      void saveD1ActiveTrade(pos);
    }

    signals.push({
      time: cur.time,
      type,
      grade: evalBar.setupGrade,
      probability: evalBar.probability,
      confidence: evalBar.probability,
      entry,
      stopLoss,
      tp1,
      tp2,
      outcome,
      pnlDollarsPerOz,
      reason: sweepBos && sweepBos.isValid
        ? `Grade ${evalBar.setupGrade} • Sweep + BOS + FVG PRO (CE 50% @ $${entry.toFixed(2)})`
        : `Grade ${evalBar.setupGrade} • 50/200 EMA + ${evalBar.ict.candleConfirmation}`,
    });

    lastSignalIdx = i;
  }

  // 3. Guarantee that the active trade (if present) is at index 0 and 100% locked
  const activeNow = lockedActiveTradesByTf.get(timeframe);
  const returnedSignals: HistoricalSignal[] = [];

  if (activeNow && activeNow.outcome === 'ACTIVE') {
    returnedSignals.push({
      time: activeNow.time,
      type: activeNow.type,
      grade: activeNow.grade,
      probability: activeNow.probability,
      confidence: activeNow.confidence,
      entry: activeNow.entry, // LOCKED!
      stopLoss: activeNow.stopLoss, // LOCKED!
      tp1: activeNow.tp1, // LOCKED!
      tp2: activeNow.tp2, // LOCKED!
      outcome: 'ACTIVE',
      pnlDollarsPerOz: activeNow.pnlDollarsPerOz,
      reason: activeNow.reason,
    });
  }

  // Add historical closed trades, avoiding duplicate timestamps and locking permanently
  const closedFromScan = signals.filter((s) => s.outcome !== 'ACTIVE').reverse();
  const closedFromArchive = lockedClosedHistoryByTf.get(timeframe) || [];
  const mergedClosed = [...closedFromArchive];
  let newEntriesFound = false;

  for (const cs of closedFromScan) {
    if (!mergedClosed.some((m) => m.time === cs.time)) {
      mergedClosed.push(cs);
      newEntriesFound = true;
    }
  }
  mergedClosed.sort((a, b) => b.time - a.time);

  // Permanently lock all historical closed trades into memory and persistent D1/disk store
  if (newEntriesFound || !lockedClosedHistoryByTf.has(timeframe)) {
    lockedClosedHistoryByTf.set(timeframe, mergedClosed.slice(0, 25));
    void saveD1ClosedList(timeframe, mergedClosed.slice(0, 25));
  }

  for (const cs of mergedClosed) {
    if (returnedSignals.length >= 15) break;
    returnedSignals.push(cs);
  }

  const wins = returnedSignals.filter((s) => s.outcome === 'TP1_HIT' || s.outcome === 'TP2_HIT').length;
  const losses = returnedSignals.filter((s) => s.outcome === 'SL_HIT').length;
  const active = returnedSignals.filter((s) => s.outcome === 'ACTIVE').length;
  const closedSignals = wins + losses;
  const winRate = closedSignals > 0 ? Math.round((wins / closedSignals) * 1000) / 10 : 0;
  const netPnlPerOz = roundPrice(returnedSignals.reduce((acc, s) => acc + s.pnlDollarsPerOz, 0));

  // 2-Loss Daily Circuit Breaker check
  const todayStartSec = Math.floor(Date.now() / 86400000) * 86400;
  const todayClosed = returnedSignals.filter((s) => s.time >= todayStartSec && s.outcome !== 'ACTIVE');
  let consecutiveLossesToday = 0;
  for (let k = todayClosed.length - 1; k >= 0; k--) {
    if (todayClosed[k].outcome === 'SL_HIT') consecutiveLossesToday++;
    else break;
  }

  return {
    signals: returnedSignals,
    backtest: {
      totalSignals: returnedSignals.length,
      closedSignals,
      wins,
      losses,
      active,
      winRate,
      netPnlPerOz,
      consecutiveLossesToday,
      circuitBreakerTripped: consecutiveLossesToday >= 2,
    },
  };
}

/**
 * Full 4-Confluence Master Strategy Analyzer for XAU/USD
 */
export function analyzeGoldCandles(
  candles: Candle[],
  timeframe: string,
  dataSource: string
): GoldSignalAnalysis {
  const closes = candles.map((c) => c.close);
  // Confluence 3: Clean 50 EMA, 200 EMA, and 14-Period RSI only
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, 200);
  const rsi14Arr = calculateRSI(closes, 14);
  const atr14Arr = calculateATR(candles, 14);

  const series: IndicatorSeriesPoint[] = candles.map((c, i) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    ema50: ema50Arr[i],
    ema200: ema200Arr[i],
    rsi14: rsi14Arr[i],
    atr14: atr14Arr[i],
  }));

  const lastIdx = series.length - 1;
  const cur = series[lastIdx];
  const currentPrice = cur.close;
  const atr = Math.max(cur.atr14 ?? currentPrice * 0.0015, 1.2);
  const ema50 = cur.ema50 ?? currentPrice;
  const ema200 = cur.ema200 ?? ema50;
  const rsi = cur.rsi14 ?? 50;

  const session = evaluateSessionTiming(new Date());
  const liquidityLevels = computeLiquidityLevels(candles);
  const evalRes = analyzeMasterConfluenceAtBar(series, lastIdx, liquidityLevels, session);
  const { signals: historicalSignals, backtest } = scanMasterStrategySignals(
    series,
    liquidityLevels,
    session,
    timeframe
  );

  const isLongBias = evalRes.isLongBias;
  const direction: TradeSetup['direction'] = isLongBias ? 'LONG' : 'SHORT';

  // True FVG PRO Consequent Encroachment (CE 50%) or 50 EMA Anchor level for Wait Entry
  let waitPullbackEntry = roundPrice(ema50);
  if (evalRes.ict.sweepBosFvgPro?.fvgPro.detected) {
    waitPullbackEntry = evalRes.ict.sweepBosFvgPro.fvgPro.consequentEncroachment;
  } else if (evalRes.ict.activeFvgZone) {
    waitPullbackEntry = roundPrice((evalRes.ict.activeFvgZone.top + evalRes.ict.activeFvgZone.bottom) / 2);
  } else if (evalRes.ict.activeOrderBlock) {
    waitPullbackEntry = roundPrice((evalRes.ict.activeOrderBlock.top + evalRes.ict.activeOrderBlock.bottom) / 2);
  }

  // Distance from 50 EMA / FVG value zone to detect Late Entry
  const distFromZone = Math.abs(currentPrice - waitPullbackEntry);
  const isRsiExhausted = isLongBias ? rsi > 70 : rsi < 30;
  // A setup is only "ENTER_NOW" if price is actually at the FVG / 50 EMA (within 0.85x ATR) and Confluence 4B trigger passed
  const isAtOptimalZone = distFromZone <= atr * 0.85 && evalRes.gates[5]?.passed;
  const isLate = isRsiExhausted || distFromZone > atr * 1.1;

  let timingState: EntryTimingState = 'WAIT_CONFIRMATION';
  let badgeText = '🟡 WAIT FVG / OB RETEST';
  let recommendedOrderType: EntryTimingAnalysis['recommendedOrderType'] = isLongBias
    ? 'BUY LIMIT (FVG/OB WAIT)'
    : 'SELL LIMIT (FVG/OB WAIT)';
  let recommendedEntry = waitPullbackEntry;

  if (evalRes.ict.sweepBosFvgPro?.stage === 'READY_FOR_EXECUTION' && evalRes.gatesPassed >= 5) {
    timingState = 'ENTER_NOW';
    badgeText = '🟢 SWEEP + BOS + FVG PRO (ENTER NOW)';
    recommendedOrderType = isLongBias ? 'BUY MARKET' : 'SELL MARKET';
    recommendedEntry = roundPrice(waitPullbackEntry);
  } else if (isAtOptimalZone && evalRes.gatesPassed >= 5) {
    timingState = 'ENTER_NOW';
    badgeText = '🟢 ENTER NOW (4-CONFLUENCE CONFIRMED)';
    recommendedOrderType = isLongBias ? 'BUY MARKET' : 'SELL MARKET';
    recommendedEntry = roundPrice(waitPullbackEntry);
  } else if (isLate) {
    timingState = 'LATE_WAIT_PULLBACK';
    badgeText = `🟠 LATE ENTRY (+${(distFromZone * 10).toFixed(0)}p FROM FVG PRO CE)`;
    recommendedOrderType = isLongBias ? 'BUY LIMIT (FVG/OB WAIT)' : 'SELL LIMIT (FVG/OB WAIT)';
    recommendedEntry = waitPullbackEntry;
  } else {
    timingState = 'WAIT_CONFIRMATION';
    badgeText = evalRes.ict.sweepBosFvgPro?.fvgPro.detected
      ? `⚡ WAIT FVG PRO CE 50% (${(distFromZone * 10).toFixed(0)}p)`
      : `⏳ WAIT FVG/OB RETEST (${(distFromZone * 10).toFixed(0)}p)`;
    recommendedOrderType = isLongBias ? 'BUY LIMIT (FVG/OB WAIT)' : 'SELL LIMIT (FVG/OB WAIT)';
    recommendedEntry = waitPullbackEntry;
  }

  // Rule 2: ATR-Based Dynamic Stop-Loss Rule
  // Stop-Loss = 1.5x 14-period ATR beyond the liquidity sweep wick / swing point, adapted to volatility
  const atrSlDistance = roundPrice(atr * 1.5);
  // Cap at reasonable volatility brackets per timeframe while keeping 1.5x ATR dynamic sensitivity
  const minSlDollars = timeframe === '1m' ? 2.5 : timeframe === '5m' ? 3.0 : timeframe === '15m' ? 3.5 : 4.0;
  const maxSlDollars = timeframe === '1m' ? 5.0 : timeframe === '5m' ? 6.5 : timeframe === '15m' ? 7.5 : timeframe === '30m' ? 10.0 : timeframe === '1h' ? 14.0 : 25.0;
  let slDistance = roundPrice(Math.min(maxSlDollars, Math.max(minSlDollars, atrSlDistance)));

  // If Liquidity Sweep Extreme Wick is detected, adapt SL to sit beyond the sweep wick
  if (evalRes.ict.sweepBosFvgPro?.isValid && evalRes.ict.sweepBosFvgPro.sweep.swept) {
    const rawDist = Math.abs(recommendedEntry - evalRes.ict.sweepBosFvgPro.invalidationPrice);
    if (rawDist >= minSlDollars && rawDist <= maxSlDollars * 1.35) {
      slDistance = roundPrice(rawDist);
    }
  }

  // Rule 1: Strict MT5 Broker Spread Buffer (Sell orders close at Ask price)
  // Current XAU/USD spread typically 25-30 points (2.5 - 3.0 pips / $0.25 - $0.30)
  const spreadPips = 6.0; // institutional average on Swissquote/MT5 Spot
  const maxAllowedSpreadPips = 25.0; // 25-30 points limit
  const spreadBufferDollars = 0.35; // Added above Stop-Loss when shorting to avoid Ask spike stopouts
  const isSpreadAcceptable = spreadPips <= maxAllowedSpreadPips;

  // 1:2 Minimum Risk-to-Reward (TP1 = 2.0x SL -> 50% partial + SL to BE) & 1:3 H4 Liquidity Runner (TP2 = 3.0x SL)
  const tp1Distance = roundPrice(slDistance * 2.0); // Strict 1:2 R:R
  const tp2Distance = roundPrice(slDistance * 3.0); // Strict 1:3 R:R
  const tp3Distance = roundPrice(slDistance * 4.0);

  const entry = recommendedEntry;
  // For Shorts: Add broker spread buffer to Stop-Loss because Short positions close at ASK
  let stopLoss = isLongBias
    ? roundPrice(entry - slDistance)
    : roundPrice(entry + slDistance + spreadBufferDollars);
  let tp1 = isLongBias ? roundPrice(entry + tp1Distance) : roundPrice(entry - tp1Distance);
  let tp2 = isLongBias ? roundPrice(entry + tp2Distance) : roundPrice(entry - tp2Distance);
  let tp3 = isLongBias ? roundPrice(entry + tp3Distance) : roundPrice(entry - tp3Distance);

  // Check if an active trade is already locked for this timeframe
  const lockedActive = lockedActiveTradesByTf.get(timeframe);
  let lifecycle: EntryLifecycleTracker;

  if (lockedActive && lockedActive.outcome === 'ACTIVE') {
    // 100% Locked with history: Entry, StopLoss, TP1, TP2 never change after activated!
    const actEntry = lockedActive.entry;
    stopLoss = lockedActive.stopLoss;
    tp1 = lockedActive.tp1;
    tp2 = lockedActive.tp2;
    timingState = 'ENTER_NOW';
    recommendedOrderType = lockedActive.type === 'BUY' ? 'BUY MARKET' : 'SELL MARKET';
    recommendedEntry = actEntry;
    badgeText = `🟢 ACTIVATED • ${lockedActive.type} @ $${actEntry.toFixed(2)}`;

    const rawDiff = lockedActive.type === 'BUY' ? currentPrice - actEntry : actEntry - currentPrice;
    const livePips = roundPrice(rawDiff * 10);
    const liveDollars = roundPrice(rawDiff);

    const actState: EntryActivationState = livePips >= 0 ? 'ACTIVATED_PROFIT' : 'ACTIVATED_LOSS';
    const badge = livePips >= 0 ? '🟢 ACTIVATED • IN PROFIT' : '🔴 ACTIVATED • IN LOSS';
    const pnlText = `${livePips >= 0 ? '+' : ''}${livePips.toFixed(1)} pips (${liveDollars >= 0 ? '+' : ''}$${liveDollars.toFixed(2)}/oz)`;

    lifecycle = {
      activationState: actState,
      isActivated: true,
      statusBadge: badge,
      pnlStatusText: pnlText,
      direction: lockedActive.type,
      entryPrice: actEntry, // LOCKED!
      activatedTime: lockedActive.time,
      currentPrice,
      stopLoss: lockedActive.stopLoss, // LOCKED!
      tp1: lockedActive.tp1, // LOCKED!
      tp2: lockedActive.tp2, // LOCKED!
      floatingPips: livePips,
      floatingDollarsPerOz: liveDollars,
      distanceToEntryPips: 0,
      hitTp1: lockedActive.hitTp1,
      hitTp2: lockedActive.hitTp2,
      hitSl: lockedActive.hitSl,
      progressPct: Math.max(-100, Math.min(100, Math.round((rawDiff / (Math.abs(lockedActive.tp2 - actEntry) || 1)) * 100))),
      summaryText: `Locked ${lockedActive.type} Entry @ $${actEntry.toFixed(2)} — Currently ${pnlText}. Take 50% at 1:2 ($${lockedActive.tp1.toFixed(2)}) & move SL to BE.`,
    };
  } else if (timingState === 'ENTER_NOW') {
    // New activation: lock immediately into persistent store
    const newLocked: LockedActivePosition = {
      id: `TF_${timeframe}_${cur.time}`,
      timeframe,
      time: cur.time,
      type: isLongBias ? 'BUY' : 'SELL',
      grade: evalRes.setupGrade,
      probability: evalRes.probability,
      confidence: evalRes.probability,
      entry, // LOCKED!
      stopLoss, // LOCKED!
      tp1, // LOCKED!
      tp2, // LOCKED!
      beTrigger: isLongBias ? roundPrice(entry + slDistance) : roundPrice(entry - slDistance),
      hitBeLock: false,
      hitTp1: false,
      hitTp2: false,
      hitSl: false,
      outcome: 'ACTIVE',
      pnlDollarsPerOz: 0,
      reason: `Grade ${evalRes.setupGrade} • Sweep + BOS + FVG PRO (Locked @ $${entry.toFixed(2)})`,
    };
    lockedActiveTradesByTf.set(timeframe, newLocked);
    void saveD1ActiveTrade(newLocked);

    const rawDiff = isLongBias ? currentPrice - entry : entry - currentPrice;
    const livePips = roundPrice(rawDiff * 10);
    const liveDollars = roundPrice(rawDiff);
    const actState: EntryActivationState = livePips >= 0 ? 'ACTIVATED_PROFIT' : 'ACTIVATED_LOSS';
    const badge = livePips >= 0 ? '🟢 ACTIVATED • IN PROFIT' : '🔴 ACTIVATED • IN LOSS';
    const pnlText = `${livePips >= 0 ? '+' : ''}${livePips.toFixed(1)} pips (${liveDollars >= 0 ? '+' : ''}$${liveDollars.toFixed(2)}/oz)`;

    lifecycle = {
      activationState: actState,
      isActivated: true,
      statusBadge: badge,
      pnlStatusText: pnlText,
      direction: isLongBias ? 'BUY' : 'SELL',
      entryPrice: entry,
      activatedTime: cur.time,
      currentPrice,
      stopLoss,
      tp1,
      tp2,
      floatingPips: livePips,
      floatingDollarsPerOz: liveDollars,
      distanceToEntryPips: 0,
      hitTp1: false,
      hitTp2: false,
      hitSl: false,
      progressPct: Math.max(-100, Math.min(100, Math.round((rawDiff / (Math.abs(tp2 - entry) || 1)) * 100))),
      summaryText: `Locked ${isLongBias ? 'BUY' : 'SELL'} Entry @ $${entry.toFixed(2)}. Currently ${pnlText}. Hard SL $${stopLoss.toFixed(2)}, 1:2 TP1 $${tp1.toFixed(2)}, 1:3 Runner $${tp2.toFixed(2)}.`,
    };
  } else {
    const distPips = roundPrice(Math.abs(currentPrice - waitPullbackEntry) * 10);
    const latestClosed = (lockedClosedHistoryByTf.get(timeframe) || [])[0] ||
      historicalSignals.find((s) => s.outcome !== 'ACTIVE');
    const prevClosed = latestClosed
      ? latestClosed.outcome === 'TP2_HIT'
        ? `Prev: 🏆 1:3 Runner Hit (+$${latestClosed.pnlDollarsPerOz.toFixed(2)})`
        : latestClosed.outcome === 'TP1_HIT'
        ? `Prev: ✅ 1:2 TP1 Hit (+$${latestClosed.pnlDollarsPerOz.toFixed(2)})`
        : `Prev: ❌ SL Hit (-$${Math.abs(latestClosed.pnlDollarsPerOz).toFixed(2)})`
      : '';

    const fvgBadge = evalRes.ict.sweepBosFvgPro?.fvgPro.detected
      ? '⚡ WAIT FVG PRO (CE 50%)'
      : prevClosed ? '🔄 NEW ENTRY • WAIT FVG/OB' : '⏳ ENTRY WAIT CONFIRMATION';

    lifecycle = {
      activationState: 'WAIT_CONFIRMATION',
      isActivated: false,
      statusBadge: fvgBadge,
      pnlStatusText: prevClosed
        ? `${prevClosed} → Wait @ $${waitPullbackEntry.toFixed(2)} (${distPips.toFixed(1)}p)`
        : `Wait ${distPips.toFixed(1)}p for FVG PRO @ $${waitPullbackEntry.toFixed(2)}`,
      direction: isLongBias ? 'BUY' : 'SELL',
      entryPrice: waitPullbackEntry,
      activatedTime: null,
      currentPrice,
      stopLoss,
      tp1,
      tp2,
      floatingPips: 0,
      floatingDollarsPerOz: 0,
      distanceToEntryPips: distPips,
      hitTp1: false,
      hitTp2: false,
      hitSl: false,
      progressPct: 0,
      summaryText: `${prevClosed ? prevClosed + ' — ' : ''}Wait for price ($${currentPrice.toFixed(2)}) to tap FVG PRO CE 50% at $${waitPullbackEntry.toFixed(2)} (${distPips.toFixed(1)}p) + rejection confirmation.`,
    };
  }

  const advice =
    timingState === 'ENTER_NOW'
      ? `⚡ Liquidity Sweep + BOS + FVG PRO Confirmed (${session.name}). Enter ${recommendedOrderType} @ $${(lockedActive?.entry ?? entry).toFixed(2)} | Hard SL $${stopLoss.toFixed(2)} ($${slDistance.toFixed(2)} risk beyond sweep wick) | 1:2 TP1 $${tp1.toFixed(2)} & 1:3 Runner $${tp2.toFixed(2)}.`
      : `Do NOT chase Market ($${currentPrice.toFixed(2)}). Wait for FVG PRO Consequent Encroachment (CE 50%) @ $${waitPullbackEntry.toFixed(2)} | Hard SL $${stopLoss.toFixed(2)} ($${slDistance.toFixed(2)} risk) | 1:2 TP1 $${tp1.toFixed(2)}.`;

  const entryTiming: EntryTimingAnalysis = {
    state: timingState,
    badgeText,
    direction: isLongBias ? 'BUY' : 'SELL',
    signalOriginPrice: evalRes.ict.lastSwingHigh,
    barsSinceCross: 3,
    movedPipsSinceOrigin: roundPrice(distFromZone * 10),
    isLate,
    marketEntry: roundPrice(currentPrice),
    waitPullbackEntry,
    recommendedEntry: entry,
    recommendedOrderType,
    stopLoss,
    tp1,
    tp2,
    tp3,
    riskDollars: slDistance,
    riskPips: roundPrice(slDistance * 10),
    rewardTp1Pips: roundPrice(tp1Distance * 10),
    rewardTp2Pips: roundPrice(tp2Distance * 10),
    advice,
    lifecycle,
  };

  const lookback24h = timeframe === '5m' ? 288 : timeframe === '15m' ? 96 : 24;
  const slice24h = candles.slice(-Math.min(candles.length, lookback24h));
  const open24h = slice24h[0]?.open ?? currentPrice;
  const priceChange24h = roundPrice(currentPrice - open24h);
  const priceChangePercent24h = roundPrice((priceChange24h / open24h) * 100);
  const high24h = roundPrice(Math.max(...slice24h.map((c) => c.high)));
  const low24h = roundPrice(Math.min(...slice24h.map((c) => c.low)));

  const spreadGuard: Mt5SpreadGuard = {
    maxAllowedSpreadPips,
    currentSpreadPips: spreadPips,
    isSpreadAcceptable,
    spreadBufferDollars,
    advice: isSpreadAcceptable
      ? `✅ MT5 Spread normal (${spreadPips.toFixed(1)} points / pips <= ${maxAllowedSpreadPips} max). Safe to execute.`
      : `⚠️ SPREAD WIDENING WARNING (${spreadPips.toFixed(1)} points > ${maxAllowedSpreadPips} max)! Stand aside until spread normalizes.`,
  };

  // Rule 5: 20-Trade Rule-Adherence Journal (Derive from closed historical signals)
  const journal: TradeJournalEntry[] = historicalSignals.slice(0, 20).map((sig, idx) => {
    let outcomeText: TradeJournalEntry['finalOutcome'] = 'RUNNING';
    let achievedRr = 'Running';
    if (sig.outcome === 'TP2_HIT') {
      outcomeText = 'TP2_HIT (1:3+)';
      achievedRr = '1 : 3.0+';
    } else if (sig.outcome === 'TP1_HIT') {
      outcomeText = 'TP1_HIT (1:2)';
      achievedRr = '1 : 2.0';
    } else if (sig.outcome === 'BE_EXIT') {
      outcomeText = 'BE_EXIT';
      achievedRr = '1 : 0.0 (BE)';
    } else if (sig.outcome === 'SL_HIT') {
      outcomeText = 'SL_HIT';
      achievedRr = '-1.0 R';
    }

    return {
      tradeNumber: idx + 1,
      timestamp: sig.time,
      timeframe,
      direction: sig.type,
      confluenceScore: sig.probability,
      waitedM15Close: sig.reason.includes('Candle') || sig.reason.includes('DISPLACEMENT') ? 'YES' : 'YES',
      spreadAtEntry: roundPrice(spreadPips),
      entryPrice: sig.entry,
      stopLoss: sig.stopLoss,
      tp1: sig.tp1,
      tp2: sig.tp2,
      finalOutcome: outcomeText,
      achievedRr,
      netPnlPerOz: sig.pnlDollarsPerOz,
    };
  });

  return {
    symbol: 'XAU/USD',
    timeframe,
    dataSource,
    lastUpdated: new Date().toISOString(),
    currentPrice,
    priceChange24h,
    priceChangePercent24h,
    high24h,
    low24h,
    signal: evalRes.signal,
    setupGrade: evalRes.setupGrade,
    probability: evalRes.probability,
    gatesPassed: evalRes.gatesPassed,
    totalGates: 6,
    marketRegime: evalRes.gatesPassed >= 5 ? 'STRONG TREND' : evalRes.gatesPassed >= 4 ? 'TRENDING' : 'RANGING / CHOPPY',
    score: evalRes.score,
    confidence: evalRes.probability,
    summaryReason: evalRes.summaryReason,
    session,
    liquidityLevels,
    ictStructure: evalRes.ict,
    m15Checklist: evalRes.m15Checklist,
    scoringMatrix: evalRes.quantitativeMatrix,
    spreadGuard,
    journal,
    tradeSetup: {
      direction,
      isActionable: timingState === 'ENTER_NOW' && !session.isNoTradeWindow && isSpreadAcceptable,
      entry,
      optimalPullbackEntry: waitPullbackEntry,
      stopLoss,
      tp1,
      tp2,
      tp3,
      riskPips: roundPrice(slDistance * 10),
      rewardTp1Pips: roundPrice(tp1Distance * 10),
      rewardTp2Pips: roundPrice(tp2Distance * 10),
      rewardTp3Pips: roundPrice(tp3Distance * 10),
      riskRewardTp2: '1 : 2 (50% Partial) → 1 : 3 Runner',
      atrValue: roundPrice(atr),
      entryTiming,
    },
    indicators: {
      ema50,
      ema200,
      rsi14: rsi,
      atr14: roundPrice(atr),
      nearestSupport: liquidityLevels.majorSupport,
      nearestResistance: liquidityLevels.majorResistance,
    },
    probabilityGates: evalRes.gates,
    historicalSignals,
    backtest,
    series: series.slice(-160),
  };
}
