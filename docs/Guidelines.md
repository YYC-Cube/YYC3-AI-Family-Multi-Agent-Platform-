**YYC³ AI Family - Figma Make AI Design Guide (Complete Edition)**

<!--
   ██╗   ██╗██╗   ██╗ ██████╗██████╗     ███████╗  █████╗  ███╗   ███╗ ██╗  ██╗    ██╗   ██╗
   ╚██╗ ██╔╝╚██╗ ██╔╝██╔════╝╚════██╗    ██╔════╝ ██╔══██╗ ████╗ ████║ ██║  ██║    ╚██╗ ██╔╝
    ╚████╔╝  ╚████╔╝ ██║      █████╔╝    █████╗   ███████║ ██╔████╔██║ ██║  ██║     ╚████╔╝
     ╚██╔╝    ╚██╔╝  ██║      ╚═══██╗    ██╔══╝   ██╔══██║ ██║╚██╔╝██║ ██║  ██║      ╚██╔╝
      ██║      ██║   ╚██████╗██████╔╝    ██║      ██║  ██║ ██║ ╚═╝ ██║ ██║  ███████╗  ██║
      ╚═╝      ╚═╝    ╚═════╝╚═════╝     ╚═╝      ╚═╝  ╚═╝ ╚═╝     ╚═╝ ╚═╝  ╚══════╝  ╚═╝

  YYC³ AI Family - Figma Make AI Design Guide v3.0
  万象归元于云枢 | 深栈智启新纪元
  All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence
  
  感恩 Figma Make 对人机协同的支持！感恩智谱大模型授权！
-->

---

## SECTION 0: First Interaction Prompt (Figma Make Bootstrap)

> **Copy this as the first message when starting a new Figma Make session:**

```
I'm building "YYC³ AI Family" — a multi-agent collaborative intelligence platform.

TECH STACK:
- Frontend: React 18 + Tailwind CSS v4 (dark theme, slate-950 base) + ShadCN UI + Motion (framer-motion)
- Backend: Bun Runtime on port 3080 (WebSocket + REST, 48+ APIs)
- LLM: 6 providers (BigModel GLM primary, DeepSeek, Ollama, Anthropic, OpenAI, Qwen)
- DB: PostgreSQL 15 (port 5433) + SQLite auto-fallback
- Host: Apple M4 Max 128GB

ARCHITECTURE:
- 7 AI Family roles (沫言总/人类导师/智源架构师/织码工匠/守护哨兵/中枢灵脉/协作使者)
- Each role maps to a dedicated GLM model (glm-4-plus/codegeex-4/glm-4-flash/glm-4-air)
- "Five-in-One" philosophy: Standardization, Process, Normalization, Intelligence, National Standards
- Frontend ↔ Backend via WebSocket signals + REST APIs (see /types/backend-contract.ts)
- BigModel SDK (Phase 73) with MCP tool bridge integrated

Please read /guidelines/Guidelines.md for full project context, type system, component catalog, and coding conventions before making any changes.
```

---

## SECTION 1: Project Identity & Philosophy

### 1.1 Brand DNA

| Key | Value |
|-----|-------|
| Full Name | YYC³ (YanYuCloudCube) AI Family |
| Chinese | 言语云立方智能家族 |
| Slogan | 万象归元于云枢；深栈智启新纪元 |
| English | All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence |
| Core Philosophy | 人机共生，智慧同行；以AI为魂，以流程为骨，以规范为脉 |
| Acknowledgment | 感恩智谱大模型授权，致敬GLM-PC的卓越支持！感恩Figma对人机协同的支持！ |

### 1.2 Five-in-One Law (五化一体)

The foundational philosophical framework driving ALL design decisions:

| Dimension | ID | Core Meaning |
|-----------|----|-------------|
| Standardization | `STANDARDIZATION` | AI-driven living standards that self-evolve |
| Process | `PROCESS` | AI-sensed, dynamically orchestrated workflows |
| Normalization | `NORMALIZATION` | Built-in immune system for security & compliance |
| Intelligence | `INTELLIGENCE` | AI as the operating system, not a feature |
| National Standard | `NATIONAL_STD` | GB/T 22239, GB/T 35273, GB/T 25069 compliance |

