# YYC3 AI Family - Project Architecture & Dependency Guide

> Generated: 2026-02-18 | Version: 2.0 (BackendPanel v2 Milestone)
> Environment: React 18 + Vite + Tailwind CSS v4 + ShadCN UI | Bun Runtime + WebSocket(3080) + Redis

---

## 1. Complete File Tree (118 files)

```
AI-Family-DveOps/
|
|-- src/
|   +-- main.tsx                          # Vite entry point (imports ../App)
|
|-- App.tsx                               # Root component: FamilyDashboard + Toaster
|-- styles/
|   +-- globals.css                       # Tailwind v4 CSS tokens & dark mode variants
|
|-- components/
|   |-- Chat.tsx                          # Claude-style chat main layout
|   |-- ChatContainer.tsx                 # Chat message container + input
|   |-- ChatInput.tsx                     # Chat input with slash commands
|   |-- ChatMessage.tsx                   # Single message renderer
|   |-- ChatSidebar.tsx                   # Chat conversation list sidebar
|   |-- ClaudeSidebar.tsx                 # Claude-style sidebar variant
|   |-- ClaudeWelcome.tsx                 # Welcome screen
|   |-- ArtifactsPanel.tsx                # Code/artifact preview panel
|   |-- SettingsModal.tsx                 # 7-tab settings modal (channels, AI config, etc.)
|   |-- TypingIndicator.tsx               # Typing dots animation
|   |-- YYC3Background.tsx                # Animated background effects
|   |
|   |-- family/                           # === YYC3 AI Family Core Panels ===
|   |   |-- FamilyDashboard.tsx           # Main dashboard hub (10 tabs, sidebar toggle)
|   |   |-- MemberCard.tsx                # Agent member card with status
|   |   |-- MemberDetailPanel.tsx         # Agent detail view (5-dimension radar)
|   |   |-- CommunicationLog.tsx          # Signal log + RAGContextCards
|   |   |-- CommandConsole.tsx            # Slash command terminal
|   |   |-- NetworkTopology.tsx           # Force-directed network graph (Canvas)
|   |   |-- FiveDimensionsPanel.tsx        # 5-dimension analysis charts
|   |   |-- DimensionStageMatrix.tsx       # Dimension x Stage progression matrix
|   |   |-- PhilosophyFramework.tsx        # Philosophy framework visualization
|   |   |-- SystemProtocols.tsx           # System protocol viewer
|   |   |-- TechAuditPanel.tsx            # Technical audit dashboard
|   |   |-- BackendPanel.tsx              # ** BackendPanel v2 ** 7-tab ops center
|   |   |                                 #   Tab 0: Overview (health/config/agents)
|   |   |                                 #   Tab 1: LLM Providers (5 providers)
|   |   |                                 #   Tab 2: MCP Tools (tools/resources/prompts)
|   |   |                                 #   Tab 3: Workflows (definitions/instances)
|   |   |                                 #   Tab 4: Plugins (list/tools)
|   |   |                                 #   Tab 5: IDE Bridge (project/git)
|   |   |                                 #   Tab 6: Config (3-channel arch/endpoints)
|   |   +-- KnowledgeBasePanel.tsx         # KB River panel (stats/search/graph/sources)
|   |
|   |-- figma/
|   |   +-- ImageWithFallback.tsx          # [PROTECTED] Image component with fallback
|   |
|   +-- ui/                              # === ShadCN UI Component Library (30 files) ===
|       |-- accordion.tsx                 # @radix-ui/react-accordion
|       |-- alert.tsx                     # class-variance-authority
|       |-- alert-dialog.tsx              # @radix-ui/react-alert-dialog
|       |-- aspect-ratio.tsx              # @radix-ui/react-aspect-ratio
|       |-- avatar.tsx                    # @radix-ui/react-avatar
|       |-- badge.tsx                     # @radix-ui/react-slot + cva
|       |-- breadcrumb.tsx                # @radix-ui/react-slot + lucide
|       |-- button.tsx                    # @radix-ui/react-slot + cva
|       |-- calendar.tsx                  # react-day-picker + lucide
|       |-- card.tsx                      # Pure React (no external deps)
|       |-- carousel.tsx                  # embla-carousel-react + lucide
|       |-- chart.tsx                     # recharts
|       |-- checkbox.tsx                  # @radix-ui/react-checkbox + lucide
|       |-- collapsible.tsx              # @radix-ui/react-collapsible
|       |-- command.tsx                   # cmdk + lucide
|       |-- context-menu.tsx             # @radix-ui/react-context-menu + lucide
|       |-- dialog.tsx                    # @radix-ui/react-dialog + lucide
|       |-- drawer.tsx                    # vaul
|       |-- dropdown-menu.tsx            # @radix-ui/react-dropdown-menu + lucide
|       |-- form.tsx                      # react-hook-form + @radix-ui/react-label + slot
|       |-- hover-card.tsx               # @radix-ui/react-hover-card
|       |-- input.tsx                     # Pure React
|       |-- input-otp.tsx                # input-otp + lucide
|       |-- label.tsx                     # @radix-ui/react-label
|       |-- menubar.tsx                   # @radix-ui/react-menubar + lucide
|       |-- navigation-menu.tsx          # @radix-ui/react-navigation-menu + cva + lucide
|       |-- pagination.tsx               # lucide + button
|       |-- popover.tsx                   # @radix-ui/react-popover
|       |-- progress.tsx                  # @radix-ui/react-progress
|       |-- radio-group.tsx              # @radix-ui/react-radio-group + lucide
|       |-- resizable.tsx                # react-resizable-panels + lucide
|       |-- scroll-area.tsx              # @radix-ui/react-scroll-area
|       |-- select.tsx                    # @radix-ui/react-select + lucide
|       |-- separator.tsx                # @radix-ui/react-separator
|       |-- sheet.tsx                     # @radix-ui/react-dialog + lucide
|       |-- sidebar.tsx                   # @radix-ui/react-slot + cva + lucide
|       |-- skeleton.tsx                  # Pure React
|       |-- slider.tsx                    # @radix-ui/react-slider
|       |-- sonner.tsx                    # sonner
|       |-- switch.tsx                    # @radix-ui/react-switch
|       |-- table.tsx                     # Pure React
|       |-- tabs.tsx                      # @radix-ui/react-tabs
|       |-- textarea.tsx                  # Pure React
|       |-- toggle.tsx                    # @radix-ui/react-toggle + cva
|       |-- toggle-group.tsx             # @radix-ui/react-toggle-group + cva
|       |-- tooltip.tsx                   # @radix-ui/react-tooltip
|       |-- use-mobile.ts               # Custom hook (media query)
|       +-- utils.ts                     # cn() helper (clsx + tailwind-merge)
|
|-- hooks/                               # === React Custom Hooks ===
|   |-- useAI.ts                          # AI provider abstraction
|   |-- useBackendConnection.ts           # Backend connection state
|   |-- useChannelConfig.ts               # Channel/AI config management
|   |-- useChannelManager.ts              # Multi-channel manager
|   |-- useChatPersistence.ts             # Chat history localStorage
|   |-- useFamilySystem.ts               # ** Core hook ** Family system state machine
|   |                                     #   (signals, agents, /kb command, RAG pipeline)
|   |-- useSupabaseSync.ts               # Supabase real-time sync
|   +-- useUISettings.ts                 # UI preferences persistence
|
|-- services/                            # === Frontend Service Layer ===
|   |-- backend-bridge.ts                # WebSocket + REST bridge to Bun :3080
|   |-- agent-router.ts                  # Peer-to-peer agent routing engine
|   +-- intent-parser.ts                 # Natural language intent parser
|
|-- types/                               # === TypeScript Type Definitions ===
|   |-- agent-personas.ts                # Agent personality/persona types
|   |-- backend-contract.ts              # Backend API contract types
|   |-- family-manifest.ts               # Family member manifest schema
|   |-- philosophy-framework.ts          # Philosophy framework types
|   |-- protocol.ts                      # FamilySignal protocol (incl. ragContext)
|   +-- storage.ts                       # Storage/persistence types
|
|-- utils/
|   |-- validation.ts                    # Input validation utilities
|   +-- supabase/
|       +-- info.tsx                     # Supabase connection info
|
|-- tests/
|   +-- kb-integration.test.tsx          # KB integration tests (6 groups, 25+ cases)
|
|-- bun-server/                          # === Bun Runtime Backend v2.0 (18 files) ===
|   |-- package.json                     # Backend dependencies
|   |-- tsconfig.json                    # Bun TypeScript config
|   |-- env-template.txt                 # .env template (S1-S10, 80+ variables)
|   |-- index.ts                         # ** Main server ** HTTP + WebSocket + 48+ API routes
|   |-- config.ts                        # Centralized config (S1-S10 env parsing)
|   |                                    #
|   |-- # --- Sub-System 1: LLM Proxy ---
|   |-- llm-proxy.ts                     # Multi-model LLM proxy (DeepSeek/Ollama/Anthropic/OpenAI/Qwen)
|   |                                    #
|   |-- # --- Sub-System 2: MCP Protocol Server ---
|   |-- mcp-server.ts                    # MCP tools/resources/prompts server
|   |                                    #
|   |-- # --- Sub-System 3: Workflow Engine ---
|   |-- workflow-engine.ts               # DAG workflow engine with step execution
|   |                                    #
|   |-- # --- Sub-System 4: Plugin Manager ---
|   |-- plugin-manager.ts               # Plugin lifecycle & sandbox management
|   |                                    #
|   |-- # --- Sub-System 5: Knowledge Base (6-Module) ---
|   |-- knowledge-base.ts               # Core KB: CRUD, embedding, vector search, RAG
|   |-- kb-types.ts                      # KB type definitions
|   |-- kb-file-processor.ts             # Document processor (md/txt/docx/pdf/xlsx)
|   |-- kb-knowledge-graph.ts            # Knowledge graph builder
|   |-- kb-sync-engine.ts               # Auto-indexing & sync engine
|   |                                    #
|   |-- # --- Sub-System 6: IDE Bridge ---
|   |-- ide-bridge.ts                    # Project analysis, Git status, file watcher
|   |                                    #
|   |-- # --- Infrastructure ---
|   |-- db.ts                            # Database abstraction (SQLite/Postgres)
|   |-- db-init.ts                       # Schema initialization
|   |-- redis-client.ts                  # Redis client (optional, in-memory fallback)
|   +-- auth.ts                          # JWT auth middleware
|
|-- supabase/                            # === Supabase (Optional Cloud Sync) ===
|   |-- schema.sql                       # Base schema
|   |-- family-schema.sql               # Family-specific tables
|   +-- functions/
|       +-- server/
|           |-- index.tsx                # Edge function entry
|           +-- kv_store.tsx             # KV store edge function
|
|-- docs/                                # === Documentation (12 files) ===
|   |-- LOCAL_DEPLOYMENT.md              # Local deployment guide
|   |-- LOCAL_STORAGE_ARCHITECTURE.md    # Storage architecture
|   |-- TRUST_MENTORSHIP_AGREEMENT.md    # Trust agreement
|   |-- YYC3-AI-Knowledge-Base.md        # KB documentation [manually edited]
|   |-- YYC3-AI-Family-02.md             # Development log #02
|   |-- YYC3-AI-Family-05.md             # Development log #05
|   |-- YYC3-AI-Family-11.md             # Development log #11
|   |-- YYC3-AI-Family-12.md             # Development log #12
|   |-- YYC3-AI-Family-13.md             # Development log #13
|   |-- YYC3-AI-Family-14.md             # Development log #14
|   |-- YYC3-AI-Family-15.md             # Development log #15
|   +-- YYC3-AI-Family-16.md             # Development log #16
|
|-- guidelines/
|   +-- Guidelines.md                    # Project guidelines
|
|-- yyc3.md                              # Project overview
|-- useSupabaseSync.md                   # Supabase sync documentation
+-- Attributions.md                      # Attributions & licenses
```

