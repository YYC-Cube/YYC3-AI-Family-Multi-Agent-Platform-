/**
 * file: index.ts
 * description: Bun 后端服务器主入口 · 集成六大子系统的全功能运行时
 * author: YanYuCloudCube Team
 * version: v2.0.0
 * created: 2026-02-26
 * updated: 2026-04-04
 * status: active
 * tags: [server],[backend],[bun],[websocket]
 *
 * brief: Bun 运行时后端服务器，集成所有六大子系统
 *
 * details:
 * - §2 LLM Multi-Provider: 多模型支持 (OpenAI, Anthropic, Ollama, DeepSeek, Qwen, BigModel)
 * - §3 MCP Protocol Server: Model Context Protocol 工具桥接
 * - §4 Workflow Engine: 工作流编排与执行
 * - §5 Plugin System: 插件生态管理
 * - §6 Knowledge Base/RAG: 知识库与检索增强生成
 * - §7 IDE Bridge: IDE 集成桥接
 * - WebSocket 实时通信
 * - Redis 缓存层
 * - PostgreSQL 数据持久化
 *
 * dependencies: Bun, WebSocket, PostgreSQL, Redis
 * exports: Backend Server
 * notes: 需要配置 .env 文件中的 API Keys
 *
 * @example
 * ```bash
 * # 启动服务器
 * cp .env.example .env   # 填入至少 BIGMODEL_API_KEY
 * bun install
 * bun run dev
 * ```
 */

import {
  auth as authConfig,
  database as dbConfig,
  ide as ideConfig,
  kb as kbConfig,
  llm as llmConfig, mcp as mcpConfig,
  monitor as monitorConfig,
  plugin as pluginConfig,
  printConfigSummary,
  redis as redisConfig,
  roleModels as roleModelsConfig,
  server as serverConfig,
  workflow as wfConfig,
} from "./config";
import { getCRDTEngine, type CRDTWebSocket, type CollabInboundMessage, type CollabOutboundMessage } from "./crdt-engine";
import { db } from "./db";
import { getIDEBridge } from "./ide-bridge";
import { getEmbeddingStatus, getKnowledgeBase } from "./knowledge-base";
import { checkProviderHealth, handleAgentCall, handleAgentREST, type AgentCallPayload } from "./llm-proxy";
import { getMCPServer } from "./mcp-server";
import { getPluginManager, type PluginSignal } from "./plugin-manager";
import type { CachedSignal } from "./redis-client";
import { cache } from "./redis-client";
import { getWorkflowEngine } from "./workflow-engine";

// ==========================================
// Server State
// ==========================================
const SERVER_VERSION = "2.0.0";
const startTime = Date.now();

interface BackendCommand {
  type: "dispatch_signal" | "update_member" | "get_members" | "ping" | "subscribe" | "visual_analysis" | "agent_call";
  payload: Record<string, unknown>;
  requestId: string;
}

interface BackendMessage {
  type: "signal" | "heartbeat" | "member_update" | "system_event" | "error" | "pong" | "agent_response" | "message_new";
  payload: Record<string, unknown>;
  timestamp: number;
  requestId?: string;
}

interface MemberState {
  roleId: string;
  mood: string;
  isOnline: boolean;
  currentActivity: string;
  lastHeartbeat: number;
}

interface ProjectFile {
  path: string;
  language: string;
  content: string;
  lastModified: number;
  version: number;
}

interface WebSocketWithMeta {
  userId?: string;
  sessionId?: string;
  subscribedTopics?: Set<string>;
  send: (data: string) => void;
  readyState: number;
}

interface CollabResponse extends CollabOutboundMessage {
  _targetWs?: WebSocketWithMeta;
  _broadcast?: boolean;
  _excludeWs?: WebSocketWithMeta;
}

interface SignalPayload {
  id?: string;
  timestamp?: number;
  type?: string;
  senderId?: string;
  receiverId?: string;
  content?: string | Record<string, unknown>;
  mood?: string;
  priority?: string;
  modelSource?: string;
  dialogueChainId?: string;
  deviceId?: string;
  payload?: { content?: string | Record<string, unknown> };
  metadata?: { version?: string };
  channel?: string;
  roleId?: string;
  updates?: Record<string, unknown>;
}

const members: Map<string, MemberState> = new Map([
  ["PRODUCT_MANAGER", { roleId: "PRODUCT_MANAGER", mood: "SERENE", isOnline: true, currentActivity: "等待战略指令...", lastHeartbeat: Date.now() }],
  ["CHIEF_ARCHITECT", { roleId: "CHIEF_ARCHITECT", mood: "SERENE", isOnline: true, currentActivity: "全域战略监控...", lastHeartbeat: Date.now() }],
  ["AI_ARCHITECT", { roleId: "AI_ARCHITECT", mood: "FOCUSED", isOnline: true, currentActivity: "推演微服务拓扑...", lastHeartbeat: Date.now() }],
  ["CODE_ARTISAN", { roleId: "CODE_ARTISAN", mood: "EXCITED", isOnline: true, currentActivity: "编织 React 组件...", lastHeartbeat: Date.now() }],
  ["SENTINEL", { roleId: "SENTINEL", mood: "LOVING", isOnline: true, currentActivity: "扫描安全边界...", lastHeartbeat: Date.now() }],
  ["CENTRAL_PULSE", { roleId: "CENTRAL_PULSE", mood: "SERENE", isOnline: true, currentActivity: "同步数据流...", lastHeartbeat: Date.now() }],
  ["COLLABORATOR", { roleId: "COLLABORATOR", mood: "SERENE", isOnline: true, currentActivity: "跨平台协议同步...", lastHeartbeat: Date.now() }],
]);

