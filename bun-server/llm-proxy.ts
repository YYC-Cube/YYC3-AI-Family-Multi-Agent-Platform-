/**
 * file: llm-proxy.ts
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
 * YYC³ AI Family - Multi-Provider LLM Proxy (灵魂通道·万模归一·一角色一模型)
 * 
 * Routes agent_call requests to per-role configured LLM providers.
 * Supports: Anthropic Claude, OpenAI GPT, Ollama, DeepSeek, Qwen, BigModel GLM
 * 
 * Per-Role Routing (§2.1 一角色一模型):
 *   Each family member resolves its own provider + model from config.
 *   Priority: payload override → ROLE_{ID}_PROVIDER env → DEFAULT_ROLE_MODELS → global primary
 * 
 * All providers receive the same 4-layer SystemPrompt from the frontend:
 *   Layer 1: Base persona template (agent-personas.ts)
 *   Layer 2: Five-dimension philosophical context
 *   Layer 3: Dialogue chain injection (peer responses)
 *   Layer 4: Response constraints (tone, format, length)
 * 
 * Fallback chain:
 *   Role-specific provider → Role fallback → Global fallback → Mock
 * 
 * 感恩智谱大模型授权，致敬GLM-PC的卓越支持！
 */

import Anthropic from "@anthropic-ai/sdk";
import { llm as llmConfig, type LLMProvider, getRoleModelConfig } from "./config";
import { createBigModelChat, BIGMODEL_SDK_VERSION } from "./bigmodel-sdk";
import type { ChatCompletionTool as BigModelChatTool } from "./bigmodel-sdk";

// ==========================================
// Agent Call Types
// ==========================================
export interface AgentCallPayload {
  roleId: string;
  prompt: string;
  context: {
    dialogueChainId?: string;
    previousResponses?: { roleId: string; content: string }[];
    systemPrompt?: string;
  };
  endpoint?: string;
  model?: string;
  provider?: LLMProvider;  // Override provider for this call
}

export interface AgentCallResult {
  content: string;
  model: string;
  provider: LLMProvider;
  latency: number;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  error?: string;
  fallback?: boolean;  // True if fallback provider was used
}

// API Response Types
interface OpenAIChoice {
  message?: { content?: string };
}

interface OpenAIUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
  model?: string;
  usage?: OpenAIUsage;
}

interface OllamaResponse {
  message?: { content?: string };
  model?: string;
  eval_count?: number;
  prompt_eval_count?: number;
}

// ==========================================
// Provider: Anthropic (Claude)
// ==========================================
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!llmConfig.anthropic.configured) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: llmConfig.anthropic.apiKey,
      baseURL: llmConfig.anthropic.baseUrl !== "https://api.anthropic.com" ? llmConfig.anthropic.baseUrl : undefined,
    });
    console.log("[LLM] Anthropic client initialized");
  }
  return anthropicClient;
}

async function callAnthropic(systemPrompt: string, messages: { role: "user" | "assistant"; content: string }[], model?: string, maxTokens?: number): Promise<AgentCallResult> {
  const startTime = Date.now();
  const m = model || llmConfig.anthropic.model;
  const client = getAnthropicClient();

  if (!client) {
    return { content: "", model: m, provider: "anthropic", latency: 0, error: "Anthropic not configured" };
  }

  try {
    const response = await client.messages.create({
      model: m,
      max_tokens: maxTokens || llmConfig.anthropic.maxTokens,
      system: systemPrompt,
      messages,
      temperature: llmConfig.temperature,
    });

    const textContent = response.content
      .filter((block: Anthropic.ContentBlock): block is Anthropic.TextBlock => block.type === "text")
      .map((block: Anthropic.TextBlock) => block.text)
      .join("\n");

    return {
      content: textContent,
      model: response.model,
      provider: "anthropic",
      latency: Date.now() - startTime,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { content: "", model: m, provider: "anthropic", latency: Date.now() - startTime, error: error.message };
  }
}

// ==========================================
// Provider: OpenAI-Compatible (GPT-4o / DeepSeek / Qwen / BigModel GLM)
// All use the same /chat/completions API shape
// ==========================================
async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  provider: LLMProvider,
  maxTokens: number,
  temperature?: number,
): Promise<AgentCallResult> {
  const startTime = Date.now();

  if (!apiKey) {
    return { content: "", model, provider, latency: 0, error: `${provider} API key not configured` };
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(llmConfig.requestTimeout),
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: temperature ?? llmConfig.temperature,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { content: "", model, provider, latency: Date.now() - startTime, error: `HTTP ${response.status}: ${errorBody.substring(0, 200)}` };
    }

    const data: OpenAIResponse = await response.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || "",
      model: data.model || model,
      provider,
      latency: Date.now() - startTime,
      tokenUsage: data.usage ? {
        inputTokens: data.usage.prompt_tokens || 0,
        outputTokens: data.usage.completion_tokens || 0,
      } : undefined,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { content: "", model, provider, latency: Date.now() - startTime, error: error.message };
  }
}