---

## 2. Dependency Map (Module Import Graph)

### 2.1 Component Dependency Flow

```
App.tsx
 +-- FamilyDashboard.tsx (main hub)
 |    +-- MemberCard.tsx
 |    +-- MemberDetailPanel.tsx
 |    +-- CommunicationLog.tsx (RAGContextCards)
 |    +-- CommandConsole.tsx
 |    +-- NetworkTopology.tsx (Canvas rendering)
 |    +-- FiveDimensionsPanel.tsx
 |    +-- DimensionStageMatrix.tsx
 |    +-- PhilosophyFramework.tsx
 |    +-- SystemProtocols.tsx
 |    +-- TechAuditPanel.tsx
 |    +-- BackendPanel.tsx (7-tab ops center)
 |    +-- KnowledgeBasePanel.tsx
 |    +-- Chat.tsx
 |    |    +-- ChatSidebar.tsx / ClaudeSidebar.tsx
 |    |    +-- ChatContainer.tsx
 |    |    |    +-- ChatMessage.tsx
 |    |    |    +-- ChatInput.tsx
 |    |    +-- ArtifactsPanel.tsx
 |    |    +-- ClaudeWelcome.tsx
 |    |    +-- SettingsModal.tsx
 |    +-- YYC3Background.tsx
 |
 +-- hooks/
 |    +-- useFamilySystem.ts  --> services/backend-bridge.ts --> WS/REST :3080
 |    |                       --> services/agent-router.ts
 |    |                       --> services/intent-parser.ts
 |    +-- useAI.ts
 |    +-- useBackendConnection.ts
 |    +-- useChannelConfig.ts
 |    +-- useChannelManager.ts
 |    +-- useChatPersistence.ts
 |    +-- useUISettings.ts
 |    +-- useSupabaseSync.ts
 |
 +-- types/ (protocol.ts, agent-personas.ts, backend-contract.ts, ...)
```

