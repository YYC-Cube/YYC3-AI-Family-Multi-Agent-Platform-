/**
 * file: family-messages.ts
 * description: 私信系统前端服务层 · 对接 bun-server /api/family/messages/*
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v1.0.0
 * created: 2026-06-02
 * updated: 2026-06-02
 * status: stable
 * tags: [service],[messages],[archive-§1.5]
 *
 * brief: 封装 /ai-family-messages 路由所需的所有后端调用（列表、发送、群发、搜索、已读）。
 *
 * dependencies: config/endpoints.ts
 * exports: FamilyMessage, FamilyThread, FamilyMessageService
 * notes: 与档案 §1.5 私信系统设计对齐
 */

import { ENDPOINTS } from '../config/endpoints';
import type { RoleId } from '../types/family-manifest';

// ==========================================
// Types
// ==========================================

export type MessageParticipant = RoleId | 'USER';

export interface FamilyMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: string;
  metadata: Record<string, unknown> | string;
  is_broadcast: boolean | number;
  read_at: string | null;
  created_at: string;
}

export interface FamilyThread {
  id: string;
  type: 'direct' | 'group' | 'broadcast';
  participant_ids: string[] | string;
  last_message_at: string | null;
  created_at: string;
}

export interface SendMessageInput {
  senderId: MessageParticipant;
  recipientIds: MessageParticipant[];
  content: string;
  messageType?: 'text' | 'voice' | 'image';
  metadata?: Record<string, unknown>;
}

// ==========================================
// Service
// ==========================================

class FamilyMessageService {
  private baseUrl: string;

  constructor(apiBase?: string) {
    this.baseUrl = apiBase || ENDPOINTS.API_BASE;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`FamilyMessage API ${path} failed: ${res.status} ${text}`);
    }
    return res.json() as Promise<T>;
  }

  /**
   * 列出当前用户参与的所有会话
   */
  async listThreads(participant: MessageParticipant = 'USER'): Promise<FamilyThread[]> {
    const data = await this.request<{ threads: FamilyThread[] }>(
      `/api/family/messages/threads?participant=${encodeURIComponent(participant)}`
    );
    return data.threads;
  }

  /**
   * 获取某个会话的消息历史
   */
  async getMessages(threadId: string, limit: number = 100): Promise<FamilyMessage[]> {
    const data = await this.request<{ messages: FamilyMessage[] }>(
      `/api/family/messages?threadId=${encodeURIComponent(threadId)}&limit=${limit}`
    );
    return data.messages;
  }

  /**
   * 发送消息（recipientIds.length === 1 → 1v1；> 1 → 群发）
   */
  async send(input: SendMessageInput): Promise<{ ok: boolean; ids: string[]; threadId: string }> {
    return this.request('/api/family/messages', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * 标记某会话中自己已读
   */
  async markRead(threadId: string, recipientId: MessageParticipant = 'USER'): Promise<number> {
    const data = await this.request<{ ok: boolean; updated: number }>(
      '/api/family/messages/read',
      { method: 'POST', body: JSON.stringify({ threadId, recipientId }) }
    );
    return data.updated;
  }

  /**
   * 关键词搜索历史消息
   */
  async search(keyword: string): Promise<FamilyMessage[]> {
    const data = await this.request<{ messages: FamilyMessage[]; query: string }>(
      `/api/family/messages/search?q=${encodeURIComponent(keyword)}`
    );
    return data.messages;
  }

  /**
   * 未读消息总数
   */
  async unreadCount(recipientId: MessageParticipant = 'USER'): Promise<number> {
    const data = await this.request<{ count: number }>(
      `/api/family/messages/unread?recipientId=${encodeURIComponent(recipientId)}`
    );
    return data.count;
  }

  /**
   * 本地构造 thread_id（与后端 buildThreadId 保持一致）
   */
  buildThreadId(participants: MessageParticipant[], broadcast: boolean = false): string {
    const sorted = [...participants].sort();
    return broadcast ? `broadcast:${sorted.join('|')}` : sorted.join('|');
  }

  /**
   * 解析 thread.participant_ids（可能是 JSON 字符串或数组）
   */
  parseParticipantIds(thread: FamilyThread): MessageParticipant[] {
    if (Array.isArray(thread.participant_ids)) {
      return thread.participant_ids as MessageParticipant[];
    }
    try {
      return JSON.parse(thread.participant_ids) as MessageParticipant[];
    } catch {
      return [];
    }
  }

  /**
   * 从直系 thread 中提取"对方"ID
   */
  getDirectOtherSide(thread: FamilyThread, self: MessageParticipant = 'USER'): MessageParticipant | null {
    const ids = this.parseParticipantIds(thread);
    if (thread.type !== 'direct') return null;
    return (ids.find(p => p !== self) as MessageParticipant) || null;
  }
}

// ==========================================
// Singleton
// ==========================================

let _instance: FamilyMessageService | null = null;

export function getFamilyMessageService(): FamilyMessageService {
  if (!_instance) {
    _instance = new FamilyMessageService();
  }
  return _instance;
}

export { FamilyMessageService };
