/**
 * file: mcp-server.ts
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
 * YYC³ AI Family - MCP Server (模型上下文协议服务)
 * 
 * Implements Model Context Protocol (MCP) for IDE / Client integration.
 * Exposes family capabilities as discoverable Tools, Resources, and Prompts.
 * 
 * Transport modes:
 *   - stdio:     被 IDE (Cursor/VS Code) 作为子进程启动
 *   - sse:       HTTP SSE 长连接（浏览器端兼容）
 *   - websocket: 复用主 WS:3080 端口
 * 
 * Spec: https://modelcontextprotocol.io/
 */

import { mcp as mcpConfig, llm, ide } from "./config";
import {
  createBigModelChat,
  MCPToolBridge,
  MCPOrchestrator,
  BIGMODEL_SDK_VERSION,
} from "./bigmodel-sdk";
import type {
  DiscoveredTool,
  ToolExecutionResult,
  MCPOrchestratorConfig,
  OrchestratorResult,
  OrchestratorStreamChunk,
  MCPExecutableServer,
} from "./bigmodel-sdk";

// ==========================================
// JSON-RPC Types
// ==========================================
interface JsonRpcRequest {
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ==========================================
// MCP Protocol Types (Simplified)
// ==========================================
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface MCPResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface MCPPromptDefinition {
  name: string;
  description: string;
  arguments?: { name: string; description: string; required?: boolean }[];
}

export interface MCPToolCallResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

// ==========================================
// Built-in Tool Definitions
// ==========================================
const FAMILY_TOOLS: MCPToolDefinition[] = [
  {
    name: "family_dispatch_signal",
    description: "Dispatch a signal to a YYC³ AI Family member. Triggers the neural lightning network communication protocol.",
    inputSchema: {
      type: "object",
      properties: {
        receiverId: { type: "string", description: "Target member RoleId", enum: ["PRODUCT_MANAGER", "CHIEF_ARCHITECT", "AI_ARCHITECT", "CODE_ARTISAN", "SENTINEL", "CENTRAL_PULSE", "COLLABORATOR", "ALL"] },
        content: { type: "string", description: "Signal content (natural language message)" },
        signalType: { type: "string", description: "Signal classification", enum: ["COMMAND", "THOUGHT", "SYNC", "ALERT", "PEER_DIALOGUE"] },
        priority: { type: "string", description: "Signal priority", enum: ["LOW", "NORMAL", "HIGH", "CRITICAL"] },
      },
      required: ["receiverId", "content"],
    },
  },
  {
    name: "family_query_member",
    description: "Query the status and capabilities of a YYC³ AI Family member. Returns mood, activity, online status, and persona info.",
    inputSchema: {
      type: "object",
      properties: {
        roleId: { type: "string", description: "Member RoleId to query", enum: ["PRODUCT_MANAGER", "CHIEF_ARCHITECT", "AI_ARCHITECT", "CODE_ARTISAN", "SENTINEL", "CENTRAL_PULSE", "COLLABORATOR"] },
      },
      required: ["roleId"],
    },
  },
  {
    name: "family_agent_call",
    description: "Invoke an AI Family member for a conversation. Uses the 4-layer persona SystemPrompt and routes through the configured LLM provider.",
    inputSchema: {
      type: "object",
      properties: {
        roleId: { type: "string", description: "Which family member to talk to", enum: ["PRODUCT_MANAGER", "CHIEF_ARCHITECT", "AI_ARCHITECT", "CODE_ARTISAN", "SENTINEL", "CENTRAL_PULSE", "COLLABORATOR"] },
        prompt: { type: "string", description: "Your message to the family member" },
        systemPrompt: { type: "string", description: "Optional custom system prompt (overrides default 4-layer prompt)" },
      },
      required: ["roleId", "prompt"],
    },
  },
  {
    name: "family_get_topology",
    description: "Get the current network topology of the YYC³ AI Family. Shows all members, their connections, device mappings, and signal flow.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "family_search_knowledge",
    description: "Search the YYC³ knowledge base using semantic similarity. Returns relevant document chunks with source references.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query (natural language)" },
        topK: { type: "string", description: "Number of results to return (default: 5)" },
        filter: { type: "string", description: "Optional source filter (e.g., 'docs', 'code', 'family')" },
      },
      required: ["query"],
    },
  },
  {
    name: "workflow_trigger",
    description: "Trigger a YYC³ workflow pipeline. Can start the Creation Seven-Step pipeline or custom workflows.",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: { type: "string", description: "Workflow identifier", enum: ["creation_pipeline", "security_scan", "code_review", "deploy"] },
        params: { type: "string", description: "JSON string of workflow parameters" },
      },
      required: ["workflowId"],
    },
  },
  {
    name: "code_analyze",
    description: "Analyze a code file or directory. Returns type errors, lint issues, complexity metrics, and improvement suggestions.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File or directory path relative to project root" },
        analysisType: { type: "string", description: "Type of analysis", enum: ["typecheck", "lint", "complexity", "security", "all"] },
      },
      required: ["path"],
    },
  },
];