### 1.3 Five Dimensions of Depth (五维深度)

| Dimension | ID | Metaphor | Color |
|-----------|----|----------|-------|
| Agent Role Differentiation | `AGENT_DIFFERENTIATION` | Multi-Soul | `#38bdf8` sky |
| Peer Communication | `PEER_COMMUNICATION` | Wisdom Bloodline | `#fbbf24` amber |
| Human-AI Fusion | `HUMAN_AI_FUSION` | Life Essence | `#4ade80` green |
| Multimodal Fusion | `MULTIMODAL_FUSION` | Sensory Nerves | `#f472b6` pink |
| Deep Reasoning | `DEEP_REASONING` | Wisdom Core | `#a78bfa` violet |

---

## SECTION 2: Technical Architecture Overview

### 2.1 System Topology

```
[User Browser]
    |
    ├── React 18 + Tailwind v4 + ShadCN UI
    │     ├── /App.tsx                    → Entry (FamilyDashboard + Toaster)
    │     ├── /components/family/*        → 14 dashboard components
    │     ├── /components/ui/*            → ShadCN component library
    │     ├── /hooks/*                    → 10 custom hooks
    │     ├── /services/*                 → BackendBridge, AgentRouter, IntentParser
    │     └── /types/*                    → 9 type definition files
    │
    ├── WebSocket (:3080) ←──────────── Real-time signals
    │     └── FamilySignal protocol
    │
    └── REST API (:3080) ←───────────── CRUD + MCP orchestration
          └── 48+ endpoints
                
[Bun Runtime Server]  /bun-server/
    ├── index.ts        → Server entry + WS handler
    ├── config.ts       → Centralized env config (§1-§10)
    ├── llm-proxy.ts    → 6-provider LLM routing
    ├── mcp-server.ts   → MCP protocol + BigModel tool bridge
    ├── workflow-engine.ts → Creation Septet pipeline
    ├── plugin-manager.ts  → Dynamic plugin system
    ├── knowledge-base.ts  → RAG + vector search
    ├── ide-bridge.ts      → IDE integration
    ├── bigmodel-sdk/*     → BigModel Z.ai SDK Phase 73
    │     ├── index.ts
    │     ├── tools/*
    │     └── mcp/         → MCPToolBridge + MCPOrchestrator
    ├── db.ts / db-init.ts → PostgreSQL + SQLite dual engine
    └── redis-client.ts    → Cache + pub/sub
```

### 2.2 Seven Family Roles (家族七子)

| Role ID | Name | Model | Duty | Color |
|---------|------|-------|------|-------|
| `PRODUCT_MANAGER` | 沫言总 | `glm-4-plus` | Value Definition | `#FFD700` Gold |
| `CHIEF_ARCHITECT` | 人类导师 | `glm-4-plus` | Strategic Ethics | `#C0C0C0` Silver |
| `AI_ARCHITECT` | 智源架构师 | `glm-4-plus` | Architecture Design | `#00BFFF` Sky Blue |
| `CODE_ARTISAN` | 织码工匠 | `codegeex-4` | Code Implementation | `#32CD32` Lime |
| `SENTINEL` | 守护哨兵 | `glm-4-plus` | Security Audit | `#FF4500` Orange Red |
| `CENTRAL_PULSE` | 中枢灵脉 | `glm-4-flash` | Flow Orchestration | `#9370DB` Purple |
| `COLLABORATOR` | 协作使者 | `glm-4-air` | Cross-Platform | `#FF69B4` Pink |

### 2.3 LLM Provider Chain (6 engines)

Priority: BigModel (GLM) → DeepSeek → Anthropic → OpenAI → Qwen → Ollama (local fallback)

