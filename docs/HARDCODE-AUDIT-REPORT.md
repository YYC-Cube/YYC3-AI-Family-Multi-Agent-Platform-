# YYC³ AI Family — 硬编码内容全局审计报告

> 审计日期: 2026-03-07  
> 审计范围: 全项目 `*.ts` / `*.tsx` 文件  
> 分类: 8 大类 · 170+ 硬编码点位

---

## 一、审计总览

| 类别 | 标识 | 命中数 | 风险等级 | 影响面 |
|------|------|--------|----------|--------|
| 🌐 网络地址/端口 | `HC-NET` | 50+ | 🔴 高 | 部署迁移失败、跨环境不可用 |
| 🖥️ 设备信息 | `HC-DEV` | 13 | 🟡 中 | 设备拓扑与实际不符、IP 泄露 |
| 🤖 模型系统 | `HC-MOD` | 51+ | 🔴 高 | 模型切换需改代码、无法动态调配 |
| 💾 存储键名 | `HC-STG` | 29 | 🟡 中 | 键名冲突、版本迁移困难 |
| 🔑 API 密钥/凭据 | `HC-KEY` | 56+ | 🔴 高 | 密钥泄露风险、环境隔离失败 |
| 📌 版本号 | `HC-VER` | 30 | 🟢 低 | 版本不同步、显示过时 |
| ⏱️ 超时/延迟魔数 | `HC-TMO` | 27 | 🟡 中 | 不同网络环境体验差异大 |
| 🗄️ 数据库连接串 | `HC-DB` | 5 | 🔴 高 | 凭据明文、端口绑定、环境不可移植 |

---

## 二、逐类详情

### 🌐 HC-NET: 网络地址/端口（50+ 处）

**核心问题**: `localhost:3080` 散布于前端组件、hooks、services 各处，部署到非本地环境时全部失效。

| # | 文件 | 行 | 硬编码值 | 用途 | 建议修复 |
|---|------|----|---------|------|---------|
| 1 | `/services/backend-bridge.ts` | 32-33 | `ws://localhost:3080` / `http://localhost:3080` | WS/REST 默认配置 | ✅ 已有 `DEFAULT_CONFIG`，需改为读取环境变量 |
| 2 | `/services/agent-router.ts` | 36-63 | `http://localhost:3080/api/agent/*` ×5 | 5 个角色端点 | 应基于 `BackendConfig.apiUrl` 动态拼接 |
| 3 | `/hooks/useBigModel.ts` | 33, 257 | `http://localhost:3080` | API 代理默认值 | 引用 `DEFAULT_CONFIG.apiUrl` |
| 4 | `/hooks/useFamilySystem.ts` | 596, 825 | `http://localhost:3080` | KB 搜索 + 状态文案 | 引用集中配置 |
| 5 | `/hooks/useAI.ts` | 11 | `http://localhost:11434/v1` | Ollama 默认 URL | 移至配置常量 |
| 6 | `/hooks/useChannelConfig.ts` | 17, 36 | `http://localhost:11434/v1` ×2 | 频道 AI 默认配置 | 引用统一 `OLLAMA_DEFAULT_URL` |
| 7 | `/hooks/useFileSync.ts` | 205 | `http://localhost:3080` | 文件同步 API | 引用 `DEFAULT_CONFIG.apiUrl` |
| 8 | `/components/family/BackendPanel.tsx` | 154, 681, 716, 725, 748 | `localhost:3080` / `localhost:5432` | UI 显示 + placeholder | 部分可保留为 placeholder，API 调用必须动态化 |
| 9 | `/components/family/TechAuditPanel.tsx` | 141, 148, 164, 232, 373 | `ws://localhost:3080` ×5 | 审计报告文案 | 文档性硬编码，标注 `[CONFIG_DEPENDENT]` |
| 10 | `/components/family/KnowledgeBasePanel.tsx` | 193 | `http://localhost:3080` | apiUrl 默认参数 | 引用集中配置 |
| 11 | `/components/family/IntegratedTerminal.tsx` | 260 | `http://localhost:3080` | apiUrl 默认参数 | 引用集中配置 |
| 12 | `/components/SettingsModal.tsx` | 276, 303 | `http://localhost:11434/v1` | Ollama preset + placeholder | placeholder 可保留，preset 应引用常量 |
| 13 | `/components/collaboration/CodeDetailPanel.tsx` | 66-67 | `localhost:5173` / `192.168.1.100:5173` | Mock 终端输出 | Mock 数据可接受，但应标注 |
| 14 | `/components/ArtifactsPanel.tsx` | 134 | `localhost:8080/deploy/v1` | 部署地址文案 | 移至配置 |
| 15 | `/bun-server/config.ts` | 130, 311, 315, 400, 413 | 多服务 localhost 默认值 | 后端配置兜底 | ✅ 已通过 `env()` 包装，**合规**（最佳实践） |
| 16 | `/bun-server/db-init.ts` | 41 | `postgresql://yyc3_max:yyc3_max@localhost:5433/postgres` | 数据库初始化 | 🔴 必须改为 `env("DATABASE_URL")` |

