import * as fs from 'fs';
import * as path from 'path';

/**
 * Telegram Channel Integration for High-Confidence Setups (4-Confluence V3.0)
 * Sends automated and on-demand signal alerts to Telegram channels/chats.
 */

export interface TelegramConfig {
  botToken: string | null;
  chatId: string | null;
  autoBroadcast: boolean;
  minScore: number;
  allowedTimeframes: string[];
}

export interface TelegramBroadcastResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

// Persistent deduplication cache: `${symbol}:${timeframe}:${normalizedBarTime}:${direction}:${stage}`
const CACHE_FILE = path.join(process.cwd(), 'data', 'sent_alerts.json');
function loadSentAlertCache(): Set<string> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      if (Array.isArray(data)) {
        return new Set(data.slice(-200));
      }
    }
  } catch {}
  return new Set();
}
function saveSentAlertCache(cache: Set<string>) {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Array.from(cache).slice(-200), null, 2), 'utf8');
  } catch {}
}
const sentAlertCache = loadSentAlertCache();

/**
 * Retrieve current Telegram configuration from environment
 */
export function getTelegramConfig(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || null;
  const autoBroadcast = process.env.TELEGRAM_AUTO_BROADCAST !== 'false';
  const minScore = parseInt(process.env.TELEGRAM_MIN_SCORE || '90', 10);
  const allowedTimeframes = (process.env.TELEGRAM_ALLOWED_TIMEFRAMES || '1h,15m,5m')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return {
    botToken,
    chatId,
    autoBroadcast,
    minScore,
    allowedTimeframes,
  };
}

/**
 * Mask sensitive Chat ID for public status display (e.g. "@my_c***" or "-100***123")
 */
function maskChatId(chatId: string): string {
  if (chatId.startsWith('@')) {
    if (chatId.length <= 5) return chatId;
    return chatId.slice(0, 4) + '***' + chatId.slice(-2);
  }
  if (chatId.length <= 6) return '***';
  return chatId.slice(0, 4) + '***' + chatId.slice(-3);
}

/**
 * Check whether Telegram is configured and ready to send
 */
export function isTelegramReady(): boolean {
  const cfg = getTelegramConfig();
  return Boolean(cfg.botToken && cfg.chatId);
}

/**
 * Public status payload for API / UI
 */
export function getTelegramStatus() {
  const cfg = getTelegramConfig();
  return {
    enabled: isTelegramReady(),
    configured: isTelegramReady(),
    isConfigured: isTelegramReady(),
    chatIdMasked: cfg.chatId ? maskChatId(cfg.chatId) : null,
    chatId: cfg.chatId || '',
    autoBroadcast: cfg.autoBroadcast,
    minScore: cfg.minScore,
    allowedTimeframes: cfg.allowedTimeframes,
  };
}

/**
 * Save and persist Telegram credentials to runtime and .env
 */
export async function saveTelegramConfig(newConfig: {
  botToken?: string;
  chatId?: string;
  autoBroadcast?: boolean;
  minScore?: number;
  allowedTimeframes?: string[];
}): Promise<{ success: boolean; botUsername?: string; error?: string }> {
  const token = (newConfig.botToken !== undefined ? newConfig.botToken : (process.env.TELEGRAM_BOT_TOKEN ?? '')).trim();
  const chat = (newConfig.chatId !== undefined ? newConfig.chatId : (process.env.TELEGRAM_CHAT_ID ?? '')).trim();
  const auto = newConfig.autoBroadcast !== undefined ? newConfig.autoBroadcast : (process.env.TELEGRAM_AUTO_BROADCAST !== 'false');
  const score = newConfig.minScore || parseInt(process.env.TELEGRAM_MIN_SCORE || '90', 10);
  const allowedTfs = newConfig.allowedTimeframes
    ? newConfig.allowedTimeframes.join(',')
    : (process.env.TELEGRAM_ALLOWED_TIMEFRAMES || '1h,15m');

  let botUsername = '';
  if (token) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json() as any;
      if (!data.ok) {
        return { success: false, error: `Invalid Bot Token: ${data.description || 'Unauthorized'}` };
      }
      botUsername = data.result?.username || '';
    } catch (e: any) {
      return { success: false, error: `Could not connect to Telegram API: ${e.message}` };
    }
  }

  // Update in-memory process.env
  process.env.TELEGRAM_BOT_TOKEN = token;
  process.env.TELEGRAM_CHAT_ID = chat;
  process.env.TELEGRAM_AUTO_BROADCAST = auto ? 'true' : 'false';
  process.env.TELEGRAM_MIN_SCORE = String(score);
  process.env.TELEGRAM_ALLOWED_TIMEFRAMES = allowedTfs;

  // Persist into .env file
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const updates: Record<string, string> = {
      TELEGRAM_BOT_TOKEN: token,
      TELEGRAM_CHAT_ID: chat,
      TELEGRAM_AUTO_BROADCAST: auto ? 'true' : 'false',
      TELEGRAM_MIN_SCORE: String(score),
      TELEGRAM_ALLOWED_TIMEFRAMES: allowedTfs,
    };

    for (const [key, val] of Object.entries(updates)) {
      const reg = new RegExp(`^${key}=.*$`, 'm');
      if (reg.test(envContent)) {
        envContent = envContent.replace(reg, `${key}=${val}`);
      } else {
        envContent += `\n${key}=${val}`;
      }
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  } catch (err: any) {
    console.warn('[Telegram] Could not write to .env:', err.message);
  }

  return { success: true, botUsername };
}

