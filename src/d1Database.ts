import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { HistoricalSignal, LockedActivePosition } from './indicators.js';

export interface D1Config {
  accountId?: string;
  databaseId?: string;
  apiToken?: string;
}

export interface D1DbStatus {
  isConfigured: boolean;
  driver: 'CLOUDFLARE_D1_API' | 'CLOUDFLARE_D1_BINDING' | 'LOCAL_FALLBACK';
  databaseId?: string;
  lastSyncTime?: number;
  totalEntriesStored: number;
}

interface LocalD1Storage {
  activeByTf: Record<string, LockedActivePosition>;
  closedByTf: Record<string, HistoricalSignal[]>;
}

const LOCAL_DB_PATH = join(process.cwd(), 'data', 'd1_entries.json');

// In-memory cache synced with D1
let memoryStore: LocalD1Storage = {
  activeByTf: {},
  closedByTf: {},
};

let isD1Initialized = false;

function loadLocalFallback(): LocalD1Storage {
  try {
    if (existsSync(LOCAL_DB_PATH)) {
      const raw = readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(raw) as LocalD1Storage;
    }
  } catch (err) {
    console.warn('[D1] Failed to read local fallback store:', err);
  }
  return { activeByTf: {}, closedByTf: {} };
}

function saveLocalFallback(store: LocalD1Storage): void {
  try {
    const dir = dirname(LOCAL_DB_PATH);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(LOCAL_DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[D1] Failed to write local fallback store:', err);
  }
}

// Initialize memory store from local disk on startup
memoryStore = loadLocalFallback();

function getD1Config(): D1Config {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID,
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || process.env.D1_DATABASE_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN,
  };
}

/**
 * Execute SQL Query on Cloudflare D1 via REST API or Cloudflare Workers Binding
 */
export async function executeD1Query<T = any>(
  sql: string,
  params: any[] = [],
  cfBinding?: any
): Promise<T[]> {
  // 1. Direct Cloudflare Workers / Pages Binding (if running on Cloudflare Edge)
  if (cfBinding && typeof cfBinding.prepare === 'function') {
    try {
      const stmt = cfBinding.prepare(sql);
      const res = await (params.length > 0 ? stmt.bind(...params).all() : stmt.all());
      return (res.results || []) as T[];
    } catch (err) {
      console.error('[D1 Binding Error]:', err);
    }
  }

  // 2. Cloudflare D1 REST API (when running on Vercel, Node.js, or local dev)
  const config = getD1Config();
  if (config.accountId && config.databaseId && config.apiToken) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const resp = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          params,
        }),
      });

      clearTimeout(timeout);

      if (resp.ok) {
        const json = (await resp.json()) as any;
        if (json.success && json.result?.[0]?.results) {
          return json.result[0].results as T[];
        }
      } else {
        const errText = await resp.text();
        console.warn(`[D1 REST API Error] Status ${resp.status}:`, errText);
      }
    } catch (err) {
      console.warn('[D1 REST API Exception]:', err);
    }
  }

  return [];
}

/**
 * Initialize Cloudflare D1 Trade Entries Table
 */
