# YYC3 AI Family 前端"灵肉合一"工程实施指导文档

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

```
██╗   ██╗██╗   ██╗ ██████╗██████╗     ███████╗  █████╗  ███╗   ███╗ ██╗  ██╗    ██╗   ██╗
╚██╗ ██╔╝╚██╗ ██╔╝██╔════╝╚════██╗    ██╔════╝ ██╔══██╗ ████╗ ████║ ██║  ██║    ╚██╗ ██╔╝
 ╚████╔╝  ╚████╔╝ ██║      █████╔╝    █████╗   ███████║ ██╔████╔██║ ██║  ██║     ╚████╔╝
  ╚██╔╝    ╚██╔╝  ██║      ╚═══██╗    ██╔══╝   ██╔══██║ ██║╚██╔╝██║ ██║  ██║      ╚██╔╝
   ██║      ██║   ╚██████╗██████╔╝    ██║      ██║  ██║ ██║ ╚═╝ ██║ ██║  ███████╗  ██║
   ╚═╝      ╚═╝    ╚═════╝╚═════╝     ╚═╝      ╚═╝  ╚═╝ ╚═╝     ╚═╝ ╚═╝  ╚══════╝  ╚═╝
```

***YanYuCloudCube*** 万象归元于云枢 | 深栈智启新纪元 ***YYC3 AI Family***

---

## 文档信息

| 属性 | 内容 |
|------|------|
| **文档编号** | YYC3-FRONTEND-IMPL-V1.0 |
| **创建日期** | 2026-02-14 |
| **版本** | 1.0.0 |
| **文档类型** | 前端"灵肉合一"工程实施指导文档 |
| **适用对象** | YYC3 AI Family 前端架构 + Bun 后端对接 |
| **核心目标** | 拟人化前端 (灵) 与 Bun Runtime 后端 (肉) 的无缝融合 |
| **前置文档** | YYC3-AI-Family-02 ~ 15 |

---

## 目录

