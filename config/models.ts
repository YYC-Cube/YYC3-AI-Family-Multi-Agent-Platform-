/**
 * file: models.ts
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
 * YYC³ AI Family — Centralized Model Configuration
 * 
 * FIX-003: 消除全项目 51+ 处模型 ID 硬编码
 * 所有 LLM 模型信息统一从此文件导出
 * 
 * 用法：
 *   import { DEFAULT_MODEL, ROLE_MODEL_MAP, MODEL_CATALOG } from '../config/models'
 */

import type { RoleId } from '../types/family-manifest';

// ==========================================
// LLM Provider 类型
// ==========================================

export type LLMProvider = 'bigmodel' | 'deepseek' | 'anthropic' | 'openai' | 'qwen' | 'ollama';

// ==========================================
// Model IDs — 单一源头
// ==========================================

/** BigModel 旗舰模型 (沫言总/人类导师/智源架构师/守护哨兵) */
export const MODEL_GLM4_PLUS = 'glm-4-plus';

/** BigModel 代码专精模型 (织码工匠) */
export const MODEL_CODEGEEX4 = 'codegeex-4';

/** BigModel 高速响应模型 (中枢灵脉) */
export const MODEL_GLM4_FLASH = 'glm-4-flash';

/** BigModel 平衡性价比模型 (协作使者) */
export const MODEL_GLM4_AIR = 'glm-4-air';

/** DeepSeek 代码推理模型 */
export const MODEL_DEEPSEEK_CODER = 'deepseek-coder';

/** Ollama 本地模型 */
export const MODEL_OLLAMA_LOCAL = 'ollama-local';

/** 默认模型 */
export const DEFAULT_MODEL = MODEL_GLM4_PLUS;

/** 默认 Provider */
export const DEFAULT_PROVIDER: LLMProvider = 'bigmodel';

/** 默认 API Key 环境变量名 */
export const DEFAULT_API_KEY_ENV = 'BIGMODEL_API_KEY';

// ==========================================
// Role → Model 映射 (角色—模型绑定)
// ==========================================

export interface RoleModelBinding {
  model: string;
  provider: LLMProvider;
  apiKeyEnvVar: string;
}

/**
 * 家族八位家人 → 模型映射 (九层家人档案 v2.0)
 *
 * 映射逻辑（按角色特性精细匹配）：
 *   言启·千行 (NAVIGATOR)     → glm-4-flash   (意图识别，速度优先)
 *   语枢·万物 (THINKER)       → glm-4-plus    (深度洞察需要强推理)
 *   预见·先知 (PROPHET)       → glm-4-plus    (时序预测需要强推理)
 *   知遇·伯乐 (BOLE)          → glm-4-air     (推荐计算，平衡性价比)
 *   元启·天枢 (META_ORACLE)   → glm-4-plus    (全局决策需要最强推理)
 *   智云·守护 (GUARDIAN)      → glm-4-plus    (安全分析不能马虎)
 *   格物·宗师 (MASTER)        → codegeex-4    (代码质量分析，代码专精)
 *   创想·灵韵 (CREATIVE)      → glm-4-plus    (创意生成需要强生成能力)
 */
export const ROLE_MODEL_MAP: Record<RoleId, RoleModelBinding> = {
  NAVIGATOR:        { model: MODEL_GLM4_FLASH, provider: 'bigmodel', apiKeyEnvVar: DEFAULT_API_KEY_ENV },
  THINKER:          { model: MODEL_GLM4_PLUS,  provider: 'bigmodel', apiKeyEnvVar: DEFAULT_API_KEY_ENV },
  PROPHET:          { model: MODEL_GLM4_PLUS,  provider: 'bigmodel', apiKeyEnvVar: DEFAULT_API_KEY_ENV },
  BOLE:             { model: MODEL_GLM4_AIR,   provider: 'bigmodel', apiKeyEnvVar: DEFAULT_API_KEY_ENV },
  META_ORACLE:      { model: MODEL_GLM4_PLUS,  provider: 'bigmodel', apiKeyEnvVar: DEFAULT_API_KEY_ENV },
  GUARDIAN:         { model: MODEL_GLM4_PLUS,  provider: 'bigmodel', apiKeyEnvVar: DEFAULT_API_KEY_ENV },
  MASTER:           { model: MODEL_CODEGEEX4,  provider: 'bigmodel', apiKeyEnvVar: DEFAULT_API_KEY_ENV },
  CREATIVE:         { model: MODEL_GLM4_PLUS,  provider: 'bigmodel', apiKeyEnvVar: DEFAULT_API_KEY_ENV },
};

// ==========================================
// UI Model Catalog (前端模型选择器用)
// ==========================================

export interface UIModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  color: string;
  isAvailable: boolean;
}

/** 前端 AI 面板可选模型列表 */
export const MODEL_CATALOG: UIModelInfo[] = [
  { id: MODEL_GLM4_PLUS,     name: 'GLM-4-Plus',     provider: 'BigModel',  description: '智谱旗舰模型',   color: '#00BFFF', isAvailable: true },
  { id: MODEL_CODEGEEX4,     name: 'CodeGeeX-4',     provider: 'BigModel',  description: '代码专精模型',   color: '#32CD32', isAvailable: true },
  { id: MODEL_DEEPSEEK_CODER,name: 'DeepSeek Coder',  provider: 'DeepSeek',  description: '深度代码推理',   color: '#a78bfa', isAvailable: true },
  { id: MODEL_GLM4_FLASH,    name: 'GLM-4-Flash',    provider: 'BigModel',  description: '高速响应模型',   color: '#fbbf24', isAvailable: true },
  { id: MODEL_OLLAMA_LOCAL,   name: 'Ollama Local',    provider: 'Ollama',    description: '本地推理引擎',   color: '#f472b6', isAvailable: false },
];

// ==========================================
// Provider → Model Hints (设置面板模型提示)
// ==========================================

export const PROVIDER_MODEL_HINTS: Record<string, string[]> = {
  'gpt':      ['gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o'],
  'claude':   ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  'glm':      ['glm-4', MODEL_GLM4_AIR, 'glm-3-turbo'],
  'zhipu':    ['glm-4', MODEL_GLM4_FLASH],
  'llama':    ['llama-3-70b', 'llama-3-8b', 'llama3.2:3b-instruct-q4_K_M', 'llama3.2:1b'],
  'deepseek': ['deepseek-chat', 'deepseek-coder:33b', 'deepseek-v3.1:671b-cloud'],
  'qwen':     ['qwen3-coder:30b', 'qwen2.5-coder:1.5b'],
};

// ==========================================
// Ollama 默认配置
// ==========================================

export const OLLAMA_DEFAULTS = {
  provider: 'ollama' as LLMProvider,
  model: 'llama3',
  apiKey: 'ollama',  // Ollama 本地无需认证
} as const;

// ==========================================
// 获取角色模型信息（带 fallback）
// ==========================================

export function getRoleModel(roleId: RoleId): RoleModelBinding {
  return ROLE_MODEL_MAP[roleId] || {
    model: DEFAULT_MODEL,
    provider: DEFAULT_PROVIDER,
    apiKeyEnvVar: DEFAULT_API_KEY_ENV,
  };
}

export function getModelDisplayName(modelId: string): string {
  const found = MODEL_CATALOG.find(m => m.id === modelId);
  return found?.name || modelId;
}
