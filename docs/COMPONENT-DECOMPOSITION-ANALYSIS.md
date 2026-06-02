# YYC3 AI Family - Component Decomposition Analysis Report

> **Generated:** 2026-03-08
> **Scope:** Full codebase scan — 42 components, 21 hooks, 4 services, 13 type files
> **Purpose:** Identify reusable UI elements, repeated patterns, and split candidates before refactoring

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Repeated UI Patterns -> Shared Components](#2-repeated-ui-patterns)
3. [Repeated Logic -> Custom Hooks](#3-repeated-logic)
4. [Large Component Split Candidates](#4-large-component-split-candidates)
5. [Missing Shared Abstractions](#5-missing-shared-abstractions)
6. [Component Hierarchy Blueprint](#6-component-hierarchy-blueprint)
7. [Priority Matrix](#7-priority-matrix)

---

## 1. Executive Summary

| Metric | Count |
|--------|-------|
| Identified reusable UI patterns | 12 |
| Repeated logic candidates for hook extraction | 2 |
| Large components needing split | 7 |
| Missing shared abstractions | 6 |
| Estimated new shared components | 18 |
| Estimated new shared hooks | 2 |
| Files with code duplication | 14 |

**Key Finding:** The codebase has grown organically across 3 workspaces (`/`, `/collab`, `/dev`), resulting in significant pattern duplication. The most impactful extractions are **OverlayPanel** (6 occurrences), **StatusBadge** (9+ occurrences), **DropdownMenu** (4 occurrences), and the **useClickOutside** hook (5 occurrences).

---

## 2. Repeated UI Patterns

### 2.1 StatusBadge

**Pattern:** Micro badge for status/tag display
**Occurrences:** 9+ times across 4 files

```
Current inline pattern:
<span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">
  Thinking
</span>
```

**Files affected:**
- `/components/family/CommunicationLog.tsx` (lines 90, 93, 96) — Thinking/Peer/Sync badges
- `/components/family/MemberDetailPanel.tsx` (line 379) — Capability badges
- `/components/family/BackendPanel.tsx` (lines 384, 580, 616, 695) — Status badges
- `/components/family/IntegratedTerminal.tsx` (line 621) — Connection badges

**Proposed component:**

```tsx
// /components/shared/StatusBadge.tsx

interface StatusBadgeProps {
  label: string;
  variant: 'emerald' | 'amber' | 'cyan' | 'purple' | 'blue' | 'red' | 'slate';
  size?: 'xs' | 'sm';         // xs = text-[8px], sm = text-[9px]
  shape?: 'pill' | 'rounded'; // pill = rounded-full, rounded = rounded
  uppercase?: boolean;         // default: true
  className?: string;
}

// Variants map:
// emerald -> text-emerald-400 bg-emerald-500/10
// amber   -> text-amber-400 bg-amber-500/10
// cyan    -> text-cyan-400 bg-cyan-500/10
// purple  -> text-purple-300 bg-purple-500/20
// blue    -> text-blue-400 bg-blue-500/10
// red     -> text-red-400 bg-red-500/10
// slate   -> text-slate-400 bg-slate-500/10

// Usage:
<StatusBadge label="Thinking" variant="purple" />
<StatusBadge label="LIVE" variant="emerald" size="xs" shape="pill" />
<StatusBadge label="92%" variant="emerald" uppercase={false} />
```

**Impact:** Eliminates 9+ inline class chains, centralizes color mapping

---

### 2.2 OverlayPanel

**Pattern:** Full-screen modal/overlay container with AnimatePresence
**Occurrences:** 6 times across 6 files

```
Current inline pattern:
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  className="absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-xl ..."
>
  {/* Close button */}
  <button onClick={onClose}>X</button>
  {/* Content */}
</motion.div>
```

**Files affected:**
- `/components/family/SystemProtocols.tsx` (line 12)
- `/components/family/BackendPanel.tsx` (line 775)
- `/components/family/FiveDimensionsPanel.tsx` (line 84)
- `/components/family/KnowledgeBasePanel.tsx` (line 294)
- `/components/family/PhilosophyFramework.tsx` (similar pattern)
- `/components/family/TechAuditPanel.tsx` (similar pattern)

**Proposed component:**

```tsx
// /components/shared/OverlayPanel.tsx

interface OverlayPanelProps {
  onClose: () => void;
  children: React.ReactNode;
  variant?: 'fullscreen' | 'centered' | 'sidebar-right';
  // fullscreen: inset-0 + padding
  // centered: inset-0 + flex center + max-w card
  // sidebar-right: top-0 right-0 bottom-0 w-[480px]
  title?: string;
  titleIcon?: React.ReactNode;
  showCloseButton?: boolean;        // default: true
  closeButtonLabel?: string;         // e.g. "[CLOSE_TERMINAL]"
  opacity?: 95 | 98;                // bg-slate-950/95 vs /98
  headerSlot?: React.ReactNode;      // Extra header content (tabs, status)
  className?: string;
  contentClassName?: string;
}

// Usage:
<OverlayPanel onClose={onClose} variant="fullscreen" title="5D_GENOME">
  {/* Panel content */}
</OverlayPanel>

<OverlayPanel onClose={onClose} variant="centered" title="BRIDGE_CONFIG">
  {/* Centered card content */}
</OverlayPanel>

<OverlayPanel onClose={onClose} variant="sidebar-right" title="Member Detail">
  {/* Side panel content */}
</OverlayPanel>
```

**Impact:** Standardizes 6 overlay containers, ensures consistent animation/z-index/backdrop

---

### 2.3 DropdownMenu (Animated)

**Pattern:** Glass-morphism dropdown with enter/exit animation
**Occurrences:** 4 times across 4 files

```
Current inline pattern:
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-4 mt-1 z-50 bg-slate-900/95 backdrop-blur-xl
                 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 p-2 min-w-[280px]"
    >
      {items.map(...)}
    </motion.div>
  )}
</AnimatePresence>
```

**Files affected:**
- `/layouts/ChatRoomLayout.tsx` (lines 267-301) — TOOLS dropdown
- `/components/family/FamilyDashboard.tsx` (lines 249-283) — Duplicate of above
- `/layouts/CollaborationLayout.tsx` (lines 640-680) — Project list dropdown
- `/components/collaboration/CollabViewSwitcher.tsx` (lines 240-267) — More menu

**Proposed component:**

```tsx
// /components/shared/AnimatedDropdown.tsx

interface AnimatedDropdownProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  anchor?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  minWidth?: number;                 // default: 280
  className?: string;
  layout?: 'grid-2col' | 'list';    // grid-2col for TOOLS, list for menus
}

// Usage:
<AnimatedDropdown isOpen={headerToolsOpen} anchor="top-right" layout="grid-2col">
  {toolItems.map(item => (
    <DropdownItem key={item.label} icon={item.icon} label={item.label} onClick={item.action} />
  ))}
</AnimatedDropdown>
```

**Sub-component:**
```tsx
// DropdownItem (inline or separate)
interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  shortcut?: string;
  color?: string;           // e.g. "text-violet-400 hover:bg-violet-500/10"
  isActive?: boolean;
}
```

**Impact:** Eliminates 4 duplicate animated dropdown implementations

---

### 2.4 MonoButton

**Pattern:** Mono-font action button (primary UI interaction style)
**Occurrences:** 4+ times

```
Current inline pattern:
<button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
  transition-all text-xs font-mono border bg-xxx/10 hover:bg-xxx/20
  text-xxx border-xxx/30">
  <Icon className="w-3 h-3" />
  <span>LABEL</span>
</button>
```

**Files affected:**
- `/layouts/ChatRoomLayout.tsx` (lines 228-244) — BRIDGE button
- `/layouts/ChatRoomLayout.tsx` (lines 253-264) — TOOLS button
- `/layouts/CollaborationLayout.tsx` (lines 606-622) — Nav buttons
- `/components/family/FamilyDashboard.tsx` — Duplicate buttons

**Proposed component:**

```tsx
// /components/shared/MonoButton.tsx

interface MonoButtonProps {
  icon?: React.ReactNode;
  label?: string;
  onClick: () => void;
  variant?: 'ghost' | 'emerald' | 'blue' | 'amber' | 'violet' | 'cyan' | 'rose';
  size?: 'xs' | 'sm';               // xs: py-1, sm: py-1.5
  active?: boolean;                   // ring-2 + scale-110
  disabled?: boolean;
  badge?: string | number;           // e.g. latency "245ms"
  className?: string;
  title?: string;
  hideLabel?: boolean;               // for responsive (hidden sm:inline)
}

// Variant mapping:
// ghost   -> bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 border-white/[0.06]
// emerald -> bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30
// blue    -> bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30
// amber   -> bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30

// Usage:
<MonoButton icon={<Zap />} label="BRIDGE_LIVE" variant="emerald" badge="45ms" />
<MonoButton icon={<MessageSquare />} label="Chat" variant="ghost" hideLabel />
```

**Impact:** Standardizes the most common button pattern in the project

---

### 2.5 SectionDivider

**Pattern:** Vertical/horizontal thin divider line
**Occurrences:** 6+ times

```
Current inline pattern:
<div className="w-px h-4 bg-white/[0.06]" />                    {/* Vertical */}
<div className="w-1 h-1 bg-slate-700 rounded-full" />            {/* Dot */}
<div className="w-px h-5 bg-white/[0.06]" />                    {/* Vertical (taller) */}
```

**Proposed component:**

```tsx
// /components/shared/Divider.tsx

interface DividerProps {
  direction?: 'vertical' | 'horizontal';
  variant?: 'line' | 'dot';
  size?: 'sm' | 'md' | 'lg';     // sm=h-3, md=h-4, lg=h-5
  className?: string;
}

// Usage:
<Divider />                              {/* vertical, line, md */}
<Divider variant="dot" />                {/* slate-700 dot */}
<Divider direction="horizontal" />       {/* full-width h-px */}
```

**Impact:** Minor but improves consistency; mostly about readability

---

### 2.6 SectionTitle

**Pattern:** Uppercase mono section heading with icon
**Occurrences:** 5+ times

```
Current inline pattern:
<div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500
  uppercase tracking-wider">
  <Shield className="w-3 h-3" />
  SECTION_NAME
</div>
```

**Files affected:**
- `/components/family/BackendPanel.tsx` (line 929-932) — Extracted as `SectionTitle` internally
- `/components/family/FiveDimensionsPanel.tsx` (lines 337, 348, 359, 392)
- Various other panels

**Proposed component:**

```tsx
// /components/shared/SectionTitle.tsx

interface SectionTitleProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  color?: string;                    // default: text-slate-500
  className?: string;
}

// Usage:
<SectionTitle icon={<Shield className="w-3 h-3" />}>
  SECURITY_PROTOCOLS
</SectionTitle>
```

**Impact:** Small but consistent styling; BackendPanel already has an internal version

---

### 2.7 Avatar (Unified)

**Pattern:** Round avatar image with ring + online status dot
**Occurrences:** 4 distinct implementations

```
Current implementations:
1. ChatRoomLayout collapsed rail — w-8 ring-2 + bottom-right dot
2. ChatRoomLayout expanded rail — w-7 ring-1.5 + mood dot
3. CommunicationLog — w-10/w-12 + border-2 + role label
4. MemberCard compact — w-12 ring-2 + MOOD_RING_COLORS
5. MemberCard full — w-14 ring-2 ring-white/10
```

**Proposed component:**

```tsx
// /components/shared/RoleAvatar.tsx

interface RoleAvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';   // xs=w-7, sm=w-8, md=w-10, lg=w-14
  ringColor?: string;                    // Tailwind ring-color class
  isOnline?: boolean;
  showOnlineDot?: boolean;
  mood?: FamilyMood;                     // Maps to MOOD_RING_COLORS
  borderVariant?: 'ring' | 'border';     // ring-2 vs border-2
  borderColor?: string;                  // e.g. border-blue-500/50
  hoverScale?: boolean;                  // group-hover:scale-110
  className?: string;
}

// Usage:
<RoleAvatar src={member.avatarUrl} alt={role.name} size="sm" mood={member.mood} isOnline showOnlineDot />
<RoleAvatar src={avatarUrl} alt="User" size="md" borderVariant="border" borderColor="border-blue-500/50" />
```

**Impact:** Unifies 5 avatar implementations with consistent sizing and indicator logic

---

### 2.8 ConnectionIndicator

**Pattern:** Inline connection status (icon + label + optional latency)
**Occurrences:** 3 times

```
Current inline pattern (ChatRoomLayout header, line 212-215):
<span className={cn("flex items-center gap-1", connColor)}>
  {connIcon}
  {connState === 'CONNECTED' ? 'LIVE' : connState === 'MOCK_MODE' ? 'MOCK' : connState}
</span>
```

**Files affected:**
- `/layouts/ChatRoomLayout.tsx` (lines 82-88, 212-215)
- `/layouts/CollaborationLayout.tsx` (lines 243-245, 534-537)
- `/components/family/BackendPanel.tsx` (STATE_CONFIG mapping)

**Proposed component:**

```tsx
// /components/shared/ConnectionIndicator.tsx

interface ConnectionIndicatorProps {
  state: ConnectionState;   // from backend-bridge.ts
  latency?: number;         // ms, shown as badge
  size?: 'xs' | 'sm';      // xs = header inline, sm = button-like
  showLabel?: boolean;      // LIVE / MOCK / CONNECTING...
}

// Usage (header inline):
<ConnectionIndicator state={connState} size="xs" showLabel />

// Usage (button-like with latency):
<ConnectionIndicator state={connState} latency={45} size="sm" showLabel />
```

**Impact:** Eliminates duplicated connection state → visual mapping logic

---

### 2.9 IconResolver

**Pattern:** Map icon name strings to React icon elements (for data-driven rendering)
**Occurrences:** 4 maps across 3 files

```
Current duplicated maps:
1. FiveDimensionsPanel ICON_MAP      — 5 icons at w-5 h-5
2. FiveDimensionsPanel ICON_MAP_LARGE — 5 icons at w-8 h-8
3. NetworkTopology DIM_ICON_MAP       — 5 icons at w-3 h-3
4. PhilosophyFramework ICON_MAP       — 15 icons at w-4 h-4
```

**Proposed utility:**

```tsx
// /utils/icon-resolver.ts

import { Users, MessageCircle, Handshake, Layers, Brain, Shield, Zap, ... } from 'lucide-react';

const ICON_REGISTRY: Record<string, React.FC<{ className?: string }>> = {
  Users, MessageCircle, Handshake, Layers, Brain,
  Shield, Zap, Lock, Expand, Wrench, Ruler,
  FileCheck, Cog, Eye, GitBranch, BookOpen,
  Hammer, Binary, Network,
};

export function resolveIcon(name: string, className?: string): React.ReactNode {
  const IconComponent = ICON_REGISTRY[name];
  if (!IconComponent) return null;
  return <IconComponent className={className || "w-4 h-4"} />;
}

// Usage:
resolveIcon('Shield', 'w-3 h-3')      // returns <Shield className="w-3 h-3" />
resolveIcon('Brain', 'w-8 h-8')       // returns <Brain className="w-8 h-8" />
```

**Impact:** Eliminates 4 duplicated icon maps; single registration point

---

### 2.10 GlassCard

**Pattern:** Glass morphism container
**Occurrences:** Ubiquitous (20+ instances)

Already partially defined in `/types/theme-constants.ts` as `GLASS_STYLES`, but rarely used inline.

**Proposed component:**

```tsx
// /components/shared/GlassCard.tsx

interface GlassCardProps {
  variant?: 'panel' | 'card' | 'surface' | 'overlay';
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
  padding?: 'none' | 'sm' | 'md' | 'lg';  // sm=p-2, md=p-4, lg=p-6
}

// Variant classes from GLASS_STYLES:
// panel:   bg-slate-900/80 backdrop-blur-xl border border-white/[0.06]
// card:    bg-black/20 border border-white/5 rounded-xl
// surface: bg-white/[0.02] border border-white/[0.04]
// overlay: bg-slate-950/90 backdrop-blur-2xl

// Usage:
<GlassCard variant="card" padding="md">
  <SectionTitle>CONTENT</SectionTitle>
</GlassCard>
```

**Impact:** Leverages existing `GLASS_STYLES` constants; replaces 20+ inline class chains

---

### 2.11 EmptyState

**Pattern:** Empty content placeholder with icon + text + action hints
**Occurrences:** 2-3 times

```
Current inline pattern (ChatRoomLayout lines 316-367):
<div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
  <div className="relative mb-6">
    <Radio className="w-16 h-16 opacity-10" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-500/20 rounded-full animate-ping" />
    </div>
  </div>
  <p className="text-sm font-mono text-slate-500 mb-2">SIGNAL_READY. AWAITING INPUT.</p>
  <p className="text-[11px] font-mono text-slate-600/60 max-w-md">...</p>
  {/* Quick action hints */}
  {/* Navigation buttons */}
</div>
```

**Proposed component:**

```tsx
// /components/shared/EmptyState.tsx

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  hints?: { cmd: string; label: string; color: string }[];
  actions?: { label: string; icon: React.ReactNode; onClick: () => void; color: string }[];
  animated?: boolean;        // ping animation on icon
}

// Usage:
<EmptyState
  icon={<Radio className="w-16 h-16" />}
  title="SIGNAL_READY. AWAITING INPUT."
  subtitle="Running in mock mode. Click BRIDGE to configure backend."
  hints={[{ cmd: '/5d', label: 'Genome', color: 'text-violet-500/50 border-violet-500/20' }]}
  actions={[{ label: 'Chat', icon: <Blocks />, onClick: () => navigate('/collab'), color: 'cyan' }]}
  animated
/>
```

**Impact:** Removes ~50 lines of layout code from ChatRoomLayout

---

### 2.12 TabBar (Generic)

**Pattern:** Horizontal tab switcher with active indicator
**Occurrences:** 3 distinct implementations

```
Current implementations:
1. BackendPanel — 7 tabs with icons (TAB_CONFIG array)
2. MemberDetailPanel — 3 tabs (SOUL / BODY / RIGHTS)
3. CollabViewSwitcher — 3 view modes (preview / code / split)
```

**Proposed component:**

```tsx
// /components/shared/TabBar.tsx

interface TabItem {
  id: string;
  label: string;
  shortLabel?: string;     // For mobile
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: TabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  variant?: 'pills' | 'underline' | 'segment';
  // pills:     rounded buttons with active bg
  // underline: border-bottom active indicator
  // segment:   bg-black/20 container with pill active
  size?: 'xs' | 'sm';
  className?: string;
}

// Usage:
<TabBar
  tabs={TAB_CONFIG}
  activeId={activeTab}
  onSelect={setActiveTab}
  variant="pills"
  size="xs"
/>
```

**Impact:** Standardizes tab switching UX across all panels

---

## 3. Repeated Logic

### 3.1 useClickOutside

**Pattern:** Close dropdown/popup when clicking outside
**Occurrences:** 5 files

```typescript
// Current duplicated pattern:
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

**Files affected:**
- `/components/family/FamilyDashboard.tsx` (line 111)
- `/layouts/ChatRoomLayout.tsx` (line 128)
- `/components/collaboration/UserAIPanel.tsx` (line 156)
- `/components/collaboration/ProjectFileManager.tsx` (line 465)
- `/components/collaboration/CollabViewSwitcher.tsx` (line 64)

**Proposed hook:**

```tsx
// /hooks/useClickOutside.ts

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
  enabled?: boolean
): void;

// Usage:
const dropdownRef = useRef<HTMLDivElement>(null);
useClickOutside(dropdownRef, () => setIsOpen(false));
```

**Impact:** Eliminates 5 duplicated useEffect blocks; each is 7-8 lines

---

### 3.2 useKeyboardShortcut

**Pattern:** Register global keyboard shortcuts with proper cleanup
**Occurrences:** 3 files

```typescript
// Current duplicated pattern:
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
      e.preventDefault();
      setShowSearchPalette(prev => !prev);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

**Files affected:**
- `/layouts/CollaborationLayout.tsx` (lines 184-193) — Cmd+Shift+P
- `/components/collaboration/CollabViewSwitcher.tsx` (lines 81-103) — Ctrl+1/2/3, Ctrl+Shift+F
- `/components/collaboration/GlobalSearchPalette.tsx` — Escape, etc.

**Proposed hook:**

```tsx
// /hooks/useKeyboardShortcut.ts

interface ShortcutDef {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  handler: () => void;
}

function useKeyboardShortcut(shortcuts: ShortcutDef[]): void;

// Usage:
useKeyboardShortcut([
  { key: 'p', ctrl: true, shift: true, handler: () => setShowSearch(prev => !prev) },
  { key: '1', ctrl: true, handler: () => onViewChange('preview') },
  { key: 'Escape', handler: () => setShowSearch(false) },
]);
```

**Impact:** Consolidates keyboard shortcut handling; prevents conflicting shortcuts

---

## 4. Large Component Split Candidates

### 4.1 BackendPanel.tsx (~930 lines)

**Current:** Monolithic 7-tab panel with all tab content inline.
**Internal `SectionTitle`** already extracted at line 929 (good).

**Proposed split:**

| New Component | Source Lines | Props |
|---------------|-------------|-------|
| `BackendOverview` | Tab 1 content | `healthData, configData, state, stateInfo` |
| `BackendLLMChain` | Tab 2 content | `providers, loading, onRefresh` |
| `BackendMCPTools` | Tab 3 content | `mcpTools, mcpResources, mcpPrompts, loading` |
| `BackendWorkflows` | Tab 4 content | `workflows, workflowInstances, loading` |
| `BackendPlugins` | Tab 5 content | `plugins, pluginTools, loading` |
| `BackendIDEBridge` | Tab 6 content | `ideOverview, gitStatus, loading` |
| `BackendConfigTab` | Tab 7 content | `editConfig, onSave, onReconfigure` |

**Result:** BackendPanel.tsx becomes ~150 lines (shell + state + tabs)

---

### 4.2 ChatRoomLayout.tsx (~517 lines)

**Proposed split:**

| New Component | Lines | Props |
|---------------|-------|-------|
| `ChatHeader` | 198-304 | `connState, connColor, systemPulse, peerMode, headerToolsOpen, panelManager, onToolsToggle` |
| `AvatarRail` | 397-499 | `members, selectedMemberId, onSelectMember, expanded, onToggleExpand` |
| `ChatEmptyState` | 316-367 | `connState, peerMode, onNavigate` |

**Result:** ChatRoomLayout.tsx drops to ~250 lines

---

### 4.3 CollaborationLayout.tsx (~800+ lines)

**Proposed split:**

| New Component | Lines | Props |
|---------------|-------|-------|
| `CollabHeader` | 508-641 | `projectName, connectionState, collab, panels, navigate, ...` |
| `ProjectListDropdown` | 640-680 | `projects, isOpen, onSelect, onClose` |
| `CollabMainContent` | Central layout | `viewMode, useDndLayout, panels, renderPanelContent, ...` |

**Result:** CollaborationLayout.tsx drops to ~350 lines

---

### 4.4 SettingsModal.tsx (estimated 1000+ lines)

**Proposed split:** Extract each of the 14 tabs into separate components:

| Tab Component | Config Type |
|---------------|-------------|
| `SettingsProviders` | `LLMProviderConfig[]` |
| `SettingsModels` | `ModelConfig[]` |
| `SettingsAgents` | `AIAgentConfig[]` |
| `SettingsEndpoints` | `EndpointConfig[]` |
| `SettingsMCPServers` | `MCPServerConfig[]` |
| `SettingsWorkflows` | `WorkflowConfig[]` |
| `SettingsExtensions` | `ExtensionConfig[]` |
| `SettingsCompute` | `ComputeNodeConfig[]` |
| `SettingsNetwork` | `NetworkConfig` |
| `SettingsUI` | `UIConfig` |

**Result:** SettingsModal.tsx becomes ~200 lines (modal shell + tab routing)

---

### 4.5 FiveDimensionsPanel.tsx

**Proposed split:**

| New Component | Purpose |
|---------------|---------|
| `DimensionCycleView` | Pentagon cycle visualization |
| `DimensionDetailPane` | Selected dimension detail sidebar |
| `DimensionCard` | Single dimension summary card |

---

### 4.6 IntegratedTerminal.tsx (~620+ lines)

**Proposed split:**

| New Component | Purpose |
|---------------|---------|
| `TerminalTabManager` | Tab CRUD (add/remove/switch) |
| `TerminalOutput` | ANSI-rendered output area |
| `TerminalInputLine` | Command input with history navigation |
| `TerminalSearch` | Ctrl+F search overlay |

---

### 4.7 CommunicationLog.tsx

**Already partially done** (RAGContextCards extracted).

**Additional split:**

| New Component | Purpose |
|---------------|---------|
| `MessageBubble` | Single message with avatar + bubble + timestamp |
| `TypingIndicator` | Bouncing dots animation |

---

## 5. Missing Shared Abstractions

| Component | Use Cases | Priority |
|-----------|-----------|----------|
| `Tooltip` | Replace 20+ `title` attributes with styled tooltip | P2 |
| `Kbd` | Keyboard shortcut display (`<kbd>Ctrl+1</kbd>` styled) | P3 |
| `LoadingState` | Centered spinner + text for loading panels | P2 |
| `ErrorBoundary` | React error boundary for each panel | P1 |
| `ConfirmDialog` | Destructive actions (delete channel, reset config) | P2 |
| `ScrollArea` | Styled scrollbar wrapper (scrollbar-thin theme) | P3 |

---

## 6. Component Hierarchy Blueprint

```
/components/
  shared/                          ← NEW: Cross-cutting shared components
    StatusBadge.tsx                 ← §2.1
    OverlayPanel.tsx               ← §2.2
    AnimatedDropdown.tsx            ← §2.3
    MonoButton.tsx                  ← §2.4
    Divider.tsx                     ← §2.5
    SectionTitle.tsx                ← §2.6
    RoleAvatar.tsx                  ← §2.7
    ConnectionIndicator.tsx         ← §2.8
    GlassCard.tsx                   ← §2.10
    EmptyState.tsx                  ← §2.11
    TabBar.tsx                      ← §2.12
    LoadingState.tsx                ← §5
    ErrorBoundary.tsx               ← §5
    ConfirmDialog.tsx               ← §5

  family/
    BackendPanel.tsx               ← Refactored shell (~150 lines)
    BackendPanel/                   ← NEW subdirectory
      BackendOverview.tsx
      BackendLLMChain.tsx
      BackendMCPTools.tsx
      BackendWorkflows.tsx
      BackendPlugins.tsx
      BackendIDEBridge.tsx
      BackendConfigTab.tsx
    CommunicationLog.tsx           ← Refactored
    CommunicationLog/
      MessageBubble.tsx            ← NEW
      TypingIndicator.tsx          ← NEW
    FiveDimensionsPanel.tsx        ← Refactored
    FiveDimensionsPanel/
      DimensionCycleView.tsx       ← NEW
      DimensionDetailPane.tsx      ← NEW
    IntegratedTerminal.tsx         ← Refactored
    IntegratedTerminal/
      TerminalTabManager.tsx       ← NEW
      TerminalOutput.tsx           ← NEW
      TerminalInputLine.tsx        ← NEW

  collaboration/
    (unchanged — already well-decomposed)

  SettingsModal.tsx                ← Refactored shell
  SettingsModal/                   ← NEW subdirectory
    SettingsProviders.tsx
    SettingsModels.tsx
    SettingsAgents.tsx
    ...

/hooks/
  useClickOutside.ts               ← NEW §3.1
  useKeyboardShortcut.ts           ← NEW §3.2

/utils/
  icon-resolver.ts                 ← NEW §2.9

/layouts/
  ChatRoomLayout.tsx               ← Refactored
  ChatRoomLayout/
    ChatHeader.tsx                 ← NEW
    AvatarRail.tsx                 ← NEW
    ChatEmptyState.tsx             ← NEW
  CollaborationLayout.tsx          ← Refactored
  CollaborationLayout/
    CollabHeader.tsx               ← NEW
```

---

## 7. Priority Matrix

### Phase 1: High Impact + Low Risk (Do First)

| Item | Type | Impact | Risk | Effort |
|------|------|--------|------|--------|
| `useClickOutside` hook | Hook | 5 files cleaned | None | 30min |
| `StatusBadge` | Component | 9+ instances | None | 30min |
| `OverlayPanel` | Component | 6 panels unified | Low | 1h |
| `AnimatedDropdown` | Component | 4 dropdowns unified | Low | 45min |
| `MonoButton` | Component | 4+ button patterns | None | 30min |
| `IconResolver` utility | Utility | 4 maps eliminated | None | 20min |

**Phase 1 Total: ~3.5 hours, touches 14 files, eliminates ~400 duplicated lines**

### Phase 2: Medium Impact + Medium Risk

| Item | Type | Impact | Risk | Effort |
|------|------|--------|------|--------|
| `RoleAvatar` | Component | 5 avatar variants | Medium (visual regression) | 1h |
| `TabBar` | Component | 3 implementations | Medium | 45min |
| `ConnectionIndicator` | Component | 3 instances | Low | 30min |
| `GlassCard` | Component | 20+ instances | Low (gradual migration) | 1h |
| `SectionTitle` | Component | 5+ instances | None | 20min |
| BackendPanel split | Refactor | 930 -> 150 lines | Medium | 2h |
| ChatRoomLayout split | Refactor | 517 -> 250 lines | Medium | 1.5h |

**Phase 2 Total: ~7 hours**

### Phase 3: Nice-to-have

| Item | Type | Impact | Risk | Effort |
|------|------|--------|------|--------|
| `EmptyState` | Component | 2-3 instances | Low | 30min |
| `Divider` | Component | 6+ instances | None | 15min |
| `useKeyboardShortcut` | Hook | 3 files | Low | 30min |
| SettingsModal split | Refactor | ~1000 lines | High (14 tabs) | 3h |
| IntegratedTerminal split | Refactor | ~620 lines | Medium | 2h |
| FiveDimensionsPanel split | Refactor | ~400 lines | Medium | 1.5h |
| CommunicationLog split | Refactor | ~225 lines | Low | 45min |
| `ErrorBoundary` | Component | Global | Medium | 1h |
| `LoadingState` | Component | Many panels | None | 20min |
| `ConfirmDialog` | Component | Destructive actions | Low | 45min |

**Phase 3 Total: ~10 hours**

---

## Appendix: Cross-Reference Matrix

Shows which proposed shared components would be consumed by which existing files:

| Shared Component | ChatRoomLayout | CollabLayout | FamilyDashboard | BackendPanel | FiveDimensions | CommunicationLog | MemberCard | MemberDetail | IntegTerminal | UserAIPanel | ViewSwitcher | PhilosophyFW |
|-----------------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| StatusBadge | | | | X | | X | | X | X | | | |
| OverlayPanel | | | | X | X | | | | | | | X |
| AnimatedDropdown | X | X | X | | | | | | | | X | |
| MonoButton | X | X | X | | | | | | | | | |
| RoleAvatar | X | | | | | X | X | X | | | | |
| ConnectionIndicator | X | X | | X | | | | | | | | |
| IconResolver | | | | | X | | | | | | | X |
| TabBar | | | | X | | | | X | | | X | |
| GlassCard | X | X | X | X | X | | | | X | X | | X |
| useClickOutside | X | | X | | | | | | | X | X | |

---

> **Next Step:** Review this document, confirm priorities, then proceed with Phase 1 extraction.
> All refactoring will follow the "项目停止发展/稳定闭环期" principle — zero new features, only structural improvement.
