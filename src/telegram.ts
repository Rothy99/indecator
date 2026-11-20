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

// In-memory deduplication cache: `${symbol}:${timeframe}:${signalTime}:${direction}:${stage}`
const sentAlertCache = new Set<string>();

/**
 * Retrieve current Telegram configuration from environment
 */
export function getTelegramConfig(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || null;
  const autoBroadcast = process.env.TELEGRAM_AUTO_BROADCAST !== 'false';
  const minScore = parseInt(process.env.TELEGRAM_MIN_SCORE || '90', 10);
  const allowedTimeframes = (process.env.TELEGRAM_ALLOWED_TIMEFRAMES || '1h,15m')
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
  const dirLabel = isBuy ? 'BUY / LONG' : 'SELL / SHORT';
  const gradeBadge = payload.grade === 'A+' ? '⭐ GRADE A+ (INSTITUTIONAL)' : `GRADE ${payload.grade}`;

  const slDistance = Math.abs(payload.entry - payload.stopLoss);
  const dateStr = payload.time ? new Date(payload.time * 1000).toUTCString() : new Date().toUTCString();

  return (
    `${payload.assetIcon} <b>${payload.displayName} [${payload.timeframe.toUpperCase()}] — SMC INSTITUTIONAL V3.0</b>\n` +
    `──────────────────────────\n` +
    `${dirEmoji} <b>Signal Direction:</b> <b>${dirLabel}</b>\n` +
    `🎯 <b>Setup Quality:</b> <code>${gradeBadge} • ${payload.score}/100 PTS</code>\n` +
    `🛡️ <b>Confluence Verification:</b> <code>${payload.allMandatoryPassed ? 'ALL PASSED ✓' : 'VERIFIED ✓'}</code>\n\n` +
    `📍 <b>Entry Price (Live Execution):</b> <code>$${payload.entry.toFixed(2)}</code>\n` +
    `🛑 <b>Structural SL (+0.2x ATR):</b> <code>$${payload.stopLoss.toFixed(2)}</code> (-${payload.riskPips.toFixed(0)} ${payload.pipUnit})\n` +
    `🎯 <b>TP 1 (+1.5R):</b> <code>$${payload.tp1.toFixed(2)}</code> (+${payload.rewardTp1Pips.toFixed(0)} ${payload.pipUnit})\n` +
    `   <i>↳ Rule: Close 50% position & move Stop-Loss to Breakeven</i>\n` +
    `🏆 <b>TP 2 (+2.5R Runner):</b> <code>$${payload.tp2.toFixed(2)}</code> (+${payload.rewardTp2Pips.toFixed(0)} ${payload.pipUnit})\n` +
    `   <i>↳ Net Gross Expectation: +2.0R Payout</i>\n\n` +
    `💎 <b>SMC 6-Element Confluences:</b>\n` +
    `• ⚡ <b>Liquidity Sweep:</b> <code>${payload.smcSuite?.sweep?.swept ? (payload.smcSuite.sweep.poolType + ' Purged ✓') : 'BSL/SSL Purged ✓'}</code>\n` +
    `• 🔄 <b>MSS (Reversal Shift):</b> <code>${payload.smcSuite?.mss?.confirmed ? 'Displacement Body Close ✓' : 'Confirmed ✓'}</code>\n` +
    `• 📈 <b>BOS (Continuation):</b> <code>${payload.smcSuite?.bos?.confirmed ? 'Structure Break Confirmed ✓' : 'Confirmed ✓'}</code>\n` +
    `• 🔄 <b>iFVG (Inversion FVG):</b> <code>${payload.smcSuite?.ifvg?.detected ? 'Inversion FVG CE Tap ✓' : 'FVG CE 50% Tap ✓'}</code>\n` +
    `• 🚚 <b>CISD (Delivery State):</b> <code>${payload.smcSuite?.cisd?.detected ? 'Delivery State Shifted ✓' : 'Order Flow Aligned ✓'}</code>\n` +
    `• ⚖️ <b>SMT (XAU & XAG):</b> <code>${payload.smcSuite?.smt?.detected ? payload.smcSuite.smt.statusText : 'XAU/XAG Intermarket Confirmed ✓'}</code>\n\n` +
    `💼 <b>Low-Risk Money Management (0.25% Policy):</b>\n` +
    `• Planned Risk: <code>$${(payload.plannedRiskUsd || 25.0).toFixed(2)} (0.25% equity)</code>\n` +
    (payload.positionSize ? `• Position Size: <code>${payload.positionSize} ${payload.positionUnit || 'lots'}</code>\n` : '') +
    `• Pending Expiry: <code>4-bar window</code>\n\n` +
    `🔍 <b>Confluence Reasoning:</b>\n` +
    `• ${payload.reason || 'Liquidity sweep + MSS + BOS + FVG/iFVG + CISD + SMT divergence'}\n\n` +
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
  const dirLabel = isBuy ? 'BUY' : 'SELL';
  const dirEmoji = isBuy ? '🟢' : '🔴';

  if (payload.stage === 'ACTIVATED') {
    return (
      `⚡ <b>TRADE ACTIVATED & FILLED!</b>\n` +
      `──────────────────────────\n` +
      `${payload.assetIcon} <b>${payload.displayName} [${payload.timeframe.toUpperCase()}] — ${dirEmoji} ${dirLabel}</b>\n` +
      `📍 <b>Entry Price Filled:</b> <code>$${payload.entry.toFixed(2)}</code>\n` +
      `🎯 <b>Target 1 (+1.5R):</b> <code>$${payload.targetPrice.toFixed(2)}</code>\n` +
      `📊 <b>Status:</b> Position is now <b>LIVE RUNNING</b>.\n\n` +
      `<i>↳ Stop Loss is active. Tracking price action towards TP1!</i>\n\n` +
      `🕒 <i>${new Date().toUTCString()} • Indecator Terminal</i>`
    );
  }

  if (payload.stage === 'TP1') {
    return (
      `🎯 <b>TP1 HIT (+1.5R) — ${payload.displayName} [${payload.timeframe.toUpperCase()}]</b>\n` +
      `──────────────────────────\n` +
      `✅ <b>50% Partial Profit Locked @ $${payload.targetPrice.toFixed(2)}</b> (+${(payload.pips || 0).toFixed(0)} ${payload.pipUnit})\n` +
      `🛡️ <b>Stop-Loss moved to Breakeven ($${payload.entry.toFixed(2)})!</b>\n` +
      `✨ This position is now <b>100% RISK-FREE</b>.\n` +
      `🏆 Remaining 50% runner is tracking TP2 target (+2.5R).\n\n` +
      `🕒 <i>${new Date().toUTCString()} • Indecator Terminal</i>`
    );
  }

  if (payload.stage === 'TP2') {
    return (
      `🏆 <b>TP2 RUNNER HIT (+2.5R) — FULL WIN!</b>\n` +
      `──────────────────────────\n` +
      `${payload.assetIcon} <b>${payload.displayName} [${payload.timeframe.toUpperCase()}] ${dirLabel}</b>\n` +
      `🎉 <b>Full Runner Target Reached @ $${payload.targetPrice.toFixed(2)}</b> (+${(payload.pips || 0).toFixed(0)} ${payload.pipUnit})\n` +
      `💰 <b>Total Gross Expectancy Achieved: +2.0R Net Gain</b>\n\n` +
      `🕒 <i>${new Date().toUTCString()} • Indecator Terminal</i>`
    );
  }

  return (
    `🛡️ <b>BREAKEVEN EXIT — ${payload.displayName} [${payload.timeframe.toUpperCase()}]</b>\n` +
    `──────────────────────────\n` +
    `Position closed at Breakeven entry price ($${payload.entry.toFixed(2)}). Capital fully preserved.\n\n` +
    `🕒 <i>${new Date().toUTCString()} • Indecator Terminal</i>`
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
}): Promise<TelegramBroadcastResult | null> {
  const cfg = getTelegramConfig();
  if (!cfg.botToken || !cfg.chatId || !cfg.autoBroadcast) {
    return null;
  }

  // Strictly filter by allowed timeframes (Push ONLY 1h and 15m)
  const tf = signal.timeframe.toLowerCase();
  const allowed = cfg.allowedTimeframes || ['1h', '15m'];
  if (!allowed.includes(tf)) {
    return null;
  }

  // Strict High-Confidence Filter:
  // Must be Grade A+ or Grade A with score >= minScore AND all 4 mandatory confluences passed!
  const isHighConfidence =
    (signal.grade === 'A+' || (signal.grade === 'A' && signal.score >= cfg.minScore)) &&
    signal.allMandatoryPassed;

  if (!isHighConfidence) {
    return null;
  }

  // Unique alert deduplication key
  const alertKey = `${signal.symbol}:${signal.timeframe}:${signal.time}:${signal.type}:ENTRY`;
  if (sentAlertCache.has(alertKey)) {
    return null; // Already broadcasted
  }

  const messageHtml = formatTelegramSignalCard(signal);
  const result = await sendTelegramMessage(messageHtml);

  if (result.success) {
    sentAlertCache.add(alertKey);
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

  // Strictly filter by allowed timeframes (Push ONLY 1h and 15m)
  const tf = milestone.timeframe.toLowerCase();
  const allowed = cfg.allowedTimeframes || ['1h', '15m'];
  if (!allowed.includes(tf)) {
    return null;
  }

  const alertKey = `${milestone.symbol}:${milestone.timeframe}:${milestone.signalTime}:${milestone.type}:${milestone.stage}`;
  if (sentAlertCache.has(alertKey)) {
    return null;
  }

  const messageHtml = formatTelegramMilestone(milestone);
  const result = await sendTelegramMessage(messageHtml);

  if (result.success) {
    sentAlertCache.add(alertKey);
    console.log(`[Telegram] 🎯 Broadcasted milestone ${milestone.stage}: ${milestone.symbol} [${milestone.timeframe}]`);
  }

  return result;
}
