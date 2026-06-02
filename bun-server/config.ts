/**
 * file: config.ts
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
 * YYC³ AI Family - Centralized Configuration (万象归元配置中枢)
 * 
 * Reads, validates, and exports ALL environment variables as typed config.
 * Every module imports from here — no direct process.env access elsewhere.
 * 
 * Structure mirrors .env.example sections §1-§10:
 *   §1  server    §2  llm       §3  mcp       §4  workflow
 *   §5  plugin    §6  kb        §7  ide       §8  db/redis
 *   §9  auth      §10 monitor
 */

// ==========================================
// Helper: Read env with default + type cast
// ==========================================
function env(key: string, fallback: string = ""): string {
  return process.env[key] ?? fallback;
}
function envBool(key: string, fallback: boolean = false): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "true" || v === "1" || v === "yes";
}
function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined) return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}
function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined) return fallback;
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}
function envList(key: string, fallback: string[] = []): string[] {
  const v = process.env[key];
  if (!v) return fallback;
  return v.split(",").map(s => s.trim()).filter(Boolean);
}

// ==========================================
// §1 Core Server
// ==========================================
export const server = {
  port: envInt("PORT", 3080),
  name: env("SERVER_NAME", "YYC3-AI-Family"),
  nodeEnv: env("NODE_ENV", "development") as "development" | "production" | "test",
  logLevel: env("LOG_LEVEL", "info") as "debug" | "info" | "warn" | "error",
  isDev: env("NODE_ENV", "development") === "development",
};

// ==========================================
// §2 LLM Providers
// ==========================================
export type LLMProvider = "anthropic" | "openai" | "ollama" | "deepseek" | "qwen" | "bigmodel";

/**
 * Auto-detect primary provider if LLM_PRIMARY_PROVIDER is not explicitly set.
 * Scans API keys in order: bigmodel → deepseek → anthropic → openai → qwen → ollama
 * This allows a minimal .env with just one API key to "just work".
 */
function detectPrimaryProvider(): LLMProvider {
  const explicit = process.env.LLM_PRIMARY_PROVIDER;
  if (explicit) return explicit as LLMProvider;

  // Priority order: BigModel (Guidelines首选) → DeepSeek → others
  if (process.env.BIGMODEL_API_KEY) return "bigmodel";
  if (process.env.DEEPSEEK_API_KEY) return "deepseek";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.QWEN_API_KEY) return "qwen";
  if (envBool("OLLAMA_ENABLED", false)) return "ollama";
  return "bigmodel"; // YYC³ default: 感恩智谱大模型授权
}

function detectFallbackProvider(primary: LLMProvider): LLMProvider {
  const explicit = process.env.LLM_FALLBACK_PROVIDER;
  if (explicit) return explicit as LLMProvider;

  // Pick first available that isn't primary
  const candidates: { provider: LLMProvider; check: () => boolean }[] = [
    { provider: "ollama", check: () => envBool("OLLAMA_ENABLED", false) },
    { provider: "bigmodel", check: () => !!process.env.BIGMODEL_API_KEY },
    { provider: "deepseek", check: () => !!process.env.DEEPSEEK_API_KEY },
    { provider: "anthropic", check: () => !!process.env.ANTHROPIC_API_KEY },
    { provider: "openai", check: () => !!process.env.OPENAI_API_KEY },
    { provider: "qwen", check: () => !!process.env.QWEN_API_KEY },
  ];
  for (const c of candidates) {
    if (c.provider !== primary && c.check()) return c.provider;
  }
  return "ollama"; // ultimate fallback
}

const _detectedPrimary: LLMProvider = detectPrimaryProvider();