**影响分析:**
- 前端 13 个文件约 35 处 `localhost` 调用，**部署到远程服务器或 Docker 容器后全部失效**
- `agent-router.ts` 5 个端点最严重 — 每个角色的 LLM 调用路径全部硬编码
- 后端 `config.ts` 使用了 `env()` 兜底模式，是正确做法，其他文件应效仿

---

### 🖥️ HC-DEV: 设备信息（13 处）

**核心问题**: Apple 设备型号、IP 地址、硬件规格全部硬编码为开发者个人设备信息。

| # | 文件 | 硬编码内容 | 说明 |
|---|------|-----------|------|
| 1 | `/components/family/NetworkTopology.tsx:38-42` | `M4 Max (Master)` / `iMac M4 (Studio)` / `M4 Pro (Gate)` / `MateBook (Mobile)` / `NAS YanYuCloud` | 5 台设备名称 + IP |
| 2 | `/hooks/useFamilySystem.ts:62-94` | `MacBook M4 Max` / `16P+40E / 128GB / 4TB` / `192.168.50.10-13, 50.100` | 5 个家族成员的完整设备绑定 |
| 3 | `/bun-server/config.ts:401` | `M4 Max 16P cores → 20 is sweet spot` | 注释中绑定特定硬件 |
| 4 | `/tests/p1-family-member-state-migration.test.ts:298-302` | `MacBook M4 Max` / `192.168.50.10` | 测试用 mock 数据 |

**影响分析:**
- **隐私风险**: 内网 IP 段 `192.168.50.*` 暴露了开发者家庭网络拓扑
- **可移植性**: 任何新用户或新设备加入后，需直接改代码才能更新拓扑图
- **建议**: 设备信息应从配置文件 `/config/devices.json` 或后端 API 动态获取

---

### 🤖 HC-MOD: 模型系统（51+ 处）

**核心问题**: 模型 ID 字符串散布于 12+ 文件，模型新增/切换需全文件搜索修改。

| 分组 | 文件 | 硬编码值 | 次数 |
|------|------|---------|------|
| **前端默认模型** | `UserAIPanel.tsx:107-111` | `glm-4-plus` / `codegeex-4` / `deepseek-coder` / `glm-4-flash` / `ollama-local` | 5 |
| **前端默认参数** | `UserAIPanel.tsx:126` / `useBigModel.ts:76,157` | `activeModelId = 'glm-4-plus'` 默认值 | 3 |
| **角色→模型映射** | `agent-router.ts:33-63` | 5 个角色各绑定一个模型 ID | 5 |
| **后端角色映射** | `bun-server/config.ts:194-200` | `DEFAULT_ROLE_MODELS` 7 个角色 | 7 |
| **模型列表** | `SettingsModal.tsx:46-50` | 5 个 provider 各自的模型列表 | ~15 |
| **模板 Mock 数据** | `project-templates.ts:781-793` | AI Family mock 中的 model 字段 | 5 |
| **SDK 模型目录** | `bigmodel-sdk/tools/chat-completion.ts:16-27` | `TEXT_MODELS` / `CODE_MODELS` 数组 | ~12 |
| **Dev Studio** | `AIAssistantPanel.tsx:48` | `glm-4-plus` 默认 | 1 |
| **类型注释** | `protocol.ts:123` / `bigmodel-hooks.ts:68` | 注释中的默认值 | 2 |

