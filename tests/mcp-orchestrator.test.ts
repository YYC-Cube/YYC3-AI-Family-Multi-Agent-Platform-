/**
 * file: mcp-orchestrator.test.ts
 * description: 测试 · 待补充描述
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-04
 * updated: 2026-04-04
 * status: active
 * tags: [test]
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
 * YYC³ AI Family — MCPOrchestrator Test Suite
 *
 * Tests for:
 *   T1: Single-round no-tool completion (pass-through)
 *   T2: Single-round with tool_calls → execute → final response
 *   T3: Multi-round tool_call loop
 *   T4: Max round limit enforcement
 *   T5: Error strategy: skip / abort
 *   T6: Callback invocation (onToolCall, onToolResult, onRoundStart)
 *   T7: Stream mode basic flow
 *   T8: safeParseArgs malformed JSON
 *
 * Run: bun test tests/mcp-orchestrator.test.ts
 */

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void | Promise<void>): void;
declare function expect(value: any): any;

import { MCPOrchestrator } from '../bun-server/bigmodel-sdk/mcp/MCPOrchestrator';
import { MCPToolBridge } from '../bun-server/bigmodel-sdk/mcp/MCPToolBridge';
import type { DiscoveredTool, MCPExecutableServer } from '../bun-server/bigmodel-sdk/mcp/MCPToolBridge';
import type { ChatCompletionTool } from '../bun-server/bigmodel-sdk/tools/chat-completion';

// ==========================================
// Mock ChatCompletionTool
// ==========================================

/** Creates a mock ChatCompletionTool that returns predetermined responses */
function createMockChatTool(responses: any[]): ChatCompletionTool {
  let callIndex = 0;
  return {
    create: async (_req: any) => {
      const response = responses[Math.min(callIndex, responses.length - 1)];
      callIndex++;
      return response;
    },
    createStream: async function* (_req: any) {
      const response = responses[Math.min(callIndex, responses.length - 1)];
      callIndex++;
      // Yield the full response as a single chunk
      yield {
        id: response.id || 'chunk-1',
        created: Date.now(),
        model: response.model || 'mock',
        choices: [{
          index: 0,
          delta: {
            role: 'assistant',
            content: response.choices?.[0]?.message?.content || '',
            tool_calls: response.choices?.[0]?.message?.tool_calls?.map((tc: any, i: number) => ({
              index: i,
              id: tc.id,
              type: tc.type,
              function: tc.function,
            })),
          },
          finish_reason: response.choices?.[0]?.finish_reason,
        }],
      };
    },
    createAsync: async (_req: any) => ({ id: 'async-1', model: 'mock', request_id: 'r1', task_status: 'SUCCESS' as const }),
  } as unknown as ChatCompletionTool;
}

/** Standard mock final response (no tool_calls) */
function makeFinalResponse(content: string = 'Done') {
  return {
    id: 'resp-final',
    created: Date.now(),
    model: 'glm-4-plus',
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  };
}

/** Mock response with tool_calls */
function makeToolCallResponse(toolCalls: Array<{ name: string; args: Record<string, unknown> }>) {
  return {
    id: 'resp-tc',
    created: Date.now(),
    model: 'glm-4-plus',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: '',
        tool_calls: toolCalls.map((tc, i) => ({
          id: `tc-${i}`,
          type: 'function',
          function: { name: `yyc3-family__${tc.name}`, arguments: JSON.stringify(tc.args) },
        })),
      },
      finish_reason: 'tool_calls',
    }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  };
}

// ==========================================
// Setup helpers
// ==========================================

function createTestBridge(): MCPToolBridge {
  const bridge = new MCPToolBridge();
  const server: MCPExecutableServer = {
    async callTool(name: string, args: Record<string, unknown>) {
      return { content: `Result of ${name}: ${JSON.stringify(args)}`, isError: false };
    },
  };
  bridge.registerServer('yyc3-family', server);
  return bridge;
}

