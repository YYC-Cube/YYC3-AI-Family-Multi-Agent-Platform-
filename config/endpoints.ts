/**
 * file: endpoints.ts
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
 * YYC³ AI Family — Centralized Endpoint Configuration
 * 
 * FIX-002: 消除全项目 35+ 处 localhost 硬编码
 * 所有网络地址统一从此文件导出，前端通过 VITE_* 环境变量覆盖
 * 
 * 用法：
 *   import { ENDPOINTS, buildAgentEndpoint } from '../config/endpoints'
 *   fetch(`${ENDPOINTS.API_BASE}/api/health`)
 */

// ==========================================
// Environment Reader (同构：Node/Browser/Bun)
// ==========================================

function getEnv(key: string, fallback: string): string {
  // Vite 前端环境
  if (typeof import.meta !== 'undefined') {
    const meta = import.meta as unknown as Record<string, unknown>;
    if (meta.env && typeof meta.env === 'object') {
      const env = meta.env as Record<string, string>;
      const val = env[key];
      if (val) return val;
    }
  }
  // Node / Bun 环境
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key];
    if (val) return val;
  }
  return fallback;
}

// ==========================================
// Core Endpoints
// ==========================================

export const ENDPOINTS = {
  /** Bun Runtime REST API 基地址 */
  API_BASE: getEnv('VITE_API_BASE_URL', 'http://localhost:3080'),

  /** Bun Runtime WebSocket 基地址 */
  WS_BASE: getEnv('VITE_WS_BASE_URL', 'ws://localhost:3080'),

  /** Ollama 本地推理引擎 */
  OLLAMA: getEnv('VITE_OLLAMA_URL', 'http://localhost:11434/v1'),

  /** BigModel Z.ai API */
  BIGMODEL: getEnv('VITE_BIGMODEL_URL', 'https://open.bigmodel.cn/api/'),

  /** ChromaDB 向量数据库 */
  CHROMA: getEnv('VITE_CHROMA_URL', 'http://localhost:8000'),

  /** Qdrant 向量数据库 */
  QDRANT: getEnv('VITE_QDRANT_URL', 'http://localhost:6333'),

  /** Redis 缓存 */
  REDIS: getEnv('VITE_REDIS_URL', 'redis://localhost:6379'),
} as const;

// ==========================================
// Derived URL Builders
// ==========================================

/**
 * 构建角色 Agent API 端点
 * @example buildAgentEndpoint('AI_ARCHITECT') → 'http://localhost:3080/api/agent/ai-architect'
 */
export function buildAgentEndpoint(roleId: string): string {
  const slug = roleId.toLowerCase().replace(/_/g, '-');
  return `${ENDPOINTS.API_BASE}/api/agent/${slug}`;
}

/**
 * 构建 KB 搜索端点
 */
export function buildKBSearchEndpoint(): string {
  return `${ENDPOINTS.API_BASE}/api/kb/search`;
}

/**
 * 构建文件系统 API 端点
 */
export function buildFilesEndpoint(path: string = ''): string {
  return `${ENDPOINTS.API_BASE}/api/files${path}`;
}

/**
 * 构建 MCP 编排端点
 */
export function buildMCPEndpoint(path: string = ''): string {
  return `${ENDPOINTS.API_BASE}/api/mcp${path}`;
}

/**
 * 构建健康检查端点
 */
export function buildHealthEndpoint(): string {
  return `${ENDPOINTS.API_BASE}/api/health`;
}

// ==========================================
// Legacy Compat: DEFAULT_BACKEND_CONFIG
// 供 BackendBridge / useBackendConnection 使用
// ==========================================

export const DEFAULT_BACKEND_URLS = {
  wsUrl: ENDPOINTS.WS_BASE,
  apiUrl: ENDPOINTS.API_BASE,
} as const;

// ==========================================
// Display helpers (用于 UI 文案，非功能调用)
// ==========================================

export function getDisplayUrl(key: keyof typeof ENDPOINTS): string {
  return ENDPOINTS[key];
}