**影响分析:**
- 新增一个 LLM 模型需修改 **至少 6 个文件**
- 角色-模型映射存在 **双源**：`agent-router.ts`（前端）与 `config.ts`（后端），可能不同步
- `SettingsModal.tsx` 的模型列表与 `bigmodel-sdk` 的模型目录**各自独立维护**，容易漏更新
- **建议**: 创建 `/config/models.ts` 单一源头，导出 `MODEL_CATALOG`、`ROLE_MODEL_MAP`、`PROVIDER_MODELS`

---

### 💾 HC-STG: 存储键名（29 处）

**核心问题**: localStorage 键名分散在各 hook 中，无统一注册表。

| 文件 | 键名 | 用途 |
|------|------|------|
| `/hooks/useAI.ts:5` | `yyc3_ai_config` | AI 配置 |
| `/hooks/useUISettings.ts:5` | `yyc3_ui_settings` | UI 设置 |
| `/hooks/useChannelManager.ts:3` | `yyc3_channels_meta` | 频道元数据 |
| `/hooks/useChannelConfig.ts:3` | `yyc3_config_${channelId}` | 频道 AI 配置 |
| `/hooks/useChatPersistence.ts:11` | `yyc3_chat_history` / `yyc3_chat_history_${id}` | 聊天记录 |
| `/hooks/useBackendConnection.ts:46` | `yyc3_backend_config` | 后端连接配置 |
| `/hooks/useDraggablePanels.ts:24` | `yyc3-panel-layout` | 面板布局 |
| `/components/family/IntegratedTerminal.tsx:79` | `yyc3_terminal_state` | 终端状态 |
| `/types/terminal.ts:138` | `yyc3_terminal_state`（重复声明） | 终端状态常量 |
| `/components/collaboration/CodeDetailPanel.tsx:96` | `yyc3-panel-layout`（重复引用） | 面板布局 |
| `/components/SettingsModal.tsx:151` | `yyc3_config_${id}` | 预设配置 |

**影响分析:**
- **键名冲突**: `yyc3-panel-layout` 在 `useDraggablePanels.ts` 和 `CodeDetailPanel.tsx` 中各自读取，可能互相覆盖
- **不一致命名**: 混用 `yyc3_` (下划线) 和 `yyc3-` (短横线) 两种风格
- **无版本迁移**: 仅 `useAI.ts` 和 `useUISettings.ts` 有版本号校验，其他键无迁移策略
- **测试盲区**: 无清理工具，localStorage 残留数据可能导致诡异 bug
- **建议**: 创建 `/types/storage.ts` 统一导出 `STORAGE_KEYS` 枚举对象

---

### 🔑 HC-KEY: API 密钥/凭据（56+ 处）

**核心问题**: 前端代码中存在默认 API 密钥值和数据库凭据。

| 风险级别 | 文件 | 内容 | 说明 |
|----------|------|------|------|
| 🔴 **严重** | `/bun-server/db-init.ts:41` | `postgresql://yyc3_max:yyc3_max@localhost:5433/postgres` | **明文数据库用户名密码** |
| 🔴 **严重** | `/bun-server/config.ts:400` | `postgresql://yyc3_max:yyc3_max@localhost:5433/yyc3_family` | 同上，env 兜底值含密码 |
| 🟡 **中等** | `/hooks/useAI.ts:10` | `apiKey: 'ollama'` | Ollama 无需真 key，但模式不佳 |
| 🟡 **中等** | `/hooks/useChannelConfig.ts:16` | `apiKey: "ollama"` | 同上 |
| 🟢 **低** | `/components/SettingsModal.tsx:349` | `placeholder="sk-..."` | UI placeholder，可接受 |
| 🟢 **低** | 后端 `config.ts:68-88` | `process.env.*_API_KEY` | ✅ 正确读取环境变量 |

