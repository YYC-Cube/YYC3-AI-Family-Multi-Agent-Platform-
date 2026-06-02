/**
 * file: chat-completion.ts
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
// BigModelSDK/tools - ChatCompletion Tool (from YYC-Cube/Family repo)
// Supports: sync, streaming, async, tool_calls, deep thinking
// API: POST /paas/v4/chat/completions
// ============================================================

import { BaseTool } from './base-tool';
import type {
  ToolConfig, ToolSchema, ToolCall, TokenUsage,
  ContentFilter, FinishReason, AsyncTaskResponse,
} from './types';

// ---- Model catalog ----
export const TEXT_MODELS = [
  'glm-4.6', 'glm-4.5', 'glm-4.5-air', 'glm-4.5-x',
  'glm-4.5-airx', 'glm-4.5-flash', 'glm-4-plus',
  'glm-4-air-250414', 'glm-4-airx', 'glm-4-flashx', 'glm-4-flashx-250414',
] as const;

export const VISION_MODELS = [
  'glm-4.5v', 'glm-4v-plus-0111', 'glm-4v-flash',
  'glm-4.1v-thinking-flashx', 'glm-4.1v-thinking-flash',
] as const;

export const AUDIO_MODELS = ['glm-4-voice'] as const;
export const CHARACTER_MODELS = ['charglm-4', 'emohaa'] as const;
export const CODE_MODELS = ['codegeex-4'] as const;

export type TextModel = typeof TEXT_MODELS[number];
export type VisionModel = typeof VISION_MODELS[number];
export type AudioModel = typeof AUDIO_MODELS[number];
export type CharacterModel = typeof CHARACTER_MODELS[number];
export type CodeModel = typeof CODE_MODELS[number];
export type ChatModel = TextModel | VisionModel | AudioModel | CharacterModel | CodeModel | string;

// ---- Request types ----
export interface ChatCompletionRequest {
  model: ChatModel;
  messages: ChatCompletionMessage[];
  stream?: boolean;
  thinking?: { enable: boolean; budget_tokens?: number };
  do_sample?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  tool_stream?: boolean;
  tools?: ToolSchema[];
  tool_choice?: 'auto';
  stop?: string[];
  response_format?: { type: 'text' | 'json_object' };
  request_id?: string;
  user_id?: string;
}

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | MultimodalContentItem[];
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  audio?: { id: string };
  meta?: CharacterMeta;
}

export interface MultimodalContentItem {
  type: 'text' | 'image_url' | 'video_url' | 'file';
  text?: string;
  image_url?: { url: string };
  video_url?: { url: string };
  file?: { file_id: string };
}

export interface CharacterMeta {
  user_info: string;
  bot_info: string;
  bot_name: string;
  user_name: string;
}

// ---- Response types ----
export interface ChatCompletionResponse {
  id: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: TokenUsage;
  web_search?: WebSearchResult[];
  content_filter?: ContentFilter[];
}

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    reasoning_content?: string;
    audio?: { id: string; data: string; expires_at: string };
    tool_calls?: ToolCall[];
  };
  finish_reason: FinishReason;
}

export interface ChatCompletionChunkResponse {
  id: string;
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
  usage?: TokenUsage;
  content_filter?: ContentFilter[];
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: {
    role?: string;
    content?: string | null;
    reasoning_content?: string;
    audio?: { id: string; data: string; expires_at: string };
    tool_calls?: Array<{
      index: number;
      id?: string;
      type?: string;
      function?: { name?: string; arguments?: string };
    }>;
  };
  finish_reason?: FinishReason;
}

export interface WebSearchResult {
  icon: string;
  title: string;
  link: string;
  media: string;
  publish_date: string;
  content: string;
  refer: string;
}

// ---- Tool class ----
export class ChatCompletionTool extends BaseTool {
  constructor(config: ToolConfig) {
    super(config);
  }

  /** Sync chat completion */
  async create(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.post<ChatCompletionResponse>('paas/v4/chat/completions', {
      ...request,
      stream: false,
    });
  }

  /** Streaming chat completion */
  async *createStream(
    request: Omit<ChatCompletionRequest, 'stream'>,
  ): AsyncGenerator<ChatCompletionChunkResponse, void, unknown> {
    yield* this.postStream<ChatCompletionChunkResponse>('paas/v4/chat/completions', {
      ...request,
    });
  }

  /** Async chat completion (returns task ID) */
  async createAsync(
    request: Omit<ChatCompletionRequest, 'stream'>,
  ): Promise<AsyncTaskResponse> {
    return this.post<AsyncTaskResponse>('paas/v4/async/chat/completions', request);
  }
}