```typescript
type LLMProvider = 'bigmodel' | 'deepseek' | 'anthropic' | 'openai' | 'qwen' | 'ollama';
```

### 2.4 Creation Septet (创生七步曲)

```
SPARK → BLUEPRINT → WEAVING → GAZE → PULSE → BIRTH → GUARDIAN
 意念     蓝图        编织      凝视    合奏     诞生     守护
 PM      Architect   Artisan  Sentinel Pulse   Pulse   Sentinel
```

---

## SECTION 3: Type System (Single Source of Truth)

### 3.1 Type File Catalog

All types live in `/types/`. **Never duplicate type definitions.** Import from the canonical source.

| File | Domain | Key Exports |
|------|--------|-------------|
| `family-manifest.ts` | Core DNA | `RoleId`, `FamilyMood`, `FiveInOneDimension`, `FiveDimensionId`, `CreationStage`, `DeviceNode`, `FAMILY_ROLES`, `FIVE_DIMENSIONS`, `ROLE_DIMENSION_MAP`, `DIMENSION_STAGE_MATRIX` |
| `protocol.ts` | Communication | `FamilySignal`, `SignalType`, `UIAction`, `PeerDialogueChain`, `ModelRouteConfig`, `FamilySystemState` |
| `backend-contract.ts` | Frontend↔Backend | `WS_*` (all WebSocket message types), `InboundMessage`, `OutboundMessage`, REST API contracts |
| `agent-personas.ts` | AI Personality | `AgentPersona`, `AGENT_PERSONAS`, `getSystemPrompt()`, `getPersonaTraits()` |
| `philosophy-framework.ts` | Philosophy | `PhilosophyPillar`, `FIVE_HIGHS`, `FIVE_STANDARDS`, `FIVE_TRANSFORMATIONS`, `CORE_SLOGANS`, `PARADIGM_SHIFTS` |
| `terminal.ts` | Terminal | `TerminalLine`, `TerminalTab`, `TerminalPersistState`, `BuiltinCommandDef` |
| `mcp-orchestrator.ts` | MCP Frontend | `MCPOrchestrateRequest/Response`, `ToolCallRoundInfo`, `MCPToolListItem` |
| `bigmodel-hooks.ts` | Hook API | `BigModelMessage`, `BigModelResponse`, `UseBigModelConfig`, `UseBigModelReturn`, `UseChatReturn`, `UseChatStreamReturn`, `UseMCPOrchestratorReturn`, `LLMProviderType`, `RoleModelInfo` |
| `storage.ts` | Persistence | Storage key definitions |

### 3.2 Critical Type Rules

```typescript
// ALWAYS import RoleId from family-manifest (canonical source)
import { RoleId } from '../types/family-manifest';

// NEVER create inline role string unions — use the RoleId type
// BAD:  type Role = 'AI_ARCHITECT' | 'CODE_ARTISAN';
// GOOD: import { RoleId } from '../types/family-manifest';

// FamilyMemberState canonical source: /hooks/useFamilySystem.ts
import type { FamilyMemberState } from '../hooks/useFamilySystem';

// LogMessage canonical source: /components/family/CommunicationLog.tsx
import type { LogMessage } from '../components/family/CommunicationLog';

// WebSocket messages: /types/backend-contract.ts
import type { InboundMessage, OutboundMessage } from '../types/backend-contract';
```

### 3.3 Type Deduplication Mandate

The following types exist in BOTH `/types/*.ts` and inline in implementation files. **Always prefer `/types/` versions for new code:**

| Type | Canonical Location | Also In (legacy) |
|------|-------------------|-------------------|
| `BigModelMessage` | `/types/bigmodel-hooks.ts` | `/hooks/useBigModel.ts` (inline) |
| `BigModelResponse` | `/types/bigmodel-hooks.ts` | `/hooks/useBigModel.ts` (inline) |
| `MCPOrchestrateRequest` | `/types/mcp-orchestrator.ts` | `/types/backend-contract.ts` (duplicate) |
| `WS_TerminalExec` | `/types/terminal.ts` | `/types/backend-contract.ts` (duplicate) |

