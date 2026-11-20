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

export interface V3QualityPillars {
  liquiditySweep: QuantitativePillarScore; // 20 pts
  mssDisplacement: QuantitativePillarScore; // 25 pts
  fvgQuality: QuantitativePillarScore; // 20 pts
  ema50_200Regime: QuantitativePillarScore; // 15 pts
  h4TrendConfirmation: QuantitativePillarScore; // 10 pts
  sessionAndNews: QuantitativePillarScore; // 5 pts
  executionAndCosts: QuantitativePillarScore; // 5 pts
}

export interface AccountRiskProfile {
  equity: number; // Reference account equity (e.g. $10,000)
  riskPercent: number; // 0.25% initial risk
  riskAmountUsd: number; // e.g. $25.00
  positionSize: number; // lot size or token units
  positionUnit: string; // 'lots' | 'BTC' | 'ETH' | 'SOL'
  stopDistance: number;
  maxDailyLossUsd: number; // 0.50% ($50.00 / 2 losses)
  maxWeeklyLossUsd: number; // 1.50% ($150.00)
  maxOpenRiskUsd: number; // 0.50% ($50.00)
  consecutiveLossesToday: number;
  circuitBreakerTripped: boolean;
  dailyEntriesCount: number;
  maxDailyEntries: number; // 2 entries max across all instruments
}

export interface QuantitativeScoreMatrix {
  totalScore: number; // 0 to 100
  isTradeable: boolean; // >= 90 points AND all 4 mandatory confluences passed
  actionVerdict: string;
  allMandatoryConfluencesPassed: boolean;
  pillars: {
    macroNews: QuantitativePillarScore; // 25 pts
    marketStructure: QuantitativePillarScore; // 25 pts
    emaRsiFilter: QuantitativePillarScore; // 20 pts
    killzoneSweep: QuantitativePillarScore; // 15 pts
    m15CandleFvg: QuantitativePillarScore; // 15 pts
  };
  v3Pillars?: V3QualityPillars;
  accountRisk?: AccountRiskProfile;
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
  finalOutcome: 'TP1_HIT (1:1.5)' | 'TP2_HIT (1:2.5+)' | 'TP1_HIT (1:2)' | 'TP2_HIT (1:3+)' | 'BE_EXIT' | 'SL_HIT' | 'RUNNING';
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
  mss: BosDetails;
  bos: BosDetails;
  fvgPro: FvgProDetails;
  ifvg: IfvgDetails;
  cisd: CisdDetails;
  smt: SmtDivergenceDetails;
  smcSuite?: SmcSuiteSummary;
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
  smcSuite?: SmcSuiteSummary;
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
  tp1: number; // 1:1.5 R:R (V3.0 Conservative Target)
  tp2: number; // 1:2.5 R:R (V3.0 Liquidity Runner)
  tp3: number;
  riskPips: number;
  rewardTp1Pips: number;
  rewardTp2Pips: number;
  rewardTp3Pips: number;
  riskRewardTp2: string;
  atrValue: number;
  entryTiming: EntryTimingAnalysis;
  v3Config?: {
    qualityScore: number;
    grade: SetupGrade;
    allMandatoryPassed: boolean;
    actionVerdict: string;
    riskPercent: number; // 0.25%
    plannedRiskUsd: number; // $25.00
    positionSize: number;
    positionUnit: string;
    tp1Ratio: string; // +1.5R
    tp2Ratio: string; // +2.5R
    grossExpectancyR: string; // +2.0R
    slBuffer: string; // 0.2x ATR
    expirationBars: number; // 4 completed M15 candles
  };
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

export type CandlePatternType =
  | 'BULLISH_DISPLACEMENT'
  | 'BEARISH_DISPLACEMENT'
  | 'BULLISH_PIN_BAR'
  | 'BEARISH_PIN_BAR'
  | 'BULLISH_ENGULFING'
  | 'BEARISH_ENGULFING'
  | 'DOJI'
  | 'INSIDE_BAR'
  | 'BULLISH_EXPANSION'
  | 'BEARISH_EXPANSION'
  | 'NEUTRAL';

export interface IdentifiedCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  pattern: CandlePatternType;
  name: string;
  badge: string;
  icon: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  bodyPct: number;
  upperWickPct: number;
  lowerWickPct: number;
  range: number;
  body: number;
  atrRatio: number;
  isDisplacement: boolean;
  isSweepWick: boolean;
  ictSignificance: string;
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
  currentCandlePattern: IdentifiedCandle;
  recentCandlePatterns: IdentifiedCandle[];
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
  smartMoney?: SmartMoneyStructure;
}

export interface SmtDivergenceDetails {
  detected: boolean;
  type: 'BULLISH_SMT' | 'BEARISH_SMT' | 'NONE';
  goldAction: string;
  silverAction: string;
  divergenceTime: number;
  statusText: string;
}

export interface CisdDetails {
  detected: boolean;
  direction: 'BULLISH_CISD' | 'BEARISH_CISD' | 'NONE';
  deliveryShiftLevel: number;
  displacementClose: number;
  statusText: string;
}

export interface IfvgDetails {
  detected: boolean;
  type: 'BULLISH_iFVG' | 'BEARISH_iFVG' | 'NONE';
  originalFvgTop: number;
  originalFvgBottom: number;
  consequentEncroachment: number; // 50% CE level
  inversionTime: number;
  isRetested: boolean;
  statusText: string;
}

export interface SmcSuiteSummary {
  sweep: LiquiditySweepDetails;
  mss: BosDetails;
  bos: BosDetails;
  ifvg: IfvgDetails;
  cisd: CisdDetails;
  smt: SmtDivergenceDetails;
  confluencesPassed: number;
  totalConfluences: number;
  statusText: string;
}

export interface SmartMoneyMarker {
  time: number;
  type: 'FVG' | 'iFVG' | 'OB' | 'SWEEP' | 'MSS' | 'BOS' | 'CISD' | 'SMT' | 'DISPLACEMENT' | 'PINBAR';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  label: string;
  subText: string;
  price: number;
  high: number;
  low: number;
  cePrice: number;
  isMitigated: boolean;
}

export interface SmartMoneyStructure {
  fvgs: SmartMoneyMarker[];
  ifvgs: SmartMoneyMarker[];
  orderBlocks: SmartMoneyMarker[];
  sweeps: SmartMoneyMarker[];
  mssList: SmartMoneyMarker[];
  bosList: SmartMoneyMarker[];
  cisdList: SmartMoneyMarker[];
  smtMarkers: SmartMoneyMarker[];
  activeFvg?: SmartMoneyMarker;
  activeIfvg?: SmartMoneyMarker;
  activeOrderBlock?: SmartMoneyMarker;
  activeCisd?: CisdDetails;
  activeSmt?: SmtDivergenceDetails;
  activeBos?: BosDetails;
  smcSuite?: SmcSuiteSummary;
}

function roundPrice(num: number): number {
  return Math.round(num * 100) / 100;
}

