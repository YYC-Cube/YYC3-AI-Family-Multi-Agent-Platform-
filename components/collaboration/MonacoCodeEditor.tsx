/**
 * file: MonacoCodeEditor.tsx
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
 * MonacoCodeEditor - Monaco Editor 集成封装
 * 
 * 职责：
 * - Monaco Editor 初始化与配置
 * - 语法高亮（TypeScript、JSON、Markdown 等）
 * - 智能补全
 * - 错误检测与诊断
 * - 协同编辑光标/选区渲染
 * - 主题适配（slate-950 深色主题）
 * 
 * 对应规格：Functional-Spec §代码编辑器集成 (Monaco Editor)
 * 
 * @file components/collaboration/MonacoCodeEditor.tsx
 */

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import Editor, { OnMount, OnChange, useMonaco } from '@monaco-editor/react'
import type { editor, MarkerSeverity, Position, Selection } from 'monaco-editor'
import { motion, AnimatePresence } from 'motion/react'
import {
  Loader2,
  FileCode,
  AlertCircle,
  CheckCircle2,
  Users,
  Circle,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'
import type { CollaborationParticipant } from '../../types/collaboration'

// ==========================================
// Types
// ==========================================

export interface MonacoCodeEditorProps {
  /** 文件内容 */
  value: string
  /** 文件语言 */
  language?: string
  /** 文件路径（用于 Monaco model URI） */
  filePath?: string
  /** 内容变更回调 */
  onChange?: (value: string) => void
  /** 光标位置变更回调 */
  onCursorChange?: (line: number, column: number) => void
  /** 选区变更回调 */
  onSelectionChange?: (startLine: number, startCol: number, endLine: number, endCol: number) => void
  /** 是否只读 */
  readOnly?: boolean
  /** 协同参与者（渲染远程光标） */
  participants?: CollaborationParticipant[]
  /** 当前用户 ID */
  currentUserId?: string
  /** 迷你地图 */
  minimap?: boolean
  /** 行号 */
  lineNumbers?: boolean
  /** 自动换行 */
  wordWrap?: boolean
  /** 类名 */
  className?: string
}

// ==========================================
// Language Detection
// ==========================================

function detectLanguage(filePath?: string): string {
  if (!filePath) return 'typescript'
  const ext = filePath.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescriptreact',
    js: 'javascript',
    jsx: 'javascriptreact',
    json: 'json',
    md: 'markdown',
    css: 'css',
    scss: 'scss',
    html: 'html',
    py: 'python',
    rs: 'rust',
    go: 'go',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    sh: 'shell',
    bash: 'shell',
    sql: 'sql',
    graphql: 'graphql',
  }
  return languageMap[ext || ''] || 'plaintext'
}

// ==========================================
// YYC³ Dark Theme
// ==========================================

const YYC3_DARK_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'c084fc' },     // violet
    { token: 'string', foreground: '4ade80' },       // green
    { token: 'number', foreground: 'fbbf24' },       // amber
    { token: 'type', foreground: '38bdf8' },         // sky
    { token: 'function', foreground: '22d3ee' },     // cyan
    { token: 'variable', foreground: 'e2e8f0' },     // slate-200
    { token: 'constant', foreground: 'fb923c' },     // orange
    { token: 'tag', foreground: 'f472b6' },          // pink
    { token: 'attribute.name', foreground: '38bdf8' },
    { token: 'attribute.value', foreground: '4ade80' },
    { token: 'delimiter', foreground: '64748b' },    // slate-500
    { token: 'operator', foreground: '94a3b8' },     // slate-400
  ],
  colors: {
    'editor.background': '#0a0f1e',
    'editor.foreground': '#e2e8f0',
    'editor.lineHighlightBackground': '#1e293b40',
    'editor.selectionBackground': '#10b98130',
    'editor.inactiveSelectionBackground': '#10b98115',
    'editorCursor.foreground': '#10b981',
    'editorLineNumber.foreground': '#334155',
    'editorLineNumber.activeForeground': '#64748b',
    'editor.selectionHighlightBackground': '#10b98110',
    'editorIndentGuide.background': '#1e293b',
    'editorIndentGuide.activeBackground': '#334155',
    'editorBracketMatch.background': '#10b98120',
    'editorBracketMatch.border': '#10b98150',
    'editorWidget.background': '#0f172a',
    'editorWidget.border': '#1e293b',
    'editorSuggestWidget.background': '#0f172a',
    'editorSuggestWidget.border': '#1e293b',
    'editorSuggestWidget.selectedBackground': '#1e293b',
    'editorSuggestWidget.highlightForeground': '#4ade80',
    'editorHoverWidget.background': '#0f172a',
    'editorHoverWidget.border': '#1e293b',
    'scrollbar.shadow': '#00000000',
    'scrollbarSlider.background': '#33415540',
    'scrollbarSlider.hoverBackground': '#33415580',
    'scrollbarSlider.activeBackground': '#334155a0',
    'minimap.background': '#0a0f1e',
  },
}