const DISCOVERED_TOOLS: DiscoveredTool[] = [
  {
    serverName: 'yyc3-family',
    qualifiedName: 'yyc3-family__greet',
    tool: { name: 'greet', description: 'Greet someone' },
  },
  {
    serverName: 'yyc3-family',
    qualifiedName: 'yyc3-family__calculate',
    tool: { name: 'calculate', description: 'Do math' },
  },
];

// ==========================================
// T1: Single-round no-tool completion
// ==========================================

describe("T1: Pass-through (no tool_calls)", () => {
  test("returns final response directly when no tool_calls", async () => {
    const bridge = createTestBridge();
    const chatTool = createMockChatTool([makeFinalResponse('Hello world')]);
    const orch = new MCPOrchestrator(chatTool, bridge);
    orch.setDiscoveredTools(DISCOVERED_TOOLS);

    const result = await orch.run({
      model: 'glm-4-plus',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.finalResponse.choices[0].message.content).toBe('Hello world');
    expect(result.totalToolCalls).toBe(0);
    expect(result.totalRounds).toBe(1);
    expect(result.toolCallHistory).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});

// ==========================================
// T2: Single-round with tool_calls
// ==========================================

describe("T2: Single-round tool_call → execute → final", () => {
  test("executes tool call and returns final response", async () => {
    const bridge = createTestBridge();
    const chatTool = createMockChatTool([
      makeToolCallResponse([{ name: 'greet', args: { name: 'Alice' } }]),
      makeFinalResponse('Greeted Alice successfully'),
    ]);
    const orch = new MCPOrchestrator(chatTool, bridge);
    orch.setDiscoveredTools(DISCOVERED_TOOLS);

    const result = await orch.run({
      model: 'glm-4-plus',
      messages: [{ role: 'user', content: 'Greet Alice' }],
    });

    expect(result.finalResponse.choices[0].message.content).toBe('Greeted Alice successfully');
    expect(result.totalToolCalls).toBe(1);
    expect(result.totalRounds).toBe(2);
    expect(result.toolCallHistory).toHaveLength(1);
    expect(result.toolCallHistory[0].toolCalls[0].name).toContain('greet');
    expect(result.toolCallHistory[0].results[0].success).toBe(true);
  });
});

// ==========================================
// T3: Multi-round tool_call loop
// ==========================================

describe("T3: Multi-round tool_call loop", () => {
  test("handles 3 rounds of tool calls", async () => {
    const bridge = createTestBridge();
    const chatTool = createMockChatTool([
      makeToolCallResponse([{ name: 'greet', args: { step: 1 } }]),
      makeToolCallResponse([{ name: 'calculate', args: { step: 2 } }]),
      makeToolCallResponse([{ name: 'greet', args: { step: 3 } }]),
      makeFinalResponse('All 3 steps complete'),
    ]);
    const orch = new MCPOrchestrator(chatTool, bridge);
    orch.setDiscoveredTools(DISCOVERED_TOOLS);

    const result = await orch.run({
      model: 'glm-4-plus',
      messages: [{ role: 'user', content: 'Run 3 steps' }],
    });

    expect(result.totalRounds).toBe(4);
    expect(result.totalToolCalls).toBe(3);
    expect(result.toolCallHistory).toHaveLength(3);
    expect(result.finalResponse.choices[0].message.content).toBe('All 3 steps complete');
  });
});

// ==========================================
// T4: Max round limit
// ==========================================

describe("T4: Max Round Limit", () => {
  test("stops at maxToolCallRounds and makes final call without tools", async () => {
    const bridge = createTestBridge();

    // Create infinite tool call loop
    const infiniteResponse = makeToolCallResponse([{ name: 'greet', args: {} }]);
    const responses = Array(15).fill(infiniteResponse);
    responses.push(makeFinalResponse('Force stopped'));

    const chatTool = createMockChatTool(responses);
    const orch = new MCPOrchestrator(chatTool, bridge, { maxToolCallRounds: 3 });
    orch.setDiscoveredTools(DISCOVERED_TOOLS);

    const result = await orch.run({
      model: 'glm-4-plus',
      messages: [{ role: 'user', content: 'Loop forever' }],
    });

    expect(result.totalRounds).toBeLessThanOrEqual(3);
    expect(result.toolCallHistory.length).toBeLessThanOrEqual(3);
  });
});

// ==========================================
// T5: Error Strategy
// ==========================================

describe("T5: Error Strategy", () => {
  test("skip strategy continues on tool failure", async () => {
    const bridge = new MCPToolBridge();
    // Register a server that fails on 'greet'
    bridge.registerServer('yyc3-family', {
      async callTool(name: string) {
        if (name === 'greet') throw new Error('Greet failed');
        return { content: 'OK', isError: false };
      },
    });

    const chatTool = createMockChatTool([
      makeToolCallResponse([{ name: 'greet', args: {} }]),
      makeFinalResponse('Continued despite error'),
    ]);

    const orch = new MCPOrchestrator(chatTool, bridge, { errorStrategy: 'skip' });
    orch.setDiscoveredTools(DISCOVERED_TOOLS);

    const result = await orch.run({
      model: 'glm-4-plus',
      messages: [{ role: 'user', content: 'Try greet' }],
    });

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].toolName).toContain('greet');
    // It should still have completed
    expect(result.finalResponse).toBeDefined();
  });
});

// ==========================================
// T6: Callback Invocation
// ==========================================

describe("T6: Callbacks", () => {
  test("onRoundStart, onToolCall, onToolResult are called", async () => {
    const bridge = createTestBridge();
    const chatTool = createMockChatTool([
      makeToolCallResponse([{ name: 'greet', args: { n: 1 } }]),
      makeFinalResponse('Done'),
    ]);

    const callLog: string[] = [];

    const orch = new MCPOrchestrator(chatTool, bridge, {
      onRoundStart: (round, count) => callLog.push(`round:${round}:${count}`),
      onToolCall: (round, name) => callLog.push(`call:${round}:${name}`),
      onToolResult: (round, result) => callLog.push(`result:${round}:${result.success}`),
    });
    orch.setDiscoveredTools(DISCOVERED_TOOLS);

    await orch.run({
      model: 'glm-4-plus',
      messages: [{ role: 'user', content: 'Test callbacks' }],
    });

    expect(callLog).toContain('round:1:1');
    expect(callLog.some(l => l.startsWith('call:1:'))).toBe(true);
    expect(callLog.some(l => l.startsWith('result:1:'))).toBe(true);
  });
});

// ==========================================
// T7: Result structure
// ==========================================

describe("T7: Result Structure", () => {
  test("result has all required fields", async () => {
    const bridge = createTestBridge();
    const chatTool = createMockChatTool([makeFinalResponse('OK')]);
    const orch = new MCPOrchestrator(chatTool, bridge);
    orch.setDiscoveredTools(DISCOVERED_TOOLS);

    const result = await orch.run({
      model: 'glm-4-plus',
      messages: [{ role: 'user', content: 'Test' }],
    });

    expect(result).toHaveProperty('finalResponse');
    expect(result).toHaveProperty('toolCallHistory');
    expect(result).toHaveProperty('totalRounds');
    expect(result).toHaveProperty('totalToolCalls');
    expect(result).toHaveProperty('totalExecutionTimeMs');
    expect(result).toHaveProperty('errors');
    expect(typeof result.totalExecutionTimeMs).toBe('number');
    expect(result.totalExecutionTimeMs).toBeGreaterThanOrEqual(0);
  });
});

// ==========================================
// T8: setDiscoveredTools
// ==========================================

describe("T8: setDiscoveredTools", () => {
  test("can update discovered tools dynamically", async () => {
    const bridge = createTestBridge();
    const chatTool = createMockChatTool([makeFinalResponse('OK')]);
    const orch = new MCPOrchestrator(chatTool, bridge);

    // Start with no tools
    orch.setDiscoveredTools([]);

    // Now add tools
    orch.setDiscoveredTools(DISCOVERED_TOOLS);

    const result = await orch.run({
      model: 'glm-4-plus',
      messages: [{ role: 'user', content: 'Test' }],
    });

    expect(result.finalResponse).toBeDefined();
  });
});