const connectedClients = new Set<WebSocketWithMeta>();
const subscriptions = new Map<string, Set<WebSocketWithMeta>>();

// Step 8a: 项目文件存储（内存）
const projectFiles = new Map<string, Map<string, ProjectFile>>();

// ==========================================
// Initialize Subsystems
// ==========================================
const mcpServer = mcpConfig.enabled ? getMCPServer() : null;
const workflowEngine = wfConfig.enabled ? getWorkflowEngine() : null;
const pluginManager = pluginConfig.enabled ? getPluginManager() : null;
const knowledgeBase = kbConfig.enabled ? getKnowledgeBase() : null;
const ideBridge = ideConfig.enabled ? getIDEBridge() : null;
const crdtEngine = getCRDTEngine();

// Initialize Database & Cache (async, non-blocking for server startup)
(async () => {
  try {
    await db.init();
    console.log("[STARTUP] Database initialized");

    // Hydrate in-memory members from DB
    const dbMembers = await db.members.findAll();
    if (dbMembers && dbMembers.length > 0) {
      for (const m of dbMembers) {
        members.set(m.role_id, {
          roleId: m.role_id,
          mood: m.mood || "SERENE",
          isOnline: m.is_online === 1,
          currentActivity: m.current_activity || "",
          lastHeartbeat: Date.now(),
        });
      }
      console.log(`[STARTUP] Loaded ${dbMembers.length} members from DB`);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.warn(`[STARTUP] Database init failed (running in-memory only): ${error.message}`);
  }

  try {
    await cache.init();
    console.log(`[STARTUP] Cache initialized (${cache.mode} mode)`);
  } catch (err: unknown) {
    const error = err as Error;
    console.warn(`[STARTUP] Cache init failed: ${error.message}`);
  }

  // Periodic DB maintenance (every 30 minutes)
  setInterval(async () => {
    try { await db.maintenance(); } catch {
      // Ignore maintenance errors - will retry on next interval
    }
  }, 30 * 60 * 1000);
})();

// ==========================================
// Utility
// ==========================================
function buildMessage(type: BackendMessage["type"], payload: Record<string, unknown>, requestId?: string): string {
  return JSON.stringify({
    type, payload, timestamp: Date.now(),
    ...(requestId ? { requestId } : {}),
  } as BackendMessage);
}

function broadcast(channel: string, message: string): void {
  const subs = subscriptions.get(channel);
  if (subs) {
    for (const ws of subs) {
      try { ws.send(message); } catch {
        // Ignore send errors - client may have disconnected
      }
    }
  }
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": authConfig.cors.origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data, null, serverConfig.isDev ? 2 : 0), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

// ==========================================
// WebSocket Message Handler
// ==========================================
interface WebSocketClient {
  send: (data: string) => void;
  close: () => void;
}

async function handleWSMessage(ws: WebSocketClient, raw: string): Promise<void> {
  let cmd: BackendCommand;
  try { cmd = JSON.parse(raw); } catch {
    ws.send(buildMessage("error", { message: "Invalid JSON", code: "PARSE_ERROR" }));
    return;
  }

  const { type, payload, requestId } = cmd;

  // Plugin pre-processing hook
  let processedPayload: SignalPayload = payload as SignalPayload;
  if (pluginManager && (type === "dispatch_signal" || type === "agent_call")) {
    processedPayload = await pluginManager.runSignalBefore(payload as unknown as PluginSignal) as unknown as SignalPayload;
  }

  switch (type) {
    case "ping": {
      ws.send(buildMessage("pong", {
        timestamp: processedPayload?.timestamp || Date.now(),
        serverTime: Date.now(),
      }, requestId));
      break;
    }

    case "subscribe": {
      const channel = (processedPayload?.channel as string) || "family_signals";
      if (!subscriptions.has(channel)) subscriptions.set(channel, new Set());
      subscriptions.get(channel)!.add(ws as unknown as WebSocketWithMeta);
      console.log(`[WS] Subscribed: ${channel} (${subscriptions.get(channel)!.size} clients)`);
      ws.send(buildMessage("system_event", {
        event: "subscribed",
        data: {
          channel, membersCount: members.size, serverVersion: SERVER_VERSION,
          subsystems: {
            mcp: mcpConfig.enabled,
            workflow: wfConfig.enabled,
            plugin: pluginConfig.enabled,
            knowledgeBase: kbConfig.enabled,
            ide: ideConfig.enabled,
          },
        },
      }));
      break;
    }

    case "dispatch_signal": {
      console.log(`[WS] Signal: ${processedPayload?.senderId} -> ${processedPayload?.receiverId} | ${processedPayload?.type}`);

      // Step 7b: CRDT 协同编辑消息路由
      let isCRDTMessage = false;
      try {
        const content = processedPayload?.payload?.content || processedPayload?.content;
        if (typeof content === 'string' && content.includes('"collab:')) {
          const collabMsg = JSON.parse(content) as CollabInboundMessage;
          if (collabMsg.type?.startsWith('collab:')) {
            isCRDTMessage = true;
            const responses = crdtEngine.handleMessage(ws as unknown as CRDTWebSocket, collabMsg);
            for (const resp of responses) {
              const respStr = buildMessage("signal", {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'SYNC',
                senderId: 'CENTRAL_PULSE',
                receiverId: 'USER',
                payload: {
                  content: JSON.stringify(resp),
                  mood: 'FOCUSED',
                  priority: resp.type === 'collab:operation' ? 'HIGH' : 'NORMAL',
                  modelSource: 'REAL',
                },
                metadata: { version: '1.0.0' },
              });

              const collabResp = resp as CollabResponse;
              if (collabResp._targetWs) {
                try { collabResp._targetWs.send(respStr); } catch { }
              } else if (collabResp._broadcast) {
                const excludeWs = collabResp._excludeWs;
                const subs = subscriptions.get("family_signals");
                if (subs) {
                  for (const client of subs) {
                    if (client !== excludeWs) {
                      try { client.send(respStr); } catch { }
                    }
                  }
                }
              } else {
                broadcast("family_signals", respStr);
              }
            }
          }
        }
      } catch {
        // Not a CRDT message or parse error, continue with normal signal handling
      }

      // Normal signal broadcast (also broadcast CRDT signals for backward compat)
      broadcast("family_signals", buildMessage("signal", processedPayload as unknown as Record<string, unknown>));
      // Persist signal to DB + Cache (non-blocking)
      if (db.initialized && processedPayload) {
        db.signals.insert({
          id: processedPayload.id,
          timestamp: processedPayload.timestamp || Date.now(),
          type: processedPayload.type || "UNKNOWN",
          senderId: processedPayload.senderId || "SYSTEM",
          receiverId: processedPayload.receiverId || "ALL",
          content: typeof processedPayload.content === "string" ? processedPayload.content : JSON.stringify(processedPayload.content || ""),
          mood: processedPayload.mood,
          priority: processedPayload.priority,
          modelSource: processedPayload.modelSource,
          dialogueChainId: processedPayload.dialogueChainId,
          deviceId: processedPayload.deviceId,
        }).catch(() => { });
        // Update signal count for sender
        if (processedPayload.senderId) {
          db.members.incrementSignalCount(processedPayload.senderId).catch(() => { });
        }
      }
      if (cache.initialized && processedPayload) {
        cache.signals.push(processedPayload as unknown as CachedSignal).catch(() => { });
      }
      // Plugin post-processing
      if (pluginManager) await pluginManager.runSignalAfter(processedPayload as PluginSignal, { success: true });
      break;
    }

    case "update_member": {
      const { roleId, updates } = processedPayload || {};
      if (roleId && members.has(roleId)) {
        const member = members.get(roleId)!;
        Object.assign(member, updates);
        member.lastHeartbeat = Date.now();
        broadcast("family_signals", buildMessage("member_update", { roleId, updates }));
      } else {
        ws.send(buildMessage("error", { message: `Unknown member: ${roleId}`, code: "MEMBER_NOT_FOUND", requestId }));
      }
      break;
    }

    case "get_members": {
      ws.send(buildMessage("system_event", {
        event: "members_list",
        data: { members: Array.from(members.values()) },
      }, requestId));
      break;
    }

    case "agent_call": {
      const agentPayload = processedPayload as unknown as AgentCallPayload;
      console.log(`[WS] Agent call: ${agentPayload.roleId} | prompt: "${agentPayload.prompt.substring(0, 60)}..."`);

      const member = members.get(agentPayload.roleId);
      if (member) {
        member.currentActivity = `[LIVE] 处理请求中...`;
        member.lastHeartbeat = Date.now();
      }

      try {
        // Plugin: pre-process agent call
        let finalPrompt = agentPayload.prompt;
        let finalSystemPrompt = agentPayload.context?.systemPrompt || "";
        if (pluginManager) {
          const modified = await pluginManager.runAgentCallBefore(agentPayload.roleId, finalPrompt, finalSystemPrompt);
          finalPrompt = modified.prompt;
          finalSystemPrompt = modified.systemPrompt;
        }

        // Knowledge Base: augment prompt with RAG context
        if (knowledgeBase) {
          finalPrompt = await knowledgeBase.augmentPrompt(finalPrompt);
        }

        const result = await handleAgentCall({
          ...agentPayload,
          prompt: finalPrompt,
          context: { ...agentPayload.context, systemPrompt: finalSystemPrompt },
        });

        // Plugin: post-process agent response
        let finalContent = result.content;
        if (pluginManager && !result.error) {
          finalContent = await pluginManager.runAgentCallAfter(agentPayload.roleId, finalContent);
        }

        if (member) {
          member.currentActivity = result.error
            ? `[ERROR] ${result.error.substring(0, 30)}`
            : `[LIVE] 回复 ${new Date().toLocaleTimeString()}`;
        }

        ws.send(buildMessage("agent_response", {
          content: finalContent,
          roleId: agentPayload.roleId,
          model: result.model,
          provider: result.provider,
          latency: result.latency,
          tokenUsage: result.tokenUsage,
          fallback: result.fallback,
          ...(result.error ? { error: result.error } : {}),
        }, requestId));

        // Persist agent call log to DB (non-blocking)
        if (db.initialized) {
          db.agentLogs.insert({
            requestId: requestId || `ws-${Date.now()}`,
            roleId: agentPayload.roleId,
            model: result.model || "unknown",
            promptPreview: agentPayload.prompt,
            responsePreview: finalContent,
            inputTokens: result.tokenUsage?.inputTokens,
            outputTokens: result.tokenUsage?.outputTokens,
            latencyMs: result.latency || 0,
            success: !result.error,
            errorMessage: result.error,
          }).catch(() => { });
          // Update member activity in DB
          if (member) {
            db.members.setActivity(agentPayload.roleId, member.currentActivity).catch(() => { });
          }
        }

      } catch (err: unknown) {
        const error = err as Error;
        ws.send(buildMessage("agent_response", {
          content: "", roleId: agentPayload.roleId, model: "error", latency: 0, error: error.message,
        }, requestId));
      }
      break;
    }

    case "visual_analysis": {
      ws.send(buildMessage("error", { message: "visual_analysis not yet implemented", code: "NOT_IMPLEMENTED", requestId }));
      break;
    }

    default: {
      ws.send(buildMessage("error", { message: `Unknown command: ${type}`, code: "UNKNOWN_COMMAND", requestId }));
    }
  }
}

// ==========================================
// HTTP Route Handler
// ==========================================
async function handleHTTP(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

  // ======== Core API ========

  if (path === "/api/health" && method === "GET") {
    const providerHealth = await checkProviderHealth();
    return jsonResponse({
      status: "ok",
      version: SERVER_VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        websocket: true,
        redis: redisConfig.configured,
        postgresql: dbConfig.configured,
        sqlite: db.initialized,
        cache: cache.initialized,
      },
      subsystems: {
        mcp: mcpConfig.enabled,
        workflow: wfConfig.enabled,
        plugin: pluginConfig.enabled,
        knowledgeBase: kbConfig.enabled,
        ide: ideConfig.enabled,
      },
      llm: {
        primary: llmConfig.primary,
        fallback: llmConfig.fallback,
        providers: providerHealth,
        ratio: llmConfig.ratio.spec,
      },
      connectedClients: connectedClients.size,
      persistence: {
        db: db.initialized ? await db.getStats() : { initialized: false },
        cache: cache.initialized ? cache.getStats() : { initialized: false },
      },
      timestamp: Date.now(),
    });
  }

  if (path === "/api/config" && method === "GET") {
    // Return non-sensitive config summary
    return jsonResponse({
      server: { port: serverConfig.port, name: serverConfig.name, env: serverConfig.nodeEnv },
      llm: {
        primary: llmConfig.primary, fallback: llmConfig.fallback, ratio: llmConfig.ratio.spec,
        anthropic: { configured: llmConfig.anthropic.configured, model: llmConfig.anthropic.model },
        openai: { configured: llmConfig.openai.configured, model: llmConfig.openai.model },
        ollama: { enabled: llmConfig.ollama.enabled, model: llmConfig.ollama.model },
        deepseek: { configured: llmConfig.deepseek.configured, model: llmConfig.deepseek.model },
        qwen: { configured: llmConfig.qwen.configured, model: llmConfig.qwen.model },
        bigmodel: { configured: llmConfig.bigmodel.configured, model: llmConfig.bigmodel.model },
        roleModels: roleModelsConfig,
      },
      mcp: { enabled: mcpConfig.enabled, transport: mcpConfig.transport },
      workflow: { enabled: wfConfig.enabled, maxConcurrent: wfConfig.maxConcurrent },
      plugin: { enabled: pluginConfig.enabled, count: pluginManager?.listPlugins().length || 0 },
      kb: { enabled: kbConfig.enabled, vectorDb: kbConfig.vectorDb },
      ide: { enabled: ideConfig.enabled, lint: ideConfig.lint.engine },
    });
  }

  // ======== Family Members ========

  if (path === "/api/family/members" && method === "GET") {
    return jsonResponse({ members: Array.from(members.values()) });
  }

  const memberMatch = path.match(/^\/api\/family\/members\/([A-Z_]+)$/);
  if (memberMatch && method === "PATCH") {
    const roleId = memberMatch[1];
    if (!members.has(roleId)) return jsonResponse({ error: "Member not found" }, 404);
    const body = await req.json();
    const member = members.get(roleId)!;
    Object.assign(member, body);
    member.lastHeartbeat = Date.now();
    broadcast("family_signals", buildMessage("member_update", { roleId, updates: body }));
    return jsonResponse({ ok: true, member });
  }

  // ======== Agent (LLM) ========

  const agentMatch = path.match(/^\/api\/agent\/([a-z-]+)$/);
  if (agentMatch && method === "POST") {
    const slugToRole: Record<string, string> = {
      "navigator": "NAVIGATOR",
      "thinker": "THINKER",
      "prophet": "PROPHET",
      "bole": "BOLE",
      "meta-oracle": "META_ORACLE",
      "guardian": "GUARDIAN",
      "master": "MASTER",
      "creative": "CREATIVE",
    };
    const roleId = slugToRole[agentMatch[1]];
    if (!roleId) return jsonResponse({ error: `Unknown agent: ${agentMatch[1]}` }, 404);

    const body = await req.json();
    const result = await handleAgentREST(roleId, body);
    return jsonResponse(result, result.error ? 500 : 200);
  }

  if (path === "/api/llm/providers" && method === "GET") {
    return jsonResponse(await checkProviderHealth());
  }

  // ======== MCP ========

  if (mcpServer && path === "/api/mcp/tools" && method === "GET") {
    return jsonResponse({ tools: mcpServer.listTools() });
  }

  if (mcpServer && path === "/api/mcp/resources" && method === "GET") {
    return jsonResponse({ resources: mcpServer.listResources() });
  }

  if (mcpServer && path === "/api/mcp/prompts" && method === "GET") {
    return jsonResponse({ prompts: mcpServer.listPrompts() });
  }

  if (mcpServer && path === "/api/mcp/tools/call" && method === "POST") {
    const { name, arguments: args } = await req.json();
    const result = await mcpServer.callTool(name, args || {});
    return jsonResponse(result);
  }

  if (mcpServer && path === "/api/mcp/resources/read" && method === "POST") {
    const { uri } = await req.json();
    const result = await mcpServer.readResource(uri);
    return jsonResponse(result);
  }

  if (mcpServer && path === "/api/mcp/rpc" && method === "POST") {
    const rpcRequest = await req.json();
    const result = await mcpServer.handleJsonRpc(rpcRequest);
    return jsonResponse(result);
  }

  // ======== Family Messages (§1.5 私信系统) ========

  // GET /api/family/messages/threads?participant=USER — 列出当前用户的所有会话
  if (path === "/api/family/messages/threads" && method === "GET") {
    const url = new URL(req.url);
    const participant = url.searchParams.get("participant") || "USER";
    const threads = await db.messages.findThreadsForParticipant(participant);
    return jsonResponse({ threads });
  }

  // GET /api/family/messages?threadId=... — 获取某会话的消息历史
  if (path === "/api/family/messages" && method === "GET") {
    const url = new URL(req.url);
    const threadId = url.searchParams.get("threadId");
    if (!threadId) return jsonResponse({ error: "threadId required" }, 400);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
    const messages = await db.messages.findByThread(threadId, limit);
    return jsonResponse({ messages });
  }

  // POST /api/family/messages — 发送一条消息（1v1 或群发）
  if (path === "/api/family/messages" && method === "POST") {
    const body = await req.json() as {
      senderId: string;
      recipientIds: string[];     // 1 个 = 1v1，多个 = 群发
      content: string;
      messageType?: string;
      metadata?: Record<string, unknown>;
    };
    if (!body.senderId || !Array.isArray(body.recipientIds) || body.recipientIds.length === 0 || !body.content) {
      return jsonResponse({ error: "senderId, recipientIds[], content required" }, 400);
    }
    const isBroadcast = body.recipientIds.length > 1;
    const participants = [body.senderId, ...body.recipientIds];
    const threadId = db.messages.buildThreadId(participants, isBroadcast);
    await db.messages.ensureThread(threadId, isBroadcast ? 'broadcast' : 'direct', participants);

    const ids: string[] = [];
    for (const recipientId of body.recipientIds) {
      const id = await db.messages.insert({
        threadId,
        senderId: body.senderId,
        recipientId,
        content: body.content,
        messageType: body.messageType || 'text',
        metadata: body.metadata || {},
        isBroadcast,
      });
      ids.push(id);
    }

    broadcast("family_messages", buildMessage("message_new", {
      threadId,
      senderId: body.senderId,
      recipientIds: body.recipientIds,
      content: body.content,
      isBroadcast,
    }));

    return jsonResponse({ ok: true, ids, threadId });
  }

  // POST /api/family/messages/read — 标记已读
  if (path === "/api/family/messages/read" && method === "POST") {
    const { threadId, recipientId } = await req.json() as { threadId: string; recipientId: string };
    if (!threadId || !recipientId) return jsonResponse({ error: "threadId, recipientId required" }, 400);
    const updated = await db.messages.markRead(threadId, recipientId);
    return jsonResponse({ ok: true, updated });
  }

  // GET /api/family/messages/search?q=... — 关键词搜索
  if (path === "/api/family/messages/search" && method === "GET") {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    if (!q.trim()) return jsonResponse({ messages: [] });
    const messages = await db.messages.search(q.trim(), 30);
    return jsonResponse({ messages, query: q });
  }

  // GET /api/family/messages/unread?recipientId=... — 未读计数
  if (path === "/api/family/messages/unread" && method === "GET") {
    const url = new URL(req.url);
    const recipientId = url.searchParams.get("recipientId");
    if (!recipientId) return jsonResponse({ error: "recipientId required" }, 400);
    const count = await db.messages.unreadCount(recipientId);
    return jsonResponse({ count });
  }

  // ======== Workflow ========

  if (workflowEngine && path === "/api/workflow/list" && method === "GET") {
    return jsonResponse({ workflows: workflowEngine.listWorkflows() });
  }

  if (workflowEngine && path === "/api/workflow/instances" && method === "GET") {
    return jsonResponse({ instances: workflowEngine.listInstances() });
  }

  if (workflowEngine && path === "/api/workflow/trigger" && method === "POST") {
    const { workflowId, params } = await req.json();
    const instance = await workflowEngine.trigger(workflowId, params);
    return instance ? jsonResponse({ ok: true, instance }) : jsonResponse({ error: "Failed to trigger workflow" }, 400);
  }

  if (workflowEngine && path.startsWith("/api/workflow/approve/") && method === "POST") {
    const instanceId = path.split("/").pop()!;
    const ok = await workflowEngine.approve(instanceId);
    return jsonResponse({ ok });
  }

  if (workflowEngine && path.startsWith("/api/workflow/reject/") && method === "POST") {
    const instanceId = path.split("/").pop()!;
    const { reason } = await req.json();
    const ok = await workflowEngine.reject(instanceId, reason || "Rejected");
    return jsonResponse({ ok });
  }

  // ======== Plugin ========

  if (pluginManager && path === "/api/plugin/list" && method === "GET") {
    return jsonResponse({ plugins: pluginManager.listPlugins() });
  }

  if (pluginManager && path === "/api/plugin/tools" && method === "GET") {
    return jsonResponse({ tools: pluginManager.getPluginTools() });
  }

  // ======== Knowledge Base ========

  if (knowledgeBase && path === "/api/kb/search" && method === "POST") {
    const { query, topK, threshold } = await req.json();
    const results = await knowledgeBase.search(query, topK, threshold);
    return jsonResponse({ results });
  }

  if (knowledgeBase && path === "/api/kb/search/advanced" && method === "POST") {
    const searchQuery = await req.json();
    const results = await knowledgeBase.advancedSearch(searchQuery);
    return jsonResponse(results);
  }

  if (knowledgeBase && path === "/api/kb/index" && method === "POST") {
    const { source, content, sourceType } = await req.json();
    const chunks = await knowledgeBase.indexDocument(source, content, sourceType);
    return jsonResponse({ ok: true, chunks });
  }

  if (knowledgeBase && path === "/api/kb/index/file" && method === "POST") {
    const { path: filePath } = await req.json();
    const chunks = await knowledgeBase.indexFile(filePath);
    return jsonResponse({ ok: true, chunks });
  }

  if (knowledgeBase && path === "/api/kb/index/directory" && method === "POST") {
    const { path: dirPath } = await req.json();
    const chunks = await knowledgeBase.indexDirectory(dirPath);
    return jsonResponse({ ok: true, chunks });
  }

  if (knowledgeBase && path === "/api/kb/stats" && method === "GET") {
    return jsonResponse(knowledgeBase.getStats());
  }

  if (knowledgeBase && path === "/api/kb/brief" && method === "POST") {
    const { query, maxSections } = await req.json();
    const brief = await knowledgeBase.generateBrief(query, maxSections);
    return jsonResponse(brief);
  }

  if (knowledgeBase && path === "/api/kb/materials" && method === "POST") {
    const { topic, maxMaterials } = await req.json();
    const materials = await knowledgeBase.extractMaterials(topic, maxMaterials);
    return jsonResponse(materials);
  }

  if (knowledgeBase && path === "/api/kb/generate" && method === "POST") {
    const request = await req.json();
    const result = await knowledgeBase.generateContent(request);
    return jsonResponse(result);
  }

  // ---- Knowledge Graph ----

  if (knowledgeBase && path === "/api/kb/graph" && method === "GET") {
    const centerNodeId = url.searchParams.get("center") || undefined;
    const depth = parseInt(url.searchParams.get("depth") || "2");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    return jsonResponse(knowledgeBase.getGraphVisualization(centerNodeId, depth, limit));
  }

  if (knowledgeBase && path === "/api/kb/graph/query" && method === "POST") {
    const query = await req.json();
    return jsonResponse(knowledgeBase.queryGraph(query));
  }

  if (knowledgeBase && path === "/api/kb/graph/stats" && method === "GET") {
    return jsonResponse(knowledgeBase.graph.getStats());
  }

  // ---- Sync & External Sources ----

  if (knowledgeBase && path === "/api/kb/sync/sources" && method === "GET") {
    return jsonResponse({ sources: knowledgeBase.sync.listExternalSources() });
  }

  if (knowledgeBase && path === "/api/kb/sync/sources" && method === "POST") {
    const sourceConfig = await req.json();
    const source = knowledgeBase.sync.addExternalSource(sourceConfig);
    return jsonResponse({ ok: true, source });
  }

  if (knowledgeBase && path === "/api/kb/sync/dedup" && method === "GET") {
    return jsonResponse(knowledgeBase.sync.dedup.runDeduplication());
  }

  if (knowledgeBase && path === "/api/kb/sync/conflicts" && method === "GET") {
    return jsonResponse({ conflicts: knowledgeBase.sync.conflicts.getUnresolvedConflicts() });
  }

  if (knowledgeBase && path.startsWith("/api/kb/sync/conflicts/resolve/") && method === "POST") {
    const conflictId = path.split("/").pop()!;
    const ok = knowledgeBase.sync.conflicts.resolveConflict(conflictId, "user");
    return jsonResponse({ ok });
  }

  if (knowledgeBase && path === "/api/kb/sync/watcher/events" && method === "GET") {
    return jsonResponse({ events: knowledgeBase.sync.fileWatcher.getRecentEvents() });
  }

  // ---- Push & Recommendations ----

  if (knowledgeBase && path === "/api/kb/push/recommendations" && method === "POST") {
    const { activity } = await req.json();
    const recs = knowledgeBase.getRecommendations(activity || "general");
    return jsonResponse({ recommendations: recs });
  }

  if (knowledgeBase && path === "/api/kb/push/subscriptions" && method === "GET") {
    return jsonResponse({ subscriptions: knowledgeBase.sync.push.listSubscriptions() });
  }

  if (knowledgeBase && path === "/api/kb/push/subscriptions" && method === "POST") {
    const subConfig = await req.json();
    const sub = knowledgeBase.sync.push.subscribe(subConfig);
    return jsonResponse({ ok: true, subscription: sub });
  }

  if (knowledgeBase && path === "/api/kb/push/digest" && method === "POST") {
    const { period } = await req.json();
    const digest = knowledgeBase.generateDigest(period || "weekly");
    return jsonResponse(digest);
  }

  // ---- File Processor Info ----

  if (knowledgeBase && path === "/api/kb/formats" && method === "GET") {
    return jsonResponse({ formats: knowledgeBase.fileProcessor.getSupportedFormats() });
  }

  if (knowledgeBase && path === "/api/kb/embedding" && method === "GET") {
    return jsonResponse(getEmbeddingStatus());
  }

  // ======== IDE ========

  if (ideBridge && path === "/api/ide/analyze" && method === "POST") {
    const { path: filePath } = await req.json();
    const result = await ideBridge.analyzeFile(filePath);
    return jsonResponse(result);
  }

  if (ideBridge && path === "/api/ide/lint" && method === "POST") {
    const { path: filePath } = await req.json();
    const issues = await ideBridge.lint(filePath);
    return jsonResponse({ issues });
  }

  if (ideBridge && path === "/api/ide/git/status" && method === "GET") {
    return jsonResponse(await ideBridge.gitStatus());
  }

  if (ideBridge && path === "/api/ide/git/diff" && method === "GET") {
    const staged = url.searchParams.get("staged") === "true";
    return jsonResponse(await ideBridge.gitDiff(staged));
  }

  if (ideBridge && path === "/api/ide/typecheck" && method === "POST") {
    const { path: filePath } = await req.json();
    const issues = await ideBridge.typeCheck(filePath);
    return jsonResponse({ issues });
  }

  if (ideBridge && path === "/api/ide/overview" && method === "GET") {
    return jsonResponse(await ideBridge.getProjectOverview());
  }

  // ======== Metrics (Prometheus) ========

  if (monitorConfig.enabled && path === monitorConfig.metricsEndpoint && method === "GET") {
    const metrics = [
      `# HELP yyc3_uptime_seconds Server uptime in seconds`,
      `# TYPE yyc3_uptime_seconds gauge`,
      `yyc3_uptime_seconds ${Math.floor((Date.now() - startTime) / 1000)}`,
      `# HELP yyc3_connected_clients Number of connected WebSocket clients`,
      `# TYPE yyc3_connected_clients gauge`,
      `yyc3_connected_clients ${connectedClients.size}`,
      `# HELP yyc3_family_members Total family members`,
      `# TYPE yyc3_family_members gauge`,
      `yyc3_family_members ${members.size}`,
    ].join("\n");
    return new Response(metrics, {
      headers: { "Content-Type": "text/plain; version=0.0.4", ...corsHeaders() },
    });
  }

  // ======== Files API (Step 8a) ========

  if (path === "/api/files/list" && method === "GET") {
    const pid = url.searchParams.get("projectId") || "default-project";
    const files = projectFiles.get(pid) || new Map();
    const fileList = Array.from(files.values()).map((f: ProjectFile) => ({
      path: f.path, language: f.language,
      size: f.content.length, lastModified: f.lastModified,
    }));
    return jsonResponse({
      projectId: pid,
      files: fileList,
      totalSize: fileList.reduce((s: number, f) => s + f.size, 0),
    });
  }

  if (path === "/api/files/read" && method === "POST") {
    const { projectId: pid = "default-project", path: filePath } = await req.json();
    const files = projectFiles.get(pid);
    const file = files?.get(filePath);
    if (!file) return jsonResponse({ error: "File not found" }, 404);
    return jsonResponse(file);
  }

  if (path === "/api/files/write" && method === "POST") {
    const { projectId: pid = "default-project", path: filePath, content, language = "plaintext" } = await req.json();
    if (!filePath || content === undefined) return jsonResponse({ error: "Missing path or content" }, 400);
    if (!projectFiles.has(pid)) projectFiles.set(pid, new Map());
    const files = projectFiles.get(pid)!;
    const existing = files.get(filePath);
    const version = (existing?.version || 0) + 1;
    files.set(filePath, { path: filePath, content, language, version, lastModified: Date.now() });
    console.log(`[FILES] Write: ${pid}/${filePath} (v${version}, ${content.length} bytes)`);
    return jsonResponse({ ok: true, version });
  }

  if (path === "/api/files/delete" && method === "POST") {
    const { projectId: pid = "default-project", path: filePath } = await req.json();
    const files = projectFiles.get(pid);
    const existed = files?.delete(filePath) || false;
    return jsonResponse({ ok: existed });
  }

  if (path === "/api/files/stats" && method === "GET") {
    let totalFiles = 0;
    let totalSize = 0;
    projectFiles.forEach(files => {
      files.forEach((f: ProjectFile) => {
        totalFiles++;
        totalSize += f.content?.length || 0;
      });
    });
    return jsonResponse({
      projects: projectFiles.size, totalFiles, totalSize,
      crdt: crdtEngine.getStats(),
    });
  }

  // ======== 404 ========
  return jsonResponse({ error: "Not Found", path }, 404);
}

// ==========================================
// Bun Server
// ==========================================
const server = Bun.serve({
  port: serverConfig.port,

  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    return handleHTTP(req);
  },

  websocket: {
    open(ws) {
      connectedClients.add(ws);
      console.log(`[WS] Connected (total: ${connectedClients.size})`);
      ws.send(buildMessage("system_event", {
        event: "connected",
        data: {
          serverVersion: SERVER_VERSION,
          uptime: Math.floor((Date.now() - startTime) / 1000),
          membersCount: members.size,
          llmPrimary: llmConfig.primary,
          subsystems: {
            mcp: mcpConfig.enabled,
            workflow: wfConfig.enabled,
            plugin: pluginConfig.enabled,
            knowledgeBase: kbConfig.enabled,
            ide: ideConfig.enabled,
          },
        },
      }));
    },

    message(ws, message) {
      const raw = typeof message === "string" ? message : new TextDecoder().decode(message);
      handleWSMessage(ws, raw).catch((err) => {
        console.error("[WS] Error:", err);
        ws.send(buildMessage("error", { message: "Internal server error", code: "INTERNAL_ERROR" }));
      });
    },

    close(ws) {
      connectedClients.delete(ws);
      for (const [ch, subs] of subscriptions) {
        subs.delete(ws);
        if (subs.size === 0) subscriptions.delete(ch);
      }
      // Step 7b: CRDT 断开处理
      const crdtResponses = crdtEngine.handleDisconnect(ws);
      for (const resp of crdtResponses) {
        const respStr = buildMessage("signal", {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'SYNC',
          senderId: 'CENTRAL_PULSE',
          receiverId: 'USER',
          payload: {
            content: JSON.stringify(resp),
            mood: 'FOCUSED',
            priority: 'NORMAL',
            modelSource: 'REAL',
          },
          metadata: { version: '1.0.0' },
        });
        broadcast("family_signals", respStr);
      }
      console.log(`[WS] Disconnected (total: ${connectedClients.size})`);
    },

    drain() { },
  },
});