**影响分析:**
- `db-init.ts` 中 **明文数据库密码** 是最严重问题，即使是开发环境也不应硬编码
- 前端 `apiKey: 'ollama'` 语义正确（Ollama 本地不需认证），但代码审查工具会标记
- 后端 `config.ts` 的 `env()` 模式是正确实践，但 DATABASE_URL 的 fallback 值含密码

---

### 📌 HC-VER: 版本号（30 处）

| 文件 | 硬编码值 | 出现次数 |
|------|---------|---------|
| `/hooks/useFamilySystem.ts` | `metadata: { version: '1.0.0' }` | 16 次 |
| `/hooks/useCollaborativeEditing.ts` | `metadata: { version: '1.0.0' }` | 3 次 |
| `/components/family/*.tsx` | `v1.0` / `V1.0` / `v3.0.4` | 6 次 |
| `/components/collaboration/CodeDetailPanel.tsx` | `v1.0` | 2 次 |
| `/layouts/CollaborationLayout.tsx` | `v3.0` | 1 次 |

**影响分析:**
- `useFamilySystem.ts` 中 16 处 `version: '1.0.0'` — 升级协议版本需改 16 处
- UI 显示版本与协议版本**不同源**: 前者在组件中硬编码，后者在 metadata 中
- **建议**: 创建 `APP_VERSION` 和 `PROTOCOL_VERSION` 常量，全局引用

---

### ⏱️ HC-TMO: 超时/延迟魔数（27 处）

| 常见魔数值 | 出处 | 含义 |
|-----------|------|------|
| `2000` ms | 8+ 处 | 复制成功提示 / AI 响应超时 / 连接超时 |
| `800` ms | 2 处 | Preview 自动刷新防抖 |
| `5000` ms | 3 处 | CRDT pending 超时 / blob 回收 / SQLite busy |
| `30000` ms | 3 处 | WebSocket 重连上限 / BigModel SDK 超时 |
| `1500` ms | 1 处 | Mock AI 响应延迟 |
| `100` ms | 3 处 | UI 聚焦延迟 |
| `3000` ms | 2 处 | WebSocket 重连间隔 / Git 状态动画 |

**影响分析:**
- 魔数分散，调整体验需逐个查找
- 弱网环境下 `2000ms` 超时可能不够，但无集中配置入口
- **建议**: 创建 `/config/timing.ts` 导出 `TIMEOUTS`、`DELAYS`、`DEBOUNCE` 常量组

---

### 🗄️ HC-DB: 数据库连接串（5 处）

| 文件 | 内容 | 风险 |
|------|------|------|
| `/bun-server/config.ts:400` | `postgresql://yyc3_max:yyc3_max@localhost:5433/yyc3_family` | 🔴 env fallback 含明文密码 |
| `/bun-server/db-init.ts:41` | `postgresql://yyc3_max:yyc3_max@localhost:5433/postgres` | 🔴 直接硬编码 |
| `/bun-server/db.ts:5-6` | 注释中的连接信息 | 🟡 文档性暴露 |
| `/components/family/BackendPanel.tsx:681` | `postgresql://localhost:5432/yyc3` | 🟡 UI 显示，端口还与实际不一致 (5432 vs 5433) |
| `/bun-server/config.ts:413` | `redis://localhost:6379` | 🟢 env fallback，无密码 |

**影响分析:**
- `yyc3_max:yyc3_max` 用户名密码**绝对不可提交到公开仓库**
- BackendPanel 中显示的是 `:5432` 而实际配置用 `:5433`，信息不一致
- Redis 默认无密码，risk 较低但生产环境需配置 `REDIS_PASSWORD`