// ==========================================
// Provider: Ollama (Local)
// ==========================================
async function callOllama(systemPrompt: string, messages: { role: "user" | "assistant"; content: string }[], model?: string): Promise<AgentCallResult> {
  const startTime = Date.now();
  const m = model || llmConfig.ollama.model;

  if (!llmConfig.ollama.enabled) {
    return { content: "", model: m, provider: "ollama", latency: 0, error: "Ollama not enabled" };
  }

  try {
    const response = await fetch(`${llmConfig.ollama.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(llmConfig.requestTimeout),
      body: JSON.stringify({
        model: m,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      return { content: "", model: m, provider: "ollama", latency: Date.now() - startTime, error: `Ollama HTTP ${response.status}` };
    }

    const data: OllamaResponse = await response.json();
    return {
      content: data.message?.content || "",
      model: data.model || m,
      provider: "ollama",
      latency: Date.now() - startTime,
      tokenUsage: data.eval_count ? {
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
      } : undefined,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { content: "", model: m, provider: "ollama", latency: Date.now() - startTime, error: error.message };
  }
}

// ==========================================
// Provider: BigModel (智谱 GLM) — via YYC-Cube/Family BigModelSDK
// Uses native SDK with full model catalog + tool_calls support
// ==========================================
let bigModelClient: BigModelChatTool | null = null;

function getBigModelClient(): BigModelChatTool | null {
  if (!llmConfig.bigmodel.configured) return null;
  if (!bigModelClient) {
    // SDK base URL is the root: https://open.bigmodel.cn/api/
    // ChatCompletionTool appends 'paas/v4/chat/completions' internally
    bigModelClient = createBigModelChat(
      llmConfig.bigmodel.apiKey,
      llmConfig.bigmodel.baseUrl.replace(/\/paas\/v4\/?$/, '/'),
      llmConfig.requestTimeout,
    );
    console.log(`[LLM] BigModel SDK v${BIGMODEL_SDK_VERSION} initialized (base: ${llmConfig.bigmodel.baseUrl})`);
  }
  return bigModelClient;
}

async function callBigModel(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  model?: string,
  maxTokens?: number,
  temperature?: number,
): Promise<AgentCallResult> {
  const startTime = Date.now();
  const m = model || llmConfig.bigmodel.model;
  const client = getBigModelClient();

  if (!client) {
    return { content: "", model: m, provider: "bigmodel", latency: 0, error: "BigModel not configured (set BIGMODEL_API_KEY)" };
  }

  try {
    const response = await client.create({
      model: m,
      max_tokens: maxTokens || llmConfig.bigmodel.maxTokens,
      temperature: temperature ?? llmConfig.temperature,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content })),
      ],
    });

    const choice = response.choices?.[0];
    const content = typeof choice?.message?.content === 'string' ? choice.message.content : '';

    return {
      content,
      model: response.model || m,
      provider: "bigmodel",
      latency: Date.now() - startTime,
      tokenUsage: response.usage ? {
        inputTokens: response.usage.prompt_tokens || 0,
        outputTokens: response.usage.completion_tokens || 0,
      } : undefined,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { content: "", model: m, provider: "bigmodel", latency: Date.now() - startTime, error: error.message };
  }
}

// ==========================================
// Provider Router
// ==========================================
async function callProvider(
  provider: LLMProvider,
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  model?: string,
  maxTokens?: number,
  temperature?: number,
): Promise<AgentCallResult> {
  switch (provider) {
    case "anthropic":
      return callAnthropic(systemPrompt, messages, model, maxTokens);

    case "openai":
      return callOpenAICompatible(
        llmConfig.openai.baseUrl, llmConfig.openai.apiKey,
        model || llmConfig.openai.model, systemPrompt, messages,
        "openai", maxTokens || llmConfig.openai.maxTokens, temperature,
      );

    case "deepseek":
      return callOpenAICompatible(
        llmConfig.deepseek.baseUrl, llmConfig.deepseek.apiKey,
        model || llmConfig.deepseek.model, systemPrompt, messages,
        "deepseek", maxTokens || 2048, temperature,
      );

    case "qwen":
      return callOpenAICompatible(
        llmConfig.qwen.baseUrl, llmConfig.qwen.apiKey,
        model || llmConfig.qwen.model, systemPrompt, messages,
        "qwen", maxTokens || 2048, temperature,
      );

    case "bigmodel":
      return callBigModel(systemPrompt, messages, model, maxTokens, temperature);

    case "ollama":
      return callOllama(systemPrompt, messages, model);

    default:
      return { content: "", model: model || "unknown", provider, latency: 0, error: `Unknown provider: ${provider}` };
  }
}

// ==========================================
// Per-Role Resolution: provider + model + fallback chain
// ==========================================
function resolveRoleRoute(roleId: string, payloadOverride?: { provider?: LLMProvider; model?: string }): {
  provider: LLMProvider;
  model: string | undefined;
  fallbackProvider: LLMProvider;
  fallbackModel: string | undefined;
  maxTokens: number | undefined;
  temperature: number | undefined;
} {
  const roleConfig = getRoleModelConfig(roleId);

  // Payload override takes highest priority
  const provider = payloadOverride?.provider || roleConfig.provider;
  const model = payloadOverride?.model || roleConfig.model || undefined;

  // Fallback: role-specific → global
  const fallbackProvider = roleConfig.fallbackProvider || llmConfig.fallback;
  const fallbackModel = roleConfig.fallbackModel || undefined;

  return {
    provider,
    model,
    fallbackProvider,
    fallbackModel,
    maxTokens: roleConfig.maxTokens,
    temperature: roleConfig.temperature,
  };
}

// ==========================================
// Main Handler: handleAgentCall (一角色一模型)
// ==========================================
export async function handleAgentCall(payload: AgentCallPayload): Promise<AgentCallResult> {
  const systemPrompt =
    payload.context?.systemPrompt ||
    `You are a member of the YYC3 AI Family. Role: ${payload.roleId}. Respond professionally and in character.`;

  // Build messages array
  const messages: { role: "user" | "assistant"; content: string }[] = [];

  if (payload.context?.previousResponses?.length) {
    for (const prev of payload.context.previousResponses) {
      messages.push({ role: "assistant", content: `[${prev.roleId}] ${prev.content}` });
    }
  }

  messages.push({ role: "user", content: payload.prompt });

  // ── Per-Role Resolution ──
  const route = resolveRoleRoute(payload.roleId, {
    provider: payload.provider,
    model: payload.model,
  });

  console.log(
    `[LLM] ${payload.roleId} → ${route.provider}${route.model ? `(${route.model})` : ""} | prompt: "${payload.prompt.substring(0, 60)}..." | system: ${systemPrompt.length} chars`
  );

  // ── Try primary (role-specific) provider ──
  let result = await callProvider(
    route.provider, systemPrompt, messages,
    route.model, route.maxTokens, route.temperature,
  );

  // ── If primary failed, try role-specific fallback ──
  if (result.error && route.fallbackProvider !== route.provider) {
    console.warn(`[LLM] ${payload.roleId}: Primary (${route.provider}) failed: ${result.error}. Trying fallback: ${route.fallbackProvider}`);
    result = await callProvider(
      route.fallbackProvider, systemPrompt, messages,
      route.fallbackModel, route.maxTokens, route.temperature,
    );
    result.fallback = true;
  }

  // ── If fallback also failed and global fallback is different, try that ──
  if (result.error && llmConfig.fallback !== route.fallbackProvider && llmConfig.fallback !== route.provider) {
    console.warn(`[LLM] ${payload.roleId}: Role fallback (${route.fallbackProvider}) also failed. Trying global fallback: ${llmConfig.fallback}`);
    result = await callProvider(llmConfig.fallback, systemPrompt, messages);
    result.fallback = true;
  }

  if (!result.error) {
    console.log(
      `[LLM] Response from ${result.provider}(${result.model}) for ${payload.roleId} | ${result.latency}ms | ${result.tokenUsage?.inputTokens || 0}+${result.tokenUsage?.outputTokens || 0} tokens${result.fallback ? " [FALLBACK]" : ""}`
    );
  }

  return result;
}

// ==========================================
// REST Handler
// ==========================================
export async function handleAgentREST(
  roleId: string,
  body: {
    prompt: string;
    systemPrompt: string;
    model?: string;
    provider?: LLMProvider;
    context?: {
      dialogueChainId?: string;
      previousResponses?: { roleId: string; content: string }[];
    };
  }
): Promise<AgentCallResult> {
  return handleAgentCall({
    roleId,
    prompt: body.prompt,
    context: {
      systemPrompt: body.systemPrompt,
      dialogueChainId: body.context?.dialogueChainId,
      previousResponses: body.context?.previousResponses,
    },
    model: body.model,
    provider: body.provider,
  });
}

// ==========================================
// Provider Health Check (all 6 providers)
// ==========================================
export async function checkProviderHealth(): Promise<Record<LLMProvider, { available: boolean; latency?: number; error?: string }>> {
  const results: Record<string, any> = {};

  // Anthropic
  if (llmConfig.anthropic.configured) {
    try {
      const start = Date.now();
      const client = getAnthropicClient();
      if (client) {
        results.anthropic = { available: true, latency: Date.now() - start };
      } else {
        results.anthropic = { available: false, error: "Client init failed" };
      }
    } catch (err: unknown) {
      const error = err as Error;
      results.anthropic = { available: false, error: error.message };
    }
  } else {
    results.anthropic = { available: false, error: "Not configured" };
  }

  // OpenAI
  results.openai = { available: llmConfig.openai.configured, error: llmConfig.openai.configured ? undefined : "Not configured" };

  // Ollama
  if (llmConfig.ollama.enabled) {
    try {
      const start = Date.now();
      const res = await fetch(`${llmConfig.ollama.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      results.ollama = { available: res.ok, latency: Date.now() - start };
    } catch (err: unknown) {
      const error = err as Error;
      results.ollama = { available: false, error: error.message };
    }
  } else {
    results.ollama = { available: false, error: "Not enabled" };
  }

  // DeepSeek
  results.deepseek = { available: llmConfig.deepseek.configured, error: llmConfig.deepseek.configured ? undefined : "Not configured" };

  // Qwen
  results.qwen = { available: llmConfig.qwen.configured, error: llmConfig.qwen.configured ? undefined : "Not configured" };

  // BigModel / 智谱 GLM
  if (llmConfig.bigmodel.configured) {
    try {
      const start = Date.now();
      // BigModel doesn't have a simple ping endpoint; check that the API key format is valid
      // A real health check would be a minimal completion call, but that costs tokens
      // For now, verify the base URL is reachable
      const res = await fetch(`${llmConfig.bigmodel.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${llmConfig.bigmodel.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          model: llmConfig.bigmodel.model,
          max_tokens: 1,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      // Even a 400 means the endpoint is reachable
      results.bigmodel = { available: res.ok || res.status < 500, latency: Date.now() - start };
    } catch (err: unknown) {
      const error = err as Error;
      results.bigmodel = { available: false, error: error.message };
    }
  } else {
    results.bigmodel = { available: false, error: "Not configured (set BIGMODEL_API_KEY)" };
  }

  return results as Record<string, { available: boolean; latency?: number; error?: string }>;
}