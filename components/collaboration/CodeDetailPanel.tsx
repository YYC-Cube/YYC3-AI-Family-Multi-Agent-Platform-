/**
 * file: CodeDetailPanel.tsx
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
 * CodeDetailPanel - 文件代码编辑区（右栏）
 * 
 * 职责：
 * - 代码详情面板（语法高亮显示、代码折叠/展开）
 * - 集成终端命令交互区
 * - 多终端标签页管理
 * 
 * 对应规格：Functional-Spec §智能AI编程模式页面 → 右栏
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal,
  Code2,
  ChevronRight,
  Play,
  Square,
  Plus,
  X,
  Copy,
  Check,
  FileCode,
  AlignLeft,
  Maximize2,
  Minimize2,
  CornerDownLeft,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';

// ==========================================
// Types
// ==========================================

interface TerminalTab {
  id: string;
  name: string;
  lines: TerminalLine[];
  isRunning: boolean;
}

interface TerminalLine {
  id: string;
  content: string;
  type: 'input' | 'output' | 'error' | 'info';
  timestamp: number;
}

export interface CodeDetailPanelProps {
  code?: string;
  fileName?: string;
  language?: string;
  onCodeChange?: (code: string) => void;
}

// ==========================================
// Constants
// ==========================================

const INITIAL_TERMINAL_LINES: TerminalLine[] = [
  { id: 'sys-1', content: '$ YYC³ AI Family - 智能终端 v1.0', type: 'info', timestamp: Date.now() - 10000 },
  { id: 'sys-2', content: '> 已连接到协同工作区。输入 help 查看可用命令。', type: 'info', timestamp: Date.now() - 9000 },
  { id: 'cmd-1', content: '$ npm run dev', type: 'input', timestamp: Date.now() - 5000 },
  { id: 'out-1', content: '  VITE v5.4.1  ready in 342 ms', type: 'output', timestamp: Date.now() - 4000 },
  { id: 'out-2', content: '  ➜  Local:   http://localhost:5173/', type: 'output', timestamp: Date.now() - 3800 },
  { id: 'out-3', content: '  ➜  Network: http://192.168.1.100:5173/', type: 'output', timestamp: Date.now() - 3600 },
  { id: 'out-4', content: '  ➜  press h + enter to show help', type: 'info', timestamp: Date.now() - 3400 },
];

const SAMPLE_CODE = `// YYC³ AI Family - 组件代码详情
// 文件：Dashboard.tsx

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface PanelConfig {
  id: string
  title: string
  type: 'code' | 'preview' | 'terminal'
  width: string
  minWidth: number
}

/**
 * 多联式面板管理器
 * 支持拖拽、合并、拆分操作
 */