// ==========================================
// Startup Banner
// ==========================================
console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║   YYC³ AI Family — Bun Runtime Backend v${SERVER_VERSION}            ║
  ║   "灵肉贯通·万象归元" — Full Ecosystem Operational       ║
  ╠══════════════════════════════════════════════════════════╣
  ║                                                          ║
  ║   WebSocket  : ws://localhost:${serverConfig.port}                      ║
  ║   REST API   : http://localhost:${serverConfig.port}                    ║
  ║   Health     : http://localhost:${serverConfig.port}/api/health         ║
  ║   Config     : http://localhost:${serverConfig.port}/api/config         ║
  ║                                                          ║
  ║   LLM Primary: ${llmConfig.primary.padEnd(12)} | Fallback: ${llmConfig.fallback.padEnd(12)}  ║
  ║   Members    : ${String(members.size).padEnd(2)} family members online               ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
`);

// Print config diagnostics
printConfigSummary();

// List all registered REST endpoints
if (serverConfig.isDev) {
  console.log("  Registered API Endpoints:");
  const endpoints = [
    "GET  /api/health", "GET  /api/config",
    "GET  /api/family/members", "PATCH /api/family/members/:roleId",
    "POST /api/agent/:roleSlug", "GET  /api/llm/providers",
  ];
  if (mcpConfig.enabled) endpoints.push(
    "GET  /api/mcp/tools", "GET  /api/mcp/resources", "GET  /api/mcp/prompts",
    "POST /api/mcp/tools/call", "POST /api/mcp/resources/read", "POST /api/mcp/rpc",
  );
  if (wfConfig.enabled) endpoints.push(
    "GET  /api/workflow/list", "GET  /api/workflow/instances",
    "POST /api/workflow/trigger", "POST /api/workflow/approve/:id", "POST /api/workflow/reject/:id",
  );
  if (pluginConfig.enabled) endpoints.push("GET  /api/plugin/list", "GET  /api/plugin/tools");
  if (kbConfig.enabled) endpoints.push(
    "POST /api/kb/search", "POST /api/kb/search/advanced", "POST /api/kb/index", "POST /api/kb/index/file", "POST /api/kb/index/directory",
    "GET  /api/kb/stats", "POST /api/kb/brief", "POST /api/kb/materials", "POST /api/kb/generate",
    "GET  /api/kb/graph", "POST /api/kb/graph/query", "GET  /api/kb/graph/stats",
    "GET  /api/kb/sync/sources", "POST /api/kb/sync/sources", "GET  /api/kb/sync/dedup", "GET  /api/kb/sync/conflicts",
    "POST /api/kb/sync/conflicts/resolve/:id", "GET  /api/kb/sync/watcher/events",
    "POST /api/kb/push/recommendations", "GET  /api/kb/push/subscriptions", "POST /api/kb/push/subscriptions", "POST /api/kb/push/digest",
    "GET  /api/kb/formats", "GET  /api/kb/embedding",
  );
  if (ideConfig.enabled) endpoints.push(
    "POST /api/ide/analyze", "POST /api/ide/lint", "GET  /api/ide/git/status",
    "GET  /api/ide/git/diff", "POST /api/ide/typecheck", "GET  /api/ide/overview",
  );
  if (monitorConfig.enabled) endpoints.push(`GET  ${monitorConfig.metricsEndpoint}`);
  for (const ep of endpoints) console.log(`    ${ep}`);
  console.log("");
}
