/**
 * file: useAIAutoContext.ts
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
 * useAIAutoContext - AI 上下文自动注入桥接 Hook
 * 
 * 职责：
 * - 监听 editor tab 切换 → 自动更新 aiContext.setActiveFile
 * - 监听 Monaco 诊断 → 自动更新 aiContext.setErrors
 * - 监听 VFS 文件树变化 → 自动更新 aiContext.setProjectTree
 * - 提供 onDiagnosticsChange 回调给 Monaco
 * - 管理 AI 对话发送（带上下文注入）
 * 
 * Step 10b: AI 上下文自动注入闭环
 * 
 * @file hooks/useAIAutoContext.ts
 */

import { useEffect, useCallback, useRef, useMemo } from 'react'
import type { UseAIContextReturn, CompileError, QuickAction } from './useAIContext'
import type { EditorTab } from './useEditorTabs'
import type { UseVirtualFileSystemReturn, VirtualFile } from './useVirtualFileSystem'

// ==========================================
// Types
// ==========================================

export interface MonacoDiagnostic {
  severity: 1 | 2 | 4 | 8 // MarkerSeverity: Hint=1, Info=2, Warning=4, Error=8
  message: string
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
  code?: string | { value: string; target: any }
  source?: string
  resource?: { path: string }
}

export interface UseAIAutoContextConfig {
  /** AI 上下文实例 */
  aiContext: UseAIContextReturn
  /** 当前活动标签 */
  activeTab: EditorTab | null
  /** 所有打开的标签 */
  tabs: EditorTab[]
  /** VFS 实例 */
  vfs: UseVirtualFileSystemReturn
  /** VFS 变更计数（用于触发项目树刷新） */
  vfsChangeCount?: number
}

export interface UseAIAutoContextReturn {
  /** 处理 Monaco 诊断变更 */
  onDiagnosticsChange: (diagnostics: MonacoDiagnostic[]) => void
  /** 发送带上下文注入的 AI 消息 */
  sendWithContext: (userInput: string) => string
  /** 使用快捷操作 */
  executeQuickAction: (action: QuickAction) => string
  /** 当前快捷操作列表 */
  quickActions: QuickAction[]
  /** 当前错误数 */
  errorCount: number
  /** 当前警告数 */
  warningCount: number
  /** 当前活动文件路径 */
  activeFilePath: string | null
  /** 上下文就绪状态 */
  isContextReady: boolean
}

// ==========================================
// Helpers
// ==========================================

function monacoSeverityToString(severity: number): 'error' | 'warning' | 'info' {
  switch (severity) {
    case 8: return 'error'
    case 4: return 'warning'
    default: return 'info'
  }
}

function getMonacoDiagnosticCode(code: MonacoDiagnostic['code']): string | undefined {
  if (!code) return undefined
  if (typeof code === 'string') return code
  return code.value
}

function buildProjectTree(files: VirtualFile[]): string {
  if (files.length === 0) return '(空项目)'
  
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path))
  const lines: string[] = ['📦 项目文件']
  
  // 按目录分组
  const dirs = new Map<string, string[]>()
  sorted.forEach(f => {
    const parts = f.path.split('/')
    const dir = parts.slice(0, -1).join('/') || '/'
    const name = parts[parts.length - 1]
    if (!dirs.has(dir)) dirs.set(dir, [])
    dirs.get(dir)!.push(name)
  })
  
  dirs.forEach((fileNames, dir) => {
    if (dir !== '/') lines.push(`├── ${dir}/`)
    fileNames.forEach((name, i) => {
      const isLast = i === fileNames.length - 1
      lines.push(`${dir !== '/' ? '│   ' : ''}${isLast ? '└── ' : '├── '}${name}`)
    })
  })
  
  lines.push(`\n共 ${files.length} 个文件`)
  return lines.join('\n')
}

// ==========================================
// Hook
// ==========================================

export function useAIAutoContext({
  aiContext,
  activeTab,
  tabs,
  vfs,
  vfsChangeCount = 0,
}: UseAIAutoContextConfig): UseAIAutoContextReturn {
  
  const prevTabRef = useRef<string | null>(null)
  const prevChangeCountRef = useRef(0)

  // ==========================================
  // Effect 1: 活动标签变更 → setActiveFile
  // ==========================================
  useEffect(() => {
    if (!activeTab) return
    if (prevTabRef.current === activeTab.id) return
    prevTabRef.current = activeTab.id
    
    aiContext.setActiveFile(
      activeTab.id,
      activeTab.content,
      activeTab.language
    )
    
    // 同时注入其他打开的标签作为上下文
    tabs.forEach(tab => {
      if (tab.id !== activeTab.id) {
        aiContext.addContextFile(tab.id, tab.content, tab.language)
      }
    })
  }, [activeTab?.id, activeTab?.content, tabs.length])

  // ==========================================
  // Effect 2: VFS 变更 → setProjectTree
  // ==========================================
  useEffect(() => {
    if (prevChangeCountRef.current === vfsChangeCount && vfsChangeCount > 0) return
    prevChangeCountRef.current = vfsChangeCount
    
    const tree = buildProjectTree(vfs.files)
    aiContext.setProjectTree(tree)
  }, [vfsChangeCount, vfs.files.length])

  // ==========================================
  // 处理 Monaco 诊断变更
  // ==========================================
  const onDiagnosticsChange = useCallback((diagnostics: MonacoDiagnostic[]) => {
    const errors: CompileError[] = diagnostics.map(d => ({
      file: activeTab?.id || 'unknown',
      line: d.startLineNumber,
      column: d.startColumn,
      message: d.message,
      severity: monacoSeverityToString(d.severity),
      code: getMonacoDiagnosticCode(d.code),
    }))
    
    aiContext.setErrors(errors)
  }, [aiContext, activeTab?.id])

  // ==========================================
  // 发送带上下文的 AI 消息
  // ==========================================
  const sendWithContext = useCallback((userInput: string): string => {
    // 如果活动标签有新内容，先更新上下文
    if (activeTab) {
      aiContext.setActiveFile(activeTab.id, activeTab.content, activeTab.language)
    }
    
    const contextMessage = aiContext.buildUserMessage(userInput)
    
    // 记录对话轮次
    aiContext.addTurn({
      role: 'user',
      content: userInput,
    })
    
    return contextMessage
  }, [aiContext, activeTab])

  // ==========================================
  // 执行快捷操作
  // ==========================================
  const executeQuickAction = useCallback((action: QuickAction): string => {
    // 如果是修复错误，使用专门的修复提示
    if (action.id === 'fix-errors' && aiContext.errors.length > 0) {
      const prompt = aiContext.buildFixErrorPrompt(aiContext.errors[0])
      aiContext.addTurn({ role: 'user', content: prompt })
      return prompt
    }
    
    // 其他操作使用 buildUserMessage
    const contextMessage = aiContext.buildUserMessage(action.prompt)
    aiContext.addTurn({ role: 'user', content: action.prompt })
    return contextMessage
  }, [aiContext])

  // ==========================================
  // 派生状态
  // ==========================================
  const errorCount = useMemo(
    () => aiContext.errors.filter(e => e.severity === 'error').length,
    [aiContext.errors]
  )
  
  const warningCount = useMemo(
    () => aiContext.errors.filter(e => e.severity === 'warning').length,
    [aiContext.errors]
  )

  return {
    onDiagnosticsChange,
    sendWithContext,
    executeQuickAction,
    quickActions: aiContext.quickActions,
    errorCount,
    warningCount,
    activeFilePath: activeTab?.id || null,
    isContextReady: !!activeTab,
  }
}
