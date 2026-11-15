import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { HistoricalSignal, LockedActivePosition } from './indicators.js';

const require = createRequire(import.meta.url);

export interface D1Config {
  accountId?: string;
  databaseId?: string;
  apiToken?: string;
}

export interface D1DbStatus {
  isConfigured: boolean;
  driver: 'CLOUDFLARE_D1_LOCAL' | 'CLOUDFLARE_D1_BINDING' | 'CLOUDFLARE_D1_API';
  mode: 'LOCAL_FIRST' | 'REMOTE_FIRST';
  databaseId?: string;
  databasePath?: string;
  lastSyncTime?: number;
  totalEntriesStored: number;
}

interface LocalD1Storage {
  activeByTf: Record<string, LockedActivePosition>;
  closedByTf: Record<string, HistoricalSignal[]>;
}

const LOCAL_SQLITE_PATH = join(process.cwd(), 'data', 'd1_local.sqlite');
const LOCAL_DB_PATH = join(process.cwd(), 'data', 'd1_entries.json');

// In-memory cache synced with D1
let memoryStore: LocalD1Storage = {
  activeByTf: {},
  closedByTf: {},
};

let localSqliteDb: any = null;
let isD1Initialized = false;

// Initialize local SQLite engine (Node.js built-in SQLite, matching Cloudflare D1 engine)
function getLocalSqliteDb(): any {
  if (localSqliteDb) return localSqliteDb;
  try {
    const { DatabaseSync } = require('node:sqlite');
    const dir = dirname(LOCAL_SQLITE_PATH);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    localSqliteDb = new DatabaseSync(LOCAL_SQLITE_PATH);
    return localSqliteDb;
  } catch (err) {
    console.warn('[D1 Local] SQLite engine notice:', err);
    return null;
  }
}

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
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || process.env.D1_DATABASE_ID || 'd59c377c-934d-43b9-b00a-dee0c947be28',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN,
  };
}

/**
 * Execute SQL Query on Cloudflare D1 (Local SQLite First, or Cloudflare Edge Binding / REST API)
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

  // 2. Local D1 SQLite First (Local Database Sync matching Cloudflare D1)
  const db = getLocalSqliteDb();
  let localResults: T[] = [];
  if (db) {
    try {
      const cleanSql = sql.trim();
      const isSelect = cleanSql.toUpperCase().startsWith('SELECT') || cleanSql.toUpperCase().startsWith('PRAGMA');
      if (isSelect) {
        const stmt = db.prepare(sql);
        localResults = stmt.all(...params) as T[];
      } else {
        const stmt = db.prepare(sql);
        stmt.run(...params);
      }
    } catch (err) {
      console.warn('[D1 Local SQLite Query Error]:', err);
    }
  }

  // 3. Optional: Cloudflare D1 Remote REST API Sync (if remote API tokens configured)
  const config = getD1Config();
  if (config.accountId && config.apiToken && config.databaseId) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      void fetch(url, {
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
      }).then(() => clearTimeout(timeout)).catch(() => clearTimeout(timeout));
    } catch {}
  }

  return localResults;
}

/**
 * Initialize Cloudflare D1 Trade Entries Table (Local First)
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

    // Sync any existing JSON backup records into Local D1 SQLite if database is fresh
    const db = getLocalSqliteDb();
    if (db) {
      try {
        const countRow = db.prepare('SELECT COUNT(*) as c FROM trade_entries').get() as any;
        if (!countRow || countRow.c === 0) {
          const insertStmt = db.prepare(`
            INSERT INTO trade_entries (
              id, timeframe, time, type, grade, probability, confidence,
              entry, stop_loss, tp1, tp2, be_trigger, hit_be_lock, hit_tp1, hit_tp2, hit_sl,
              outcome, pnl_dollars_per_oz, reason, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO NOTHING;
          `);
          const nowIso = new Date().toISOString();
          for (const [tf, active] of Object.entries(memoryStore.activeByTf || {})) {
            insertStmt.run(
              active.id || `ACTIVE_${tf}`, tf, active.time, active.type, active.grade,
              active.probability, active.confidence, active.entry, active.stopLoss, active.tp1, active.tp2,
              active.beTrigger || active.entry, active.hitBeLock ? 1 : 0, active.hitTp1 ? 1 : 0, active.hitTp2 ? 1 : 0, active.hitSl ? 1 : 0,
              'ACTIVE', active.pnlDollarsPerOz || 0, active.reason || '', nowIso, nowIso
            );
          }
          for (const [tf, list] of Object.entries(memoryStore.closedByTf || {})) {
            for (const s of list) {
              insertStmt.run(
                `TF_${tf}_${s.time}`, tf, s.time, s.type, s.grade,
                s.probability, s.confidence, s.entry, s.stopLoss, s.tp1, s.tp2,
                s.entry, s.outcome === 'TP1_HIT' || s.outcome === 'TP2_HIT' ? 1 : 0,
                s.outcome === 'TP1_HIT' || s.outcome === 'TP2_HIT' ? 1 : 0,
                s.outcome === 'TP2_HIT' ? 1 : 0, s.outcome === 'SL_HIT' ? 1 : 0,
                s.outcome, s.pnlDollarsPerOz || 0, s.reason || '', nowIso, nowIso
              );
            }
          }
        }
      } catch (err) {
        console.warn('[D1 Local Sync Notice]:', err);
      }
    }

    isD1Initialized = true;
    console.log(`✅ Cloudflare D1 Local SQLite active (data/d1_local.sqlite) [Database: ${getD1Config().databaseId}]`);
    return true;
  } catch (err) {
    console.warn('[D1 Local Init Exception]:', err);
    isD1Initialized = true;
    return false;
  }
}

/**
 * Retrieve Active Locked Trade from Cloudflare D1 (Local First)
 */