// ==========================================
// Component
// ==========================================

export function MonacoCodeEditor({
  value,
  language,
  filePath,
  onChange,
  onCursorChange,
  onSelectionChange,
  readOnly = false,
  participants = [],
  currentUserId,
  minimap = false,
  lineNumbers = true,
  wordWrap = false,
  className,
}: MonacoCodeEditorProps) {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const decorationsRef = useRef<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [diagnostics, setDiagnostics] = useState<{ errors: number; warnings: number }>({ errors: 0, warnings: 0 })
  const [cursorInfo, setCursorInfo] = useState({ line: 1, column: 1 })

  const resolvedLanguage = language || detectLanguage(filePath)

  // Remote participants (excluding current user)
  const remoteParticipants = useMemo(() =>
    participants.filter(p => p.userId !== currentUserId && p.isOnline),
    [participants, currentUserId]
  )

  // Editor mount handler
  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    setIsLoading(false)

    // Register YYC³ theme
    monaco.editor.defineTheme('yyc3-dark', YYC3_DARK_THEME)
    monaco.editor.setTheme('yyc3-dark')

    // Configure TypeScript/JavaScript compiler options
    if (resolvedLanguage === 'typescript' || resolvedLanguage === 'typescriptreact') {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        jsx: monaco.languages.typescript.JsxEmit.React,
        strict: true,
        esModuleInterop: true,
        allowJs: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      })
    }

    // Cursor position tracking
    editor.onDidChangeCursorPosition((e: editor.ICursorPositionChangedEvent) => {
      const pos = e.position
      setCursorInfo({ line: pos.lineNumber, column: pos.column })
      onCursorChange?.(pos.lineNumber, pos.column)
    })

    // Selection tracking
    editor.onDidChangeCursorSelection((e: editor.ICursorSelectionChangedEvent) => {
      const sel = e.selection
      if (sel.startLineNumber !== sel.endLineNumber || sel.startColumn !== sel.endColumn) {
        onSelectionChange?.(
          sel.startLineNumber,
          sel.startColumn,
          sel.endLineNumber,
          sel.endColumn
        )
      }
    })

    // Diagnostics tracking (simplified)
    const updateDiagnostics = () => {
      const model = editor.getModel()
      if (model) {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri })
        const errors = markers.filter((m: editor.IMarker) => m.severity === monaco.MarkerSeverity.Error).length
        const warnings = markers.filter((m: editor.IMarker) => m.severity === monaco.MarkerSeverity.Warning).length
        setDiagnostics({ errors, warnings })
      }
    }

    // Check diagnostics periodically
    const diagInterval = setInterval(updateDiagnostics, 2000)

    // Focus editor
    editor.focus()

    return () => {
      clearInterval(diagInterval)
    }
  }, [resolvedLanguage, onCursorChange, onSelectionChange])

  // Content change handler
  const handleChange: OnChange = useCallback((newValue) => {
    if (newValue !== undefined) {
      onChange?.(newValue)
    }
  }, [onChange])

  // Render remote cursors as decorations
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return

    // Step 8b: 增强多光标协同实时渲染
    if (remoteParticipants.length === 0) {
      // 清除所有远程光标装饰
      if (decorationsRef.current.length > 0) {
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [])
      }
      return
    }

    const decorations: editor.IModelDeltaDecoration[] = []

    remoteParticipants.forEach(participant => {
      const color = participant.avatarColor || '#38bdf8'
      const escapedId = participant.userId.replace(/[^a-zA-Z0-9]/g, '_')

      if (participant.cursor) {
        const line = participant.cursor.line
        const col = participant.cursor.column

        // 光标竖线装饰
        decorations.push({
          range: new monaco.Range(line, col, line, col),
          options: {
            className: `remote-cursor-line-${escapedId}`,
            beforeContentClassName: `remote-cursor-bar-${escapedId}`,
            hoverMessage: { value: `**${participant.userName}** 的光标 (L${line}:C${col})` },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        })

        // 光标所在行高亮
        decorations.push({
          range: new monaco.Range(line, 1, line, 1),
          options: {
            isWholeLine: true,
            className: `remote-line-highlight-${escapedId}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        })

        // 用户名浮动标签（通过 afterContentClassName 实现）
        decorations.push({
          range: new monaco.Range(line, col, line, col + 1),
          options: {
            afterContentClassName: `remote-cursor-label-${escapedId}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        })
      }

      if (participant.selection) {
        const sel = participant.selection
        // 选区高亮
        decorations.push({
          range: new monaco.Range(
            sel.startLine, sel.startColumn,
            sel.endLine, sel.endColumn
          ),
          options: {
            className: `remote-selection-${escapedId}`,
            hoverMessage: { value: `**${participant.userName}** 的选区` },
          },
        })
      }
    })

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      decorations
    )
  }, [remoteParticipants])

  return (
    <div className={cn('flex flex-col h-full bg-[#0a0f1e] overflow-hidden', className)}>
      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90"
          >
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-[10px] text-slate-500 font-mono">加载 Monaco Editor...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={resolvedLanguage}
          value={value}
          onChange={handleChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          loading={null}
          options={{
            readOnly,
            minimap: { enabled: minimap },
            lineNumbers: lineNumbers ? 'on' : 'off',
            wordWrap: wordWrap ? 'on' : 'off',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            tabSize: 2,
            insertSpaces: true,
            renderWhitespace: 'boundary',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            padding: { top: 8, bottom: 8 },
            suggest: {
              showMethods: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showStructs: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnumMembers: true,
              showKeywords: true,
              showWords: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showSnippets: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex-none flex items-center justify-between px-2 py-0.5 border-t border-white/[0.04] bg-black/30 text-[9px] font-mono">
        {/* Left: Diagnostics */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-500">
            <FileCode className="w-3 h-3" />
            {resolvedLanguage}
          </span>
          {diagnostics.errors > 0 ? (
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-3 h-3" />
              {diagnostics.errors} 错误
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="w-3 h-3" />
              无错误
            </span>
          )}
          {diagnostics.warnings > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertCircle className="w-3 h-3" />
              {diagnostics.warnings} 警告
            </span>
          )}
        </div>

        {/* Center: Participants */}
        {remoteParticipants.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-600" />
            {remoteParticipants.map(p => (
              <div
                key={p.userId}
                className="flex items-center gap-0.5"
                title={`${p.userName} ${p.cursor ? `L${p.cursor.line}:C${p.cursor.column}` : ''}`}
              >
                <Circle className="w-2 h-2" style={{ color: p.avatarColor, fill: p.avatarColor }} />
                <span className="text-slate-600">{p.userName.slice(0, 2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Right: Cursor Info */}
        <div className="flex items-center gap-3 text-slate-600">
          <span>Ln {cursorInfo.line}, Col {cursorInfo.column}</span>
          <span>UTF-8</span>
          <span>Spaces: 2</span>
          {readOnly && <span className="text-amber-500">只读</span>}
        </div>
      </div>

      {/* Remote cursor CSS injection - Step 8b 增强版 */}
      <style>{`
        ${remoteParticipants.map(p => {
          const color = p.avatarColor || '#38bdf8'
          const escapedId = p.userId.replace(/[^a-zA-Z0-9]/g, '_')
          const shortName = p.userName.slice(0, 4)
          return `
            /* ${p.userName} 光标竖线 */
            .remote-cursor-bar-${escapedId} {
              border-left: 2px solid ${color} !important;
              margin-left: -1px;
              animation: cursor-blink-${escapedId} 1.2s ease-in-out infinite;
            }
            @keyframes cursor-blink-${escapedId} {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
            /* ${p.userName} 行高亮 */
            .remote-line-highlight-${escapedId} {
              background: ${color}08 !important;
              border-left: 2px solid ${color}40;
            }
            /* ${p.userName} 名称标签 */
            .remote-cursor-label-${escapedId}::after {
              content: '${shortName}';
              position: absolute;
              top: -18px;
              left: -2px;
              background: ${color};
              color: #020617;
              font-size: 10px;
              font-family: 'JetBrains Mono', monospace;
              padding: 1px 4px;
              border-radius: 3px 3px 3px 0;
              white-space: nowrap;
              pointer-events: none;
              z-index: 100;
              line-height: 14px;
              font-weight: 600;
            }
            /* ${p.userName} 选区 */
            .remote-selection-${escapedId} {
              background-color: ${color}20 !important;
              border: 1px solid ${color}30;
              border-radius: 2px;
            }
          `
        }).join('\n')}
      `}</style>
    </div>
  )
}