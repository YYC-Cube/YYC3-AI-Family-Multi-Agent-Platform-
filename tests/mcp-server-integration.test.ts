/**
 * file: mcp-server-integration.test.ts
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
 * YYC³ AI Family — MCP Server Integration Test Suite
 *
 * Tests for:
 *   T1: MCPServer initialization (tools, resources, prompts)
 *   T2: Tool listing and discovery
 *   T3: Tool execution (all 7 built-in tools)
 *   T4: Resource reading
 *   T5: Prompt generation
 *   T6: JSON-RPC handler (initialize, tools/list, tools/call, ping)
 *   T7: Orchestrator status
 *   T8: External server registration
 *   T9: Unknown tool/method error handling
 *
 * Run: bun test tests/mcp-server-integration.test.ts
 */

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void | Promise<void>): void;
declare function expect(value: any): any;

// ==========================================
// T1: MCPServer Initialization
// ==========================================

describe("T1: MCPServer Initialization", () => {
  test("getMCPServer returns singleton", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server1 = getMCPServer();
    const server2 = getMCPServer();
    expect(server1).toBe(server2);
  });

  test("server has built-in tools", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const tools = server.listTools();
    expect(tools.length).toBeGreaterThanOrEqual(7);
  });

  test("server has built-in resources", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const resources = server.listResources();
    expect(resources.length).toBeGreaterThanOrEqual(2);
  });

  test("server has built-in prompts", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const prompts = server.listPrompts();
    expect(prompts.length).toBeGreaterThanOrEqual(3);
  });
});

// ==========================================
// T2: Tool Listing
// ==========================================

describe("T2: Tool Listing & Discovery", () => {
  test("lists all 7 core family tools", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const tools = server.listTools();
    const names = tools.map(t => t.name);
    expect(names).toContain('family_dispatch_signal');
    expect(names).toContain('family_query_member');
    expect(names).toContain('family_agent_call');
    expect(names).toContain('family_get_topology');
    expect(names).toContain('family_search_knowledge');
    expect(names).toContain('workflow_trigger');
    expect(names).toContain('code_analyze');
  });

  test("each tool has name, description, inputSchema", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const tools = server.listTools();
    for (const tool of tools) {
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
    }
  });
});

// ==========================================
// T3: Tool Execution
// ==========================================

describe("T3: Built-in Tool Execution", () => {
  test("family_query_member returns member info", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.callTool('family_query_member', { roleId: 'AI_ARCHITECT' });
    expect(result.isError).toBeFalsy();
    expect(result.content.length).toBeGreaterThan(0);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.roleId).toBe('AI_ARCHITECT');
    expect(parsed.name).toBe('智源架构师');
  });

  test("family_get_topology returns topology info", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.callTool('family_get_topology', {});
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.topology).toBe('star');
    expect(parsed.hub).toBe('CENTRAL_PULSE');
  });

  test("family_dispatch_signal returns confirmation", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.callTool('family_dispatch_signal', {
      receiverId: 'ALL',
      content: 'Test signal',
      signalType: 'SYNC',
      priority: 'NORMAL',
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('ALL');
  });

  test("family_agent_call returns routing info", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.callTool('family_agent_call', { roleId: 'CODE_ARTISAN', prompt: 'Hello' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('CODE_ARTISAN');
  });

  test("family_search_knowledge returns search status", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.callTool('family_search_knowledge', { query: 'architecture' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('architecture');
  });

  test("workflow_trigger returns trigger status", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.callTool('workflow_trigger', { workflowId: 'creation_pipeline' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('creation_pipeline');
  });

  test("code_analyze returns analysis status", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.callTool('code_analyze', { path: 'src/index.ts', analysisType: 'all' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('src/index.ts');
  });
});

// ==========================================
// T4: Resource Reading
// ==========================================

describe("T4: Resource Reading", () => {
  test("family://members returns member list", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.readResource('family://members');
    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe('application/json');
    const parsed = JSON.parse(result.contents[0].text);
    expect(parsed.total).toBe(7);
    expect(parsed.members.length).toBe(7);
  });

  test("family://topology returns topology info", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.readResource('family://topology');
    const parsed = JSON.parse(result.contents[0].text);
    expect(parsed.topology).toBe('star');
  });

  test("unknown resource returns not found", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.readResource('family://nonexistent');
    expect(result.contents[0].text).toContain('not found');
  });
});

