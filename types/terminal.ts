/**
 * file: terminal.ts
 * description: 文件 · 待补充描述
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-04
 * updated: 2026-04-04
 * status: active
 * tags: [file]
 *
 * brief: 待补充简要说明
 *
 * details: 待补充详细说明
 *
 * dependencies: 待补充
 * exports: 待补充
 * notes: 待补充
 */

/**
 * YYC³ AI Family - Integrated Terminal Type Definitions (集成终端·全类型)
 *
 * Covers: line types, tab state, session persistence, command context,
 * WebSocket terminal protocol, HA reconnect state, built-in command registry.
 */

// ==========================================
// Terminal Line Types
// ==========================================

/** Visual classification of a terminal line */
export type TerminalLineType =
  | 'input'    // User-entered command (green prompt)
  | 'output'   // Standard output text
  | 'error'    // Error messages (red)
  | 'system'   // System/framework messages (cyan)
  | 'info'     // Informational hints (blue)
  | 'success'  // Success confirmations (green)
  | 'warning'  // Warning messages (yellow)
  | 'tool';    // MCP tool / agent call output (violet)

/** Single rendered terminal line */
export interface TerminalLine {
  id: string;
  type: TerminalLineType;
  content: string;
  timestamp: number;
}

// ==========================================
// Tab / Session State
// ==========================================

/** A single terminal tab with independent state */
export interface TerminalTab {
  id: string;
  name: string;
  lines: TerminalLine[];
  history: string[];       // Command history (newest last)
  historyIndex: number;    // -1 = not browsing, 0+ = offset from end
  cwd: string;             // Simulated current working directory
}

/** Root terminal state (serialized to localStorage for HA) */
export interface TerminalPersistState {
  tabs: TerminalTab[];
  activeTabId: string;
}

// ==========================================
// Command System
// ==========================================

/** Context injected into every built-in command handler */
export interface TerminalCommandContext {
  /** Send a command string to the backend via WS or REST */
  executeRemote: (command: string) => void;
  /** Backend API base URL */
  apiUrl: string;
}

/** Built-in command definition */
export interface BuiltinCommandDef {
  description: string;
  usage?: string;
  handler: (
    args: string[],
    tab: TerminalTab,
    ctx: TerminalCommandContext,
  ) => TerminalLine[];
}

/** Registry of all available built-in commands */
export type BuiltinCommandRegistry = Record<string, BuiltinCommandDef>;

// ==========================================
// WebSocket Terminal Protocol
// ==========================================

/** Inbound: frontend → backend (terminal exec request) */
export interface WS_TerminalExec {
  type: 'terminal_exec';
  payload: {
    command: string;
    tabId?: string;
    cwd?: string;
  };
  requestId: string;
}

/** Outbound: backend → frontend (terminal output) */
export interface WS_TerminalOutput {
  type: 'terminal_output';
  payload: {
    output: string;
    isError?: boolean;
    exitCode?: number;
    command?: string;
  };
  timestamp: number;
  requestId?: string;
}

// ==========================================
// HA (High-Availability) State
// ==========================================

/** Terminal connection health state */
export interface TerminalConnectionState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastConnectedAt?: number;
  lastDisconnectedAt?: number;
  /** Queued commands waiting for reconnection */
  commandQueue: string[];
}

// ==========================================
// Component Props
// ==========================================

export interface IntegratedTerminalProps {
  onClose: () => void;
  apiUrl?: string;
  /** Initial tab name override */
  initialTabName?: string;
  /** Maximum lines per tab before truncation */
  maxLines?: number;
  /** Maximum command history entries */
  maxHistory?: number;
}

// ==========================================
// Constants
// ==========================================

export const TERMINAL_STORAGE_KEY = 'yyc3_terminal_state';
export const TERMINAL_MAX_LINES = 2000;
export const TERMINAL_MAX_HISTORY = 200;
export const TERMINAL_PROMPT_SYMBOL = '❯';
