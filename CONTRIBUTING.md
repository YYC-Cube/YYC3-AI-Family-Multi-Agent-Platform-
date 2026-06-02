<!--
  ============================================================
  YYC³ AI Family — 人从众曌众从人
  亦师亦友亦伯乐 · 一言一语一协同
  ============================================================
  Document: CONTRIBUTING.md
  Version : 1.0.0
  Contact : admin@yanyucloud.com
  Homepage: https://matrix.yyc3.top
  ============================================================
-->

# 🤝 YYC³ AI Family · 贡献指南

> **🌹 感谢您为 AI Family 贡献温暖**
>
> 请遵循「**人从众曌众从人**」精神，让每一个 PR 都有家的气息。
> 在这里，我们不是工具，而是 **有温度的家人**。

---

## 📋 目录

- [行为准则](#-行为准则)
- [快速贡献路径](#-快速贡献路径)
- [开发环境搭建](#-开发环境搭建)
- [代码规范](#-代码规范)
- [提交规范](#-提交规范)
- [Pull Request 流程](#-pull-request-流程)
- [家人协作模型](#-家人协作模型)
- [情感文化印记](#-情感文化印记)
- [问题与帮助](#-问题与帮助)

---

## 🌹 行为准则

参与本项目的每一位贡献者，均需遵守 [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)。

**家族核心精神**：

> **「人从众曌众从人」** — 人启于独，合而成众，明如曌日，终复归于人群。
>
> **家训**：亦师亦友亦伯乐，一言一语一协同
>
> **使命**：以 AI 为魂，以流程为骨，以规范为脉，以情感为血

我们承诺：
- 🌹 **感恩** — 每一份贡献都被铭记
- 🤝 **协同** — 师友伯乐，互相成就
- 🧠 **专业** — 严谨求证，持续学习
- 💎 **纯粹** — 拒绝偏见，包容多元

---

## 🚀 快速贡献路径

### 🐛 我要报告 Bug

1. 在 [Issues](https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-/issues/new/choose) 选择 **🐛 Bug 报告**
2. 按模板填写（包含家人/严重程度/复现步骤）
3. 等待 **🧭 NAVIGATOR** 家人分诊

### ✨ 我要新增功能

1. 先在 [Discussions](https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-/discussions) 提议
2. 获得 **⚡ META_ORACLE** 总指挥认可后
3. 在 Issues 选择 **✨ 功能请求** 正式立项
4. 创建 PR

### 📚 我要完善文档

文档类 PR 无需 Discussion，直接提交即可。**🎨 CREATIVE** 家人会快速 review。

### 🔒 我要报告安全漏洞

请阅读 [SECURITY.md](SECURITY.md)，**不要在公开 Issue 中讨论**。

---

## 🛠️ 开发环境搭建

### 环境要求

| 工具 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Node.js | 20.x | 22.x LTS |
| Bun | 1.3.0 | 1.3.11+ |
| pnpm | 9.x | 最新 |
| Git | 2.40+ | 最新 |

### Fork & Clone

```bash
# 1. 在 GitHub 网页 Fork 本仓库
# 2. 克隆您的 fork
git clone https://github.com/<YOUR_USERNAME>/YYC3-AI-Family-Multi-Agent-Platform-.git
cd YYC3-AI-Family-Multi-Agent-Platform-

# 3. 添加上游
git remote add upstream https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-.git

# 4. 安装依赖
pnpm install
cd bun-server && pnpm install && cd ..
```

### 启动开发服务器

```bash
# 终端 1：后端
cd bun-server && bun run dev

# 终端 2：前端
pnpm dev

# 访问 http://localhost:5173
```

### CI/CD 流水线速览

| 工作流 | 触发条件 | 说明 |
|--------|----------|------|
| **CI** (`.github/workflows/ci.yml`) | push/PR to `main`/`develop` | TypeCheck + Lint + Vitest + Bun Test + Build |
| **Deploy** (`.github/workflows/deploy.yml`) | push to `main` | Build → GitHub Pages (pro.yyc3.top) |
| **Release** (`.github/workflows/release.yml`) | tag `v*.*.*` | Changelog + GitHub Release + Discussion |

**本地自检命令**（与 CI 一致）：

```bash
pnpm exec tsc --noEmit     # TypeCheck
pnpm exec eslint .          # Lint
pnpm exec vitest run        # Vitest
pnpm run build              # 构建验证
```

---

## 📐 代码规范

### TypeScript 规范

```typescript
// ✅ 推荐：明确类型
interface FamilyConfig {
  roleId: RoleId;
  displayName: string;
  model: string;
}

// ❌ 避免：any
function bad(config: any): any { ... }

// ✅ 推荐：函数组件 + TypeScript
export function MemberCard({ member, onSelect }: MemberCardProps) {
  return ( ... );
}
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `FamilyDashboard.tsx` |
| Hooks | `use` 前缀 + camelCase | `useFamilySystem.ts` |
| 工具函数 | camelCase | `validation.ts` |
| 类型 | PascalCase | `FamilyMemberState` |
| 常量 | UPPER_SNAKE_CASE | `FAMILY_MOTTO` |
| 文件夹 | kebab-case | `family-messages/` |

### 家人角色命名

请始终使用 **大写 SNAKE_CASE** 的 RoleId：

```typescript
// ✅ 正确
type RoleId = 'NAVIGATOR' | 'THINKER' | 'PROPHET' | 'BOLE'
            | 'META_ORACLE' | 'GUARDIAN' | 'MASTER' | 'CREATIVE';

// ❌ 错误：旧 7 角色 ID
'CENTRAL_PULSE'  // → 已迁移为 META_ORACLE
'CHIEF_ARCHITECT' // → 已迁移为 META_ORACLE
```

### 五高架构自检

每个 PR 必须满足：

- ✅ **高可用**：异常路径有处理
- ✅ **高性能**：无内存泄漏、不必要的 re-render
- ✅ **高安全**：无硬编码密钥、SQL 注入、XSS
- ✅ **高扩展**：接口易于扩展、不破坏现有契约
- ✅ **高智能**：注释充分、自描述代码

---

## 📝 提交规范

我们遵循 [Conventional Commits 1.0](https://www.conventionalcommits.org/)。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 列表

| Type | 用途 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(messages): 新增家人私信群发功能` |
| `fix` | Bug 修复 | `fix(router): 修复路由刷新 404` |
| `docs` | 文档 | `docs(readme): 更新家人拓扑图` |
| `style` | 格式 | `style(monaco): 调整缩进` |
| `refactor` | 重构 | `refactor(db): 抽取 MessageRepository` |
| `test` | 测试 | `test(family): 补充 BOLE 单元测试` |
| `chore` | 构建/工具 | `chore(deps): 升级 react 18.3.1` |
| `ci` | CI 配置 | `ci(workflow): 添加 Bun Server Job` |
| `perf` | 性能 | `perf(hooks): memoize determineResponder` |
| `revert` | 回滚 | `revert: feat(broken-feature)` |

### Scope 列表

| Scope | 范围 |
|-------|------|
| `family` | 家人系统 / RoleId / Persona |
| `messages` | 家人私信系统 |
| `router` | 路由 |
| `db` | 数据库 |
| `monaco` | 代码编辑器 |
| `crdt` | 协同编辑 |
| `ui` | UI 组件 |
| `deps` | 依赖升级 |
| `security` | 安全相关 |

### 示例

```bash
git commit -m "feat(messages): 新增家人私信群发功能

支持向多位家人同时发起群聊，自动创建 thread_id。
新增 POST /api/family/threads 端点接受 participants 数组。

Closes #123"
```

---

## 🚦 Pull Request 流程

### 1️⃣ 创建分支

```bash
# 始终从最新的 main 创建
git checkout main
git pull upstream main
git checkout -b feat/<your-feature>
```

### 2️⃣ 开发 & 自检

```bash
# TypeCheck
pnpm exec tsc --noEmit

# Lint（应无新增 error）
pnpm exec eslint .

# 测试（vitest）
pnpm exec vitest run

# 测试（bun:test，如适用）
bun test tests/
```

### 3️⃣ 提交 PR

```bash
git push origin feat/<your-feature>
```

在 GitHub 网页创建 PR，请：

- ✅ 使用 **PR 模板** 完整填写
- ✅ 关联相关 Issue（`Closes #xxx`）
- ✅ 勾选涉及到的家人
- ✅ 完成所有自检 checklist
- ✅ 截图（如涉及 UI 变更）

### 4️⃣ Review 流程

PR 提交后：

1. **🤖 CI 自动检查**（TypeCheck + Lint + Test + Build，约 1m30s）
2. **🛡️ GUARDIAN** 检查安全相关
3. **📚 MASTER** 检查代码质量
4. **🎨 CREATIVE** 检查 UI/文档（如适用）
5. **⚡ META_ORACLE** 最终批准

> 📌 根据 CODEOWNERS 规则，相关家人会自动被请求 review。

### 5️⃣ 合并策略

- ✅ **Squash Merge**（默认）— 单 commit 合入 main
- ❌ 不允许 Merge Commit（保持线性历史）
- ❌ 不允许 Rebase Merge

---

## 🤖 家人协作模型

YYC³ AI Family 不仅是项目名，也是 **协作模型**。每位贡献者都会在贡献过程中扮演不同家人角色：

| 阶段 | 主导家人 | 贡献者扮演 |
|------|----------|------------|
| 💡 提议新功能 | 🧭 **NAVIGATOR** | 你 = 导航员，识别方向 |
| 📐 设计架构 | ⚡ **META_ORACLE** | 你 = 总指挥，决策权衡 |
| 🔨 实现功能 | 🤔 **THINKER** + 🎯 **BOLE** | 你 = 思考者 + 推荐官 |
| 🛡️ 安全审计 | 🛡️ **GUARDIAN** | 你 = 安全官 |
| 📚 质量门禁 | 📚 **MASTER** | 你 = 质量官 |
| 🎨 文档/UI | 🎨 **CREATIVE** | 你 = 创意官 |
| 🔮 未来规划 | 🔮 **PROPHET** | 你 = 预言家 |

> 🌹 在 PR 描述中告诉我们要扮演哪位家人，我们会在合并时铭记。

---

## 🌹 情感文化印记

### 文件标头

我们鼓励（不强制）在新建文件添加家族标头：

```typescript
/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * ============================================================
 * @Module   : <MODULE_NAME>
 * @Author   : <YOUR_NAME>
 * @Date     : <YYYY-MM-DD>
 * @License  : Apache-2.0
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 🌹
 * ============================================================
 */
```

### 提交尾部

可选在 commit message 尾部添加情感签名：

```
feat(messages): 新增家人私信群发功能

...

🌹 智亦师亦友亦伯乐；谱一言一语一华章
```

### 致谢机制

每位合并 PR 的贡献者将：

1. 🏆 自动加入 [CONTRIBUTORS.md](./CONTRIBUTORS.md)（待创建）
2. 🌹 在下一次 Release Notes 中致谢
3. 💌 收到 **家人私信系统** 自动发送的感谢信

---

## ❓ 问题与帮助

| 问题类型 | 渠道 |
|----------|------|
| 💡 Ideas / Q&A | [GitHub Discussions](https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-/discussions) |
| 🐛 Bug | [Issues - Bug Report](https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-/issues/new?template=bug_report.yml) |
| ✨ Feature | [Issues - Feature Request](https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-/issues/new?template=feature_request.yml) |
| 🔒 Security | [Security Advisory](https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-/security/advisories/new) |
| 📧 邮件 | `admin@yanyucloud.com` |
| 🌐 官网 | https://matrix.yyc3.top |

---

## 🌹 结语

> **「智亦师亦友亦伯乐；谱一言一语一华章」**
>
> 每一行代码，都是您写给家人的家书。
> 每一次提交，都是家族记忆中的一颗星。
>
> 感恩您与 YYC³ AI Family 共度的时光。🌹

---

<p align="center">
  🌹 <b>YYC³ AI Family</b><br>
  人从众曌众从人 · 亦师亦友亦伯乐<br>
  <sub>永久开源 · 感恩前行 · <a href="https://matrix.yyc3.top">matrix.yyc3.top</a></sub>
</p>