### 2.2 Backend Module Dependency Flow

```
bun-server/index.ts (HTTP + WebSocket server)
 |-- config.ts         (env parsing, ALL modules import from here)
 |-- db.ts             (SQLite via bun:sqlite, optional Postgres)
 |-- db-init.ts        (schema migration)
 |-- redis-client.ts   (optional ioredis, in-memory fallback)
 |-- auth.ts           (JWT middleware)
 |-- llm-proxy.ts      (DeepSeek/Ollama/Anthropic/OpenAI/Qwen)
 |-- mcp-server.ts     (MCP protocol: tools, resources, prompts)
 |-- workflow-engine.ts (DAG workflow execution)
 |-- plugin-manager.ts (plugin lifecycle, sandbox)
 |-- knowledge-base.ts (core KB: CRUD, embedding, vector search)
 |   +-- kb-types.ts
 |   +-- kb-file-processor.ts  (docx/pdf/xlsx dynamic require)
 |   +-- kb-knowledge-graph.ts
 |   +-- kb-sync-engine.ts
 +-- ide-bridge.ts     (project analysis, git status)
```

### 2.3 Frontend-Backend Communication

```
[React Frontend :5173]                    [Bun Backend :3080]
        |                                         |
        |--- WebSocket (signals) --------->  ws://localhost:3080
        |<-- WebSocket (broadcasts) ------        |
        |                                         |
        |--- REST GET /api/health -------->  Health check
        |--- REST GET /api/config -------->  Runtime config
        |--- REST GET /api/family/members -> Agent list
        |--- REST POST /api/kb/search ---->  Semantic search
        |--- REST GET /api/kb/stats ------>  KB statistics
        |--- REST GET /api/kb/graph ------>  Knowledge graph
        |--- REST POST /api/llm/chat ----->  LLM chat proxy
        |--- REST GET /api/mcp/tools ----->  MCP tool list
        |--- REST GET /api/workflow/list -> Workflow list
        |--- REST GET /api/plugin/list --> Plugin list
        |--- REST GET /api/ide/overview -> IDE overview
        |--- ... (48+ endpoints total)         |
```

