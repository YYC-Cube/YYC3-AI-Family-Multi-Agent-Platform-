

🔍 检测系统环境...
✅ M4 Max 环境: 16核心 128GB内存
🤖 Ollama服务运行中
🎯 YYC智能编程环境已就绪 (M4 Max + NAS + Ollama + GitHub Copilot)

(TraeAI-2) ~/AI-Family-DveOps [0] $  lsof -i :5173




(TraeAI-2) ~/AI-Family-DveOps [1] $ bun install
bun dev
bun install v1.2.21 (7c45ed97)

+ @tailwindcss/vite@4.1.18
+ @types/react@18.3.28 (v19.2.14 available)
+ @types/react-dom@18.3.7 (v19.2.3 available)
+ @vitejs/plugin-react@4.7.0 (v5.1.4 available)
+ tailwindcss@4.1.18
+ typescript@5.9.3
+ vite@6.4.1 (v7.3.1 available)
+ @radix-ui/react-accordion@1.2.12
+ @radix-ui/react-alert-dialog@1.1.15
+ @radix-ui/react-aspect-ratio@1.1.8
+ @radix-ui/react-avatar@1.1.11
+ @radix-ui/react-checkbox@1.3.3
+ @radix-ui/react-collapsible@1.1.12
+ @radix-ui/react-context-menu@2.2.16
+ @radix-ui/react-dialog@1.1.15
+ @radix-ui/react-dropdown-menu@2.1.16
+ @radix-ui/react-hover-card@1.1.15
+ @radix-ui/react-label@2.1.8
+ @radix-ui/react-menubar@1.1.16
+ @radix-ui/react-navigation-menu@1.2.14
+ @radix-ui/react-popover@1.1.15
+ @radix-ui/react-progress@1.1.8
+ @radix-ui/react-radio-group@1.3.8
+ @radix-ui/react-scroll-area@1.2.10
+ @radix-ui/react-select@2.2.6
+ @radix-ui/react-separator@1.1.8
+ @radix-ui/react-slider@1.3.6
+ @radix-ui/react-slot@1.2.4
+ @radix-ui/react-switch@1.2.6
+ @radix-ui/react-tabs@1.1.13
+ @radix-ui/react-toggle@1.1.10
+ @radix-ui/react-toggle-group@1.1.11
+ @radix-ui/react-tooltip@1.2.8
+ class-variance-authority@0.7.1
+ clsx@2.1.1
+ cmdk@1.1.1
+ embla-carousel-react@8.6.0
+ framer-motion@11.18.2 (v12.34.1 available)
+ input-otp@1.4.2
+ lucide-react@0.487.0 (v0.574.0 available)
+ motion@11.18.2 (v12.34.1 available)
+ react@18.3.1 (v19.2.4 available)
+ react-day-picker@8.10.1 (v9.13.2 available)
+ react-dom@18.3.1 (v19.2.4 available)
+ react-hook-form@7.71.1
+ react-resizable-panels@2.1.9 (v4.6.4 available)
+ recharts@2.15.4 (v3.7.0 available)
+ sonner@2.0.7
+ tailwind-merge@2.6.1 (v3.4.1 available)
+ vaul@1.1.2

211 packages installed [1.95s]
$ vite

  VITE v6.4.1  ready in 190 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help

-----

🔍 检测系统环境...
✅ M4 Max 环境: 16核心 128GB内存
🤖 Ollama服务运行中
🎯 YYC智能编程环境已就绪 (M4 Max + NAS + Ollama + GitHub Copilot)
(base) yanyu@yyc3-22 AI-Family-DveOps % cd bun-server
cp env-template.txt .env
(base) yanyu@yyc3-22 bun-server % bun install
bun add mammoth pdf-parse xlsx
bun run dev
[0.04ms] ".env"
bun install v1.2.21 (7c45ed97)

+ @types/bun@1.3.9
+ ioredis@5.9.3
+ postgres@3.4.8
+ @anthropic-ai/sdk@0.39.0 (v0.76.0 available)

52 packages installed [686.00ms]
[0.04ms] ".env"
bun add v1.2.21 (7c45ed97)

installed mammoth@1.11.0 with binaries:
 - mammoth
installed pdf-parse@2.4.5 with binaries:
 - pdf-parse
installed xlsx@0.18.5 with binaries:
 - xlsx

