/**
 * file: db.ts
 * description: 文件 · 待补充描述
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-04
 * updated: 2026-04-04
 * status: active
 * tags: [file]
 *
 * brief: 待补充简要说明
 *
 * details: 待补充详细说明
 *
 * dependencies: 待补充
 * exports: 待补充
 * notes: 待补充
 */

/**
 * YYC³ AI Family — Database Layer (记忆长河·PostgreSQL 主库版)
 *
 * Dual-engine architecture:
 *   PRIMARY:  PostgreSQL 15 (via DATABASE_URL env)
 *   FALLBACK: SQLite (bun:sqlite, ./data/yyc3-family.db)
 *
 * Engine selection:
 *   - DATABASE_URL set + PG reachable → PostgreSQL
 *   - DATABASE_URL not set / PG unreachable → SQLite auto-degrade
 *
 * Repository pattern: identical API regardless of engine.
 * All methods async, all errors caught + logged.
 *
 * Usage:
 *   import { db } from "./db";
 *   await db.init();                     // Auto-detect engine + migrate
 *   const members = await db.members.findAll();
 *   await db.signals.insert({ ... });
 */

import { Database as SQLiteDB, SQLQueryBindings } from "bun:sqlite";
import { randomUUID } from "crypto";
import { database as dbConfig } from "./config";

// ==========================================
// Types (shared between engines)
// ==========================================

export interface MemberPermissions {
  canEdit?: boolean;
  canDelete?: boolean;
  canInvite?: boolean;
  [key: string]: boolean | string | number | undefined;
}

export interface DeviceConfig {
  theme?: string;
  language?: string;
  notifications?: boolean;
  [key: string]: string | boolean | number | undefined;
}

export interface MemberMetrics {
  signalCount?: number;
  avgResponseTime?: number;
  uptime?: number;
  [key: string]: number | undefined;
}

export interface DBMemberRow {
  role_id: string;
  display_name: string;
  mood: string;
  is_online: boolean | number;   // PG: boolean, SQLite: 0/1
  current_activity: string;
  system_prompt: string | null;
  avatar_url: string | null;
  permissions: MemberPermissions | string;
  device_config: DeviceConfig | string | null;
  metrics: MemberMetrics | string;
  created_at: string;
  updated_at: string;
}

export interface DBSignalRow {
  id: string;
  timestamp: number;
  signal_type: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  mood: string | null;
  priority: string;
  model_source: string | null;
  dialogue_chain_id: string | null;
  reply_to_signal_id: string | null;
  device_id: string | null;
  processing_time: number | null;
  model_endpoint: string | null;
  routing_ratio: string | null;
  created_at: string;
}

export interface CallMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export interface SignalInput {
  id?: string;
  timestamp: number;
  type: string;
  senderId: string;
  receiverId: string;
  content: string;
  mood?: string;
  priority?: string;
  modelSource?: string;
  dialogueChainId?: string;
  replyToSignalId?: string;
  deviceId?: string;
  processingTime?: number;
  modelEndpoint?: string;
  routingRatio?: string;
}

export interface AgentCallLogInput {
  requestId: string;
  roleId: string;
  model: string;
  provider?: string;
  systemPromptHash?: string;
  promptPreview: string;
  responsePreview: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  fallbackUsed?: boolean;
  dialogueChainId?: string;
  metadata?: CallMetadata;
}

export interface DBAgentCallLogRow {
  id: string;
  request_id: string;
  role_id: string;
  model: string;
  provider: string | null;
  system_prompt_hash: string | null;
  prompt_preview: string;
  response_preview: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  latency_ms: number;
  success: boolean | number;
  error_message: string | null;
  fallback_used: boolean | number;
  dialogue_chain_id: string | null;
  metadata: CallMetadata | string;
  created_at: string;
}

export interface DBDialogueChainRow {
  id: string;
  origin_signal_id: string | null;
  topic: string;
  participants: string[] | string;
  status: string;
  model_call_count: number;
  mock_call_count: number;
  total_tokens: number;
  created_at: string;
  concluded_at: string | null;
}

export interface DBRateLimitRow {
  key: string;
  real_count: number;
  mock_count: number;
  window_start: string;
  window_duration_ms: number;
  updated_at: string;
}

export interface DBKBChunkRow {
  id: string;
  source: string;
  source_type: string;
  content: string;
  metadata: Record<string, unknown> | string;
  embedding: number[] | null;
  chunk_index: number;
  total_chunks: number;
  content_hash: string | null;
  created_at: string;
  updated_at: string;
  similarity?: number;
}

export interface DBSystemEventRow {
  id: string;
  event_type: string;
  source: string;
  data: Record<string, unknown> | string;
  severity: string;
  created_at: string;
}

// ==========================================
// Database Adapter Interface
// ==========================================

type QueryParams = SQLQueryBindings[];
type QueryResult = Record<string, unknown>;

interface IDBAdapter {
  engine: "postgresql" | "sqlite";
  query<T = QueryResult>(sql: string, params?: QueryParams): Promise<T[]>;
  queryOne<T = QueryResult>(sql: string, params?: QueryParams): Promise<T | null>;
  execute(sql: string, params?: QueryParams): Promise<{ rowCount: number }>;
  executeRaw(sql: string): Promise<void>;
  isHealthy(): Promise<boolean>;
  getStats(): Promise<Record<string, unknown>>;
  close(): Promise<void>;
}

// ==========================================
// PostgreSQL Adapter (postgres package)
// ==========================================

interface PostgresClient {
  unsafe: (sql: string, params?: unknown[]) => Promise<unknown[]>;
  end: (options?: { timeout?: number }) => Promise<void>;
}

class PostgresAdapter implements IDBAdapter {
  engine = "postgresql" as const;
  private sql: PostgresClient;

