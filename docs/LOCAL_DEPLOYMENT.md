# YYC³ AI Family - 本地部署完整文件清单 v2.1

> 全功能版：6 大子系统 + 多模型 + MCP + 工作流 + 插件 + **六模块智能知识库** + IDE

---

## 一、文件清单总览（13 个后端文件）

| # | 文件路径 | 说明 | 优先级 |
|---|---------|------|--------|
| 1 | `/bun-server/.env.example` | **全量配置模板** — 10大配置域、170+参数、每项带中文注释 | P0 |
| 2 | `/bun-server/config.ts` | **中央配置中枢** — 类型安全读取+验证+诊断 | P0 |
| 3 | `/bun-server/index.ts` | **主入口** — WS + HTTP + 6子系统路由注册 (50+ API端点) | P0 |
| 4 | `/bun-server/llm-proxy.ts` | **多模型代理** — Anthropic/OpenAI/Ollama/DeepSeek/Qwen 五路由+自动降级 | P0 |
| 5 | `/bun-server/mcp-server.ts` | **MCP协议服务** — 7工具+4资源+3Prompt模板+JSON-RPC | P0 |
| 6 | `/bun-server/workflow-engine.ts` | **工作流引擎** — 创生七步流水线+安全扫描+代码审查+审批门 | P1 |
| 7 | `/bun-server/plugin-manager.ts` | **插件管理器** — 8内置插件+沙箱隔离+Hook链+工具扩展 | P1 |
| 8 | `/bun-server/knowledge-base.ts` | **知识库/RAG** — 文档分块+向量嵌入+语义搜索+Prompt增强 | P1 |
| 9 | `/bun-server/ide-bridge.ts` | **IDE功能桥** — 代码分析+Lint+Git+TypeCheck+文件监听 | P1 |
| 10 | `/bun-server/db.ts` | PostgreSQL 连接层 | P2 |
| 11 | `/bun-server/redis-client.ts` | Redis 缓存层 | P2 |
| 12 | `/bun-server/auth.ts` | JWT 认证中间件 | P2 |
| 13 | `/bun-server/package.json` / `tsconfig.json` | 依赖 + TS配置 | P0 |

---

## 二、.env.example 配置域速查

| §编号 | 配置域 | 关键参数 | 说明 |
|-------|--------|---------|------|
| §1 | Core Server | `PORT`, `NODE_ENV`, `LOG_LEVEL` | 服务器基础 |
| §2 | LLM Providers | `ANTHROPIC_API_KEY` [必填], `OPENAI_API_KEY`, `OLLAMA_ENABLED`, `DEEPSEEK_API_KEY`, `QWEN_API_KEY`, `LLM_PRIMARY_PROVIDER`, `LLM_FALLBACK_PROVIDER` | 5大模型提供商 + 路由策略 |
| §3 | MCP Protocol | `MCP_ENABLED`, `MCP_TRANSPORT`, `MCP_TOOLS_ENABLED` | MCP工具/资源/Prompt发现 |
| §4 | Workflow | `WORKFLOW_ENABLED`, `WORKFLOW_CREATION_PIPELINE_ENABLED`, `WORKFLOW_CREATION_REQUIRE_APPROVAL` | 创生流水线 + CI/CD + Cron |
| §5 | Plugin | `PLUGIN_ENABLED`, `PLUGIN_ENABLED_LIST`, `PLUGIN_SANDBOX` | 8个内置插件 + 沙箱 |
| §6 | Knowledge Base | `KB_ENABLED`, `KB_VECTOR_DB`, `KB_EMBEDDING_PROVIDER`, `KB_DOC_SOURCES` | RAG检索增强生成 |
| §7 | IDE Features | `IDE_ENABLED`, `IDE_LINT_ENGINE`, `IDE_GIT_ENABLED`, `IDE_TS_CHECK_ENABLED` | 代码分析/Lint/Git/TS |
| §8 | Database | `DATABASE_URL`, `REDIS_URL` | PostgreSQL + Redis |
| §9 | Security | `JWT_SECRET`, `AUTH_ENABLED`, `CORS_ORIGIN`, `RATE_LIMIT_*` | 认证 + CORS + 限流 |
| §10 | Monitor | `LOG_FORMAT`, `TRACE_ENABLED`, `HEALTH_CHECK_*` | 日志 + 追踪 + 健康检查 |

---

## 三、操作指南：如何开启/调整每个功能

### §2 大模型 — 切换/添加提供商

