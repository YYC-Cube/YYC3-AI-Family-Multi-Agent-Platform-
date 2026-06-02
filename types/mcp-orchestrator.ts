/**
 * file: mcp-orchestrator.ts
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
 * YYC³ AI Family - MCP Orchestrator Type Definitions (前端消费类型)
 *
 * Frontend-safe type definitions for the BigModel MCPOrchestrator engine.
 * These mirror /bun-server/bigmodel-sdk/mcp/ types for frontend use
 * without importing Bun-specific server code.
 */

// ==========================================
// Tool Discovery & Bridge Types
// ==========================================

/** A tool discovered from an MCP server */
export interface DiscoveredToolInfo {
  serverName: string;
  qualifiedName: string;
  tool: {
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
  };
}

/** Result of a single tool execution */
export interface ToolExecutionResultInfo {
  toolName: string;
  serverName: string;
  success: boolean;
  result?: unknown;
  error?: string;
  executionTimeMs: number;
}

// ==========================================
// Orchestrator Request / Response
// ==========================================

/** POST /api/mcp/orchestrate request body */
export interface MCPOrchestrateRequest {
  prompt: string;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

/** POST /api/mcp/orchestrate response body */
export interface MCPOrchestrateResponse {
  finalResponse: {
    id: string;
    model: string;
    created: number;
    choices: Array<{
      index: number;
      message: {
        role: string;
        content: string | null;
        tool_calls?: Array<{
          id: string;
          type: string;
          function: { name: string; arguments: string };
        }>;
      };
      finish_reason: string;
    }>;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  toolCallHistory: ToolCallRoundInfo[];
  totalRounds: number;
  totalToolCalls: number;
  totalExecutionTimeMs: number;
  errors: Array<{ round: number; toolName: string; error: string }>;
}

/** Single round of tool call activity */
export interface ToolCallRoundInfo {
  round: number;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  results: ToolExecutionResultInfo[];
  roundTimeMs: number;
}

// ==========================================
// Orchestrator Stream Chunk Types
// ==========================================

export type OrchestratorStreamChunkType =
  | 'text'
  | 'tool_start'
  | 'tool_result'
  | 'round_complete'
  | 'done';

export interface OrchestratorStreamChunkInfo {
  type: OrchestratorStreamChunkType;
  content?: string;
  toolName?: string;
  toolResult?: ToolExecutionResultInfo;
  round?: number;
}

// ==========================================
// Orchestrator Status (GET /api/mcp/orchestrator/status)
// ==========================================

export interface MCPOrchestratorStatusResponse {
  enabled: boolean;
  sdk: string;
  provider: string;
  model: string;
  tools: number;
}

// ==========================================
// MCP Tool Listing (GET /api/mcp/tools)
// ==========================================

export interface MCPToolListItem {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}