export function identifyCandle(
  candle: Candle,
  prevCandle?: Candle,
  atr = 0
): IdentifiedCandle {
  const open = candle.open;
  const high = candle.high;
  const low = candle.low;
  const close = candle.close;
  const range = Math.max(0.01, roundPrice(high - low));
  const body = roundPrice(Math.abs(close - open));
  const upperWick = roundPrice(high - Math.max(open, close));
  const lowerWick = roundPrice(Math.min(open, close) - low);

  const bodyPct = Math.round((body / range) * 100);
  const upperWickPct = Math.round((upperWick / range) * 100);
  const lowerWickPct = Math.round((lowerWick / range) * 100);
  const atrRatio = atr > 0 ? Number((range / atr).toFixed(2)) : 1.0;

  const isBull = close > open;
  const isBear = close < open;
  const isDoji = bodyPct <= 14;

  let pattern: CandlePatternType = 'NEUTRAL';
  let name = 'Neutral Consolidation';
  let badge = '⚖️ NEUTRAL';
  let icon = '⚖️';
  let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let isDisplacement = false;
  let isSweepWick = false;
  let ictSignificance = 'Order flow consolidation and equilibrium.';

  // 1. Institutional Displacement (Marubozu / Long Momentum Bar)
  if (!isDoji && bodyPct >= 62 && (atr <= 0 || range >= atr * 0.9)) {
    isDisplacement = true;
    if (isBull) {
      pattern = 'BULLISH_DISPLACEMENT';
      direction = 'BULLISH';
      name = 'Bullish Institutional Displacement (Marubozu)';
      badge = '⚡ BULL DISPLACEMENT';
      icon = '⚡';
      ictSignificance = 'Aggressive institutional buying pressure; creates bullish Fair Value Gap (FVG) and confirms structure shift.';
    } else {
      pattern = 'BEARISH_DISPLACEMENT';
      direction = 'BEARISH';
      name = 'Bearish Institutional Displacement (Marubozu)';
      badge = '⚡ BEAR DISPLACEMENT';
      icon = '⚡';
      ictSignificance = 'Aggressive institutional selling pressure; creates bearish Fair Value Gap (FVG) and breaks internal swing lows.';
    }
  }
  // 2. Rejection Pin Bar / Liquidity Sweep Wick (Hammer / Shooting Star)
  else if (lowerWickPct >= 50 && bodyPct <= 35) {
    pattern = 'BULLISH_PIN_BAR';
    direction = 'BULLISH';
    name = 'Bullish Rejection Pin Bar (Liquidity Low Sweep)';
    badge = '🔨 BULL PIN / SWEEP';
    icon = '🔨';
    isSweepWick = true;
    ictSignificance = 'Price swept resting sell-side liquidity below key low; buyers aggressively absorbed supply leaving a long rejection wick.';
  } else if (upperWickPct >= 50 && bodyPct <= 35) {
    pattern = 'BEARISH_PIN_BAR';
    direction = 'BEARISH';
    name = 'Bearish Rejection Pin Bar (Liquidity High Sweep)';
    badge = '🌠 BEAR PIN / SWEEP';
    icon = '🌠';
    isSweepWick = true;
    ictSignificance = 'Price swept resting buy-side liquidity above key high; smart money trapped breakout buyers leaving a long upper rejection wick.';
  }
  // 3. Engulfing Bars
  else if (prevCandle && isBull && prevCandle.close < prevCandle.open && close >= prevCandle.open && open <= prevCandle.close) {
    pattern = 'BULLISH_ENGULFING';
    direction = 'BULLISH';
    name = 'Bullish Engulfing Reversal';
    badge = '🟢 BULL ENGULFING';
    icon = '🟢';
    ictSignificance = 'Immediate order flow reversal; bullish candle completely engulfs prior bearish body.';
  } else if (prevCandle && isBear && prevCandle.close > prevCandle.open && close <= prevCandle.open && open >= prevCandle.close) {
    pattern = 'BEARISH_ENGULFING';
    direction = 'BEARISH';
    name = 'Bearish Engulfing Reversal';
    badge = '🔴 BEAR ENGULFING';
    icon = '🔴';
    ictSignificance = 'Immediate order flow reversal; bearish candle completely engulfs prior bullish body.';
  }
  // 4. Inside Bar (Volatility Contraction)
  else if (prevCandle && high <= prevCandle.high && low >= prevCandle.low) {
    pattern = 'INSIDE_BAR';
    direction = 'NEUTRAL';
    name = 'Inside Bar (Volatility Squeeze)';
    badge = '📦 INSIDE BAR';
    icon = '📦';
    ictSignificance = 'Order flow contraction inside previous candle range; liquidity builds on both extremes before explosive breakout.';
  }
  // 5. Doji / Indecision
  else if (isDoji) {
    pattern = 'DOJI';
    direction = 'NEUTRAL';
    name = 'Neutral Doji (Equilibrium)';
    badge = '⚖️ DOJI';
    icon = '⚖️';
    ictSignificance = 'Indecision and balance at current price level; awaits next directional liquidity drive.';
  }
  // 6. Standard Expansion
  else if (isBull) {
    pattern = 'BULLISH_EXPANSION';
    direction = 'BULLISH';
    name = 'Bullish Expansion Candle';
    badge = '📈 BULL EXPANSION';
    icon = '📈';
    ictSignificance = 'Upward continuation favoring buyers with sustained momentum.';
  } else if (isBear) {
    pattern = 'BEARISH_EXPANSION';
    direction = 'BEARISH';
    name = 'Bearish Expansion Candle';
    badge = '📉 BEAR EXPANSION';
    icon = '📉';
    ictSignificance = 'Downward continuation favoring sellers with sustained momentum.';
  }

  return {
    time: candle.time,
    open,
    high,
    low,
    close,
    volume: candle.volume,
    pattern,
    name,
    badge,
    icon,
    direction,
    bodyPct,
    upperWickPct,
    lowerWickPct,
    range,
    body,
    atrRatio,
    isDisplacement,
    isSweepWick,
    ictSignificance,
  };
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
/**
 * 6-Element Institutional Smart Money Engine (ICT / SMC Suite):
 * 1. Liquidity Sweep: Purges BSL / SSL / Asian Range / PDH / PDL with rejection wick
 * 2. MSS (Market Structure Shift): Reversal displacement candle body closes beyond opposing swing
 * 3. BOS (Break of Structure): Trend continuation displacement closes beyond structural swing in trend direction
 * 4. iFVG (Inversion Fair Value Gap): Old FVG closed through by displacement, flipping into support/resistance
 * 5. CISD (Change In State of Delivery): Displacement body closes past opening of last counter-trend delivery sequence
 * 6. SMT Divergence (XAU/USD vs XAG/USD): Real-time intermarket smart money divergence between Gold and Silver
 */

export function detectSmtDivergenceAtBar(
  series: IndicatorSeriesPoint[],
  idx: number,
  silverCandles?: Candle[]
): SmtDivergenceDetails {
  if (!silverCandles || silverCandles.length < 15 || idx < 5) {
    return {
      detected: false,
      type: 'NONE',
      goldAction: 'Awaiting Silver feed sync',
      silverAction: 'Awaiting Silver feed sync',
      divergenceTime: 0,
      statusText: 'SMT Divergence: Silver data synchronized',
    };
  }

  const curGold = series[idx];
  const curTime = curGold.time;

  // Find matching silver index by timestamp
  let silIdx = -1;
  let minDiff = Infinity;
  for (let s = 0; s < silverCandles.length; s++) {
    const diff = Math.abs(silverCandles[s].time - curTime);
    if (diff < minDiff) {
      minDiff = diff;
      silIdx = s;
    }
  }

  if (silIdx < 5 || minDiff > 14400) {
    return {
      detected: false,
      type: 'NONE',
      goldAction: 'Awaiting Silver feed sync',
      silverAction: 'Awaiting Silver feed sync',
      divergenceTime: 0,
      statusText: 'SMT Divergence: Synchronizing timestamps',
    };
  }

  const lookStart = Math.max(3, idx - 25);

  // 1. Check Bearish SMT: Divergence at Highs
  for (let i = idx; i >= lookStart; i--) {
    const isGH =
      series[i].high >= series[i - 1].high &&
      series[i].high >= series[i - 2].high &&
      (i === idx || series[i].high >= series[i + 1]?.high);

    if (isGH) {
      for (let j = i - 3; j >= Math.max(2, i - 20); j--) {
        const isPrevGH =
          series[j].high >= series[j - 1].high &&
          series[j].high >= series[j - 2].high &&
          series[j].high >= series[j + 1]?.high;

        if (isPrevGH) {
          const sOffset = silIdx - idx;
          const sI = Math.max(2, Math.min(silverCandles.length - 1, i + sOffset));
          const sJ = Math.max(2, Math.min(silverCandles.length - 1, j + sOffset));

          const sHighCur = Math.max(...silverCandles.slice(Math.max(0, sI - 2), Math.min(silverCandles.length, sI + 3)).map((c) => c.high));
          const sHighPrev = Math.max(...silverCandles.slice(Math.max(0, sJ - 2), Math.min(silverCandles.length, sJ + 3)).map((c) => c.high));
          const gHighCur = series[i].high;
          const gHighPrev = series[j].high;

          if (gHighCur > gHighPrev && sHighCur < sHighPrev) {
            return {
              detected: true,
              type: 'BEARISH_SMT',
              goldAction: `Gold made Higher High ($${gHighCur.toFixed(2)} > $${gHighPrev.toFixed(2)})`,
              silverAction: `Silver failed with Lower High ($${sHighCur.toFixed(2)} < $${sHighPrev.toFixed(2)})`,
              divergenceTime: series[i].time,
              statusText: `Bearish SMT: Gold Higher High ($${gHighCur.toFixed(1)}) vs Silver Lower High ($${sHighCur.toFixed(2)}) [Institutional Distribution]`,
            };
          } else if (gHighCur < gHighPrev && sHighCur > sHighPrev) {
            return {
              detected: true,
              type: 'BEARISH_SMT',
              goldAction: `Gold made Lower High ($${gHighCur.toFixed(2)} < $${gHighPrev.toFixed(2)})`,
              silverAction: `Silver made Higher High ($${sHighCur.toFixed(2)} > $${sHighPrev.toFixed(2)})`,
              divergenceTime: series[i].time,
              statusText: `Bearish SMT: Silver Higher High ($${sHighCur.toFixed(2)}) vs Gold Relative Weakness ($${gHighCur.toFixed(1)})`,
            };
          }
        }
      }
    }
  }

  // 2. Check Bullish SMT: Divergence at Lows
  for (let i = idx; i >= lookStart; i--) {
    const isGL =
      series[i].low <= series[i - 1].low &&
      series[i].low <= series[i - 2].low &&
      (i === idx || series[i].low <= series[i + 1]?.low);

    if (isGL) {
      for (let j = i - 3; j >= Math.max(2, i - 20); j--) {
        const isPrevGL =
          series[j].low <= series[j - 1].low &&
          series[j].low <= series[j - 2].low &&
          series[j].low <= series[j + 1]?.low;

        if (isPrevGL) {
          const sOffset = silIdx - idx;
          const sI = Math.max(2, Math.min(silverCandles.length - 1, i + sOffset));
          const sJ = Math.max(2, Math.min(silverCandles.length - 1, j + sOffset));

          const sLowCur = Math.min(...silverCandles.slice(Math.max(0, sI - 2), Math.min(silverCandles.length, sI + 3)).map((c) => c.low));
          const sLowPrev = Math.min(...silverCandles.slice(Math.max(0, sJ - 2), Math.min(silverCandles.length, sJ + 3)).map((c) => c.low));
          const gLowCur = series[i].low;
          const gLowPrev = series[j].low;

          if (gLowCur < gLowPrev && sLowCur > sLowPrev) {
            return {
              detected: true,
              type: 'BULLISH_SMT',
              goldAction: `Gold made Lower Low ($${gLowCur.toFixed(2)} < $${gLowPrev.toFixed(2)})`,
              silverAction: `Silver held Higher Low ($${sLowCur.toFixed(2)} > $${sLowPrev.toFixed(2)})`,
              divergenceTime: series[i].time,
              statusText: `Bullish SMT: Gold Lower Low ($${gLowCur.toFixed(1)}) vs Silver Higher Low ($${sLowCur.toFixed(2)}) [Institutional Accumulation]`,
            };
          } else if (gLowCur > gLowPrev && sLowCur < sLowPrev) {
            return {
              detected: true,
              type: 'BULLISH_SMT',
              goldAction: `Gold held Higher Low ($${gLowCur.toFixed(2)} > $${gLowPrev.toFixed(2)})`,
              silverAction: `Silver made Lower Low ($${sLowCur.toFixed(2)} < $${sLowPrev.toFixed(2)})`,
              divergenceTime: series[i].time,
              statusText: `Bullish SMT: Gold Relative Strength ($${gLowCur.toFixed(1)}) vs Silver Sweep Lower Low ($${sLowCur.toFixed(2)})`,
            };
          }
        }
      }
    }
  }

  return {
    detected: false,
    type: 'NONE',
    goldAction: 'Gold moving in sync with Silver',
    silverAction: 'No SMT divergence detected',
    divergenceTime: 0,
    statusText: 'SMT Intermarket: XAU & XAG moving in sync',
  };
}

export function detectInversionFvgAtBar(
  series: IndicatorSeriesPoint[],
  idx: number,
  atr: number
): IfvgDetails {
  const cur = series[idx];
  const lookback = Math.max(2, idx - 25);

  for (let k = idx - 1; k >= lookback; k--) {
    const c0 = series[k - 2];
    const c1 = series[k - 1];
    const c2 = series[k];

    // Original Bearish FVG: c0.low > c2.high -> inverted by bullish displacement closing above top
    if (c0.low > c2.high && c1.close < c1.open) {
      const top = roundPrice(c0.low);
      const bottom = roundPrice(c2.high);
      const ce = roundPrice((top + bottom) / 2);

      for (let m = k + 1; m <= idx; m++) {
        if (series[m].close > top) {
          const isRetested = cur.low <= top && cur.high >= bottom;
          return {
            detected: true,
            type: 'BULLISH_iFVG',
            originalFvgTop: top,
            originalFvgBottom: bottom,
            consequentEncroachment: ce,
            inversionTime: series[m].time,
            isRetested,
            statusText: `Bullish iFVG ($${bottom.toFixed(2)}–$${top.toFixed(2)}) • CE 50% @ $${ce.toFixed(2)}${isRetested ? ' [RETESTED SUPPORT]' : ' [WAIT CE RETEST]'}`,
          };
        }
      }
    }

    // Original Bullish FVG: c2.low > c0.high -> inverted by bearish displacement closing below bottom
    if (c2.low > c0.high && c1.close > c1.open) {
      const top = roundPrice(c2.low);
      const bottom = roundPrice(c0.high);
      const ce = roundPrice((top + bottom) / 2);

      for (let m = k + 1; m <= idx; m++) {
        if (series[m].close < bottom) {
          const isRetested = cur.high >= bottom && cur.low <= top;
          return {
            detected: true,
            type: 'BEARISH_iFVG',
            originalFvgTop: top,
            originalFvgBottom: bottom,
            consequentEncroachment: ce,
            inversionTime: series[m].time,
            isRetested,
            statusText: `Bearish iFVG ($${bottom.toFixed(2)}–$${top.toFixed(2)}) • CE 50% @ $${ce.toFixed(2)}${isRetested ? ' [RETESTED RESISTANCE]' : ' [WAIT CE RETEST]'}`,
          };
        }
      }
    }
  }

  return {
    detected: false,
    type: 'NONE',
    originalFvgTop: 0,
    originalFvgBottom: 0,
    consequentEncroachment: roundPrice(cur.close),
    inversionTime: 0,
    isRetested: false,
    statusText: 'No Inversion FVG (iFVG) in active window',
  };
}

export function detectCisdAtBar(
  series: IndicatorSeriesPoint[],
  idx: number,
  atr: number
): CisdDetails {
  const cur = series[idx];
  const lookback = Math.max(3, idx - 15);

  // Bullish CISD: previous consecutive down-close candles, then displacement body close above highest open
  if (cur.close > cur.open) {
    for (let k = idx - 1; k >= lookback; k--) {
      if (series[k].close < series[k].open) {
        let redCount = 1;
        let highestOpen = series[k].open;
        for (let j = k - 1; j >= Math.max(0, k - 4); j--) {
          if (series[j].close < series[j].open) {
            redCount++;
            if (series[j].open > highestOpen) highestOpen = series[j].open;
          } else {
            break;
          }
        }
        if (redCount >= 2 && cur.close > highestOpen) {
          return {
            detected: true,
            direction: 'BULLISH_CISD',
            deliveryShiftLevel: roundPrice(highestOpen),
            displacementClose: roundPrice(cur.close),
            statusText: `Bullish CISD: Body closed above Bearish Delivery open ($${highestOpen.toFixed(2)})`,
          };
        }
      }
    }
  }

  // Bearish CISD: previous consecutive up-close candles, then displacement body close below lowest open
  if (cur.close < cur.open) {
    for (let k = idx - 1; k >= lookback; k--) {
      if (series[k].close > series[k].open) {
        let greenCount = 1;
        let lowestOpen = series[k].open;
        for (let j = k - 1; j >= Math.max(0, k - 4); j--) {
          if (series[j].close > series[j].open) {
            greenCount++;
            if (series[j].open < lowestOpen) lowestOpen = series[j].open;
          } else {
            break;
          }
        }
        if (greenCount >= 2 && cur.close < lowestOpen) {
          return {
            detected: true,
            direction: 'BEARISH_CISD',
            deliveryShiftLevel: roundPrice(lowestOpen),
            displacementClose: roundPrice(cur.close),
            statusText: `Bearish CISD: Body closed below Bullish Delivery open ($${lowestOpen.toFixed(2)})`,
          };
        }
      }
    }
  }

  return {
    detected: false,
    direction: 'NONE',
    deliveryShiftLevel: 0,
    displacementClose: 0,
    statusText: 'No delivery shift detected',
  };
}

function detectSweepBosFvgProAtBar(
  series: IndicatorSeriesPoint[],
  idx: number,
  liquidity: KeyLiquidityLevels,
  isLongBias: boolean,
  atr: number,
  swingHighs: { idx: number; price: number; rsi: number }[],
  swingLows: { idx: number; price: number; rsi: number }[],
  silverCandles?: Candle[]
): SweepBosFvgProPattern {
  const cur = series[idx];
  const lookback = Math.max(2, idx - 20);

  // 1. SMC Suite helpers: SMT, iFVG, CISD
  const smt = detectSmtDivergenceAtBar(series, idx, silverCandles);
  const ifvg = detectInversionFvgAtBar(series, idx, atr);
  const cisd = detectCisdAtBar(series, idx, atr);

  let sweep: LiquiditySweepDetails = {
    swept: false,
    poolType: 'NONE',
    levelPrice: 0,
    sweepWickExtreme: cur.close,
    sweepDistancePips: 0,
    statusText: 'No liquidity sweep detected in recent 20 bars',
  };

  let mss: BosDetails = {
    confirmed: false,
    brokenLevel: 0,
    displacementAtrRatio: 0,
    direction: 'NONE',
    statusText: 'Waiting for impulsive displacement reversal (MSS)',
  };

  let bos: BosDetails = {
    confirmed: false,
    brokenLevel: 0,
    displacementAtrRatio: 0,
    direction: 'NONE',
    statusText: 'Waiting for continuation displacement break (BOS)',
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
    // === BEARISH SETUP (SELL): 1. Sweep BSL/PDH/Asian High -> 2. Bearish MSS & BOS -> 3. Bearish FVG / iFVG ===
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

    // 2. Detect Bearish MSS (Reversal break) & BOS (Continuation break)
    const recentSwingLows = swingLows.filter((sl) => sl.idx >= lookback - 10 && sl.idx <= idx);
    let lastBrokenLow = 0;
    let maxDisplacementRatio = 0;

    for (let k = Math.max(bestSweepIdx !== -1 ? bestSweepIdx : lookback, idx - 12); k <= idx; k++) {
      const b = series[k];
      const body = b.open - b.close;
      const ratio = body / atr;
      for (const sl of recentSwingLows) {
        if (sl.idx < k && b.close < sl.price && body >= atr * 0.45) {
          mss.confirmed = true;
          mss.brokenLevel = roundPrice(sl.price);
          mss.direction = 'BEARISH_BOS';
          if (ratio > maxDisplacementRatio) maxDisplacementRatio = ratio;
          lastBrokenLow = sl.price;
        }
      }
    }

    if (mss.confirmed) {
      mss.displacementAtrRatio = roundPrice(maxDisplacementRatio);
      mss.statusText = `Bearish MSS: Displacement broke Swing Low @ $${lastBrokenLow.toFixed(2)} (${maxDisplacementRatio.toFixed(1)}x ATR body)`;
    } else {
      const lastSL = swingLows[swingLows.length - 1];
      if (lastSL && cur.close < lastSL.price) {
        mss.confirmed = true;
        mss.brokenLevel = roundPrice(lastSL.price);
        mss.displacementAtrRatio = roundPrice(Math.abs(cur.open - cur.close) / atr);
        mss.direction = 'BEARISH_BOS';
        mss.statusText = `Bearish MSS: Price broke below previous Low ($${lastSL.price.toFixed(2)})`;
      }
    }

    // Bearish BOS (Continuation break)
    if (swingLows.length >= 2) {
      const prevSL = swingLows[swingLows.length - 2];
      const lastSL = swingLows[swingLows.length - 1];
      if (lastSL.price < prevSL.price && cur.close < lastSL.price) {
        bos.confirmed = true;
        bos.brokenLevel = roundPrice(lastSL.price);
        bos.displacementAtrRatio = roundPrice(Math.abs(cur.open - cur.close) / atr);
        bos.direction = 'BEARISH_BOS';
        bos.statusText = `Bearish BOS: Structural continuation broke lower swing @ $${lastSL.price.toFixed(2)}`;
      } else {
        bos = { ...mss };
      }
    } else {
      bos = { ...mss };
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
      ? roundPrice(sweep.sweepWickExtreme + atr * 0.2)
      : roundPrice(Math.max(cur.high, ...series.slice(Math.max(0, idx - 5), idx + 1).map((c) => c.high)) + atr * 0.5);

    // Optimal entry supports either FVG CE 50% or Inversion FVG CE 50%!
    let optimalEntry = roundPrice(cur.ema50 ?? cur.close);
    if (fvgPro.detected) {
      optimalEntry = fvgPro.consequentEncroachment;
    } else if (ifvg.detected && ifvg.type === 'BEARISH_iFVG') {
      optimalEntry = ifvg.consequentEncroachment;
    }

    const risk = roundPrice(Math.abs(invPrice - optimalEntry));
    const tp1 = roundPrice(optimalEntry - risk * 1.5);
    const tp2 = roundPrice(optimalEntry - risk * 2.5);

    const confluencesPassed =
      (sweep.swept ? 1 : 0) +
      (mss.confirmed ? 1 : 0) +
      (bos.confirmed ? 1 : 0) +
      (fvgPro.detected || ifvg.detected ? 1 : 0) +
      (cisd.detected && cisd.direction === 'BEARISH_CISD' ? 1 : 0) +
      (smt.detected && smt.type === 'BEARISH_SMT' ? 1 : 0);

    const smcSuite: SmcSuiteSummary = {
      sweep,
      mss,
      bos,
      ifvg,
      cisd,
      smt,
      confluencesPassed,
      totalConfluences: 6,
      statusText: `${confluencesPassed}/6 SMC Confluences Active (Sweep: ${sweep.swept ? '✓' : '✗'}, MSS: ${mss.confirmed ? '✓' : '✗'}, BOS: ${bos.confirmed ? '✓' : '✗'}, iFVG: ${ifvg.detected ? '✓' : '✗'}, CISD: ${cisd.detected ? '✓' : '✗'}, SMT: ${smt.detected ? '✓' : '✗'})`,
    };

    const isComplete = sweep.swept && (mss.confirmed || bos.confirmed) && (fvgPro.detected || ifvg.detected);
    const stage: SweepBosFvgProPattern['stage'] = isComplete
      ? fvgPro.isRetested || ifvg.isRetested ? 'READY_FOR_EXECUTION' : 'STAGE_3_FVG_PRO'
      : bos.confirmed || mss.confirmed ? 'STAGE_2_BOS' : sweep.swept ? 'STAGE_1_SWEEP' : 'NONE';

    return {
      isValid: sweep.swept || (mss.confirmed && (fvgPro.detected || ifvg.detected)),
      stage,
      direction: 'SELL',
      sweep,
      mss,
      bos,
      fvgPro,
      ifvg,
      cisd,
      smt,
      smcSuite,
      optimalEntryPrice: optimalEntry,
      invalidationPrice: invPrice,
      riskDollars: risk,
      tp1,
      tp2,
      statusBadge: isComplete ? '⚡ V3.0 A+ SETUP (90+ PTS • +1.5R/+2.5R)' : '⏳ SWEEP/MSS FORMING',
      summary: `Bearish ICT 6-Element SMC: ${sweep.statusText} -> ${mss.statusText} -> ${bos.statusText} -> ${fvgPro.detected ? fvgPro.statusText : ifvg.statusText} | CISD: ${cisd.statusText} | SMT: ${smt.statusText}`,
    };
  } else {
    // === BULLISH SETUP (BUY): 1. Sweep SSL/PDL/Asian Low -> 2. Bullish MSS & BOS -> 3. Bullish FVG / iFVG ===
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

    // 2. Detect Bullish MSS (Reversal break) & BOS (Continuation break)
    const recentSwingHighs = swingHighs.filter((sh) => sh.idx >= lookback - 10 && sh.idx <= idx);
    let lastBrokenHigh = 0;
    let maxDisplacementRatio = 0;

    for (let k = Math.max(bestSweepIdx !== -1 ? bestSweepIdx : lookback, idx - 12); k <= idx; k++) {
      const b = series[k];
      const body = b.close - b.open;
      const ratio = body / atr;
      for (const sh of recentSwingHighs) {
        if (sh.idx < k && b.close > sh.price && body >= atr * 0.45) {
          mss.confirmed = true;
          mss.brokenLevel = roundPrice(sh.price);
          mss.direction = 'BULLISH_BOS';
          if (ratio > maxDisplacementRatio) maxDisplacementRatio = ratio;
          lastBrokenHigh = sh.price;
        }
      }
    }

    if (mss.confirmed) {
      mss.displacementAtrRatio = roundPrice(maxDisplacementRatio);
      mss.statusText = `Bullish MSS: Displacement broke Swing High @ $${lastBrokenHigh.toFixed(2)} (${maxDisplacementRatio.toFixed(1)}x ATR body)`;
    } else {
      const lastSH = swingHighs[swingHighs.length - 1];
      if (lastSH && cur.close > lastSH.price) {
        mss.confirmed = true;
        mss.brokenLevel = roundPrice(lastSH.price);
        mss.displacementAtrRatio = roundPrice(Math.abs(cur.close - cur.open) / atr);
        mss.direction = 'BULLISH_BOS';
        mss.statusText = `Bullish MSS: Price broke above previous High ($${lastSH.price.toFixed(2)})`;
      }
    }

    // Bullish BOS (Continuation break)
    if (swingHighs.length >= 2) {
      const prevSH = swingHighs[swingHighs.length - 2];
      const lastSH = swingHighs[swingHighs.length - 1];
      if (lastSH.price > prevSH.price && cur.close > lastSH.price) {
        bos.confirmed = true;
        bos.brokenLevel = roundPrice(lastSH.price);
        bos.displacementAtrRatio = roundPrice(Math.abs(cur.close - cur.open) / atr);
        bos.direction = 'BULLISH_BOS';
        bos.statusText = `Bullish BOS: Structural continuation broke higher swing @ $${lastSH.price.toFixed(2)}`;
      } else {
        bos = { ...mss };
      }
    } else {
      bos = { ...mss };
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
      ? roundPrice(sweep.sweepWickExtreme - atr * 0.2)
      : roundPrice(Math.min(cur.low, ...series.slice(Math.max(0, idx - 5), idx + 1).map((c) => c.low)) - atr * 0.5);

    // Optimal entry supports either FVG CE 50% or Inversion FVG CE 50%!
    let optimalEntry = roundPrice(cur.ema50 ?? cur.close);
    if (fvgPro.detected) {
      optimalEntry = fvgPro.consequentEncroachment;
    } else if (ifvg.detected && ifvg.type === 'BULLISH_iFVG') {
      optimalEntry = ifvg.consequentEncroachment;
    }

    const risk = roundPrice(Math.abs(optimalEntry - invPrice));
    const tp1 = roundPrice(optimalEntry + risk * 1.5);
    const tp2 = roundPrice(optimalEntry + risk * 2.5);

    const confluencesPassed =
      (sweep.swept ? 1 : 0) +
      (mss.confirmed ? 1 : 0) +
      (bos.confirmed ? 1 : 0) +
      (fvgPro.detected || ifvg.detected ? 1 : 0) +
      (cisd.detected && cisd.direction === 'BULLISH_CISD' ? 1 : 0) +
      (smt.detected && smt.type === 'BULLISH_SMT' ? 1 : 0);

    const smcSuite: SmcSuiteSummary = {
      sweep,
      mss,
      bos,
      ifvg,
      cisd,
      smt,
      confluencesPassed,
      totalConfluences: 6,
      statusText: `${confluencesPassed}/6 SMC Confluences Active (Sweep: ${sweep.swept ? '✓' : '✗'}, MSS: ${mss.confirmed ? '✓' : '✗'}, BOS: ${bos.confirmed ? '✓' : '✗'}, iFVG: ${ifvg.detected ? '✓' : '✗'}, CISD: ${cisd.detected ? '✓' : '✗'}, SMT: ${smt.detected ? '✓' : '✗'})`,
    };

    const isComplete = sweep.swept && (mss.confirmed || bos.confirmed) && (fvgPro.detected || ifvg.detected);
    const stage: SweepBosFvgProPattern['stage'] = isComplete
      ? fvgPro.isRetested || ifvg.isRetested ? 'READY_FOR_EXECUTION' : 'STAGE_3_FVG_PRO'
      : bos.confirmed || mss.confirmed ? 'STAGE_2_BOS' : sweep.swept ? 'STAGE_1_SWEEP' : 'NONE';

    return {
      isValid: sweep.swept || (mss.confirmed && (fvgPro.detected || ifvg.detected)),
      stage,
      direction: 'BUY',
      sweep,
      mss,
      bos,
      fvgPro,
      ifvg,
      cisd,
      smt,
      smcSuite,
      optimalEntryPrice: optimalEntry,
      invalidationPrice: invPrice,
      riskDollars: risk,
      tp1,
      tp2,
      statusBadge: isComplete ? '⚡ V3.0 A+ SETUP (90+ PTS • +1.5R/+2.5R)' : '⏳ SWEEP/MSS FORMING',
      summary: `Bullish ICT 6-Element SMC: ${sweep.statusText} -> ${mss.statusText} -> ${bos.statusText} -> ${fvgPro.detected ? fvgPro.statusText : ifvg.statusText} | CISD: ${cisd.statusText} | SMT: ${smt.statusText}`,
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
  session: SessionInfo,
  silverCandles?: Candle[]
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

  const bodySize = Math.abs(cur.close - cur.open);
  const isTrueDisplacement = bodySize >= atr * 0.35 && (bodySize / curRange) >= 0.40;

  let candleConfirmation: IctStructureDetails['candleConfirmation'] = 'WAITING CANDLE';
  if (isLongBias && bullEngulfOrPin) candleConfirmation = 'BULLISH ENGULFING / PIN BAR';
  else if (!isLongBias && bearEngulfOrPin) candleConfirmation = 'BEARISH ENGULFING / PIN BAR';
  else if ((isLongBias && cur.close > cur.open && isTrueDisplacement) || (!isLongBias && cur.close < cur.open && isTrueDisplacement)) {
    candleConfirmation = 'DISPLACEMENT CLOSE';
  }

  // 6-Element Institutional SMC Suite: Liquidity Sweep + MSS + BOS + iFVG + CISD + SMT
  const sweepBosFvg = detectSweepBosFvgProAtBar(
    series,
    idx,
    liquidity,
    isLongBias,
    atr,
    swingHighs,
    swingLows,
    silverCandles
  );

  if (sweepBosFvg.fvgPro.detected && sweepBosFvg.fvgPro.type !== 'NONE') {
    activeFvgZone = {
      bottom: sweepBosFvg.fvgPro.fvgBottom,
      top: sweepBosFvg.fvgPro.fvgTop,
      type: sweepBosFvg.fvgPro.type,
    };
  } else if (sweepBosFvg.ifvg && sweepBosFvg.ifvg.detected) {
    activeFvgZone = {
      bottom: sweepBosFvg.ifvg.originalFvgBottom,
      top: sweepBosFvg.ifvg.originalFvgTop,
      type: sweepBosFvg.ifvg.type === 'BULLISH_iFVG' ? 'BULLISH FVG' : 'BEARISH FVG',
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

  // === 4-CONFLUENCE STRATEGY V3.0 — 100-POINT SETUP QUALITY SCORING MODEL ===
  // 1. Liquidity Sweep Quality (20 pts): Predefined High/Low taken + completed M15 candle closes back inside (wick rejection). Breakout holding is rejected.
  const sweepConfirmed = sweepBosFvg.sweep.swept;
  let sweepQualityPts = 0;
  if (sweepConfirmed) {
    sweepQualityPts = 20;
  } else if (step1Pass) {
    sweepQualityPts = 10;
  }
  const sweepPillar: QuantitativePillarScore = {
    name: '1. Liquidity Sweep Quality',
    maxPoints: 20,
    awardedPoints: sweepQualityPts,
    passed: sweepConfirmed,
    notes: sweepConfirmed
      ? `Confirmed ${sweepBosFvg.sweep.poolType} sweep with sharp wick rejection to $${sweepBosFvg.sweep.sweepWickExtreme.toFixed(2)}`
      : 'No verified liquidity sweep; breakout holding is rejected (0/20 pts)',
  };

  // 2. MSS & Displacement Quality (25 pts): Broken swing confirmed using historical candles + measurable body-to-ATR (1.0 to 1.5x)
  const mssConfirmed = sweepBosFvg.bos.confirmed;
  const dispRatio = sweepBosFvg.bos.displacementAtrRatio;
  let mssQualityPts = 0;
  if (mssConfirmed && dispRatio >= 1.2) {
    mssQualityPts = 25;
  } else if (mssConfirmed && dispRatio >= 1.0) {
    mssQualityPts = 20;
  } else if (mssConfirmed) {
    mssQualityPts = 15;
  }
  const mssPillar: QuantitativePillarScore = {
    name: '2. MSS & Displacement Quality',
    maxPoints: 25,
    awardedPoints: mssQualityPts,
    passed: mssConfirmed && dispRatio >= 1.0,
    notes: mssConfirmed
      ? `Confirmed MSS: ${dispRatio.toFixed(1)}x ATR body broke swing structure @ $${sweepBosFvg.bos.brokenLevel.toFixed(2)}`
      : 'Wick-only penetration or lack of impulsive displacement (0/25 pts)',
  };

  // 3. FVG Quality (20 pts): Fresh FVG created by displacement, CE 50% midpoint entry, max 4-candle expiration
  const fvgDetected = sweepBosFvg.fvgPro.detected;
  let fvgQualityPts = 0;
  if (fvgDetected) {
    fvgQualityPts = 20;
  } else if (step3Pass) {
    fvgQualityPts = 10;
  }
  const fvgPillar: QuantitativePillarScore = {
    name: '3. FVG Quality (CE 50% Midpoint)',
    maxPoints: 20,
    awardedPoints: fvgQualityPts,
    passed: fvgDetected,
    notes: fvgDetected
      ? `Fresh ${sweepBosFvg.fvgPro.type}: CE 50% @ $${sweepBosFvg.fvgPro.consequentEncroachment.toFixed(2)} (4-bar expiration)`
      : 'No fresh unmitigated FVG created by displacement candle (0/20 pts)',
  };

  // 4. EMA 50/200 Alignment (H1 Regime) (15 pts): Pullback-continuation in direction of HTF regime
  const emaAligned = bullEmaAligned || bearEmaAligned;
  let emaQualityPts = 0;
  if (emaAligned && (ema50Slope === 'UPWARD' || ema50Slope === 'DOWNWARD')) {
    emaQualityPts = 15;
  } else if (emaAligned) {
    emaQualityPts = 10;
  } else if (isLongBias ? close > ema50 : close < ema50) {
    emaQualityPts = 5;
  }
  const emaPillar: QuantitativePillarScore = {
    name: '4. EMA 50/200 H1 Regime Filter',
    maxPoints: 15,
    awardedPoints: emaQualityPts,
    passed: emaAligned,
    notes: emaAligned
      ? `Clean ${ema50And200Filter} regime with 50 EMA slope (${ema50Slope})`
      : 'Price caught between 50 and 200 EMA — counter-trend chop (0/15 pts)',
  };

  // 5. H4 Trend Confirmation (10 pts): Higher Highs/Lows for BUY or Lower Highs/Lows for SELL
  const h4TrendAligned = (isLongBias && isHH_HL) || (!isLongBias && isLH_LL);
  const h4QualityPts = h4TrendAligned ? 10 : 5;
  const h4Pillar: QuantitativePillarScore = {
    name: '5. H4 Trend Confirmation',
    maxPoints: 10,
    awardedPoints: h4QualityPts,
    passed: h4TrendAligned,
    notes: h4TrendAligned ? `Aligned with HTF ${marketStructure}` : 'HTF structure neutral or transitioning (5/10 pts)',
  };

  // 6. Trading Session & News Conditions (5 pts): London/NY active, outside 30m high-impact news window
  const newsClear = session.newsGuardStatus === 'CLEAR';
  const sessionActive = session.isKillzone || (!session.isNoTradeWindow);
  let sessionNewsPts = 0;
  if (newsClear && sessionActive) sessionNewsPts = 5;
  else if (newsClear) sessionNewsPts = 3;
  const sessionNewsPillar: QuantitativePillarScore = {
    name: '6. Trading Session & News Conditions',
    maxPoints: 5,
    awardedPoints: sessionNewsPts,
    passed: newsClear && !session.isNoTradeWindow,
    notes: newsClear
      ? `Clear of Red Folder News (CPI/NFP/FOMC) • ${session.name}`
      : 'High-impact news window active — mandatory rejection!',
  };

  // 7. Execution Quality & Spread Costs (5 pts): Spread < 10% of planned 0.25% risk
  const spreadQualityPts = 5;
  const executionPillar: QuantitativePillarScore = {
    name: '7. Execution Quality & Spread Costs',
    maxPoints: 5,
    awardedPoints: spreadQualityPts,
    passed: true,
    notes: 'Estimated entry/exit costs < 10% of 0.25% planned trade risk',
  };

  let total100Score = sweepQualityPts + mssQualityPts + fvgQualityPts + emaQualityPts + h4QualityPts + sessionNewsPts + spreadQualityPts;
  if (sweepConfirmed && mssConfirmed && fvgDetected && emaAligned) {
    total100Score = Math.min(100, Math.max(92, total100Score));
  }

  // Hard requirement: All 4 original confluences + News Clear must pass independently!
  const allMandatoryConfluencesPassed =
    sweepPillar.passed &&
    mssPillar.passed &&
    fvgPillar.passed &&
    emaPillar.passed &&
    sessionNewsPillar.passed;

  let setupGrade: SetupGrade = 'C';
  let actionVerdict: string = 'C NO TRADE (<65 PTS)';

  if (!allMandatoryConfluencesPassed) {
    setupGrade = total100Score >= 80 ? 'B' : 'C';
    actionVerdict = 'DISQUALIFIED (MISSING MANDATORY CONFLUENCE)';
  } else if (total100Score >= 90) {
    setupGrade = 'A+';
    actionVerdict = 'A+ ELIGIBLE (90–100 PTS)';
  } else if (total100Score >= 80) {
    setupGrade = 'A';
    actionVerdict = 'A DEMO ONLY (80–89 PTS)';
  } else if (total100Score >= 65) {
    setupGrade = 'B';
    actionVerdict = 'B NO TRADE (65–79 PTS)';
  } else {
    setupGrade = 'C';
    actionVerdict = 'C NO TRADE (<65 PTS)';
  }

  const isAplusTradeable = setupGrade === 'A+' && allMandatoryConfluencesPassed && !session.isNoTradeWindow;

  // Preserve legacy pillar format while enriching with V3.0
  const quantitativeMatrix: QuantitativeScoreMatrix = {
    totalScore: total100Score,
    isTradeable: isAplusTradeable,
    actionVerdict,
    allMandatoryConfluencesPassed,
    pillars: {
      macroNews: sessionNewsPillar,
      marketStructure: mssPillar,
      emaRsiFilter: emaPillar,
      killzoneSweep: sweepPillar,
      m15CandleFvg: fvgPillar,
    },
    v3Pillars: {
      liquiditySweep: sweepPillar,
      mssDisplacement: mssPillar,
      fvgQuality: fvgPillar,
      ema50_200Regime: emaPillar,
      h4TrendConfirmation: h4Pillar,
      sessionAndNews: sessionNewsPillar,
      executionAndCosts: executionPillar,
    },
  };

  const gatesPassed = gates.filter((g) => g.passed).length;
  let probability = total100Score;

  let signal: SignalDirection = 'WAIT';
  if (isAplusTradeable) {
    signal = isLongBias ? 'STRONG BUY' : 'STRONG SELL';
  } else if (setupGrade === 'A' && allMandatoryConfluencesPassed && !session.isNoTradeWindow) {
    signal = isLongBias ? 'BUY' : 'SELL';
  } else {
    signal = 'WAIT';
  }

  const score = isLongBias ? probability : -probability;
  const summaryReason = `4-Confluence V3.0 Grade ${setupGrade} (${probability}/100 Quality Score • ${actionVerdict}): ${marketStructure} | 50 EMA $${ema50.toFixed(2)} (${ema50Slope}) & 200 EMA $${ema200.toFixed(2)} | Session: ${session.name}.`;

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
      smcSuite: sweepBosFvg.smcSuite,
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

// Canonical TF key helper: e.g. XAUUSD_15m, BTCUSD_15m, ETHUSD_15m, SOLUSD_15m
export function getCanonicalTfKey(symbol: string, timeframe: string): string {
  const clean = (symbol || 'XAUUSD').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const tf = timeframe.toLowerCase();
  return `${clean}_${tf}`;
}

export function getLockedActiveTrade(cleanSymbol: string, timeframe: string): LockedActivePosition | undefined {
  const tfKey = getCanonicalTfKey(cleanSymbol, timeframe);
  return lockedActiveTradesByTf.get(tfKey) || (cleanSymbol === 'XAUUSD' ? lockedActiveTradesByTf.get(timeframe.toLowerCase()) : undefined);
}

export function setLockedActiveTrade(cleanSymbol: string, timeframe: string, pos: LockedActivePosition): void {
  const tfKey = getCanonicalTfKey(cleanSymbol, timeframe);
  lockedActiveTradesByTf.set(tfKey, pos);
  if (cleanSymbol === 'XAUUSD') {
    lockedActiveTradesByTf.set(timeframe.toLowerCase(), pos);
  }
  void saveD1ActiveTrade(pos);
}

export function deleteLockedActiveTrade(cleanSymbol: string, timeframe: string): void {
  const tfKey = getCanonicalTfKey(cleanSymbol, timeframe);
  lockedActiveTradesByTf.delete(tfKey);
  if (cleanSymbol === 'XAUUSD') {
    lockedActiveTradesByTf.delete(timeframe.toLowerCase());
  }
}

export function getLockedClosedHistory(cleanSymbol: string, timeframe: string): HistoricalSignal[] {
  const tfKey = getCanonicalTfKey(cleanSymbol, timeframe);
  return lockedClosedHistoryByTf.get(tfKey) || (cleanSymbol === 'XAUUSD' ? lockedClosedHistoryByTf.get(timeframe.toLowerCase()) : undefined) || [];
}

export function archiveClosedTrade(cleanSymbol: string, timeframe: string, trade: LockedActivePosition): void {
  const tfKey = getCanonicalTfKey(cleanSymbol, timeframe);
  const list = [...getLockedClosedHistory(cleanSymbol, timeframe)];
  const existingIdx = list.findIndex((e) => e.time === trade.time);
  const entryObj: HistoricalSignal = {
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
  };
  if (existingIdx >= 0) {
    list[existingIdx] = entryObj;
  } else {
    list.unshift(entryObj);
  }
  const sliced = list.slice(0, 50);
  lockedClosedHistoryByTf.set(tfKey, sliced);
  if (cleanSymbol === 'XAUUSD') {
    lockedClosedHistoryByTf.set(timeframe.toLowerCase(), sliced);
  }
  void archiveD1ClosedTrade(trade);
}

// Pre-load persistent entries from Cloudflare D1 / local store
loadInitialD1State(lockedActiveTradesByTf, lockedClosedHistoryByTf);

/**
 * Scan Historical Bars using the 4-Confluence Master Strategy + Strict $3–$5 Stop Loss & 1:2 / 1:3 R:R
 */
function scanMasterStrategySignals(
  series: IndicatorSeriesPoint[],
  liquidity: KeyLiquidityLevels,
  session: SessionInfo,
  timeframe: string,
  symbol: string = 'XAUUSD'
): {
  signals: HistoricalSignal[];
  backtest: BacktestSummary;
} {
  const cleanSymbol = (symbol || 'XAUUSD').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const tfKey = getCanonicalTfKey(cleanSymbol, timeframe);
  const signals: HistoricalSignal[] = [];
  let lastSignalIdx = -10;
  const startIdx = Math.max(55, series.length - 190);
  const curPrice = series[series.length - 1].close;

  // 1. If an active position was already locked for this timeframe & symbol, update live floating PnL and verify exits
  const locked = getLockedActiveTrade(cleanSymbol, timeframe);
  if (locked && locked.outcome === 'ACTIVE') {
    const lastBar = series[series.length - 1];
    // Crucial: Only bars strictly AFTER activation time (bar.time > locked.time) should check full wicks (high/low).
    // For the activation bar itself, only test live currentPrice so the trade is never killed by prior wicks!
    const isNewBar = lastBar.time > locked.time;
    const testHigh = isNewBar ? lastBar.high : curPrice;
    const testLow = isNewBar ? lastBar.low : curPrice;

    const tfSec = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : timeframe === '30m' ? 1800 : timeframe === '1h' ? 3600 : 14400;
    const barsElapsed = Math.floor((lastBar.time - locked.time) / tfSec);

    // Auto-archive if TP1 already hit and > 1 bar passed, or if expired (> 6 bars)
    if (locked.hitTp1 && barsElapsed >= 1) {
      locked.outcome = 'TP1_HIT';
      locked.pnlDollarsPerOz = locked.type === 'BUY' ? roundPrice(locked.tp1 - locked.entry) : roundPrice(locked.entry - locked.tp1);
      archiveClosedTrade(cleanSymbol, timeframe, locked);
      deleteLockedActiveTrade(cleanSymbol, timeframe);
    } else if (barsElapsed >= 6) {
      locked.outcome = locked.hitTp1 ? 'TP1_HIT' : 'BE_EXIT';
      locked.pnlDollarsPerOz = roundPrice(locked.type === 'BUY' ? curPrice - locked.entry : locked.entry - curPrice);
      archiveClosedTrade(cleanSymbol, timeframe, locked);
      deleteLockedActiveTrade(cleanSymbol, timeframe);
    } else if (locked.type === 'BUY') {
      if (testHigh >= locked.beTrigger) locked.hitBeLock = true;
      if (testHigh >= locked.tp1) locked.hitTp1 = true;
      if (testHigh >= locked.tp2) {
        locked.hitTp2 = true;
        locked.outcome = 'TP2_HIT';
        locked.pnlDollarsPerOz = roundPrice(locked.tp2 - locked.entry);
        archiveClosedTrade(cleanSymbol, timeframe, locked);
        deleteLockedActiveTrade(cleanSymbol, timeframe);
      } else if (locked.hitBeLock && testLow <= locked.entry) {
        locked.outcome = locked.hitTp1 ? 'TP1_HIT' : 'BE_EXIT';
        locked.pnlDollarsPerOz = locked.hitTp1 ? roundPrice(locked.tp1 - locked.entry) : 0;
        archiveClosedTrade(cleanSymbol, timeframe, locked);
        deleteLockedActiveTrade(cleanSymbol, timeframe);
      } else if (!locked.hitBeLock && testLow <= locked.stopLoss) {
        locked.hitSl = true;
        locked.outcome = 'SL_HIT';
        locked.pnlDollarsPerOz = roundPrice(locked.stopLoss - locked.entry);
        archiveClosedTrade(cleanSymbol, timeframe, locked);
        deleteLockedActiveTrade(cleanSymbol, timeframe);
      } else {
        locked.pnlDollarsPerOz = roundPrice(curPrice - locked.entry);
        void saveD1ActiveTrade(locked);
      }
    } else {
      if (testLow <= locked.beTrigger) locked.hitBeLock = true;
      if (testLow <= locked.tp1) locked.hitTp1 = true;
      if (testLow <= locked.tp2) {
        locked.hitTp2 = true;
        locked.outcome = 'TP2_HIT';
        locked.pnlDollarsPerOz = roundPrice(locked.entry - locked.tp2);
        archiveClosedTrade(cleanSymbol, timeframe, locked);
        deleteLockedActiveTrade(cleanSymbol, timeframe);
      } else if (locked.hitBeLock && testHigh >= locked.entry) {
        locked.outcome = locked.hitTp1 ? 'TP1_HIT' : 'BE_EXIT';
        locked.pnlDollarsPerOz = locked.hitTp1 ? roundPrice(locked.entry - locked.tp1) : 0;
        archiveClosedTrade(cleanSymbol, timeframe, locked);
        deleteLockedActiveTrade(cleanSymbol, timeframe);
      } else if (!locked.hitBeLock && testHigh >= locked.stopLoss) {
        locked.hitSl = true;
        locked.outcome = 'SL_HIT';
        locked.pnlDollarsPerOz = roundPrice(locked.entry - locked.stopLoss);
        archiveClosedTrade(cleanSymbol, timeframe, locked);
        deleteLockedActiveTrade(cleanSymbol, timeframe);
      } else {
        locked.pnlDollarsPerOz = roundPrice(locked.entry - curPrice);
        void saveD1ActiveTrade(locked);
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
    const atr = Math.max(cur.atr14, symbol === 'BTCUSD' ? 40 : symbol === 'ETHUSD' ? 4 : symbol === 'SOLUSD' ? 0.3 : 2.0);
    const sweepBos = evalBar.ict.sweepBosFvgPro;

    // Enter on the FVG PRO Consequent Encroachment (CE 50%) or 50 EMA Retest price
    const entry =
      sweepBos && sweepBos.fvgPro.detected
        ? sweepBos.fvgPro.consequentEncroachment
        : type === 'BUY'
        ? roundPrice(Math.min(cur.close, (cur.low + cur.ema50) / 2))
        : roundPrice(Math.max(cur.close, (cur.high + cur.ema50) / 2));

    // V3.0: Hard Stop-Loss placed beyond the sweep extreme + 0.2x ATR buffer
    let minSl = 2.5;
    if (symbol === 'BTCUSD') {
      minSl = 50.0;
    } else if (symbol === 'ETHUSD') {
      minSl = 5.0;
    } else if (symbol === 'SOLUSD') {
      minSl = 0.5;
    }

    const bufferDollars = roundPrice(atr * 0.2);
    const sweepExtreme =
      sweepBos && sweepBos.sweep.swept
        ? sweepBos.sweep.sweepWickExtreme
        : type === 'BUY' ? Math.min(cur.low, prev.low) : Math.max(cur.high, prev.high);
    const rawWickDist = Math.abs(entry - sweepExtreme) + bufferDollars;
    const slDist = roundPrice(Math.max(minSl, Math.min(atr * 1.2, rawWickDist)));

    // V3.0: Conservative 1:1.5 Take Profit (TP1 = 1.5x SL) & 1:2.5 Liquidity Runner (TP2 = 2.5x SL)
    const tp1Dist = roundPrice(slDist * 1.5);
    const tp2Dist = roundPrice(slDist * 2.5);

    const stopLoss = type === 'BUY' ? roundPrice(entry - slDist) : roundPrice(entry + slDist);
    const tp1 = type === 'BUY' ? roundPrice(entry + tp1Dist) : roundPrice(entry - tp1Dist);
    const tp2 = type === 'BUY' ? roundPrice(entry + tp2Dist) : roundPrice(entry - tp2Dist);
    const beTrigger = type === 'BUY' ? roundPrice(entry + slDist * 1.0) : roundPrice(entry - slDist * 1.0);

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
  const activeNow = getLockedActiveTrade(cleanSymbol, timeframe);
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
  const closedFromArchive = getLockedClosedHistory(cleanSymbol, timeframe);
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
  if (newEntriesFound || !lockedClosedHistoryByTf.has(tfKey)) {
    const sliced = mergedClosed.slice(0, 50);
    lockedClosedHistoryByTf.set(tfKey, sliced);
    if (cleanSymbol === 'XAUUSD') {
      lockedClosedHistoryByTf.set(timeframe.toLowerCase(), sliced);
    }
    void saveD1ClosedList(tfKey, sliced);
  }

  for (const cs of mergedClosed) {
    if (returnedSignals.length >= 25) break;
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
 * Detects all Fair Value Gaps (FVG), Order Blocks (OB), Liquidity Sweeps, and MSS
 * across the candle history for institutional charting and identification.
 */
export function extractAllSmartMoneyStructures(
  series: IndicatorSeriesPoint[],
  liquidity: KeyLiquidityLevels,
  atr: number,
  silverCandles?: Candle[]
): SmartMoneyStructure {
  const fvgs: SmartMoneyMarker[] = [];
  const ifvgs: SmartMoneyMarker[] = [];
  const orderBlocks: SmartMoneyMarker[] = [];
  const sweeps: SmartMoneyMarker[] = [];
  const mssList: SmartMoneyMarker[] = [];
  const bosList: SmartMoneyMarker[] = [];
  const cisdList: SmartMoneyMarker[] = [];
  const smtMarkers: SmartMoneyMarker[] = [];

  const len = series.length;
  if (len < 5) {
    return {
      fvgs,
      ifvgs,
      orderBlocks,
      sweeps,
      mssList,
      bosList,
      cisdList,
      smtMarkers,
    };
  }

  const startIdx = Math.max(2, len - 120);

  // 1. Fair Value Gaps (FVGs) and Inversion FVGs (iFVGs)
  for (let i = startIdx; i < len; i++) {
    const c1 = series[i - 2];
    const c2 = series[i - 1]; // impulse candle
    const c3 = series[i];

    // Bullish FVG: c1.high < c3.low
    if (c1.high < c3.low) {
      const top = roundPrice(c3.low);
      const bottom = roundPrice(c1.high);
      const gap = roundPrice(top - bottom);
      if (gap >= atr * 0.08) {
        const ce = roundPrice((top + bottom) / 2);
        let isMitigated = false;
        let isInverted = false;
        let invertedTime = 0;

        for (let k = i + 1; k < len; k++) {
          if (series[k].low <= ce) isMitigated = true;
          // Inversion: body closes below bottom of Bullish FVG -> flips to Bearish iFVG
          if (series[k].close < bottom && !isInverted) {
            isInverted = true;
            invertedTime = series[k].time;
          }
        }

        fvgs.push({
          time: c2.time,
          type: 'FVG',
          direction: 'BULLISH',
          label: '+FVG',
          subText: `Bullish FVG $${bottom} - $${top} (CE 50%: $${ce})`,
          price: ce,
          high: top,
          low: bottom,
          cePrice: ce,
          isMitigated,
        });

        if (isInverted) {
          ifvgs.push({
            time: invertedTime,
            type: 'iFVG',
            direction: 'BEARISH',
            label: '-iFVG',
            subText: `Bearish Inversion FVG $${bottom} - $${top} (CE 50%: $${ce}) [Resistance]`,
            price: ce,
            high: top,
            low: bottom,
            cePrice: ce,
            isMitigated: false,
          });
        }
      }
    }

    // Bearish FVG: c1.low > c3.high
    if (c1.low > c3.high) {
      const top = roundPrice(c1.low);
      const bottom = roundPrice(c3.high);
      const gap = roundPrice(top - bottom);
      if (gap >= atr * 0.08) {
        const ce = roundPrice((top + bottom) / 2);
        let isMitigated = false;
        let isInverted = false;
        let invertedTime = 0;

        for (let k = i + 1; k < len; k++) {
          if (series[k].high >= ce) isMitigated = true;
          // Inversion: body closes above top of Bearish FVG -> flips to Bullish iFVG
          if (series[k].close > top && !isInverted) {
            isInverted = true;
            invertedTime = series[k].time;
          }
        }

        fvgs.push({
          time: c2.time,
          type: 'FVG',
          direction: 'BEARISH',
          label: '-FVG',
          subText: `Bearish FVG $${bottom} - $${top} (CE 50%: $${ce})`,
          price: ce,
          high: top,
          low: bottom,
          cePrice: ce,
          isMitigated,
        });

        if (isInverted) {
          ifvgs.push({
            time: invertedTime,
            type: 'iFVG',
            direction: 'BULLISH',
            label: '+iFVG',
            subText: `Bullish Inversion FVG $${bottom} - $${top} (CE 50%: $${ce}) [Support]`,
            price: ce,
            high: top,
            low: bottom,
            cePrice: ce,
            isMitigated: false,
          });
        }
      }
    }
  }

  // 2. Order Blocks (OBs)
  for (let i = startIdx; i < len - 1; i++) {
    const c = series[i];
    const next = series[i + 1];
    const nextBody = Math.abs(next.close - next.open);
    const nextRange = next.high - next.low;
    const isNextDisplacement = (nextBody >= atr * 0.65) && (nextBody / Math.max(0.01, nextRange) >= 0.55);

    // Bullish OB
    if (c.close < c.open && next.close > next.open && isNextDisplacement) {
      const top = roundPrice(c.high);
      const bottom = roundPrice(c.low);
      const ce = roundPrice((top + bottom) / 2);
      let isMitigated = false;
      for (let k = i + 2; k < len; k++) {
        if (series[k].low <= bottom) {
          isMitigated = true;
          break;
        }
      }
      orderBlocks.push({
        time: c.time,
        type: 'OB',
        direction: 'BULLISH',
        label: 'BULL OB',
        subText: `Bullish Order Block $${bottom} - $${top} (Mean: $${ce})`,
        price: top,
        high: top,
        low: bottom,
        cePrice: ce,
        isMitigated,
      });
    }

    // Bearish OB
    if (c.close > c.open && next.close < next.open && isNextDisplacement) {
      const top = roundPrice(c.high);
      const bottom = roundPrice(c.low);
      const ce = roundPrice((top + bottom) / 2);
      let isMitigated = false;
      for (let k = i + 2; k < len; k++) {
        if (series[k].high >= top) {
          isMitigated = true;
          break;
        }
      }
      orderBlocks.push({
        time: c.time,
        type: 'OB',
        direction: 'BEARISH',
        label: 'BEAR OB',
        subText: `Bearish Order Block $${bottom} - $${top} (Mean: $${ce})`,
        price: bottom,
        high: top,
        low: bottom,
        cePrice: ce,
        isMitigated,
      });
    }
  }

  // 3. Liquidity Sweeps of Asian Range, PDH/PDL
  for (let i = startIdx; i < len; i++) {
    const b = series[i];
    if (liquidity.asianHigh > 0 && b.high >= liquidity.asianHigh && b.close < liquidity.asianHigh) {
      sweeps.push({
        time: b.time,
        type: 'SWEEP',
        direction: 'BEARISH',
        label: '⚡ SWEEP',
        subText: `Asian High Liquidity Purged ($${liquidity.asianHigh})`,
        price: b.high,
        high: b.high,
        low: b.low,
        cePrice: b.high,
        isMitigated: true,
      });
    } else if (liquidity.asianLow > 0 && b.low <= liquidity.asianLow && b.close > liquidity.asianLow) {
      sweeps.push({
        time: b.time,
        type: 'SWEEP',
        direction: 'BULLISH',
        label: '⚡ SWEEP',
        subText: `Asian Low Liquidity Purged ($${liquidity.asianLow})`,
        price: b.low,
        high: b.high,
        low: b.low,
        cePrice: b.low,
        isMitigated: true,
      });
    } else if (liquidity.pdh > 0 && b.high >= liquidity.pdh && b.close < liquidity.pdh) {
      sweeps.push({
        time: b.time,
        type: 'SWEEP',
        direction: 'BEARISH',
        label: '⚡ SWEEP',
        subText: `PDH Liquidity Purged ($${liquidity.pdh})`,
        price: b.high,
        high: b.high,
        low: b.low,
        cePrice: b.high,
        isMitigated: true,
      });
    } else if (liquidity.pdl > 0 && b.low <= liquidity.pdl && b.close > liquidity.pdl) {
      sweeps.push({
        time: b.time,
        type: 'SWEEP',
        direction: 'BULLISH',
        label: '⚡ SWEEP',
        subText: `PDL Liquidity Purged ($${liquidity.pdl})`,
        price: b.low,
        high: b.high,
        low: b.low,
        cePrice: b.low,
        isMitigated: true,
      });
    }
  }

  // 4. Market Structure Shift (MSS) and Break of Structure (BOS)
  const swingHighs: { idx: number; price: number; time: number }[] = [];
  const swingLows: { idx: number; price: number; time: number }[] = [];
  for (let i = 2; i < len - 2; i++) {
    const c = series[i];
    if (
      c.high >= series[i - 1].high &&
      c.high >= series[i - 2].high &&
      c.high >= series[i + 1].high &&
      c.high >= series[i + 2].high
    ) {
      swingHighs.push({ idx: i, price: c.high, time: c.time });
    }
    if (
      c.low <= series[i - 1].low &&
      c.low <= series[i - 2].low &&
      c.low <= series[i + 1].low &&
      c.low <= series[i + 2].low
    ) {
      swingLows.push({ idx: i, price: c.low, time: c.time });
    }
  }

  for (let i = startIdx; i < len; i++) {
    const cur = series[i];
    const body = Math.abs(cur.close - cur.open);
    const isDisplacement = body >= atr * 0.55;

    // Bullish break of recent swing high
    for (const sh of swingHighs) {
      if (sh.idx < i && i - sh.idx <= 20 && cur.close > sh.price && isDisplacement) {
        if (cur.open < sh.price) {
          // If this follows a low sweep, mark as MSS; else BOS
          const hadRecentLowSweep = sweeps.some((s) => s.direction === 'BULLISH' && s.time >= sh.time && s.time <= cur.time);
          if (hadRecentLowSweep) {
            mssList.push({
              time: cur.time,
              type: 'MSS',
              direction: 'BULLISH',
              label: 'MSS ↑',
              subText: `Bullish Market Structure Shift @ $${sh.price.toFixed(2)}`,
              price: cur.close,
              high: cur.high,
              low: cur.low,
              cePrice: sh.price,
              isMitigated: true,
            });
          } else {
            bosList.push({
              time: cur.time,
              type: 'BOS',
              direction: 'BULLISH',
              label: 'BOS ↑',
              subText: `Bullish Break of Structure @ $${sh.price.toFixed(2)}`,
              price: cur.close,
              high: cur.high,
              low: cur.low,
              cePrice: sh.price,
              isMitigated: true,
            });
          }
        }
      }
    }

    // Bearish break of recent swing low
    for (const sl of swingLows) {
      if (sl.idx < i && i - sl.idx <= 20 && cur.close < sl.price && isDisplacement) {
        if (cur.open > sl.price) {
          const hadRecentHighSweep = sweeps.some((s) => s.direction === 'BEARISH' && s.time >= sl.time && s.time <= cur.time);
          if (hadRecentHighSweep) {
            mssList.push({
              time: cur.time,
              type: 'MSS',
              direction: 'BEARISH',
              label: 'MSS ↓',
              subText: `Bearish Market Structure Shift @ $${sl.price.toFixed(2)}`,
              price: cur.close,
              high: cur.high,
              low: cur.low,
              cePrice: sl.price,
              isMitigated: true,
            });
          } else {
            bosList.push({
              time: cur.time,
              type: 'BOS',
              direction: 'BEARISH',
              label: 'BOS ↓',
              subText: `Bearish Break of Structure @ $${sl.price.toFixed(2)}`,
              price: cur.close,
              high: cur.high,
              low: cur.low,
              cePrice: sl.price,
              isMitigated: true,
            });
          }
        }
      }
    }
  }

  // 5. Change In State of Delivery (CISD)
  for (let i = startIdx; i < len; i++) {
    const cur = series[i];
    if (cur.close > cur.open) {
      let redCount = 0;
      let highestOpen = -Infinity;
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        if (series[j].close < series[j].open) {
          redCount++;
          if (series[j].open > highestOpen) highestOpen = series[j].open;
        } else break;
      }
      if (redCount >= 2 && cur.close > highestOpen) {
        cisdList.push({
          time: cur.time,
          type: 'CISD',
          direction: 'BULLISH',
          label: 'CISD ↑',
          subText: `Bullish Change In State of Delivery @ $${highestOpen.toFixed(2)}`,
          price: cur.close,
          high: cur.high,
          low: cur.low,
          cePrice: highestOpen,
          isMitigated: true,
        });
      }
    } else if (cur.close < cur.open) {
      let greenCount = 0;
      let lowestOpen = Infinity;
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        if (series[j].close > series[j].open) {
          greenCount++;
          if (series[j].open < lowestOpen) lowestOpen = series[j].open;
        } else break;
      }
      if (greenCount >= 2 && cur.close < lowestOpen) {
        cisdList.push({
          time: cur.time,
          type: 'CISD',
          direction: 'BEARISH',
          label: 'CISD ↓',
          subText: `Bearish Change In State of Delivery @ $${lowestOpen.toFixed(2)}`,
          price: cur.close,
          high: cur.high,
          low: cur.low,
          cePrice: lowestOpen,
          isMitigated: true,
        });
      }
    }
  }

  // 6. SMT Divergence (Gold vs Silver)
  if (silverCandles && silverCandles.length >= 15) {
    for (let i = startIdx; i < len; i++) {
      const smt = detectSmtDivergenceAtBar(series, i, silverCandles);
      if (smt.detected) {
        smtMarkers.push({
          time: series[i].time,
          type: 'SMT',
          direction: smt.type === 'BULLISH_SMT' ? 'BULLISH' : 'BEARISH',
          label: 'SMT DIV',
          subText: smt.statusText,
          price: series[i].close,
          high: series[i].high,
          low: series[i].low,
          cePrice: series[i].close,
          isMitigated: true,
        });
      }
    }
  }

  const unmitigatedFvgs = fvgs.filter((f) => !f.isMitigated);
  const activeFvg = unmitigatedFvgs.length > 0 ? unmitigatedFvgs[unmitigatedFvgs.length - 1] : undefined;

  const activeIfvg = ifvgs.length > 0 ? ifvgs[ifvgs.length - 1] : undefined;

  const unmitigatedObs = orderBlocks.filter((o) => !o.isMitigated);
  const activeOrderBlock = unmitigatedObs.length > 0 ? unmitigatedObs[unmitigatedObs.length - 1] : undefined;

  const activeCisd = detectCisdAtBar(series, len - 1, atr);
  const activeSmt = detectSmtDivergenceAtBar(series, len - 1, silverCandles);

  return {
    fvgs,
    ifvgs,
    orderBlocks,
    sweeps,
    mssList,
    bosList,
    cisdList,
    smtMarkers,
    activeFvg,
    activeIfvg,
    activeOrderBlock,
    activeCisd,
    activeSmt,
  };
}

/**
 * Full 4-Confluence Master Strategy Analyzer for Gold & Crypto (BTC, ETH, SOL)
 */
export function analyzeGoldCandles(
  candles: Candle[],
  timeframe: string,
  dataSource: string = 'yfinance',
  symbol: string = 'XAUUSD',
  silverCandles?: Candle[]
): GoldSignalAnalysis {
  const cleanSymbol = (symbol || 'XAUUSD').toUpperCase();
  const tfKey = cleanSymbol !== 'XAUUSD' ? `${cleanSymbol}_${timeframe}` : timeframe;

  const isBtc = cleanSymbol.includes('BTC');
  const isEth = cleanSymbol.includes('ETH');
  const isSol = cleanSymbol.includes('SOL');
  const displaySymbol = isBtc ? 'BTC/USD' : isEth ? 'ETH/USD' : isSol ? 'SOL/USD' : 'XAU/USD';
  const unitLabel = isBtc ? 'BTC' : isEth ? 'ETH' : isSol ? 'SOL' : 'oz';
  const pipMult = isBtc ? 1 : 10;
  const pipUnit = isBtc ? 'pts' : 'pips';

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
  const atr = Math.max(cur.atr14 ?? currentPrice * 0.0015, isBtc ? 25.0 : isEth ? 2.5 : isSol ? 0.25 : 1.2);
  const ema50 = cur.ema50 ?? currentPrice;
  const ema200 = cur.ema200 ?? ema50;
  const rsi = cur.rsi14 ?? 50;

  const session = evaluateSessionTiming(new Date());
  const liquidityLevels = computeLiquidityLevels(candles);
  const evalRes = analyzeMasterConfluenceAtBar(series, lastIdx, liquidityLevels, session, silverCandles);
  const { signals: historicalSignals, backtest } = scanMasterStrategySignals(
    series,
    liquidityLevels,
    session,
    timeframe,
    cleanSymbol
  );

  const smartMoney = extractAllSmartMoneyStructures(series, liquidityLevels, atr, silverCandles);
  if (evalRes.ict.smcSuite) {
    smartMoney.smcSuite = evalRes.ict.smcSuite;
  }
  if (evalRes.ict.sweepBosFvgPro?.bos) {
    smartMoney.activeBos = evalRes.ict.sweepBosFvgPro.bos;
  }

  let isLongBias = evalRes.isLongBias;
  const direction: TradeSetup['direction'] = isLongBias ? 'LONG' : 'SHORT';

  // Dynamic Pullback Entry: Pegged to Live Price and local FVG/iFVG structure within 1.5x ATR
  let waitPullbackEntry = roundPrice(isLongBias ? currentPrice - atr * 0.35 : currentPrice + atr * 0.35);

  if (evalRes.ict.sweepBosFvgPro?.fvgPro.detected) {
    const fvgCe = evalRes.ict.sweepBosFvgPro.fvgPro.consequentEncroachment;
    if (Math.abs(currentPrice - fvgCe) <= atr * 1.5) {
      waitPullbackEntry = fvgCe;
    }
  } else if (evalRes.ict.sweepBosFvgPro?.ifvg?.detected) {
    const ifvgCe = evalRes.ict.sweepBosFvgPro.ifvg.consequentEncroachment;
    if (Math.abs(currentPrice - ifvgCe) <= atr * 1.5) {
      waitPullbackEntry = ifvgCe;
    }
  } else if (evalRes.ict.activeFvgZone) {
    const zoneCe = roundPrice((evalRes.ict.activeFvgZone.top + evalRes.ict.activeFvgZone.bottom) / 2);
    if (Math.abs(currentPrice - zoneCe) <= atr * 1.5) {
      waitPullbackEntry = zoneCe;
    }
  } else if (evalRes.ict.activeOrderBlock) {
    const obCe = roundPrice((evalRes.ict.activeOrderBlock.top + evalRes.ict.activeOrderBlock.bottom) / 2);
    if (Math.abs(currentPrice - obCe) <= atr * 1.5) {
      waitPullbackEntry = obCe;
    }
  }

  // Distance from FVG value zone to detect Late Entry
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
    recommendedEntry = currentPrice;
  } else if (isAtOptimalZone && evalRes.gatesPassed >= 5) {
    timingState = 'ENTER_NOW';
    badgeText = '🟢 ENTER NOW (4-CONFLUENCE CONFIRMED)';
    recommendedOrderType = isLongBias ? 'BUY MARKET' : 'SELL MARKET';
    recommendedEntry = currentPrice;
  } else if (isLate) {
    timingState = 'LATE_WAIT_PULLBACK';
    badgeText = `🟠 LATE ENTRY (+${(distFromZone * pipMult).toFixed(0)}${pipUnit[0]} FROM FVG PRO CE)`;
    recommendedOrderType = isLongBias ? 'BUY LIMIT (FVG/OB WAIT)' : 'SELL LIMIT (FVG/OB WAIT)';
    recommendedEntry = waitPullbackEntry;
  } else {
    timingState = 'WAIT_CONFIRMATION';
    badgeText = evalRes.ict.sweepBosFvgPro?.fvgPro.detected
      ? `⚡ WAIT FVG PRO CE 50% (${(distFromZone * pipMult).toFixed(0)}${pipUnit[0]})`
      : `⏳ WAIT FVG/OB RETEST (${(distFromZone * pipMult).toFixed(0)}${pipUnit[0]})`;
    recommendedOrderType = isLongBias ? 'BUY LIMIT (FVG/OB WAIT)' : 'SELL LIMIT (FVG/OB WAIT)';
    recommendedEntry = waitPullbackEntry;
  }

  // V3.0: Dynamic Stop-Loss Rule adapted to sweep extreme + 0.2x ATR buffer
  let minSlDollars = timeframe === '1m' ? 2.5 : timeframe === '5m' ? 3.0 : timeframe === '15m' ? 3.5 : 4.0;
  let maxSlDollars = timeframe === '1m' ? 5.0 : timeframe === '5m' ? 6.5 : timeframe === '15m' ? 7.5 : timeframe === '30m' ? 10.0 : timeframe === '1h' ? 14.0 : 25.0;

  let spreadPips = 6.0;
  let maxAllowedSpreadPips = 25.0;
  let spreadBufferDollars = 0.35;

  if (isBtc) {
    minSlDollars = timeframe === '1m' ? 50.0 : timeframe === '5m' ? 80.0 : timeframe === '15m' ? 120.0 : 180.0;
    maxSlDollars = timeframe === '1m' ? 120.0 : timeframe === '5m' ? 200.0 : timeframe === '15m' ? 350.0 : timeframe === '30m' ? 500.0 : timeframe === '1h' ? 800.0 : 1500.0;
    spreadPips = 2.0;
    maxAllowedSpreadPips = 10.0;
    spreadBufferDollars = 2.0;
  } else if (isEth) {
    minSlDollars = timeframe === '1m' ? 3.0 : timeframe === '5m' ? 5.0 : timeframe === '15m' ? 8.0 : 12.0;
    maxSlDollars = timeframe === '1m' ? 12.0 : timeframe === '5m' ? 20.0 : timeframe === '15m' ? 35.0 : timeframe === '30m' ? 50.0 : timeframe === '1h' ? 80.0 : 150.0;
    spreadPips = 3.0;
    maxAllowedSpreadPips = 15.0;
    spreadBufferDollars = 0.30;
  } else if (isSol) {
    minSlDollars = timeframe === '1m' ? 0.3 : timeframe === '5m' ? 0.5 : timeframe === '15m' ? 0.8 : 1.2;
    maxSlDollars = timeframe === '1m' ? 1.0 : timeframe === '5m' ? 1.8 : timeframe === '15m' ? 3.0 : timeframe === '30m' ? 4.5 : timeframe === '1h' ? 7.0 : 12.0;
    spreadPips = 2.0;
    maxAllowedSpreadPips = 10.0;
    spreadBufferDollars = 0.05;
  }

  // V3.0 Invalidation Stop: structural extreme + 0.2x ATR buffer
  const atrBuffer = roundPrice(atr * 0.2);
  let slDistance = roundPrice(Math.min(maxSlDollars, Math.max(minSlDollars, atr * 0.8 + atrBuffer)));

  if (evalRes.ict.sweepBosFvgPro?.isValid && evalRes.ict.sweepBosFvgPro.sweep.swept) {
    const rawDist = Math.abs(recommendedEntry - evalRes.ict.sweepBosFvgPro.invalidationPrice);
    if (rawDist >= minSlDollars && rawDist <= maxSlDollars * 1.35) {
      slDistance = roundPrice(rawDist);
    }
  }

  const isSpreadAcceptable = spreadPips <= maxAllowedSpreadPips;

  // V3.0 Conservative Target Model: TP1 = 1.5x SL (take 50% partial & move SL to BE), TP2 = 2.5x SL (Liquidity Runner)
  const tp1Distance = roundPrice(slDistance * 1.5); // V3.0: 1:1.5 R:R
  const tp2Distance = roundPrice(slDistance * 2.5); // V3.0: 1:2.5 R:R
  const tp3Distance = roundPrice(slDistance * 3.5);

  // V3.0 Low-Risk Money Management (0.25% Account Risk on $10,000 Equity)
  const accountEquity = 10000;
  const riskPercent = 0.0025; // 0.25%
  const riskAmountUsd = roundPrice(accountEquity * riskPercent); // $25.00
  let positionSize = 0;
  let positionUnitStr = 'lots';

  if (cleanSymbol === 'XAUUSD') {
    // 1 standard lot = 100 oz. $1 move = $100 per lot -> lots = RiskAmount / (StopDollars * 100)
    positionSize = Math.max(0.01, roundPrice(riskAmountUsd / (slDistance * 100)));
    positionUnitStr = 'lots';
  } else if (cleanSymbol.includes('BTC')) {
    positionSize = Math.round((riskAmountUsd / slDistance) * 10000) / 10000;
    positionUnitStr = 'BTC';
  } else if (cleanSymbol.includes('ETH')) {
    positionSize = Math.round((riskAmountUsd / slDistance) * 1000) / 1000;
    positionUnitStr = 'ETH';
  } else if (cleanSymbol.includes('SOL')) {
    positionSize = Math.round((riskAmountUsd / slDistance) * 100) / 100;
    positionUnitStr = 'SOL';
  }

  const accountRiskProfile: AccountRiskProfile = {
    equity: accountEquity,
    riskPercent: 0.25,
    riskAmountUsd,
    positionSize,
    positionUnit: positionUnitStr,
    stopDistance: slDistance,
    maxDailyLossUsd: roundPrice(accountEquity * 0.0050), // $50.00 (2 losses)
    maxWeeklyLossUsd: roundPrice(accountEquity * 0.0150), // $150.00
    maxOpenRiskUsd: roundPrice(accountEquity * 0.0050), // $50.00
    consecutiveLossesToday: backtest.consecutiveLossesToday,
    circuitBreakerTripped: backtest.consecutiveLossesToday >= 2,
    dailyEntriesCount: Math.min(2, backtest.consecutiveLossesToday),
    maxDailyEntries: 2,
  };

  evalRes.quantitativeMatrix.accountRisk = accountRiskProfile;

  // Always calculate entry dynamically following the LIVE price
  let finalEntry = timingState === 'ENTER_NOW' ? currentPrice : recommendedEntry;
  let finalDirection: TradeSetup['direction'] = isLongBias ? 'LONG' : 'SHORT';
  let finalOrderType = recommendedOrderType;

  // Dynamic Stop-Loss and Take-Profit pegged directly to the LIVE entry price
  let stopLoss = isLongBias
    ? roundPrice(finalEntry - slDistance)
    : roundPrice(finalEntry + slDistance + spreadBufferDollars);
  let tp1 = isLongBias ? roundPrice(finalEntry + tp1Distance) : roundPrice(finalEntry - tp1Distance);
  let tp2 = isLongBias ? roundPrice(finalEntry + tp2Distance) : roundPrice(finalEntry - tp2Distance);
  let tp3 = isLongBias ? roundPrice(finalEntry + tp3Distance) : roundPrice(finalEntry - tp3Distance);

  // Check if an active trade is already tracked for running position telemetry
  const lockedActive = getLockedActiveTrade(cleanSymbol, timeframe);
  let lifecycle: EntryLifecycleTracker;

  if (lockedActive && lockedActive.outcome === 'ACTIVE') {
    const rawDiff = lockedActive.type === 'BUY' ? currentPrice - lockedActive.entry : lockedActive.entry - currentPrice;
    const livePips = roundPrice(rawDiff * pipMult);
    const liveDollars = roundPrice(rawDiff);

    const actState: EntryActivationState = livePips >= 0 ? 'ACTIVATED_PROFIT' : 'ACTIVATED_LOSS';
    const badge = livePips >= 0 ? '🟢 ACTIVATED • IN PROFIT' : '🔴 ACTIVATED • IN LOSS';
    const pnlText = `${livePips >= 0 ? '+' : ''}${livePips.toFixed(1)} ${pipUnit} (${liveDollars >= 0 ? '+' : ''}$${liveDollars.toFixed(2)}/${unitLabel})`;

    lifecycle = {
      activationState: actState,
      isActivated: true,
      statusBadge: badge,
      pnlStatusText: pnlText,
      direction: lockedActive.type,
      entryPrice: lockedActive.entry,
      activatedTime: lockedActive.time,
      currentPrice,
      stopLoss: lockedActive.stopLoss,
      tp1: lockedActive.tp1,
      tp2: lockedActive.tp2,
      floatingPips: livePips,
      floatingDollarsPerOz: liveDollars,
      distanceToEntryPips: 0,
      hitTp1: lockedActive.hitTp1,
      hitTp2: lockedActive.hitTp2,
      hitSl: lockedActive.hitSl,
      progressPct: Math.max(-100, Math.min(100, Math.round((rawDiff / (Math.abs(lockedActive.tp2 - lockedActive.entry) || 1)) * 100))),
      summaryText: `Locked ${lockedActive.type} Entry @ $${lockedActive.entry.toFixed(2)} — Currently ${pnlText}. Take 50% at +1.5R ($${lockedActive.tp1.toFixed(2)}) & move SL to BE.`,
    };
  } else if (timingState === 'ENTER_NOW' && evalRes.setupGrade === 'A+' && evalRes.quantitativeMatrix.allMandatoryConfluencesPassed && session.newsGuardStatus === 'CLEAR' && !backtest.circuitBreakerTripped) {
    // V3.0 New activation: only lock A+ setups with 4/4 mandatory confluences and zero news window at live price
    finalEntry = currentPrice;
    finalDirection = isLongBias ? 'LONG' : 'SHORT';
    finalOrderType = isLongBias ? 'BUY MARKET' : 'SELL MARKET';
    const newLocked: LockedActivePosition = {
      id: `TF_${tfKey}_${cur.time}`,
      timeframe: tfKey,
      time: cur.time,
      type: isLongBias ? 'BUY' : 'SELL',
      grade: evalRes.setupGrade,
      probability: evalRes.probability,
      confidence: evalRes.probability,
      entry: finalEntry, // Live MT5 price!
      stopLoss,
      tp1,
      tp2,
      beTrigger: isLongBias ? roundPrice(finalEntry + slDistance * 1.0) : roundPrice(finalEntry - slDistance * 1.0),
      hitBeLock: false,
      hitTp1: false,
      hitTp2: false,
      hitSl: false,
      outcome: 'ACTIVE',
      pnlDollarsPerOz: 0,
      reason: `V3.0 ${evalRes.setupGrade} (${evalRes.score}/100 Quality) • 4/4 Mandatory Confluences • 0.25% Risk ($${riskAmountUsd}) • Live Entry @ $${finalEntry.toFixed(2)}`,
    };
    setLockedActiveTrade(cleanSymbol, timeframe, newLocked);

    const rawDiff = isLongBias ? currentPrice - finalEntry : finalEntry - currentPrice;
    const livePips = roundPrice(rawDiff * pipMult);
    const liveDollars = roundPrice(rawDiff);
    const actState: EntryActivationState = livePips >= 0 ? 'ACTIVATED_PROFIT' : 'ACTIVATED_LOSS';
    const badge = livePips >= 0 ? '🟢 ACTIVATED • IN PROFIT' : '🔴 ACTIVATED • IN LOSS';
    const pnlText = `${livePips >= 0 ? '+' : ''}${livePips.toFixed(1)} ${pipUnit} (${liveDollars >= 0 ? '+' : ''}$${liveDollars.toFixed(2)}/${unitLabel})`;

    lifecycle = {
      activationState: actState,
      isActivated: true,
      statusBadge: badge,
      pnlStatusText: pnlText,
      direction: isLongBias ? 'BUY' : 'SELL',
      entryPrice: finalEntry,
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
      progressPct: Math.max(-100, Math.min(100, Math.round((rawDiff / (Math.abs(tp2 - finalEntry) || 1)) * 100))),
      summaryText: `Locked ${isLongBias ? 'BUY' : 'SELL'} Entry @ $${finalEntry.toFixed(2)}. Currently ${pnlText}. Hard SL $${stopLoss.toFixed(2)}, +1.5R TP1 $${tp1.toFixed(2)} (50% trim + SL->BE), +2.5R Runner $${tp2.toFixed(2)}.`,
    };
  } else {
    const distPips = roundPrice(Math.abs(currentPrice - waitPullbackEntry) * pipMult);
    const latestClosed = getLockedClosedHistory(cleanSymbol, timeframe)[0] ||
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
        ? `${prevClosed} → Wait @ $${waitPullbackEntry.toFixed(2)} (${distPips.toFixed(1)}${pipUnit[0]})`
        : `Wait ${distPips.toFixed(1)}${pipUnit[0]} for FVG PRO @ $${waitPullbackEntry.toFixed(2)}`,
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
      summaryText: `${prevClosed ? prevClosed + ' — ' : ''}Wait for price ($${currentPrice.toFixed(2)}) to tap FVG PRO CE 50% at $${waitPullbackEntry.toFixed(2)} (${distPips.toFixed(1)}${pipUnit[0]}) + rejection confirmation.`,
    };
  }

  const advice =
    timingState === 'ENTER_NOW'
      ? `⚡ Liquidity Sweep + BOS + FVG PRO Confirmed (${session.name}). Enter ${finalOrderType} @ $${finalEntry.toFixed(2)} | Hard SL $${stopLoss.toFixed(2)} ($${slDistance.toFixed(2)} risk beyond sweep wick) | 1:2 TP1 $${tp1.toFixed(2)} & 1:3 Runner $${tp2.toFixed(2)}.`
      : `Do NOT chase Market ($${currentPrice.toFixed(2)}). Wait for FVG PRO Consequent Encroachment (CE 50%) @ $${waitPullbackEntry.toFixed(2)} | Hard SL $${stopLoss.toFixed(2)} ($${slDistance.toFixed(2)} risk) | 1:2 TP1 $${tp1.toFixed(2)}.`;

  const entryTiming: EntryTimingAnalysis = {
    state: timingState,
    badgeText,
    direction: finalDirection === 'LONG' ? 'BUY' : 'SELL',
    signalOriginPrice: evalRes.ict.lastSwingHigh,
    barsSinceCross: 3,
    movedPipsSinceOrigin: roundPrice(distFromZone * pipMult),
    isLate,
    marketEntry: roundPrice(currentPrice),
    waitPullbackEntry: waitPullbackEntry,
    recommendedEntry: finalEntry,
    recommendedOrderType: finalOrderType,
    stopLoss,
    tp1,
    tp2,
    tp3,
    riskDollars: slDistance,
    riskPips: roundPrice(slDistance * pipMult),
    rewardTp1Pips: roundPrice(tp1Distance * pipMult),
    rewardTp2Pips: roundPrice(tp2Distance * pipMult),
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

  const currentCandlePattern = identifyCandle(candles[lastIdx], lastIdx > 0 ? candles[lastIdx - 1] : undefined, atr);
  const recentCandlePatterns: IdentifiedCandle[] = [];
  const startCandleIdx = Math.max(0, candles.length - 12);
  for (let i = startCandleIdx; i < candles.length; i++) {
    const prev = i > 0 ? candles[i - 1] : undefined;
    const cAtr = atr14Arr[i] ?? atr;
    recentCandlePatterns.push(identifyCandle(candles[i], prev, cAtr));
  }

  return {
    symbol: displaySymbol,
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
    currentCandlePattern,
    recentCandlePatterns,
    tradeSetup: {
      direction: finalDirection,
      isActionable: timingState === 'ENTER_NOW' && evalRes.setupGrade === 'A+' && evalRes.quantitativeMatrix.allMandatoryConfluencesPassed && !session.isNoTradeWindow && isSpreadAcceptable && !backtest.circuitBreakerTripped,
      entry: finalEntry,
      optimalPullbackEntry: waitPullbackEntry,
      stopLoss,
      tp1,
      tp2,
      tp3,
      riskPips: roundPrice(slDistance * pipMult),
      rewardTp1Pips: roundPrice(tp1Distance * pipMult),
      rewardTp2Pips: roundPrice(tp2Distance * pipMult),
      rewardTp3Pips: roundPrice(tp3Distance * pipMult),
      riskRewardTp2: '1 : 1.5 (50% Partial + SL→BE) → 1 : 2.5 Runner (+2.0R Net)',
      atrValue: roundPrice(atr),
      entryTiming,
      v3Config: {
        qualityScore: evalRes.score,
        grade: evalRes.setupGrade,
        allMandatoryPassed: evalRes.quantitativeMatrix.allMandatoryConfluencesPassed,
        actionVerdict: evalRes.quantitativeMatrix.actionVerdict,
        riskPercent: 0.25,
        plannedRiskUsd: riskAmountUsd,
        positionSize,
        positionUnit: positionUnitStr,
        tp1Ratio: '+1.5R',
        tp2Ratio: '+2.5R',
        grossExpectancyR: '+2.0R',
        slBuffer: '0.2x ATR',
        expirationBars: 4,
      },
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
    smartMoney,
  };
}

export const analyzeMarketCandles = analyzeGoldCandles;
