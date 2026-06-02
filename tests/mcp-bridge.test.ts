/**
 * file: mcp-bridge.test.ts
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
 * YYC³ AI Family — MCPToolBridge Test Suite
 *
 * Tests for:
 *   T1: Server registration / unregistration
 *   T2: Tool name sanitization
 *   T3: buildFunctionTools conversion (DiscoveredTool → FunctionToolSchema)
 *   T4: executeToolCall routing to correct server
 *   T5: executeBatch parallel execution
 *   T6: Error handling (unknown tool, missing server)
 *   T7: Server filtering
 *
 * Run: bun test tests/mcp-bridge.test.ts
 */

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void | Promise<void>): void;
declare function expect(value: any): any;
declare function beforeEach(fn: () => void): void;

import { MCPToolBridge } from '../bun-server/bigmodel-sdk/mcp/MCPToolBridge';
import type { DiscoveredTool, MCPExecutableServer } from '../bun-server/bigmodel-sdk/mcp/MCPToolBridge';

// ==========================================
// Mock MCP Server
// ==========================================

function createMockServer(responses?: Record<string, any>): MCPExecutableServer {
  return {
    async callTool(name: string, args: Record<string, unknown>) {
      if (responses && responses[name]) {
        return { content: responses[name], isError: false };
      }
      return { content: `Mock result for ${name}: ${JSON.stringify(args)}`, isError: false };
    },
  };
}

function createErrorServer(): MCPExecutableServer {
  return {
    async callTool(_name: string, _args: Record<string, unknown>) {
      throw new Error('Server exploded');
    },
  };
}

// ==========================================
// Sample discovered tools
// ==========================================

const SAMPLE_TOOLS: DiscoveredTool[] = [
  {
    serverName: 'test-server',
    qualifiedName: 'test-server__greet',
    tool: { name: 'greet', description: 'Say hello', inputSchema: { type: 'object', properties: { name: { type: 'string' } } } },
  },
  {
    serverName: 'test-server',
    qualifiedName: 'test-server__calculate',
    tool: { name: 'calculate', description: 'Do math', inputSchema: { type: 'object', properties: { expr: { type: 'string' } } } },
  },
  {
    serverName: 'other-server',
    qualifiedName: 'other-server__weather',
    tool: { name: 'weather', description: 'Get weather', inputSchema: { type: 'object', properties: { city: { type: 'string' } } } },
  },
];

// ==========================================
// T1: Server Registration
// ==========================================

describe("T1: Server Registration", () => {
  test("registerServer adds server to bridge", () => {
    const bridge = new MCPToolBridge();
    bridge.registerServer('my-server', createMockServer());
    expect(bridge.listServers()).toContain('my-server');
  });

  test("unregisterServer removes server", () => {
    const bridge = new MCPToolBridge();
    bridge.registerServer('my-server', createMockServer());
    bridge.unregisterServer('my-server');
    expect(bridge.listServers()).not.toContain('my-server');
  });

  test("multiple servers can coexist", () => {
    const bridge = new MCPToolBridge();
    bridge.registerServer('server-a', createMockServer());
    bridge.registerServer('server-b', createMockServer());
    expect(bridge.listServers()).toHaveLength(2);
  });

  test("listServers returns empty array initially", () => {
    const bridge = new MCPToolBridge();
    expect(bridge.listServers()).toHaveLength(0);
  });
});

// ==========================================
// T2: Tool Name Sanitization
// ==========================================

describe("T2: Tool Name Sanitization", () => {
  test("keeps valid characters", () => {
    const bridge = new MCPToolBridge();
    const result = bridge.buildFunctionTools([{
      serverName: 'srv',
      qualifiedName: 'srv__valid_name-123',
      tool: { name: 'valid_name', description: 'Test' },
    }]);
    const name = result.functionTools[0].function.name;
    expect(name).toBe('srv__valid_name-123');
  });

  test("replaces invalid characters with underscore", () => {
    const bridge = new MCPToolBridge();
    const result = bridge.buildFunctionTools([{
      serverName: 'srv',
      qualifiedName: 'srv::weird.name@here',
      tool: { name: 'weird', description: 'Test' },
    }]);
    const name = result.functionTools[0].function.name;
    expect(name).not.toContain(':');
    expect(name).not.toContain('.');
    expect(name).not.toContain('@');
  });

  test("truncates names longer than 64 chars", () => {
    const bridge = new MCPToolBridge();
    const longName = 'a'.repeat(100);
    const result = bridge.buildFunctionTools([{
      serverName: 'srv',
      qualifiedName: longName,
      tool: { name: 'test', description: 'Test' },
    }]);
    expect(result.functionTools[0].function.name.length).toBeLessThanOrEqual(64);
  });
});

// ==========================================
// T3: buildFunctionTools Conversion
// ==========================================