**Tech debt target:** Migrate all inline type definitions to `/types/` files and re-export.

---

## SECTION 4: Component Architecture

### 4.1 Component Catalog

| Component | Path | Purpose |
|-----------|------|---------|
| `FamilyDashboard` | `/components/family/FamilyDashboard.tsx` | Root layout: header + chat + bottom bar (avatar rail + input) |
| `CommandConsole` | `/components/family/CommandConsole.tsx` | Chat input with slash commands, context tag, send button |
| `CommunicationLog` | `/components/family/CommunicationLog.tsx` | Message list with flex-col-reverse scroll, RAG context cards |
| `MemberCard` | `/components/family/MemberCard.tsx` | Compact member card with avatar, mood, status |
| `MemberDetailPanel` | `/components/family/MemberDetailPanel.tsx` | Full member detail overlay |
| `NetworkTopology` | `/components/family/NetworkTopology.tsx` | Interactive network graph |
| `FiveDimensionsPanel` | `/components/family/FiveDimensionsPanel.tsx` | 5D Genome visualization (cycle + matrix modes) |
| `DimensionStageMatrix` | `/components/family/DimensionStageMatrix.tsx` | 5D × 7-Stage heatmap matrix |
| `PhilosophyFramework` | `/components/family/PhilosophyFramework.tsx` | 五高五标五化 philosophy visualization |
| `SystemProtocols` | `/components/family/SystemProtocols.tsx` | Protocol documentation overlay |
| `BackendPanel` | `/components/family/BackendPanel.tsx` | Backend connection config UI |
| `TechAuditPanel` | `/components/family/TechAuditPanel.tsx` | Technical debt & audit dashboard |
| `KnowledgeBasePanel` | `/components/family/KnowledgeBasePanel.tsx` | RAG knowledge base search UI |
| `IntegratedTerminal` | `/components/family/IntegratedTerminal.tsx` | Multi-tab terminal with HA reconnection |

### 4.2 Layout Structure (Current)

```
┌─────────────────────────────────────────────────┐
│  HEADER: Title + Status + [BRIDGE] [PULSE] [TOOLS ▼] │
├─────────────────────────────────────────────────┤
│                                                 │
│              COMMUNICATION LOG                  │
│         (flex-col-reverse scroll)               │
│         Messages anchored to bottom             │
│                                                 │
├────────┬────────────────────────────────────────┤
│ AVATAR │         COMMAND CONSOLE                │
│  RAIL  │  [TO: target] [input...] [SEND]        │
│ (56px/ │  /5d /peer /kb /stats /philosophy      │
│ 200px) │                                        │
└────────┴────────────────────────────────────────┘
```

- Avatar rail: collapsed (56px, stacked circles) or expanded (200px, name + activity)
- Uses `items-stretch` for synchronized height between avatar rail and input console
- Header TOOLS dropdown: 2-column grid with all panel toggles

### 4.3 Hook Catalog

| Hook | Path | Purpose |
|------|------|---------|
| `useFamilySystem` | `/hooks/useFamilySystem.ts` | Core state: members, signals, messages, peer mode, dispatch |
| `useBackendConnection` | `/hooks/useBackendConnection.ts` | WebSocket + REST connection management |
| `useBigModel` | `/hooks/useBigModel.ts` | BigModel LLM hooks (complete, chat, stream, MCP) |
| `useChannelManager` | `/hooks/useChannelManager.ts` | Multi-channel conversation routing |
| `useChannelConfig` | `/hooks/useChannelConfig.ts` | Per-channel configuration |
| `useChatPersistence` | `/hooks/useChatPersistence.ts` | localStorage chat history |
| `useUISettings` | `/hooks/useUISettings.ts` | UI preference persistence |
| `useAI` | `/hooks/useAI.ts` | Generic AI completion hook |
| `useSupabaseSync` | `/hooks/useSupabaseSync.ts` | Supabase data sync (optional) |