```bash
# 最小配置（只用 Anthropic）
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# 添加 OpenAI 备用
OPENAI_API_KEY=sk-xxx
LLM_FALLBACK_PROVIDER=openai

# 切换主模型为本地 Ollama（零API消耗）
OLLAMA_ENABLED=true
LLM_PRIMARY_PROVIDER=ollama
OLLAMA_MODEL=qwen2.5:14b

# 使用 DeepSeek Coder 做代码生成
DEEPSEEK_API_KEY=sk-xxx
# 然后在 POST /api/agent/code-artisan 中传 provider: "deepseek"

# 控制API消耗比率
LLM_RATIO_REAL_TO_MOCK=1:3     # 每3次模拟才做1次真实调用
```

### §3 MCP — 与 IDE (Cursor/VS Code) 集成

```bash
# .env 中已默认启用
MCP_ENABLED=true
MCP_TRANSPORT=stdio              # stdio: IDE通过子进程启动

# 在 Cursor 的 .cursor/mcp.json 中添加：
{
  "mcpServers": {
    "yyc3-family": {
      "command": "bun",
      "args": ["run", "/path/to/bun-server/index.ts"],
      "env": { "MCP_TRANSPORT": "stdio" }
    }
  }
}

# 或通过 HTTP 端点测试 MCP 工具：
curl http://localhost:3080/api/mcp/tools            # 列出7个工具
curl -X POST http://localhost:3080/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name":"family_query_member","arguments":{"roleId":"AI_ARCHITECT"}}'
```

### §4 工作流 — 触发创生七步

```bash
# 触发完整创生流水线
curl -X POST http://localhost:3080/api/workflow/trigger \
  -H "Content-Type: application/json" \
  -d '{"workflowId":"creation_pipeline","params":{"projectName":"MyApp"}}'

# 查看实例状态
curl http://localhost:3080/api/workflow/instances

# 审批（当步骤等待人类确认时）
curl -X POST http://localhost:3080/api/workflow/approve/{instanceId}

# 拒绝
curl -X POST http://localhost:3080/api/workflow/reject/{instanceId} \
  -H "Content-Type: application/json" \
  -d '{"reason":"需要修改蓝图再继续"}'

# 关闭自动推进（每步需人工确认）
WORKFLOW_CREATION_AUTO_ADVANCE=false
WORKFLOW_CREATION_REQUIRE_APPROVAL=true
```

### §5 插件 — 管理插件

```bash
# 查看所有插件状态
curl http://localhost:3080/api/plugin/list

# 启用/禁用插件（修改 .env）
PLUGIN_ENABLED_LIST=code-quality,security-scanner,git-helper,test-runner

# 查看插件提供的工具
curl http://localhost:3080/api/plugin/tools

# 可用内置插件：
#   code-quality       : 代码质量 (onAgentCallAfter hook)
#   security-scanner   : 安全扫描 (onSignalAfter hook)
#   git-helper         : Git助手 (git_status/commit_suggest tools)
#   doc-generator      : 文档生成
#   test-runner        : 测试执行 (run_tests tool)
#   deploy-helper      : 部署辅助
#   api-tester         : API测试 (api_test tool)
#   performance-monitor: 性能监控
```

### §6 知识库 — RAG 配置

```bash
# 基础：内存向量库 + 本地Hash嵌入（零依赖）
KB_ENABLED=true
KB_VECTOR_DB=memory
KB_EMBEDDING_PROVIDER=local

# 进阶：OpenAI嵌入 + ChromaDB持久化
KB_VECTOR_DB=chroma
KB_EMBEDDING_PROVIDER=openai
CHROMA_URL=http://localhost:8000

# 或用 Ollama 本地嵌入（免费）
KB_EMBEDDING_PROVIDER=ollama
# 需先 ollama pull nomic-embed-text

# 手动索引文档
curl -X POST http://localhost:3080/api/kb/index \
  -H "Content-Type: application/json" \
  -d '{"source":"manual-doc","content":"YYC3 AI Family 是一个多智能体协同生态系统..."}'

# 语义搜索
curl -X POST http://localhost:3080/api/kb/search \
  -H "Content-Type: application/json" \
  -d '{"query":"微服务架构设计","topK":3}'

# 查看索引统计
curl http://localhost:3080/api/kb/stats

# 自动索引项目文档
KB_DOC_SOURCES=./docs,./AI-Family.md
KB_AUTO_INDEX_ENABLED=true
```

### §7 IDE功能 — 代码分析与Git

```bash
# 代码分析
curl -X POST http://localhost:3080/api/ide/analyze \
  -H "Content-Type: application/json" \
  -d '{"path":"components/family/FamilyDashboard.tsx"}'

# Lint检查
curl -X POST http://localhost:3080/api/ide/lint \
  -H "Content-Type: application/json" \
  -d '{"path":"hooks/useFamilySystem.ts"}'

# Git状态
curl http://localhost:3080/api/ide/git/status

# TypeScript类型检查
curl -X POST http://localhost:3080/api/ide/typecheck \
  -H "Content-Type: application/json" \
  -d '{}'

# 项目概览
curl http://localhost:3080/api/ide/overview

# 切换Lint引擎
IDE_LINT_ENGINE=biome     # 推荐（快速）
IDE_LINT_ENGINE=eslint    # 传统（插件丰富）
IDE_LINT_ENGINE=oxlint    # Rust实现（极速）
```

