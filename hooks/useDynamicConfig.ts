/**
 * file: useDynamicConfig.ts
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
 * YYC³ AI Family — Dynamic Configuration Hook
 * 
 * 中央配置管理系统：
 * - 所有配置项 UI 可编辑、可增删改查
 * - localStorage 持久化
 * - 环境变量兜底 (env())
 * - 敏感数据（API Key）仅存 envVar 名，不存明文
 * 
 * @file hooks/useDynamicConfig.ts
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type {
  DynamicConfig,
  LLMProviderConfig,
  ModelConfig,
  AIAgentConfig,
  EndpointConfig,
  MCPServerConfig,
  WorkflowConfig,
  ExtensionConfig,
  ComputeNodeConfig,
  ConfigSection,
  NetworkConfig,
  UIConfig,
} from '../types/dynamic-config';

// ==========================================
// Storage Key
// ==========================================

const STORAGE_KEY = 'yyc3_dynamic_config_v2';

/** 当前 schema 版本 — 每次增加字段时递增 */
const CURRENT_SCHEMA_VERSION = 3;

// ==========================================
// Schema Migration (配置版本迁移)
// 
// 当 localStorage 中的旧版配置缺少新字段时自动补全
// ==========================================

type MigrationConfig = Record<string, unknown> & { _schemaVersion?: number };

interface MigrationFn {
  (config: MigrationConfig): MigrationConfig;
}

const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 5000,
  connectionTimeout: 5000,
  agentCallTimeout: 15000,
  maxReconnectDelay: 30000,
  backoffMultiplier: 1.5,
};

const DEFAULT_UI_CONFIG: UIConfig = {
  avatarRailCollapsedWidth: 56,
  avatarRailExpandedWidth: 200,
  maxVisibleMessages: 200,
  terminalMaxLines: 1000,
  animationDuration: 300,
  typingSpeed: 30,
  toastDuration: 3000,
};

const MIGRATIONS: Record<number, MigrationFn> = {
  // v1 → v2: 添加 computeNodes、extensions.author/category、endpoints.lastChecked
  2: (config: MigrationConfig) => {
    if (!config.computeNodes) config.computeNodes = [];
    if (config.extensions && Array.isArray(config.extensions)) {
      config.extensions = config.extensions.map((ext) => ({ author: 'Unknown', category: 'runtime', ...ext as Record<string, unknown> }));
    }
    if (config.endpoints && Array.isArray(config.endpoints)) {
      config.endpoints = config.endpoints.map((ep) => ({ lastChecked: undefined, ...ep as Record<string, unknown> }));
    }
    if (config.providers && Array.isArray(config.providers)) {
      config.providers = config.providers.map((p) => ({ description: '', ...p as Record<string, unknown> }));
    }
    if (config.models && Array.isArray(config.models)) {
      config.models = config.models.map((m) => ({ capabilities: ['chat'], ...m as Record<string, unknown> }));
    }
    if (config.agents && Array.isArray(config.agents)) {
      config.agents = config.agents.map((a) => {
        const agent = a as Record<string, unknown>;
        return {
          nameCN: agent.nameCN || agent.name || '', 
          roleCN: agent.roleCN || agent.role || '', 
          providerId: agent.providerId || 'bigmodel', 
          ...agent,
        };
      });
    }
    if (config.workflows && Array.isArray(config.workflows)) {
      config.workflows = config.workflows.map((w) => ({ description: '', trigger: 'manual', ...w as Record<string, unknown> }));
    }
    if (config.mcpServers && Array.isArray(config.mcpServers)) {
      config.mcpServers = config.mcpServers.map((s) => ({ capabilities: [], isEnabled: true, ...s as Record<string, unknown> }));
    }
    return config;
  },
  // v2 → v3: 添加 networkConfig、uiConfig (FIX-004 + FIX-005)
  3: (config: MigrationConfig) => {
    if (!config.networkConfig) {
      config.networkConfig = { ...DEFAULT_NETWORK_CONFIG };
    } else {
      // 补全缺失字段
      config.networkConfig = { ...DEFAULT_NETWORK_CONFIG, ...config.networkConfig as Record<string, unknown> };
    }
    if (!config.uiConfig) {
      config.uiConfig = { ...DEFAULT_UI_CONFIG };
    } else {
      config.uiConfig = { ...DEFAULT_UI_CONFIG, ...config.uiConfig as Record<string, unknown> };
    }
    return config;
  },
};