### 4.4 Service Catalog

| Service | Path | Purpose |
|---------|------|---------|
| `BackendBridge` | `/services/backend-bridge.ts` | WebSocket + REST bridge to Bun server |
| `AgentRouter` | `/services/agent-router.ts` | Peer dialogue routing, model ratio (1:2) |
| `IntentParser` | `/services/intent-parser.ts` | NLP intent extraction from user input |

---

## SECTION 5: Design System & Visual Language

### 5.1 Color Palette

```css
/* Base */
--bg-primary: #020617;       /* slate-950 */
--bg-secondary: #0f172a;     /* slate-900 */
--bg-elevated: rgba(15,23,42,0.8);

/* Role Colors (from FAMILY_ROLES) */
--color-pm: #FFD700;         /* Gold - 沫言总 */
--color-ca: #C0C0C0;         /* Silver - 人类导师 */
--color-architect: #00BFFF;  /* DeepSkyBlue - 智源架构师 */
--color-artisan: #32CD32;    /* LimeGreen - 织码工匠 */
--color-sentinel: #FF4500;   /* OrangeRed - 守护哨兵 */
--color-pulse: #9370DB;      /* MediumPurple - 中枢灵脉 */
--color-collaborator: #FF69B4; /* HotPink - 协作使者 */

/* Dimension Colors (from FIVE_DIMENSIONS) */
--dim-agent: #38bdf8;        /* sky-400 */
--dim-peer: #fbbf24;         /* amber-400 */
--dim-human-ai: #4ade80;     /* green-400 */
--dim-multimodal: #f472b6;   /* pink-400 */
--dim-reasoning: #a78bfa;    /* violet-400 */

/* Status */
--status-online: #10b981;    /* emerald-500 */
--status-warning: #f59e0b;   /* amber-500 */
--status-error: #ef4444;     /* red-500 */
--status-mock: #3b82f6;      /* blue-500 */
```

### 5.2 Typography

- **Primary Font:** Inter (sans-serif)
- **Mono Font:** JetBrains Mono (code, status indicators, protocol text)
- **Headlines:** `bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400`
- **Status Text:** `text-[10px] font-mono uppercase tracking-widest`
- **Do NOT use** Tailwind font-size/font-weight/line-height classes unless explicitly requested

### 5.3 UI Patterns

- **Glass morphism:** `bg-slate-900/80 backdrop-blur-xl border border-white/[0.06]`
- **Elevated cards:** `bg-black/20 border border-white/5 rounded-xl`
- **Buttons (mono):** `px-2.5 py-1.5 rounded-lg text-xs font-mono border`
- **Active indicators:** `ring-2 ring-emerald-500 scale-110`
- **Ambient glow:** Blurred colored circles in background layer
- **Motion:** Use `motion/react` (Motion library), NOT "framer-motion" naming

### 5.4 Iconography

- **Library:** `lucide-react`
- **Size convention:** `w-3 h-3` (status), `w-4 h-4` (buttons), `w-5 h-5` (header)
- **Dimension icons:** Users, MessageCircle, Handshake, Layers, Brain

---

## SECTION 6: Backend API Contract Summary

### 6.1 WebSocket Protocol (port 3080)

**Inbound (Frontend → Bun):**

| Type | Interface | Purpose |
|------|-----------|---------|
| `ping` | `WS_Ping` | Heartbeat |
| `subscribe` | `WS_Subscribe` | Channel subscription |
| `dispatch_signal` | `WS_DispatchSignal` | Send FamilySignal |
| `update_member` | `WS_UpdateMember` | Update member state |
| `get_members` | `WS_GetMembers` | Fetch all members |
| `agent_call` | `WS_AgentCall` | LLM call with 4-layer SystemPrompt |
| `terminal_exec` | `WS_TerminalExec` | Terminal command execution |

**Outbound (Bun → Frontend):**