describe("T3: buildFunctionTools Conversion", () => {
  test("converts all discovered tools to function tools", () => {
    const bridge = new MCPToolBridge();
    const result = bridge.buildFunctionTools(SAMPLE_TOOLS);
    expect(result.functionTools).toHaveLength(3);
  });

  test("each function tool has correct type", () => {
    const bridge = new MCPToolBridge();
    const result = bridge.buildFunctionTools(SAMPLE_TOOLS);
    for (const ft of result.functionTools) {
      expect(ft.type).toBe('function');
      expect(ft.function).toBeDefined();
      expect(ft.function.name).toBeTruthy();
      expect(ft.function.description).toBeTruthy();
    }
  });

  test("toolMap maps sanitized name → DiscoveredTool", () => {
    const bridge = new MCPToolBridge();
    const result = bridge.buildFunctionTools(SAMPLE_TOOLS);
    expect(result.toolMap.size).toBe(3);
  });

  test("empty input returns empty arrays", () => {
    const bridge = new MCPToolBridge();
    const result = bridge.buildFunctionTools([]);
    expect(result.functionTools).toHaveLength(0);
    expect(result.toolMap.size).toBe(0);
  });
});

// ==========================================
// T4: executeToolCall Routing
// ==========================================

describe("T4: executeToolCall Routing", () => {
  test("routes to correct server and tool", async () => {
    const bridge = new MCPToolBridge();
    bridge.registerServer('test-server', createMockServer({ greet: 'Hello World' }));

    const bridged = bridge.buildFunctionTools(SAMPLE_TOOLS);
    const sanitizedName = bridged.functionTools.find(f => f.function.description === 'Say hello')?.function.name;

    const result = await bridge.executeToolCall(sanitizedName!, { name: 'Alice' }, bridged.toolMap);
    expect(result.success).toBe(true);
    expect(result.serverName).toBe('test-server');
    expect(result.result).toBe('Hello World');
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  test("returns error for unknown tool name", async () => {
    const bridge = new MCPToolBridge();
    const result = await bridge.executeToolCall('nonexistent', {}, new Map());
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test("returns error when server not registered", async () => {
    const bridge = new MCPToolBridge();
    // Do NOT register 'test-server'
    const bridged = bridge.buildFunctionTools(SAMPLE_TOOLS);
    const sanitizedName = bridged.functionTools[0].function.name;

    const result = await bridge.executeToolCall(sanitizedName, {}, bridged.toolMap);
    expect(result.success).toBe(false);
    expect(result.error).toContain('not available');
  });

  test("handles server exceptions gracefully", async () => {
    const bridge = new MCPToolBridge();
    bridge.registerServer('test-server', createErrorServer());

    const bridged = bridge.buildFunctionTools(SAMPLE_TOOLS);
    const sanitizedName = bridged.functionTools[0].function.name;

    const result = await bridge.executeToolCall(sanitizedName, {}, bridged.toolMap);
    expect(result.success).toBe(false);
    expect(result.error).toContain('exploded');
  });
});

// ==========================================
// T5: executeBatch
// ==========================================

describe("T5: executeBatch Parallel Execution", () => {
  test("executes multiple tool calls in parallel", async () => {
    const bridge = new MCPToolBridge();
    bridge.registerServer('test-server', createMockServer());

    const bridged = bridge.buildFunctionTools(SAMPLE_TOOLS.filter(t => t.serverName === 'test-server'));

    const calls = bridged.functionTools.map(ft => ({
      toolName: ft.function.name,
      args: { input: 'test' },
    }));

    const results = await bridge.executeBatch(calls, bridged.toolMap);
    expect(results).toHaveLength(2);
    for (const r of results) {
      expect(r.success).toBe(true);
    }
  });

  test("empty batch returns empty results", async () => {
    const bridge = new MCPToolBridge();
    const results = await bridge.executeBatch([], new Map());
    expect(results).toHaveLength(0);
  });
});

// ==========================================
// T6: Server Filtering
// ==========================================

describe("T6: Server Filtering in buildFunctionTools", () => {
  test("filters by server name", () => {
    const bridge = new MCPToolBridge();
    const result = bridge.buildFunctionTools(SAMPLE_TOOLS, ['test-server']);
    expect(result.functionTools).toHaveLength(2);
  });

  test("returns all when no filter", () => {
    const bridge = new MCPToolBridge();
    const result = bridge.buildFunctionTools(SAMPLE_TOOLS);
    expect(result.functionTools).toHaveLength(3);
  });

  test("returns empty when filter matches nothing", () => {
    const bridge = new MCPToolBridge();
    const result = bridge.buildFunctionTools(SAMPLE_TOOLS, ['nonexistent-server']);
    expect(result.functionTools).toHaveLength(0);
  });
});

// ==========================================
// T7: toNativeMCPTools
// ==========================================

describe("T7: toNativeMCPTools", () => {
  test("returns empty array for empty input", () => {
    const bridge = new MCPToolBridge();
    const result = bridge.toNativeMCPTools([]);
    expect(result).toHaveLength(0);
  });

  test("wraps servers into MCP tool schema", () => {
    const bridge = new MCPToolBridge();
    const result = bridge.toNativeMCPTools([
      { url: 'http://localhost:3080/mcp', label: 'yyc3' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('mcp');
    expect(result[0].mcp.servers).toHaveLength(1);
    expect(result[0].mcp.servers[0].label).toBe('yyc3');
  });
});
