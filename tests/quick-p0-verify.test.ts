/**
 * file: quick-p0-verify.test.ts
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
 * YYC³ AI Family - 快速 P0 验证测试
 * 
 * 最小化测试套件，快速验证 P0 类型去重是否成功
 */

import { describe, test, expect } from 'bun:test';

describe('Quick P0 Verification', () => {
  test('P0-1: BigModelMessage can be imported from canonical source', () => {
    const message: import('../types/bigmodel-hooks').BigModelMessage = {
      role: 'user',
      content: 'Test',
    };
    expect(message.role).toBe('user');
  });

  test('P0-2: MCPOrchestrateRequest can be imported from both sources', () => {
    // Direct from canonical
    const direct: import('../types/mcp-orchestrator').MCPOrchestrateRequest = {
      prompt: 'test',
    };
    
    // Via re-export from backend-contract
    const reExport: import('../types/backend-contract').MCPOrchestrateRequest = {
      prompt: 'test',
    };
    
    expect(direct.prompt).toBe(reExport.prompt);
  });

  test('P0-3: WS_TerminalExec can be imported from both sources', () => {
    // Direct from canonical
    const direct: import('../types/terminal').WS_TerminalExec = {
      type: 'terminal_exec',
      payload: { command: 'test' },
      requestId: 'r1',
    };
    
    // Via re-export from backend-contract
    const reExport: import('../types/backend-contract').WS_TerminalExec = {
      type: 'terminal_exec',
      payload: { command: 'test' },
      requestId: 'r1',
    };
    
    expect(direct.type).toBe(reExport.type);
  });

  test('All modules load without circular dependency errors', async () => {
    const [hooks, mcp, terminal, contract] = await Promise.all([
      import('../types/bigmodel-hooks'),
      import('../types/mcp-orchestrator'),
      import('../types/terminal'),
      import('../types/backend-contract'),
    ]);

    expect(hooks).toBeDefined();
    expect(mcp).toBeDefined();
    expect(terminal).toBeDefined();
    expect(contract).toBeDefined();
  });
});
