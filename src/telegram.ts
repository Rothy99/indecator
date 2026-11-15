/**
 * Telegram Channel Integration for High-Confidence Setups (4-Confluence V3.0)
 * Sends automated and on-demand signal alerts to Telegram channels/chats.
 */

export interface TelegramConfig {
  botToken: string | null;
  chatId: string | null;
  autoBroadcast: boolean;
  minScore: number;
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

  return {
    botToken,
    chatId,
    autoBroadcast,
    minScore,
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
    chatIdMasked: cfg.chatId ? maskChatId(cfg.chatId) : null,
    autoBroadcast: cfg.autoBroadcast,
    minScore: cfg.minScore,
  };
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
  time?: number;
}): string {
  const isBuy = payload.type === 'BUY';
  const dirEmoji = isBuy ? '🟢' : '🔴';
  const dirLabel = isBuy ? 'BUY / LONG' : 'SELL / SHORT';
  const gradeBadge = payload.grade === 'A+' ? '⭐ GRADE A+ (INSTITUTIONAL)' : `GRADE ${payload.grade}`;

  const slDistance = Math.abs(payload.entry - payload.stopLoss);
  const dateStr = payload.time ? new Date(payload.time * 1000).toUTCString() : new Date().toUTCString();

  return (
    `${payload.assetIcon} <b>${payload.displayName} [${payload.timeframe.toUpperCase()}] — 4-CONFLUENCE V3.0</b>\n` +
    `──────────────────────────\n` +
    `${dirEmoji} <b>Signal Direction:</b> <b>${dirLabel}</b>\n` +
    `🎯 <b>Setup Quality:</b> <code>${gradeBadge} • ${payload.score}/100 PTS</code>\n` +
    `🛡️ <b>Mandatory Confluences:</b> <code>${payload.allMandatoryPassed ? '4/4 PASSED ✓' : 'FAILED ✗'}</code>\n\n` +
    `📍 <b>Entry Price (CE 50% FVG):</b> <code>$${payload.entry.toFixed(2)}</code>\n` +
    `🛑 <b>Structural SL (+0.2x ATR):</b> <code>$${payload.stopLoss.toFixed(2)}</code> (-${payload.riskPips.toFixed(0)} ${payload.pipUnit})\n` +
    `🎯 <b>TP 1 (+1.5R):</b> <code>$${payload.tp1.toFixed(2)}</code> (+${payload.rewardTp1Pips.toFixed(0)} ${payload.pipUnit})\n` +
    `   <i>↳ Rule: Close 50% position & move Stop-Loss to Breakeven</i>\n` +
    `🏆 <b>TP 2 (+2.5R Runner):</b> <code>$${payload.tp2.toFixed(2)}</code> (+${payload.rewardTp2Pips.toFixed(0)} ${payload.pipUnit})\n` +
    `   <i>↳ Net Gross Expectation: +2.0R Payout</i>\n\n` +
    `💼 <b>Low-Risk Money Management (0.25% Policy):</b>\n` +
    `• Planned Risk: <code>$${(payload.plannedRiskUsd || 25.0).toFixed(2)} (0.25% equity)</code>\n` +
    (payload.positionSize ? `• Position Size: <code>${payload.positionSize} ${payload.positionUnit || 'lots'}</code>\n` : '') +
    `• Pending Expiry: <code>4-bar M15 window</code>\n\n` +
    `🔍 <b>Confluence Reasoning:</b>\n` +
    `• ${payload.reason || 'Liquidity sweep + MSS displacement body + FVG CE 50% tap'}\n\n` +
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
  stage: 'TP1' | 'TP2' | 'BE_EXIT';
  entry: number;
  targetPrice: number;
  pnlDollars?: number;
  pips?: number;
  pipUnit: string;
}): string {
  const isBuy = payload.type === 'BUY';
  const dirLabel = isBuy ? 'BUY' : 'SELL';

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
  time: number;
  isActionable?: boolean;
}): Promise<TelegramBroadcastResult | null> {
  const cfg = getTelegramConfig();
  if (!cfg.botToken || !cfg.chatId || !cfg.autoBroadcast) {
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
  stage: 'TP1' | 'TP2' | 'BE_EXIT';
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