/**
 * 运行所有必要的迁移
 */
function migrateConfig(config: MigrationConfig): DynamicConfig {
  let currentVersion = config._schemaVersion || 1;
  let migrated: MigrationConfig = { ...config };

  while (currentVersion < CURRENT_SCHEMA_VERSION) {
    const nextVersion = currentVersion + 1;
    const migration = MIGRATIONS[nextVersion];
    if (migration) {
      console.log(`[DynamicConfig] Migrating schema v${currentVersion} → v${nextVersion}`);
      migrated = migration(migrated);
    }
    currentVersion = nextVersion;
  }

  migrated._schemaVersion = CURRENT_SCHEMA_VERSION;
  return migrated as unknown as DynamicConfig;
}

// ==========================================
// Health Check 工具
// ==========================================

const HEALTH_CHECK_TIMEOUT = 5000;

/**
 * 真实 health check — fetch + timeout + AbortController
 * 对 HTTP/HTTPS endpoint 发起 HEAD 请求检测可达性
 * 非 HTTP 协议（ws/redis/pg）返回 NON_HTTP_PROTOCOL
 */
export async function performHealthCheck(url: string): Promise<{
  healthy: boolean;
  latencyMs: number;
  error?: string;
}> {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { healthy: false, latencyMs: 0, error: 'NON_HTTP_PROTOCOL' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
  const start = performance.now();

  try {
    await fetch(url, { method: 'HEAD', signal: controller.signal, mode: 'no-cors' });
    const latencyMs = Math.round(performance.now() - start);
    return { healthy: true, latencyMs };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const error = err as Error;
    if (error.name === 'AbortError') {
      return { healthy: false, latencyMs, error: 'TIMEOUT' };
    }
    return { healthy: false, latencyMs, error: error.message || 'UNREACHABLE' };
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================
// Default Config (初始默认值)
// ==========================================

function createDefaultConfig(): DynamicConfig {
  return {
    providers: [
      {
        id: 'bigmodel',
        name: 'bigmodel',
        displayName: 'BigModel (智谱)',
        baseUrl: 'https://open.bigmodel.cn/api/',
        apiKeyEnvVar: 'BIGMODEL_API_KEY',
        isEnabled: true,
        priority: 1,
        color: '#00BFFF',
        models: ['glm-4-plus', 'codegeex-4', 'glm-4-flash', 'glm-4-air'],
        description: '智谱 GLM 系列大模型，主力推理引擎',
      },
      {
        id: 'deepseek',
        name: 'deepseek',
        displayName: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKeyEnvVar: 'DEEPSEEK_API_KEY',
        isEnabled: true,
        priority: 2,
        color: '#a78bfa',
        models: ['deepseek-chat', 'deepseek-coder'],
        description: 'DeepSeek 深度推理与代码模型',
      },
      {
        id: 'anthropic',
        name: 'anthropic',
        displayName: 'Anthropic (Claude)',
        baseUrl: 'https://api.anthropic.com/v1',
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        isEnabled: false,
        priority: 3,
        color: '#d4a574',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        description: 'Anthropic Claude 系列模型',
      },
      {
        id: 'openai',
        name: 'openai',
        displayName: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        isEnabled: false,
        priority: 4,
        color: '#10b981',
        models: ['gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'],
        description: 'OpenAI GPT 系列模型',
      },
      {
        id: 'qwen',
        name: 'qwen',
        displayName: 'Qwen (通义千问)',
        baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
        apiKeyEnvVar: 'QWEN_API_KEY',
        isEnabled: false,
        priority: 5,
        color: '#3b82f6',
        models: ['qwen3-coder:30b', 'qwen2.5-coder:1.5b'],
        description: '阿里通义千问系列',
      },
      {
        id: 'ollama',
        name: 'ollama',
        displayName: 'Ollama (本地)',
        baseUrl: 'http://localhost:11434/v1',
        apiKeyEnvVar: 'OLLAMA_API_KEY',
        apiKeyOverride: 'ollama',
        isEnabled: true,
        priority: 6,
        color: '#f472b6',
        models: ['llama3', 'qwen3-coder:30b', 'llama3.2:3b-instruct-q4_K_M'],
        description: '本地推理引擎，无需 API Key',
      },
    ],
    models: [
      { id: 'glm-4-plus', name: 'glm-4-plus', displayName: 'GLM-4-Plus', providerId: 'bigmodel', description: '智谱旗舰模型', color: '#00BFFF', isAvailable: true, capabilities: ['chat', 'reasoning'], maxTokens: 128000, contextWindow: 128000 },
      { id: 'codegeex-4', name: 'codegeex-4', displayName: 'CodeGeeX-4', providerId: 'bigmodel', description: '代码专精模型', color: '#32CD32', isAvailable: true, capabilities: ['chat', 'code'], maxTokens: 32000, contextWindow: 32000 },
      { id: 'glm-4-flash', name: 'glm-4-flash', displayName: 'GLM-4-Flash', providerId: 'bigmodel', description: '高速响应模型', color: '#fbbf24', isAvailable: true, capabilities: ['chat'], maxTokens: 128000, contextWindow: 128000 },
      { id: 'glm-4-air', name: 'glm-4-air', displayName: 'GLM-4-Air', providerId: 'bigmodel', description: '平衡性价比模型', color: '#ff69b4', isAvailable: true, capabilities: ['chat'], maxTokens: 128000, contextWindow: 128000 },
      { id: 'deepseek-chat', name: 'deepseek-chat', displayName: 'DeepSeek Chat', providerId: 'deepseek', description: '深度对话推理', color: '#a78bfa', isAvailable: true, capabilities: ['chat', 'reasoning'], maxTokens: 64000, contextWindow: 64000 },
      { id: 'deepseek-coder', name: 'deepseek-coder', displayName: 'DeepSeek Coder', providerId: 'deepseek', description: '深度代码推理', color: '#a78bfa', isAvailable: true, capabilities: ['chat', 'code'], maxTokens: 64000, contextWindow: 64000 },
      { id: 'ollama-local', name: 'ollama-local', displayName: 'Ollama Local', providerId: 'ollama', description: '本地推理引擎', color: '#f472b6', isAvailable: false, capabilities: ['chat', 'code'] },
    ],
    agents: [
      { id: 'agent-pm', roleId: 'PRODUCT_MANAGER', name: 'MoYanZong', nameCN: '沫言总', version: 'v2.1', role: 'Product Strategy & Vision', roleCN: '产品战略与愿景', modelId: 'glm-4-plus', providerId: 'bigmodel', color: '#FFD700', status: 'active', capabilities: ['strategy', 'vision', 'decision'], permissions: { canDeploy: true, canReview: true } },
      { id: 'agent-ca', roleId: 'CHIEF_ARCHITECT', name: 'HumanMentor', nameCN: '人类导师', version: 'v2.0', role: 'Strategic Ethics & Guidance', roleCN: '战略伦理与指导', modelId: 'glm-4-plus', providerId: 'bigmodel', color: '#C0C0C0', status: 'active', capabilities: ['ethics', 'mentoring', 'strategy'], permissions: { canDeploy: false, canReview: true } },
      { id: 'agent-arch', roleId: 'AI_ARCHITECT', name: 'ZhiYuanArchitect', nameCN: '智源架构师', version: 'v1.8', role: 'System Architecture & Design', roleCN: '系统架构设计', modelId: 'glm-4-plus', providerId: 'bigmodel', color: '#00BFFF', status: 'active', capabilities: ['architecture', 'analysis', 'design'], permissions: { canDeploy: false, canReview: true } },
      { id: 'agent-code', roleId: 'CODE_ARTISAN', name: 'ZhiMaArtisan', nameCN: '织码工匠', version: 'v2.0', role: 'Code Generation & Review', roleCN: '代码生成与审查', modelId: 'codegeex-4', providerId: 'bigmodel', color: '#32CD32', status: 'active', capabilities: ['coding', 'review', 'refactor'], permissions: { canDeploy: false, canReview: true } },
      { id: 'agent-sentinel', roleId: 'SENTINEL', name: 'ShouHuSentinel', nameCN: '守护哨兵', version: 'v1.5', role: 'Security Audit & Defense', roleCN: '安全审计与防御', modelId: 'glm-4-plus', providerId: 'bigmodel', color: '#FF4500', status: 'active', capabilities: ['security', 'audit', 'compliance'], permissions: { canDeploy: false, canReview: true } },
      { id: 'agent-pulse', roleId: 'CENTRAL_PULSE', name: 'ZhongShuPulse', nameCN: '中枢灵脉', version: 'v1.3', role: 'Flow Orchestration & Data', roleCN: '流程编排与数据', modelId: 'glm-4-flash', providerId: 'bigmodel', color: '#9370DB', status: 'standby', capabilities: ['orchestration', 'pipeline', 'data'], permissions: { canDeploy: false, canReview: false } },
      { id: 'agent-collab', roleId: 'COLLABORATOR', name: 'XieZuoMessenger', nameCN: '协作使者', version: 'v1.0', role: 'Cross-Platform Collaboration', roleCN: '跨平台协作', modelId: 'glm-4-air', providerId: 'bigmodel', color: '#FF69B4', status: 'standby', capabilities: ['collaboration', 'communication'], permissions: { canDeploy: false, canReview: false } },
    ],
    endpoints: [
      { id: 'ep-api', name: 'Bun REST API', url: 'http://localhost:3080', envVar: 'VITE_API_BASE_URL', description: 'Bun Runtime REST API 基地址', category: 'api', isHealthy: false },
      { id: 'ep-ws', name: 'Bun WebSocket', url: 'ws://localhost:3080', envVar: 'VITE_WS_BASE_URL', description: 'Bun Runtime WebSocket 基地址', category: 'websocket', isHealthy: false },
      { id: 'ep-ollama', name: 'Ollama', url: 'http://localhost:11434/v1', envVar: 'VITE_OLLAMA_URL', description: 'Ollama 本地推理引擎', category: 'llm', isHealthy: false },
      { id: 'ep-bigmodel', name: 'BigModel API', url: 'https://open.bigmodel.cn/api/', envVar: 'VITE_BIGMODEL_URL', description: '智谱 BigModel Z.ai API', category: 'llm', isHealthy: false },
      { id: 'ep-chroma', name: 'ChromaDB', url: 'http://localhost:8000', envVar: 'VITE_CHROMA_URL', description: 'ChromaDB 向量数据库', category: 'vector', isHealthy: false },
      { id: 'ep-qdrant', name: 'Qdrant', url: 'http://localhost:6333', envVar: 'VITE_QDRANT_URL', description: 'Qdrant 向量数据库', category: 'vector', isHealthy: false },
      { id: 'ep-redis', name: 'Redis', url: 'redis://localhost:6379', envVar: 'VITE_REDIS_URL', description: 'Redis 缓存 + Pub/Sub', category: 'cache', isHealthy: false },
      { id: 'ep-pg', name: 'PostgreSQL', url: 'postgresql://localhost:5433/yyc3_family', envVar: 'DATABASE_URL', description: 'PostgreSQL 15 主数据库', category: 'database', isHealthy: false },
    ],
    mcpServers: [
      { id: 'mcp-fs', name: 'Filesystem_Access', url: 'mcp://localhost:3080/mcp/fs', status: 'disconnected', latency: '-', description: '文件系统访问', isEnabled: true, capabilities: ['read', 'write', 'list'] },
      { id: 'mcp-pg', name: 'PostgreSQL_Adapter', url: 'mcp://localhost:3080/mcp/pg', status: 'disconnected', latency: '-', description: 'PostgreSQL 数据库适配器', isEnabled: true, capabilities: ['query', 'schema'] },
      { id: 'mcp-gw', name: 'Google_Workspace', url: 'mcp://localhost:3080/mcp/gw', status: 'disconnected', latency: '-', description: 'Google Workspace 集成', isEnabled: false, capabilities: ['docs', 'sheets', 'drive'] },
    ],
    workflows: [
      { id: 'wf-review', name: 'Auto_Code_Review', description: '自动代码审查流水线', steps: 4, status: 'active', trigger: 'auto', createdAt: Date.now() - 86400000 * 7 },
      { id: 'wf-sync', name: 'Daily_Knowledge_Sync', description: '每日知识库同步', steps: 3, status: 'active', trigger: 'schedule', createdAt: Date.now() - 86400000 * 14 },
      { id: 'wf-audit', name: 'Security_Audit_Pipeline', description: '安全审计流水线', steps: 6, status: 'inactive', trigger: 'manual', createdAt: Date.now() - 86400000 * 3 },
      { id: 'wf-backup', name: 'Backup_Orchestrator', description: '备份编排器', steps: 2, status: 'active', trigger: 'schedule', createdAt: Date.now() - 86400000 * 30 },
    ],
    extensions: [
      { id: 'ext-python', name: 'Python_Interpreter', description: '在沙箱环境中执行 Python 代码', isInstalled: true, isEnabled: true, version: '1.2.0', author: 'YYC3 Team', category: 'runtime' },
      { id: 'ext-browser', name: 'Web_Browser', description: '通过无头浏览器访问实时互联网数据', isInstalled: false, isEnabled: false, version: '0.8.0', author: 'YYC3 Team', category: 'network' },
      { id: 'ext-dalle', name: 'Image_Gen_DALL-E', description: '使用 DALL-E 3 API 生成图像', isInstalled: false, isEnabled: false, version: '1.0.0', author: 'OpenAI', category: 'generation' },
      { id: 'ext-chroma', name: 'Vector_DB_Chroma', description: '本地向量嵌入存储', isInstalled: true, isEnabled: true, version: '0.4.1', author: 'Chroma', category: 'storage' },
    ],
    computeNodes: [
      {
        id: 'node-m4max',
        name: 'Apple M4 Max Studio',
        host: 'localhost',
        type: 'local',
        status: 'online',
        specs: { cpu: 'Apple M4 Max (16-core)', gpu: 'M4 Max 40-core GPU', memory: '128GB Unified', storage: '2TB NVMe' },
        metrics: { gpuUtil: 0, memUtil: 0, temperature: 0 },
        isEnabled: true,
      },
    ],
    networkConfig: DEFAULT_NETWORK_CONFIG,
    uiConfig: DEFAULT_UI_CONFIG,
    version: 1,
    lastModified: Date.now(),
  };
}

// ==========================================
// Context Type
// ==========================================

interface DynamicConfigContextType {
  config: DynamicConfig;
  
  // Provider CRUD
  addProvider: (provider: LLMProviderConfig) => void;
  updateProvider: (id: string, data: Partial<LLMProviderConfig>) => void;
  deleteProvider: (id: string) => void;
  
  // Model CRUD
  addModel: (model: ModelConfig) => void;
  updateModel: (id: string, data: Partial<ModelConfig>) => void;
  deleteModel: (id: string) => void;
  
  // Agent CRUD
  addAgent: (agent: AIAgentConfig) => void;
  updateAgent: (id: string, data: Partial<AIAgentConfig>) => void;
  deleteAgent: (id: string) => void;
  
  // Endpoint CRUD
  addEndpoint: (endpoint: EndpointConfig) => void;
  updateEndpoint: (id: string, data: Partial<EndpointConfig>) => void;
  deleteEndpoint: (id: string) => void;
  
  // MCP Server CRUD
  addMCPServer: (server: MCPServerConfig) => void;
  updateMCPServer: (id: string, data: Partial<MCPServerConfig>) => void;
  deleteMCPServer: (id: string) => void;
  
  // Workflow CRUD
  addWorkflow: (workflow: WorkflowConfig) => void;
  updateWorkflow: (id: string, data: Partial<WorkflowConfig>) => void;
  deleteWorkflow: (id: string) => void;
  
  // Extension CRUD
  addExtension: (ext: ExtensionConfig) => void;
  updateExtension: (id: string, data: Partial<ExtensionConfig>) => void;
  deleteExtension: (id: string) => void;
  
  // ComputeNode CRUD
  addComputeNode: (node: ComputeNodeConfig) => void;
  updateComputeNode: (id: string, data: Partial<ComputeNodeConfig>) => void;
  deleteComputeNode: (id: string) => void;
  
  // Network & UI config (non-array, direct update)
  updateNetworkConfig: (data: Partial<NetworkConfig>) => void;
  updateUIConfig: (data: Partial<UIConfig>) => void;
  
  // Bulk ops
  resetToDefaults: () => void;
  exportConfig: () => string;
  importConfig: (json: string) => boolean;
}

const DynamicConfigContext = createContext<DynamicConfigContextType | null>(null);

// ==========================================
// Load from localStorage
// ==========================================

function loadConfig(): DynamicConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as unknown as MigrationConfig;
      // Run schema migrations for old versions
      const migrated = migrateConfig(parsed);
      // Merge with defaults to ensure new fields are present
      const defaults = createDefaultConfig();
      const merged = {
        ...defaults,
        ...migrated,
        // Ensure arrays exist even if stored version was older
        providers: migrated.providers?.length ? migrated.providers : defaults.providers,
        models: migrated.models?.length ? migrated.models : defaults.models,
        agents: migrated.agents?.length ? migrated.agents : defaults.agents,
        endpoints: migrated.endpoints?.length ? migrated.endpoints : defaults.endpoints,
        mcpServers: migrated.mcpServers ?? defaults.mcpServers,
        workflows: migrated.workflows ?? defaults.workflows,
        extensions: migrated.extensions ?? defaults.extensions,
        computeNodes: migrated.computeNodes ?? defaults.computeNodes,
      };
      // Auto-save migrated config
      if ((parsed as any)._schemaVersion !== CURRENT_SCHEMA_VERSION) {
        console.log('[DynamicConfig] Migration complete, saving updated config');
        saveConfig(merged);
      }
      return merged;
    }
  } catch (e) {
    console.warn('[DynamicConfig] Failed to load from localStorage:', e);
  }
  return createDefaultConfig();
}