/**
 * Send an HTML formatted message to the configured Telegram channel
 */
export async function sendTelegramMessage(
  htmlText: string,
  customChatId?: string
): Promise<TelegramBroadcastResult> {
  const cfg = getTelegramConfig();
  if (!cfg.botToken) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN is not configured in .env' };
  }
  const targetChatId = customChatId || cfg.chatId;
  if (!targetChatId) {
    return { success: false, error: 'TELEGRAM_CHAT_ID is not configured in .env' };
  }

  const endpoint = `https://api.telegram.org/bot${cfg.botToken}/sendMessage`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = (await res.json()) as any;
    if (data.ok) {
      return { success: true, messageId: data.result?.message_id };
    }
    console.warn('[Telegram] API Error:', data.description || 'Unknown error');
    return { success: false, error: data.description || 'Telegram API request failed' };
  } catch (err: any) {
    console.error('[Telegram] Network Error:', err.message);
    return { success: false, error: err.message || 'Network error communicating with Telegram' };
  }
}

/**
 * Send a verification test ping to confirm bot setup & channel admin permissions
 */
export async function sendTelegramTestPing(customChatId?: string): Promise<TelegramBroadcastResult> {
  const cfg = getTelegramConfig();
  const targetChatId = customChatId || cfg.chatId || '@channel';

  const testMessage =
    `🤖 <b>INDECATOR — TELEGRAM BOT TEST PING</b>\n` +
    `──────────────────────────\n` +
    `✅ <b>Connection Status:</b> Successfully Connected\n` +
    `📡 <b>Target Channel:</b> <code>${targetChatId}</code>\n` +
    `⚡ <b>Strategy Engine:</b> 4-Confluence V3.0 (Capital Preservation)\n` +
    `⭐ <b>Broadcast Filter:</b> A+ High-Confidence Setups (Score ≥ ${cfg.minScore}/100)\n\n` +
    `<i>Your Telegram signal bot is now active and ready to stream real-time trade alerts!</i>\n` +
    `🕒 <i>${new Date().toUTCString()}</i>`;

  return sendTelegramMessage(testMessage, customChatId);
}

/**
 * Format a complete institutional High-Confidence A+ Trade Setup into an HTML Telegram Card
 */
