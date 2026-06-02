/**
 * file: MCPToolBridge.ts
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
// BigModelSDK/mcp - MCP Tool Bridge (from YYC-Cube/Family repo)
// Converts local MCP tools → BigModel API function tools format
// Implements MCP Server ↔ BigModel ChatCompletion bidirectional bridge
// ============================================================

import type { FunctionToolSchema, MCPToolSchema } from '../tools/types';

/** Discovered tool from MCP server */
export interface DiscoveredTool {
  serverName: string;
  qualifiedName: string;
  tool: {
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
  };
}

/** Converted tool set for BigModel API */
export interface BridgedToolSet {
  functionTools: FunctionToolSchema[];
  mcpTools: MCPToolSchema[];
  toolMap: Map<string, DiscoveredTool>;
}

/** Result of a single tool execution */
export interface ToolExecutionResult {
  toolName: string;
  serverName: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTimeMs: number;
}

/** Interface for any MCP server that can execute tools */
export interface MCPExecutableServer {
  callTool(name: string, args: Record<string, unknown>): Promise<{ content: any; isError?: boolean }>;
}

export class MCPToolBridge {
  private servers: Map<string, MCPExecutableServer> = new Map();

  /** Register an MCP server as a tool executor */
  registerServer(name: string, server: MCPExecutableServer): void {
    this.servers.set(name, server);
  }

  /** Unregister a server */
  unregisterServer(name: string): void {
    this.servers.delete(name);
  }

  /**
   * Convert discovered MCP tools → BigModel function tool format
   * Used to inject into ChatCompletionRequest.tools
   */
  buildFunctionTools(discoveredTools: DiscoveredTool[], serverFilter?: string[]): BridgedToolSet {
    const filtered = serverFilter
      ? discoveredTools.filter(dt => serverFilter.includes(dt.serverName))
      : discoveredTools;

    const functionTools: FunctionToolSchema[] = [];
    const toolMap = new Map<string, DiscoveredTool>();

    for (const dt of filtered) {
      const sanitizedName = this.sanitizeToolName(dt.qualifiedName);
      const funcTool: FunctionToolSchema = {
        type: 'function',
        function: {
          name: sanitizedName,
          description: dt.tool.description || `Tool ${dt.tool.name} from ${dt.serverName}`,
          parameters: dt.tool.inputSchema || { type: 'object', properties: {} },
        },
      };
      functionTools.push(funcTool);
      toolMap.set(sanitizedName, dt);
    }

    return { functionTools, mcpTools: [], toolMap };
  }

  /**
   * Build BigModel native MCP tools (server URL passthrough)
   * Used when BigModel API itself can reach MCP servers
   */
  toNativeMCPTools(servers: Array<{
    url: string;
    label: string;
    approvalPrompt?: 'never' | 'always' | 'auto';
    allowedTools?: string[];
  }>): MCPToolSchema[] {
    if (servers.length === 0) return [];
    return [{
      type: 'mcp',
      mcp: {
        servers: servers.map(s => ({
          url: s.url,
          label: s.label,
          approval_prompt: s.approvalPrompt || 'auto',
          allowed_tools: s.allowedTools,
        })),
      },
    }];
  }

  /**
   * Execute a tool call returned by BigModel API
   * Routes to the correct MCP server and returns the result
   */
  async executeToolCall(
    toolName: string,
    args: Record<string, unknown>,
    toolMap: Map<string, DiscoveredTool>,
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    const discoveredTool = toolMap.get(toolName);
    if (!discoveredTool) {
      return {
        toolName,
        serverName: 'unknown',
        success: false,
        error: `Tool '${toolName}' not found in bridge tool map`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    const server = this.servers.get(discoveredTool.serverName);
    if (!server) {
      return {
        toolName,
        serverName: discoveredTool.serverName,
        success: false,
        error: `MCP server '${discoveredTool.serverName}' not available`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    try {
      const response = await server.callTool(discoveredTool.tool.name, args);
      return {
        toolName,
        serverName: discoveredTool.serverName,
        success: !response.isError,
        result: response.content,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        toolName,
        serverName: discoveredTool.serverName,
        success: false,
        error: err?.message || String(err),
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Batch execute multiple tool calls (parallel)
   */
  async executeBatch(
    calls: Array<{ toolName: string; args: Record<string, unknown> }>,
    toolMap: Map<string, DiscoveredTool>,
  ): Promise<ToolExecutionResult[]> {
    return Promise.all(
      calls.map(call => this.executeToolCall(call.toolName, call.args, toolMap))
    );
  }

  /** Sanitize tool name — BigModel function name only allows a-z, A-Z, 0-9, _, - */
  private sanitizeToolName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  }

  /** Get registered server names */
  listServers(): string[] {
    return Array.from(this.servers.keys());
  }
}

export default MCPToolBridge;