export const llm: {
  primary: LLMProvider;
  fallback: LLMProvider;
  temperature: number;
  streaming: boolean;
  requestTimeout: number;
  ratio: {
    spec: string;
    windowSeconds: number;
    maxReal: number;
    maxMock: number;
  };
  anthropic: { apiKey: string; model: string; maxTokens: number; baseUrl: string; configured: boolean };
  openai: { apiKey: string; model: string; maxTokens: number; baseUrl: string; configured: boolean };
  ollama: { enabled: boolean; baseUrl: string; model: string };
  deepseek: { apiKey: string; model: string; baseUrl: string; configured: boolean };
  qwen: { apiKey: string; model: string; baseUrl: string; configured: boolean };
  bigmodel: { apiKey: string; model: string; maxTokens: number; baseUrl: string; configured: boolean };
} = {
  primary: _detectedPrimary,
  fallback: detectFallbackProvider(_detectedPrimary),
  temperature: envFloat("LLM_TEMPERATURE", 0.7),
  streaming: envBool("LLM_STREAMING_ENABLED", false),
  requestTimeout: envInt("LLM_REQUEST_TIMEOUT_MS", 30000),

  ratio: {
    spec: env("LLM_RATIO_REAL_TO_MOCK", "1:2"),
    windowSeconds: envInt("LLM_RATIO_WINDOW_SECONDS", 60),
    get maxReal(): number { return parseInt(llm.ratio.spec.split(":")[0] || "1"); },
    get maxMock(): number { return parseInt(llm.ratio.spec.split(":")[1] || "2"); },
  },

  anthropic: {
    apiKey: env("ANTHROPIC_API_KEY"),
    model: env("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
    maxTokens: envInt("ANTHROPIC_MAX_TOKENS", 2048),
    baseUrl: env("ANTHROPIC_BASE_URL", "https://api.anthropic.com"),
    get configured(): boolean { return !!llm.anthropic.apiKey; },
  },

  openai: {
    apiKey: env("OPENAI_API_KEY"),
    model: env("OPENAI_MODEL", "gpt-4o"),
    maxTokens: envInt("OPENAI_MAX_TOKENS", 2048),
    baseUrl: env("OPENAI_BASE_URL", "https://api.openai.com/v1"),
    get configured(): boolean { return !!llm.openai.apiKey; },
  },

  ollama: {
    enabled: envBool("OLLAMA_ENABLED", false),
    baseUrl: env("OLLAMA_BASE_URL", "http://localhost:11434"),
    model: env("OLLAMA_MODEL", "qwen3-coder:30b"),
  },

  deepseek: {
    apiKey: env("DEEPSEEK_API_KEY"),
    model: env("DEEPSEEK_MODEL", "deepseek-chat"),
    baseUrl: env("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
    get configured(): boolean { return !!llm.deepseek.apiKey; },
  },

  qwen: {
    apiKey: env("QWEN_API_KEY"),
    model: env("QWEN_MODEL", "qwen-max"),
    baseUrl: env("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
    get configured(): boolean { return !!llm.qwen.apiKey; },
  },

  // ── BigModel / 智谱 GLM ──
  // 感恩智谱大模型授权，致敬GLM-PC的卓越支持！
  // API: OpenAI-compatible at open.bigmodel.cn
  bigmodel: {
    apiKey: env("BIGMODEL_API_KEY"),
    model: env("BIGMODEL_MODEL", "glm-4-plus"),
    maxTokens: envInt("BIGMODEL_MAX_TOKENS", 4096),
    baseUrl: env("BIGMODEL_BASE_URL", "https://open.bigmodel.cn/api/paas/v4"),
    get configured(): boolean { return !!llm.bigmodel.apiKey; },
  },
};

// ==========================================
// §2.1 Per-Role Model Assignment (一角色一模型)
// ==========================================
// Each family member can be assigned a dedicated provider + model.
// If not set, falls back to the global primary provider + its default model.
//
// Env pattern: ROLE_{ROLE_ID}_PROVIDER / ROLE_{ROLE_ID}_MODEL
//
// Recommended BigModel GLM mapping for YYC³ Family:
//   沫言总(PM)     → glm-4-plus    (最终裁决需要最强推理)
//   人类导师(CA)    → glm-4-plus    (伦理+战略需要深度思考)
//   智源架构师      → glm-4-plus    (架构设计是核心)
//   织码工匠        → codegeex-4    (代码生成专用模型)
//   守护哨兵        → glm-4-plus    (安全分析不能马虎)
//   中枢灵脉        → glm-4-flash   (编排调度，速度优先)
//   协作使者        → glm-4-air     (日常沟通，平衡性价比)
// ==========================================

export interface RoleModelConfig {
  provider: LLMProvider;
  model: string;
  fallbackProvider?: LLMProvider;
  fallbackModel?: string;
  maxTokens?: number;
  temperature?: number;
}

const ROLE_IDS = [
  "PRODUCT_MANAGER", "CHIEF_ARCHITECT", "AI_ARCHITECT",
  "CODE_ARTISAN", "SENTINEL", "CENTRAL_PULSE", "COLLABORATOR",
] as const;

// Default per-role assignments (BigModel GLM family)
const DEFAULT_ROLE_MODELS: Record<string, { provider: LLMProvider; model: string }> = {
  PRODUCT_MANAGER:  { provider: "bigmodel", model: "glm-4-plus" },
  CHIEF_ARCHITECT:  { provider: "bigmodel", model: "glm-4-plus" },
  AI_ARCHITECT:     { provider: "bigmodel", model: "glm-4-plus" },
  CODE_ARTISAN:     { provider: "bigmodel", model: "codegeex-4" },
  SENTINEL:         { provider: "bigmodel", model: "glm-4-plus" },
  CENTRAL_PULSE:    { provider: "bigmodel", model: "glm-4-flash" },
  COLLABORATOR:     { provider: "bigmodel", model: "glm-4-air" },
};

function buildRoleModelConfig(): Record<string, RoleModelConfig> {
  const result: Record<string, RoleModelConfig> = {};

  for (const roleId of ROLE_IDS) {
    const defaults = DEFAULT_ROLE_MODELS[roleId];
    const provider = env(`ROLE_${roleId}_PROVIDER`, defaults?.provider || llm.primary) as LLMProvider;
    const model = env(`ROLE_${roleId}_MODEL`, defaults?.model || "");
    const fallbackProvider = env(`ROLE_${roleId}_FALLBACK_PROVIDER`, "") as LLMProvider | "";
    const fallbackModel = env(`ROLE_${roleId}_FALLBACK_MODEL`, "");
    const maxTokens = envInt(`ROLE_${roleId}_MAX_TOKENS`, 0);
    const temperature = envFloat(`ROLE_${roleId}_TEMPERATURE`, -1);

    result[roleId] = {
      provider,
      model,
      ...(fallbackProvider ? { fallbackProvider: fallbackProvider as LLMProvider } : {}),
      ...(fallbackModel ? { fallbackModel } : {}),
      ...(maxTokens > 0 ? { maxTokens } : {}),
      ...(temperature >= 0 ? { temperature } : {}),
    };
  }

  return result;
}

export const roleModels = buildRoleModelConfig();

/**
 * Get the resolved provider + model for a given role.
 * Priority: env override → DEFAULT_ROLE_MODELS → global primary
 */
export function getRoleModelConfig(roleId: string): RoleModelConfig {
  return roleModels[roleId] || {
    provider: llm.primary,
    model: "",  // empty = use provider's default
  };
}

// ==========================================
// §3 MCP Protocol
// ==========================================
export const mcp = {
  enabled: envBool("MCP_ENABLED", true),
  serverName: env("MCP_SERVER_NAME", "yyc3-family-mcp"),
  transport: env("MCP_TRANSPORT", "stdio") as "stdio" | "sse" | "websocket",
  tools: {
    enabled: envBool("MCP_TOOLS_ENABLED", true),
    dir: env("MCP_TOOLS_DIR", "./mcp-tools"),
  },
  resources: {
    enabled: envBool("MCP_RESOURCES_ENABLED", true),
  },
  prompts: {
    enabled: envBool("MCP_PROMPTS_ENABLED", true),
  },
};

// ==========================================
// §4 Workflow Engine
// ==========================================
export const workflow = {
  enabled: envBool("WORKFLOW_ENABLED", true),
  maxConcurrent: envInt("WORKFLOW_MAX_CONCURRENT", 5),
  stepTimeout: envInt("WORKFLOW_STEP_TIMEOUT_MS", 60000),
  retryMax: envInt("WORKFLOW_RETRY_MAX", 3),
  retryDelay: envInt("WORKFLOW_RETRY_DELAY_MS", 2000),

  creation: {
    enabled: envBool("WORKFLOW_CREATION_PIPELINE_ENABLED", true),
    autoAdvance: envBool("WORKFLOW_CREATION_AUTO_ADVANCE", false),
    requireApproval: envBool("WORKFLOW_CREATION_REQUIRE_APPROVAL", true),
  },

  cicd: {
    enabled: envBool("WORKFLOW_CICD_ENABLED", false),
    webhookUrl: env("WORKFLOW_CICD_WEBHOOK_URL"),
    webhookSecret: env("WORKFLOW_CICD_WEBHOOK_SECRET"),
  },

  cron: {
    enabled: envBool("WORKFLOW_CRON_ENABLED", false),
    jobs: env("WORKFLOW_CRON_JOBS"),
  },
};

// ==========================================
// §5 Plugin System
// ==========================================
export const plugin = {
  enabled: envBool("PLUGIN_ENABLED", true),
  dir: env("PLUGIN_DIR", "./plugins"),
  sandbox: envBool("PLUGIN_SANDBOX", true),
  maxMemoryMB: envInt("PLUGIN_MAX_MEMORY_MB", 128),
  timeout: envInt("PLUGIN_TIMEOUT_MS", 10000),
  enabledList: envList("PLUGIN_ENABLED_LIST", ["code-quality", "security-scanner", "git-helper"]),
  marketplaceUrl: env("PLUGIN_MARKETPLACE_URL"),
  autoUpdate: envBool("PLUGIN_AUTO_UPDATE", false),
};

// ==========================================
// §6 Knowledge Base
// ==========================================
export const kb = {
  enabled: envBool("KB_ENABLED", true),
  storageDir: env("KB_STORAGE_DIR", "./knowledge"),
  vectorDb: env("KB_VECTOR_DB", "memory") as "chroma" | "qdrant" | "milvus" | "pgvector" | "memory",

  chroma: {
    url: env("CHROMA_URL", "http://localhost:8000"),
    collection: env("CHROMA_COLLECTION", "yyc3_family_knowledge"),
  },
  qdrant: {
    url: env("QDRANT_URL", "http://localhost:6333"),
    collection: env("QDRANT_COLLECTION", "yyc3_family"),
    apiKey: env("QDRANT_API_KEY"),
  },

  embedding: {
    provider: env("KB_EMBEDDING_PROVIDER", "local") as "anthropic" | "openai" | "ollama" | "local",
    model: env("KB_EMBEDDING_MODEL", "text-embedding-3-small"),
    dimensions: envInt("KB_EMBEDDING_DIMENSIONS", 0), // 0 = auto-detect from provider
    ollamaModel: env("KB_EMBEDDING_OLLAMA_MODEL", "nomic-embed-text"),
    // Per-provider default dimensions (used when KB_EMBEDDING_DIMENSIONS=0)
    defaultDimensions: {
      openai: 1536,      // text-embedding-3-small
      anthropic: 1024,   // voyage-3-lite
      ollama: 768,       // nomic-embed-text
      local: 512,        // simpleHash (smaller = faster for TF-IDF)
    } as Record<string, number>,
  },

  rag: {
    chunkSize: envInt("KB_CHUNK_SIZE", 512),
    chunkOverlap: envInt("KB_CHUNK_OVERLAP", 64),
    topK: envInt("KB_TOP_K", 5),
    similarityThreshold: envFloat("KB_SIMILARITY_THRESHOLD", 0.7),
    rerankEnabled: envBool("KB_RERANK_ENABLED", false),
  },

  docSources: envList("KB_DOC_SOURCES", ["../docs"]),
  autoIndex: {
    enabled: envBool("KB_AUTO_INDEX_ENABLED", true),
    interval: envInt("KB_AUTO_INDEX_INTERVAL_MS", 300000),
  },
};

// ==========================================
// §7 IDE Bridge
// ==========================================
export const ide = {
  enabled: envBool("IDE_ENABLED", true),
  projectRoot: env("IDE_PROJECT_ROOT", "../"),

  analysis: {
    enabled: envBool("IDE_ANALYSIS_ENABLED", true),
    language: env("IDE_ANALYSIS_LANGUAGE", "typescript"),
    include: envList("IDE_ANALYSIS_INCLUDE", ["src/**/*.ts", "src/**/*.tsx", "components/**/*.tsx", "hooks/**/*.ts", "services/**/*.ts", "types/**/*.ts"]),
    exclude: envList("IDE_ANALYSIS_EXCLUDE", ["node_modules", "dist", ".git", "build"]),
  },

  lint: {
    enabled: envBool("IDE_LINT_ENABLED", true),
    engine: env("IDE_LINT_ENGINE", "biome") as "biome" | "eslint" | "oxlint",
    fixOnSave: envBool("IDE_LINT_FIX_ON_SAVE", false),
    configPath: env("IDE_LINT_CONFIG_PATH"),
  },

  git: {
    enabled: envBool("IDE_GIT_ENABLED", true),
    autoCommit: envBool("IDE_GIT_AUTO_COMMIT", false),
    commitFormat: env("IDE_GIT_COMMIT_FORMAT", "conventional") as "conventional" | "gitmoji" | "plain",
    branchStrategy: env("IDE_GIT_BRANCH_STRATEGY", "gitflow") as "gitflow" | "trunk" | "github-flow",
    prAutoReview: envBool("IDE_GIT_PR_AUTO_REVIEW", false),
  },

  terminal: {
    enabled: envBool("IDE_TERMINAL_ENABLED", false),
    shell: env("IDE_TERMINAL_SHELL", "bash"),
    allowedCommands: envList("IDE_TERMINAL_ALLOWED_COMMANDS", ["ls", "cat", "grep", "find", "bun", "npm", "git"]),
  },

  watcher: {
    enabled: envBool("IDE_WATCHER_ENABLED", true),
    debounce: envInt("IDE_WATCHER_DEBOUNCE_MS", 300),
    ignore: envList("IDE_WATCHER_IGNORE", ["node_modules", ".git", "dist", "build", ".next"]),
  },

  tsCheck: {
    enabled: envBool("IDE_TS_CHECK_ENABLED", true),
    configPath: env("IDE_TS_CONFIG_PATH", "../tsconfig.json"),
  },
};

// ==========================================
// §8 Database & Cache
// ==========================================
export const database = {
  // FIX-001: fallback 不含明文密码，生产环境必须设置 DATABASE_URL
  url: env("DATABASE_URL", "postgresql://localhost:5433/yyc3_family"),
  poolSize: envInt("DB_POOL_SIZE", 20),        // 调优建议��CPU 核心数 × 1.25
  ssl: envBool("DB_SSL_ENABLED", false),
  autoMigrate: envBool("DB_AUTO_MIGRATE", true),
  idleTimeout: envInt("DB_IDLE_TIMEOUT", 30),   // seconds
  maxLifetime: envInt("DB_MAX_LIFETIME", 600),   // seconds, recycle long-lived connections
  statementTimeout: envInt("DB_STATEMENT_TIMEOUT", 30000), // ms, kill slow queries
  get configured(): boolean { return !!process.env.DATABASE_URL; },
  /** Fallback to SQLite when DATABASE_URL is not set or PG is unreachable */
  sqlitePath: env("SQLITE_DB_PATH", "./data/yyc3-family.db"),
};

export const redis = {
  url: env("REDIS_URL", "redis://localhost:6379"),
  password: env("REDIS_PASSWORD"),
  db: envInt("REDIS_DB", 0),
  keyPrefix: env("REDIS_KEY_PREFIX", "yyc3:"),
  signalCacheTtl: envInt("REDIS_SIGNAL_CACHE_TTL", 3600),
  signalCacheMax: envInt("REDIS_SIGNAL_CACHE_MAX", 200),
  get configured(): boolean { return !!process.env.REDIS_URL; },
};

// ==========================================
// §9 Security & Auth
// ==========================================
export const auth = {
  jwtSecret: env("JWT_SECRET", "yyc3-family-secret-change-in-production"),
  jwtExpires: envInt("JWT_EXPIRES_HOURS", 24),
  enabled: envBool("AUTH_ENABLED", false),
  cors: {
    origin: env("CORS_ORIGIN", "*"),
  },
  rateLimit: {
    enabled: envBool("RATE_LIMIT_ENABLED", true),
    windowMs: envInt("RATE_LIMIT_WINDOW_MS", 60000),
    maxRequests: envInt("RATE_LIMIT_MAX_REQUESTS", 100),
    llmMax: envInt("RATE_LIMIT_LLM_MAX", 20),
  },
};

// ==========================================
// §10 Monitor & Observability
// ==========================================
export const monitor = {
  enabled: envBool("MONITOR_ENABLED", true),
  metricsEndpoint: env("MONITOR_METRICS_ENDPOINT", "/api/metrics"),
  log: {
    format: env("LOG_FORMAT", "json") as "json" | "text" | "pretty",
    fileEnabled: envBool("LOG_FILE_ENABLED", false),
    filePath: env("LOG_FILE_PATH", "./logs/server.log"),
    fileMaxSizeMB: envInt("LOG_FILE_MAX_SIZE_MB", 50),
    fileMaxFiles: envInt("LOG_FILE_MAX_FILES", 10),
  },
  trace: {
    enabled: envBool("TRACE_ENABLED", false),
    exporter: env("TRACE_EXPORTER", "console") as "console" | "otlp" | "jaeger",
    otlpEndpoint: env("OTLP_ENDPOINT", "http://localhost:4318"),
  },
  health: {
    interval: envInt("HEALTH_CHECK_INTERVAL_MS", 30000),
    checkDb: envBool("HEALTH_CHECK_DB", true),
    checkRedis: envBool("HEALTH_CHECK_REDIS", true),
    checkLlm: envBool("HEALTH_CHECK_LLM", true),
  },
};

// ==========================================
// Config Validation & Startup Diagnostics
// ==========================================
export interface ConfigDiagnostic {
  section: string;
  status: "ok" | "warn" | "error";
  message: string;
}

export function validateConfig(): ConfigDiagnostic[] {
  const d: ConfigDiagnostic[] = [];

  // §1 Server
  d.push({ section: "server", status: "ok", message: `Port ${server.port} | ${server.nodeEnv}` });

  // §2 LLM
  if (!llm.anthropic.configured && !llm.openai.configured && !llm.ollama.enabled && !llm.deepseek.configured && !llm.qwen.configured && !llm.bigmodel.configured) {
    d.push({ section: "llm", status: "error", message: "No LLM provider configured! Set at least one API key in .env" });
  } else {
    const providers: string[] = [];
    if (llm.anthropic.configured) providers.push(`Anthropic(${llm.anthropic.model})`);
    if (llm.openai.configured) providers.push(`OpenAI(${llm.openai.model})`);
    if (llm.ollama.enabled) providers.push(`Ollama(${llm.ollama.model})`);
    if (llm.deepseek.configured) providers.push(`DeepSeek(${llm.deepseek.model})`);
    if (llm.qwen.configured) providers.push(`Qwen(${llm.qwen.model})`);
    if (llm.bigmodel.configured) providers.push(`BigModel(${llm.bigmodel.model})`);
    d.push({ section: "llm", status: "ok", message: `Primary: ${llm.primary} | Available: ${providers.join(", ")}` });
  }

  // §3 MCP
  d.push({ section: "mcp", status: mcp.enabled ? "ok" : "warn", message: mcp.enabled ? `Transport: ${mcp.transport} | Tools: ${mcp.tools.enabled}` : "Disabled" });

  // §4 Workflow
  d.push({ section: "workflow", status: workflow.enabled ? "ok" : "warn", message: workflow.enabled ? `Max concurrent: ${workflow.maxConcurrent} | Creation pipeline: ${workflow.creation.enabled}` : "Disabled" });

  // §5 Plugin
  d.push({ section: "plugin", status: plugin.enabled ? "ok" : "warn", message: plugin.enabled ? `Plugins: ${plugin.enabledList.join(", ")}` : "Disabled" });

  // §6 Knowledge Base
  d.push({ section: "kb", status: kb.enabled ? "ok" : "warn", message: kb.enabled ? `VectorDB: ${kb.vectorDb} | Embedding: ${kb.embedding.provider}` : "Disabled" });

  // §7 IDE
  d.push({ section: "ide", status: ide.enabled ? "ok" : "warn", message: ide.enabled ? `Lint: ${ide.lint.engine} | Git: ${ide.git.enabled} | TS: ${ide.tsCheck.enabled}` : "Disabled" });

  // §8 DB/Redis
  d.push({ section: "database", status: database.configured ? "ok" : "warn", message: database.configured ? `Pool: ${database.poolSize}` : "Not configured (in-memory mode)" });
  d.push({ section: "redis", status: redis.configured ? "ok" : "warn", message: redis.configured ? `DB: ${redis.db} | Prefix: ${redis.keyPrefix}` : "Not configured (in-memory mode)" });

  // §9 Auth
  if (auth.enabled && auth.jwtSecret === "yyc3-family-secret-change-in-production") {
    d.push({ section: "auth", status: "error", message: "Auth enabled but JWT_SECRET is default! Change it." });
  } else {
    d.push({ section: "auth", status: "ok", message: auth.enabled ? "JWT auth active" : "Auth disabled (dev mode)" });
  }

  // §10 Monitor
  d.push({ section: "monitor", status: "ok", message: `Log: ${monitor.log.format} | Trace: ${monitor.trace.enabled ? monitor.trace.exporter : "off"}` });

  // §2.1 Per-Role Model Assignment
  const roleEntries = Object.entries(roleModels);
  const roleDesc = roleEntries.map(([r, c]) => `${r}→${c.provider}/${c.model}`).join(", ");
  d.push({ section: "role-models", status: "ok", message: roleDesc });

  return d;
}

/**
 * Print startup config summary to console
 */
export function printConfigSummary(): void {
  const diags = validateConfig();
  const maxSection = Math.max(...diags.map(d => d.section.length));

  console.log("\n  ┌─── Configuration Diagnostics ───┐");
  for (const d of diags) {
    const icon = d.status === "ok" ? "✓" : d.status === "warn" ? "○" : "✗";
    const color = d.status === "ok" ? "\x1b[32m" : d.status === "warn" ? "\x1b[33m" : "\x1b[31m";
    console.log(`  │ ${color}${icon}\x1b[0m ${d.section.padEnd(maxSection)} │ ${d.message}`);
  }
  console.log("  └──────────────────────────────────┘\n");
}