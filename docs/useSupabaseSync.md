
# YYC3 本地存储与数据持久化架构

## 1. 概述

YYC3 Hacker Chatbot 采用 **本地优先** 策略。数据主要存储在用户的浏览器中（`localStorage`），以实现即时访问和零延迟交互。与 Supabase 的可选同步（运行在 NAS 或云端）提供跨设备能力。

## 2. 数据存储

我们在 `localStorage` 中使用特定的键来管理不同类型的数据。

### 2.1 聊天历史记录（`yyc3_chat_history`）

- **格式**：`Chat` 对象的 JSON 数组
- **键**：`yyc3_chat_history`
- **结构**：
  ```typescript
  interface Chat {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
    isStarred: boolean;
  }
  ```
- **管理**：通过 `useChatPersistence` hook 管理
- **限制**：建议清理 30 天前的消息，如果大小超过 5MB 则将其归档到文件系统（通过 MCP）

### 2.2 系统配置（`yyc3_ai_config`）

- **键**：`yyc3_ai_config`
- **目的**：存储 AI 模型偏好、端点 URL 和 API 密钥
- **结构**：
  ```typescript
  interface AIConfig {
    provider: 'openai' | 'ollama' | 'anthropic';
    apiKey: string;
    baseUrl: string; // 对于连接本地 M4 Max 至关重要
    model: string;
    temperature: number;
  }
  ```
- **安全说明**：API 密钥以明文形式存储在 localStorage 中。这对于仅本地工具是可以接受的，但如果公开部署，应警告用户。

### 2.3 UI/UX 偏好设置（`yyc3_ui_settings`）

- **键**：`yyc3_ui_settings`
- **目的**：持久化视觉自定义（主题、字体大小、CRT 效果）
- **结构**：
  ```typescript
  interface UISettings {
    theme: string;
    scanlines: number;
    curvature: boolean;
    fontSize: 'small' | 'medium' | 'large';
    animations: boolean;
  }
  ```

## 3. 同步循环（"闭环"）

### 加载循环（应用启动）

1. `App.tsx` / `SettingsModal.tsx` 挂载
2. `useEffect` 检查 `localStorage.getItem('KEY')`
3. 如果数据存在，将 React 状态水合
4. 如果没有数据，回退到默认常量

#### 保存循环（用户操作）

1. 用户修改设置或发送消息
2. React 状态立即更新（乐观 UI）
3. `useEffect` 或特定处理程序（如 `handleSave`）触发 `localStorage.setItem('KEY', JSON.stringify(newState))`
4. （可选）后台同步到 Supabase/NAS

### 4. 开发者最佳实践

- **Hooks**：始终使用提供的 hooks（`useChatPersistence`、`useAI`）而不是原始 `localStorage` 调用，以确保状态一致性
- **验证**：始终使用 try/catch 处理 `JSON.parse` 操作，以优雅地处理损坏的数据
- **版本控制**：如果数据结构发生变化，请增加对象中的 `version` 字段，并在水合逻辑中实现迁移实用程序

### 5. 未来扩展：NAS 同步

要启用 NAS 的"数据中心"角色：

1. 实现 `useSupabaseSync` hook
2. 在 `localStorage` 写入时，将副本推送到 Supabase `chats` 表
3. 使用 Supabase Realtime 监听来自其他设备（如 iMac、华为）的更改并更新本地状态

---
        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
## 📋 详细操作指导

### 🎯 实施步骤概览

#### 阶段一：基础数据存储实现

**步骤 1：创建数据类型定义**

```typescript
// src/types/storage.ts

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isStarred: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AIConfig {
  provider: 'openai' | 'ollama' | 'anthropic';
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  version: number; // 用于数据迁移
}

export interface UISettings {
  theme: string;
  scanlines: number;
  curvature: boolean;
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  version: number;
}
```

**步骤 2：实现聊天历史持久化 Hook**