| Type | Interface | Purpose |
|------|-----------|---------|
| `pong` | `WS_Pong` | Heartbeat response |
| `signal` | `WS_Signal` | Broadcast signal |
| `agent_response` | `WS_AgentResponse` | LLM response with model/latency/usage |
| `member_update` | `WS_MemberUpdate` | Member state change |
| `system_event` | `WS_SystemEvent` | System notifications |
| `error` | `WS_Error` | Error notification |
| `terminal_output` | `WS_TerminalOutput` | Terminal output stream |

### 6.2 Key REST Endpoints

| Method | Path | Contract |
|--------|------|----------|
| GET | `/api/health` | `HealthResponse` |
| GET | `/api/family/members` | `MembersListResponse` |
| PATCH | `/api/family/members/:roleId` | `MemberUpdateRequest` |
| POST | `/api/agent/:roleId` | `AgentCallRequest` → `AgentCallResponse` |
| POST | `/api/mcp/orchestrate` | `MCPOrchestrateRequest` → `MCPOrchestrateResponse` |
| GET | `/api/mcp/orchestrator/status` | `MCPOrchestratorStatusResponse` |
| GET | `/api/mcp/tools` | `MCPToolsListResponse` |

---

## SECTION 7: Coding Conventions & Rules

### 7.1 File Organization

```
/components/family/*    → Dashboard components (PascalCase.tsx)
/components/ui/*        → ShadCN base components (kebab-case.tsx) — DO NOT MODIFY
/hooks/*                → Custom React hooks (camelCase.ts)
/services/*             → Singleton services (kebab-case.ts)
/types/*                → Type definitions (kebab-case.ts)
/bun-server/*           → Backend code (kebab-case.ts)
/tests/*                → Test files (kebab-case.test.ts/tsx)
```

### 7.2 Import Order Convention

```typescript
// 1. React core
import React, { useState, useEffect } from 'react';

// 2. Motion / animation
import { motion, AnimatePresence } from 'framer-motion';

// 3. UI components (ShadCN)
import { cn } from '@/components/ui/utils';

// 4. Icons
import { Activity, Radio } from 'lucide-react';

// 5. Internal types
import { RoleId, FAMILY_ROLES } from '../../types/family-manifest';
import type { FamilySignal } from '../../types/protocol';

// 6. Internal hooks
import { useFamilySystem } from '../../hooks/useFamilySystem';

// 7. Internal components
import { MemberCard } from './MemberCard';

// 8. Internal services
import { getBackendBridge } from '../../services/backend-bridge';
```

### 7.3 State Management Rules

1. **No Redux / Zustand** — All state in hooks + React Context
2. `useFamilySystem` is the **single source of truth** for family state
3. `useBackendConnection` manages connection lifecycle
4. `localStorage` for persistence (chat history, terminal state, UI settings)
5. WebSocket for real-time sync, REST for CRUD

### 7.4 Component Rules

1. Every component must be a **named export** (not default)
2. Props interfaces defined in the same file, prefixed with component name
3. Use `cn()` from `@/components/ui/utils` for conditional classes
4. `AnimatePresence` wraps all conditional render blocks
5. `ImageWithFallback` for all dynamically loaded images
6. **Never** modify `/components/ui/*` (ShadCN) or `/components/figma/ImageWithFallback.tsx`

### 7.5 Motion / Animation Rules

```typescript
// CORRECT: Import from motion/react
import { motion, AnimatePresence } from 'motion/react';
// or from framer-motion (aliased)
import { motion, AnimatePresence } from 'framer-motion';

// Standard enter/exit pattern:
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.3 }}
/>
```

### 7.6 Signal Protocol Rules

Every communication between family members MUST use `FamilySignal`:

```typescript
const signal: FamilySignal = {
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  type: 'RESPONSE',  // SignalType
  senderId: 'AI_ARCHITECT',
  receiverId: 'USER',
  payload: {
    content: 'Response text here',
    mood: 'FOCUSED',
    priority: 'NORMAL',
    modelSource: 'REAL',  // or 'MOCK'
  },
  metadata: {
    version: '1.0.0',
    processingTime: 245,
  },
};
```