// ==========================================
// T5: Prompt Generation
// ==========================================

describe("T5: Prompt Generation", () => {
  test("family_system_prompt returns messages", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.getPrompt('family_system_prompt', { roleId: 'AI_ARCHITECT' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toContain('AI_ARCHITECT');
  });

  test("peer_dialogue_prompt includes topic", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.getPrompt('peer_dialogue_prompt', { topic: 'Security Audit' });
    expect(result.messages[0].content).toContain('Security Audit');
  });

  test("code_review_prompt includes code", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.getPrompt('code_review_prompt', { code: 'const x = 1;', language: 'typescript' });
    expect(result.messages[0].content).toContain('const x = 1;');
  });

  test("unknown prompt returns error message", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.getPrompt('nonexistent', {});
    expect(result.messages[0].content).toContain('Unknown');
  });
});

// ==========================================
// T6: JSON-RPC Handler
// ==========================================

describe("T6: JSON-RPC Handler", () => {
  test("initialize returns server info", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.handleJsonRpc({ id: 1, method: 'initialize' });
    const res = result.result as { protocolVersion: string; serverInfo: { name: string } };
    expect(res.protocolVersion).toBe('2024-11-05');
    expect(res.serverInfo.name).toBeTruthy();
  });

  test("tools/list returns tools array", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.handleJsonRpc({ id: 2, method: 'tools/list' });
    const res = result.result as { tools: unknown[] };
    expect(res.tools.length).toBeGreaterThanOrEqual(7);
  });

  test("tools/call executes tool", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.handleJsonRpc({
      id: 3,
      method: 'tools/call',
      params: { name: 'family_get_topology', arguments: {} },
    });
    const res = result.result as { isError: boolean };
    expect(res.isError).toBeFalsy();
  });

  test("ping returns empty result", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.handleJsonRpc({ id: 4, method: 'ping' });
    expect(result.result).toEqual({});
  });

  test("unknown method returns error", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.handleJsonRpc({ id: 5, method: 'nonexistent/method' });
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe(-32601);
  });
});

// ==========================================
// T7: Orchestrator Status
// ==========================================

describe("T7: Orchestrator Status", () => {
  test("getOrchestratorStatus returns status object", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const status = server.getOrchestratorStatus();
    expect(status).toHaveProperty('enabled');
    expect(status).toHaveProperty('sdk');
    expect(status).toHaveProperty('provider');
    expect(status).toHaveProperty('model');
    expect(status).toHaveProperty('tools');
    expect(typeof status.enabled).toBe('boolean');
    expect(status.sdk).toContain('BigModelSDK');
  });
});

// ==========================================
// T8: External Server Registration
// ==========================================

describe("T8: External Server Registration", () => {
  test("registerExternalServer does not throw", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    server.registerExternalServer('test-external', {
      async callTool(name: string) {
        return { content: `External: ${name}`, isError: false };
      },
    });
    // Should not throw
    expect(true).toBe(true);
  });
});

// ==========================================
// T9: Error Handling
// ==========================================

describe("T9: Error Handling", () => {
  test("calling unknown tool returns error", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    const result = await server.callTool('nonexistent_tool', {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown tool');
  });

  test("tool registration with handler works", async () => {
    const { getMCPServer } = await import('../bun-server/mcp-server');
    const server = getMCPServer();
    server.registerTool(
      {
        name: 'test_registered_tool',
        description: 'A test tool',
        inputSchema: { type: 'object', properties: {}, required: [] },
      },
      async () => ({ content: [{ type: 'text' as const, text: 'Registered tool works' }] })
    );

    const result = await server.callTool('test_registered_tool', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('Registered tool works');
  });
});
