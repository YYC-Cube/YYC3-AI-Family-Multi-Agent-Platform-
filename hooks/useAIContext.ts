/**
 * file: useAIContext.ts
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
 * useAIContext - AI 多轮对话上下文管理 Hook
 * 
 * 职责：
 * - 构建 AI 对话上下文（当前文件内容 + 编译错误 + 项目结构）
 * - 管理上下文注入策略（精简/完整/自定义）
 * - 支持迭代修复循环（错误 → AI → 代码 → 应用 → 再检查）
 * - 生成智能 quick actions（基于当前状态）
 * 
 * Step 9b: AI 多轮对话上下文
 * 
 * @file hooks/useAIContext.ts
 */

import { useState, useCallback, useMemo, useRef } from 'react'

// ==========================================
// Types
// ==========================================

export interface CompileError {
  file: string
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
  code?: string
}

export interface AIContextFile {
  path: string
  content: string
  language: string
  /** 是否是当前活动文件 */
  isActive: boolean
}

export interface AIContextConfig {
  /** 注入策略 */
  strategy: 'minimal' | 'full' | 'smart'
  /** 最大上下文 token（粗略估计） */
  maxTokens: number
  /** 是否包含项目结构 */
  includeProjectTree: boolean
  /** 是否包含编译错误 */
  includeErrors: boolean
  /** 是否包含最近 diff */
  includeDiff: boolean
}

export interface QuickAction {
  id: string
  label: string
  prompt: string
  icon: 'bug' | 'sparkles' | 'code' | 'refactor' | 'test' | 'docs'
  /** 是否在当前上下文中可用 */
  available: boolean
  /** 优先级（越小越高） */
  priority: number
}

export interface AIConversationTurn {
  role: 'user' | 'assistant' | 'system' | 'context'
  content: string
  timestamp: number
  /** 关联的文件变更 */
  fileChanges?: Array<{ path: string; action: 'create' | 'modify' | 'delete' }>
  /** 是否已应用 */
  applied?: boolean
}

export interface UseAIContextReturn {
  /** 当前上下文文件列表 */
  contextFiles: AIContextFile[]
  /** 当前编译错误 */
  errors: CompileError[]
  /** 对话历史 */
  conversation: AIConversationTurn[]
  /** 智能快捷操作 */
  quickActions: QuickAction[]
  /** 构建的系统提示词 */
  systemPrompt: string

  /** 设置活动文件 */
  setActiveFile: (path: string, content: string, language: string) => void
  /** 添加上下文文件 */
  addContextFile: (path: string, content: string, language: string) => void
  /** 移除上下文文件 */
  removeContextFile: (path: string) => void
  /** 更新编译错误 */
  setErrors: (errors: CompileError[]) => void
  /** 添加对话轮次 */
  addTurn: (turn: Omit<AIConversationTurn, 'timestamp'>) => void
  /** 标记轮次已应用 */
  markApplied: (index: number) => void
  /** 构建用户消息（带上下文注入） */
  buildUserMessage: (userInput: string) => string
  /** 获取修复错误的提示词 */
  buildFixErrorPrompt: (error: CompileError) => string
  /** 清空对话 */
  clearConversation: () => void
  /** 更新配置 */
  updateConfig: (config: Partial<AIContextConfig>) => void
  /** 项目文件树字符串 */
  projectTree: string
  /** 设置项目文件树 */
  setProjectTree: (tree: string) => void
}

// ==========================================
// 常量
// ==========================================

const DEFAULT_CONFIG: AIContextConfig = {
  strategy: 'smart',
  maxTokens: 4096,
  includeProjectTree: true,
  includeErrors: true,
  includeDiff: true,
}

const SYSTEM_PROMPT_TEMPLATE = `你是 YYC³ AI Family 智能编程助手。你的角色是帮助开发者编写高质量的 TypeScript/React 代码。

## 你的能力
- 代码生成与重构
- Bug 修复与错误诊断
- 架构设计建议
- 代码审查与优化

## 输出规范
- 使用 TypeScript 严格模式
- 遵循 React 最佳实践
- 代码块使用 \`\`\`typescript 标记
- 简短解释后给出完整代码`

// ==========================================
// Hook 实现
// ==========================================