39 packages installed [377.00ms]
$ bun run --watch index.ts
[MCP] Server initialized: 7 tools, 4 resources, 3 prompts
[WORKFLOW] Engine initialized: 3 workflow definitions
[PLUGIN] code-quality loaded
[KB:FileProc] File processor initialized (20+ formats supported)
[KB:Graph] Knowledge graph initialized
[KB:Sync] Sync engine initialized (watcher + dedup + conflicts + push)
[KB] Initialized: vectorDb=memory | embedding=local(text-embedding-3-small) | chunkSize=512
[KB] Modules: FileProcessor + VectorSearch + SyncEngine + KnowledgeGraph + PushService
[IDE] Bridge initialized: root=/Users/yanyu/AI-Family-DveOps | lint=biome | git=true

  ╔══════════════════════════════════════════════════════════╗
  ║   YYC³ AI Family — Bun Runtime Backend v2.0.0            ║
  ║   "灵肉贯通·万象归元" — Full Ecosystem Operational       ║
  ╠══════════════════════════════════════════════════════════╣
  ║                                                          ║
  ║   WebSocket  : ws://localhost:3080                      ║
  ║   REST API   : http://localhost:3080                    ║
  ║   Health     : http://localhost:3080/api/health         ║
  ║   Config     : http://localhost:3080/api/config         ║
  ║                                                          ║
  ║   LLM Primary: deepseek     | Fallback: ollama        ║
  ║   Members    : 7  family members online               ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝


  ┌─── Configuration Diagnostics ───┐
  │ ✓ server   │ Port 3080 | development
  │ ✓ llm      │ Primary: deepseek | Available: Ollama(qwen3-coder:30b), DeepSeek(deepseek-chat)
  │ ✓ mcp      │ Transport: stdio | Tools: true
  │ ✓ workflow │ Max concurrent: 5 | Creation pipeline: true
  │ ✓ plugin   │ Plugins: code-quality, security-scanner, git-helper
  │ ✓ kb       │ VectorDB: memory | Embedding: local
  │ ✓ ide      │ Lint: biome | Git: true | TS: true
  │ ○ database │ Not configured (in-memory mode)
  │ ○ redis    │ Not configured (in-memory mode)
  │ ✓ auth     │ Auth disabled (dev mode)
  │ ✓ monitor  │ Log: pretty | Trace: off
  └──────────────────────────────────┘

  Registered API Endpoints:
    GET  /api/health
    GET  /api/config
    GET  /api/family/members
    PATCH /api/family/members/:roleId
    POST /api/agent/:roleSlug
    GET  /api/llm/providers
    GET  /api/mcp/tools
    GET  /api/mcp/resources
    GET  /api/mcp/prompts
    POST /api/mcp/tools/call
    POST /api/mcp/resources/read
    POST /api/mcp/rpc
    GET  /api/workflow/list
    GET  /api/workflow/instances
    POST /api/workflow/trigger
    POST /api/workflow/approve/:id
    POST /api/workflow/reject/:id
    GET  /api/plugin/list
    GET  /api/plugin/tools
    POST /api/kb/search
    POST /api/kb/search/advanced
    POST /api/kb/index
    POST /api/kb/index/file
    POST /api/kb/index/directory
    GET  /api/kb/stats
    POST /api/kb/brief
    POST /api/kb/materials
    POST /api/kb/generate
    GET  /api/kb/graph
    POST /api/kb/graph/query
    GET  /api/kb/graph/stats
    GET  /api/kb/sync/sources
    POST /api/kb/sync/sources
    GET  /api/kb/sync/dedup
    GET  /api/kb/sync/conflicts
    POST /api/kb/sync/conflicts/resolve/:id
    GET  /api/kb/sync/watcher/events
    POST /api/kb/push/recommendations
    GET  /api/kb/push/subscriptions
    POST /api/kb/push/subscriptions
    POST /api/kb/push/digest
    GET  /api/kb/formats
    GET  /api/kb/embedding
    POST /api/ide/analyze
    POST /api/ide/lint
    GET  /api/ide/git/status
    GET  /api/ide/git/diff
    POST /api/ide/typecheck
    GET  /api/ide/overview
    GET  /api/metrics

