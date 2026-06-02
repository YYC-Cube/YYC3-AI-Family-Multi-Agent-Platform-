/**
 * file: bigmodel-hooks.ts
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
 * YYC³ AI Family - BigModel React Hooks Type Definitions
 *
 * Frontend type definitions for useBigModel / useChat / useChatStream / useMCPOrchestrator.
 * These are the public API types that consuming components use.
 */

// ==========================================
// Message & Response Types
// ==========================================

/** A single message in a BigModel conversation */
export interface BigModelMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

/** Parsed response from a BigModel completion */
export interface BigModelResponse {
  id: string;
  model: string;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
}

// ==========================================
// Orchestrator Progress
// ==========================================

export type OrchestratorProgressType =
  | 'tool_start'
  | 'tool_result'
  | 'round_complete'
  | 'text'
  | 'done';

/** Progress event from the MCP orchestrator */
export interface OrchestratorProgress {
  round: number;
  type: OrchestratorProgressType;
  toolName?: string;
  content?: string;
  success?: boolean;
  executionTimeMs?: number;
}

// ==========================================
// Hook Config
// ==========================================

/** Configuration for all BigModel hooks */
export interface UseBigModelConfig {
  /** Backend API URL (default: http://localhost:3080) */
  apiUrl?: string;
  /** Direct API key (optional — use proxy mode by default) */
  apiKey?: string;
  /** Model to use (default: glm-4-plus) */
  model?: string;
  /** Temperature (0.0 - 1.0) */
  temperature?: number;
  /** Max tokens */
  maxTokens?: number;
  /** System prompt */
  systemPrompt?: string;
  /** Which family role to route through (proxy mode only) */
  roleId?: string;
}

// ==========================================
// Hook Return Types
// ==========================================

/** Return type of useBigModel */
export interface UseBigModelReturn {
  loading: boolean;
  error: Error | null;
  complete: (prompt: string, overrides?: Partial<UseBigModelConfig>) => Promise<BigModelResponse | null>;
  orchestrate: (
    prompt: string,
    onProgress?: (progress: OrchestratorProgress) => void,
    overrides?: Partial<UseBigModelConfig>,
  ) => Promise<BigModelResponse | null>;
  cancel: () => void;
}

/** Return type of useChat */
export interface UseChatReturn {
  messages: BigModelMessage[];
  lastResponse: BigModelResponse | null;
  loading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<BigModelResponse | null>;
  clearMessages: () => void;
  cancel: () => void;
}

/** Return type of useChatStream */
export interface UseChatStreamReturn {
  messages: BigModelMessage[];
  currentResponse: string;
  loading: boolean;
  streaming: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<string | null>;
  clearMessages: () => void;
  cancel: () => void;
}

/** Return type of useMCPOrchestrator */
export interface UseMCPOrchestratorReturn {
  loading: boolean;
  error: Error | null;
  progress: OrchestratorProgress[];
  lastResult: BigModelResponse | null;
  run: (prompt: string) => Promise<BigModelResponse | null>;
  cancel: () => void;
}

// ==========================================
// LLM Provider type (matches bun-server config)
// ==========================================

export type LLMProviderType = 'anthropic' | 'openai' | 'ollama' | 'deepseek' | 'qwen' | 'bigmodel';

/** Per-role model assignment info */
export interface RoleModelInfo {
  roleId: string;
  provider: LLMProviderType;
  model: string;
  fallbackProvider?: LLMProviderType;
  fallbackModel?: string;
}
