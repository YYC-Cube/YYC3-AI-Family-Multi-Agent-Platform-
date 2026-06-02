/**
 * file: backend-contract.ts
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
 * YYC³ AI Family - Backend Protocol Contract (灵肉合约)
 * 
 * [AUDIT Stage 4/10] Exact TypeScript interfaces that the Bun server MUST implement.
 * This file is the SINGLE SOURCE OF TRUTH for frontend↔backend communication.
 * 
 * The frontend BackendBridge already sends these message shapes.
 * The Bun server must handle them and respond in the specified format.
 * 
 * Copy this file to your Bun server project for type safety.
 */

import { RoleId } from './family-manifest';

// ==========================================
// 0. Terminal Protocol Types
// (Re-exported from canonical source — P0 deduplication, Guidelines.md §9.1)
// ==========================================

import type {
  WS_TerminalExec,
  WS_TerminalOutput,
} from './terminal';

export type {
  WS_TerminalExec,
  WS_TerminalOutput,
} from './terminal';

// ==========================================
// 1. WebSocket Inbound Messages (Frontend → Bun)
// These are the BackendCommand types from backend-bridge.ts
// ==========================================

export interface WS_Ping {
  type: 'ping';
  payload: { timestamp: number };
  requestId: string;
}

export interface WS_Subscribe {
  type: 'subscribe';
  payload: { channel: string };
  requestId: string;
}

export interface WS_DispatchSignal {
  type: 'dispatch_signal';
  payload: {
    id: string;
    timestamp: number;
    type: string;
    senderId: string;
    receiverId: string;
    payload: { content: string; priority?: string };
    metadata: { version: string };
  };
  requestId: string;
}

export interface WS_UpdateMember {
  type: 'update_member';
  payload: {
    roleId: RoleId;
    updates: Record<string, unknown>;
  };
  requestId: string;
}

export interface WS_GetMembers {
  type: 'get_members';
  payload: {};
  requestId: string;
}

/**
 * CRITICAL: This is the agent call that carries the 4-layer SystemPrompt.
 * The Bun server must:
 * 1. Extract payload.context.systemPrompt
 * 2. Call Anthropic Messages API with it as system message
 * 3. Use payload.prompt as the user message
 * 4. Return the response via WS_AgentResponse
 */
export interface WS_AgentCall {
  type: 'agent_call';
  payload: {
    roleId: RoleId;
    prompt: string;            // User's original input text
    context: {
      dialogueChainId?: string;
      previousResponses?: { roleId: string; content: string }[];
      systemPrompt?: string;   // The 4-layer persona prompt (Layer1+2+3+4)
    };
    endpoint?: string;         // e.g. "http://localhost:3080/api/agent/ai-architect"
    model?: string;            // e.g. "claude-sonnet-4-20250514"
  };
  requestId: string;
}

export type InboundMessage = 
  | WS_Ping 
  | WS_Subscribe 
  | WS_DispatchSignal 
  | WS_UpdateMember 
  | WS_GetMembers 
  | WS_AgentCall
  | WS_TerminalExec;

// ==========================================
// 2. WebSocket Outbound Messages (Bun → Frontend)
// These are the BackendMessage types from backend-bridge.ts
// ==========================================

export interface WS_Pong {
  type: 'pong';
  payload: { timestamp: number; serverTime: number };
  timestamp: number;
  requestId: string;
}

export interface WS_Signal {
  type: 'signal';
  payload: {
    id: string;
    timestamp: number;
    type: string;
    senderId: string;
    receiverId: string;
    payload: { content: string; mood?: string; priority?: string; modelSource?: 'REAL' | 'MOCK' };
    metadata: { version: string; processingTime?: number; modelEndpoint?: string };
  };
  timestamp: number;
}

export interface WS_AgentResponse {
  type: 'agent_response';
  payload: {
    content: string;           // The LLM's response text
    roleId: RoleId;
    model: string;
    latency: number;
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
    };
    error?: string;            // If set, frontend treats as failure → falls back to mock
  };
  timestamp: number;
  requestId: string;           // Must match the WS_AgentCall.requestId for correlation
}

export interface WS_MemberUpdate {
  type: 'member_update';
  payload: {
    roleId: RoleId;
    updates: Record<string, unknown>;
  };
  timestamp: number;
}

export interface WS_SystemEvent {
  type: 'system_event';
  payload: {
    event: string;
    data?: unknown;
  };
  timestamp: number;
}

export interface WS_Error {
  type: 'error';
  payload: {
    message: string;
    code?: string;
    requestId?: string;
  };
  timestamp: number;
}

export type OutboundMessage = 
  | WS_Pong 
  | WS_Signal 
  | WS_AgentResponse 
  | WS_MemberUpdate 
  | WS_SystemEvent 
  | WS_Error
  | WS_TerminalOutput;

// ==========================================
// 3. REST API Contracts
// ==========================================

/** GET /api/health */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  services: {
    websocket: boolean;
    redis: boolean;
    postgresql: boolean;
  };
  connectedClients: number;
  timestamp: number;
}

/** GET /api/family/members */
export interface MembersListResponse {
  members: {
    roleId: RoleId;
    isOnline: boolean;
    mood: string;
    currentActivity: string;
    lastHeartbeat: number;
    device?: {
      deviceId: string;
      name: string;
      ip: string;
      status: string;
    };
  }[];
}

/** PATCH /api/family/members/:roleId */
export interface MemberUpdateRequest {
  mood?: string;
  currentActivity?: string;
  systemPrompt?: string;
  permissions?: Record<string, boolean>;
}

// ==========================================
// 4. MCP Orchestrator Contracts
// (Re-exported from canonical source — P0 deduplication, Guidelines.md §9.1)
// ==========================================

export type {
  MCPOrchestrateRequest,
  MCPOrchestrateResponse,
  MCPOrchestratorStatusResponse,
  MCPToolListItem,
  ToolCallRoundInfo,
  ToolExecutionResultInfo,
  DiscoveredToolInfo,
} from './mcp-orchestrator';

/** GET /api/mcp/tools */
export interface MCPToolsListResponse {
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
}

/** POST /api/agent/:roleId — REST alternative to WS agent_call */
export interface AgentCallRequest {
  prompt: string;
  systemPrompt: string;
  model?: string;
  provider?: string;
  context?: {
    dialogueChainId?: string;
    previousResponses?: { roleId: string; content: string }[];
  };
}

export interface AgentCallResponse {
  content: string;
  model: string;
  latency: number;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ==========================================
// 5. Anthropic API Call Shape (what the Bun proxy must send)
// ==========================================

export interface AnthropicMessagesRequest {
  model: string;                // "claude-sonnet-4-20250514"
  max_tokens: number;           // 2048 recommended
  system: string;               // The 4-layer SystemPrompt from WS_AgentCall
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

export interface AnthropicMessagesResponse {
  id: string;
  type: 'message';
  content: { type: 'text'; text: string }[];
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}