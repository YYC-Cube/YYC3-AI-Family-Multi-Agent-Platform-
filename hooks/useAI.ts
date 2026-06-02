/**
 * file: useAI.ts
 * description: AI 配置和聊天 Hook · 支持多模型提供商配置和流式对话
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-02-26
 * updated: 2026-04-04
 * status: active
 * tags: [hook],[ai],[chat],[streaming]
 *
 * brief: 管理 AI 提供商配置并提供流式聊天功能
 *
 * details:
 * - 支持多提供商: OpenAI, Ollama, Anthropic, Zhipu, Qwen, DeepSeek
 * - localStorage 持久化配置
 * - Schema 迁移保证向后兼容
 * - 流式聊天响应支持
 * - 自动降级到模拟模式
 *
 * dependencies: React, types/storage, config/endpoints, config/models
 * exports: useAI
 * notes: 需要配置正确的 API Key 和 Base URL
 *
 * @example
 * ```tsx
 * const { config, chat, loading } = useAI();
 *
 * // 更新配置
 * updateConfig({ provider: 'ollama', model: 'llama2' });
 *
 * // 流式聊天
 * await chat(messages, (chunk) => console.log(chunk));
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { AIConfig } from '../types/storage';
import { toast } from 'sonner';
import { ENDPOINTS } from '../config/endpoints';
import { OLLAMA_DEFAULTS } from '../config/models';

const STORAGE_KEY = 'yyc3_ai_config';
const CURRENT_VERSION = 1;

const DEFAULT_CONFIG: AIConfig = {
  provider: OLLAMA_DEFAULTS.provider,
  apiKey: OLLAMA_DEFAULTS.apiKey,
  baseUrl: ENDPOINTS.OLLAMA,
  model: OLLAMA_DEFAULTS.model,
  temperature: 0.7,
  version: CURRENT_VERSION,
};

/**
 * Custom hook for AI configuration and chat functionality
 * 
 * @returns {Object} Hook return object
 * @returns {AIConfig} returns.config - Current AI configuration
 * @returns {boolean} returns.loading - Loading state
 * @returns {boolean} returns.isStreaming - Streaming state
 * @returns {Function} returns.updateConfig - Update configuration
 * @returns {Function} returns.chat - Chat function with streaming support
 */
export const useAI = () => {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  // Load Config
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Migration
        if (parsed.version !== CURRENT_VERSION) {
          const migrated = { ...DEFAULT_CONFIG, ...parsed, version: CURRENT_VERSION };
          setConfig(migrated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } else {
          setConfig(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load AI config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save Config Helper
  const saveConfig = useCallback((newConfig: AIConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (e) {
      console.error("Failed to save AI config", e);
    }
  }, []);

  // Chat Function
  const chat = async (messages: { role: string; content: string }[], onChunk: (chunk: string) => void) => {
    setIsStreaming(true);
    
    const currentConfig = config; 

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for local check

      try {
        const response = await fetch(`${currentConfig.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentConfig.apiKey}`
          },
          body: JSON.stringify({
            model: currentConfig.model,
            messages: messages,
            temperature: currentConfig.temperature,
            stream: true,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`AI API Error: ${response.statusText}`);
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = (buffer + chunk).split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') continue;
              
              try {
                const data = JSON.parse(dataStr);
                const content = data.choices?.[0]?.delta?.content || '';
                if (content) onChunk(content);
              } catch (e) {
                console.error('Error parsing stream chunk', e);
              }
            }
          }
        }
      } catch (networkError: any) {
        // Fallback to simulation if network fails (likely due to preview env not reaching localhost)
        console.warn("Network error or timeout, switching to simulation:", networkError);
        
        let simText = "";
        const fallbackMessage = "Local inference node unreachable. Simulating intelligent response based on protocols...\n\n" + 
          `Executing command: ${messages[messages.length - 1].content.slice(0, 20)}...\n` +
          "Analysis: Request valid.\nOutput: This is a simulated response because the local LLM is not accessible from this cloud preview environment. In your local deployment, this would be the Llama3 output.";

        const chunks = fallbackMessage.split(" ");
        for (const chunk of chunks) {
          await new Promise(r => setTimeout(r, 50)); // Simulate typing
          simText += chunk + " ";
          onChunk(chunk + " ");
        }
      }

    } catch (error: any) {
      toast.error(`AI_CORE_FAILURE: ${error.message}`);
      onChunk(`\n[SYSTEM_ERROR]: ${error.message}\n`);
    } finally {
      setIsStreaming(false);
    }
  };

  return { chat, isStreaming, config, saveConfig, loading };
};