export async function initD1Database(cfBinding?: any): Promise<boolean> {
  if (isD1Initialized) return true;

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS trade_entries (
      id TEXT PRIMARY KEY,
      timeframe TEXT NOT NULL,
      time INTEGER NOT NULL,
      type TEXT NOT NULL,
      grade TEXT NOT NULL,
      probability REAL NOT NULL,
      confidence REAL NOT NULL,
      entry REAL NOT NULL,
      stop_loss REAL NOT NULL,
      tp1 REAL NOT NULL,
      tp2 REAL NOT NULL,
      be_trigger REAL NOT NULL,
      hit_be_lock INTEGER NOT NULL DEFAULT 0,
      hit_tp1 INTEGER NOT NULL DEFAULT 0,
      hit_tp2 INTEGER NOT NULL DEFAULT 0,
      hit_sl INTEGER NOT NULL DEFAULT 0,
      outcome TEXT NOT NULL,
      pnl_dollars_per_oz REAL NOT NULL DEFAULT 0,
      reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `;

  const config = getD1Config();
  if ((config.accountId && config.databaseId && config.apiToken) || cfBinding) {
    try {
      await executeD1Query(createTableSql, [], cfBinding);
      await executeD1Query(
        `CREATE INDEX IF NOT EXISTS idx_trade_entries_tf_outcome ON trade_entries(timeframe, outcome);`,
        [],
        cfBinding
      );
      await executeD1Query(
        `CREATE INDEX IF NOT EXISTS idx_trade_entries_time ON trade_entries(time DESC);`,
        [],
        cfBinding
      );
      isD1Initialized = true;
      console.log('✅ Cloudflare D1 Database connected and trade_entries schema initialized.');
      return true;
    } catch (err) {
      console.warn('⚠️ Cloudflare D1 initialization failed, using local/in-memory store fallback:', err);
    }
  }

  isD1Initialized = true;
  return false;
}

/**
 * Retrieve Active Locked Trade from Cloudflare D1 (or fallback)
 */
export async function getD1ActiveTrade(
  timeframe: string,
  cfBinding?: any
): Promise<LockedActivePosition | null> {
  // Check in-memory store first
  if (memoryStore.activeByTf[timeframe]) {
    return memoryStore.activeByTf[timeframe];
  }

  const config = getD1Config();
  if ((config.accountId && config.databaseId && config.apiToken) || cfBinding) {
    const rows = await executeD1Query<any>(
      `SELECT * FROM trade_entries WHERE timeframe = ? AND outcome = 'ACTIVE' ORDER BY time DESC LIMIT 1`,
      [timeframe],
      cfBinding
    );

    if (rows && rows.length > 0) {
      const r = rows[0];
      const locked: LockedActivePosition = {
        id: r.id,
        timeframe: r.timeframe,
        time: r.time,
        type: r.type,
        grade: r.grade,
        probability: r.probability,
        confidence: r.confidence,
        entry: r.entry,
        stopLoss: r.stop_loss,
        tp1: r.tp1,
        tp2: r.tp2,
        beTrigger: r.be_trigger,
        hitBeLock: Boolean(r.hit_be_lock),
        hitTp1: Boolean(r.hit_tp1),
        hitTp2: Boolean(r.hit_tp2),
        hitSl: Boolean(r.hit_sl),
        outcome: 'ACTIVE',
        pnlDollarsPerOz: r.pnl_dollars_per_oz || 0,
        reason: r.reason || '',
      };
      memoryStore.activeByTf[timeframe] = locked;
      return locked;
    }
  }

  return null;
}

/**
 * Retrieve Closed Trade History from Cloudflare D1 (or fallback)
 */
export async function getD1ClosedHistory(
  timeframe: string,
  limit = 20,
  cfBinding?: any
): Promise<HistoricalSignal[]> {
  const config = getD1Config();
  if ((config.accountId && config.databaseId && config.apiToken) || cfBinding) {
    const rows = await executeD1Query<any>(
      `SELECT * FROM trade_entries WHERE timeframe = ? AND outcome != 'ACTIVE' ORDER BY time DESC LIMIT ?`,
      [timeframe, limit],
      cfBinding
    );

    if (rows && rows.length > 0) {
      const mapped: HistoricalSignal[] = rows.map((r) => ({
        time: r.time,
        type: r.type,
        grade: r.grade,
        probability: r.probability,
        confidence: r.confidence,
        entry: r.entry,
        stopLoss: r.stop_loss,
        tp1: r.tp1,
        tp2: r.tp2,
        outcome: r.outcome,
        pnlDollarsPerOz: r.pnl_dollars_per_oz,
        reason: r.reason,
      }));
      memoryStore.closedByTf[timeframe] = mapped;
      return mapped;
    }
  }

  return memoryStore.closedByTf[timeframe] || [];
}

/**
 * Persist Newly Activated Trade into Cloudflare D1 & In-Memory Store
 */
export async function saveD1ActiveTrade(
  trade: LockedActivePosition,
  cfBinding?: any
): Promise<void> {
  memoryStore.activeByTf[trade.timeframe] = trade;
  saveLocalFallback(memoryStore);

  const config = getD1Config();
  if ((config.accountId && config.databaseId && config.apiToken) || cfBinding) {
    const nowIso = new Date().toISOString();
    const sql = `
      INSERT INTO trade_entries (
        id, timeframe, time, type, grade, probability, confidence,
        entry, stop_loss, tp1, tp2, be_trigger, hit_be_lock, hit_tp1, hit_tp2, hit_sl,
        outcome, pnl_dollars_per_oz, reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        hit_be_lock = excluded.hit_be_lock,
        hit_tp1 = excluded.hit_tp1,
        hit_tp2 = excluded.hit_tp2,
        hit_sl = excluded.hit_sl,
        outcome = excluded.outcome,
        pnl_dollars_per_oz = excluded.pnl_dollars_per_oz,
        updated_at = excluded.updated_at;
    `;

    const params = [
      trade.id,
      trade.timeframe,
      trade.time,
      trade.type,
      trade.grade,
      trade.probability,
      trade.confidence,
      trade.entry,
      trade.stopLoss,
      trade.tp1,
      trade.tp2,
      trade.beTrigger,
      trade.hitBeLock ? 1 : 0,
      trade.hitTp1 ? 1 : 0,
      trade.hitTp2 ? 1 : 0,
      trade.hitSl ? 1 : 0,
      trade.outcome,
      trade.pnlDollarsPerOz,
      trade.reason,
      nowIso,
      nowIso,
    ];

    void executeD1Query(sql, params, cfBinding);
  }
}

/**
 * Archive Closed Trade into Cloudflare D1 & Update State
 */
export async function archiveD1ClosedTrade(
  trade: LockedActivePosition,
  cfBinding?: any
): Promise<void> {
  delete memoryStore.activeByTf[trade.timeframe];

  const closedList = memoryStore.closedByTf[trade.timeframe] || [];
  if (!closedList.some((c) => c.time === trade.time)) {
    closedList.unshift({
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
    memoryStore.closedByTf[trade.timeframe] = closedList.slice(0, 25);
  }
  saveLocalFallback(memoryStore);

  const config = getD1Config();
  if ((config.accountId && config.databaseId && config.apiToken) || cfBinding) {
    const nowIso = new Date().toISOString();
    const sql = `
      UPDATE trade_entries SET
        outcome = ?,
        hit_be_lock = ?,
        hit_tp1 = ?,
        hit_tp2 = ?,
        hit_sl = ?,
        pnl_dollars_per_oz = ?,
        updated_at = ?
      WHERE id = ?;
    `;

    const params = [
      trade.outcome,
      trade.hitBeLock ? 1 : 0,
      trade.hitTp1 ? 1 : 0,
      trade.hitTp2 ? 1 : 0,
      trade.hitSl ? 1 : 0,
      trade.pnlDollarsPerOz,
      nowIso,
      trade.id,
    ];

    void executeD1Query(sql, params, cfBinding);
  }
}

/**
 * Get Diagnostic Status of D1 Connection
 */
export function getD1Status(): D1DbStatus {
  const config = getD1Config();
  const hasConfig = Boolean(config.accountId && config.databaseId && config.apiToken);
  let totalCount = 0;
  for (const list of Object.values(memoryStore.closedByTf)) {
    totalCount += list.length;
  }
  totalCount += Object.keys(memoryStore.activeByTf).length;

  return {
    isConfigured: hasConfig,
    driver: hasConfig ? 'CLOUDFLARE_D1_API' : 'LOCAL_FALLBACK',
    databaseId: config.databaseId,
    totalEntriesStored: totalCount,
  };
}

/**
 * Synchronize in-memory active position with D1 state
 */
export function syncMemoryActiveTrade(timeframe: string, trade: LockedActivePosition): void {
  memoryStore.activeByTf[timeframe] = trade;
  saveLocalFallback(memoryStore);
}

export function syncMemoryClosedTrade(timeframe: string, trade: HistoricalSignal): void {
  const list = memoryStore.closedByTf[timeframe] || [];
  if (!list.some((s) => s.time === trade.time)) {
    list.unshift(trade);
    memoryStore.closedByTf[timeframe] = list.slice(0, 25);
    saveLocalFallback(memoryStore);
  }
}

/**
 * Load initial persistent state into indicators maps on boot
 */
export function loadInitialD1State(
  activeMap: Map<string, LockedActivePosition>,
  closedMap: Map<string, HistoricalSignal[]>
): void {
  for (const [tf, pos] of Object.entries(memoryStore.activeByTf)) {
    activeMap.set(tf, pos);
  }
  for (const [tf, list] of Object.entries(memoryStore.closedByTf)) {
    closedMap.set(tf, [...list]);
  }
}

/**
 * Get all trade entries across all timeframes for inspection
 */
export function getAllStoredD1Entries(): {
  active: Record<string, LockedActivePosition>;
  closed: Record<string, HistoricalSignal[]>;
} {
  return {
    active: { ...memoryStore.activeByTf },
    closed: { ...memoryStore.closedByTf },
  };
}