```typescript
// src/hooks/useChatPersistence.ts

import { useState, useEffect, useCallback } from 'react';
import { Chat, Message } from '@/types/storage';

const STORAGE_KEY = 'yyc3_chat_history';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AGE_DAYS = 30;

export const useChatPersistence = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载聊天历史
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 数据迁移：添加缺失的字段
        const migrated = parsed.map((chat: any) => ({
          ...chat,
          isStarred: chat.isStarred ?? false,
          createdAt: chat.createdAt ? new Date(chat.createdAt) : new Date(),
          updatedAt: chat.updatedAt ? new Date(chat.updatedAt) : new Date(),
        }));
        setChats(migrated);
      }
    } catch (err) {
      console.error('加载聊天历史失败:', err);
      setError('加载聊天历史失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存聊天历史
  const saveChats = useCallback((newChats: Chat[]) => {
    try {
      const serialized = JSON.stringify(newChats);
      
      // 检查存储大小
      if (serialized.length > MAX_STORAGE_SIZE) {
        console.warn('存储空间不足，开始清理旧数据');
        const cleaned = cleanOldChats(newChats);
        const cleanedSerialized = JSON.stringify(cleaned);
        localStorage.setItem(STORAGE_KEY, cleanedSerialized);
        setChats(cleaned);
      } else {
        localStorage.setItem(STORAGE_KEY, serialized);
        setChats(newChats);
      }
    } catch (err) {
      console.error('保存聊天历史失败:', err);
      setError('保存聊天历史失败');
    }
  }, []);

  // 清理旧聊天记录
  const cleanOldChats = useCallback((chatList: Chat[]): Chat[] => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    
    return chatList.filter(chat => {
      const chatDate = new Date(chat.updatedAt);
      return chatDate > cutoffDate || chat.isStarred; // 保留收藏的聊天
    });
  }, []);

  // 添加新聊天
  const addChat = useCallback((title: string) => {
    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isStarred: false,
    };
    saveChats([...chats, newChat]);
    return newChat.id;
  }, [chats, saveChats]);

  // 更新聊天
  const updateChat = useCallback((chatId: string, updates: Partial<Chat>) => {
    const updatedChats = chats.map(chat =>
      chat.id === chatId
        ? { ...chat, ...updates, updatedAt: new Date() }
        : chat
    );
    saveChats(updatedChats);
  }, [chats, saveChats]);

  // 删除聊天
  const deleteChat = useCallback((chatId: string) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    saveChats(updatedChats);
  }, [chats, saveChats]);

  // 切换收藏状态
  const toggleStar = useCallback((chatId: string) => {
    const updatedChats = chats.map(chat =>
      chat.id === chatId
        ? { ...chat, isStarred: !chat.isStarred, updatedAt: new Date() }
        : chat
    );
    saveChats(updatedChats);
  }, [chats, saveChats]);

  return {
    chats,
    loading,
    error,
    addChat,
    updateChat,
    deleteChat,
    toggleStar,
    cleanOldChats,
  };
};
```

**步骤 3：实现 AI 配置 Hook**

```typescript
// src/hooks/useAI.ts

import { useState, useEffect, useCallback } from 'react';
import { AIConfig } from '@/types/storage';

const STORAGE_KEY = 'yyc3_ai_config';
const CURRENT_VERSION = 1;

const DEFAULT_CONFIG: AIConfig = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  temperature: 0.7,
  version: CURRENT_VERSION,
};

export const useAI = () => {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  // 加载配置
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // 数据迁移
        if (parsed.version !== CURRENT_VERSION) {
          const migrated = migrateConfig(parsed);
          setConfig(migrated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } else {
          setConfig(parsed);
        }
      }
    } catch (err) {
      console.error('加载AI配置失败:', err);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存配置
  const saveConfig = useCallback((newConfig: AIConfig) => {
    try {
      const updated = { ...newConfig, version: CURRENT_VERSION };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setConfig(updated);
    } catch (err) {
      console.error('保存AI配置失败:', err);
      throw new Error('保存AI配置失败');
    }
  }, []);

  // 更新配置
  const updateConfig = useCallback((updates: Partial<AIConfig>) => {
    const newConfig = { ...config, ...updates };
    saveConfig(newConfig);
  }, [config, saveConfig]);

  // 清除 API 密钥
  const clearApiKey = useCallback(() => {
    const newConfig = { ...config, apiKey: '' };
    saveConfig(newConfig);
  }, [config, saveConfig]);

  return {
    config,
    loading,
    updateConfig,
    saveConfig,
    clearApiKey,
  };
};

// 配置迁移函数
function migrateConfig(oldConfig: any): AIConfig {
  let migrated = { ...oldConfig };
  
  // 版本 0 -> 1: 添加 version 字段
  if (!migrated.version) {
    migrated.version = 1;
  }
  
  // 确保所有必需字段存在
  return {
    ...DEFAULT_CONFIG,
    ...migrated,
  };
}
```

**步骤 4：实现 UI 设置 Hook**