// ==========================================
// Built-in Resources
// ==========================================
const FAMILY_RESOURCES: MCPResourceDefinition[] = [
  { uri: "family://members", name: "Family Members", description: "List of all 7 YYC³ AI Family members with their current state", mimeType: "application/json" },
  { uri: "family://signals/recent", name: "Recent Signals", description: "Last 50 signals in the neural lightning network", mimeType: "application/json" },
  { uri: "family://topology", name: "Network Topology", description: "Current family network topology with device mappings", mimeType: "application/json" },
  { uri: "knowledge://docs", name: "Knowledge Documents", description: "Index of all documents in the knowledge base", mimeType: "application/json" },
];

// ==========================================
// Built-in Prompt Templates
// ==========================================
const FAMILY_PROMPTS: MCPPromptDefinition[] = [
  {
    name: "family_system_prompt",
    description: "Generate the 4-layer persona SystemPrompt for a family member. Layer1: Base persona, Layer2: Five-dimension context, Layer3: Dialogue chain, Layer4: Response constraints.",
    arguments: [
      { name: "roleId", description: "Target family member RoleId", required: true },
      { name: "context", description: "Optional conversation context (JSON string)" },
    ],
  },
  {
    name: "peer_dialogue_prompt",
    description: "Generate a peer dialogue chain prompt for multi-agent collaboration.",
    arguments: [
      { name: "topic", description: "Dialogue topic", required: true },
      { name: "participants", description: "Comma-separated RoleIds of participating agents" },
    ],
  },
  {
    name: "code_review_prompt",
    description: "Generate a code review prompt optimized for the Code Artisan and Sentinel agents.",
    arguments: [
      { name: "code", description: "Code to review", required: true },
      { name: "language", description: "Programming language" },
      { name: "focus", description: "Review focus: security | performance | quality | all" },
    ],
  },
];

// ==========================================
// MCP Server Class
// ==========================================
export class MCPServer {
  private tools: Map<string, MCPToolDefinition> = new Map();
  private resources: Map<string, MCPResourceDefinition> = new Map();
  private prompts: Map<string, MCPPromptDefinition> = new Map();
  private toolHandlers: Map<string, (args: Record<string, unknown>) => Promise<MCPToolCallResult>> = new Map();

  // ── BigModel MCP Orchestration Engine ──
  private toolBridge: MCPToolBridge;
  private orchestrator: MCPOrchestrator | null = null;

  constructor() {
    // Initialize MCP Tool Bridge — this adapts MCP server tools ↔ BigModel API
    this.toolBridge = new MCPToolBridge();

    // Register self as an MCP-executable server so BigModel can call our tools
    const selfServer: MCPExecutableServer = {
      callTool: async (name: string, args: Record<string, unknown>) => {
        const result = await this.callTool(name, args);
        return {
          content: result.content.map(c => c.text).join('\n'),
          isError: result.isError,
        };
      },
    };
    this.toolBridge.registerServer('yyc3-family', selfServer);

    // Register built-in tools
    for (const tool of FAMILY_TOOLS) {
      this.tools.set(tool.name, tool);
    }
    // Register built-in resources
    for (const resource of FAMILY_RESOURCES) {
      this.resources.set(resource.uri, resource);
    }
    // Register built-in prompts
    for (const prompt of FAMILY_PROMPTS) {
      this.prompts.set(prompt.name, prompt);
    }

    // Register default tool handlers
    this.registerDefaultHandlers();

    // Initialize BigModel Orchestrator if configured
    this.initOrchestrator();

    console.log(`[MCP] Server initialized: ${this.tools.size} tools, ${this.resources.size} resources, ${this.prompts.size} prompts`);
    if (this.orchestrator) {
      console.log(`[MCP] BigModel MCPOrchestrator v${BIGMODEL_SDK_VERSION} active — tool_call loop enabled`);
    }
  }