---

## 3. Path Alias Convention

The project uses `@/` as a root-level path alias:

```typescript
// In components/family/*.tsx:
import { cn } from '@/components/ui/utils';

// Resolves to: <project-root>/components/ui/utils.ts
```

**Required configuration (vite.config.ts):**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),  // Root = project root (NOT src/)
    },
  },
});
```

**Required configuration (tsconfig.json):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## 4. Animation Library Note

The project uses **two import paths** for the same underlying library:

| Import Path | Used By | Package to Install |
|---|---|---|
| `from 'framer-motion'` | `components/family/*.tsx`, `SettingsModal.tsx` | `framer-motion` |
| `from 'motion/react'` | `Chat.tsx`, `ChatContainer.tsx`, `ChatMessage.tsx`, `ArtifactsPanel.tsx`, etc. | `motion` |

Both `framer-motion` and `motion` are by the same author. `motion` v11+ re-exports `framer-motion` under the `motion/react` subpath. **Install both** to ensure all imports resolve:

```bash
bun add framer-motion motion
```

---

## 5. Complete Dependency Installation

### 5.1 Frontend (Project Root)

```bash
cd AI-Family-DveOps

# === Core React + Build ===
bun add react react-dom
bun add -d @types/react @types/react-dom
bun add -d vite @vitejs/plugin-react
bun add -d typescript

# === Tailwind CSS v4 ===
bun add -d tailwindcss @tailwindcss/vite

# === Animation ===
bun add framer-motion motion

# === UI Primitives (ShadCN / Radix UI) ===
bun add @radix-ui/react-accordion \
        @radix-ui/react-alert-dialog \
        @radix-ui/react-aspect-ratio \
        @radix-ui/react-avatar \
        @radix-ui/react-checkbox \
        @radix-ui/react-collapsible \
        @radix-ui/react-context-menu \
        @radix-ui/react-dialog \
        @radix-ui/react-dropdown-menu \
        @radix-ui/react-hover-card \
        @radix-ui/react-label \
        @radix-ui/react-menubar \
        @radix-ui/react-navigation-menu \
        @radix-ui/react-popover \
        @radix-ui/react-progress \
        @radix-ui/react-radio-group \
        @radix-ui/react-scroll-area \
        @radix-ui/react-select \
        @radix-ui/react-separator \
        @radix-ui/react-slider \
        @radix-ui/react-slot \
        @radix-ui/react-switch \
        @radix-ui/react-tabs \
        @radix-ui/react-toggle \
        @radix-ui/react-toggle-group \
        @radix-ui/react-tooltip

# === UI Utilities ===
bun add class-variance-authority \
        clsx \
        tailwind-merge \
        lucide-react \
        sonner \
        cmdk \
        vaul \
        input-otp \
        react-day-picker \
        react-hook-form \
        react-resizable-panels \
        embla-carousel-react \
        recharts
```

**One-liner (copy-paste ready):**

```bash
bun add react react-dom framer-motion motion @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip class-variance-authority clsx tailwind-merge lucide-react sonner cmdk vaul input-otp react-day-picker react-hook-form react-resizable-panels embla-carousel-react recharts && bun add -d @types/react @types/react-dom vite @vitejs/plugin-react typescript tailwindcss @tailwindcss/vite
```

### 5.2 Backend (bun-server/)

```bash
cd bun-server

# === Core (already in package.json) ===
bun install

# === Document Processors (optional, for docx/pdf/xlsx KB ingestion) ===
bun add mammoth pdf-parse xlsx

# === Database (optional, for Postgres/Redis mode) ===
# Uncomment if not using in-memory/SQLite defaults:
# bun add postgres ioredis
```

**Backend one-liner:**

```bash
cd bun-server && bun install && bun add mammoth pdf-parse xlsx
```

### 5.3 Vite Config (create if not exists)

**`vite.config.ts`** (project root):

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3080',
        ws: true,
      },
    },
  },
});
```

### 5.4 TypeScript Config (create if not exists)

**`tsconfig.json`** (project root):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "src",
    "App.tsx",
    "components",
    "hooks",
    "services",
    "types",
    "utils",
    "tests"
  ]
}
```

### 5.5 HTML Entry (create if not exists)

**`index.html`** (project root):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>YYC3 AI Family</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 5.6 Environment Setup

```bash
cd bun-server
cp env-template.txt .env

# Minimum: fill in your DeepSeek API key
# DEEPSEEK_API_KEY=sk-xxxx...
```

---

## 6. Quick Start Commands

```bash
# === Terminal 1: Frontend ===
cd AI-Family-DveOps
bun install          # or npm install
bun dev              # or npm run dev  --> http://localhost:5173

# === Terminal 2: Backend ===
cd AI-Family-DveOps/bun-server
cp env-template.txt .env
# Edit .env: set DEEPSEEK_API_KEY=sk-xxx
bun install
bun add mammoth pdf-parse xlsx
bun run dev          # --> http://localhost:3080

# === Verify ===
curl http://localhost:3080/api/health    # Backend health
open http://localhost:5173               # Frontend UI
```

---

## 7. Key Files (Manually Edited, Do Not Overwrite)

These files have been manually edited and their current on-disk content is authoritative:

| File | Reason |
|---|---|
| `bun-server/env-template.txt` | Manual environment variable customization |
| `docs/YYC3-AI-Knowledge-Base.md` | Manual KB documentation edits |
| `components/family/DimensionStageMatrix.tsx` | Manual UI/logic adjustments |
| `Max-AI.md` | Manual startup log (front/backend records) |

## 7.1 Critical Fixes Applied (v2.0.1)

| Issue | Root Cause | Fix |
|---|---|---|
| Page garbled / no styling | `globals.css` missing `@import "tailwindcss"` (Tailwind v4 mandatory) | Added `@import "tailwindcss"` as first line |
| CSP blocks eval | App.tsx inline `<style>` with `@import url(Google Fonts)` | Moved all inline styles to `globals.css` |
| Stylesheet load failure | Tailwind v4 directives not processed without framework import | Fixed by `@import "tailwindcss"` |
| Google Fonts slow load | No `preconnect` hints | Added `<link rel="preconnect">` to `index.html` |

---

## 8. Subsystem Status Summary

| # | Subsystem | Backend Files | Frontend Panel | API Endpoints | Status |
|---|-----------|--------------|----------------|---------------|--------|
| 1 | LLM Proxy | `llm-proxy.ts` | BackendPanel Tab 1 | `/api/llm/*` | Ready |
| 2 | MCP Server | `mcp-server.ts` | BackendPanel Tab 2 | `/api/mcp/*` | Ready |
| 3 | Workflow Engine | `workflow-engine.ts` | BackendPanel Tab 3 | `/api/workflow/*` | Ready |
| 4 | Plugin Manager | `plugin-manager.ts` | BackendPanel Tab 4 | `/api/plugin/*` | Ready |
| 5 | Knowledge Base | `knowledge-base.ts` + 4 modules | KB River Panel + `/kb` cmd | `/api/kb/*` | Ready |
| 6 | IDE Bridge | `ide-bridge.ts` | BackendPanel Tab 5 | `/api/ide/*` | Ready |

**LLM Dual-Link:** Primary = DeepSeek API (`deepseek-chat`) | Fallback = Ollama Local (`qwen3-coder:30b`)

---

## 9. Package Count Summary

| Category | Count |
|---|---|
| Frontend components (`components/`) | 44 files |
| ShadCN UI components (`components/ui/`) | 32 files |
| Family panels (`components/family/`) | 13 files |
| Hooks (`hooks/`) | 8 files |
| Services (`services/`) | 3 files |
| Types (`types/`) | 6 files |
| Backend (`bun-server/`) | 18 files |
| Documentation (`docs/`) | 12 files |
| Tests (`tests/`) | 1 file |
| Config/Root files | 5 files |
| **Total** | **~118 files** |

| Dependency Type | Count |
|---|---|
| Radix UI primitives | 26 packages |
| UI utilities | 12 packages |
| Animation | 2 packages |
| Build tooling (dev) | 5 packages |
| Backend (bun-server) | 4+ packages |
| **Total npm packages** | **~49 packages** |