export async function getD1ActiveTrade(
  timeframe: string,
  cfBinding?: any
): Promise<LockedActivePosition | null> {
  // Check in-memory store first
  if (memoryStore.activeByTf[timeframe]) {
    return memoryStore.activeByTf[timeframe];
  }

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

  return null;
}

/**
 * Retrieve Closed Trade History from Cloudflare D1 (Local First)
 */
export async function getD1ClosedHistory(
  timeframe: string,
  limit = 20,
  cfBinding?: any
): Promise<HistoricalSignal[]> {
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

  return memoryStore.closedByTf[timeframe] || [];
}

/**
 * Persist Newly Activated Trade into Cloudflare D1 Local & In-Memory Store
 */
export async function saveD1ActiveTrade(
  trade: LockedActivePosition,
  cfBinding?: any
): Promise<void> {
  memoryStore.activeByTf[trade.timeframe] = trade;
  saveLocalFallback(memoryStore);

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

/**
 * Archive Closed Trade into Cloudflare D1 Local & Update State
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

/**
 * Persist Newly Discovered Historical Closed Trades into D1 Local Store (Immutable Lock)
 */
export async function saveD1ClosedList(
  timeframe: string,
  list: HistoricalSignal[],
  cfBinding?: any
): Promise<void> {
  const existing = memoryStore.closedByTf[timeframe] || [];
  const merged = [...existing];
  let hasNew = false;

  for (const s of list) {
    if (!merged.some((m) => m.time === s.time)) {
      merged.push(s);
      hasNew = true;
    }
  }

  if (!hasNew && memoryStore.closedByTf[timeframe]?.length) {
    return;
  }

  merged.sort((a, b) => b.time - a.time);
  memoryStore.closedByTf[timeframe] = merged.slice(0, 30);
  saveLocalFallback(memoryStore);

  const nowIso = new Date().toISOString();
  for (const s of list) {
    const id = `TF_${timeframe}_${s.time}`;
    const sql = `
      INSERT INTO trade_entries (
        id, timeframe, time, type, grade, probability, confidence,
        entry, stop_loss, tp1, tp2, be_trigger, hit_be_lock, hit_tp1, hit_tp2, hit_sl,
        outcome, pnl_dollars_per_oz, reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING;
    `;
    const params = [
      id,
      timeframe,
      s.time,
      s.type,
      s.grade,
      s.probability,
      s.confidence,
      s.entry,
      s.stopLoss,
      s.tp1,
      s.tp2,
      s.entry,
      s.outcome === 'TP1_HIT' || s.outcome === 'TP2_HIT' ? 1 : 0,
      s.outcome === 'TP1_HIT' || s.outcome === 'TP2_HIT' ? 1 : 0,
      s.outcome === 'TP2_HIT' ? 1 : 0,
      s.outcome === 'SL_HIT' ? 1 : 0,
      s.outcome,
      s.pnlDollarsPerOz,
      s.reason,
      nowIso,
      nowIso,
    ];
    void executeD1Query(sql, params, cfBinding);
  }
}

/**
 * Get Diagnostic Status of D1 Connection (Local First)
 */
export function getD1Status(): D1DbStatus {
  const config = getD1Config();
  let totalCount = 0;
  const db = getLocalSqliteDb();
  if (db) {
    try {
      const row = db.prepare('SELECT COUNT(*) as c FROM trade_entries').get() as any;
      if (row && typeof row.c === 'number') {
        totalCount = row.c;
      }
    } catch {}
  }

  if (!totalCount) {
    for (const list of Object.values(memoryStore.closedByTf)) {
      totalCount += list.length;
    }
    totalCount += Object.keys(memoryStore.activeByTf).length;
  }

  return {
    isConfigured: true,
    driver: 'CLOUDFLARE_D1_LOCAL',
    mode: 'LOCAL_FIRST',
    databaseId: config.databaseId,
    databasePath: 'data/d1_local.sqlite',
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