export function formatTelegramSignalCard(payload: {
  symbol: string;
  displayName: string;
  assetIcon: string;
  timeframe: string;
  type: 'BUY' | 'SELL';
  orderType?: string;
  grade: string;
  probability: number;
  score: number;
  allMandatoryPassed: boolean;
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  riskPips: number;
  rewardTp1Pips: number;
  rewardTp2Pips: number;
  pipUnit: string;
  reason: string;
  plannedRiskUsd?: number;
  positionSize?: number;
  positionUnit?: string;
  smcSuite?: any;
  time?: number;
}): string {
  const isBuy = payload.type === 'BUY';
  const dirEmoji = isBuy ? '🟢' : '🔴';
  const actionLabel = payload.orderType || (isBuy ? 'BUY MARKET' : 'SELL MARKET');
  const gradeBadge = payload.grade === 'A+' ? '⭐ GRADE A+ (INSTITUTIONAL)' : `GRADE ${payload.grade}`;

  const dateStr = payload.time ? new Date(payload.time * 1000).toUTCString() : new Date().toUTCString();

  const sweepText = payload.smcSuite?.sweep?.swept
    ? `${payload.smcSuite.sweep.poolType || 'Liquidity'} Purged ✓`
    : 'BSL / SSL Purged ✓';
  const mssText = payload.smcSuite?.mss?.confirmed
    ? 'Displacement Body Close ✓'
    : 'Market Structure Shift ✓';
  const bosText = payload.smcSuite?.bos?.confirmed
    ? 'Structure Break Confirmed ✓'
    : 'Continuation Break ✓';
  const ifvgText = payload.smcSuite?.ifvg?.detected
    ? 'Inversion FVG CE Tap ✓'
    : 'FVG CE 50% Mitigated ✓';
  const cisdText = payload.smcSuite?.cisd?.detected
    ? 'State of Delivery Shifted ✓'
    : 'Order Flow Institutional ✓';
  const smtText = payload.smcSuite?.smt?.detected
    ? (payload.smcSuite.smt.statusText || 'XAU/XAG Intermarket Confirmed ✓')
    : 'XAU & XAG Intermarket Confirmed ✓';

  return (
    `🏆 <b>INSTITUTIONAL SMC ALERT</b> 🏆\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `${payload.assetIcon} <b>${payload.displayName.toUpperCase()} (${payload.symbol})</b> • <code>${payload.timeframe.toUpperCase()}</code>\n` +
    `${dirEmoji} <b>ACTION: ${actionLabel.toUpperCase()}</b>\n` +
    `🎯 <b>SETUP QUALITY:</b> <code>${gradeBadge} • ${payload.score}/100 PTS</code>\n` +
    `🛡️ <b>CONFLUENCE STATUS:</b> <code>${payload.allMandatoryPassed ? 'ALL 6 MANDATORY PASSED ✓' : 'VERIFIED INSTITUTIONAL ✓'}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📥 <b>ENTRY PRICE:</b> <code>${payload.entry.toFixed(2)}</code> <i>(Tap to copy)</i>\n` +
    `🛑 <b>STOP LOSS:</b> <code>${payload.stopLoss.toFixed(2)}</code> <i>(-${payload.riskPips.toFixed(0)} ${payload.pipUnit})</i>\n` +
    `🎯 <b>TAKE PROFIT 1:</b> <code>${payload.tp1.toFixed(2)}</code> <i>(+${payload.rewardTp1Pips.toFixed(0)} ${payload.pipUnit})</i>\n` +
    `🏆 <b>TAKE PROFIT 2:</b> <code>${payload.tp2.toFixed(2)}</code> <i>(+${payload.rewardTp2Pips.toFixed(0)} ${payload.pipUnit} Runner)</i>\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💎 <b>ICT 6-ELEMENT CONFLUENCES:</b>\n` +
    `├ ⚡ <b>Liquidity Sweep:</b> <code>${sweepText}</code>\n` +
    `├ 🔄 <b>MSS (Shift):</b> <code>${mssText}</code>\n` +
    `├ 📈 <b>BOS (Break):</b> <code>${bosText}</code>\n` +
    `├ 🎯 <b>iFVG (Inversion):</b> <code>${ifvgText}</code>\n` +
    `├ 🚚 <b>CISD (Delivery):</b> <code>${cisdText}</code>\n` +
    `└ ⚖️ <b>SMT (XAU/XAG):</b> <code>${smtText}</code>\n\n` +
    `💼 <b>TRADE & RISK MANAGEMENT:</b>\n` +
    `• <b>Execution Rule:</b> Close 50% at TP1 & Move SL to Breakeven\n` +
    `• <b>Planned Risk:</b> <code>$${(payload.plannedRiskUsd || 25.0).toFixed(2)}</code> (0.25% Equity Policy)\n` +
    (payload.positionSize ? `• <b>Position Size:</b> <code>${payload.positionSize} ${payload.positionUnit || 'lots'}</code>\n` : '') +
    `• <b>Net Expectancy:</b> <code>+2.0R Net Payout</code> (1:1.5 TP1 ➔ 1:2.5 TP2)\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🕒 <i>${dateStr} • Indecator Terminal</i>`
  );
}

/**
 * Format a Milestone notification (e.g. TP1 Hit & Moved SL to Breakeven, or TP2 Runner Hit)
 */
export function formatTelegramMilestone(payload: {
  symbol: string;
  displayName: string;
  assetIcon: string;
  timeframe: string;
  type: 'BUY' | 'SELL';
  stage: 'ACTIVATED' | 'TP1' | 'TP2' | 'BE_EXIT';
  entry: number;
  targetPrice: number;
  pnlDollars?: number;
  pips?: number;
  pipUnit: string;
}): string {
  const isBuy = payload.type === 'BUY';
  const dirLabel = isBuy ? 'BUY / LONG' : 'SELL / SHORT';
  const dirEmoji = isBuy ? '🟢' : '🔴';
  const nowStr = new Date().toUTCString();

  if (payload.stage === 'ACTIVATED') {
    return (
      `⚡ <b>TRADE ACTIVATED & FILLED!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${payload.assetIcon} <b>${payload.displayName.toUpperCase()} (${payload.symbol}) [${payload.timeframe.toUpperCase()}]</b>\n` +
      `${dirEmoji} <b>Direction:</b> <b>${dirLabel}</b>\n\n` +
      `📥 <b>Entry Filled:</b> <code>${payload.entry.toFixed(2)}</code>\n` +
      `🎯 <b>Target 1 (+1.5R):</b> <code>${payload.targetPrice.toFixed(2)}</code>\n\n` +
      `📊 <i>Status: Position is now LIVE RUNNING on MT5.</i>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🕒 <i>${nowStr} • Indecator Terminal</i>`
    );
  }

  if (payload.stage === 'TP1') {
    return (
      `🎯 <b>TARGET 1 HIT (+1.5R) — TAKE PROFIT!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${payload.assetIcon} <b>${payload.displayName.toUpperCase()} [${payload.timeframe.toUpperCase()}]</b> • ${dirEmoji} <b>${dirLabel}</b>\n\n` +
      `✅ <b>50% Partial Closed @</b> <code>${payload.targetPrice.toFixed(2)}</code> <i>(+${(payload.pips || 0).toFixed(0)} ${payload.pipUnit})</i>\n` +
      `🛡️ <b>STOP-LOSS MOVED TO BREAKEVEN @</b> <code>${payload.entry.toFixed(2)}</code>\n\n` +
      `✨ <b>This position is now 100% RISK-FREE.</b>\n` +
      `🏆 <i>Remaining 50% runner is tracking TP2 target (+2.5R).</i>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🕒 <i>${nowStr} • Indecator Terminal</i>`
    );
  }

  if (payload.stage === 'TP2') {
    return (
      `🏆 <b>TARGET 2 HIT (+2.5R) — FULL WIN!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${payload.assetIcon} <b>${payload.displayName.toUpperCase()} [${payload.timeframe.toUpperCase()}]</b> • ${dirEmoji} <b>${dirLabel}</b>\n\n` +
      `🎉 <b>Full Runner Target Reached @</b> <code>${payload.targetPrice.toFixed(2)}</code> <i>(+${(payload.pips || 0).toFixed(0)} ${payload.pipUnit})</i>\n` +
      `💰 <b>Total Gross Expectancy Achieved: +2.0R Net Payout</b>\n\n` +
      `✨ <i>Trade concluded with maximum institutional payout.</i>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🕒 <i>${nowStr} • Indecator Terminal</i>`
    );
  }

  return (
    `🛡️ <b>BREAKEVEN EXIT — CAPITAL PRESERVED</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `${payload.assetIcon} <b>${payload.displayName.toUpperCase()} [${payload.timeframe.toUpperCase()}]</b>\n\n` +
    `Position closed at Breakeven entry price <code>${payload.entry.toFixed(2)}</code>. Capital fully preserved.\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🕒 <i>${nowStr} • Indecator Terminal</i>`
  );
}