  constructor(url: string) {
    try {
      const postgres = require("postgres");
      this.sql = postgres(url, {
        max: dbConfig.poolSize,
        idle_timeout: dbConfig.idleTimeout,
        max_lifetime: dbConfig.maxLifetime,
        connect_timeout: 10,
        prepare: true,
        transform: { undefined: null },
        connection: {
          statement_timeout: dbConfig.statementTimeout,
          application_name: "yyc3-ai-family",
        },
        onnotice: () => { },
      });
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(`PostgreSQL driver not available: ${error.message}. Run: bun add postgres`);
    }
  }

  async query<T = QueryResult>(sql: string, params: QueryParams = []): Promise<T[]> {
    if (params.length === 0) {
      return (await this.sql.unsafe(sql)) as T[];
    }
    return (await this.sql.unsafe(sql, params)) as T[];
  }

  async queryOne<T = QueryResult>(sql: string, params: QueryParams = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async execute(sql: string, params: QueryParams = []): Promise<{ rowCount: number }> {
    const result = await this.sql.unsafe(sql, params) as { count?: number }[];
    return { rowCount: result[0]?.count ?? 0 };
  }

  async executeRaw(sql: string): Promise<void> {
    await this.sql.unsafe(sql);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const rows = await this.sql.unsafe("SELECT 1 as ok") as { ok?: number }[];
      return rows[0]?.ok === 1;
    } catch {
      return false;
    }
  }

  async getStats(): Promise<Record<string, unknown>> {
    try {
      const tables = await this.sql.unsafe(
        "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
      ) as { tablename: string }[];
      const stats: Record<string, unknown> = { engine: "postgresql", tables: {} };
      const tablesStats = stats.tables as Record<string, number>;
      for (const t of tables) {
        const rows = await this.sql.unsafe(`SELECT COUNT(*) as count FROM "${t.tablename}"`) as { count?: number }[];
        tablesStats[t.tablename] = Number(rows[0]?.count || 0);
      }
      stats.pool = {
        size: dbConfig.poolSize,
        idleTimeout: dbConfig.idleTimeout,
        maxLifetime: dbConfig.maxLifetime,
      };
      const sizeRows = await this.sql.unsafe(
        "SELECT pg_size_pretty(pg_database_size(current_database())) as size"
      ) as { size?: string }[];
      stats.databaseSize = sizeRows[0]?.size;
      return stats;
    } catch (err: unknown) {
      const error = err as Error;
      return { engine: "postgresql", error: error.message };
    }
  }

  async close(): Promise<void> {
    if (this.sql) {
      await this.sql.end({ timeout: 5 });
    }
  }
}

// ==========================================
// SQLite Adapter (bun:sqlite fallback)
// ==========================================

