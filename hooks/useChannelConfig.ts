/**
 * file: useChannelConfig.ts
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

import { useState, useEffect, useCallback } from "react";
import { ENDPOINTS } from '../config/endpoints';
import { OLLAMA_DEFAULTS } from '../config/models';

const CONFIG_KEY_PREFIX = "yyc3_config_";

export interface AIConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  temperature: number;
}

const DEFAULT_CONFIG: AIConfig = {
  provider: OLLAMA_DEFAULTS.provider,
  model: OLLAMA_DEFAULTS.model,
  apiKey: OLLAMA_DEFAULTS.apiKey,
  baseUrl: ENDPOINTS.OLLAMA,
  temperature: 0.7
};

export const PRESETS: Record<string, Partial<AIConfig>> = {
  "General": { ...DEFAULT_CONFIG },
  "Coding": {
    provider: "anthropic",
    model: "claude-3-opus-20240229",
    temperature: 0.2
  },
  "Creative": {
    provider: "openai",
    model: "gpt-4-turbo",
    temperature: 0.9
  },
  "Local-Secure": {
    provider: OLLAMA_DEFAULTS.provider,
    model: OLLAMA_DEFAULTS.model,
    baseUrl: ENDPOINTS.OLLAMA,
    temperature: 0.5
  }
};

export function useChannelConfig(channelId: string) {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${CONFIG_KEY_PREFIX}${channelId}`);
      if (stored) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(stored) });
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    } catch (e) {
      console.error("Failed to load channel config:", e);
    }
  }, [channelId]);

  const saveConfig = useCallback((newConfig: AIConfig) => {
    localStorage.setItem(`${CONFIG_KEY_PREFIX}${channelId}`, JSON.stringify(newConfig));
    setConfig(newConfig);
  }, [channelId]);

  const applyPreset = useCallback((presetName: string) => {
    const preset = PRESETS[presetName];
    if (preset) {
      saveConfig({ ...config, ...preset });
    }
  }, [config, saveConfig]);

  return {
    config,
    saveConfig,
    applyPreset
  };
}