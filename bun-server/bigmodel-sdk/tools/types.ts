/**
 * file: types.ts
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

// ============================================================
// BigModelSDK/tools - Shared types (from YYC-Cube/Family repo)
// ============================================================

export interface ToolConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface APIError {
  code: string;
  message: string;
}

export interface ErrorResponse {
  error: APIError;
}

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id: string;
  type: 'function' | 'web_search' | 'retrieval' | 'mcp';
  function?: {
    name: string;
    arguments: string;
  };
  mcp?: MCPToolCall;
}

export interface MCPToolCall {
  id: string;
  type: 'mcp_list_tools' | 'mcp_call';
  server_label: string;
  error?: string;
  arguments?: string;
  name?: string;
  output?: Record<string, unknown>;
}

export interface FunctionToolSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface RetrievalToolSchema {
  type: 'retrieval';
  retrieval: {
    knowledge_id: string;
    prompt_template?: string;
  };
}

export interface WebSearchToolSchema {
  type: 'web_search';
  web_search: {
    enable?: boolean;
    search_query?: string;
    search_result?: boolean;
  };
}

export interface MCPToolSchema {
  type: 'mcp';
  mcp: {
    servers: {
      url: string;
      label: string;
      approval_prompt?: 'never' | 'always' | 'auto';
      allowed_tools?: string[];
    }[];
  };
}

export type ToolSchema = FunctionToolSchema | RetrievalToolSchema | WebSearchToolSchema | MCPToolSchema;

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens?: number;
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
  };
}

export interface ContentFilter {
  role: 'assistant' | 'user' | 'history';
  level: number;
}

export type AsyncTaskStatus = 'PROCESSING' | 'SUCCESS' | 'FAIL';

export interface AsyncTaskResponse {
  id: string;
  model: string;
  request_id: string;
  task_status: AsyncTaskStatus;
}

export type FinishReason = 'stop' | 'length' | 'tool_calls' | 'sensitive' | 'network_error';

export const DEFAULT_BASE_URL = 'https://open.bigmodel.cn/api/';
export const DEFAULT_TIMEOUT = 30000;