export function useAIContext(initialConfig?: Partial<AIContextConfig>): UseAIContextReturn {
  const [config, setConfig] = useState<AIContextConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  })

  const [contextFiles, setContextFiles] = useState<AIContextFile[]>([])
  const [errors, setErrors] = useState<CompileError[]>([])
  const [conversation, setConversation] = useState<AIConversationTurn[]>([])
  const [projectTree, setProjectTree] = useState<string>('')
  const turnCounter = useRef(0)

  // 设置活动文件
  const setActiveFile = useCallback((path: string, content: string, language: string) => {
    setContextFiles(prev => {
      const existing = prev.filter(f => f.path !== path).map(f => ({ ...f, isActive: false }))
      return [...existing, { path, content, language, isActive: true }]
    })
  }, [])

  // 添加上下文文件
  const addContextFile = useCallback((path: string, content: string, language: string) => {
    setContextFiles(prev => {
      if (prev.find(f => f.path === path)) {
        return prev.map(f => f.path === path ? { ...f, content, language } : f)
      }
      return [...prev, { path, content, language, isActive: false }]
    })
  }, [])

  // 移除上下文文件
  const removeContextFile = useCallback((path: string) => {
    setContextFiles(prev => prev.filter(f => f.path !== path))
  }, [])

  // 添加对话轮次
  const addTurn = useCallback((turn: Omit<AIConversationTurn, 'timestamp'>) => {
    setConversation(prev => [...prev, { ...turn, timestamp: Date.now() }])
  }, [])

  // 标记已应用
  const markApplied = useCallback((index: number) => {
    setConversation(prev => prev.map((t, i) => i === index ? { ...t, applied: true } : t))
  }, [])

  // 清空对话
  const clearConversation = useCallback(() => {
    setConversation([])
    turnCounter.current = 0
  }, [])

  // 更新配置
  const updateConfig = useCallback((partial: Partial<AIContextConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }))
  }, [])

  // 构建系统提示词
  const systemPrompt = useMemo(() => {
    let prompt = SYSTEM_PROMPT_TEMPLATE

    // 注入项目结构
    if (config.includeProjectTree && projectTree) {
      prompt += `\n\n## 项目结构\n\`\`\`\n${projectTree}\n\`\`\``
    }

    // 注入活动文件
    const activeFile = contextFiles.find(f => f.isActive)
    if (activeFile) {
      prompt += `\n\n## 当前编辑文件: ${activeFile.path}\n\`\`\`${activeFile.language}\n${truncateContent(activeFile.content, config.maxTokens / 2)}\n\`\`\``
    }

    // 注入编译错误
    if (config.includeErrors && errors.length > 0) {
      prompt += `\n\n## 当前编译错误 (${errors.length} 个)\n`
      errors.slice(0, 10).forEach((err, i) => {
        prompt += `${i + 1}. [${err.severity.toUpperCase()}] ${err.file}:${err.line}:${err.column} — ${err.message}\n`
      })
    }

    return prompt
  }, [config, contextFiles, errors, projectTree])

  // 构建用户消息（带上下文注入）
  const buildUserMessage = useCallback((userInput: string): string => {
    if (config.strategy === 'minimal') return userInput

    let message = userInput

    // smart 策略：检测用户意图，按需注入
    if (config.strategy === 'smart') {
      const lowerInput = userInput.toLowerCase()
      const wantsContext =
        lowerInput.includes('当前文件') || lowerInput.includes('这个文件') ||
        lowerInput.includes('this file') || lowerInput.includes('current file') ||
        lowerInput.includes('修复') || lowerInput.includes('fix') ||
        lowerInput.includes('优化') || lowerInput.includes('重构') ||
        lowerInput.includes('分析') || lowerInput.includes('解释')

      if (wantsContext) {
        // 注入其他上下文文件（非活动文件）
        const otherFiles = contextFiles.filter(f => !f.isActive)
        if (otherFiles.length > 0) {
          message += '\n\n---\n**相关文件上下文:**'
          otherFiles.slice(0, 3).forEach(f => {
            message += `\n\n### ${f.path}\n\`\`\`${f.language}\n${truncateContent(f.content, 500)}\n\`\`\``
          })
        }
      }

      // 如有错误且用户提到修复/错误，注入详细错误信息
      if (errors.length > 0 && (lowerInput.includes('修复') || lowerInput.includes('fix') || lowerInput.includes('错误') || lowerInput.includes('error'))) {
        message += '\n\n---\n**编译错误详情:**'
        errors.forEach((err, i) => {
          message += `\n${i + 1}. \`${err.file}:${err.line}:${err.column}\` — ${err.message}`
          if (err.code) message += ` (code: ${err.code})`
        })
      }
    }

    // full 策略：总是注入全部上下文
    if (config.strategy === 'full') {
      contextFiles.filter(f => !f.isActive).forEach(f => {
        message += `\n\n--- 上下文文件: ${f.path} ---\n\`\`\`${f.language}\n${truncateContent(f.content, 800)}\n\`\`\``
      })
      if (errors.length > 0) {
        message += `\n\n--- 编译错误 ---\n`
        errors.forEach(err => {
          message += `[${err.severity}] ${err.file}:${err.line} — ${err.message}\n`
        })
      }
    }

    return message
  }, [config, contextFiles, errors])

  // 构建修复错误的提示词
  const buildFixErrorPrompt = useCallback((error: CompileError): string => {
    const activeFile = contextFiles.find(f => f.isActive)
    let prompt = `请修复以下编译错误：\n\n`
    prompt += `**错误信息:** ${error.message}\n`
    prompt += `**位置:** ${error.file} 第 ${error.line} 行，第 ${error.column} 列\n`
    prompt += `**严重性:** ${error.severity}\n`
    if (error.code) prompt += `**错误码:** ${error.code}\n`

    if (activeFile && activeFile.path === error.file) {
      // 提取错误周围的代码
      const lines = activeFile.content.split('\n')
      const startLine = Math.max(0, error.line - 5)
      const endLine = Math.min(lines.length, error.line + 5)
      const snippet = lines.slice(startLine, endLine)
        .map((l, i) => {
          const lineNum = startLine + i + 1
          const marker = lineNum === error.line ? ' >>> ' : '     '
          return `${marker}${lineNum}: ${l}`
        })
        .join('\n')
      prompt += `\n**代码上下文:**\n\`\`\`${activeFile.language}\n${snippet}\n\`\`\``
    }

    prompt += '\n\n请给出修复后的完整代码片段，并简要解释修复原因。'
    return prompt
  }, [contextFiles])

  // 智能快捷操作
  const quickActions = useMemo((): QuickAction[] => {
    const actions: QuickAction[] = []
    const activeFile = contextFiles.find(f => f.isActive)
    const hasErrors = errors.length > 0
    const hasWarnings = errors.some(e => e.severity === 'warning')

    // 修复错误（有错误时高优先级）
    if (hasErrors) {
      const errorCount = errors.filter(e => e.severity === 'error').length
      actions.push({
        id: 'fix-errors',
        label: `修复 ${errorCount} 个错误`,
        prompt: `请修复当前文件中的所有 ${errorCount} 个编译错误。`,
        icon: 'bug',
        available: true,
        priority: 1,
      })
    }

    // 修复警告
    if (hasWarnings) {
      actions.push({
        id: 'fix-warnings',
        label: '修复警告',
        prompt: '请修复当前文件中的所有编译警告。',
        icon: 'bug',
        available: true,
        priority: 3,
      })
    }

    // 优化代码
    if (activeFile) {
      actions.push({
        id: 'optimize',
        label: '优化代码',
        prompt: `请优化 ${activeFile.path} 中的代码，提升性能和可读性。`,
        icon: 'sparkles',
        available: true,
        priority: 4,
      })

      actions.push({
        id: 'add-types',
        label: '补全类型',
        prompt: `请为 ${activeFile.path} 中的函数和变量补全 TypeScript 类型声明。`,
        icon: 'code',
        available: activeFile.language.includes('typescript') || activeFile.language.includes('javascript'),
        priority: 5,
      })

      actions.push({
        id: 'gen-tests',
        label: '生成测试',
        prompt: `请为 ${activeFile.path} 中的核心函数生成 Vitest 测试用例。`,
        icon: 'test',
        available: true,
        priority: 6,
      })

      actions.push({
        id: 'add-docs',
        label: '添加文档',
        prompt: `请为 ${activeFile.path} 中的每个函数和接口添加 JSDoc 文档注释。`,
        icon: 'docs',
        available: true,
        priority: 7,
      })

      actions.push({
        id: 'refactor',
        label: '重构建议',
        prompt: `请分析 ${activeFile.path} 的架构，提供重构建议和优化后的代码。`,
        icon: 'refactor',
        available: true,
        priority: 8,
      })
    }

    // 通用操作
    if (!activeFile) {
      actions.push({
        id: 'create-component',
        label: '创建组件',
        prompt: '帮我创建一个新的 React 组件，需要什么功能？',
        icon: 'code',
        available: true,
        priority: 10,
      })
    }

    return actions.filter(a => a.available).sort((a, b) => a.priority - b.priority)
  }, [contextFiles, errors])

  return {
    contextFiles,
    errors,
    conversation,
    quickActions,
    systemPrompt,
    setActiveFile,
    addContextFile,
    removeContextFile,
    setErrors,
    addTurn,
    markApplied,
    buildUserMessage,
    buildFixErrorPrompt,
    clearConversation,
    updateConfig,
    projectTree,
    setProjectTree,
  }
}

// ==========================================
// Helpers
// ==========================================

function truncateContent(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content
  return content.slice(0, maxChars) + '\n// ... (已截断)'
}
