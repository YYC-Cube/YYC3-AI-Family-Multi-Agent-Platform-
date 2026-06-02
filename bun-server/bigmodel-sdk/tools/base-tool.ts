/**
 * file: base-tool.ts
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
// BigModelSDK/tools - Base Tool (from YYC-Cube/Family repo)
// All 14 model tools extend this base class
// ============================================================

import type { ToolConfig } from './types';

export class BaseTool {
  protected apiKey: string;
  protected baseUrl: string;
  protected timeout: number;

  constructor(config: ToolConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://open.bigmodel.cn/api/';
    this.timeout = config.timeout || 30000;
  }

  protected async post<T>(endpoint: string, body: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(this.timeout),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BigModel API ${response.status}: ${errorText.substring(0, 300)}`);
    }

    return response.json();
  }

  protected async *postStream<T>(endpoint: string, body: any): AsyncGenerator<T, void, unknown> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(this.timeout),
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BigModel API Stream ${response.status}: ${errorText.substring(0, 300)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');

    const decoder = new TextDecoder();
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
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data) as T;
          } catch {
            // skip malformed chunks
          }
        }
      }
    }
  }

  protected async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      signal: AbortSignal.timeout(this.timeout),
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BigModel API ${response.status}: ${errorText.substring(0, 300)}`);
    }

    return response.json();
  }
}
