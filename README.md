<div align="center">

# YYC³ AI Family

### Multi-Agent Collaborative Ecosystem

**言启象限 | 语枢未来**
*Words Initiate Quadrants, Language Serves as Core for Future*

<p align="center">
  <img src="public/Family-001.png" alt="YYC³ AI Family — 九层家人档案" width="640" />
</p>

[![CI](https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-/actions/workflows/ci.yml)
[![Deploy](https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-pro.yyc3.top-0C70F2?logo=github)](https://pro.yyc3.top)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg?logo=react)](https://reactjs.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3.11-black.svg?logo=bun)](https://bun.sh/)
[![Vite](https://img.shields.io/badge/Vite-6.0.0-646cff.svg?logo=vite)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-F69220.svg?logo=pnpm)](https://pnpm.io/)
[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

**🌹 智亦师亦友亦伯乐；谱一言一语一华章**

[快速开始](#-快速开始) • [架构文档](#-架构概览) • [API 文档](#-api-文档) • [贡献指南](#-贡献指南) • [家人私信](#-家人私信系统)

</div>

---

## 📋 目录

- [项目简介](#-项目简介)
- [核心特性](#-核心特性)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [架构概览](#-架构概览)
- [开发指南](#-开发指南)
- [API 文档](#-api-文档)
- [测试说明](#-测试说明)
- [部署指南](#-部署指南)
- [性能优化](#-性能优化)
- [故障排查](#-故障排查)
- [贡献指南](#-贡献指南)
- [更新日志](#-更新日志)
- [许可证](#-许可证)

---

## 🎯 项目简介

YYC³ AI Family 是一个**多智能体协同生态系统**，基于「五高五标五化」哲学框架构建，提供完整的 AI 辅助开发体验。

### 核心定位

- **多智能体协同**: 8 个专业 AI Agent 协同工作（九层家人档案 v2.0）
- **设计即代码**: Figma 设计直接转化为生产级代码
- **实时协同编辑**: 基于 CRDT 的多人实时协作
- **全栈一体化**: 前端 + 后端 + AI + 数据库完整解决方案

### 核心使命

1. **设计即代码**: 将设计师的视觉设计直接转化为可运行的生产级代码
2. **实时预览**: 在每次设计变更时立即提供实时预览反馈
3. **多联式布局**: 支持自由拖拽、合并、拆分的多面板布局系统
4. **智能辅助**: 通过 AI 提供属性建议、代码片段、错误诊断
5. **配置即部署**: 生成的代码可直接部署到生产环境

---

## ✨ 核心特性

### 🤖 多智能体系统（九层家人档案 v2.0）

> 🌹 智亦师亦友亦伯乐；谱一言一语一华章
>
> **8 位家人**分属三个层级：**业务层（4 人）** + **总指挥（1 人）** + **守护层（3 人）**

#### 🏛️ 业务层（4 位家人）

| RoleId | 中文名 | 头衔 | 模型 | 核心职责 |
|--------|--------|------|------|----------|
| 🧭 **NAVIGATOR** | 言启·千行 | 导航员 | gemini-2.5-flash | 意图识别 / 任务分诊 / 路由推荐 |
| 🤔 **THINKER** | 语枢·万物 | 思考者 | gemini-2.5-pro | 深度推理 / 数据分析 / 洞察提炼 |
| 🔮 **PROPHET** | 预见·先知 | 预言家 | gemini-2.5-pro | 趋势预测 / 风险预警 / 决策建议 |
| 🎯 **BOLE** | 知遇·伯乐 | 推荐官 | gemini-2.5-air | 个性化推荐 / 兴趣匹配 / 资源调度 |

#### 🧠 总指挥（1 位家人）

| RoleId | 中文名 | 头衔 | 模型 | 核心职责 |
|--------|--------|------|------|----------|
| ⚡ **META_ORACLE** | 元启·天枢 | 总指挥 | gemini-2.5-pro | 元决策 / 家人调度 / 冲突仲裁 / 状态广播 |

#### 🛡️ 守护层（3 位家人）

| RoleId | 中文名 | 头衔 | 模型 | 核心职责 |
|--------|--------|------|------|----------|
| 🛡️ **GUARDIAN** | 智云·守护 | 安全官 | gemini-2.5-pro | 行为审计 / 安全告警 / 合规检查 |
| 📚 **MASTER** | 格物·宗师 | 质量官 | codegeex-4 | 代码分析 / 质量门禁 / 测试覆盖 |
| 🎨 **CREATIVE** | 创想·灵韵 | 创意官 | gemini-2.5-pro | 内容创作 / 文案生成 / 视觉建议 |

#### 👨‍👩‍👧‍👦 家人拓扑

```
        ┌──────────── 业务层 ────────────┐
        │  🧭 千行   🤔 万物   🔮 先知   🎯 伯乐  │
        └────────┬───────────────────┬────────┘
                 │                   │
              ↗ ↘                 ↗ ↘
             ↘   ↙               ↘   ↙
              ↘ ↖                 ↗ ↙
                 ↘               ↙
                   ↘           ↙
                     ⚡ 天枢 ⚡
                  （META_ORACLE）
                   ↗           ↙
                 ↗               ↙
              ↗ ↖                 ↗ ↙
             ↘   ↙               ↘   ↙
              ↗ ↘                 ↗ ↘
        ┌────────┬───────────────────┬────────┐
        │ 🛡️ 守护   📚 宗师   🎨 灵韵 │
        └──────────── 守护层 ────────────┘
```

### 🧠 六大子系统

1. **§2 LLM Multi-Provider** - 多模型支持 (OpenAI, Anthropic, Ollama, DeepSeek, Qwen, BigModel)
2. **§3 MCP Protocol Server** - Model Context Protocol 工具桥接
3. **§4 Workflow Engine** - 工作流编排与执行
4. **§5 Plugin System** - 插件生态管理
5. **§6 Knowledge Base/RAG** - 知识库与检索增强生成
6. **§7 IDE Bridge** - IDE 集成桥接

### 🎨 前端特性

- **Claude 风格界面**: 现代化聊天界面设计
- **多面板布局**: 可拖拽、可调整大小的面板系统
- **实时协同**: 基于 CRDT 的多人实时编辑
- **代码编辑器**: Monaco Editor 集成
- **终端集成**: Web Terminal 支持
- **主题系统**: 深色/浅色主题切换

---

## 🛠️ 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18.3.1 | UI 框架 |
| **TypeScript** | 5.7.3 | 类型系统 |
| **Vite** | 6.0.0 | 构建工具 |
| **Tailwind CSS** | 4.0.0 | 样式框架 |
| **ShadCN UI** | Latest | UI 组件库 |
| **Monaco Editor** | 4.7.0 | 代码编辑器 |
| **Framer Motion** | 11.18.0 | 动画库 |
| **React DnD** | 16.0.1 | 拖拽功能 |
| **Recharts** | 2.15.2 | 图表库 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Bun** | 1.3.11 | 运行时 |
| **WebSocket** | Native | 实时通信 |
| **PostgreSQL** | 15+ | 主数据库 |
| **SQLite** | Bun内置 | 备用数据库 |
| **Redis** | 5.10.1 | 缓存层 |
| **ioredis** | 5.10.1 | Redis 客户端 |

### AI/ML 技术栈

| 技术 | 用途 |
|------|------|
| **OpenAI API** | GPT-4/GPT-3.5 模型 |
| **Anthropic API** | Claude 模型 |
| **Ollama** | 本地模型运行 |
| **DeepSeek API** | DeepSeek 模型 |
| **Qwen API** | 通义千问模型 |
| **BigModel API** | 智谱 GLM 模型 |

---

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0 (推荐使用 Bun)
- **Bun**: >= 1.0.0 (推荐最新版)
- **pnpm**: >= 8.0.0
- **PostgreSQL**: >= 15.0 (可选)
- **Redis**: >= 7.0 (可选)

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-.git
cd YYC3-AI-Family-Multi-Agent-Platform-
```

#### 2. 安装依赖

```bash
# 安装前端依赖
pnpm install

# 安装后端依赖
cd bun-server
pnpm install
cd ..
```

#### 3. 配置环境变量

```bash
# 复制环境变量模板
cp bun-server/env-template.txt bun-server/.env

# 编辑环境变量
vim bun-server/.env
```

**必需的环境变量**:

```env
# BigModel API (必需)
BIGMODEL_API_KEY=your_bigmodel_api_key

# OpenAI API (可选)
OPENAI_API_KEY=your_openai_api_key

# Anthropic API (可选)
ANTHROPIC_API_KEY=your_anthropic_api_key

# DeepSeek API (可选)
DEEPSEEK_API_KEY=your_deepseek_api_key

# Qwen API (可选)
QWEN_API_KEY=your_qwen_api_key

# PostgreSQL (可选)
DATABASE_URL=postgresql://user:password@localhost:5432/yyc3_family

# Redis (可选)
REDIS_URL=redis://localhost:6379
```

#### 4. 初始化数据库

```bash
cd bun-server
bun run db-init.ts
cd ..
```

#### 5. 启动开发服务器

```bash
# 终端 1: 启动后端服务器
cd bun-server
bun run dev

# 终端 2: 启动前端开发服务器
pnpm dev
```

#### 6. 访问应用

- **前端**: <http://localhost:3200>
- **后端 API**: <http://localhost:3080>
- **WebSocket**: ws://localhost:3080

### 一键启动脚本

创建 `start.sh`:

```bash
#!/bin/bash

# 启动后端
cd bun-server
bun run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端
cd ..
pnpm dev &
FRONTEND_PID=$!

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

wait
```

---

## 📁 项目结构

```
AI-Family-DveOps/
├── bun-server/                 # 后端服务器
│   ├── bigmodel-sdk/          # BigModel SDK
│   │   ├── mcp/               # MCP 集成
│   │   └── tools/             # 工具集
│   ├── index.ts               # 主入口
│   ├── llm-proxy.ts           # LLM 代理
│   ├── mcp-server.ts          # MCP 服务器
│   ├── workflow-engine.ts     # 工作流引擎
│   ├── plugin-manager.ts      # 插件管理器
│   ├── knowledge-base.ts      # 知识库
│   ├── ide-bridge.ts          # IDE 桥接
│   ├── db.ts                  # 数据库层
│   ├── redis-client.ts        # Redis 客户端
│   ├── crdt-engine.ts         # CRDT 引擎
│   ├── config.ts              # 配置管理
│   └── auth.ts                # 认证系统
│
├── components/                 # React 组件
│   ├── family/                # 核心面板
│   │   ├── FamilyDashboard.tsx
│   │   ├── MemberCard.tsx
│   │   ├── BackendPanel.tsx
│   │   └── KnowledgeBasePanel.tsx
│   ├── collaboration/         # 协同编辑
│   │   ├── MonacoCodeEditor.tsx
│   │   ├── TerminalPanel.tsx
│   │   └── ProjectFileManager.tsx
│   ├── dev-studio/            # 开发工作室
│   │   ├── AIAssistantPanel.tsx
│   │   ├── CodeEditor.tsx
│   │   └── LivePreview.tsx
│   ├── ui/                    # ShadCN UI 组件
│   ├── Chat.tsx               # 聊天界面
│   ├── SettingsModal.tsx      # 设置模态框
│   └── ArtifactsPanel.tsx     # 代码预览面板
│
├── hooks/                      # React Hooks
│   ├── useAI.ts               # AI 功能
│   ├── useBackendConnection.ts # 后端连接
│   ├── useCRDTSync.ts         # CRDT 同步
│   ├── useCollaborativeEditing.ts # 协同编辑
│   ├── useVirtualFileSystem.ts # 虚拟文件系统
│   └── useTerminalVFS.ts      # 终端文件系统
│
├── config/                     # 配置文件
│   ├── dynamic-reader.ts      # 动态配置读取
│   ├── endpoints.ts           # 端点配置
│   └── models.ts              # 模型配置
│
├── layouts/                    # 布局组件
│   ├── AppShell.tsx           # 应用外壳
│   ├── ChatRoomLayout.tsx     # 聊天室布局
│   ├── CollaborationLayout.tsx # 协同布局
│   └── DevStudioLayout.tsx    # 开发工作室布局
│
├── docs/                       # 文档
│   ├── PROJECT-ARCHITECTURE.md
│   ├── Functional-Spec.md
│   ├── LOCAL_DEPLOYMENT.md
│   └── TECH-DEBT-TRACKER.md
│
├── public/                     # 静态资源
│   └── yyc3-app-icons/        # 应用图标
│
├── tests/                      # 测试文件
│   └── type-contracts.test.ts
│
├── App.tsx                     # 根组件
├── package.json                # 项目配置
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 配置
├── eslint.config.js            # ESLint 配置
└── README.md                   # 本文档
```

---

## 🏗️ 架构概览

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     用户交互层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 首页入口  │  │ 设计画布  │  │ AI交互区  │  │ 预览视图  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     功能逻辑层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 路由决策  │  │ 面板管理  │  │ 组件系统  │  │ 状态管理  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     AI 智能层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 意图识别  │  │ 代码生成  │  │ 错误诊断  │  │ 文档生成  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     数据持久层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │  Redis   │  │  SQLite  │  │ CRDT状态  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     技术实现层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ React+TS │  │  Bun     │  │ WebSocket│  │  CRDT    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 数据流架构

```
Frontend (React)  ←→  WebSocket  ←→  Backend (Bun)
      ↓                                      ↓
  LocalStorage                          PostgreSQL
      ↓                                      ↓
  CRDT State  ←→  Redis Cache  ←→  Redis
```

### 六大子系统架构

#### §2 LLM Multi-Provider

```
┌─────────────────────────────────────────┐
│          LLM Provider Router            │
├─────────────────────────────────────────┤
│  OpenAI  │  Anthropic  │  Ollama        │
│  DeepSeek│  Qwen       │  BigModel      │
└─────────────────────────────────────────┘
           ↓
    Provider Selection
           ↓
    Response Streaming
```

#### §3 MCP Protocol Server

```
┌─────────────────────────────────────────┐
│        MCP Tool Bridge                  │
├─────────────────────────────────────────┤
│  Tools  │  Resources  │  Prompts        │
└─────────────────────────────────────────┘
           ↓
    Tool Execution
           ↓
    Result Aggregation
```

#### §4 Workflow Engine

```
┌─────────────────────────────────────────┐
│      Workflow Orchestrator              │
├─────────────────────────────────────────┤
│  Definition  │  Instance  │  Execution  │
└─────────────────────────────────────────┘
           ↓
    Step Processing
           ↓
    State Management
```

#### §5 Plugin System

```
┌─────────────────────────────────────────┐
│        Plugin Manager                   │
├─────────────────────────────────────────┤
│  Discovery  │  Loading  │  Execution    │
└─────────────────────────────────────────┘
           ↓
    Hook System
           ↓
    Lifecycle Management
```

#### §6 Knowledge Base/RAG

```
┌─────────────────────────────────────────┐
│       Knowledge Base Engine             │
├─────────────────────────────────────────┤
│  Embedding  │  Indexing  │  Retrieval   │
└─────────────────────────────────────────┘
           ↓
    Vector Search
           ↓
    Context Injection
```

#### §7 IDE Bridge

```
┌─────────────────────────────────────────┐
│          IDE Bridge                     │
├─────────────────────────────────────────┤
│  File Sync  │  Git Integration          │
│  Terminal   │  Project Management       │
└─────────────────────────────────────────┘
           ↓
    IDE Communication
           ↓
    Action Execution
```

---

## 💻 开发指南

### 开发工作流

#### 1. 创建新功能

```bash
# 1. 创建功能分支
git checkout -b feature/your-feature-name

# 2. 开发功能
# ... 编写代码 ...

# 3. 运行类型检查
pnpm tsc --noEmit

# 4. 运行代码检查
pnpm lint

# 5. 运行测试
pnpm test

# 6. 提交代码
git add .
git commit -m "feat: add your feature"

# 7. 推送分支
git push origin feature/your-feature-name

# 8. 创建 Pull Request
```

#### 2. 代码规范

**TypeScript 规范**:

```typescript
// ✅ 推荐: 使用明确的类型定义
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<UserProfile> {
  // ...
}

// ❌ 避免: 使用 any 类型
function getUser(id: any): any {
  // ...
}
```

**React 组件规范**:

```typescript
// ✅ 推荐: 函数组件 + TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ❌ 避免: 类组件
class Button extends React.Component {
  // ...
}
```

**文件命名规范**:

- **组件**: PascalCase (例如: `FamilyDashboard.tsx`)
- **Hooks**: camelCase with `use` prefix (例如: `useAI.ts`)
- **工具函数**: camelCase (例如: `validation.ts`)
- **类型定义**: PascalCase (例如: `types/storage.ts`)

#### 3. Git 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update build tasks
```

**示例**:

```bash
git commit -m "feat: add multi-panel layout support"
git commit -m "fix: resolve WebSocket connection issue"
git commit -m "docs: update API documentation"
```

#### 4. 分支管理

```
main           # 主分支，生产环境代码
  ├── develop  # 开发分支
  │   ├── feature/xxx  # 功能分支
  │   ├── bugfix/xxx   # 修复分支
  │   └── refactor/xxx # 重构分支
  └── release/x.x.x    # 发布分支
```

### 调试技巧

#### 前端调试

```typescript
// 使用 React DevTools
// 安装: https://react.dev/learn/react-developer-tools

// 使用 console.log 调试
console.log('[DEBUG] Component state:', state);

// 使用 debugger 断点
debugger;
```

#### 后端调试

```typescript
// 使用 Bun 的调试模式
bun --inspect index.ts

// 使用 console.log 调试
console.log('[DEBUG] Request:', request);

// 使用错误堆栈
try {
  // ...
} catch (error) {
  console.error('[ERROR]', error);
  console.trace();
}
```

#### WebSocket 调试

```javascript
// 在浏览器控制台
const ws = new WebSocket('ws://localhost:3080');

ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Message:', event.data);
ws.onerror = (error) => console.error('Error:', error);

// 发送测试消息
ws.send(JSON.stringify({
  type: 'ping',
  payload: { timestamp: Date.now() },
  requestId: 'test-123'
}));
```

---

## 📚 API 文档

### WebSocket API

#### 连接

```javascript
const ws = new WebSocket('ws://localhost:3080');
```

#### 消息格式

所有消息使用 JSON 格式:

```typescript
interface Message {
  type: string;
  payload: Record<string, unknown>;
  requestId?: string;
  timestamp: number;
}
```

#### 命令类型

| 命令 | 描述 | 示例 |
|------|------|------|
| `ping` | 心跳检测 | `{"type": "ping", "payload": {}}` |
| `subscribe` | 订阅频道 | `{"type": "subscribe", "payload": {"channel": "family_signals"}}` |
| `dispatch_signal` | 发送信号 | `{"type": "dispatch_signal", "payload": {...}}` |
| `agent_call` | 调用 AI Agent | `{"type": "agent_call", "payload": {...}}` |
| `update_member` | 更新成员状态 | `{"type": "update_member", "payload": {...}}` |
| `get_members` | 获取成员列表 | `{"type": "get_members", "payload": {}}` |

#### 示例: 调用 AI Agent

```javascript
// 发送请求
ws.send(JSON.stringify({
  type: 'agent_call',
  payload: {
    roleId: 'CODE_ARTISAN',
    prompt: 'Create a React button component',
    context: {
      systemPrompt: 'You are a code artisan...',
      previousResponses: []
    }
  },
  requestId: 'req-123'
}));

// 接收响应
ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  if (response.type === 'agent_response') {
    console.log('AI Response:', response.payload.content);
  }
};
```

### REST API

#### 健康检查

```bash
GET /health
```

**响应**:

```json
{
  "status": "ok",
  "version": "2.0.0",
  "uptime": 3600,
  "subsystems": {
    "mcp": true,
    "workflow": true,
    "plugin": true,
    "knowledgeBase": true,
    "ide": true
  }
}
```

#### Agent 调用

```bash
POST /api/agent/call
Content-Type: application/json

{
  "roleId": "CODE_ARTISAN",
  "prompt": "Create a React button component",
  "context": {
    "systemPrompt": "You are a code artisan..."
  }
}
```

**响应**:

```json
{
  "content": "Here's the React button component...",
  "model": "gpt-4",
  "provider": "openai",
  "latency": 1500,
  "tokenUsage": {
    "inputTokens": 100,
    "outputTokens": 200
  }
}
```

#### 知识库搜索

```bash
POST /api/kb/search
Content-Type: application/json

{
  "query": "React hooks best practices",
  "limit": 10
}
```

**响应**:

```json
{
  "results": [
    {
      "id": "doc-123",
      "content": "...",
      "score": 0.95,
      "metadata": {
        "source": "react-docs",
        "timestamp": 1234567890
      }
    }
  ]
}
```

---

## 💌 家人私信系统

YYC³ AI Family 提供完整的**家人私信（Family Messages）**功能，让你可以与任何一位家人进行 1v1 私聊，或与多位家人组成群聊。

### ✨ 核心能力

| 能力 | 描述 |
|---|---|
| 📨 **1v1 私聊** | 与 8 位家人中任意一位进行私密对话 |
| 👥 **群发消息** | 一次向多位家人发起群聊，协作解决复杂任务 |
| 🔍 **会话搜索** | 全文搜索历史消息，按家人/关键词过滤 |
| ⚡ **快捷入口** | 8 位家人头像一键直达，无需层层菜单 |
| 🔄 **状态同步** | 基于 SQLite + WebSocket 实时同步消息状态 |
| 📜 **会话归档** | 自动归档历史会话，支持分页加载 |

### 🏗️ 架构

```
┌─────────────────────────────────────────────┐
│     Frontend (React + TailwindCSS)          │
│  ┌─────────────┬─────────────┬───────────┐ │
│  │ 会话列表     │ 消息流       │ 家人快捷栏 │ │
│  │ ThreadList  │ MessageStream│ FamilyBar │ │
│  └─────────────┴─────────────┴───────────┘ │
└──────────────────┬──────────────────────────┘
                   │ HTTP + WebSocket
                   ▼
┌─────────────────────────────────────────────┐
│       Bun Server (WebSocket + REST)         │
│  ┌─────────────────────────────────────┐    │
│  │ MessageRepository (SQLite)          │    │
│  │  - family_threads (会话表)           │    │
│  │  - family_messages (消息表)          │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### 🚀 快速体验

启动开发服务器后，访问：

```
http://localhost:3200/ai-family-messages
```

或在前端路由中点击 **📨 家人私信** 入口。

### 📡 REST API

| 端点 | 方法 | 描述 |
|---|---|---|
| `/api/family/threads` | GET | 获取所有会话 |
| `/api/family/threads` | POST | 创建新会话（1v1 或群聊） |
| `/api/family/threads/:id/messages` | GET | 获取会话消息（分页） |
| `/api/family/threads/:id/messages` | POST | 发送消息 |
| `/api/family/threads/:id/read` | POST | 标记会话为已读 |
| `/api/family/search?q=keyword` | GET | 全文搜索消息 |

---

## 🧪 测试说明

### 测试框架

项目使用 **Vitest** 作为测试框架。

### 测试配置

目前项目未配置测试脚本。建议添加以下配置:

**package.json**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**vitest.config.ts**:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'bun-server/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行特定测试文件
pnpm test path/to/test.ts

# 运行测试 UI
pnpm test:ui
```

### 测试示例

```typescript
// tests/hooks/useAI.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAI } from '../hooks/useAI';

describe('useAI', () => {
  it('should return default config', () => {
    const { result } = renderHook(() => useAI());

    expect(result.current.config).toBeDefined();
    expect(result.current.config.provider).toBe('ollama');
    expect(result.current.loading).toBe(false);
  });

  it('should update config', () => {
    const { result } = renderHook(() => useAI());

    act(() => {
      result.current.updateConfig({ provider: 'openai' });
    });

    expect(result.current.config.provider).toBe('openai');
  });
});
```

---

## 🚢 部署指南

### 🌐 GitHub Pages 自动部署（推荐）

项目已配置 GitHub Actions 自动部署至 **GitHub Pages**，域名：**[pro.yyc3.top](https://pro.yyc3.top)**

```yaml
# .github/workflows/deploy.yml
触发条件：push 到 main 分支
流水线：install → typecheck → build → deploy → GitHub Pages
```

**部署流程**：

1. 代码推送至 `main` 分支自动触发部署
2. CI 流水线完成 TypeCheck + Build
3. 构建产物自动部署至 GitHub Pages
4. 通过 DNS CNAME `pro.yyc3.top` 访问

**手动部署**：

```bash
# 本地构建
pnpm build

# 构建产物在 dist/ 目录
# GitHub Actions 会自动部署
```

### 生产环境部署

#### 1. 构建项目

```bash
# 构建前端
pnpm build

# 构建后端 (Bun 项目无需构建)
cd bun-server
```

#### 2. 环境变量配置

创建生产环境变量文件 `.env.production`:

```env
# 数据库
DATABASE_URL=postgresql://user:password@prod-db:5432/yyc3_family

# Redis
REDIS_URL=redis://prod-redis:6379

# API Keys
BIGMODEL_API_KEY=your_production_key
OPENAI_API_KEY=your_production_key
ANTHROPIC_API_KEY=your_production_key

# 安全
JWT_SECRET=your_production_secret
CORS_ORIGIN=https://your-domain.com
```

#### 3. Docker 部署

**Dockerfile**:

```dockerfile
# 前端
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

# 后端
FROM oven/bun:1 AS backend
WORKDIR /app
COPY bun-server/package*.json ./
RUN bun install
COPY bun-server .
EXPOSE 3080
CMD ["bun", "run", "index.ts"]

# Nginx
FROM nginx:alpine
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build:
      context: ./bun-server
      dockerfile: Dockerfile
    ports:
      - "3080:3080"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/yyc3_family
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=yyc3_family
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### 4. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### Kubernetes 部署

**k8s-deployment.yaml**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: yyc3-ai-family
spec:
  replicas: 3
  selector:
    matchLabels:
      app: yyc3-ai-family
  template:
    metadata:
      labels:
        app: yyc3-ai-family
    spec:
      containers:
      - name: frontend
        image: yyc3/ai-family-frontend:latest
        ports:
        - containerPort: 80
      - name: backend
        image: yyc3/ai-family-backend:latest
        ports:
        - containerPort: 3080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: yyc3-secrets
              key: database-url
```

---

## ⚡ 性能优化

### 前端优化

#### 1. 代码分割

```typescript
// 使用 React.lazy 进行代码分割
const FamilyDashboard = React.lazy(() => import('./components/family/FamilyDashboard'));
const CollaborationPanel = React.lazy(() => import('./components/collaboration/CollaborationPanel'));

// 使用 Suspense 包裹
<Suspense fallback={<Loading />}>
  <FamilyDashboard />
</Suspense>
```

#### 2. 虚拟列表

```typescript
// 使用 react-window 进行虚拟列表渲染
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>Item {index}</div>
  )}
</FixedSizeList>
```

#### 3. 图片优化

```typescript
// 使用 WebP 格式
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <source srcSet="/image.jpg" type="image/jpeg" />
  <img src="/image.jpg" alt="Description" loading="lazy" />
</picture>
```

### 后端优化

#### 1. 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_signals_timestamp ON signals(timestamp DESC);
CREATE INDEX idx_members_role_id ON family_members(role_id);

-- 使用连接池
-- 在 db.ts 中配置连接池
```

#### 2. Redis 缓存

```typescript
// 缓存常用数据
async function getCachedData(key: string) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchData();
  await redis.set(key, JSON.stringify(data), 'EX', 3600);
  return data;
}
```

#### 3. WebSocket 优化

```typescript
// 使用消息压缩
import { createWebSocketStream } from 'ws';

const stream = createWebSocketStream(ws, {
  compress: true,
  compressionOptions: {
    clientMaxWindowBits: true,
    serverMaxWindowBits: true,
  },
});
```

---

## 🔧 故障排查

### 常见问题

#### 1. WebSocket 连接失败

**症状**: 前端无法连接到后端 WebSocket

**解决方案**:

```bash
# 检查后端是否运行
curl http://localhost:3080/health

# 检查端口是否被占用
lsof -i :3080

# 检查防火墙设置
sudo ufw status
```

#### 2. 数据库连接失败

**症状**: 后端无法连接到 PostgreSQL

**解决方案**:

```bash
# 检查 PostgreSQL 是否运行
sudo systemctl status postgresql

# 检查连接字符串
echo $DATABASE_URL

# 测试连接
psql $DATABASE_URL
```

#### 3. Redis 连接失败

**症状**: 缓存功能不可用

**解决方案**:

```bash
# 检查 Redis 是否运行
redis-cli ping

# 检查 Redis 配置
redis-cli config get bind

# 测试连接
redis-cli -u $REDIS_URL
```

#### 4. AI 模型调用失败

**症状**: Agent 调用返回错误

**解决方案**:

```bash
# 检查 API Key 是否配置
echo $BIGMODEL_API_KEY
echo $OPENAI_API_KEY

# 测试 API 调用
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### 日志查看

```bash
# 查看后端日志
tail -f bun-server/logs/app.log

# 查看 Docker 日志
docker-compose logs -f backend

# 查看系统日志
journalctl -u yyc3-ai-family -f
```

---

## 🤝 贡献指南

### 贡献流程

1. **Fork 项目**
2. **创建功能分支** (`git checkout -b feature/amazing-feature`)
3. **提交更改** (`git commit -m 'feat: add amazing feature'`)
4. **推送到分支** (`git push origin feature/amazing-feature`)
5. **创建 Pull Request**

### 代码审查标准

- ✅ 代码符合项目规范
- ✅ 通过所有测试
- ✅ 通过 TypeScript 类型检查
- ✅ 通过 ESLint 检查
- ✅ 有充分的文档和注释
- ✅ 没有安全漏洞

### 报告问题

如果发现 Bug 或有功能建议，请创建 [Issue](https://github.com/yyc3/ai-family-dveops/issues)，包含:

- **问题描述**: 清晰描述问题
- **复现步骤**: 如何复现问题
- **期望行为**: 期望发生什么
- **实际行为**: 实际发生了什么
- **环境信息**: 操作系统、Node.js 版本等
- **截图**: 如果适用，添加截图

---

## 📝 更新日志

### v2.0.0 (2026-04-04)

**新增功能**:

- ✨ 添加 6 大子系统完整实现
- ✨ 添加 CRDT 协同编辑支持
- ✨ 添加多模型 LLM 支持
- ✨ 添加知识库 RAG 功能
- ✨ 添加插件系统
- ✨ 添加工作流引擎

**改进优化**:

- 🚀 优化 TypeScript 类型安全性 (0 errors)
- 🚀 优化代码质量 (443 warnings, 0 errors)
- 🚀 优化前端性能 (代码分割、虚拟列表)
- 🚀 优化后端性能 (Redis 缓存、连接池)

**Bug 修复**:

- 🐛 修复 WebSocket 类型兼容性问题
- 🐛 修复数据库查询参数类型问题
- 🐛 修复 Redis 客户端 null 检查问题
- 🐛 修复 Anthropic SDK 导入问题

**文档更新**:

- 📚 添加完整的开发者文档
- 📚 添加 API 文档
- 📚 添加部署指南
- 📚 添加故障排查指南

---

## 📄 许可证

本项目采用 **Apache License 2.0** 许可证 - 详见 [LICENSE](LICENSE) 文件。

```
Copyright 2026 YYC-Cube (YYC³ AI Family)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## 🙏 致谢

### 核心依赖

- [React](https://reactjs.org/) - UI 框架
- [Bun](https://bun.sh/) - 运行时
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [ShadCN UI](https://ui.shadcn.com/) - UI 组件库

### AI 模型支持

- 感谢智谱大模型授权，致敬 GLM-PC 的卓越支持！
- 感谢 OpenAI GPT 系列模型的强大能力
- 感谢 Anthropic Claude 模型的优秀表现

### 社区贡献

感谢所有贡献者的付出！

---

<div align="center">

**YYC³ AI Family**

*言启象限 | 语枢未来*

Made with ❤️ by YanYuCloudCube Team

</div>
