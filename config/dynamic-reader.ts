/**
 * file: dynamic-reader.ts
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
 * YYC³ AI Family — Dynamic Config Reader (非 React 环境)
 * 
 * 为 Service 层（agent-router、backend-bridge 等非 React 代码）提供
 * 从 localStorage 读取动态配置的能力。
 * 
 * React 组件应使用 useDynamicConfig() Hook；
 * 非 React 代码（Service、Util）应使用本模块的函数。
 * 
 * 敏感数据规则：
 * - API Key 仅存环境变量名（apiKeyEnvVar），不存明文
 * - apiKeyOverride 仅供 UI 临时输入，不参与导出
 */

import type {
  DynamicConfig,
  LLMProviderConfig,
  ModelConfig,
  AIAgentConfig,
  EndpointConfig,
  NetworkConfig,
  UIConfig,
} from '../types/dynamic-config';

const STORAGE_KEY = 'yyc3_dynamic_config_v2';

// ==========================================
// 环境变量读取器 (同构: Browser / Node / Bun)
// ==========================================

function env(key: string, fallback: string = ''): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const val = (import.meta as any).env[key];
    if (val) return val;
  }
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key];
    if (val) return val;
  }
  return fallback;
}

// ==========================================
// 从 localStorage 读取快照
// ==========================================

/**
 * 读取动态配置快照（非响应式，仅读取当前值）
 * 用于 Service 层获取最新配置。
 */
export function readConfigSnapshot(): DynamicConfig | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as DynamicConfig;
    }
  } catch {
    // localStorage 不可用或解析失败
  }
  return null;
}

// ==========================================
// 角色 → 模型/Provider 解析
// ==========================================

export interface ResolvedRoleConfig {
  modelId: string;
  providerId: string;
  providerBaseUrl: string;
  apiKeyEnvVar: string;
  endpoint: string;
}

/**
 * 从动态配置解析角色的模型/Provider 绑定
 * 
 * 优先链：动态配置 → 静态 /config/models.ts → 硬编码 fallback
 * 敏感值（API Key）强制 env() 读取
 */
export function resolveRoleConfig(roleId: string): ResolvedRoleConfig {
  const config = readConfigSnapshot();
  
  // 默认 fallback
  const fallback: ResolvedRoleConfig = {
    modelId: 'glm-4-plus',
    providerId: 'bigmodel',
    providerBaseUrl: env('VITE_API_BASE_URL', 'http://localhost:3080'),
    apiKeyEnvVar: 'BIGMODEL_API_KEY',
    endpoint: `${env('VITE_API_BASE_URL', 'http://localhost:3080')}/api/agent/${roleId.toLowerCase().replace(/_/g, '-')}`,
  };

  if (!config) return fallback;

  // 1. 查找角色 Agent 配置
  const agent = config.agents.find(a => a.roleId === roleId);
  if (!agent) return fallback;

  // 2. 查找绑定的 Provider
  const provider = config.providers.find(p => p.id === agent.providerId);
  
  // 3. 查找 API 基地址 endpoint
  const apiEndpoint = config.endpoints.find(e => e.category === 'api');
  const apiBase = apiEndpoint?.url || env('VITE_API_BASE_URL', 'http://localhost:3080');

  return {
    modelId: agent.modelId,
    providerId: agent.providerId,
    providerBaseUrl: provider?.baseUrl || fallback.providerBaseUrl,
    apiKeyEnvVar: provider?.apiKeyEnvVar || fallback.apiKeyEnvVar,
    endpoint: `${apiBase}/api/agent/${roleId.toLowerCase().replace(/_/g, '-')}`,
  };
}

// ==========================================
// Provider 解析
// ==========================================

/**
 * 获取所有已启用的 Provider（按优先级排序）
 */
export function getEnabledProviders(): LLMProviderConfig[] {
  const config = readConfigSnapshot();
  if (!config) return [];
  return config.providers
    .filter(p => p.isEnabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * 获取指定 Provider 的 API Key（从环境变量读取）
 * 
 * 安全规则：
 * 1. 优先读 env(provider.apiKeyEnvVar)
 * 2. 兜底读 provider.apiKeyOverride（UI 临时输入）
 * 3. 永远不从代码硬编码
 */
export function getProviderApiKey(providerId: string): string {
  const config = readConfigSnapshot();
  if (!config) return '';
  
  const provider = config.providers.find(p => p.id === providerId);
  if (!provider) return '';

  // 强制 env() 优先
  const fromEnv = env(provider.apiKeyEnvVar);
  if (fromEnv) return fromEnv;
  
  // UI 临时覆盖（仅 localStorage）
  return provider.apiKeyOverride || '';
}

// ==========================================
// Endpoint 解析
// ==========================================

/**
 * 从动态配置获取 endpoint URL
 * 优先链：动态配置 → env() → 硬编码 fallback
 */
export function getEndpointUrl(endpointId: string, fallback: string = ''): string {
  const config = readConfigSnapshot();
  if (config) {
    const ep = config.endpoints.find(e => e.id === endpointId);
    if (ep) {
      // 尝试 env() 覆盖
      const fromEnv = env(ep.envVar);
      return fromEnv || ep.url;
    }
  }
  return fallback;
}

/**
 * 获取 API 基地址
 */
export function getApiBaseUrl(): string {
  return getEndpointUrl('ep-api', env('VITE_API_BASE_URL', 'http://localhost:3080'));
}

/**
 * 获取 WebSocket 基地址
 */
export function getWsBaseUrl(): string {
  return getEndpointUrl('ep-ws', env('VITE_WS_BASE_URL', 'ws://localhost:3080'));
}

// ==========================================
// 模型目录查询
// ==========================================

/**
 * 获取所有可用模型
 */
export function getAvailableModels(): ModelConfig[] {
  const config = readConfigSnapshot();
  if (!config) return [];
  return config.models.filter(m => m.isAvailable);
}

/**
 * 获取默认模型 ID
 * 优先链：动态配置第一个可用模型 → 静态 DEFAULT_MODEL
 */
export function getDefaultModelId(): string {
  const models = getAvailableModels();
  return models[0]?.id || 'glm-4-plus';
}