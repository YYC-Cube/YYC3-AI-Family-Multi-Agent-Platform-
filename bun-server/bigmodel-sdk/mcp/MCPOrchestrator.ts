/**
 * file: MCPOrchestrator.ts
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
// BigModelSDK/mcp - MCP Orchestrator (from YYC-Cube/Family repo)
// Phase 73: Real end-to-end Tool Call Loop
//
// Complete flow:
//   User → ChatCompletion(tools) → Model returns tool_calls
//     → Route to MCP Server for execution → Inject results as tool message
//     → Call ChatCompletion again → Repeat until finish_reason=stop
//
// 感恩智谱大模型授权，致敬GLM-PC的卓越支持！
// ============================================================

import { MCPToolBridge } from './MCPToolBridge';
import type { BridgedToolSet, ToolExecutionResult, DiscoveredTool } from './MCPToolBridge';
import type { ChatCompletionTool } from '../tools/chat-completion';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionMessage,
  ChatCompletionChunkResponse,
} from '../tools/chat-completion';

/** Orchestrator config */
export interface MCPOrchestratorConfig {
  /** Max tool call rounds (prevents infinite loops), default 10 */
  maxToolCallRounds?: number;
  /** Per-round MCP tool execution timeout ms, default 30000 */
  toolTimeoutMs?: number;
  /** Execute same-round tool_calls in parallel, default true */
  parallelExecution?: boolean;
  /** Only use tools from these servers */
  includeServerNames?: string[];
  /** Callback: tool call started */
  onToolCall?: (round: number, toolName: string, args: Record<string, unknown>) => void;
  /** Callback: tool call result */
  onToolResult?: (round: number, result: ToolExecutionResult) => void;
  /** Callback: round started */
  onRoundStart?: (round: number, toolCount: number) => void;
  /** Error strategy: 'abort' | 'skip' | 'retry', default 'skip' */
  errorStrategy?: 'abort' | 'skip' | 'retry';
  /** Retry count (when errorStrategy='retry'), default 2 */
  maxRetries?: number;
}

/** Orchestration result */
export interface OrchestratorResult {
  finalResponse: ChatCompletionResponse;
  toolCallHistory: ToolCallRound[];
  totalRounds: number;
  totalToolCalls: number;
  totalExecutionTimeMs: number;
  errors: Array<{ round: number; toolName: string; error: string }>;
}

/** Stream chunk types */
export interface OrchestratorStreamChunk {
  type: 'text' | 'tool_start' | 'tool_result' | 'round_complete' | 'done';
  content?: string;
  toolName?: string;
  toolResult?: ToolExecutionResult;
  round?: number;
  chunk?: ChatCompletionChunkResponse;
}

/** Single round of tool calls */
export interface ToolCallRound {
  round: number;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  results: ToolExecutionResult[];
  roundTimeMs: number;
}

const DEFAULT_CONFIG: Required<MCPOrchestratorConfig> = {
  maxToolCallRounds: 10,
  toolTimeoutMs: 30000,
  parallelExecution: true,
  includeServerNames: [],
  onToolCall: () => {},
  onToolResult: () => {},
  onRoundStart: () => {},
  errorStrategy: 'skip',
  maxRetries: 2,
};

export class MCPOrchestrator {
  private chatTool: ChatCompletionTool;
  private bridge: MCPToolBridge;
  private config: Required<MCPOrchestratorConfig>;
  private discoveredTools: DiscoveredTool[] = [];