/**
 * Check and broadcast high-confidence setups automatically without duplicate spam
 */
export async function checkAndBroadcastSetup(signal: {
  symbol: string;
  displayName: string;
  assetIcon: string;
  timeframe: string;
  type: 'BUY' | 'SELL';
  orderType?: string;
  grade: string;
  probability: number;
  score: number;
  allMandatoryPassed: boolean;
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  riskPips: number;
  rewardTp1Pips: number;
  rewardTp2Pips: number;
  pipUnit: string;
  reason: string;
  plannedRiskUsd?: number;
  positionSize?: number;
  positionUnit?: string;
  smcSuite?: any;
  time: number;
  isActionable?: boolean;
  isActivated?: boolean;
}): Promise<TelegramBroadcastResult | null> {
  const cfg = getTelegramConfig();
  if (!cfg.botToken || !cfg.chatId || !cfg.autoBroadcast) {
    return null;
  }

  // Strictly filter by allowed timeframes (Push 1h, 15m, and 5m sniper)
  const tf = signal.timeframe.toLowerCase();
  const allowed = cfg.allowedTimeframes || ['1h', '15m', '5m'];
  if (!allowed.includes(tf)) {
    return null;
  }

  // 5M Sniper Filter: 5-minute timeframe ONLY pushes when actively ACTIVATED
  if (tf === '5m' && signal.isActivated === false) {
    return null;
  }

  // Strict Quality Filter: Push ONLY 95%+ High-Confidence setups to Telegram
  const minRequiredScore = Math.max(95, cfg.minScore || 95);
  const isHighConfidence95Plus =
    (signal.score >= minRequiredScore || signal.probability >= minRequiredScore) &&
    (signal.grade === 'A+' || signal.grade === 'A');

  if (!isHighConfidence95Plus) {
    return null;
  }

  // Standardize timeframe step in seconds to avoid micro-tick timestamp drift
  const stepSec = tf === '1h' ? 3600 : tf === '15m' ? 900 : tf === '5m' ? 300 : 60;
  const normalizedBarTime = Math.floor(signal.time / stepSec) * stepSec;
  const alertKey = `${signal.symbol}:${tf}:${normalizedBarTime}:${signal.type}:ENTRY`;
  if (sentAlertCache.has(alertKey)) {
    return null; // Already broadcasted
  }

  const messageHtml = formatTelegramSignalCard(signal);
  const result = await sendTelegramMessage(messageHtml);

  if (result.success) {
    sentAlertCache.add(alertKey);
    saveSentAlertCache(sentAlertCache);
    console.log(`[Telegram] 🚀 Broadcasted High-Confidence A+ setup: ${signal.symbol} [${signal.timeframe}] ${signal.type}`);
  }

  return result;
}