const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS family_members (
  role_id TEXT PRIMARY KEY, display_name TEXT NOT NULL, mood TEXT DEFAULT 'SERENE',
  is_online INTEGER DEFAULT 0, current_activity TEXT DEFAULT '', system_prompt TEXT,
  avatar_url TEXT, permissions TEXT DEFAULT '{}', device_config TEXT,
  metrics TEXT DEFAULT '{"signalCount":0,"avgResponseTime":0,"uptime":0}',
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY, timestamp INTEGER NOT NULL, signal_type TEXT NOT NULL,
  sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL, content TEXT NOT NULL,
  mood TEXT, priority TEXT DEFAULT 'NORMAL', model_source TEXT,
  dialogue_chain_id TEXT, reply_to_signal_id TEXT, device_id TEXT,
  processing_time INTEGER, model_endpoint TEXT, routing_ratio TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_signals_ts ON signals(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_signals_sender ON signals(sender_id);
CREATE INDEX IF NOT EXISTS idx_signals_chain ON signals(dialogue_chain_id);
CREATE TABLE IF NOT EXISTS dialogue_chains (
  id TEXT PRIMARY KEY, origin_signal_id TEXT, topic TEXT NOT NULL,
  participants TEXT NOT NULL, status TEXT DEFAULT 'ACTIVE',
  model_call_count INTEGER DEFAULT 0, mock_call_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')), concluded_at TEXT
);
CREATE TABLE IF NOT EXISTS agent_call_log (
  id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE, role_id TEXT NOT NULL,
  model TEXT NOT NULL, provider TEXT, system_prompt_hash TEXT,
  prompt_preview TEXT, response_preview TEXT,
  input_tokens INTEGER, output_tokens INTEGER, latency_ms INTEGER,
  success INTEGER DEFAULT 1, error_message TEXT, fallback_used INTEGER DEFAULT 0,
  dialogue_chain_id TEXT, metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_agent_log_role ON agent_call_log(role_id);
CREATE INDEX IF NOT EXISTS idx_agent_log_created ON agent_call_log(created_at DESC);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY, real_count INTEGER DEFAULT 0, mock_count INTEGER DEFAULT 0,
  window_start TEXT DEFAULT (datetime('now')), window_duration_ms INTEGER DEFAULT 60000,
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS kb_chunks (
  id TEXT PRIMARY KEY, source TEXT NOT NULL, source_type TEXT DEFAULT 'markdown',
  content TEXT NOT NULL, metadata TEXT DEFAULT '{}', embedding BLOB,
  chunk_index INTEGER DEFAULT 0, total_chunks INTEGER DEFAULT 1,
  content_hash TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kb_source ON kb_chunks(source);
CREATE TABLE IF NOT EXISTS system_events (
  id TEXT PRIMARY KEY, event_type TEXT NOT NULL, source TEXT NOT NULL,
  data TEXT DEFAULT '{}', severity TEXT DEFAULT 'info',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_created ON system_events(created_at DESC);
CREATE TABLE IF NOT EXISTS workflow_instances (
  id TEXT PRIMARY KEY, workflow_id TEXT NOT NULL, status TEXT DEFAULT 'pending',
  current_step INTEGER DEFAULT 0, params TEXT DEFAULT '{}', result TEXT,
  error TEXT, started_at TEXT DEFAULT (datetime('now')), completed_at TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
-- ─── 私信系统 (§1.5 /ai-family-messages) ─────────────────────────
CREATE TABLE IF NOT EXISTS family_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  metadata TEXT DEFAULT '{}',
  is_broadcast INTEGER DEFAULT 0,
  read_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fm_thread ON family_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_fm_recipient ON family_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_fm_sender ON family_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_fm_created ON family_messages(created_at DESC);
CREATE TABLE IF NOT EXISTS family_threads (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'direct',
  participant_ids TEXT NOT NULL,
  last_message_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ft_participants ON family_threads(participant_ids);
`;

const SQLITE_SEED = `
INSERT OR IGNORE INTO family_members (role_id, display_name, mood, is_online, current_activity) VALUES
  ('NAVIGATOR',   '言启·千行',  'SERENE',  1, '聆听万千言语...'),
  ('THINKER',     '语枢·万物',  'FOCUSED', 1, '沉思数据中...'),
  ('PROPHET',     '预见·先知',  'SERENE',  1, '观过往脉络...'),
  ('BOLE',        '知遇·伯乐',  'LOVING',  1, '挖掘潜能中...'),
  ('META_ORACLE', '元启·天枢',  'FOCUSED', 1, '调度万物归元...'),
  ('GUARDIAN',    '智云·守护',  'SERENE',  1, '警戒威胁中...'),
  ('MASTER',      '格物·宗师',  'FOCUSED', 1, '究万物之理...'),
  ('CREATIVE',    '创想·灵韵',  'EXCITED', 1, '绘就无限可能...');
INSERT OR IGNORE INTO rate_limits (key, real_count, mock_count, window_duration_ms) VALUES
  ('model_ratio:global', 0, 0, 60000);
`;

/**
 * 九层家人档案 v2.0 — 8 位家人 RoleId 白名单
 * 用于清理旧 7 角色 seed（PRODUCT_MANAGER / CHIEF_ARCHITECT / AI_ARCHITECT / CODE_ARTISAN / SENTINEL / CENTRAL_PULSE / COLLABORATOR）
 */
const NEW_FAMILY_ROLE_IDS = [
  'NAVIGATOR', 'THINKER', 'PROPHET', 'BOLE',
  'META_ORACLE', 'GUARDIAN', 'MASTER', 'CREATIVE',
] as const;

const SCHEMA_VERSION_CURRENT = '2.0.0-8family';

const SCHEMA_VERSION_SCHEMA = `
CREATE TABLE IF NOT EXISTS schema_version (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version TEXT NOT NULL,
  applied_at TEXT DEFAULT (datetime('now'))
);
`;

class SQLiteAdapter implements IDBAdapter {
  engine = "sqlite" as const;
  private db: SQLiteDB;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    const dir = dbPath.substring(0, dbPath.lastIndexOf("/"));
    if (dir) try { require("fs").mkdirSync(dir, { recursive: true }); } catch { }

    this.db = new SQLiteDB(dbPath, { create: true });
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA synchronous = NORMAL;");
    this.db.exec("PRAGMA cache_size = -64000;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec("PRAGMA busy_timeout = 5000;");
    this.db.exec("PRAGMA temp_store = MEMORY;");
  }

  async query<T = QueryResult>(sql: string, params: QueryParams = []): Promise<T[]> {
    const sqliteSql = sql.replace(/\$(\d+)/g, "?");
    return this.db.prepare(sqliteSql).all(...params) as T[];
  }

  async queryOne<T = QueryResult>(sql: string, params: QueryParams = []): Promise<T | null> {
    const sqliteSql = sql.replace(/\$(\d+)/g, "?");
    return (this.db.prepare(sqliteSql).get(...params) as T) ?? null;
  }

  async execute(sql: string, params: QueryParams = []): Promise<{ rowCount: number }> {
    const sqliteSql = sql.replace(/\$(\d+)/g, "?");
    const result = this.db.prepare(sqliteSql).run(...params);
    return { rowCount: result.changes };
  }

  async executeRaw(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const row = this.db.prepare("SELECT 1 as ok").get() as { ok?: number } | undefined;
      return row?.ok === 1;
    } catch { return false; }
  }

  async getStats(): Promise<Record<string, unknown>> {
    const tables = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all() as { name: string }[];
    const stats: Record<string, unknown> = { engine: "sqlite", path: this.dbPath, tables: {} };
    const tablesStats = stats.tables as Record<string, number>;
    for (const t of tables) {
      const row = this.db.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).get() as { count?: number } | undefined;
      tablesStats[t.name] = row?.count || 0;
    }
    return stats;
  }

  async close(): Promise<void> {
    this.db.close();
  }

  migrate(): void {
    this.db.exec(SCHEMA_VERSION_SCHEMA);
    this.db.exec(SQLITE_SCHEMA);

    // ==========================================
    // 旧 7 角色 seed 检测与清理（一次性迁移）
    // ==========================================
    let needsCleanup = false;
    try {
      const storedVersion = this.db.query(
        "SELECT version FROM schema_version WHERE id = 1"
      ).get() as { version: string } | undefined;

      if (!storedVersion || storedVersion.version !== SCHEMA_VERSION_CURRENT) {
        needsCleanup = true;
      }
    } catch {
      needsCleanup = true;
    }

    if (needsCleanup) {
      const newSet = new Set<string>(NEW_FAMILY_ROLE_IDS);
      const allRows = this.db.query("SELECT role_id FROM family_members").all() as { role_id: string }[];
      const staleIds = allRows
        .map(r => r.role_id)
        .filter(id => !newSet.has(id));

      if (staleIds.length > 0) {
        const inList = staleIds.map(() => '?').join(',');
        this.db.query(`DELETE FROM family_members WHERE role_id IN (${inList})`).run(...staleIds);
        console.log(`[db.migrate] 清理旧角色 seed: ${staleIds.join(', ')}`);
      }

      // 写入 / 更新版本号
      this.db.query(
        `INSERT INTO schema_version (id, version) VALUES (1, ?)
         ON CONFLICT(id) DO UPDATE SET version = excluded.version, applied_at = datetime('now')`
      ).run(SCHEMA_VERSION_CURRENT);
      console.log(`[db.migrate] schema_version → ${SCHEMA_VERSION_CURRENT}`);
    }

    this.db.exec(SQLITE_SEED);
  }
}

// ==========================================
// Repositories (engine-agnostic)
// ==========================================

class MemberRepository {
  constructor(private a: IDBAdapter) { }

  async findAll(): Promise<DBMemberRow[]> {
    return this.a.query("SELECT * FROM family_members ORDER BY role_id");
  }

  async findById(roleId: string): Promise<DBMemberRow | null> {
    return this.a.queryOne("SELECT * FROM family_members WHERE role_id = $1", [roleId]);
  }

  async updateFields(roleId: string, updates: Record<string, unknown>): Promise<boolean> {
    const sets: string[] = [];
    const vals: SQLQueryBindings[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(updates)) {
      const col = camelToSnake(k);
      sets.push(`${col} = $${idx}`);
      vals.push(typeof v === "object" && v !== null ? JSON.stringify(v) : v as SQLQueryBindings);
      idx++;
    }
    if (sets.length === 0) return false;
    const now = this.a.engine === "postgresql" ? "NOW()" : "datetime('now')";
    sets.push(`updated_at = ${now}`);
    vals.push(roleId);
    const r = await this.a.execute(
      `UPDATE family_members SET ${sets.join(", ")} WHERE role_id = $${idx}`, vals
    );
    return r.rowCount > 0;
  }

  async setActivity(roleId: string, activity: string): Promise<void> {
    const now = this.a.engine === "postgresql" ? "NOW()" : "datetime('now')";
    await this.a.execute(
      `UPDATE family_members SET current_activity = $1, updated_at = ${now} WHERE role_id = $2`,
      [activity, roleId]
    );
  }

  async setMood(roleId: string, mood: string): Promise<void> {
    const now = this.a.engine === "postgresql" ? "NOW()" : "datetime('now')";
    await this.a.execute(
      `UPDATE family_members SET mood = $1, updated_at = ${now} WHERE role_id = $2`,
      [mood, roleId]
    );
  }

  async setOnline(roleId: string, online: boolean): Promise<void> {
    const val = this.a.engine === "postgresql" ? online : (online ? 1 : 0);
    const now = this.a.engine === "postgresql" ? "NOW()" : "datetime('now')";
    await this.a.execute(
      `UPDATE family_members SET is_online = $1, updated_at = ${now} WHERE role_id = $2`,
      [val, roleId]
    );
  }

  async incrementSignalCount(roleId: string): Promise<void> {
    if (this.a.engine === "postgresql") {
      await this.a.execute("SELECT increment_member_signal_count($1)", [roleId]);
    } else {
      await this.a.execute(
        `UPDATE family_members SET
          metrics = json_set(metrics, '$.signalCount', COALESCE(json_extract(metrics, '$.signalCount'), 0) + 1),
          updated_at = datetime('now')
         WHERE role_id = $1`, [roleId]
      );
    }
  }

  async count(): Promise<number> {
    const r = await this.a.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM family_members");
    return Number(r?.count || 0);
  }
}

class SignalRepository {
  constructor(private a: IDBAdapter) { }

  async insert(signal: {
    id?: string; timestamp: number; type: string; senderId: string;
    receiverId: string; content: string; mood?: string; priority?: string;
    modelSource?: string; dialogueChainId?: string; replyToSignalId?: string;
    deviceId?: string; processingTime?: number; modelEndpoint?: string;
    routingRatio?: string;
  }): Promise<string> {
    const id = signal.id || randomUUID();
    await this.a.execute(
      `INSERT INTO signals (id, timestamp, signal_type, sender_id, receiver_id, content, mood, priority, model_source, dialogue_chain_id, reply_to_signal_id, device_id, processing_time, model_endpoint, routing_ratio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [id, signal.timestamp, signal.type, signal.senderId, signal.receiverId,
        signal.content, signal.mood || null, signal.priority || "NORMAL",
        signal.modelSource || null, signal.dialogueChainId || null,
        signal.replyToSignalId || null, signal.deviceId || null,
        signal.processingTime || null, signal.modelEndpoint || null, signal.routingRatio || null]
    );
    return id;
  }

  async findRecent(limit: number = 50): Promise<DBSignalRow[]> {
    return this.a.query("SELECT * FROM signals ORDER BY timestamp DESC LIMIT $1", [limit]);
  }

  async findByChain(chainId: string): Promise<DBSignalRow[]> {
    return this.a.query(
      "SELECT * FROM signals WHERE dialogue_chain_id = $1 ORDER BY timestamp ASC", [chainId]
    );
  }

  async findBySender(senderId: string, limit: number = 50): Promise<DBSignalRow[]> {
    return this.a.query(
      "SELECT * FROM signals WHERE sender_id = $1 ORDER BY timestamp DESC LIMIT $2",
      [senderId, limit]
    );
  }

  async count(): Promise<number> {
    const r = await this.a.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM signals");
    return Number(r?.count || 0);
  }

  async countByType(): Promise<Record<string, number>> {
    const rows = await this.a.query<{ signal_type: string; count: number }>(
      "SELECT signal_type, COUNT(*) as count FROM signals GROUP BY signal_type ORDER BY count DESC"
    );
    const result: Record<string, number> = {};
    for (const r of rows) result[r.signal_type] = Number(r.count);
    return result;
  }

  async prune(maxCount: number = 10000): Promise<number> {
    const total = await this.count();
    if (total <= maxCount) return 0;
    const r = await this.a.execute(
      `DELETE FROM signals WHERE id IN (SELECT id FROM signals ORDER BY timestamp ASC LIMIT $1)`,
      [total - maxCount]
    );
    return r.rowCount;
  }
}

class AgentCallLogRepository {
  constructor(private a: IDBAdapter) { }

  async insert(log: {
    requestId: string; roleId: string; model: string; provider?: string;
    systemPromptHash?: string; promptPreview: string; responsePreview: string;
    inputTokens?: number; outputTokens?: number; latencyMs: number;
    success: boolean; errorMessage?: string; fallbackUsed?: boolean;
    dialogueChainId?: string; metadata?: Record<string, unknown>;
  }): Promise<string> {
    const id = randomUUID();
    const successVal = this.a.engine === "postgresql" ? log.success : (log.success ? 1 : 0);
    const fallbackVal = this.a.engine === "postgresql" ? (log.fallbackUsed || false) : (log.fallbackUsed ? 1 : 0);
    await this.a.execute(
      `INSERT INTO agent_call_log (id, request_id, role_id, model, provider, system_prompt_hash, prompt_preview, response_preview, input_tokens, output_tokens, latency_ms, success, error_message, fallback_used, dialogue_chain_id, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [id, log.requestId, log.roleId, log.model, log.provider || null,
        log.systemPromptHash || null,
        (log.promptPreview || "").substring(0, 500),
        (log.responsePreview || "").substring(0, 500),
        log.inputTokens || null, log.outputTokens || null, log.latencyMs,
        successVal, log.errorMessage || null, fallbackVal,
        log.dialogueChainId || null, JSON.stringify(log.metadata || {})]
    );
    return id;
  }

  async findRecent(limit: number = 50): Promise<DBAgentCallLogRow[]> {
    return this.a.query("SELECT * FROM agent_call_log ORDER BY created_at DESC LIMIT $1", [limit]);
  }

  async findByRole(roleId: string, limit: number = 20): Promise<DBAgentCallLogRow[]> {
    return this.a.query(
      "SELECT * FROM agent_call_log WHERE role_id = $1 ORDER BY created_at DESC LIMIT $2",
      [roleId, limit]
    );
  }

  async getStats(): Promise<{
    totalCalls: number; successRate: number; avgLatency: number;
    totalTokensIn: number; totalTokensOut: number;
    byModel: Record<string, number>; byRole: Record<string, number>;
  }> {
    const total = await this.a.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM agent_call_log");
    const success = await this.a.queryOne<{ count: number }>(
      this.a.engine === "postgresql"
        ? "SELECT COUNT(*) as count FROM agent_call_log WHERE success = true"
        : "SELECT COUNT(*) as count FROM agent_call_log WHERE success = 1"
    );
    const latency = await this.a.queryOne<{ avg: number }>("SELECT AVG(latency_ms) as avg FROM agent_call_log");
    const tokens = await this.a.queryOne<{ tin: number; tout: number }>(
      "SELECT COALESCE(SUM(input_tokens),0) as tin, COALESCE(SUM(output_tokens),0) as tout FROM agent_call_log"
    );
    const modelRows = await this.a.query<{ model: string; count: number }>(
      "SELECT model, COUNT(*) as count FROM agent_call_log GROUP BY model ORDER BY count DESC"
    );
    const roleRows = await this.a.query<{ role_id: string; count: number }>(
      "SELECT role_id, COUNT(*) as count FROM agent_call_log GROUP BY role_id ORDER BY count DESC"
    );

    const tc = Number(total?.count || 0);
    const byModel: Record<string, number> = {};
    for (const r of modelRows) byModel[r.model] = Number(r.count);
    const byRole: Record<string, number> = {};
    for (const r of roleRows) byRole[r.role_id] = Number(r.count);

    return {
      totalCalls: tc,
      successRate: tc > 0 ? Number(success?.count || 0) / tc : 1,
      avgLatency: Math.round(Number(latency?.avg || 0)),
      totalTokensIn: Number(tokens?.tin || 0),
      totalTokensOut: Number(tokens?.tout || 0),
      byModel, byRole,
    };
  }

  async count(): Promise<number> {
    const r = await this.a.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM agent_call_log");
    return Number(r?.count || 0);
  }

  async prune(maxCount: number = 50000): Promise<number> {
    const total = await this.count();
    if (total <= maxCount) return 0;
    const r = await this.a.execute(
      `DELETE FROM agent_call_log WHERE id IN (SELECT id FROM agent_call_log ORDER BY created_at ASC LIMIT $1)`,
      [total - maxCount]
    );
    return r.rowCount;
  }
}

class DialogueChainRepository {
  constructor(private a: IDBAdapter) { }

  async create(chain: {
    id?: string; originSignalId?: string; topic: string; participants: string[];
  }): Promise<string> {
    const id = chain.id || randomUUID();
    const participantsVal = this.a.engine === "postgresql"
      ? chain.participants  // PG TEXT[]
      : JSON.stringify(chain.participants); // SQLite JSON string

    if (this.a.engine === "postgresql") {
      await this.a.execute(
        `INSERT INTO dialogue_chains (id, origin_signal_id, topic, participants) VALUES ($1, $2, $3, $4)`,
        [id, chain.originSignalId || null, chain.topic, `{${chain.participants.join(",")}}` as string]
      );
    } else {
      await this.a.execute(
        `INSERT INTO dialogue_chains (id, origin_signal_id, topic, participants) VALUES ($1, $2, $3, $4)`,
        [id, chain.originSignalId || null, chain.topic, JSON.stringify(chain.participants)]
      );
    }
    return id;
  }

  async findActive(): Promise<DBDialogueChainRow[]> {
    return this.a.query("SELECT * FROM dialogue_chains WHERE status = 'ACTIVE' ORDER BY created_at DESC");
  }

  async findRecent(limit: number = 20): Promise<DBDialogueChainRow[]> {
    return this.a.query("SELECT * FROM dialogue_chains ORDER BY created_at DESC LIMIT $1", [limit]);
  }

  async conclude(id: string): Promise<boolean> {
    const now = this.a.engine === "postgresql" ? "NOW()" : "datetime('now')";
    const r = await this.a.execute(
      `UPDATE dialogue_chains SET status = 'CONCLUDED', concluded_at = ${now} WHERE id = $1`, [id]
    );
    return r.rowCount > 0;
  }

  async incrementCallCount(id: string, isReal: boolean): Promise<void> {
    const field = isReal ? "model_call_count" : "mock_call_count";
    await this.a.execute(`UPDATE dialogue_chains SET ${field} = ${field} + 1 WHERE id = $1`, [id]);
  }

  async count(): Promise<number> {
    const r = await this.a.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM dialogue_chains");
    return Number(r?.count || 0);
  }
}

class RateLimitRepository {
  constructor(private a: IDBAdapter) { }

  async get(key: string = "model_ratio:global"): Promise<DBRateLimitRow | null> {
    return this.a.queryOne("SELECT * FROM rate_limits WHERE key = $1", [key]);
  }

  async increment(key: string, isReal: boolean): Promise<DBRateLimitRow> {
    const field = isReal ? "real_count" : "mock_count";
    const existing = await this.get(key);
    const now = this.a.engine === "postgresql" ? "NOW()" : "datetime('now')";

    if (!existing) {
      await this.a.execute(
        `INSERT INTO rate_limits (key, real_count, mock_count, window_duration_ms) VALUES ($1, $2, $3, 60000)`,
        [key, isReal ? 1 : 0, isReal ? 0 : 1]
      );
    } else {
      const windowStart = new Date(existing.window_start).getTime();
      if (Date.now() - windowStart > existing.window_duration_ms) {
        await this.a.execute(
          `UPDATE rate_limits SET real_count = $1, mock_count = $2, window_start = ${now}, updated_at = ${now} WHERE key = $3`,
          [isReal ? 1 : 0, isReal ? 0 : 1, key]
        );
      } else {
        await this.a.execute(
          `UPDATE rate_limits SET ${field} = ${field} + 1, updated_at = ${now} WHERE key = $1`, [key]
        );
      }
    }
    return (await this.get(key))!;
  }

  async reset(key: string = "model_ratio:global"): Promise<void> {
    const now = this.a.engine === "postgresql" ? "NOW()" : "datetime('now')";
    await this.a.execute(
      `UPDATE rate_limits SET real_count = 0, mock_count = 0, window_start = ${now}, updated_at = ${now} WHERE key = $1`,
      [key]
    );
  }
}

class KBChunkRepository {
  constructor(private a: IDBAdapter) { }

  async upsert(chunk: {
    id: string; source: string; sourceType?: string; content: string;
    metadata?: Record<string, unknown>; embedding?: number[];
    chunkIndex?: number; totalChunks?: number; contentHash?: string;
  }): Promise<void> {
    if (this.a.engine === "postgresql") {
      const embStr = chunk.embedding ? `[${chunk.embedding.join(",")}]` : null;
      await this.a.execute(
        `INSERT INTO kb_chunks (id, source, source_type, content, metadata, embedding, chunk_index, total_chunks, content_hash)
         VALUES ($1,$2,$3,$4,$5,$6::vector,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET content=$4, metadata=$5, embedding=$6::vector, updated_at=NOW()`,
        [chunk.id, chunk.source, chunk.sourceType || "markdown", chunk.content,
        JSON.stringify(chunk.metadata || {}), embStr,
        chunk.chunkIndex || 0, chunk.totalChunks || 1, chunk.contentHash || null]
      );
    } else {
      const embBlob = chunk.embedding ? Buffer.from(new Float32Array(chunk.embedding).buffer) : null;
      await this.a.execute(
        `INSERT OR REPLACE INTO kb_chunks (id, source, source_type, content, metadata, embedding, chunk_index, total_chunks, content_hash, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,datetime('now'))`,
        [chunk.id, chunk.source, chunk.sourceType || "markdown", chunk.content,
        JSON.stringify(chunk.metadata || {}), embBlob,
        chunk.chunkIndex || 0, chunk.totalChunks || 1, chunk.contentHash || null]
      );
    }
  }

  async vectorSearch(queryEmbedding: number[], topK: number = 5, threshold: number = 0.7): Promise<DBKBChunkRow[]> {
    if (this.a.engine !== "postgresql") return []; // SQLite doesn't support vector search
    const embStr = `[${queryEmbedding.join(",")}]`;
    return this.a.query<DBKBChunkRow>(
      `SELECT id, source, source_type, content, metadata, chunk_index,
              1 - (embedding <=> $1::vector) AS similarity
       FROM kb_chunks
       WHERE embedding IS NOT NULL
         AND 1 - (embedding <=> $1::vector) >= $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [embStr, threshold, topK]
    );
  }

  async findBySource(source: string): Promise<DBKBChunkRow[]> {
    return this.a.query("SELECT * FROM kb_chunks WHERE source = $1 ORDER BY chunk_index", [source]);
  }

  async deleteBySource(source: string): Promise<number> {
    const r = await this.a.execute("DELETE FROM kb_chunks WHERE source = $1", [source]);
    return r.rowCount;
  }

  async count(): Promise<number> {
    const r = await this.a.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM kb_chunks");
    return Number(r?.count || 0);
  }

  async sources(): Promise<{ source: string; chunks: number }[]> {
    return this.a.query(
      "SELECT source, COUNT(*) as chunks FROM kb_chunks GROUP BY source ORDER BY source"
    );
  }
}

class SystemEventRepository {
  constructor(private a: IDBAdapter) { }

  async insert(event: {
    eventType: string; source: string; data?: Record<string, unknown>; severity?: string;
  }): Promise<string> {
    const id = randomUUID();
    await this.a.execute(
      `INSERT INTO system_events (id, event_type, source, data, severity) VALUES ($1,$2,$3,$4,$5)`,
      [id, event.eventType, event.source, JSON.stringify(event.data || {}), event.severity || "info"]
    );
    return id;
  }

  async findRecent(limit: number = 100): Promise<DBSystemEventRow[]> {
    return this.a.query<DBSystemEventRow>("SELECT * FROM system_events ORDER BY created_at DESC LIMIT $1", [limit]);
  }

  async count(): Promise<number> {
    const r = await this.a.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM system_events");
    return Number(r?.count || 0);
  }

  async prune(maxCount: number = 100000): Promise<number> {
    const total = await this.count();
    if (total <= maxCount) return 0;
    const r = await this.a.execute(
      `DELETE FROM system_events WHERE id IN (SELECT id FROM system_events ORDER BY created_at ASC LIMIT $1)`,
      [total - maxCount]
    );
    return r.rowCount;
  }
}

// ==========================================
// 私信系统 (§1.5 /ai-family-messages)
// ==========================================

export interface DBFamilyMessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: string;
  metadata: Record<string, unknown> | string;
  is_broadcast: boolean | number;
  read_at: string | null;
  created_at: string;
}

export interface DBFamilyThreadRow {
  id: string;
  type: 'direct' | 'group' | 'broadcast';
  participant_ids: string[] | string;
  last_message_at: string | null;
  created_at: string;
}

class MessageRepository {
  constructor(private a: IDBAdapter) { }

  /**
   * 直系对话 thread_id 约定：sorted([a, b]).join('|')
   * 群发 thread_id 约定：'broadcast:' + sorted(recipients).join('|')
   */
  buildThreadId(participants: string[], broadcast: boolean = false): string {
    const sorted = [...participants].sort();
    return broadcast ? `broadcast:${sorted.join('|')}` : sorted.join('|');
  }

  async ensureThread(threadId: string, type: 'direct' | 'group' | 'broadcast', participantIds: string[]): Promise<void> {
    const exists = await this.a.queryOne<{ id: string }>(
      "SELECT id FROM family_threads WHERE id = $1", [threadId]
    );
    if (exists) return;
    const now = this.a.engine === "postgresql" ? "NOW()" : "datetime('now')";
    await this.a.execute(
      `INSERT INTO family_threads (id, type, participant_ids, last_message_at, created_at)
       VALUES ($1, $2, $3, NULL, ${now})`,
      [threadId, type, JSON.stringify(participantIds)]
    );
  }

  async insert(msg: {
    id?: string;
    threadId: string;
    senderId: string;
    recipientId: string;
    content: string;
    messageType?: string;
    metadata?: Record<string, unknown>;
    isBroadcast?: boolean;
  }): Promise<string> {
    const id = msg.id || randomUUID();
    await this.a.execute(
      `INSERT INTO family_messages
       (id, thread_id, sender_id, recipient_id, content, message_type, metadata, is_broadcast, read_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL)`,
      [id, msg.threadId, msg.senderId, msg.recipientId, msg.content,
        msg.messageType || 'text', JSON.stringify(msg.metadata || {}),
        this.a.engine === "postgresql" ? !!msg.isBroadcast : (msg.isBroadcast ? 1 : 0)]
    );
    const now = this.a.engine === "postgresql" ? "NOW()" : "datetime('now')";
    await this.a.execute(
      `UPDATE family_threads SET last_message_at = ${now} WHERE id = $1`,
      [msg.threadId]
    );
    return id;
  }

  async findByThread(threadId: string, limit: number = 100): Promise<DBFamilyMessageRow[]> {
    return this.a.query<DBFamilyMessageRow>(
      "SELECT * FROM family_messages WHERE thread_id = $1 ORDER BY created_at ASC LIMIT $2",
      [threadId, limit]
    );
  }

  async findThreadsForParticipant(participantId: string): Promise<DBFamilyThreadRow[]> {
    return this.a.query<DBFamilyThreadRow>(
      "SELECT * FROM family_threads WHERE participant_ids LIKE $1 ORDER BY last_message_at DESC NULLS LAST",
      [`%"${participantId}"%`]
    );
  }

  async search(keyword: string, limit: number = 30): Promise<DBFamilyMessageRow[]> {
    const like = `%${keyword}%`;
    return this.a.query<DBFamilyMessageRow>(
      "SELECT * FROM family_messages WHERE content LIKE $1 ORDER BY created_at DESC LIMIT $2",
      [like, limit]
    );
  }

  async markRead(threadId: string, recipientId: string): Promise<number> {
    const now = this.a.engine === "postgresql" ? "NOW()" : "datetime('now')";
    const r = await this.a.execute(
      `UPDATE family_messages SET read_at = ${now}
       WHERE thread_id = $1 AND recipient_id = $2 AND read_at IS NULL`,
      [threadId, recipientId]
    );
    return r.rowCount;
  }

  async unreadCount(recipientId: string): Promise<number> {
    const r = await this.a.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM family_messages WHERE recipient_id = $1 AND read_at IS NULL",
      [recipientId]
    );
    return Number(r?.count || 0);
  }
}

// ==========================================
// Main Database Manager
// ==========================================

class DatabaseManager {
  private adapter!: IDBAdapter;
  private _initialized = false;
  private _engine: "postgresql" | "sqlite" = "sqlite";

  public members!: MemberRepository;
  public signals!: SignalRepository;
  public chains!: DialogueChainRepository;
  public agentLogs!: AgentCallLogRepository;
  public rateLimits!: RateLimitRepository;
  public kbChunks!: KBChunkRepository;
  public events!: SystemEventRepository;
  public messages!: MessageRepository;

  async init(): Promise<void> {
    if (this._initialized) return;

    // ── Try PostgreSQL first ──
    const pgUrl = dbConfig.url;
    if (pgUrl && pgUrl.startsWith("postgresql")) {
      try {
        const pgAdapter = new PostgresAdapter(pgUrl);
        const healthy = await pgAdapter.isHealthy();
        if (healthy) {
          this.adapter = pgAdapter;
          this._engine = "postgresql";

          // Auto-migrate if enabled
          if (dbConfig.autoMigrate) {
            try {
              const schemaPath = new URL("../supabase/family-schema.sql", import.meta.url).pathname;
              const schema = await Bun.file(schemaPath).text();
              await pgAdapter.executeRaw(schema);
              console.log("[DB] PostgreSQL schema migrated");
            } catch (migErr: unknown) {
              const error = migErr as Error;
              console.log(`[DB] PostgreSQL migration note: ${error.message.substring(0, 80)}`);
            }
          }

          console.log(`[DB] PostgreSQL connected: ${pgUrl.replace(/:[^:@]+@/, ":****@")}`);
        } else {
          throw new Error("PostgreSQL health check failed");
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.warn(`[DB] PostgreSQL unavailable: ${error.message}`);
        console.warn("[DB] Falling back to SQLite...");
      }
    }

    // ── Fallback: SQLite ──
    if (!this.adapter) {
      const sqliteAdapter = new SQLiteAdapter(dbConfig.sqlitePath);
      sqliteAdapter.migrate();
      this.adapter = sqliteAdapter;
      this._engine = "sqlite";
      console.log(`[DB] SQLite opened: ${dbConfig.sqlitePath} (WAL mode)`);
    }

    // Initialize repositories
    this.members = new MemberRepository(this.adapter);
    this.signals = new SignalRepository(this.adapter);
    this.chains = new DialogueChainRepository(this.adapter);
    this.agentLogs = new AgentCallLogRepository(this.adapter);
    this.rateLimits = new RateLimitRepository(this.adapter);
    this.kbChunks = new KBChunkRepository(this.adapter);
    this.events = new SystemEventRepository(this.adapter);
    this.messages = new MessageRepository(this.adapter);

    this._initialized = true;

    // Log startup
    await this.events.insert({
      eventType: "SERVER_START",
      source: "DatabaseManager",
      data: { engine: this._engine, stats: await this.adapter.getStats() },
    }).catch(() => { });

    const mc = await this.members.count();
    const sc = await this.signals.count();
    const ac = await this.agentLogs.count();
    console.log(`[DB] Ready (${this._engine}) — Members: ${mc} | Signals: ${sc} | AgentLogs: ${ac}`);
  }

  get initialized(): boolean { return this._initialized; }
  get engine(): string { return this._engine; }

  async isHealthy(): Promise<boolean> {
    return this._initialized && (await this.adapter.isHealthy());
  }

  async getStats(): Promise<Record<string, unknown>> {
    if (!this._initialized) return { initialized: false };
    return { initialized: true, engine: this._engine, ...(await this.adapter.getStats()) };
  }

  /** Refresh materialized views (PostgreSQL only) */
  async refreshViews(): Promise<void> {
    if (this._engine !== "postgresql") return;
    try {
      await this.adapter.executeRaw("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agent_usage_daily");
      await this.adapter.executeRaw("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_signal_volume_hourly");
      console.log("[DB] Materialized views refreshed");
    } catch (err: unknown) {
      const error = err as Error;
      console.warn("[DB] View refresh failed:", error.message);
    }
  }

  async maintenance(): Promise<void> {
    if (!this._initialized) return;
    const pruned = {
      signals: await this.signals.prune(50000),
      agentLogs: await this.agentLogs.prune(100000),
      events: await this.events.prune(200000),
    };
    const total = pruned.signals + pruned.agentLogs + pruned.events;
    if (total > 0) console.log(`[DB] Maintenance: pruned ${total} records`, pruned);

    // Refresh materialized views (PG only)
    await this.refreshViews();
  }

  async close(): Promise<void> {
    if (this._initialized) {
      await this.adapter.close();
      this._initialized = false;
    }
  }
}

// ==========================================
// Helpers
// ==========================================
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

// ==========================================
// Singleton
// ==========================================
export const db = new DatabaseManager();

// Backward-compatible exports
export async function persistSignal(signal: SignalInput): Promise<boolean> {
  if (!db.initialized) return false;
  try { await db.signals.insert(signal); return true; } catch { return false; }
}
export async function logAgentCall(log: AgentCallLogInput): Promise<boolean> {
  if (!db.initialized) return false;
  try { await db.agentLogs.insert(log); return true; } catch { return false; }
}
export async function loadMembers(): Promise<DBMemberRow[] | null> {
  if (!db.initialized) return null;
  try { return await db.members.findAll(); } catch { return null; }
}
export async function updateMember(roleId: string, updates: Record<string, unknown>): Promise<boolean> {
  if (!db.initialized) return false;
  try { return await db.members.updateFields(roleId, updates); } catch { return false; }
}