  constructor(
    chatTool: ChatCompletionTool,
    bridge: MCPToolBridge,
    config: MCPOrchestratorConfig = {},
  ) {
    this.chatTool = chatTool;
    this.bridge = bridge;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register tools that the orchestrator knows about.
   * These will be injected into ChatCompletion requests.
   */
  setDiscoveredTools(tools: DiscoveredTool[]): void {
    this.discoveredTools = tools;
  }

  // ==================================================================
  // Sync mode — Complete Tool Call Loop
  // ==================================================================

  async run(request: Omit<ChatCompletionRequest, 'tools'>): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const errors: OrchestratorResult['errors'] = [];

    // 1. Build function tools from discovered MCP tools
    const serverFilter = this.config.includeServerNames.length > 0
      ? this.config.includeServerNames
      : undefined;
    const bridgedTools = this.bridge.buildFunctionTools(this.discoveredTools, serverFilter);

    // 2. Prepare message history
    const messages: ChatCompletionMessage[] = [...request.messages];
    const toolCallHistory: ToolCallRound[] = [];
    let totalToolCalls = 0;

    // 3. Tool Call Loop
    for (let round = 0; round < this.config.maxToolCallRounds; round++) {
      const response = await this.chatTool.create({
        ...request,
        messages,
        tools: bridgedTools.functionTools.length > 0 ? bridgedTools.functionTools : undefined,
        stream: false,
      } as ChatCompletionRequest);

      const choice = response.choices?.[0];
      if (!choice) {
        return this.buildResult(response, toolCallHistory, round + 1, totalToolCalls, startTime, errors);
      }

      // No tool_calls → model gave final response
      if (!choice.message?.tool_calls || choice.message.tool_calls.length === 0) {
        return this.buildResult(response, toolCallHistory, round + 1, totalToolCalls, startTime, errors);
      }

      // Has tool_calls → execute them
      const roundStart = Date.now();
      const toolCalls = choice.message.tool_calls
        .filter(tc => tc.function?.name)
        .map(tc => ({
          id: tc.id,
          name: tc.function!.name,
          arguments: this.safeParseArgs(tc.function!.arguments || '{}'),
        }));

      this.config.onRoundStart(round + 1, toolCalls.length);

      // Append assistant message (with tool_calls)
      messages.push({
        role: 'assistant',
        content: choice.message.content || '',
        tool_calls: choice.message.tool_calls,
      });

      // Execute tool calls
      const results = await this.executeToolCalls(
        round + 1,
        toolCalls,
        bridgedTools,
        errors,
      );

      // Append tool messages
      for (let i = 0; i < toolCalls.length; i++) {
        const result = results[i];
        messages.push({
          role: 'tool',
          content: result.success
            ? (typeof result.result === 'string' ? result.result : JSON.stringify(result.result))
            : `Error: ${result.error}`,
          tool_call_id: toolCalls[i].id,
        });
      }

      toolCallHistory.push({
        round: round + 1,
        toolCalls,
        results,
        roundTimeMs: Date.now() - roundStart,
      });
      totalToolCalls += toolCalls.length;
    }

    // Max rounds reached — final call without tools
    const finalResponse = await this.chatTool.create({
      ...request,
      messages,
      stream: false,
    } as ChatCompletionRequest);

    return this.buildResult(finalResponse, toolCallHistory, this.config.maxToolCallRounds, totalToolCalls, startTime, errors);
  }

  // ==================================================================
  // Stream mode — yield chunks progressively
  // ==================================================================

