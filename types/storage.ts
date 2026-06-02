/**
 * file: storage.ts
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

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "file";
  size: string;
  url?: string;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: Attachment[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isStarred?: boolean;
  channelId?: string; // Optional channel ID for filtering
}

export interface AIConfig {
  provider: 'openai' | 'ollama' | 'anthropic' | 'zhipu' | 'bigmodel' | 'deepseek' | 'qwen';
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  version: number;
}

export interface UISettings {
  theme: string;
  scanlines: number;
  curvature: boolean;
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  version: number;
}
