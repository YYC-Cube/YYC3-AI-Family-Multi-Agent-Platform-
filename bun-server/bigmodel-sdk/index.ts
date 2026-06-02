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

// ============================================================
// BigModel-Z.ai SDK - Bun Server Integration Entry
// Subset of YYC-Cube/Family BigModelSDK (Phase 73)
//
// Integrated modules:
//   - ChatCompletionTool (sync / stream / async)
//   - Full model catalog (GLM-4.6, 4.5, 4-plus, CodeGeeX-4, etc.)
//   - Shared types (ToolCall, MCP types, TokenUsage, etc.)
//
// Usage in llm-proxy.ts:
//   import { createBigModelChat } from './bigmodel-sdk'
//   const chat = createBigModelChat(apiKey, baseUrl)
//   const resp = await chat.create({ model: 'glm-4-plus', messages: [...] })
//
// 感恩智谱大模型授权，致敬GLM-PC的卓越支持！
// ============================================================

// ---- Tool types ----
export type {
  ToolConfig,
  ToolCall,
  MCPToolCall,
  FunctionToolSchema,
  MCPToolSchema,
  ToolSchema,
  TokenUsage,
  ContentFilter,
  FinishReason,
  AsyncTaskResponse,
} from './tools/types';

// ---- Chat Completion ----
export { ChatCompletionTool } from './tools/chat-completion';
export { BaseTool } from './tools/base-tool';
export {
  TEXT_MODELS,
  VISION_MODELS,
  AUDIO_MODELS,
  CODE_MODELS,
} from './tools/chat-completion';
export type {
  ChatCompletionRequest,
  ChatCompletionMessage,
  ChatCompletionResponse,
  ChatCompletionChoice,
  ChatCompletionChunkResponse,
  ChatCompletionChunkChoice,
  ChatModel,
  TextModel,
  VisionModel,
  CodeModel,
} from './tools/chat-completion';

// ---- MCP Orchestrator + Tool Bridge ----
export { MCPToolBridge } from './mcp/MCPToolBridge';
export type {
  DiscoveredTool,
  BridgedToolSet,
  ToolExecutionResult,
  MCPExecutableServer,
} from './mcp/MCPToolBridge';

export { MCPOrchestrator } from './mcp/MCPOrchestrator';
export type {
  MCPOrchestratorConfig,
  OrchestratorResult,
  OrchestratorStreamChunk,
  ToolCallRound,
} from './mcp/MCPOrchestrator';

// ---- Factory ----

import { ChatCompletionTool } from './tools/chat-completion';
import type { ToolConfig } from './tools/types';

/**
 * Create a BigModel ChatCompletion client.
 * This replaces raw fetch calls with the official SDK's typed client.
 */
export function createBigModelChat(apiKey: string, baseUrl?: string, timeout?: number): ChatCompletionTool {
  return new ChatCompletionTool({
    apiKey,
    baseUrl: baseUrl || 'https://open.bigmodel.cn/api/',
    timeout: timeout || 30000,
  });
}

/**
 * SDK version (matches YYC-Cube/Family BigModelSDK)
 */
export const BIGMODEL_SDK_VERSION = '1.2.0';