  async *runStream(
    request: Omit<ChatCompletionRequest, 'tools' | 'stream'>,
  ): AsyncGenerator<OrchestratorStreamChunk, void, unknown> {
    const serverFilter = this.config.includeServerNames.length > 0
      ? this.config.includeServerNames
      : undefined;
    const bridgedTools = this.bridge.buildFunctionTools(this.discoveredTools, serverFilter);
    const messages: ChatCompletionMessage[] = [...request.messages];

    for (let round = 0; round < this.config.maxToolCallRounds; round++) {
      // Streaming ChatCompletion call
      let accumulatedContent = '';
      const accumulatedToolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();

      for await (const chunk of this.chatTool.createStream({
        ...request,
        messages,
        tools: bridgedTools.functionTools.length > 0 ? bridgedTools.functionTools : undefined,
      } as any)) {
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;

        // Text content
        if (delta.content) {
          accumulatedContent += delta.content;
          yield { type: 'text', content: delta.content, chunk };
        }

        // Tool call increments
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (!accumulatedToolCalls.has(tc.index)) {
              accumulatedToolCalls.set(tc.index, { id: tc.id || '', name: tc.function?.name || '', arguments: '' });
            }
            const existing = accumulatedToolCalls.get(tc.index)!;
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) existing.arguments += tc.function.arguments;
          }
        }
      }

      // No tool_calls → done
      if (accumulatedToolCalls.size === 0) {
        yield { type: 'done' };
        return;
      }

      // Has tool_calls → execute
      const toolCalls = Array.from(accumulatedToolCalls.values()).map(tc => ({
        id: tc.id,
        name: tc.name,
        arguments: this.safeParseArgs(tc.arguments),
      }));

      // Append assistant message
      messages.push({
        role: 'assistant',
        content: accumulatedContent,
        tool_calls: toolCalls.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      });

      // Execute tools
      for (const tc of toolCalls) {
        yield { type: 'tool_start', toolName: tc.name, round: round + 1 };
        this.config.onToolCall(round + 1, tc.name, tc.arguments);

        const result = await this.bridge.executeToolCall(tc.name, tc.arguments, bridgedTools.toolMap);

        yield { type: 'tool_result', toolName: tc.name, toolResult: result, round: round + 1 };
        this.config.onToolResult(round + 1, result);

        messages.push({
          role: 'tool',
          content: result.success
            ? (typeof result.result === 'string' ? result.result : JSON.stringify(result.result))
            : `Error: ${result.error}`,
          tool_call_id: tc.id,
        });
      }

      yield { type: 'round_complete', round: round + 1 };
    }

    yield { type: 'done' };
  }

  // ==================================================================
  // Tool execution — with timeout + error strategy + retry
  // ==================================================================

  private async executeToolCalls(
    round: number,
    toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>,
    bridgedTools: BridgedToolSet,
    errors: OrchestratorResult['errors'],
  ): Promise<ToolExecutionResult[]> {
    const execute = async (tc: typeof toolCalls[0]): Promise<ToolExecutionResult> => {
      this.config.onToolCall(round, tc.name, tc.arguments);

      let lastError: ToolExecutionResult | null = null;
      const maxAttempts = this.config.errorStrategy === 'retry' ? this.config.maxRetries + 1 : 1;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Execute with timeout
        const result = await Promise.race([
          this.bridge.executeToolCall(tc.name, tc.arguments, bridgedTools.toolMap),
          this.createTimeout(tc.name),
        ]);

        this.config.onToolResult(round, result);

        if (result.success) return result;

        lastError = result;
        if (this.config.errorStrategy === 'abort') {
          errors.push({ round, toolName: tc.name, error: result.error || 'Unknown error' });
          throw new Error(`Tool '${tc.name}' failed: ${result.error}`);
        }
      }

      // skip or retry exhausted
      const finalResult = lastError || {
        toolName: tc.name,
        serverName: 'unknown',
        success: false,
        error: 'Max retries exceeded',
        executionTimeMs: 0,
      };
      errors.push({ round, toolName: tc.name, error: finalResult.error || 'Unknown error' });
      return finalResult;
    };

    if (this.config.parallelExecution) {
      return Promise.all(toolCalls.map(execute));
    } else {
      const results: ToolExecutionResult[] = [];
      for (const tc of toolCalls) {
        results.push(await execute(tc));
      }
      return results;
    }
  }

  private createTimeout(toolName: string): Promise<ToolExecutionResult> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          toolName,
          serverName: 'timeout',
          success: false,
          error: `Tool '${toolName}' timed out after ${this.config.toolTimeoutMs}ms`,
          executionTimeMs: this.config.toolTimeoutMs,
        });
      }, this.config.toolTimeoutMs);
    });
  }

  private buildResult(
    finalResponse: ChatCompletionResponse,
    toolCallHistory: ToolCallRound[],
    totalRounds: number,
    totalToolCalls: number,
    startTime: number,
    errors: OrchestratorResult['errors'],
  ): OrchestratorResult {
    return { finalResponse, toolCallHistory, totalRounds, totalToolCalls, totalExecutionTimeMs: Date.now() - startTime, errors };
  }

  private safeParseArgs(argsStr: string): Record<string, unknown> {
    try { return JSON.parse(argsStr); } catch { return {}; }
  }
}

export default MCPOrchestrator;
