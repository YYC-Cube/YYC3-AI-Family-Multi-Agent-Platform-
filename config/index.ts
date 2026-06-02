/**
 * file: index.ts
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
 * YYC³ AI Family — Centralized Configuration Index
 * 
 * 统一导出所有配置模块
 */

export * from './endpoints';
export * from './models';
export * from './dynamic-reader';

// Re-export dynamic config types for convenience
export type {
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