/**
 * file: validation.ts
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
 * YYC³ AI Family - Type Validation Utilities
 * 
 * Runtime type validation functions for data integrity checks.
 * Used to validate data from localStorage, API responses, and user input.
 * 
 * @module utils/validation
 */

import { Chat, AIConfig, UISettings } from '../types/storage';

/**
 * Validates if unknown data is a valid Chat object
 * 
 * @param data - Unknown data to validate
 * @returns Type guard indicating if data is a valid Chat
 * 
 * @example
 * ```ts
 * const data = JSON.parse(localStorage.getItem('chat'));
 * if (validateChat(data)) {
 *   // TypeScript knows data is Chat
 *   console.log(data.title);
 * }
 * ```
 */
export function validateChat(data: unknown): data is Chat {
  return (
    typeof data === 'object' && data !== null &&
    typeof (data as Record<string, unknown>).id === 'string' &&
    typeof (data as Record<string, unknown>).title === 'string' &&
    Array.isArray((data as Record<string, unknown>).messages) &&
    ((data as Record<string, unknown>).createdAt instanceof Date || typeof (data as Record<string, unknown>).createdAt === 'string') &&
    ((data as Record<string, unknown>).updatedAt instanceof Date || typeof (data as Record<string, unknown>).updatedAt === 'string')
  );
}

/**
 * Validates if unknown data is a valid AIConfig object
 * 
 * @param data - Unknown data to validate
 * @returns Type guard indicating if data is a valid AIConfig
 * 
 * @example
 * ```ts
 * const config = await fetchConfig();
 * if (validateAIConfig(config)) {
 *   // Safe to use config.provider
 *   console.log(config.provider);
 * }
 * ```
 */
export function validateAIConfig(data: unknown): data is AIConfig {
  return (
    typeof data === 'object' && data !== null &&
    ['openai', 'ollama', 'anthropic', 'zhipu', 'qwen', 'deepseek'].includes((data as Record<string, unknown>).provider as string) &&
    typeof (data as Record<string, unknown>).baseUrl === 'string'
  );
}

/**
 * Validates if unknown data is a valid UISettings object
 * 
 * @param data - Unknown data to validate
 * @returns Type guard indicating if data is valid UISettings
 * 
 * @example
 * ```ts
 * const settings = loadSettings();
 * if (validateUISettings(settings)) {
 *   applyTheme(settings.theme);
 * }
 * ```
 */
export function validateUISettings(data: unknown): data is UISettings {
  return (
    typeof data === 'object' && data !== null &&
    typeof (data as Record<string, unknown>).theme === 'string' &&
    typeof (data as Record<string, unknown>).scanlines === 'number' &&
    typeof (data as Record<string, unknown>).curvature === 'boolean'
  );
}