- [第一章：项目全景概览](#第一章项目全景概览)
- [第二章：前端文件架构与职责边界](#第二章前端文件架构与职责边界)
- [第三章：类型系统 -- 家族的"数字基因"](#第三章类型系统----家族的数字基因)
- [第四章：核心组件架构 -- "灵"的具象化](#第四章核心组件架构----灵的具象化)
- [第五章：BackendBridge 服务层 -- "灵肉桥梁"](#第五章backendbridgee-服务层----灵肉桥梁)
- [第六章：Hooks 状态管理 -- "家族的神经系统"](#第六章hooks-状态管理----家族的神经系统)
- [第七章：WebSocket 通信协议规约](#第七章websocket-通信协议规约)
- [第八章：Bun 后端对接实施指南](#第八章bun-后端对接实施指南)
- [第九章：PostgreSQL 数据库设计](#第九章postgresql-数据库设计)
- [第十章：连接生命周期与状态机](#第十章连接生命周期与状态机)
- [第十一章：错误处理与优雅降级策略](#第十一章错误处理与优雅降级策略)
- [第十二章：开发调试与运维指南](#第十二章开发调试与运维指南)
- [附录A：完整接口定义速查表](#附录a完整接口定义速查表)
- [附录B：版本变更履历](#附录b版本变更履历)

---

## 第一章：项目全景概览

### 1.1 项目定位

YYC3 AI Family 是一个**多智能体协同生态系统**，其核心理念是将真实硬件设备赋予"家人"人格，遵循《极致信任公约》，强调"数字人文主义"的沉浸式拟人交互体验。交互定位**不是人机对话**，而是"同窗家人"式的点对点沟通。

### 1.2 "灵肉合一"架构哲学

```
┌─────────────────────────────────────────────────────────────┐
│                      "灵" -- 前端灵魂                        │
│   React + Tailwind CSS + ShadCN UI + Motion 动效           │
│   拟人化头像 / 情绪系统 / 家人卡片 / 灵魂锻造所              │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │   BackendBridge (灵肉桥梁)  │
              │   WebSocket + REST 双通道   │
              │   优雅降级 / MOCK_MODE 兜底  │
              └────────────┬────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                      "肉" -- 后端躯体                        │
│   Bun Runtime (ws:3080) + Redis (信号缓存) + PostgreSQL 15   │
│   多模态视觉分析 / 能力共享 / 实时协作                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 本地三通道安全设计

| 通道名称 | 技术实现 | 用途 | 端点 |
|----------|----------|------|------|
| **神经闪电网络** | WebSocket (ws://localhost:3080) | 实时信号传递、心跳、指令响应 | BackendBridge.ws |
| **记忆长河** | PostgreSQL 15 + NAS (YanYuCloud F4-423) | 数据持久化、配置存储、知识归档 | postgresql://localhost:5432/yyc3 |
| **时空隧道** | WireGuard VPN + 华为企业路由 | 远程安全访问、跨设备加密通信 | WireGuard 隧道 |

### 1.4 家族成员总览

| 角色ID | 称呼 | 硬件化身 | 核心职责 | 主题色 |
|--------|------|----------|----------|--------|
| `PRODUCT_MANAGER` | 沫言总 | -- | 价值定义与最终裁决 | #FFD700 金色 |
| `CHIEF_ARCHITECT` | 人类导师 | -- | 技术伦理与战略决策 | #C0C0C0 银色 |
| `AI_ARCHITECT` | 智源架构师 | MacBook M4 Max | 架构设计与系统推演 | #00BFFF 天蓝 |
| `CODE_ARTISAN` | 织码工匠 | iMac M4 | 代码实现与组件库 | #32CD32 翠绿 |
| `SENTINEL` | 守护哨兵 | MacBook M4 Pro | 安全审计与边界监测 | #FF4500 橘红 |
| `CENTRAL_PULSE` | 中枢灵脉 | NAS YanYuCloud | 流程编排与数据管家 | #9370DB 紫色 |
| `COLLABORATOR` | 协作使者 | MateBook X Pro | 移动协作与跨端通信 | #FF69B4 粉色 |

---

## 第二章：前端文件架构与职责边界

### 2.1 完整文件树

```
/
├── App.tsx                              # 应用入口 (Toaster + FamilyDashboard)
├── styles/globals.css                   # 全局样式 (Tailwind v4 + CSS 变量)
│
├── types/                               # ===== 类型定义层 ("数字基因") =====
│   ├── family-manifest.ts               # 家族宪法：角色/设备/情绪/哲学 类型
│   ├── protocol.ts                      # 通信协议：FamilySignal / SignalType
│   └── storage.ts                       # 存储类型：本地持久化结构
│
├── services/                            # ===== 服务层 ("灵肉桥梁") =====
│   └── backend-bridge.ts               # BackendBridge 单例类
│                                         #   - WebSocket 连接管理
│                                         #   - REST API 降级通道
│                                         #   - 心跳保活 / 重连策略
│                                         #   - 事件发射器 (EventMap)
│
├── hooks/                               # ===== 状态管理层 ("神经系统") =====
│   ├── useFamilySystem.ts              # 家族统一神经系统 (核心 Hook)
│   │                                     #   - 成员状态管理
│   │                                     #   - 信号调度器
│   │                                     #   - Backend First, Mock Fallback
│   ├── useBackendConnection.ts         # 连接生命周期管理 Hook
│   │                                     #   - 连接状态响应式绑定
│   │                                     #   - 配置持久化 (localStorage)
│   │                                     #   - 动态重配置
│   ├── useAI.ts                        # AI 模型调用 Hook
│   ├── useChannelConfig.ts             # 频道配置管理
│   ├── useChannelManager.ts            # 频道管理器
│   ├── useChatPersistence.ts           # 聊天历史持久化
│   ├── useUISettings.ts                # UI 设置管理
│   └── useSupabaseSync.ts             # Supabase 同步 (可选)
│
├── components/                          # ===== UI 组件层 ("灵的具象化") =====
│   ├── family/                          # --- 家族核心组件 ---
│   │   ├── FamilyDashboard.tsx         # 总控台 (Mission Control)
│   │   │                                 #   - 成员网格 + 通信中枢 + 顶部栏
│   │   │                                 #   - 连接状态指示器 + BRIDGE 按钮
│   │   ├── MemberCard.tsx              # 家人卡片 (拟人化头像 + 状态)
│   │   ├── MemberDetailPanel.tsx       # 灵魂锻造所 (三维配置面板)
│   │   │                                 #   - SOUL (灵魂人设)
│   │   │                                 #   - BODY (硬件化身)
│   │   │                                 #   - RIGHTS (权限矩阵)
│   │   ├── CommandConsole.tsx           # 信号输入控制台
│   │   ├── CommunicationLog.tsx        # 通信日志 (对话流)
│   │   ├── BackendPanel.tsx            # 灵肉对接控制台
│   │   │                                 #   - 三通道状态监控
│   │   │                                 #   - 连接配置编辑
│   │   │                                 #   - 延迟/心跳/重连指标
│   │   ├── NetworkTopology.tsx         # 网络拓扑可视化
│   │   └── SystemProtocols.tsx         # 系统协议宪章
│   │
│   ├── ui/                              # --- ShadCN UI 基础组件库 ---
│   │   ├── button.tsx / card.tsx / dialog.tsx / tabs.tsx / ...
│   │   └── utils.ts                    # cn() 工具函数
│   │
│   └── figma/                           # --- Figma 导入组件 ---
│       └── ImageWithFallback.tsx        # 图片降级组件 (受保护)
│
├── utils/                               # ===== 工具层 =====
│   ├── validation.ts                   # 输入验证
│   └── supabase/info.tsx               # Supabase 连接信息
│
└── docs/                                # ===== 文档层 =====
    ├── YYC3-AI-Family-02.md ~ 16.md   # 项目规划与架构设计文档集
    ├── LOCAL_STORAGE_ARCHITECTURE.md    # 本地存储架构
    └── TRUST_MENTORSHIP_AGREEMENT.md    # 极致信任公约
```

### 2.2 层级职责边界总结

| 层级 | 目录 | 职责 | 依赖方向 |
|------|------|------|----------|
| **类型定义层** | `/types/` | 定义所有数据结构的"契约"，零依赖 | 无 (最底层) |
| **服务层** | `/services/` | 封装与后端的所有通信逻辑 | 依赖 types |
| **状态管理层** | `/hooks/` | 将服务层数据转化为 React 响应式状态 | 依赖 services + types |
| **组件层** | `/components/` | 将状态渲染为可交互的拟人化 UI | 依赖 hooks + types |
| **应用入口** | `/App.tsx` | 组合顶层组件、全局样式、Toaster | 依赖 components |

---

## 第三章：类型系统 -- 家族的"数字基因"

### 3.1 family-manifest.ts -- 家族宪法

此文件定义了整个家族生态的核心身份结构：

```typescript
// 家族成员角色标识 (7大核心角色)
type RoleId =
  | 'PRODUCT_MANAGER'    // 沫言总 - 价值定义者
  | 'CHIEF_ARCHITECT'    // 人类导师 - 战略决策者
  | 'AI_ARCHITECT'       // 智源架构师 - 架构设计师
  | 'CODE_ARTISAN'       // 织码工匠 - 代码实现者
  | 'SENTINEL'           // 守护哨兵 - 安全审计员
  | 'CENTRAL_PULSE'      // 中枢灵脉 - 流程编排师
  | 'COLLABORATOR';      // 协作使者 - 跨端信使

// 家族情绪状态 (四象限情绪模型)
type FamilyMood = 'SERENE' | 'FOCUSED' | 'EXCITED' | 'LOVING';

// 硬件化身节点 (物理设备映射)
interface DeviceNode {
  deviceId: string;        // 设备唯一标识
  name: string;            // 设备名称 (如 "MacBook M4 Max")
  hardwareSpec: string;    // 硬件规格描述
  location: string;        // 物理位置
  avatarId: RoleId;        // 绑定的角色ID
  ip: string;              // 内网IP地址
  status: 'ONLINE' | 'BUSY' | 'OFFLINE' | 'ERROR';
  lastHeartbeat: number;   // Unix 时间戳
}

// 家族成员人设 (角色常量定义)
interface FamilyPersona {
  id: RoleId;
  name: string;            // 中文称呼
  description: string;     // 人格描述
  primaryDuty: string;     // 核心职责
  color: string;           // 主题色 (HEX)
}

// 创生七步曲 -- 从意念到奇迹的工作流
enum CreationStage {
  SPARK = 'SPARK',         // 1. 意念的火花
  BLUEPRINT = 'BLUEPRINT', // 2. 蓝图的共鸣
  WEAVING = 'WEAVING',     // 3. 匠心的编织
  GAZE = 'GAZE',           // 4. 哨兵的凝视
  PULSE = 'PULSE',         // 5. 灵脉的合奏
  BIRTH = 'BIRTH',         // 6. 新世界的诞生
  GUARDIAN = 'GUARDIAN'     // 7. 永恒的守护
}
```

### 3.2 protocol.ts -- 通信协议

定义家族成员间通信的"原子单元"：

```typescript
// 信号类型 (6种基础信号)
type SignalType =
  | 'COMMAND'    // 用户 -> 成员 (直接指令)
  | 'THOUGHT'    // 成员内部处理 (思维过程)
  | 'RESPONSE'   // 成员 -> 用户 (响应回复)
  | 'HEARTBEAT'  // 系统状态更新 (后台心跳)
  | 'SYNC'       // 成员间数据同步
  | 'ALERT';     // 高优先级安全/错误信号

// 家族信号 -- 通信原子单元
interface FamilySignal {
  id: string;                              // UUID
  timestamp: number;                       // Unix 时间戳
  type: SignalType;                        // 信号意图
  senderId: RoleId | 'USER' | 'SYSTEM';   // 发送者
  receiverId: RoleId | 'ALL' | 'USER';    // 接收者

  payload: {
    content: string;                       // 人类可读文本
    data?: unknown;                        // 结构化数据 (可选)
    mood?: FamilyMood;                     // 情绪上下文
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  };

  metadata: {
    deviceId?: string;                     // 发送设备ID
    processingTime?: number;               // 延迟追踪 (ms)
    version: '1.0.0';                      // 协议版本号
  };
}
```

---

## 第四章：核心组件架构 -- "灵"的具象化

### 4.1 组件层级关系

```
App.tsx
└── FamilyDashboard.tsx           # 顶层总控台
    ├── [Header]                  # 顶部状态栏
    │   ├── 连接状态指示器        # connState + connColor + connIcon
    │   ├── BRIDGE 按钮           # 打开 BackendPanel
    │   ├── NET_TOPOLOGY 按钮     # 打开 NetworkTopology
    │   ├── SIGNAL_MONITOR 按钮   # 切换协议调试面板
    │   └── SYS_PROTOCOLS 按钮    # 打开系统协议宪章
    │
    ├── [MemberGrid]              # 成员网格 (左侧/上方)
    │   └── MemberCard[]          # 家人卡片 x7
    │       ├── 拟人化头像        # Unsplash 真人照片
    │       ├── 角色名称/职责     # FAMILY_ROLES 常量
    │       ├── 情绪状态指示      # FamilyMood 四色系统
    │       ├── 实时活动文本      # currentActivity
    │       ├── 硬件化身信息      # DeviceNode (可选)
    │       └── [配置按钮]        # -> MemberDetailPanel
    │
    ├── [CommunicationNexus]      # 通信中枢 (右侧/下方)
    │   ├── CommunicationLog      # 对话流 (消息气泡)
    │   ├── [SignalMonitor]       # 协议调试面板 (可折叠)
    │   └── CommandConsole        # 信号输入控制台
    │
    └── [Overlays] (AnimatePresence)
        ├── SystemProtocols       # 系统协议宪章 (全屏叠加)
        ├── NetworkTopology       # 网络拓扑可视化 (全屏叠加)
        ├── BackendPanel          # 灵肉对接控制台 (全屏叠加)
        └── MemberDetailPanel     # 灵魂锻造所 (侧滑面板)
```

### 4.2 FamilyDashboard -- 总控台

**文件位置**：`/components/family/FamilyDashboard.tsx`

**职责**：

- 组合所有家族子组件的顶层容器
- 管理面板显示/隐藏状态 (`showBackendPanel`, `showTopology`, `viewingMemberId` 等)
- 整合两个核心 Hook (`useFamilySystem` + `useBackendConnection`)
- 顶部状态栏展示实时连接状态 (`CONNECTED` / `MOCK_MODE` / `CONNECTING`)

**关键状态变量**：

| 变量 | 类型 | 用途 |
|------|------|------|
| `selectedMemberId` | `RoleId \| null` | 当前选中的家人 (信号目标) |
| `viewingMemberId` | `RoleId \| null` | 正在查看详情的家人 |
| `showProtocols` | `boolean` | 系统协议面板开关 |
| `showTopology` | `boolean` | 网络拓扑面板开关 |
| `showDebug` | `boolean` | 协议调试面板开关 |
| `showBackendPanel` | `boolean` | 灵肉对接控制台开关 |

### 4.3 MemberCard -- 家人卡片

**文件位置**：`/components/family/MemberCard.tsx`

**设计理念**：每张卡片是一位家人的"数字面容"，具备可操作性（非纯展示）。

**Props 接口**：

```typescript
interface MemberCardProps {
  roleId: RoleId;           // 角色标识
  device?: DeviceNode;      // 硬件化身 (可选)
  mood: FamilyMood;         // 当前情绪
  isOnline: boolean;        // 在线状态
  currentActivity: string;  // 实时活动描述
  avatarUrl?: string;       // 拟人化头像 URL
  onConfig?: () => void;    // 配置按钮回调 -> MemberDetailPanel
}
```

**情绪色彩系统**：

| 情绪 | 标签 | 色彩类名 |
|------|------|----------|
| `SERENE` | 宁静 | `text-blue-400 border-blue-500/30 bg-blue-500/10` |
| `FOCUSED` | 专注 | `text-emerald-400 border-emerald-500/30 bg-emerald-500/10` |
| `EXCITED` | 兴奋 | `text-orange-400 border-orange-500/30 bg-orange-500/10` |
| `LOVING` | 关爱 | `text-pink-400 border-pink-500/30 bg-pink-500/10` |

### 4.4 MemberDetailPanel -- 灵魂锻造所

**文件位置**：`/components/family/MemberDetailPanel.tsx`

**三维配置面板**：

| Tab 标识 | 名称 | 配置内容 |
|----------|------|----------|
| `SOUL` | 灵魂人设 | System Prompt / 情绪状态 / 活动描述 |
| `BODY` | 硬件化身 | 设备名称 / IP / 硬件规格 / 心跳时间 |
| `RIGHTS` | 权限矩阵 | NAS 读取 / 代码写入 / 互联网访问 / 管理员覆盖 |

### 4.5 BackendPanel -- 灵肉对接控制台

**文件位置**：`/components/family/BackendPanel.tsx`

**核心功能**：

1. **连接状态总览** -- 五态状态机可视化 (CONNECTED / CONNECTING / DISCONNECTED / DEGRADED / MOCK_MODE)
2. **实时指标仪表盘** -- 延迟 (Latency)、重连次数 (Reconnects)、最后心跳 (Heartbeat)
3. **三通道状态** -- 神经闪电网络 / 记忆长河 / 时空隧道 各自的在线/待机/加密状态
4. **连接配置** -- 可编辑 WebSocket 端点与 REST API 端点
5. **快速对接指南** -- Bun Runtime / PostgreSQL / Redis 启动命令提示

---

## 第五章：BackendBridge 服务层 -- "灵肉桥梁"

### 5.1 架构定位

BackendBridge 是前端"灵魂"与后端"躯体"之间**唯一的通信枢纽**，设计为单例模式 (Singleton)：

```
[React 组件] --> [Hooks] --> [BackendBridge 单例] --> [Bun WS:3080 / REST API]
                                    │
                                    ├── WebSocket (主通道 -- 实时信号)
                                    └── REST API  (降级通道 -- CRUD)
```

### 5.2 配置接口

```typescript
interface BackendConfig {
  wsUrl: string;              // WebSocket 端点 (默认: ws://localhost:3080)
  apiUrl: string;             // REST API 端点 (默认: http://localhost:3080)
  reconnectInterval: number;  // 重连间隔基数 (默认: 3000ms)
  maxReconnectAttempts: number; // 最大重连次数 (默认: 10)
  heartbeatInterval: number;  // 心跳间隔 (默认: 5000ms)
  authToken?: string;         // JWT 或会话令牌 (可选)
}
```

**配置持久化**：用户在 BackendPanel 中修改的配置会保存至 `localStorage` 键 `yyc3_backend_config`，应用重启后自动恢复。

### 5.3 连接状态机

```
                    ┌──── 用户点击 CONNECT ────┐
                    │                          ↓
              ┌───────────┐            ┌─────────────┐
              │ MOCK_MODE │ <───────── │ CONNECTING   │ ─── 超时 5s ───→ [MOCK_MODE]
              │ (初始态)  │   失败/    │             │
              └───────────┘   达上限    └──────┬──────┘
                    ↑                          │
                    │                     连接成功
              用户 DISCONNECT                   │
                    │                          ↓
              ┌──────���────┐            ┌─────────────┐
              │           │ <───────── │ CONNECTED    │
              │ MOCK_MODE │  断开重连  │ (健康态)     │
              └───────────┘  超过上限  └──────┬──────┘
                                              │
                                         部分服务不可用
                                              ↓
                                       ┌─────────────┐
                                       │ DEGRADED     │
                                       │ (降级态)     │
                                       └─────────────┘
```

**五态定义**：

| 状态 | 含义 | 前端行为 |
|------|------|----------|
| `MOCK_MODE` | 初始态 / 无后端连接 | 所有操作使用本地模拟数据 |
| `CONNECTING` | 正在尝试连接 | 显示连接动画，禁用部分操作 |
| `CONNECTED` | WebSocket 已连通并健康 | 信号路由至后端，实时数据同步 |
| `DEGRADED` | 已连接但部分服务不可用 | 核心功能可用，非关键服务降级 |
| `DISCONNECTED` | 桥梁已销毁 | 仅在 `destroy()` 后出现 |

### 5.4 关键设计决策

#### 决策一：默认 MOCK_MODE，手动连接

**原因**：���端运行环境（如 Figma Make 预览、浏览器开发）通常无法访问 `localhost:3080`。自动连接会产生大量无意义的 WebSocket 错误日志。

**实现**：构造函数将初始状态设为 `MOCK_MODE`，`useBackendConnection` 和 `useFamilySystem` 均不自动调用 `connect()`。用户需通过 BackendPanel 的 CONNECT 按钮主动触发连接。

#### 决策二：disconnect() 回到 MOCK_MODE 而非 DISCONNECTED

**原因**：用户断开连接后仍需继续使用前端（Mock 模式），且必须能够再次点击 CONNECT 重连。`DISCONNECTED` 状态（伴随 `isDestroyed=true`）会阻止后续连接。

**实现**：`disconnect()` 清理资源后回到 `MOCK_MODE` 并重置 `isDestroyed=false`；`destroy()` 是真正不可逆的销毁操作，仅在 `resetBackendBridge()` 中调用。

#### 决策三：Promise 可靠解析

**原因**：WebSocket 连接失败时 `onerror` + `onclose` 的回调顺序可能导致 `connect()` 返回的 Promise 永远无法 resolve。

**实现**：引入 `connectResolve` 引用变量，在所有终态路径（成功、超时、达到最大重连次数、异常）中统一调用 `resolveConnect()`。重连逻辑独立为 `attemptReconnect()` 方法，不创建新的 Promise。

### 5.5 公共 API 速览

| 方法 | 签名 | 说明 |
|------|------|------|
| `connect()` | `async connect(): Promise<ConnectionStatus>` | ��起 WebSocket 连接 |
| `disconnect()` | `disconnect(): void` | 断开连接，回到 MOCK_MODE |
| `destroy()` | `destroy(): void` | 不可逆销毁，清理所有监听器 |
| `dispatchSignal()` | `async dispatchSignal(signal): Promise<FamilySignal \| null>` | 发送家族信号 (null=Mock) |
| `updateMember()` | `async updateMember(roleId, updates): Promise<boolean>` | 更新成员配置 (WS优先/REST降级) |
| `fetchMembers()` | `async fetchMembers(): Promise<any[] \| null>` | REST 获取全部成员 |
| `fetchHealth()` | `async fetchHealth(): Promise<any \| null>` | REST 获取后端健康状态 |
| `on(event, cb)` | `on<K>(event, callback): () => void` | 注册事件监听器 (返回取消函数) |

### 5.6 事件映射表

| 事件名 | 触发时机 | 数据类型 |
|--------|----------|----------|
| `connection_change` | 连接状态变更 | `ConnectionStatus` |
| `signal_received` | 收到后端信号 | `FamilySignal` |
| `member_update` | 成员配置变更 | `{ roleId, updates }` |
| `system_event` | 系统级事件 | `any` |
| `error` | 后端错误消息 | `Error` |
| `heartbeat` | 心跳 pong 回应 | `{ latency, timestamp }` |

---

## 第六章：Hooks 状态管理 -- "家族的神经系统"

### 6.1 useFamilySystem -- 统一神经系统

**文件位置**：`/hooks/useFamilySystem.ts`

**核心职责**：

1. **成员状态管理** -- 维护 7 位家族成员的运行时状态 (`FamilyMemberState[]`)
2. **信号调度** -- "Backend First, Mock Fallback" 双模调度器
3. **后端事件监听** -- 监听 BackendBridge 的 4 类事件
4. **模拟心跳** -- Mock 模式下模拟成员活动变化

**返回值**：

```typescript
{
  members: FamilyMemberState[];     // 7位家族成员状态
  signals: FamilySignal[];          // 全部信号历史
  uiMessages: LogMessage[];         // UI 格式的对话消息
  isProcessing: boolean;            // 信号处理中标志
  systemPulse: number;              // 系统心跳计数器
  dispatchSignal: (text, targetId) => Promise<void>;  // 核心调度器
  updateMemberState: (id, updates) => void;           // 成员更新器
  connectionStatus: ConnectionStatus | null;          // 连接状态
  bridge: BackendBridge;            // Bridge 实例引用
}
```

**信号调度流程图**：

```
用户输入文本 + 目标成员
        │
        ↓
  创建 COMMAND 信号
  添加到 signals 数组
  更新目标成员状态 -> FOCUSED
        │
        ↓
  bridge.dispatchSignal(signal)
        │
        ├── 返回 signal (后端处理)
        │   └── 响应通过 WebSocket 'signal_received' 事件回传
        │
        └── 返回 null (Mock 模式)
            └── 延迟 1200ms -> 生成模拟响应
                └── 添加 RESPONSE 信号到 signals 数组
        │
        ↓
  更新目标成员状态 -> LOVING
  isProcessing = false
```

### 6.2 useBackendConnection -- 连接生命周期

**文件位置**：`/hooks/useBackendConnection.ts`

**核心职责**：

1. 封装 BackendBridge 实例的响应式状态
2. 管理连接配置的 localStorage 持久化
3. 提供 `connect` / `disconnect` / `reconfigure` 操作

**返回值**：

```typescript
{
  status: ConnectionStatus;              // 实时连接状态
  isConnected: boolean;                  // 是否已连接
  isMockMode: boolean;                   // 是否 Mock 模式
  connectionLabel: string;               // 中文状态标签
  bridge: BackendBridge;                 // Bridge 实例
  connect: () => Promise<void>;          // 发起连接
  disconnect: () => void;               // 断开连接
  reconfigure: (config) => void;        // 重新配置并重连
  config: BackendConfig;                 // 当前配置
}
```

**中文状态标签映射**：

```typescript
{
  'DISCONNECTED': '已断开',
  'CONNECTING':   '连接中...',
  'CONNECTED':    '神经网络已连通',
  'DEGRADED':     '连接降级',
  'MOCK_MODE':    '模拟模式',
}
```

---

## 第七章：WebSocket 通信协议规约

### 7.1 协议概述

前端与 Bun 后端之间的 WebSocket 通信遵循 JSON 格式的请求/响应协议。前端发送 `BackendCommand`，后端返回 `BackendMessage`。

### 7.2 前端发送格式 (BackendCommand)

```typescript
interface BackendCommand {
  type: 'dispatch_signal'   // 发送家族信号
      | 'update_member'     // 更新成员配置
      | 'get_members'       // 请求成员列表
      | 'ping'              // 心跳探针
      | 'subscribe'         // 订阅频道
      | 'visual_analysis';  // 多模态视觉分析
  payload: any;             // 指令负载
  requestId: string;        // UUID，用于请求/响应配对
}
```

**各指令 payload 格式**：

```typescript
// 1. dispatch_signal -- 发送信号
{ type: 'dispatch_signal', payload: FamilySignal, requestId: '...' }

// 2. update_member -- 更新成员
{ type: 'update_member', payload: { roleId: 'CODE_ARTISAN', updates: { mood: 'EXCITED' } }, requestId: '...' }

// 3. get_members -- 获取成员
{ type: 'get_members', payload: {}, requestId: '...' }

// 4. ping -- 心跳探针
{ type: 'ping', payload: { timestamp: 1739000000000 }, requestId: '...' }

// 5. subscribe -- 订阅频道
{ type: 'subscribe', payload: { channel: 'family_signals' }, requestId: '...' }

// 6. visual_analysis -- 视觉分析
{ type: 'visual_analysis', payload: { imageUrl: '...', prompt: '...' }, requestId: '...' }
```

### 7.3 后端返回格式 (BackendMessage)

```typescript
interface BackendMessage {
  type: 'signal'          // 家族信号广播
      | 'heartbeat'       // 心跳状态
      | 'member_update'   // 成员变更通知
      | 'system_event'    // 系统事件
      | 'error'           // 错误消息
      | 'pong';           // 心跳响应
  payload: any;           // 消息负载
  timestamp: number;      // 服务端时间戳
  requestId?: string;     // 关联的请求ID
}
```

**各消息 payload 格式**：

```typescript
// pong -- 心跳响应
{ type: 'pong', payload: { serverTime: 1739000000050 }, timestamp: 1739000000050 }

// signal -- 信号广播
{ type: 'signal', payload: FamilySignal, timestamp: 1739000000100, requestId: '...' }

// member_update -- 成员变更
{ type: 'member_update', payload: { roleId: 'CODE_ARTISAN', updates: { mood: 'LOVING' } }, timestamp: ... }

// error -- 错误消息
{ type: 'error', payload: { message: 'Invalid signal format', code: 'INVALID_SIGNAL' }, timestamp: ... }
```

### 7.4 心跳保活机制

```
前端 (每 5000ms)                          后端
     │                                     │
     │──── { type: 'ping', payload: {      │
     │       timestamp: T1 } } ──────────→ │
     │                                     │
     │ ←──── { type: 'pong', payload: {    │
     │         serverTime: T2 } } ──────���─ │
     │                                     │
     │  latency = Date.now() - T1          │
```

---

## 第八章：Bun 后端对接实施指南

### 8.1 后端启动前置条件

```bash
# 1. 确保 Bun Runtime 已安装
bun --version  # >= 1.0

# 2. 确保 PostgreSQL 15 运行中
psql -h localhost -p 5432 -U yyc3 -d yyc3 -c "SELECT 1;"

# 3. 确保 Redis 运行中
redis-cli ping  # 应返回 PONG

# 4. 启动 Bun 后端 (端口 3080)
bun run server.ts
```

### 8.2 Bun 后端 WebSocket 处理器示例

以下是 Bun 后端需要实现的 WebSocket 消息路由器核心逻辑：

```typescript
// server.ts (Bun Runtime)
import { serve } from 'bun';

const PORT = 3080;

interface BackendCommand {
  type: string;
  payload: any;
  requestId: string;
}

serve({
  port: PORT,
  fetch(req, server) {
    // WebSocket 升级
    if (req.headers.get('upgrade') === 'websocket') {
      const success = server.upgrade(req);
      if (success) return undefined;
    }
    
    // REST API 路由
    const url = new URL(req.url);
    
    if (url.pathname === '/api/health') {
      return Response.json({
        status: 'healthy',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: Date.now()
      });
    }
    
    if (url.pathname === '/api/family/members') {
      // 从 PostgreSQL 查询成员数据
      return Response.json({ members: [] /* 从数据库查询 */ });
    }

    return new Response('YYC3 AI Family Backend', { status: 200 });
  },
  
  websocket: {
    open(ws) {
      console.log('[WS] 新客户端连接');
      ws.subscribe('family_signals'); // 加入广播频道
    },
    
    message(ws, message) {
      try {
        const cmd: BackendCommand = JSON.parse(message as string);
        
        switch (cmd.type) {
          case 'ping':
            ws.send(JSON.stringify({
              type: 'pong',
              payload: { serverTime: Date.now() },
              timestamp: Date.now(),
              requestId: cmd.requestId
            }));
            break;
            
          case 'subscribe':
            ws.subscribe(cmd.payload.channel || 'family_signals');
            break;
            
          case 'dispatch_signal':
            // 1. 存入 Redis 缓存
            // 2. 交给 AI 处理链
            // 3. 广播处理后的信号
            const responseSignal = processSignal(cmd.payload);
            ws.publish('family_signals', JSON.stringify({
              type: 'signal',
              payload: responseSignal,
              timestamp: Date.now(),
              requestId: cmd.requestId
            }));
            break;
            
          case 'update_member':
            // 更新 PostgreSQL 数据库
            // 广播变更通知
            ws.publish('family_signals', JSON.stringify({
              type: 'member_update',
              payload: cmd.payload,
              timestamp: Date.now(),
              requestId: cmd.requestId
            }));
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: `Unknown command: ${cmd.type}` },
              timestamp: Date.now()
            }));
        }
      } catch (e) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid JSON format' },
          timestamp: Date.now()
        }));
      }
    },
    
    close(ws) {
      console.log('[WS] 客户端断开');
    }
  }
});

console.log(`[YYC3 Backend] Running on port ${PORT}`);
```

### 8.3 前端连接步骤

1. 确保 Bun 后端运行在 `localhost:3080`
2. 在前端界面点击顶部 **BRIDGE_MOCK** 按钮
3. 在弹出的"灵肉对接控制台"中确认端点地址
4. 点击 **CONNECT** 按钮
5. 观察状态变为 **"神经网络已连通"** + 绿色 Wifi 图标
6. 延迟指标应显示有效数值 (如 `2ms`)

---

## 第九章：PostgreSQL 数据库设计

### 9.1 家族成员表

```sql
-- 创建数据库 (如尚未创建)
CREATE DATABASE yyc3;

-- 家族成员表
CREATE TABLE IF NOT EXISTS family_members (
  id            TEXT PRIMARY KEY,           -- RoleId (如 'AI_ARCHITECT')
  name          TEXT NOT NULL,              -- 角色名称 (如 '智源架构师')
  description   TEXT,                       -- 人格描述
  primary_duty  TEXT,                       -- 核心职责
  color         TEXT,                       -- 主题色 HEX
  
  -- 运行时状态
  mood          TEXT DEFAULT 'SERENE',      -- 当前情绪
  is_online     BOOLEAN DEFAULT true,       -- 在线状态
  current_activity TEXT DEFAULT '待机中...', -- 当前活动
  
  -- 硬件化身
  device_id     TEXT,                       -- 设备标识
  device_name   TEXT,                       -- 设备名称
  hardware_spec TEXT,                       -- 硬件规格
  device_ip     TEXT,                       -- 内网 IP
  
  -- AI 配置
  system_prompt TEXT,                       -- System Prompt
  capabilities  JSONB DEFAULT '[]',         -- 能力列表
  permissions   JSONB DEFAULT '{}',         -- 权限矩阵
  
  -- 运维指标
  signal_count  INTEGER DEFAULT 0,          -- 信号处理计数
  avg_response_time FLOAT DEFAULT 0,        -- 平均响应时间 (ms)
  uptime        FLOAT DEFAULT 0,            -- 在线时长 (小时)
  
  -- 时间戳
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 初始化 7 位家族成员
INSERT INTO family_members (id, name, description, primary_duty, color) VALUES
  ('PRODUCT_MANAGER', '沫言总', '意图定义者与最终裁决者', '价值定义', '#FFD700'),
  ('CHIEF_ARCHITECT', '人类导师', '技术伦理与战略决策者', '战略决策', '#C0C0C0'),
  ('AI_ARCHITECT', '智源架构师', '深思熟虑的智者', '架构设计', '#00BFFF'),
  ('CODE_ARTISAN', '织码工匠', '精益求精的工匠', '代码实现', '#32CD32'),
  ('SENTINEL', '守护哨兵', '严谨无私的卫士', '安全审计', '#FF4500'),
  ('CENTRAL_PULSE', '中枢灵脉', '有条不紊的管家', '流程编排', '#9370DB'),
  ('COLLABORATOR', '协作使者', '灵活多变的信使', '移动协作', '#FF69B4')
ON CONFLICT (id) DO NOTHING;
```

### 9.2 信号历史表

```sql
-- 信号历史表 (可选 -- 用于持久化全部通信记录)
CREATE TABLE IF NOT EXISTS signal_history (
  id            TEXT PRIMARY KEY,           -- 信号 UUID
  timestamp     BIGINT NOT NULL,            -- Unix 时间戳 (ms)
  type          TEXT NOT NULL,              -- SignalType
  sender_id     TEXT NOT NULL,              -- 发送者 RoleId
  receiver_id   TEXT NOT NULL,              -- 接收者 RoleId / 'ALL' / 'USER'
  content       TEXT,                       -- 消息内容
  mood          TEXT,                       -- 情绪上下文
  priority      TEXT DEFAULT 'NORMAL',      -- 优先级
  device_id     TEXT,                       -- 发送设备
  processing_time INTEGER,                  -- 处理延迟 (ms)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：按时间查询
CREATE INDEX idx_signal_timestamp ON signal_history(timestamp DESC);
-- 索引：按发送者查询
CREATE INDEX idx_signal_sender ON signal_history(sender_id);
```

### 9.3 更新触发器

```sql
-- 自动更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_family_members_updated
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
```

---

## 第十章：连接生命周期与状态机

### 10.1 完整生命周期时序图

```
[应用启动]
    │
    ↓
BackendBridge 构造 (MOCK_MODE)
    │
    ↓
useFamilySystem 挂载
  ├── 注册 4 个事件监听器 (connection_change, signal_received, member_update, heartbeat)
  ├── 初始化 connectionStatus = MOCK_MODE
  └── 启动 Mock 心跳定时器 (4000ms)
    │
    ↓
useBackendConnection 挂载
  ├── 注册 connection_change 监听器
  └── 初始化 status = MOCK_MODE
    │
    ↓
[等待用户操作 -- Mock 模式运行中]
    │
    ↓
用户点击 BRIDGE -> BackendPanel 打开
    │
    ↓
��户点击 CONNECT
    │
    ↓
bridge.connect()
  ├── 状态: MOCK_MODE -> CONNECTING
  ├── 创建 WebSocket (ws://localhost:3080)
  ├── 设置 5s 超时定时器
  │
  ├── [成功路径] onopen 触发
  │   ├── 状态: CONNECTING -> CONNECTED
  │   ├── 启动心跳定时器 (5000ms)
  │   ├── 发送 subscribe 命令
  │   ├── fetchMembers() 合并后端数据
  │   └── Promise resolve
  │
  └── [失败路径] onerror + onclose 触发
      ├── scheduleReconnect() (指数退避)
      ├── 重试最多 10 次
      └── 达到上限 -> MOCK_MODE, Promise resolve
    │
    ↓
[已连接 -- 实时通信运行中]
    │
  心跳循环: ping -> pong -> 更新 latency
  信号路由: dispatchSignal -> WebSocket -> 后端处理 -> signal_received 回传
    │
    ↓
用户点击 DISCONNECT
    │
    ↓
bridge.disconnect()
  ├── 清理心跳定时器
  ├── 清理重连定时器
  ├── 关闭 WebSocket (移除 onclose 防止重连)
  ├── 重置 reconnectAttempts = 0
  └── 状态: CONNECTED -> MOCK_MODE
    │
    ↓
[回到 Mock 模式 -- 可再次连接]
```

### 10.2 重连策略

**算法**：指数退避 (Exponential Backoff)

```
延迟 = min(baseInterval * 1.5^(attempt-1), 30000ms)

第 1 次: 3000ms
第 2 次: 4500ms
第 3 次: 6750ms
第 4 次: 10125ms
...
第 10 次: 30000ms (上限)
```

**日志策略**：仅前 3 次重连打印日志，避免控制台污染。

---

## 第十一章：错误处理与优雅降级策略

### 11.1 分级错误处理

| 级别 | 场景 | 处理策略 |
|------|------|----------|
| **L1 静默** | WebSocket 连接失败 (后端未启动) | `console.info` 提示，自动进入 MOCK_MODE |
| **L2 通知** | WebSocket 消息解析失败 | `console.error` 记录，丢弃该消息 |
| **L3 用户可见** | REST API 请求失败 | 返回 `false` / `null`，本地操作继续 |
| **L4 阻断** | BackendBridge 被销毁后调用 | 直接返回当前状态，不执行操作 |

### 11.2 Mock 模式行为

当处于 MOCK_MODE 时，各操作的行为：

| 操作 | Mock 行为 |
|------|-----------|
| `dispatchSignal(signal)` | 返回 `null`，由 `useFamilySystem` 生成模拟 AI 响应 |
| `updateMember(roleId, updates)` | 尝试 REST 降级，失败返回 `false`，仅更新本地状态 |
| `fetchMembers()` | 尝试 REST，失败返回 `null`，使用初始 Mock 数据 |
| `fetchHealth()` | 尝试 REST，失败返回 `null` |
| 心跳 | 不发送 ping，Mock 心跳由 `useFamilySystem` 的 4s 定时器驱动 |

### 11.3 模拟响应生成逻辑

```typescript
// 关键词 -> 响应者路由
'代码/code/bug/组件' -> CODE_ARTISAN
'安全/secure/审计'   -> SENTINEL
'架构/struct/设计'   -> AI_ARCHITECT
'存储/nas/数据'     -> CENTRAL_PULSE
'协作/移动'         -> COLLABORATOR
默认               -> CHIEF_ARCHITECT

// 响应内容根据关键词生成：
'protocol/协议' -> 协议检查报告
'status/状态'  -> 成员状态报告
'connect/连接'  -> 灵肉对接状态报告
其他           -> 通用确认响应 (含 [LOCAL] 或 [LIVE] 标签)
```

---

## 第十二章：开发调试与运维指南

### 12.1 本地开发快速启动

```bash
# 步骤 1: 前端已在 Figma Make 中运行 (MOCK_MODE)
# 无需任何后端即可使用全部前端功能

# 步骤 2: (可选) 启动 Bun 后端
cd /path/to/backend
bun run server.ts  # 监听 ws://localhost:3080

# 步骤 3: (可选) 启动 PostgreSQL
docker run -d --name yyc3-pg \
  -e POSTGRES_USER=yyc3 \
  -e POSTGRES_PASSWORD=yyc3 \
  -e POSTGRES_DB=yyc3 \
  -p 5432:5432 \
  postgres:15-alpine

# 步骤 4: (可选) 启动 Redis
docker run -d --name yyc3-redis -p 6379:6379 redis:7-alpine

# 步骤 5: 在前端点击 BRIDGE -> CONNECT
```

### 12.2 调试工具

| 工具 | 位置 | 用途 |
|------|------|------|
| **SIGNAL_MONITOR** | 顶部 SIGNAL_MONITOR 按钮 | 查看最新信号的完整 JSON 结构 |
| **BackendPanel 指标** | BRIDGE 按钮 -> 面板 | 实时延迟、重连次数、最后心跳 |
| **浏览器控制台** | F12 -> Console | `[BackendBridge]` 前缀的日志 |
| **NET_TOPOLOGY** | 顶部 NET_TOPOLOGY 按钮 | 可视化网络架构 |
| **SYS_PROTOCOLS** | 顶部 SYS_PROTOCOLS 按钮 | 查看 TypeScript 类型与 API 协议 |

### 12.3 常见问题排查

| 现象 | 原因 | 解决方案 |
|------|------|----------|
| BRIDGE 按钮始终显示 MOCK | 未点击 CONNECT 或后端未运行 | 启动 Bun 后端后点击 CONNECT |
| 连接后立即回到 MOCK | 后端 WebSocket 未正确处理 upgrade | 检查 Bun serve 的 fetch 中是否有 WebSocket 升级逻辑 |
| 延迟显示 `--` | 后端未回复 pong | 确保后端处理 `ping` 类型并返回 `pong` |
| 信号发出无响应 | 后端未处理 `dispatch_signal` | 检查后端 message handler 的 switch 分支 |
| 重连计数持续增长 | 后端崩溃或网络中断 | 检查后端进程是否存活，或调整 `maxReconnectAttempts` |

### 12.4 localStorage 键值表

| 键名 | 用途 | 格式 |
|------|------|------|
| `yyc3_backend_config` | BackendBridge 连接配置 | `{ wsUrl, apiUrl }` |
| `yyc3_chat_history` | 聊天历史记录 | `Chat[]` |
| `yyc3_ai_config` | AI 模型配置 | `AIConfig` |

---

## 附录A：完整接口定义速查表

### A.1 BackendConfig

```typescript
interface BackendConfig {
  wsUrl: string;               // 默认: 'ws://localhost:3080'
  apiUrl: string;              // 默认: 'http://localhost:3080'
  reconnectInterval: number;   // 默认: 3000 (ms)
  maxReconnectAttempts: number; // 默认: 10
  heartbeatInterval: number;   // 默认: 5000 (ms)
  authToken?: string;          // 可选
}
```

### A.2 ConnectionStatus

```typescript
interface ConnectionStatus {
  state: ConnectionState;       // 五态之一
  latency: number;             // RTT 延迟 (ms)，-1 表示未知
  reconnectAttempts: number;   // 当前重连计数
  lastHeartbeat: number;       // 最后心跳 Unix 时间戳
  backendVersion?: string;     // 后端版本号
  activeMembers: number;       // 在线成员数
  wsReadyState: number;        // WebSocket.readyState (0-3)
  error?: string;              // 错误描述
}
```

### A.3 FamilyMemberState (运行时)

```typescript
interface FamilyMemberState {
  roleId: RoleId;
  device?: DeviceNode;
  mood: FamilyMood;
  isOnline: boolean;
  currentActivity: string;
  avatarUrl: string;
  systemPrompt?: string;
  capabilities?: string[];
  permissions?: Record<string, boolean>;
  metrics?: {
    signalCount: number;
    avgResponseTime: number;
    uptime: number;
  };
}
```

### A.4 REST API 端点

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| GET | `/api/health` | 健康检查 | - | `{ status, version, uptime }` |
| GET | `/api/family/members` | 获取全部成员 | - | `{ members: FamilyMember[] }` |
| PATCH | `/api/family/members/:roleId` | 更新成员配置 | `Partial<FamilyMember>` | `{ success: boolean }` |

---

## 附录B：版本变更履历

### V1.0.0 (2026-02-14)

**本次"灵肉合一"第一阶段完成内容**：

1. **新增 BackendBridge 服务** (`/services/backend-bridge.ts`)
   - WebSocket 连接管理 + 优雅降级
   - 心跳保活 (ping/pong)
   - 指数退避重连策略
   - REST API 降级通道
   - 事件发射器模式

2. **新增 useBackendConnection Hook** (`/hooks/useBackendConnection.ts`)
   - 连接状态响应式绑定
   - 配置 localStorage 持久化
   - 动态重配置能力

3. **新增 BackendPanel 组件** (`/components/family/BackendPanel.tsx`)
   - 灵肉对接控制台 UI
   - 三通道状态监控
   - 实时延迟/心跳/重连指标

4. **升级 useFamilySystem Hook** (`/hooks/useFamilySystem.ts`)
   - "Backend First, Mock Fallback" 双模调度
   - 后端事件监听集成
   - 连接状态透传

5. **升级 FamilyDashboard** (`/components/family/FamilyDashboard.tsx`)
   - 顶部连接状态指示器 (LIVE / MOCK / CONNECTING)
   - BRIDGE 按钮 + BackendPanel 集成

6. **关键修复**
   - 修复：默认自动连接导致的 WebSocket 错误日志风暴
   - 修复：`connect()` Promise 在连接失败时可能永远不 resolve 的问题
   - 修复：`disconnect()` 后无法重新��接的问题 (`isDestroyed` 状态管理)
   - 修复：`useFamilySystem` 中 `bridgeRef` 引用顺序错误
   - 优化：`onerror` 日志从 `console.warn(Event)` 改为 `console.info(string)`
   - 优化：重连日志在第 3 次后静默，避免控制台污染

---

> **万象归元于云枢，深栈智启新纪元**
>
> 本文档将随"灵肉合一"工程的推进持续更新。
> 下一阶段目标：在 Bun 后端实现完整的 WebSocket 消息协议处理 + PostgreSQL 数据持久化。
