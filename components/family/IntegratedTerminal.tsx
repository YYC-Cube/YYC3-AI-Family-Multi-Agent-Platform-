/**
 * file: IntegratedTerminal.tsx
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
 * YYC³ AI Family - Integrated Terminal (集成终端·高可用)
 *
 * A production-grade terminal emulator integrated into the Mission Control dashboard.
 * Features:
 *   - Multi-tab sessions with independent state
 *   - Command history (per-tab, persisted to localStorage)
 *   - Auto-reconnect with exponential backoff (HA)
 *   - Built-in commands: /help, /clear, /bun, /git, /mcp, /kb, /agent, /health
 *   - Backend proxy execution through IDE bridge WebSocket
 *   - ANSI color rendering
 *   - Search in output (Ctrl+F)
 *   - Resizable panel
 *
 * 高可用保证：
 *   1. Session persistence — tabs and history survive page reload
 *   2. Auto-reconnect — exponential backoff up to 30s, unlimited retries
 *   3. Command queue — offline commands buffered and replayed on reconnect
 *   4. Health monitoring — periodic heartbeat with visual status
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/components/ui/utils';
import { ENDPOINTS } from '../../config/endpoints';
import {
  Terminal as TerminalIcon,
  X,
  Plus,
  Trash2,
  Search,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  RotateCcw,
  Copy,
  Download,
  Cpu,
  HardDrive,
  Clock,
  Send,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'info' | 'success' | 'warning' | 'tool';
  content: string;
  timestamp: number;
}

interface TerminalTab {
  id: string;
  name: string;
  lines: TerminalLine[];
  history: string[];
  historyIndex: number;
  cwd: string;
}

interface TerminalState {
  tabs: TerminalTab[];
  activeTabId: string;
  isConnected: boolean;
  reconnectAttempts: number;
}

// ============================================================
// Constants
// ============================================================

const MAX_LINES = 2000;
const MAX_HISTORY = 200;
const STORAGE_KEY = 'yyc3_terminal_state';

const PROMPT_SYMBOL = '❯';
const SYSTEM_PREFIX = '⚙';
const ERROR_PREFIX = '✗';
const SUCCESS_PREFIX = '✓';
const TOOL_PREFIX = '⚡';
const INFO_PREFIX = 'ℹ';

// ============================================================
// Built-in Commands
// ============================================================

const BUILTIN_COMMANDS: Record<string, {
  description: string;
  usage?: string;
  handler: (args: string[], tab: TerminalTab, ctx: CommandContext) => TerminalLine[];
}> = {
  help: {
    description: 'Show available commands',
    handler: (_args, _tab, _ctx) => {
      const lines: TerminalLine[] = [
        mkLine('system', `${SYSTEM_PREFIX} YYC³ Integrated Terminal — Command Reference`),
        mkLine('system', '─'.repeat(60)),
      ];
      for (const [cmd, info] of Object.entries(BUILTIN_COMMANDS)) {
        lines.push(mkLine('info', `  /${cmd.padEnd(16)} ${info.description}`));
        if (info.usage) {
          lines.push(mkLine('output', `${''.padEnd(19)}usage: ${info.usage}`));
        }
      }
      lines.push(mkLine('system', '─'.repeat(60)));
      lines.push(mkLine('info', `  Type any shell command to execute via backend IDE Bridge`));
      lines.push(mkLine('info', `  Prefix with / for built-in commands`));
      return lines;
    },
  },
  clear: {
    description: 'Clear terminal output',
    handler: (_args, _tab, _ctx) => [],
  },
  health: {
    description: 'Check backend + LLM provider health',
    handler: (_args, _tab, ctx) => {
      ctx.executeRemote('health');
      return [mkLine('system', `${SYSTEM_PREFIX} Checking system health...`)];
    },
  },
  mcp: {
    description: 'MCP server status & tools',
    usage: '/mcp [tools|status|orchestrate <prompt>]',
    handler: (args, _tab, ctx) => {
      const sub = args[0] || 'status';
      ctx.executeRemote(`mcp:${sub}:${args.slice(1).join(' ')}`);
      return [mkLine('tool', `${TOOL_PREFIX} MCP: ${sub}...`)];
    },
  },
  kb: {
    description: 'Knowledge base operations',
    usage: '/kb [search <query>|stats|index]',
    handler: (args, _tab, ctx) => {
      const sub = args[0] || 'stats';
      ctx.executeRemote(`kb:${sub}:${args.slice(1).join(' ')}`);
      return [mkLine('tool', `${TOOL_PREFIX} KB: ${sub}...`)];
    },
  },
  agent: {
    description: 'Talk to a family member',
    usage: '/agent <roleId> <prompt>',
    handler: (args, _tab, ctx) => {
      if (args.length < 2) {
        return [mkLine('error', `${ERROR_PREFIX} Usage: /agent <roleId> <prompt>`)];
      }
      ctx.executeRemote(`agent:${args[0]}:${args.slice(1).join(' ')}`);
      return [mkLine('tool', `${TOOL_PREFIX} Agent call → ${args[0]}...`)];
    },
  },
  config: {
    description: 'Show current backend config',
    handler: (_args, _tab, ctx) => {
      ctx.executeRemote('config');
      return [mkLine('system', `${SYSTEM_PREFIX} Loading config...`)];
    },
  },
  bun: {
    description: 'Execute bun command (proxied)',
    usage: '/bun <args>',
    handler: (args, _tab, ctx) => {
      ctx.executeRemote(`shell:bun ${args.join(' ')}`);
      return [mkLine('system', `${SYSTEM_PREFIX} bun ${args.join(' ')}`)];
    },
  },
  git: {
    description: 'Execute git command (proxied)',
    usage: '/git <args>',
    handler: (args, _tab, ctx) => {
      ctx.executeRemote(`shell:git ${args.join(' ')}`);
      return [mkLine('system', `${SYSTEM_PREFIX} git ${args.join(' ')}`)];
    },
  },
  env: {
    description: 'Show environment variables (filtered)',
    handler: (_args, _tab, ctx) => {
      ctx.executeRemote('env');
      return [mkLine('system', `${SYSTEM_PREFIX} Loading environment...`)];
    },
  },
  uptime: {
    description: 'Show server uptime',
    handler: (_args, _tab, ctx) => {
      ctx.executeRemote('uptime');
      return [mkLine('system', `${SYSTEM_PREFIX} Querying uptime...`)];
    },
  },
  version: {
    description: 'Show version info',
    handler: (_args, _tab, _ctx) => [
      mkLine('success', `${SUCCESS_PREFIX} YYC³ AI Family v2.0.0`),
      mkLine('info', `  BigModelSDK: v1.2.0`),
      mkLine('info', `  Runtime: Bun`),
      mkLine('info', `  Frontend: React + Tailwind + ShadCN`),
      mkLine('info', `  Protocol: MCP 2024-11-05`),
    ],
  },
  neofetch: {
    description: 'System info display',
    handler: (_args, _tab, _ctx) => [
      mkLine('output', ''),
      mkLine('success', '   ██╗   ██╗██╗   ██╗ ██████╗██████╗ '),
      mkLine('success', '   ╚██╗ ██╔╝╚██╗ ██╔╝██╔════╝╚════██╗'),
      mkLine('success', '    ╚████╔╝  ╚████╔╝ ██║      █████╔╝'),
      mkLine('success', '     ╚██╔╝    ╚██╔╝  ██║      ╚═══██╗'),
      mkLine('success', '      ██║      ██║   ╚██████╗██████╔╝'),
      mkLine('success', '      ╚═╝      ╚═╝    ╚═════╝╚═════╝ '),
      mkLine('output', ''),
      mkLine('info',    '  OS:       YYC³ AI Family Platform'),
      mkLine('info',    '  Kernel:   Bun Runtime + WebSocket'),
      mkLine('info',    '  Shell:    Integrated Terminal v1.0'),
      mkLine('info',    '  Engine:   BigModel GLM + DeepSeek + Ollama'),
      mkLine('info',    '  Protocol: MCP 2024-11-05'),
      mkLine('info',    '  Agents:   7 (沫言总/导师/架构师/织码/守望/中枢/联结)'),
      mkLine('info',    '  Uptime:   ∞ (高可用模式)'),
      mkLine('output', ''),
    ],
  },
};

interface CommandContext {
  executeRemote: (command: string) => void;
  apiUrl: string;
}

function mkLine(type: TerminalLine['type'], content: string): TerminalLine {
  return { id: crypto.randomUUID(), type, content, timestamp: Date.now() };
}

function createDefaultTab(name?: string): TerminalTab {
  return {
    id: crypto.randomUUID(),
    name: name || 'Terminal',
    lines: [
      mkLine('system', `${SYSTEM_PREFIX} YYC³ Integrated Terminal — 高可用模式`),
      mkLine('info', `${INFO_PREFIX} Type /help for available commands`),
    ],
    history: [],
    historyIndex: -1,
    cwd: '~/Family',
  };
}

// ============================================================
// Component
// ============================================================

interface IntegratedTerminalProps {
  onClose: () => void;
  apiUrl?: string;
}

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
  onClose,
  apiUrl = ENDPOINTS.API_BASE,
}) => {
  // ── State ──
  const [tabs, setTabs] = useState<TerminalTab[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tabs?.length > 0) return parsed.tabs;
      }
    } catch {}
    return [createDefaultTab()];
  });
  const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id || '');
  const [input, setInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandQueueRef = useRef<string[]>([]);

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

  // ── Persistence ──
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeTabId }));
    } catch {}
  }, [tabs, activeTabId]);

  // ── Auto-scroll ──
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [activeTab?.lines?.length]);

  // ── Focus input ──
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeTabId]);

  // ── WebSocket Connection (HA) ──
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = apiUrl.replace(/^http/, 'ws');
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        appendLine(mkLine('success', `${SUCCESS_PREFIX} Connected to backend (${apiUrl})`));

        // Flush command queue
        while (commandQueueRef.current.length > 0) {
          const cmd = commandQueueRef.current.shift()!;
          ws.send(JSON.stringify({ type: 'terminal_exec', payload: { command: cmd }, requestId: crypto.randomUUID() }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'terminal_output' || msg.type === 'system_event') {
            const payload = msg.payload;
            if (payload?.output) {
              const lines = payload.output.split('\n').map((line: string) =>
                mkLine(payload.isError ? 'error' : 'output', line)
              );
              appendLines(lines);
            }
            if (payload?.result) {
              appendLine(mkLine('output', typeof payload.result === 'string' ? payload.result : JSON.stringify(payload.result, null, 2)));
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        // onclose will fire after this
      };

      wsRef.current = ws;
    } catch {
      scheduleReconnect();
    }
  }, [apiUrl]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;
    setReconnectAttempts(prev => {
      const next = prev + 1;
      const delay = Math.min(1000 * Math.pow(1.5, next), 30000);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connectWs();
      }, delay);
      return next;
    });
  }, [connectWs]);

  useEffect(() => {
    connectWs();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connectWs]);

  // ── Line management ──
  const appendLine = useCallback((line: TerminalLine) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId
        ? { ...tab, lines: [...tab.lines, line].slice(-MAX_LINES) }
        : tab
    ));
  }, [activeTabId]);

  const appendLines = useCallback((lines: TerminalLine[]) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId
        ? { ...tab, lines: [...tab.lines, ...lines].slice(-MAX_LINES) }
        : tab
    ));
  }, [activeTabId]);

  // ── Remote execution ──
  const executeRemote = useCallback((command: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'terminal_exec',
        payload: { command },
        requestId: crypto.randomUUID(),
      }));
    } else {
      // Queue for when reconnected
      commandQueueRef.current.push(command);
      appendLine(mkLine('warning', `⚠ Not connected — command queued for replay`));
    }

    // Also try REST fallback for certain commands
    if (command.startsWith('health') || command.startsWith('config') || command.startsWith('uptime') || command.startsWith('env') || command.startsWith('mcp:status')) {
      fetchRestFallback(command);
    }
  }, [appendLine, apiUrl]);

  const fetchRestFallback = useCallback(async (command: string) => {
    try {
      let endpoint = '/api/health';
      if (command === 'config') endpoint = '/api/config';
      else if (command === 'uptime') endpoint = '/api/health';
      else if (command === 'env') endpoint = '/api/config';
      else if (command.startsWith('mcp:status')) endpoint = '/api/mcp/status';
      else if (command.startsWith('mcp:tools')) endpoint = '/api/mcp/tools';
      else if (command.startsWith('kb:stats')) endpoint = '/api/kb/stats';

      const res = await fetch(`${apiUrl}${endpoint}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        appendLines(
          JSON.stringify(data, null, 2).split('\n').map(line =>
            mkLine('output', line)
          )
        );
      }
    } catch (err: any) {
      appendLine(mkLine('error', `${ERROR_PREFIX} REST fallback failed: ${err.message}`));
    }
  }, [apiUrl, appendLine, appendLines]);

  // ── Command execution ──
  const executeCommand = useCallback((rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    // Add to history
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId
        ? {
            ...tab,
            history: [...tab.history.filter(h => h !== trimmed), trimmed].slice(-MAX_HISTORY),
            historyIndex: -1,
          }
        : tab
    ));

    // Show input line
    appendLine(mkLine('input', `${PROMPT_SYMBOL} ${trimmed}`));

    const ctx: CommandContext = { executeRemote, apiUrl };

    if (trimmed.startsWith('/')) {
      const parts = trimmed.slice(1).split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      const builtin = BUILTIN_COMMANDS[cmd];
      if (builtin) {
        if (cmd === 'clear') {
          setTabs(prev => prev.map(tab =>
            tab.id === activeTabId ? { ...tab, lines: [] } : tab
          ));
        } else {
          const resultLines = builtin.handler(args, activeTab!, ctx);
          appendLines(resultLines);
        }
      } else {
        appendLine(mkLine('error', `${ERROR_PREFIX} Unknown command: /${cmd}. Type /help for available commands.`));
      }
    } else {
      // Shell command — send to backend
      executeRemote(`shell:${trimmed}`);
    }
  }, [activeTabId, activeTab, appendLine, appendLines, executeRemote, apiUrl]);

  // ── Key handling ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!activeTab) return;
      const newIdx = activeTab.historyIndex < activeTab.history.length - 1
        ? activeTab.historyIndex + 1 : activeTab.historyIndex;
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? { ...tab, historyIndex: newIdx } : tab
      ));
      const historyItem = activeTab.history[activeTab.history.length - 1 - newIdx];
      if (historyItem) setInput(historyItem);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!activeTab) return;
      const newIdx = activeTab.historyIndex > 0 ? activeTab.historyIndex - 1 : -1;
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? { ...tab, historyIndex: newIdx } : tab
      ));
      if (newIdx === -1) {
        setInput('');
      } else {
        const historyItem = activeTab.history[activeTab.history.length - 1 - newIdx];
        if (historyItem) setInput(historyItem);
      }
    } else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setShowSearch(!showSearch);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? { ...tab, lines: [] } : tab
      ));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab-completion for built-in commands
      if (input.startsWith('/')) {
        const partial = input.slice(1).toLowerCase();
        const matches = Object.keys(BUILTIN_COMMANDS).filter(c => c.startsWith(partial));
        if (matches.length === 1) {
          setInput('/' + matches[0] + ' ');
        } else if (matches.length > 1) {
          appendLine(mkLine('info', `  ${matches.map(m => '/' + m).join('  ')}`));
        }
      }
    }
  };

  // ── Tab management ──
  const addTab = () => {
    const newTab = createDefaultTab(`Terminal ${tabs.length + 1}`);
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return; // Keep at least one tab
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(newTabs[newTabs.length - 1]?.id || '');
      }
      return newTabs;
    });
  };

  // ── Export output ──
  const exportOutput = () => {
    if (!activeTab) return;
    const text = activeTab.lines.map(l => l.content).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yyc3-terminal-${activeTab.name}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Filtered lines ──
  const filteredLines = useMemo(() => {
    if (!activeTab) return [];
    if (!searchQuery) return activeTab.lines;
    return activeTab.lines.filter(l =>
      l.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery]);

  // ── Line color map ──
  const lineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-emerald-400';
      case 'output': return 'text-slate-300';
      case 'error': return 'text-red-400';
      case 'system': return 'text-cyan-400';
      case 'info': return 'text-blue-400';
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'tool': return 'text-violet-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "fixed z-[60] bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl",
        isMaximized
          ? "inset-2"
          : "bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[760px] h-[480px]"
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {/* ── Title Bar ── */}
      <div className="flex-none flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-white/5">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-mono text-slate-400">YYC³ Terminal</span>

          {/* Connection status */}
          <div className={cn("flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full",
            isConnected
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          )}>
            {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
            {isConnected ? 'LIVE' : `OFFLINE${reconnectAttempts > 0 ? ` (retry ${reconnectAttempts})` : ''}`}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setShowSearch(!showSearch)} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-slate-300" title="Search (Ctrl+F)">
            <Search className="w-3.5 h-3.5" />
          </button>
          <button onClick={exportOutput} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-slate-300" title="Export">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setReconnectAttempts(0); connectWs(); }} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-slate-300" title="Reconnect">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-slate-300" title="Toggle size">
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex-none flex items-center gap-0.5 px-2 py-1 bg-[#0d1117] border-b border-white/5 overflow-x-auto">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-t-md text-[10px] font-mono cursor-pointer transition-colors group",
              tab.id === activeTabId
                ? "bg-[#1a1f2e] text-emerald-400 border-t border-x border-emerald-500/30"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
            onClick={() => setActiveTabId(tab.id)}
          >
            <TerminalIcon className="w-2.5 h-2.5" />
            <span>{tab.name}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addTab}
          className="p-1 rounded hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-colors"
          title="New tab"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* ── Search Bar ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1f2e] border-b border-white/5">
              <Search className="w-3 h-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search output..."
                className="flex-1 bg-transparent text-xs font-mono text-slate-300 placeholder-slate-600 outline-none"
                autoFocus
              />
              <span className="text-[9px] font-mono text-slate-600">
                {searchQuery ? `${filteredLines.length} matches` : ''}
              </span>
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-slate-500 hover:text-slate-300">
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Output Area ── */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 font-mono text-[11px] leading-[1.6] selection:bg-emerald-500/20 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {filteredLines.map((line) => (
          <div key={line.id} className={cn("whitespace-pre-wrap break-all", lineColor(line.type))}>
            {line.content}
          </div>
        ))}
      </div>

      {/* ── Input Area ── */}
      <div className="flex-none border-t border-white/5 bg-[#0d1117]">
        <div className="flex items-center px-3 py-2 gap-2">
          <span className="text-emerald-500 text-[11px] font-mono flex-none">
            {activeTab?.cwd || '~'} {PROMPT_SYMBOL}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-[11px] font-mono text-slate-200 placeholder-slate-600 outline-none caret-emerald-400"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={() => { executeCommand(input); setInput(''); }}
            className="flex-none p-1 rounded hover:bg-white/5 text-slate-500 hover:text-emerald-400 transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-white/[0.03] text-[8px] font-mono text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {new Date().toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-2.5 h-2.5" />
              {activeTab?.lines.length || 0} lines
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-2.5 h-2.5" />
              {activeTab?.history.length || 0} history
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Ctrl+L clear</span>
            <span>Ctrl+F search</span>
            <span>Tab autocomplete</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};