---

## SECTION 8: Testing Standards

### 8.1 Test File Structure

```
/tests/
  ├── bigmodel-sdk.test.ts         → SDK unit tests
  ├── mcp-bridge.test.ts           → MCP tool bridge tests
  ├── mcp-orchestrator.test.ts     → Orchestrator loop tests
  ├── mcp-server-integration.test.ts → Server integration tests
  ├── terminal.test.tsx            → Terminal component tests
  ├── bigmodel-hooks.test.tsx      → React hook tests
  ├── type-contracts.test.ts       → Type compatibility tests
  └── kb-integration.test.tsx      → Knowledge base tests
```

### 8.2 Test Conventions

```typescript
// Test file naming: {feature}.test.ts or {feature}.test.tsx
// Use describe/it blocks with clear Chinese + English descriptions

describe('BigModel SDK Integration (智谱SDK集成)', () => {
  describe('Chat Completion (对话补全)', () => {
    it('should handle streaming responses correctly', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should fallback gracefully when API key is missing', async () => {
      // ...
    });
  });
});
```

### 8.3 Test Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Type contracts | 100% | ~117 cases |
| Hook return types | 100% | Covered |
| WebSocket protocol | 100% | Covered |
| Component render | > 80% | In progress |
| E2E signal flow | > 70% | Pending backend |

### 8.4 Mock Data Standards

```typescript
// Mock member data must match FamilyMemberState exactly
const mockMember: FamilyMemberState = {
  roleId: 'AI_ARCHITECT',
  mood: 'FOCUSED',
  isOnline: true,
  currentActivity: 'Designing system architecture',
  avatarUrl: 'https://images.unsplash.com/...',
  systemPrompt: AGENT_PERSONAS.AI_ARCHITECT?.systemPromptTemplate,
  capabilities: ['architecture', 'analysis'],
  permissions: { canDeploy: false, canReview: true },
};

// Mock signals must use FamilySignal with all required fields
// Mock API responses must match /types/backend-contract.ts interfaces
```

---

## SECTION 9: Known Technical Debt & Audit Status

### 9.1 Type Deduplication Queue

| Priority | Issue | Files | Resolution | Status |
|----------|-------|-------|------------|--------|
| P0 | `BigModelMessage/Response` duplicated | `/types/bigmodel-hooks.ts` + `/hooks/useBigModel.ts` | Re-export from types, remove inline | ✅ DONE |
| P0 | `MCPOrchestrateRequest/Response` duplicated | `/types/mcp-orchestrator.ts` + `/types/backend-contract.ts` | Consolidate to mcp-orchestrator, re-export | ✅ DONE |
| P0 | `WS_TerminalExec/Output` duplicated | `/types/terminal.ts` + `/types/backend-contract.ts` | Consolidate to terminal.ts, re-export | ✅ DONE |
| P1 | `FamilyMemberState` only in hook file | `/hooks/useFamilySystem.ts` | Move to `/types/family-manifest.ts` | ✅ DONE (2025-03-01) |
| P1 | `LogMessage` + `RAGContextItem` in component | `/components/family/CommunicationLog.tsx` | Move to `/types/protocol.ts` | ✅ DONE (2025-03-01) |

### 9.2 Component Architecture Debt

| Priority | Issue | Resolution | Status |
|----------|-------|------------|--------|
| P1 | 15+ boolean state variables in FamilyDashboard | Refactor to `activePanel: PanelType \| null` union | ✅ DONE (2025-03-01) |
| P1 | Modal state management scattered | Create `usePanelManager` hook | ✅ DONE (2025-03-01) |
| P2 | MemberCard has inline styled mood colors | Extract to shared theme constants | ✅ DONE (2025-03-01) |
| P2 | CommunicationLog scroll behavior complexity | Extract `useAutoScroll` hook | ✅ DONE (2025-03-01) |

### 9.3 Backend Integration Debt