```typescript
// src/hooks/useUISettings.ts

import { useState, useEffect, useCallback } from 'react';
import { UISettings } from '@/types/storage';

const STORAGE_KEY = 'yyc3_ui_settings';
const CURRENT_VERSION = 1;

const DEFAULT_SETTINGS: UISettings = {
  theme: 'dark',
  scanlines: 50,
  curvature: true,
  fontSize: 'medium',
  animations: true,
  version: CURRENT_VERSION,
};

export const useUISettings = () => {
  const [settings, setSettings] = useState<UISettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // 加载设置
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // 数据迁移
        if (parsed.version !== CURRENT_VERSION) {
          const migrated = migrateSettings(parsed);
          setSettings(migrated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } else {
          setSettings(parsed);
        }
      }
    } catch (err) {
      console.error('加载UI设置失败:', err);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存设置
  const saveSettings = useCallback((newSettings: UISettings) => {
    try {
      const updated = { ...newSettings, version: CURRENT_VERSION };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSettings(updated);
    } catch (err) {
      console.error('保存UI设置失败:', err);
      throw new Error('保存UI设置失败');
    }
  }, []);

  // 更新设置
  const updateSettings = useCallback((updates: Partial<UISettings>) => {
    const newSettings = { ...settings, ...updates };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // 重置为默认设置
  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  return {
    settings,
    loading,
    updateSettings,
    saveSettings,
    resetSettings,
  };
};

// 设置迁移函数
function migrateSettings(oldSettings: any): UISettings {
  let migrated = { ...oldSettings };
  
  // 版本 0 -> 1: 添加 version 字段
  if (!migrated.version) {
    migrated.version = 1;
  }
  
  // 确保所有必需字段存在
  return {
    ...DEFAULT_SETTINGS,
    ...migrated,
  };
}
```

#### 阶段二：NAS 同步实现

**步骤 5：创建 Supabase 同步 Hook**

```typescript
// src/hooks/useSupabaseSync.ts

import { useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Chat } from '@/types/storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const useSupabaseSync = (
  localChats: Chat[],
  onRemoteUpdate: (remoteChats: Chat[]) => void
) => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 上传本地聊天到 Supabase
  const syncToSupabase = useCallback(async (chats: Chat[]) => {
    try {
      const { error } = await supabase
        .from('chats')
        .upsert(
          chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            messages: chat.messages,
            created_at: chat.createdAt,
            updated_at: chat.updatedAt,
            is_starred: chat.isStarred,
          })),
          { onConflict: 'id' }
        );

      if (error) throw error;
      console.log('同步到 Supabase 成功');
    } catch (err) {
      console.error('同步到 Supabase 失败:', err);
    }
  }, [supabase]);

  // 从 Supabase 下载聊天
  const syncFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const remoteChats: Chat[] = data.map(row => ({
        id: row.id,
        title: row.title,
        messages: row.messages,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        isStarred: row.is_starred,
      }));

      onRemoteUpdate(remoteChats);
      console.log('从 Supabase 同步成功');
    } catch (err) {
      console.error('从 Supabase 同步失败:', err);
    }
  }, [supabase, onRemoteUpdate]);

  // 监听 Supabase 实时更新
  useEffect(() => {
    const subscription = supabase
      .channel('chats_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        (payload) => {
          console.log('收到远程更新:', payload);
          syncFromSupabase();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, syncFromSupabase]);

  return {
    syncToSupabase,
    syncFromSupabase,
  };
};
```

**步骤 6：在应用中集成所有 Hooks**

```typescript
// src/App.tsx

import { useEffect } from 'react';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { useAI } from '@/hooks/useAI';
import { useUISettings } from '@/hooks/useUISettings';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';

export default function App() {
  const {
    chats,
    loading: chatsLoading,
    addChat,
    updateChat,
    deleteChat,
  } = useChatPersistence();

  const {
    config: aiConfig,
    loading: aiLoading,
    updateConfig: updateAIConfig,
  } = useAI();

  const {
    settings: uiSettings,
    loading: uiLoading,
    updateSettings: updateUISettings,
  } = useUISettings();

  const { syncToSupabase } = useSupabaseSync(
    chats,
    (remoteChats) => {
      // 处理远程更新
      console.log('远程聊天已更新:', remoteChats);
    }
  );

  // 当本地聊天更新时，同步到 Supabase
  useEffect(() => {
    if (chats.length > 0) {
      syncToSupabase(chats);
    }
  }, [chats, syncToSupabase]);

  if (chatsLoading || aiLoading || uiLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="app">
      {/* 应用内容 */}
    </div>
  );
}
```

#### 阶段三：安全与最佳实践

**步骤 7：实现数据验证**

```typescript
// src/utils/validation.ts

import { Chat, AIConfig, UISettings } from '@/types/storage';

// 验证聊天数据
export function validateChat(data: any): data is Chat {
  return (
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    Array.isArray(data.messages) &&
    data.createdAt instanceof Date &&
    data.updatedAt instanceof Date &&
    typeof data.isStarred === 'boolean'
  );
}

// 验证 AI 配置
export function validateAIConfig(data: any): data is AIConfig {
  return (
    ['openai', 'ollama', 'anthropic'].includes(data.provider) &&
    typeof data.apiKey === 'string' &&
    typeof data.baseUrl === 'string' &&
    typeof data.model === 'string' &&
    typeof data.temperature === 'number' &&
    data.temperature >= 0 &&
    data.temperature <= 2
  );
}

// 验证 UI 设置
export function validateUISettings(data: any): data is UISettings {
  return (
    typeof data.theme === 'string' &&
    typeof data.scanlines === 'number' &&
    typeof data.curvature === 'boolean' &&
    ['small', 'medium', 'large'].includes(data.fontSize) &&
    typeof data.animations === 'boolean'
  );
}

// 安全的 JSON 解析
export function safeJSONParse<T>(json: string, validator: (data: any) => data is T): T | null {
  try {
    const parsed = JSON.parse(json);
    return validator(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
```