function saveConfig(config: DynamicConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('[DynamicConfig] Failed to save to localStorage:', e);
  }
}

// ==========================================
// Provider Component
// ==========================================

export function DynamicConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<DynamicConfig>(loadConfig);
  const configRef = useRef(config);
  configRef.current = config;

  // Auto-save on change
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const mutate = useCallback((updater: (prev: DynamicConfig) => DynamicConfig) => {
    setConfig(prev => {
      const next = updater(prev);
      return { ...next, version: prev.version + 1, lastModified: Date.now() };
    });
  }, []);

  // Generic CRUD factory
  function makeCRUD<T extends { id: string }>(section: ConfigSection) {
    return {
      add: (item: T) => mutate(prev => ({
        ...prev,
        [section]: [...(prev[section] as unknown as T[]), item],
      })),
      update: (id: string, data: Partial<T>) => mutate(prev => ({
        ...prev,
        [section]: (prev[section] as unknown as T[]).map(item =>
          item.id === id ? { ...item, ...data } : item
        ),
      })),
      delete: (id: string) => mutate(prev => ({
        ...prev,
        [section]: (prev[section] as unknown as T[]).filter(item => item.id !== id),
      })),
    };
  }

  const providerCRUD = makeCRUD<LLMProviderConfig>('providers');
  const modelCRUD = makeCRUD<ModelConfig>('models');
  const agentCRUD = makeCRUD<AIAgentConfig>('agents');
  const endpointCRUD = makeCRUD<EndpointConfig>('endpoints');
  const mcpCRUD = makeCRUD<MCPServerConfig>('mcpServers');
  const workflowCRUD = makeCRUD<WorkflowConfig>('workflows');
  const extensionCRUD = makeCRUD<ExtensionConfig>('extensions');
  const nodeCRUD = makeCRUD<ComputeNodeConfig>('computeNodes');

  const resetToDefaults = useCallback(() => {
    const defaults = createDefaultConfig();
    setConfig(defaults);
    saveConfig(defaults);
  }, []);

  const exportConfigJSON = useCallback(() => {
    // 导出时移除 apiKeyOverride 敏感字段
    const safe = {
      ...configRef.current,
      providers: configRef.current.providers.map(p => ({ ...p, apiKeyOverride: undefined })),
    };
    return JSON.stringify(safe, null, 2);
  }, []);

  const importConfigJSON = useCallback((json: string): boolean => {
    try {
      const imported = JSON.parse(json) as DynamicConfig;
      if (imported.providers && imported.models) {
        setConfig({ ...imported, version: (configRef.current.version || 0) + 1, lastModified: Date.now() });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const updateNetworkConfig = useCallback((data: Partial<NetworkConfig>) => {
    mutate(prev => ({
      ...prev,
      networkConfig: { ...prev.networkConfig, ...data },
    }));
  }, []);

  const updateUIConfig = useCallback((data: Partial<UIConfig>) => {
    mutate(prev => ({
      ...prev,
      uiConfig: { ...prev.uiConfig, ...data },
    }));
  }, []);

  const value: DynamicConfigContextType = {
    config,
    addProvider: providerCRUD.add,
    updateProvider: providerCRUD.update,
    deleteProvider: providerCRUD.delete,
    addModel: modelCRUD.add,
    updateModel: modelCRUD.update,
    deleteModel: modelCRUD.delete,
    addAgent: agentCRUD.add,
    updateAgent: agentCRUD.update,
    deleteAgent: agentCRUD.delete,
    addEndpoint: endpointCRUD.add,
    updateEndpoint: endpointCRUD.update,
    deleteEndpoint: endpointCRUD.delete,
    addMCPServer: mcpCRUD.add,
    updateMCPServer: mcpCRUD.update,
    deleteMCPServer: mcpCRUD.delete,
    addWorkflow: workflowCRUD.add,
    updateWorkflow: workflowCRUD.update,
    deleteWorkflow: workflowCRUD.delete,
    addExtension: extensionCRUD.add,
    updateExtension: extensionCRUD.update,
    deleteExtension: extensionCRUD.delete,
    addComputeNode: nodeCRUD.add,
    updateComputeNode: nodeCRUD.update,
    deleteComputeNode: nodeCRUD.delete,
    updateNetworkConfig,
    updateUIConfig,
    resetToDefaults,
    exportConfig: exportConfigJSON,
    importConfig: importConfigJSON,
  };

  return React.createElement(DynamicConfigContext.Provider, { value }, children);
}

// ==========================================
// Consumer Hook
// ==========================================

export function useDynamicConfig(): DynamicConfigContextType {
  const ctx = useContext(DynamicConfigContext);
  if (!ctx) {
    throw new Error('useDynamicConfig must be used within DynamicConfigProvider');
  }
  return ctx;
}