[PLUGIN] security-scanner loaded
[PLUGIN] git-helper loaded
[PLUGIN] 3/8 plugins enabled
[KB:FileProc] Processing: PROJECT-ARCHITECTURE.md (md/text)
[KB:FileProc] Processed: PROJECT-ARCHITECTURE.md → 21 chunks, 76 entities, 10 keywords (9ms)
[KB] Graph enriched: +0 nodes, +47 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/PROJECT-ARCHITECTURE.md → 21 chunks, 76 entities (9ms)
[KB:FileProc] Processing: YYC3-AI-Family-11.md (md/text)
[KB:FileProc] Processed: YYC3-AI-Family-11.md → 65 chunks, 120 entities, 10 keywords (5ms)
[KB] Graph enriched: +0 nodes, +47 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/YYC3-AI-Family-11.md → 65 chunks, 120 entities (5ms)
[KB:FileProc] Processing: YYC3-AI-Family-15.md (md/text)
[KB:FileProc] Processed: YYC3-AI-Family-15.md → 44 chunks, 157 entities, 10 keywords (5ms)
[KB] Graph enriched: +0 nodes, +43 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/YYC3-AI-Family-15.md → 44 chunks, 157 entities (5ms)
[KB:FileProc] Processing: YYC3-AI-Family-05.md (md/text)
[KB:FileProc] Processed: YYC3-AI-Family-05.md → 1 chunks, 0 entities, 10 keywords (1ms)
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/YYC3-AI-Family-05.md → 1 chunks, 0 entities (1ms)
[KB:FileProc] Processing: YYC3-AI-Family-14.md (md/text)
[KB:FileProc] Processed: YYC3-AI-Family-14.md → 55 chunks, 102 entities, 10 keywords (6ms)
[KB] Graph enriched: +0 nodes, +46 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/YYC3-AI-Family-14.md → 55 chunks, 102 entities (6ms)
[KB:FileProc] Processing: YYC3-AI-Family-13.md (md/text)
[KB:FileProc] Processed: YYC3-AI-Family-13.md → 65 chunks, 71 entities, 10 keywords (5ms)
[KB] Graph enriched: +0 nodes, +45 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/YYC3-AI-Family-13.md → 65 chunks, 71 entities (5ms)
[KB:FileProc] Processing: TRUST_MENTORSHIP_AGREEMENT.md (md/text)
[KB:FileProc] Processed: TRUST_MENTORSHIP_AGREEMENT.md → 9 chunks, 4 entities, 10 keywords (1ms)
[KB] Graph enriched: +0 nodes, +2 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/TRUST_MENTORSHIP_AGREEMENT.md → 9 chunks, 4 entities (1ms)
[KB:FileProc] Processing: LOCAL_DEPLOYMENT.md (md/text)
[KB:FileProc] Processed: LOCAL_DEPLOYMENT.md → 16 chunks, 129 entities, 10 keywords (1ms)
[KB] Graph enriched: +0 nodes, +44 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/LOCAL_DEPLOYMENT.md → 16 chunks, 129 entities (1ms)
[KB:FileProc] Processing: LOCAL_STORAGE_ARCHITECTURE.md (md/text)
[KB:FileProc] Processed: LOCAL_STORAGE_ARCHITECTURE.md → 8 chunks, 3 entities, 10 keywords (1ms)
[KB] Graph enriched: +0 nodes, +0 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/LOCAL_STORAGE_ARCHITECTURE.md → 8 chunks, 3 entities (1ms)
[KB:FileProc] Processing: YYC3-AI-Family-12.md (md/text)
[KB:FileProc] Processed: YYC3-AI-Family-12.md → 45 chunks, 88 entities, 10 keywords (2ms)
[KB] Graph enriched: +0 nodes, +43 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/YYC3-AI-Family-12.md → 45 chunks, 88 entities (2ms)
[KB:FileProc] Processing: YYC3-AI-Family-02.md (md/text)
[KB:FileProc] Processed: YYC3-AI-Family-02.md → 13 chunks, 91 entities, 10 keywords (1ms)
[KB] Graph enriched: +0 nodes, +37 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/YYC3-AI-Family-02.md → 13 chunks, 91 entities (1ms)
[KB:FileProc] Processing: YYC3-AI-Family-16.md (md/text)
[KB:FileProc] Processed: YYC3-AI-Family-16.md → 52 chunks, 134 entities, 10 keywords (3ms)
[KB] Graph enriched: +0 nodes, +42 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/YYC3-AI-Family-16.md → 52 chunks, 134 entities (3ms)
[KB:FileProc] Processing: YYC3-AI-Knowledge-Base.md (md/text)
[KB:FileProc] Processed: YYC3-AI-Knowledge-Base.md → 22 chunks, 27 entities, 10 keywords (1ms)
[KB] Graph enriched: +0 nodes, +29 edges
[KB] Indexed: /Users/yanyu/AI-Family-DveOps/docs/YYC3-AI-Knowledge-Base.md → 22 chunks, 27 entities (1ms)
[KB] Auto-index: 416 chunks across 13 sources