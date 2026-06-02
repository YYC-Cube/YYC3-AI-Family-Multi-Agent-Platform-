-- ==========================================
-- YYC³ AI Family — Production PostgreSQL 15 Schema
-- Host: yyc3-22 (M4 Max 128GB) | Port: 5433 | User: yyc3_max
-- ==========================================
-- 
-- Prerequisites:
--   createdb -p 5433 -U yyc3_max yyc3_family
--   psql -p 5433 -U yyc3_max -d yyc3_family < family-schema.sql
--
-- Features:
--   - pgvector for KB embeddings (semantic search)
--   - JSONB with GIN indexes for flexible metadata
--   - Partial indexes for hot-path queries
--   - Time-series optimized signals table
--   - Auto-vacuum tuning for M4 Max workload
--   - Audit trail with system_events
-- ==========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";        -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";          -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";           -- Trigram similarity (fuzzy text search)
CREATE EXTENSION IF NOT EXISTS "btree_gin";         -- GIN for scalar types

-- pgvector: install via brew install pgvector, then CREATE EXTENSION
-- If pgvector is not installed, comment out the next line and vector columns
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector not installed — KB vector search will use fallback mode';
END $$;


-- ==========================================
-- 1. Family Members (persistent config + state)
-- ==========================================
CREATE TABLE IF NOT EXISTS family_members (
  role_id       TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL,
  mood          TEXT DEFAULT 'SERENE',
  is_online     BOOLEAN DEFAULT false,
  current_activity TEXT DEFAULT '',
  system_prompt TEXT,
  avatar_url    TEXT,
  permissions   JSONB DEFAULT '{}',
  device_config JSONB,
  metrics       JSONB DEFAULT '{"signalCount":0,"avgResponseTime":0,"uptime":0}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default family members
INSERT INTO family_members (role_id, display_name, mood, is_online, current_activity) VALUES
  ('PRODUCT_MANAGER',  '沫言总',     'SERENE',  true,  '等待战略指令...'),
  ('CHIEF_ARCHITECT',  '人类导师',   'SERENE',  true,  '全域战略监控...'),
  ('AI_ARCHITECT',     '智源架构师', 'FOCUSED', true,  '推演微服务拓扑...'),
  ('CODE_ARTISAN',     '织码工匠',   'EXCITED', true,  '编织 React 组件...'),
  ('SENTINEL',         '守护哨兵',   'LOVING',  true,  '扫描安全边界...'),
  ('CENTRAL_PULSE',    '中枢灵脉',   'SERENE',  true,  '同步数据流...'),
  ('COLLABORATOR',     '协作使者',   'SERENE',  true,  '跨平台协议同步...')
ON CONFLICT (role_id) DO NOTHING;


-- ==========================================
-- 2. Signals (append-only, high-volume time-series)
-- ==========================================
CREATE TABLE IF NOT EXISTS signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp       BIGINT NOT NULL,
  signal_type     TEXT NOT NULL,
  sender_id       TEXT NOT NULL,
  receiver_id     TEXT NOT NULL,
  content         TEXT NOT NULL,
  mood            TEXT,
  priority        TEXT DEFAULT 'NORMAL',
  model_source    TEXT,                     -- 'REAL' | 'MOCK' | NULL
  dialogue_chain_id UUID,
  reply_to_signal_id UUID,
  device_id       TEXT,
  processing_time INTEGER,                  -- ms
  model_endpoint  TEXT,
  routing_ratio   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Hot-path indexes
CREATE INDEX IF NOT EXISTS idx_signals_ts_desc
  ON signals (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_signals_sender
  ON signals (sender_id);
CREATE INDEX IF NOT EXISTS idx_signals_chain
  ON signals (dialogue_chain_id)
  WHERE dialogue_chain_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signals_type
  ON signals (signal_type);
-- Composite for recent-by-sender queries
CREATE INDEX IF NOT EXISTS idx_signals_sender_ts
  ON signals (sender_id, timestamp DESC);

-- Tune autovacuum for high-insert table
ALTER TABLE signals SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005
);


-- ==========================================
-- 3. Dialogue Chains (peer collaboration tracking)
-- ==========================================
CREATE TABLE IF NOT EXISTS dialogue_chains (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_signal_id UUID REFERENCES signals(id) ON DELETE SET NULL,
  topic           TEXT NOT NULL,
  participants    TEXT[] NOT NULL,
  status          TEXT DEFAULT 'ACTIVE',
  model_call_count INTEGER DEFAULT 0,
  mock_call_count  INTEGER DEFAULT 0,
  total_tokens    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  concluded_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chains_status ON dialogue_chains (status);
CREATE INDEX IF NOT EXISTS idx_chains_created ON dialogue_chains (created_at DESC);
-- Partial index: only active chains (most queries filter on this)
CREATE INDEX IF NOT EXISTS idx_chains_active
  ON dialogue_chains (created_at DESC)
  WHERE status = 'ACTIVE';


-- ==========================================
-- 4. Agent Call Log (LLM usage tracking + cost audit)
-- ==========================================
CREATE TABLE IF NOT EXISTS agent_call_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      TEXT NOT NULL,
  role_id         TEXT NOT NULL,
  model           TEXT NOT NULL,
  provider        TEXT,                     -- 'deepseek' | 'ollama' | 'anthropic' etc.
  system_prompt_hash TEXT,
  prompt_preview  TEXT,
  response_preview TEXT,
  input_tokens    INTEGER,
  output_tokens   INTEGER,
  total_tokens    INTEGER GENERATED ALWAYS AS (COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0)) STORED,
  latency_ms      INTEGER,
  success         BOOLEAN DEFAULT true,
  error_message   TEXT,
  fallback_used   BOOLEAN DEFAULT false,
  dialogue_chain_id UUID,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Unique on request_id but allow retries with suffix
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_log_request
  ON agent_call_log (request_id);
CREATE INDEX IF NOT EXISTS idx_agent_log_role
  ON agent_call_log (role_id);
CREATE INDEX IF NOT EXISTS idx_agent_log_created
  ON agent_call_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_log_model
  ON agent_call_log (model);
-- For cost analysis queries
CREATE INDEX IF NOT EXISTS idx_agent_log_provider_created
  ON agent_call_log (provider, created_at DESC);

-- Tune autovacuum for high-insert table
ALTER TABLE agent_call_log SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005
);