export function PanelManager() {
  const [panels, setPanels] = useState<PanelConfig[]>([])
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    // 从 localStorage 恢复面板布局
    const saved = localStorage.getItem('yyc3-panel-layout')
    if (saved) {
      try {
        setPanels(JSON.parse(saved))
      } catch {
        // 使用默认布局
        setPanels(getDefaultPanels())
      }
    }
  }, [])

  const handlePanelDrop = (
    sourceId: string,
    targetId: string,
    position: 'left' | 'right' | 'top' | 'bottom'
  ) => {
    // 计算新布局
    const newPanels = calculateMergedLayout(
      panels, sourceId, targetId, position
    )
    setPanels(newPanels)
    setIsDragging(false)
  }

  const handlePanelSplit = (
    panelId: string,
    direction: 'horizontal' | 'vertical'
  ) => {
    const newPanels = splitPanel(panels, panelId, direction)
    setPanels(newPanels)
  }

  return (
    <motion.div
      className="flex h-full gap-1"
      layout
    >
      {panels.map(panel => (
        <PanelView
          key={panel.id}
          config={panel}
          isActive={activePanel === panel.id}
          onActivate={() => setActivePanel(panel.id)}
          onDrop={handlePanelDrop}
          onSplit={handlePanelSplit}
        />
      ))}
    </motion.div>
  )
}`;

// ==========================================
// Component
// ==========================================

export function CodeDetailPanel({
  code: externalCode,
  fileName = 'Dashboard.tsx',
  language = 'typescript',
  onCodeChange,
}: CodeDetailPanelProps) {
  const [activeView, setActiveView] = useState<'code' | 'terminal'>('code');
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [codeContent] = useState(externalCode || SAMPLE_CODE);
  const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>([
    { id: 'tab-1', name: 'Terminal 1', lines: INITIAL_TERMINAL_LINES, isRunning: true },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const activeTerminal = terminalTabs.find(t => t.id === activeTabId) || terminalTabs[0];

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTerminal?.lines]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(codeContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [codeContent]);

  const handleTerminalSubmit = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !terminalInput.trim()) return;

    const input = terminalInput.trim();
    const newLine: TerminalLine = {
      id: `cmd-${Date.now()}`,
      content: `$ ${input}`,
      type: 'input',
      timestamp: Date.now(),
    };

    // Mock responses
    let response: TerminalLine;
    if (input === 'help') {
      response = {
        id: `out-${Date.now()}`,
        content: '可用命令: help, clear, status, build, test, deploy, ls, pwd',
        type: 'info',
        timestamp: Date.now(),
      };
    } else if (input === 'clear') {
      setTerminalTabs(prev => prev.map(t =>
        t.id === activeTabId ? { ...t, lines: [] } : t
      ));
      setTerminalInput('');
      return;
    } else if (input === 'status') {
      response = {
        id: `out-${Date.now()}`,
        content: '✅ System: ONLINE | Backend: MOCK | Agents: 7/7 | Uptime: 2h 34m',
        type: 'output',
        timestamp: Date.now(),
      };
    } else if (input.startsWith('build')) {
      response = {
        id: `out-${Date.now()}`,
        content: '⚡ Building... Done in 1.2s\n   ✓ 47 modules transformed\n   ✓ No errors or warnings',
        type: 'output',
        timestamp: Date.now(),
      };
    } else {
      response = {
        id: `out-${Date.now()}`,
        content: `Command executed: ${input}`,
        type: 'output',
        timestamp: Date.now(),
      };
    }

    setTerminalTabs(prev => prev.map(t =>
      t.id === activeTabId
        ? { ...t, lines: [...t.lines, newLine, response] }
        : t
    ));
    setTerminalInput('');
  }, [terminalInput, activeTabId]);

  const handleAddTab = useCallback(() => {
    const newTab: TerminalTab = {
      id: `tab-${Date.now()}`,
      name: `Terminal ${terminalTabs.length + 1}`,
      lines: [{ id: `sys-new-${Date.now()}`, content: '$ 新终端会话已创建', type: 'info', timestamp: Date.now() }],
      isRunning: false,
    };
    setTerminalTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [terminalTabs.length]);

  const handleCloseTab = useCallback((tabId: string) => {
    if (terminalTabs.length <= 1) return;
    setTerminalTabs(prev => prev.filter(t => t.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId(terminalTabs[0].id);
    }
  }, [terminalTabs, activeTabId]);

  // Syntax highlight helper (simplified)
  const renderCodeLine = (line: string, lineNum: number) => {
    let highlighted = line;
    // Keywords
    highlighted = highlighted.replace(
      /\b(import|export|from|const|let|var|function|return|interface|type|if|else|try|catch|finally|async|await|useState|useEffect|useCallback|useMemo)\b/g,
      '<span class="text-violet-400">$1</span>'
    );
    // Strings
    highlighted = highlighted.replace(
      /('[^']*'|"[^"]*")/g,
      '<span class="text-emerald-400">$1</span>'
    );
    // Comments
    highlighted = highlighted.replace(
      /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
      '<span class="text-slate-600">$1</span>'
    );
    // Types
    highlighted = highlighted.replace(
      /\b([A-Z][A-Za-z]+(?:Props|Config|State|Type|Interface)?)\b/g,
      '<span class="text-cyan-400">$1</span>'
    );

    return (
      <div key={lineNum} className="flex hover:bg-white/[0.02] group">
        <span className="flex-none w-10 text-right pr-3 text-[10px] text-slate-700 font-mono select-none leading-[1.6]">
          {lineNum}
        </span>
        <code
          className="flex-1 text-[11px] font-mono text-slate-300 leading-[1.6] whitespace-pre"
          dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/40">
      {/* View Toggle Header */}
      <div className="flex-none flex items-center justify-between px-2 py-1.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('code')}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono transition-all",
              activeView === 'code'
                ? "bg-blue-500/10 text-blue-400"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Code2 className="w-3 h-3" />
            代码详情
          </button>
          <button
            onClick={() => setActiveView('terminal')}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono transition-all",
              activeView === 'terminal'
                ? "bg-green-500/10 text-green-400"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Terminal className="w-3 h-3" />
            终端
          </button>
        </div>

        <div className="flex items-center gap-1">
          {activeView === 'code' && (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
              title="复制代码"
            >
              {copied
                ? <Check className="w-3 h-3 text-emerald-400" />
                : <Copy className="w-3 h-3" />
              }
            </button>
          )}
          <button className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors" title="格式化">
            <AlignLeft className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'code' ? (
          /* Code Detail View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* File info bar */}
            <div className="flex-none flex items-center gap-2 px-3 py-1 bg-black/20 border-b border-white/[0.04]">
              <FileCode className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-mono text-slate-400">{fileName}</span>
              <span className="text-[9px] text-slate-600 font-mono">{language}</span>
              <span className="ml-auto text-[9px] text-slate-600 font-mono">{codeContent.split('\n').length} lines</span>
            </div>

            {/* Code content with syntax highlighting */}
            <div className="flex-1 overflow-auto py-1">
              {codeContent.split('\n').map((line, idx) => renderCodeLine(line, idx + 1))}
            </div>
          </div>
        ) : (
          /* Terminal View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Terminal Tabs */}
            <div className="flex-none flex items-center gap-0.5 px-1 py-1 bg-black/30 border-b border-white/[0.04]">
              {terminalTabs.map(tab => (
                <div
                  key={tab.id}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-t-md text-[10px] font-mono cursor-pointer transition-all",
                    tab.id === activeTabId
                      ? "bg-slate-900/80 text-slate-300 border-t border-x border-white/[0.06]"
                      : "text-slate-600 hover:text-slate-400"
                  )}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <Terminal className="w-2.5 h-2.5" />
                  <span>{tab.name}</span>
                  {tab.isRunning && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {terminalTabs.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                      className="ml-1 hover:text-red-400 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddTab}
                className="p-1 rounded hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 overflow-y-auto p-2 bg-black/40 font-mono text-[11px] leading-relaxed">
              {activeTerminal.lines.map(line => (
                <div
                  key={line.id}
                  className={cn(
                    "whitespace-pre-wrap break-all",
                    line.type === 'input' && "text-slate-200",
                    line.type === 'output' && "text-emerald-400/80",
                    line.type === 'error' && "text-red-400",
                    line.type === 'info' && "text-slate-500",
                  )}
                >
                  {line.content}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Input */}
            <div className="flex-none flex items-center gap-2 px-2 py-1.5 bg-black/60 border-t border-white/[0.04]">
              <ChevronRight className="w-3 h-3 text-emerald-400 flex-none" />
              <input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalSubmit}
                placeholder="输入命令..."
                className="flex-1 bg-transparent text-[11px] text-slate-200 font-mono placeholder-slate-700 focus:outline-none"
              />
              <div className="flex-none flex items-center gap-1 text-[9px] text-slate-700 font-mono">
                <CornerDownLeft className="w-3 h-3" />
                Enter
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status */}
      <div className="flex-none flex items-center justify-between px-3 py-1 border-t border-white/[0.06] bg-black/20 text-[9px] font-mono text-slate-600">
        <div className="flex items-center gap-2">
          {activeView === 'terminal' ? (
            <>
              <span className="flex items-center gap-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", activeTerminal.isRunning ? "bg-emerald-500" : "bg-slate-600")} />
                {activeTerminal.isRunning ? 'Running' : 'Idle'}
              </span>
              <span>{activeTerminal.lines.length} lines</span>
            </>
          ) : (
            <>
              <span>{language}</span>
              <span>Read-only</span>
            </>
          )}
        </div>
        <span>YYC³ Terminal v1.0</span>
      </div>
    </div>
  );
}