| Priority | Issue | Resolution |
|----------|-------|------------|
| P0 | `.env` needs `BIGMODEL_API_KEY` for E2E tests | Configure and run `bun test tests/` |
| P1 | 14 remaining BigModel SDK tools not yet migrated | Migrate from `BigModelSDK/` to `/bun-server/bigmodel-sdk/tools/` |
| P1 | 6 MCP Server wrappers pending | Create server configs in `/bun-server/bigmodel-sdk/mcp/` |
| P2 | Streaming mode disabled by default | Enable `LLM_STREAMING_ENABLED=true` and test |

---

## SECTION 10: Workflow for Figma Make Iterations

### 10.1 Before Making Changes

1. **Read** the target component file(s) first
2. **Check** `/types/` for existing type definitions — never create duplicates
3. **Verify** the import chain — ensure no circular dependencies
4. **Understand** the FamilyDashboard layout structure (header → chat → bottom bar)

### 10.2 When Adding New Features

1. Define types in `/types/*.ts` first
2. Create component in `/components/family/` (named export)
3. Add hook in `/hooks/` if state management needed
4. Wire into `FamilyDashboard.tsx` via the TOOLS dropdown or direct integration
5. Add test cases in `/tests/`

### 10.3 When Fixing Bugs

1. Identify the signal flow: User → CommandConsole → useFamilySystem → BackendBridge → Response
2. Check if the issue is in type mismatch, state management, or rendering
3. Use `fast_apply_tool` for targeted edits; `write_tool` only for new files
4. Verify scroll direction (flex-col-reverse in CommunicationLog)

### 10.4 Protected Files (DO NOT MODIFY)

```
/components/figma/ImageWithFallback.tsx
/components/ui/*  (ShadCN library — type warnings are expected and safe to ignore)
```

---

## SECTION 11: Environment Configuration Reference

### 11.1 Required Environment Variables

```bash
# §1 Server
PORT=3080
NODE_ENV=development

# §2 LLM (at minimum ONE API key)
BIGMODEL_API_KEY=your_key_here          # Primary: 智谱GLM
DEEPSEEK_API_KEY=your_key_here          # Secondary
OLLAMA_ENABLED=true                      # Local fallback
OLLAMA_MODEL=qwen3-coder:30b

# §8 Database
DATABASE_URL=postgresql://user:pass@localhost:5433/yyc3_family
REDIS_URL=redis://localhost:6379
```

### 11.2 Per-Role Model Override

```bash
# Override any role's model assignment:
ROLE_AI_ARCHITECT_PROVIDER=bigmodel
ROLE_AI_ARCHITECT_MODEL=glm-4-plus
ROLE_CODE_ARTISAN_PROVIDER=bigmodel
ROLE_CODE_ARTISAN_MODEL=codegeex-4
ROLE_CENTRAL_PULSE_MODEL=glm-4-flash
ROLE_COLLABORATOR_MODEL=glm-4-air
```

---

## SECTION 12: Quality Gates (五高五标 Compliance)

### 12.1 Five Highs Checklist

- [ ] **High Availability:** Graceful degradation to mock mode when backend offline
- [ ] **High Performance:** < 200ms component render, < 500ms API response
- [ ] **High Security:** No PII in localStorage, sanitized user inputs
- [ ] **High Scalability:** Modular components, singleton services
- [ ] **High Maintainability:** 100% TypeScript, no `any` in public APIs

### 12.2 Five Standards Checklist

- [ ] **Standardization:** All types in `/types/`, no inline type duplication
- [ ] **Normalization:** WebSocket messages match `backend-contract.ts` exactly
- [ ] **Automation:** Test suite runnable via `bun test tests/`
- [ ] **Intelligence:** AI personas drive response personality
- [ ] **Visualization:** All system states visible in dashboard panels

---

 Some of the base components you are using may have styling(eg. gap/typography) baked in as defaults.
So make sure you explicitly set any styling information from the guidelines in the generated react to override the defaults.