/**
 * Check and broadcast milestone notifications (TP1 hit / TP2 hit) without duplicates
 */
export async function checkAndBroadcastMilestone(milestone: {
  symbol: string;
  displayName: string;
  assetIcon: string;
  timeframe: string;
  type: 'BUY' | 'SELL';
  stage: 'ACTIVATED' | 'TP1' | 'TP2' | 'BE_EXIT';
  entry: number;
  targetPrice: number;
  signalTime: number;
  pips?: number;
  pipUnit: string;
}): Promise<TelegramBroadcastResult | null> {
  const cfg = getTelegramConfig();
  if (!cfg.botToken || !cfg.chatId || !cfg.autoBroadcast) {
    return null;
  }

  // Strictly filter by allowed timeframes (Push 1h, 15m, and 5m sniper)
  const tf = milestone.timeframe.toLowerCase();
  const allowed = cfg.allowedTimeframes || ['1h', '15m', '5m'];
  if (!allowed.includes(tf)) {
    return null;
  }

  const stepSec = tf === '1h' ? 3600 : tf === '15m' ? 900 : tf === '5m' ? 300 : 60;
  const normalizedBarTime = Math.floor(milestone.signalTime / stepSec) * stepSec;
  const alertKey = `${milestone.symbol}:${tf}:${normalizedBarTime}:${milestone.type}:${milestone.stage}`;
  if (sentAlertCache.has(alertKey)) {
    return null;
  }

  const messageHtml = formatTelegramMilestone(milestone);
  const result = await sendTelegramMessage(messageHtml);

  if (result.success) {
    sentAlertCache.add(alertKey);
    saveSentAlertCache(sentAlertCache);
    console.log(`[Telegram] 🎯 Broadcasted milestone ${milestone.stage}: ${milestone.symbol} [${milestone.timeframe}]`);
  }

  return result;
}