---

## 四、最小启动（3 步）

```bash
cd bun-server
cp .env.example .env         # 填入 ANTHROPIC_API_KEY
bun install && bun run dev
```

启动后前端自动 `MOCK_MODE → CONNECTED`，无需改任何前端代码。

## 五、启动后验证

```bash
# 健康检查（显示所有子系统状态）
curl http://localhost:3080/api/health

# 完整配置概览（不含密钥）
curl http://localhost:3080/api/config

# MCP 工具列表
bun run mcp:tools

# 工作流定义列表
bun run workflow:list

# 插件状态
bun run plugin:list

# 知识库统计
bun run kb:stats

# IDE 项目概览
bun run ide:overview

# Prometheus 指标
curl http://localhost:3080/api/metrics
```

---

## 六、完整 REST API 端点清单 (50+)

| 分类 | 方法 | 路径 | 说明 |
|------|------|------|------|
| **Core** | GET | `/api/health` | 全系统健康检查 |
| | GET | `/api/config` | 配置概览（脱敏） |
| **Family** | GET | `/api/family/members` | 成员列表 |
| | PATCH | `/api/family/members/:roleId` | 更新成员 |
| **LLM** | POST | `/api/agent/:roleSlug` | REST调用AI家人 |
| | GET | `/api/llm/providers` | 各提供商健康状态 |
| **MCP** | GET | `/api/mcp/tools` | MCP工具发现 |
| | GET | `/api/mcp/resources` | MCP资源发现 |
| | GET | `/api/mcp/prompts` | MCP提示模板发现 |
| | POST | `/api/mcp/tools/call` | 调用MCP工具 |
| | POST | `/api/mcp/resources/read` | 读取MCP资源 |
| | POST | `/api/mcp/rpc` | MCP JSON-RPC |
| **Workflow** | GET | `/api/workflow/list` | 工作流定义列表 |
| | GET | `/api/workflow/instances` | 运行实例列表 |
| | POST | `/api/workflow/trigger` | 触发工作流 |
| | POST | `/api/workflow/approve/:id` | 审批通过 |
| | POST | `/api/workflow/reject/:id` | 审批拒绝 |
| **Plugin** | GET | `/api/plugin/list` | 插件列表+状态 |
| | GET | `/api/plugin/tools` | 插件扩展工具 |
| **KB** | POST | `/api/kb/search` | 语义搜索 |
| | POST | `/api/kb/search/advanced` | 高级混合检索(语义+关键词+过滤) |
| | POST | `/api/kb/index` | 索引文本内容 |
| | POST | `/api/kb/index/file` | 索引单文件(AI全流程) |
| | POST | `/api/kb/index/directory` | 索引整个目录 |
| | GET | `/api/kb/stats` | 全量统计(六模块) |
| | POST | `/api/kb/brief` | 生成知识简报 |
| | POST | `/api/kb/materials` | 素材一键提取 |
| | POST | `/api/kb/generate` | 创作加速生成 |
| | GET | `/api/kb/formats` | 支持的文件格式(20+) |
| **KB Graph** | GET | `/api/kb/graph` | 知识图谱可视化数据 |
| | POST | `/api/kb/graph/query` | 图谱遍历查询 |
| | GET | `/api/kb/graph/stats` | 图谱统计 |
| **KB Sync** | GET | `/api/kb/sync/sources` | 外部知识源列表 |
| | POST | `/api/kb/sync/sources` | 添加外部知识源 |
| | GET | `/api/kb/sync/dedup` | 去重扫描报告 |
| | GET | `/api/kb/sync/conflicts` | 未解决冲突列表 |
| | POST | `/api/kb/sync/conflicts/resolve/:id` | 解决冲突 |
| | GET | `/api/kb/sync/watcher/events` | 文件监听事件 |
| **KB Push** | POST | `/api/kb/push/recommendations` | 场景化推荐 |
| | GET | `/api/kb/push/subscriptions` | 订阅列表 |
| | POST | `/api/kb/push/subscriptions` | 创建知识订阅 |
| | POST | `/api/kb/push/digest` | 生成知识摘要 |
| **IDE** | POST | `/api/ide/analyze` | 代码分析 |
| | POST | `/api/ide/lint` | Lint检查 |
| | GET | `/api/ide/git/status` | Git状态 |
| | GET | `/api/ide/git/diff` | Git差异 |
| | POST | `/api/ide/typecheck` | TS类型检查 |
| | GET | `/api/ide/overview` | 项目概览 |
| **Monitor** | GET | `/api/metrics` | Prometheus指标 |