-- ==========================================
-- 5. Rate Limiting
-- ==========================================
CREATE TABLE IF NOT EXISTS rate_limits (
  key             TEXT PRIMARY KEY,
  real_count      INTEGER DEFAULT 0,
  mock_count      INTEGER DEFAULT 0,
  window_start    TIMESTAMPTZ DEFAULT NOW(),
  window_duration_ms INTEGER DEFAULT 60000,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO rate_limits (key, real_count, mock_count, window_duration_ms) VALUES
  ('model_ratio:global', 0, 0, 60000)
ON CONFLICT (key) DO NOTHING;


-- ==========================================
-- 6. Knowledge Base Chunks (pgvector powered)
-- ==========================================
CREATE TABLE IF NOT EXISTS kb_chunks (
  id              TEXT PRIMARY KEY,
  source          TEXT NOT NULL,
  source_type     TEXT DEFAULT 'markdown',
  content         TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',
  -- Vector column: 1536 dims for OpenAI, 768 for Ollama/nomic, 512 for local
  -- Use the max dimension; smaller vectors pad with zeros
  embedding       vector(1536),
  chunk_index     INTEGER DEFAULT 0,
  total_chunks    INTEGER DEFAULT 1,
  content_hash    TEXT,                     -- SHA256 for dedup
  word_count      INTEGER GENERATED ALWAYS AS (
    array_length(string_to_array(trim(content), ' '), 1)
  ) STORED,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_source ON kb_chunks (source);
CREATE INDEX IF NOT EXISTS idx_kb_type ON kb_chunks (source_type);
CREATE INDEX IF NOT EXISTS idx_kb_hash ON kb_chunks (content_hash)
  WHERE content_hash IS NOT NULL;
-- GIN index on metadata for flexible filtering
CREATE INDEX IF NOT EXISTS idx_kb_metadata ON kb_chunks USING GIN (metadata);

-- pgvector index: IVFFlat for fast ANN search (create after inserting initial data)
-- For <1000 rows, brute-force is faster; enable this when KB grows:
-- CREATE INDEX IF NOT EXISTS idx_kb_embedding ON kb_chunks
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- HNSW index (better for M4 Max with 128GB RAM):
-- CREATE INDEX IF NOT EXISTS idx_kb_embedding_hnsw ON kb_chunks
--   USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);


-- ==========================================
-- 7. System Events (audit trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS system_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,
  source          TEXT NOT NULL,
  data            JSONB DEFAULT '{}',
  severity        TEXT DEFAULT 'info',      -- debug | info | warn | error | critical
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_type ON system_events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON system_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_severity ON system_events (severity)
  WHERE severity IN ('error', 'critical');


-- ==========================================
-- 8. Workflow State Persistence
-- ==========================================
CREATE TABLE IF NOT EXISTS workflow_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     TEXT NOT NULL,
  status          TEXT DEFAULT 'pending',   -- pending | running | paused | completed | failed
  current_step    INTEGER DEFAULT 0,
  params          JSONB DEFAULT '{}',
  result          JSONB,
  error           TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wf_status ON workflow_instances (status);
CREATE INDEX IF NOT EXISTS idx_wf_workflow_id ON workflow_instances (workflow_id);


-- ==========================================
-- 9. Helper Functions
-- ==========================================

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'family_members', 'rate_limits', 'kb_chunks', 'workflow_instances'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I; CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl || '_updated', tbl, tbl || '_updated', tbl
    );
  END LOOP;
END $$;

-- Convenience: increment signal count in member metrics
CREATE OR REPLACE FUNCTION increment_member_signal_count(p_role_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE family_members
  SET metrics = jsonb_set(
    metrics,
    '{signalCount}',
    to_jsonb(COALESCE((metrics->>'signalCount')::int, 0) + 1)
  )
  WHERE role_id = p_role_id;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 10. Materialized Views (analytics dashboards)
-- ==========================================

-- Agent usage summary (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_agent_usage_daily AS
SELECT
  date_trunc('day', created_at) AS day,
  role_id,
  model,
  provider,
  COUNT(*) AS call_count,
  COUNT(*) FILTER (WHERE success) AS success_count,
  ROUND(AVG(latency_ms)) AS avg_latency_ms,
  SUM(total_tokens) AS total_tokens,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens
FROM agent_call_log
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC, 5 DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_agent_usage
  ON mv_agent_usage_daily (day, role_id, model, provider);

-- Signal volume summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_signal_volume_hourly AS
SELECT
  date_trunc('hour', to_timestamp(timestamp / 1000.0)) AS hour,
  signal_type,
  sender_id,
  COUNT(*) AS signal_count,
  ROUND(AVG(processing_time)) AS avg_processing_ms
FROM signals
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_signal_volume
  ON mv_signal_volume_hourly (hour, signal_type, sender_id);


-- ==========================================
-- 11. PostgreSQL Performance Tuning
-- ==========================================
-- Recommended postgresql.conf overrides for M4 Max 128GB:
-- (Apply via ALTER SYSTEM or postgresql.conf, then pg_ctl reload)
--
-- # Memory (128GB total, PG gets ~32GB)
-- shared_buffers = '8GB'
-- effective_cache_size = '96GB'
-- work_mem = '256MB'
-- maintenance_work_mem = '2GB'
-- wal_buffers = '64MB'
--
-- # WAL & Checkpoints (SN850X can handle aggressive settings)
-- wal_level = 'replica'
-- max_wal_size = '4GB'
-- min_wal_size = '1GB'
-- checkpoint_completion_target = 0.9
-- checkpoint_timeout = '15min'
--
-- # Query Planner (NVMe-aware)
-- random_page_cost = 1.1          -- NVMe is nearly sequential speed
-- effective_io_concurrency = 200  -- M4 Max NVMe controller
-- seq_page_cost = 1.0
--
-- # Parallelism (16P + 40E cores)
-- max_parallel_workers_per_gather = 4
-- max_parallel_workers = 8
-- max_worker_processes = 16
-- parallel_tuple_cost = 0.01
-- parallel_setup_cost = 100
--
-- # Connections
-- max_connections = 100
-- superuser_reserved_connections = 3
--
-- # Logging
-- log_min_duration_statement = 500  -- Log slow queries > 500ms
-- log_checkpoints = on
-- log_lock_waits = on
--
-- # pgvector
-- -- After installing: shared_preload_libraries = 'vector'
-- ==========================================


-- ==========================================
-- Summary:
--   family_members    — 7 rows, persistent config + state
--   signals           — Append-only time-series, indexed for /chain replay
--   dialogue_chains   — Peer collaboration tracking
--   agent_call_log    — LLM API usage audit trail, cost tracking
--   rate_limits       — Model ratio enforcement
--   kb_chunks         — Knowledge base with pgvector embeddings
--   system_events     — Audit trail / observability
--   workflow_instances — Workflow state persistence
--   mv_agent_usage_daily       — Materialized view: daily agent stats
--   mv_signal_volume_hourly    — Materialized view: hourly signal volume
-- ==========================================