---

## 三、修复优先级矩阵

| 优先级 | 编号 | 修复项 | 影响文件数 | 工时估算 |
|--------|------|--------|-----------|---------|
| 🔴 P0 | FIX-001 | 数据库连接串移除明文密码，强制使用 `env()` | 2 | 0.5h |
| 🔴 P0 | FIX-002 | 创建 `/config/endpoints.ts`，集中 `API_BASE_URL`/`WS_URL`/`OLLAMA_URL` | 13 | 2h |
| 🔴 P0 | FIX-003 | 创建 `/config/models.ts`，统一 `MODEL_CATALOG`/`ROLE_MODEL_MAP` | 8 | 2h |
| 🟡 P1 | FIX-004 | 统一 localStorage 键名到 `/types/storage.ts` 的 `STORAGE_KEYS` | 10 | 1.5h |
| 🟡 P1 | FIX-005 | 设备信息从硬编码改为可配置 `/config/devices.ts` 或后端 API | 3 | 1h |
| 🟡 P1 | FIX-006 | 创建 `/config/timing.ts` 集中超时/延迟/防抖常量 | 15+ | 1.5h |
| 🟡 P1 | FIX-007 | 创建 `APP_VERSION` / `PROTOCOL_VERSION` 常量 | 20+ | 1h |
| 🟢 P2 | FIX-008 | 统一存储键命名风格（全部改为 `yyc3:` 命名空间前缀） | 10 | 1h |
| 🟢 P2 | FIX-009 | BackendPanel 的 `:5432` 改为与 config 一致的 `:5433` | 1 | 0.1h |
| 🟢 P2 | FIX-010 | TechAuditPanel 文案中的 localhost 加 `[可配置]` 标注 | 1 | 0.2h |

---

## 四、建议配置文件架构

```
/config/
  ├── endpoints.ts        # API_BASE_URL, WS_URL, OLLAMA_URL, etc.
  ├── models.ts           # MODEL_CATALOG, ROLE_MODEL_MAP, PROVIDER_MODELS
  ├── devices.ts          # DEVICE_NODES (可被后端 API 覆盖)
  ├── timing.ts           # TIMEOUTS, DELAYS, DEBOUNCE_MS
  ├── version.ts          # APP_VERSION, PROTOCOL_VERSION, BUILD_INFO
  └── index.ts            # 统一导出
```

```typescript
// /config/endpoints.ts 示例
const env = (key: string, fallback: string) =>
  typeof process !== 'undefined' ? process.env[key] || fallback : fallback

export const ENDPOINTS = {
  API_BASE: env('VITE_API_BASE_URL', 'http://localhost:3080'),
  WS_BASE:  env('VITE_WS_BASE_URL', 'ws://localhost:3080'),
  OLLAMA:   env('VITE_OLLAMA_URL', 'http://localhost:11434/v1'),
} as const

export const buildAgentEndpoint = (roleId: string) =>
  `${ENDPOINTS.API_BASE}/api/agent/${roleId.toLowerCase().replace(/_/g, '-')}`
```

---

## 五、总结

本次审计覆盖 **170+ 硬编码点位**，分布于 **30+ 文件**。主要风险集中在：

1. **网络地址** — `localhost:3080` 散布 13 个前端文件，直接阻碍远程部署
2. **数据库凭据** — `yyc3_max:yyc3_max` 明文密码存在于 2 个后端文件
3. **模型 ID** — 12+ 文件各自维护模型列表，新增模型需改 6+ 处

建议执行顺序：**FIX-001 → FIX-002 → FIX-003 → FIX-004 → FIX-005**，预计总工时约 **10 小时**，可显著提升项目的可部署性、可维护性和安全性。

---

> *审计工具: Figma Make AI + file_search 全局正则检索*  
> *审计标准: 五化一体 · 标准化维度 · GB/T 35273 个人信息安全规范*