**步骤 8：实现错误处理和日志**

```typescript
// src/utils/errorHandler.ts

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly key: string,
    public readonly operation: 'read' | 'write' | 'delete'
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export function handleStorageError(
  error: unknown,
  key: string,
  operation: 'read' | 'write' | 'delete'
): void {
  if (error instanceof StorageError) {
    console.error(`存储错误 [${operation} ${key}]:`, error.message);
  } else if (error instanceof Error) {
    console.error(`未知错误 [${operation} ${key}]:`, error.message);
  } else {
    console.error(`未知错误类型 [${operation} ${key}]:`, error);
  }
}

// 存储使用情况监控
export function getStorageUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  let used = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length;
    }
  }
  
  const total = 5 * 1024 * 1024; // 5MB 限制
  const percentage = (used / total) * 100;
  
  return { used, total, percentage };
}
```

### 📊 实施检查清单

#### 基础功能 ✅

- [ ] 创建 TypeScript 类型定义
- [ ] 实现 `useChatPersistence` hook
- [ ] 实现 `useAI` hook
- [ ] 实现 `useUISettings` hook
- [ ] 添加数据验证逻辑
- [ ] 实现错误处理机制
- [ ] 添加存储使用监控

#### 高级功能 ✅

- [ ] 实现 `useSupabaseSync` hook
- [ ] 添加实时同步监听
- [ ] 实现数据迁移机制
- [ ] 添加冲突解决策略
- [ ] 实现离线支持

#### 安全性 ✅

- [ ] API 密钥加密存储
- [ ] 敏感数据脱敏
- [ ] 输入验证和清理
- [ ] 安全审计日志
- [ ] 权限控制

#### 性能优化 ✅

- [ ] 实现数据分页加载
- [ ] 添加缓存策略
- [ ] 优化存储大小
- [ ] 实现懒加载
- [ ] 添加性能监控

### 🚀 部署建议

1. **开发环境**：使用 localStorage 进行本地开发
2. **测试环境**：启用 Supabase 同步进行跨设备测试
3. **生产环境**：
   - 默认使用 localStorage
   - 提供可选的云端同步
   - 实现数据备份和恢复
   - 添加数据导出功能

### 📝 注意事项

1. **存储限制**：localStorage 有 5MB 限制，需要定期清理
2. **数据安全**：API 密钥明文存储，仅适用于本地工具
3. **性能考虑**：大量数据会影响加载速度，考虑分页或虚拟滚动
4. **浏览器兼容性**：确保在目标浏览器中 localStorage 可用
5. **隐私保护**：遵守数据隐私法规，提供数据删除选项
        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
完成了！我已经为您提供了完整的YYC3本地存储与数据持久化架构的中文翻译和详细的操作指导。

## 📚 内容总结

### ✅ 已完成的工作

1. **完整中文翻译** - 将原始英文文档准确翻译为中文，保持技术术语的准确性

2. **详细操作指导** - 包含三个实施阶段：
   - **阶段一：基础数据存储实现** - 完整的TypeScript类型定义、三个核心Hooks（useChatPersistence、useAI、useUISettings）
   - **阶段二：NAS同步实现** - Supabase集成、实时同步、跨设备数据同步
   - **阶段三：安全与最佳实践** - 数据验证、错误处理、存储监控

3. **实用工具** - 提供了完整的代码示例，包括：
   - 数据验证函数
   - 错误处理机制
   - 存储使用监控
   - 数据迁移策略

4. **实施检查清单** - 涵盖基础功能、高级功能、安全性、性能优化四个维度

5. **部署建议** - 针对开发、测试、生产环境的具体建议

6. **注意事项** - 存储限制、数据安全、性能考虑等关键提醒

## 🎯 核心特性

- **本地优先策略** - 零延迟交互，即时访问
- **可选云端同步** - 支持跨设备数据同步
- **自动数据清理** - 30天数据保留策略
- **版本控制** - 支持数据结构迁移
- **安全存储** - 敏感数据处理建议
- **性能优化** - 5MB存储限制管理

## 📖 使用指南

您可以直接使用提供的代码示例来实施完整的本地存储系统：

1. 复制类型定义到 `src/types/storage.ts`
2. 实现三个核心Hooks
3. 集成到主应用中
4. 根据需要启用NAS同步

所有代码都遵循YYC³标准化要求，包含完整的类型定义、错误处理和最佳实践。