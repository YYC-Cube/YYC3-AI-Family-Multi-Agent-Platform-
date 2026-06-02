/**
 * file: useBigModel.ts
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
 * YYC³ AI Family - BigModel React Hooks (from YYC-Cube/Family BigModelSDK)
 *
 * Frontend hooks for direct BigModel / backend-proxied LLM interaction.
 * Provides: useBigModel, useChat, useChatStream, useMCPOrchestrator
 *
 * Two modes:
 *   1. Direct mode  — frontend calls BigModel API directly (needs BIGMODEL_API_KEY in env)
 *   2. Proxy mode   — calls go through bun-server /api/agent_call (default, recommended)
 *
 * 感恩智谱大模型授权，致敬GLM-PC的卓越支持！
 */

import { useState, useCallback, useRef } from 'react';

import type {
  BigModelMessage,
  BigModelResponse,
  OrchestratorProgress,
  UseBigModelConfig,
} from '../types/bigmodel-hooks';
import { DEFAULT_MODEL } from '../config/models';
import { getApiBaseUrl, getDefaultModelId, resolveRoleConfig } from '../config/dynamic-reader';

interface OpenAIToolCall {
  id: string;
  function?: {
    name: string;
    arguments: string;
  };
}

interface OpenAIChoice {
  message?: {
    content?: string;
    tool_calls?: OpenAIToolCall[];
  };
  finish_reason?: string;
}

interface OpenAIResponse {
  model?: string;
  choices?: OpenAIChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// ============================================================
// Core Hook: useBigModel
//
// 运行时优先从 DynamicConfig (localStorage) 读取配置：
// - API 基地址：getApiBaseUrl() → env(VITE_API_BASE_URL) → 硬编码 fallback
// - 默认模型：getDefaultModelId() → 动态配置第一个可用模型 → DEFAULT_MODEL
// - 角色模型绑定：resolveRoleConfig(roleId) → 动态配置 → 静态 ROLE_MODEL_MAP
// 
// 敏感值（API Key）强制 env() 读取
// ============================================================

export function useBigModel(config: UseBigModelConfig = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 动态解析 API 基地址和默认模型
  const dynamicApiBase = getApiBaseUrl();
  const dynamicDefaultModel = getDefaultModelId();
  const apiUrl = config.apiUrl || dynamicApiBase;

  /** Cancel any ongoing request */
  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setLoading(false);
    }
  }, []);

  /** Single completion call through backend proxy */
  const complete = useCallback(async (
    prompt: string,
    overrides?: Partial<UseBigModelConfig>,
  ): Promise<BigModelResponse | null> => {
    setLoading(true);
    setError(null);
    abortRef.current = new AbortController();

    const roleId = overrides?.roleId || config.roleId || 'AI_ARCHITECT';
    
    // 从动态配置解析角色绑定的模型和 Provider
    const roleConfig = resolveRoleConfig(roleId);
    const model = overrides?.model || config.model || roleConfig.modelId || dynamicDefaultModel;
    const provider = roleConfig.providerId || 'bigmodel';

    try {
      const res = await fetch(`${apiUrl}/api/agent/${roleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          prompt,
          systemPrompt: overrides?.systemPrompt || config.systemPrompt || '',
          model: model,
          provider: provider,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return {
        id: data.id || crypto.randomUUID(),
        model: data.model || model || DEFAULT_MODEL,
        content: data.content || '',
        usage: data.tokenUsage ? {
          promptTokens: data.tokenUsage.inputTokens || 0,
          completionTokens: data.tokenUsage.outputTokens || 0,
          totalTokens: (data.tokenUsage.inputTokens || 0) + (data.tokenUsage.outputTokens || 0),
        } : undefined,
        finishReason: 'stop',
      };
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name !== 'AbortError') {
        setError(error);
      }
      return null;
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [apiUrl, config.roleId, config.model, config.systemPrompt]);

  /** Run MCP Orchestrator — BigModel + tool_call loop */
  const orchestrate = useCallback(async (
    prompt: string,
    onProgress?: (progress: OrchestratorProgress) => void,
    overrides?: Partial<UseBigModelConfig>,
  ): Promise<BigModelResponse | null> => {
    setLoading(true);
    setError(null);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${apiUrl}/api/mcp/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          prompt,
          model: overrides?.model || config.model || DEFAULT_MODEL,
          systemPrompt: overrides?.systemPrompt || config.systemPrompt,
          maxTokens: overrides?.maxTokens || config.maxTokens,
          temperature: overrides?.temperature ?? config.temperature,
        }),
      });

      if (!res.ok) {
        throw new Error(`Orchestrator error: ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Report tool call history as progress
      if (onProgress && data.toolCallHistory) {
        for (const round of data.toolCallHistory) {
          for (const tc of round.toolCalls) {
            onProgress({
              round: round.round,
              type: 'tool_start',
              toolName: tc.name,
            });
          }
          for (const result of round.results) {
            onProgress({
              round: round.round,
              type: 'tool_result',
              toolName: result.toolName,
              success: result.success,
              executionTimeMs: result.executionTimeMs,
            });
          }
          onProgress({ round: round.round, type: 'round_complete' });
        }
        onProgress({ round: data.totalRounds, type: 'done' });
      }

      const finalChoice = data.finalResponse?.choices?.[0] as OpenAIChoice | undefined;
      return {
        id: data.finalResponse?.id || crypto.randomUUID(),
        model: data.finalResponse?.model || config.model || DEFAULT_MODEL,
        content: finalChoice?.message?.content || '',
        usage: data.finalResponse?.usage ? {
          promptTokens: data.finalResponse.usage.prompt_tokens || 0,
          completionTokens: data.finalResponse.usage.completion_tokens || 0,
          totalTokens: data.finalResponse.usage.total_tokens || 0,
        } : undefined,
        finishReason: finalChoice?.finish_reason || 'stop',
        toolCalls: finalChoice?.message?.tool_calls?.map((tc: OpenAIToolCall) => ({
          id: tc.id,
          name: tc.function?.name || '',
          arguments: tc.function?.arguments || '',
        })),
      };
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name !== 'AbortError') {
        setError(error);
      }
      return null;
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [apiUrl, config.model, config.systemPrompt, config.maxTokens, config.temperature]);

  return {
    loading,
    error,
    complete,
    orchestrate,
    cancel,
  };
}

// ============================================================
// Chat Hook: useChat (multi-turn conversation)
// ============================================================

export function useChat(config: UseBigModelConfig & {
  initialMessages?: BigModelMessage[];
} = {}) {
  const { loading, error, complete, cancel } = useBigModel(config);
  const [messages, setMessages] = useState<BigModelMessage[]>(config.initialMessages || []);
  const [lastResponse, setLastResponse] = useState<BigModelResponse | null>(null);

  const sendMessage = useCallback(async (content: string): Promise<BigModelResponse | null> => {
    const userMessage: BigModelMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);

    const response = await complete(content);

    if (response) {
      const assistantMessage: BigModelMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setLastResponse(response);
    }

    return response;
  }, [complete]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastResponse(null);
  }, []);

  return {
    messages,
    lastResponse,
    loading,
    error,
    sendMessage,
    clearMessages,
    cancel,
  };
}