  // ── BigModel Orchestrator Init ──
  private initOrchestrator(): void {
    if (!llm.bigmodel.configured) {
      console.log('[MCP] BigModel not configured — Orchestrator disabled. Set BIGMODEL_API_KEY to enable.');
      return;
    }

    const chatTool = createBigModelChat(
      llm.bigmodel.apiKey,
      llm.bigmodel.baseUrl.replace(/\/paas\/v4\/?$/, '/'),
      llm.requestTimeout,
    );

    this.orchestrator = new MCPOrchestrator(chatTool, this.toolBridge, {
      maxToolCallRounds: 10,
      toolTimeoutMs: llm.requestTimeout,
      parallelExecution: true,
      errorStrategy: 'skip',
      maxRetries: 2,
      onRoundStart: (round, toolCount) => {
        console.log(`[MCP:Orchestrator] Round ${round}: ${toolCount} tool call(s) pending`);
      },
      onToolCall: (round, toolName, _args) => {
        console.log(`[MCP:Orchestrator] Round ${round}: calling tool '${toolName}'`);
      },
      onToolResult: (round, result) => {
        const status = result.success ? '✓' : '✗';
        console.log(`[MCP:Orchestrator] Round ${round}: ${status} ${result.toolName} (${result.executionTimeMs}ms)`);
      },
    });

    // Register all built-in tools as discovered tools for the orchestrator
    this.syncDiscoveredTools();
  }

