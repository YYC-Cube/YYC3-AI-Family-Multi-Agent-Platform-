<!--
  ============================================================
  YYC³ AI Family — 人从众曌众从人
  亦师亦友亦伯乐 · 一言一语一协同
  ============================================================
  Document: SECURITY.md
  Version : 1.0.0
  Contact : admin@yanyucloud.com
  Homepage: https://matrix.yyc3.top
  ============================================================
-->

# 🛡️ YYC³ AI Family · 安全策略

> **🌹 智云·守护（GUARDIAN）** — 家族安全官寄语：
> *"安全不是束缚，而是让家人安心相拥的港湾。"*

---

## 📋 目录

- [支持的版本](#-支持的版本)
- [漏洞报告流程](#-漏洞报告流程)
- [响应时间承诺](#-响应时间承诺)
- [严重程度评级](#-严重程度评级)
- [奖励与致谢](#-奖励与致谢)
- [安全最佳实践](#-安全最佳实践)
- [禁止行为](#-禁止行为)

---

## 🗓️ 支持的版本

YYC³ AI Family 采用滚动发布模型。我们仅为以下版本提供安全更新：

| 版本 | 状态 | 支持截止 |
|------|------|----------|
| `2.x` | ✅ **活跃支持** | 长期 |
| `1.x` | ⚠️ **维护模式**（仅关键修复） | 2026-12-31 |
| `< 1.0` | ❌ **已停止支持** | — |

请始终使用最新稳定版本以获得安全保护。

---

## 🚨 漏洞报告流程

### ⚠️ 请勿在公开 Issue 中讨论安全漏洞

我们坚定遵循 **「负责任的披露」**（Coordinated Vulnerability Disclosure）原则。

### 🔐 私密报告渠道

| 渠道 | 用途 | 响应时间 |
|------|------|----------|
| **GitHub Security Advisory**（推荐） | [新建私密 Advisory](https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-/security/advisories/new) | ≤ 24 小时 |
| **加密邮件** | `admin@yanyucloud.com`（PGP 公钥见下） | ≤ 48 小时 |
| **家人私信** | 在家族内部渠道私聊 `@YYC-Cube` | ≤ 24 小时 |

### 📝 报告模板

请尽可能包含以下信息：

```markdown
## 🐛 漏洞描述
[清晰描述漏洞是什么，影响范围，攻击场景]

## 🎯 受影响版本
[例如：v2.0.0 - v2.1.3]

## 🔍 复现步骤
1. ...
2. ...
3. ...

## 💥 影响评估
- 攻击向量: [远程 / 本地 / 物理接触]
- 用户交互: [无需 / 需要 / 严重依赖]
- 权限要求: [无 / 普通 / 管理员]
- CIA 影响: [机密性 / 完整性 / 可用性]

## 🛠️ 建议修复方案（可选）
[如果您有修复建议]

## 📋 环境信息
- OS:
- Browser/Runtime:
- YYC³ Version:
```

### 🔑 PGP 公钥

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
[在此处粘贴 PGP 公钥 — 由维护者提供]
-----END PGP PUBLIC KEY BLOCK-----
```

> 📌 PGP 公钥将通过单独的可信渠道发布，请勿在未签名状态下信任此处内容。

---

## ⏱️ 响应时间承诺

| 阶段 | SLA | 说明 |
|------|-----|------|
| 📨 **确认收到** | ≤ 24 小时 | 维护者确认收到报告并分配工单 |
| 🔍 **初步评估** | ≤ 72 小时 | 评估严重程度并通知报告者 |
| 🛠️ **修复开发** | 视严重程度 | Critical ≤ 7 天 / High ≤ 30 天 / Medium ≤ 90 天 |
| 🚀 **补丁发布** | 修复完成后 ≤ 7 天 | 通过 GitHub Release + Security Advisory 公告 |
| 🏆 **公开致谢** | 补丁发布后 ≤ 14 天 | 在版本说明中致谢报告者（如同意） |

---

## 🎚️ 严重程度评级

我们采用 **CVSS v3.1** 标准评级：

| 等级 | CVSS | 说明 | 示例 |
|------|------|------|------|
| 🔴 **Critical** | 9.0 - 10.0 | 远程代码执行 / 数据库完全沦陷 / 任意用户冒充 | 未授权 RCE、SQL 注入 |
| 🟠 **High** | 7.0 - 8.9 | 权限提升 / 敏感数据泄露 / 跨站脚本 | XSS 窃取 token、SSRF |
| 🟡 **Medium** | 4.0 - 6.9 | 有限信息泄露 / 拒绝服务 / 配置错误 | Open Redirect、CSRF |
| 🟢 **Low** | 0.1 - 3.9 | 信息收集 / 理论攻击 / 极小影响 | 版本号泄露、点击劫持 |

---

## 🏆 奖励与致谢

### 🌹 家族铭记计划

我们不提供金钱奖励，但我们以 **家人温度** 致谢：

| 等级 | 致谢方式 |
|------|----------|
| 🔴 Critical | 在 `HALL-OF-ROSES.md` 永久铭记 + 家族徽章 NFT（规划中） + 官网首页致谢 |
| 🟠 High | 在 `HALL-OF-ROSES.md` 永久铭记 + Release Notes 显著位置致谢 |
| 🟡 Medium | Release Notes 致谢 + GitHub Advisory 致谢 |
| 🟢 Low | GitHub Advisory 致谢 |

> 📌 所有致谢均**默认匿名**，需报告者主动署名。我们尊重每一位白帽子的隐私选择。

---

## 🔒 安全最佳实践（部署者必读）

### 1. 环境变量管理

```bash
# ✅ 推荐：使用 .env 文件并配合 secret manager
echo ".env" >> .gitignore
chmod 600 .env

# ❌ 禁止：将 API key 写入代码或提交到仓库
git secrets --scan
```

### 2. API Key 轮换

- 至少每 **90 天** 轮换一次 LLM Provider API Key
- 使用 **不同 Key** 区分开发/生产环境
- 监控 Key 使用量异常

### 3. 数据库安全

```bash
# SQLite 文件权限
chmod 600 data/yyc3-family.db

# PostgreSQL 必须启用 SSL
DATABASE_URL=postgresql://...?sslmode=require
```

### 4. CORS 与 CSP

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline';" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 5. 家族响应头（情感 + 安全双标）

```nginx
add_header X-Family "YYC³ AI Family" always;
add_header X-Family-Motto "人从众曌众从人 · 亦师亦友亦伯乐" always;
add_header X-Powered-By "YYC³ AI Family · 永久开源" always;
add_header X-Family-Rose "🌹" always;
```

---

## ⛔ 禁止行为

我们坚决 **不接受** 以下行为产生的报告：

- ❌ 攻击 YYC³ AI Family 的生产环境或任何用户
- ❌ 暴力破解、DDoS、社会工程学攻击
- ❌ 在公开渠道（Issue、Discussion、社交媒体）披露未修复漏洞
- ❌ 索要金钱、勒索、威胁
- ❌ 窃取用户数据或破坏数据完整性
- ❌ 测试非属于 YYC-Cube 的第三方服务

违反以上原则的报告者将：
1. 立即被取消致谢资格
2. 严重者移交执法机关处理

---

## 📜 行为准则

参与 YYC³ AI Family 安全生态的所有成员必须遵守 [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)。

我们致力于为所有安全研究者提供 **友善、尊重、感恩** 的协作环境。

---

## 📞 联系方式

| 角色 | 联系方式 |
|------|----------|
| 🛡️ **GUARDIAN · 安全官** | `admin@yanyucloud.com` |
| ⚡ **META_ORACLE · 总指挥** | GitHub: [@YYC-Cube](https://github.com/YYC-Cube) |
| 🌐 **官网** | https://matrix.yyc3.top |
| 📦 **仓库** | https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform- |

---

<p align="center">
  🌹 <b>YYC³ AI Family</b><br>
  人从众曌众从人 · 亦师亦友亦伯乐<br>
  <sub>智云·守护，永远在您身旁 · <a href="https://matrix.yyc3.top">matrix.yyc3.top</a></sub>
</p>