// ============================================================
// Stream Hook: useChatStream (SSE streaming)
// ============================================================

export function useChatStream(config: UseBigModelConfig & {
  initialMessages?: BigModelMessage[];
  onChunk?: (chunk: string) => void;
} = {}) {
  const [messages, setMessages] = useState<BigModelMessage[]>(config.initialMessages || []);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const dynamicApiBase = getApiBaseUrl();
  const dynamicDefaultModel = getDefaultModelId();
  const apiUrl = config.apiUrl || dynamicApiBase;

  const sendMessage = useCallback(async (content: string): Promise<string | null> => {
    setLoading(true);
    setStreaming(true);
    setError(null);
    setCurrentResponse('');
    abortRef.current = new AbortController();

    const userMessage: BigModelMessage = { role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);

    try {
      const roleId = config.roleId || 'AI_ARCHITECT';
      const roleConfig = resolveRoleConfig(roleId);
      const model = config.model || roleConfig.modelId || dynamicDefaultModel;
      const provider = roleConfig.providerId || 'bigmodel';

      const res = await fetch(`${apiUrl}/api/agent/${roleId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          prompt: content,
          systemPrompt: config.systemPrompt || '',
          model: model,
          provider: provider,
          stream: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`Stream error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const chunk = JSON.parse(data);
              const text = chunk.choices?.[0]?.delta?.content || '';
              if (text) {
                fullResponse += text;
                setCurrentResponse(fullResponse);
                config.onChunk?.(text);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      const assistantMessage: BigModelMessage = {
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentResponse('');

      return fullResponse;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name !== 'AbortError') {
        setError(error);
      }
      return null;
    } finally {
      setLoading(false);
      setStreaming(false);
      abortRef.current = null;
    }
  }, [apiUrl, config.roleId, config.model, config.systemPrompt, config.onChunk]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentResponse('');
  }, []);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setLoading(false);
      setStreaming(false);
    }
  }, []);

  return {
    messages,
    currentResponse,
    loading,
    streaming,
    error,
    sendMessage,
    clearMessages,
    cancel,
  };
}

// ============================================================
// Orchestrator Hook: useMCPOrchestrator
// ============================================================

export function useMCPOrchestrator(config: UseBigModelConfig = {}) {
  const { loading, error, orchestrate, cancel } = useBigModel(config);
  const [progress, setProgress] = useState<OrchestratorProgress[]>([]);
  const [lastResult, setLastResult] = useState<BigModelResponse | null>(null);

  const run = useCallback(async (prompt: string): Promise<BigModelResponse | null> => {
    setProgress([]);
    const progressItems: OrchestratorProgress[] = [];

    const result = await orchestrate(prompt, (p) => {
      progressItems.push(p);
      setProgress([...progressItems]);
    });

    if (result) {
      setLastResult(result);
    }

    return result;
  }, [orchestrate]);

  return {
    loading,
    error,
    progress,
    lastResult,
    run,
    cancel,
  };
}