  /** Sync current MCP tools to the orchestrator's discovered tool registry */
  private syncDiscoveredTools(): void {
    if (!this.orchestrator) return;

    const discovered: DiscoveredTool[] = Array.from(this.tools.values()).map(tool => ({
      serverName: 'yyc3-family',
      qualifiedName: `yyc3-family__${tool.name}`,
      tool: {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
    }));

    this.orchestrator.setDiscoveredTools(discovered);
  }

  // ── Public: Run BigModel Orchestrated Call ──
  /**
   * Execute a prompt through BigModel with full MCP tool_call loop.
   * Flow: user prompt → GLM → tool_calls → execute on MCP → inject results → loop → final answer
   */
  async runOrchestrated(
    prompt: string,
    options?: {
      model?: string;
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    },
  ): Promise<OrchestratorResult | { error: string }> {
    if (!this.orchestrator) {
      return { error: 'BigModel Orchestrator not initialized. Set BIGMODEL_API_KEY.' };
    }

    this.syncDiscoveredTools(); // Ensure latest tools are synced

    return this.orchestrator.run({
      model: options?.model || llm.bigmodel.model,
      max_tokens: options?.maxTokens || llm.bigmodel.maxTokens,
      temperature: options?.temperature ?? llm.temperature,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
    });
  }

  /**
   * Stream an orchestrated call — yields chunks progressively
   */
  async *runOrchestratedStream(
    prompt: string,
    options?: {
      model?: string;
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    },
  ): AsyncGenerator<OrchestratorStreamChunk, void, unknown> {
    if (!this.orchestrator) {
      yield { type: 'text', content: 'Error: BigModel Orchestrator not initialized. Set BIGMODEL_API_KEY.' };
      yield { type: 'done' };
      return;
    }

    this.syncDiscoveredTools();

    yield* this.orchestrator.runStream({
      model: options?.model || llm.bigmodel.model,
      max_tokens: options?.maxTokens || llm.bigmodel.maxTokens,
      temperature: options?.temperature ?? llm.temperature,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
    });
  }

  /** Get orchestrator status */
  getOrchestratorStatus(): { enabled: boolean; sdk: string; provider: string; model: string; tools: number } {
    return {
      enabled: !!this.orchestrator,
      sdk: `BigModelSDK v${BIGMODEL_SDK_VERSION}`,
      provider: 'bigmodel',
      model: llm.bigmodel.model,
      tools: this.tools.size,
    };
  }

  /** Register an external MCP server for the orchestrator bridge */
  registerExternalServer(name: string, server: MCPExecutableServer): void {
    this.toolBridge.registerServer(name, server);
    console.log(`[MCP] External server '${name}' registered to bridge`);
  }

  // ---- Tool Registration ----
  registerTool(definition: MCPToolDefinition, handler: (args: Record<string, any>) => Promise<MCPToolCallResult>): void {
    this.tools.set(definition.name, definition);
    this.toolHandlers.set(definition.name, handler);
    console.log(`[MCP] Tool registered: ${definition.name}`);
  }

  // ---- Discovery Handlers ----
  listTools(): MCPToolDefinition[] {
    if (!mcpConfig.tools.enabled) return [];
    return Array.from(this.tools.values());
  }

  listResources(): MCPResourceDefinition[] {
    if (!mcpConfig.resources.enabled) return [];
    return Array.from(this.resources.values());
  }

  listPrompts(): MCPPromptDefinition[] {
    if (!mcpConfig.prompts.enabled) return [];
    return Array.from(this.prompts.values());
  }

  // ---- Tool Execution ----
  async callTool(name: string, args: Record<string, any>): Promise<MCPToolCallResult> {
    const handler = this.toolHandlers.get(name);
    if (!handler) {
      return {
        content: [{ type: "text", text: `Error: Unknown tool '${name}'. Available: ${Array.from(this.tools.keys()).join(", ")}` }],
        isError: true,
      };
    }

    try {
      return await handler(args);
    } catch (err: unknown) {
      const error = err as Error;
      return {
        content: [{ type: "text", text: `Error executing tool '${name}': ${error.message}` }],
        isError: true,
      };
    }
  }

  // ---- Resource Reading ----
  async readResource(uri: string): Promise<{ contents: { uri: string; mimeType: string; text: string }[] }> {
    switch (uri) {
      case "family://members":
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              members: ["PRODUCT_MANAGER", "CHIEF_ARCHITECT", "AI_ARCHITECT", "CODE_ARTISAN", "SENTINEL", "CENTRAL_PULSE", "COLLABORATOR"].map(id => ({
                roleId: id,
                name: { PRODUCT_MANAGER: "沫言总", CHIEF_ARCHITECT: "人类导师", AI_ARCHITECT: "智源架构师", CODE_ARTISAN: "织码者", SENTINEL: "守望者", CENTRAL_PULSE: "中枢", COLLABORATOR: "联结者" }[id],
                isOnline: true,
              })),
              total: 7,
            }, null, 2),
          }],
        };

      case "family://topology":
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              topology: "star",
              hub: "CENTRAL_PULSE",
              connections: 7,
              signalProtocol: "FamilySignal v1.0.0",
            }, null, 2),
          }],
        };

      default:
        return { contents: [{ uri, mimeType: "text/plain", text: `Resource not found: ${uri}` }] };
    }
  }

  // ---- Prompt Generation ----
  async getPrompt(name: string, args: Record<string, string>): Promise<{ messages: { role: string; content: string }[] }> {
    switch (name) {
      case "family_system_prompt":
        return {
          messages: [{
            role: "user",
            content: `Generate a 4-layer SystemPrompt for family member ${args.roleId}.\n\nLayer 1 — Base Persona: Use the agent-personas.ts template\nLayer 2 — Five Dimensions: Map to ROLE_DIMENSION_MAP\nLayer 3 — Context: ${args.context || "No additional context"}\nLayer 4 — Constraints: Professional tone, structured format, 200-500 chars`,
          }],
        };

      case "peer_dialogue_prompt":
        return {
          messages: [{
            role: "user",
            content: `Orchestrate a peer dialogue on topic: "${args.topic}"\nParticipants: ${args.participants || "AI_ARCHITECT, CODE_ARTISAN, SENTINEL"}\nEach agent should respond in character using their persona traits.`,
          }],
        };

      case "code_review_prompt":
        return {
          messages: [{
            role: "user",
            content: `Review the following ${args.language || "TypeScript"} code with focus on ${args.focus || "all"} aspects:\n\n\`\`\`${args.language || "typescript"}\n${args.code}\n\`\`\`\n\nProvide: 1) Issues found, 2) Security concerns, 3) Performance notes, 4) Improvement suggestions.`,
          }],
        };

      default:
        return { messages: [{ role: "user", content: `Unknown prompt: ${name}` }] };
    }
  }

  // ---- Default Tool Handlers ----
  private registerDefaultHandlers(): void {
    this.toolHandlers.set("family_query_member", async (args) => {
      const roleId = typeof args.roleId === 'string' ? args.roleId : String(args.roleId);
      const names: Record<string, string> = {
        PRODUCT_MANAGER: "沫言总", CHIEF_ARCHITECT: "人类导师", AI_ARCHITECT: "智源架构师",
        CODE_ARTISAN: "织码者", SENTINEL: "守望者", CENTRAL_PULSE: "中枢", COLLABORATOR: "联结者",
      };
      const providerModels: Record<string, string> = {
        anthropic: llm.anthropic.model,
        openai: llm.openai.model,
        ollama: llm.ollama.model,
        deepseek: llm.deepseek.model,
        qwen: llm.qwen.model,
        bigmodel: llm.bigmodel.model,
      };
      const primaryProvider: string = llm.primary;
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            roleId,
            name: names[roleId] || "Unknown",
            isOnline: true,
            mood: "SERENE",
            llmProvider: primaryProvider,
            model: providerModels[primaryProvider] || llm.anthropic.model,
          }, null, 2),
        }],
      };
    });

    this.toolHandlers.set("family_get_topology", async () => ({
      content: [{
        type: "text",
        text: JSON.stringify({
          topology: "star",
          hub: "CENTRAL_PULSE",
          members: 7,
          protocol: "FamilySignal v1.0.0",
          channels: ["family_signals"],
        }, null, 2),
      }],
    }));

    this.toolHandlers.set("family_dispatch_signal", async (args) => {
      const content = typeof args.content === 'string' ? args.content : '';
      return {
        content: [{
          type: "text",
          text: `Signal dispatched to ${args.receiverId}: "${content.substring(0, 100)}" [${args.signalType || "COMMAND"}/${args.priority || "NORMAL"}]`,
        }],
      };
    });

    this.toolHandlers.set("family_agent_call", async (args) => ({
      content: [{
        type: "text",
        text: `[MCP] Agent call routed to ${args.roleId} via ${llm.primary}. Use the WS agent_call protocol for full 4-layer SystemPrompt support.`,
      }],
    }));

    this.toolHandlers.set("family_search_knowledge", async (args) => ({
      content: [{
        type: "text",
        text: `[MCP] Knowledge search: "${args.query}" (top ${args.topK || 5}). Knowledge base is ${mcpConfig.enabled ? "enabled" : "disabled"}.`,
      }],
    }));

    this.toolHandlers.set("workflow_trigger", async (args) => ({
      content: [{
        type: "text",
        text: `[MCP] Workflow '${args.workflowId}' triggered. Params: ${args.params || "{}"}`,
      }],
    }));

    this.toolHandlers.set("code_analyze", async (args) => ({
      content: [{
        type: "text",
        text: `[MCP] Code analysis for '${args.path}' (${args.analysisType || "all"}). IDE bridge is ${ide.enabled ? "enabled" : "disabled"}.`,
      }],
    }));
  }

  // ---- JSON-RPC Handler (for stdio/SSE/WS transport) ----
  async handleJsonRpc(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { id, method, params } = request;

    switch (method) {
      case "initialize":
        return {
          jsonrpc: "2.0", id,
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: { name: mcpConfig.serverName, version: "1.0.0" },
            capabilities: {
              tools: mcpConfig.tools.enabled ? { listChanged: true } : undefined,
              resources: mcpConfig.resources.enabled ? { subscribe: true, listChanged: true } : undefined,
              prompts: mcpConfig.prompts.enabled ? { listChanged: true } : undefined,
            },
          },
        };

      case "tools/list":
        return { jsonrpc: "2.0", id, result: { tools: this.listTools() } };

      case "tools/call":
        const toolParams = params as { name?: string; arguments?: Record<string, unknown> };
        const toolResult = await this.callTool(toolParams.name || "", toolParams.arguments || {});
        return { jsonrpc: "2.0", id, result: toolResult };

      case "resources/list":
        return { jsonrpc: "2.0", id, result: { resources: this.listResources() } };

      case "resources/read":
        const resourceParams = params as { uri?: string };
        const resourceResult = await this.readResource(resourceParams.uri || "");
        return { jsonrpc: "2.0", id, result: resourceResult };

      case "prompts/list":
        return { jsonrpc: "2.0", id, result: { prompts: this.listPrompts() } };

      case "prompts/get":
        const promptParams = params as { name?: string; arguments?: Record<string, unknown> };
        const promptArgs = promptParams.arguments as Record<string, string> || {};
        const promptResult = await this.getPrompt(promptParams.name || "", promptArgs);
        return { jsonrpc: "2.0", id, result: promptResult };

      case "ping":
        return { jsonrpc: "2.0", id, result: {} };

      default:
        return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
    }
  }
}

// Singleton
let _mcpServer: MCPServer | null = null;
export function getMCPServer(): MCPServer {
  if (!_mcpServer) {
    _mcpServer = new MCPServer();
  }
  return _mcpServer;
}