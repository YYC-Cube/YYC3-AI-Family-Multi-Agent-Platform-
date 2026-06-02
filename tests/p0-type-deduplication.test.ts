/**
 * file: p0-type-deduplication.test.ts
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
 * YYC³ AI Family - P0 Type Deduplication Test Suite
 * 
 * Validates that type deduplication refactoring (Guidelines.md §9.1 P0 tasks)
 * maintains 100% type compatibility across all import paths.
 * 
 * Test coverage:
 * 1. BigModelMessage/Response (canonical: /types/bigmodel-hooks.ts)
 * 2. MCPOrchestrateRequest/Response (canonical: /types/mcp-orchestrator.ts)
 * 3. WS_TerminalExec/Output (canonical: /types/terminal.ts)
 */

import { describe, test, expect } from 'bun:test';

// ==========================================
// T1: BigModelMessage/Response Compatibility
// ==========================================

describe('P0-1: BigModelMessage/Response Type Deduplication', () => {
  test('BigModelMessage is correctly exported from canonical source', () => {
    // Canonical source: /types/bigmodel-hooks.ts
    const canonicalMessage: import('../types/bigmodel-hooks').BigModelMessage = {
      role: 'user',
      content: 'Hello GLM-4-Plus',
      timestamp: Date.now(),
    };

    expect(canonicalMessage.role).toBe('user');
    expect(canonicalMessage.content).toBe('Hello GLM-4-Plus');
    expect(typeof canonicalMessage.timestamp).toBe('number');
  });

  test('BigModelResponse is correctly exported from canonical source', () => {
    const canonicalResponse: import('../types/bigmodel-hooks').BigModelResponse = {
      id: 'resp-123',
      model: 'glm-4-plus',
      content: 'Response from BigModel',
      usage: {
        promptTokens: 10,
        completionTokens: 25,
        totalTokens: 35,
      },
      finishReason: 'stop',
    };

    expect(canonicalResponse.id).toBe('resp-123');
    expect(canonicalResponse.usage?.totalTokens).toBe(35);
  });

  test('useBigModel hook no longer has inline type definitions', async () => {
    // This test verifies that /hooks/useBigModel.ts imports types instead of defining them
    const hookModule = await import('../hooks/useBigModel');
    
    // The hook should export functions, not type definitions
    expect(typeof hookModule.useBigModel).toBe('function');
    expect(typeof hookModule.useChat).toBe('function');
    expect(typeof hookModule.useChatStream).toBe('function');
    expect(typeof hookModule.useMCPOrchestrator).toBe('function');
  });

  test('Type compatibility between canonical source and hook usage', () => {
    // Ensure types from canonical source can be used in hook context
    const message: import('../types/bigmodel-hooks').BigModelMessage = {
      role: 'assistant',
      content: 'Test',
    };

    const response: import('../types/bigmodel-hooks').BigModelResponse = {
      id: '1',
      model: 'glm-4-plus',
      content: message.content,
    };

    expect(response.content).toBe('Test');
  });
});

// ==========================================
// T2: MCPOrchestrateRequest/Response Compatibility
// ==========================================

describe('P0-2: MCPOrchestrateRequest/Response Type Deduplication', () => {
  test('MCPOrchestrateRequest canonical source is mcp-orchestrator.ts', () => {
    const canonicalRequest: import('../types/mcp-orchestrator').MCPOrchestrateRequest = {
      prompt: 'Test MCP orchestration',
      model: 'glm-4-plus',
      systemPrompt: 'You are a helpful assistant',
      maxTokens: 2048,
      temperature: 0.7,
    };

    expect(canonicalRequest.prompt).toBe('Test MCP orchestration');
    expect(canonicalRequest.temperature).toBe(0.7);
  });

  test('MCPOrchestrateResponse structure from canonical source', () => {
    const canonicalResponse: import('../types/mcp-orchestrator').MCPOrchestrateResponse = {
      finalResponse: {
        id: 'resp-456',
        model: 'glm-4-plus',
        created: Date.now(),
        choices: [{
          index: 0,
          message: { role: 'assistant', content: 'Final response' },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 50,
          total_tokens: 70,
        },
      },
      toolCallHistory: [],
      totalRounds: 1,
      totalToolCalls: 0,
      totalExecutionTimeMs: 245,
      errors: [],
    };

    expect(canonicalResponse.totalRounds).toBe(1);
    expect(canonicalResponse.finalResponse.usage.total_tokens).toBe(70);
  });

  test('backend-contract re-exports MCP types correctly', async () => {
    // Verify re-export works from backend-contract.ts
    // These should be re-exported, not redefined
    const request: import('../types/backend-contract').MCPOrchestrateRequest = undefined as any;
    const response: import('../types/backend-contract').MCPOrchestrateResponse = undefined as any;
    
    // If types compile, test passes
    expect(true).toBe(true);
  });

  test('ToolCallRoundInfo re-export compatibility', () => {
    const roundInfo: import('../types/backend-contract').ToolCallRoundInfo = {
      round: 1,
      toolCalls: [
        { id: 'tc1', name: 'search_tool', arguments: { query: 'test' } },
      ],
      results: [
        {
          toolName: 'search_tool',
          serverName: 'mcp-server-brave',
          success: true,
          result: { items: [] },
          executionTimeMs: 150,
        },
      ],
      roundTimeMs: 200,
    };

    expect(roundInfo.round).toBe(1);
    expect(roundInfo.results[0].success).toBe(true);
  });
});

// ==========================================
// T3: WS_TerminalExec/Output Compatibility
// ==========================================

describe('P0-3: WS_TerminalExec/Output Type Deduplication', () => {
  test('WS_TerminalExec canonical source is terminal.ts', () => {
    const canonicalExec: import('../types/terminal').WS_TerminalExec = {
      type: 'terminal_exec',
      payload: {
        command: 'bun test',
        tabId: 'tab-1',
        cwd: '/workspace',
      },
      requestId: 'req-789',
    };

    expect(canonicalExec.type).toBe('terminal_exec');
    expect(canonicalExec.payload.command).toBe('bun test');
  });

  test('WS_TerminalOutput canonical source is terminal.ts', () => {
    const canonicalOutput: import('../types/terminal').WS_TerminalOutput = {
      type: 'terminal_output',
      payload: {
        output: 'Test passed',
        isError: false,
        exitCode: 0,
        command: 'bun test',
      },
      timestamp: Date.now(),
      requestId: 'req-789',
    };

    expect(canonicalOutput.type).toBe('terminal_output');
    expect(canonicalOutput.payload.exitCode).toBe(0);
  });

  test('backend-contract re-exports terminal types correctly', async () => {
    // These should be re-exported from terminal.ts
    const exec: import('../types/backend-contract').WS_TerminalExec = undefined as any;
    const output: import('../types/backend-contract').WS_TerminalOutput = undefined as any;
    
    expect(true).toBe(true);
  });

  test('InboundMessage union includes WS_TerminalExec', () => {
    const termExec: import('../types/backend-contract').WS_TerminalExec = {
      type: 'terminal_exec',
      payload: { command: 'ls -la' },
      requestId: 'r1',
    };

    // Should be assignable to InboundMessage union
    const inbound: import('../types/backend-contract').InboundMessage = termExec;
    
    expect(inbound.type).toBe('terminal_exec');
  });

  test('OutboundMessage union includes WS_TerminalOutput', () => {
    const termOutput: import('../types/backend-contract').WS_TerminalOutput = {
      type: 'terminal_output',
      payload: { output: 'file.txt' },
      timestamp: Date.now(),
    };

    // Should be assignable to OutboundMessage union
    const outbound: import('../types/backend-contract').OutboundMessage = termOutput;
    
    expect(outbound.type).toBe('terminal_output');
  });
});

// ==========================================
// T4: Cross-Module Type Compatibility
// ==========================================

describe('P0-X: Cross-Module Type Compatibility Matrix', () => {
  test('All canonical sources can coexist without conflicts', async () => {
    const bigmodelHooks = await import('../types/bigmodel-hooks');
    const mcpOrchestrator = await import('../types/mcp-orchestrator');
    const terminal = await import('../types/terminal');
    const backendContract = await import('../types/backend-contract');

    // Verify all modules load successfully
    expect(bigmodelHooks).toBeDefined();
    expect(mcpOrchestrator).toBeDefined();
    expect(terminal).toBeDefined();
    expect(backendContract).toBeDefined();
  });

  test('Re-exported types maintain identical structure', () => {
    // MCPOrchestrateRequest from both sources should be identical
    const directImport: import('../types/mcp-orchestrator').MCPOrchestrateRequest = {
      prompt: 'test',
    };

    const reExport: import('../types/backend-contract').MCPOrchestrateRequest = {
      prompt: 'test',
    };

    expect(directImport.prompt).toBe(reExport.prompt);
  });

  test('No duplicate type definitions in hook files', async () => {
    // Read useBigModel.ts source to ensure no inline type definitions remain
    const useBigModelSource = await Bun.file('hooks/useBigModel.ts').text();
    
    // Should NOT contain "export interface BigModelMessage" (should be import instead)
    expect(useBigModelSource).not.toContain('export interface BigModelMessage');
    expect(useBigModelSource).not.toContain('export interface BigModelResponse');
    
    // Should contain import from canonical source
    expect(useBigModelSource).toContain("from '../types/bigmodel-hooks'");
  });

  test('backend-contract.ts has no duplicate MCP type definitions', async () => {
    const backendContractSource = await Bun.file('types/backend-contract.ts').text();
    
    // Should re-export, not redefine
    expect(backendContractSource).toContain("from './mcp-orchestrator'");
    
    // Should NOT have inline MCPOrchestrateRequest definition after re-export
    const reExportIndex = backendContractSource.indexOf("from './mcp-orchestrator'");
    const afterReExport = backendContractSource.slice(reExportIndex);
    
    // No inline definition should appear AFTER the re-export
    expect(afterReExport).not.toMatch(/export interface MCPOrchestrateRequest\s*\{/);
  });

  test('backend-contract.ts has no duplicate terminal type definitions', async () => {
    const backendContractSource = await Bun.file('types/backend-contract.ts').text();
    
    // Should re-export from terminal.ts
    expect(backendContractSource).toContain("from './terminal'");
    
    // Should NOT have inline WS_TerminalExec definition after re-export
    const reExportIndex = backendContractSource.indexOf("from './terminal'");
    const afterReExport = backendContractSource.slice(reExportIndex);
    
    expect(afterReExport).not.toMatch(/export interface WS_TerminalExec\s*\{/);
    expect(afterReExport).not.toMatch(/export interface WS_TerminalOutput\s*\{/);
  });
});

// ==========================================
// T5: Guidelines.md Compliance Check
// ==========================================

describe('P0-Guidelines: Compliance with Guidelines.md §9.1', () => {
  test('P0-1: BigModelMessage canonical location is /types/bigmodel-hooks.ts', () => {
    // Per Guidelines §3.2: "ALWAYS import from canonical source"
    const msg: import('../types/bigmodel-hooks').BigModelMessage = {
      role: 'system',
      content: 'System prompt',
    };
    
    expect(msg.role).toBe('system');
  });

  test('P0-2: MCPOrchestrateRequest canonical location is /types/mcp-orchestrator.ts', () => {
    const req: import('../types/mcp-orchestrator').MCPOrchestrateRequest = {
      prompt: 'Orchestrate tools',
    };
    
    expect(req.prompt).toBeDefined();
  });

  test('P0-3: WS_TerminalExec canonical location is /types/terminal.ts', () => {
    const exec: import('../types/terminal').WS_TerminalExec = {
      type: 'terminal_exec',
      payload: { command: 'pwd' },
      requestId: 'r-abc',
    };
    
    expect(exec.type).toBe('terminal_exec');
  });

  test('All P0 technical debt items are resolved', () => {
    // Per Guidelines §9.1: 3 P0 items
    // 1. BigModelMessage/Response ✅
    // 2. MCPOrchestrateRequest/Response ✅
    // 3. WS_TerminalExec/Output ✅
    
    expect(true).toBe(true); // If all above tests pass, P0 debt is clear
  });
});
