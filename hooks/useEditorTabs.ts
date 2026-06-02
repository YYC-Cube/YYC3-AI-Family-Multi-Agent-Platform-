/**
 * file: useEditorTabs.ts
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
 * useEditorTabs - 多标签页编辑器管理 Hook
 * 
 * 职责：
 * - 管理打开的编辑器标签页
 * - 标签页切换、关闭、排序
 * - 文件内容映射（path → content）
 * - 脏标记（未保存变更）
 * - 与 ProjectFileManager 联动（点击文件 → 打开标签）
 * - 与 Monaco Editor 联动（切换标签 → 切换文件内容）
 * 
 * Step 7c: 文件树与 Monaco Editor 联动
 * 
 * @file hooks/useEditorTabs.ts
 */

import { useState, useCallback } from 'react'

// ==========================================
// Types
// ==========================================

export interface EditorTab {
  /** 文件路径（唯一标识） */
  id: string
  /** 显示名称 */
  name: string
  /** 文件语言 */
  language: string
  /** 文件内容 */
  content: string
  /** 是否有未保存变更 */
  isDirty: boolean
  /** 原始内容（用于比较是否有变更） */
  originalContent: string
  /** 光标位置 */
  cursorPosition?: { line: number; column: number }
  /** 滚动位置 */
  scrollPosition?: { top: number; left: number }
}

export interface UseEditorTabsReturn {
  /** 所有打开的标签页 */
  tabs: EditorTab[]
  /** 当前活动标签页 ID */
  activeTabId: string | null
  /** 当前活动标签页 */
  activeTab: EditorTab | null
  
  /** 打开文件（已打开则激活，未打开则新建标签） */
  openFile: (id: string, name: string, content: string, language?: string) => void
  /** 关闭标签页 */
  closeTab: (id: string) => void
  /** 关闭其他标签页 */
  closeOtherTabs: (keepId: string) => void
  /** 关闭所有标签页 */
  closeAllTabs: () => void
  /** 切换到标签页 */
  switchTab: (id: string) => void
  /** 更新标签页内容 */
  updateContent: (id: string, content: string) => void
  /** 保存标签页（重置脏标记） */
  saveTab: (id: string) => string | null
  /** 保存所有脏标签页 */
  saveAllTabs: () => Array<{ id: string; content: string }>
  /** 更新光标位置 */
  updateCursorPosition: (id: string, line: number, column: number) => void
  /** 更新滚动位置 */
  updateScrollPosition: (id: string, top: number, left: number) => void
  /** 检查是否有未保存的变更 */
  hasUnsavedChanges: boolean
  /** 获取脏标签页数量 */
  dirtyCount: number
  /** 重新排序标签页 */
  reorderTabs: (fromIndex: number, toIndex: number) => void
}

// ==========================================
// 语言检测
// ==========================================

function detectLanguage(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact',
    js: 'javascript', jsx: 'javascriptreact',
    json: 'json', md: 'markdown', css: 'css',
    html: 'html', py: 'python', sql: 'sql',
    yaml: 'yaml', yml: 'yaml', toml: 'toml',
    sh: 'shell', bash: 'shell',
  }
  return map[ext || ''] || 'plaintext'
}

// ==========================================
// Hook 实现
// ==========================================

export function useEditorTabs(): UseEditorTabsReturn {
  const [tabs, setTabs] = useState<EditorTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  // 当前活动标签
  const activeTab = tabs.find(t => t.id === activeTabId) || null

  // 打开文件
  const openFile = useCallback((
    id: string,
    name: string,
    content: string,
    language?: string
  ) => {
    setTabs(prev => {
      const existing = prev.find(t => t.id === id)
      if (existing) {
        // 已打开，只需切换
        return prev
      }
      // 新建标签
      return [...prev, {
        id,
        name,
        language: language || detectLanguage(name),
        content,
        isDirty: false,
        originalContent: content,
      }]
    })
    setActiveTabId(id)
  }, [])

  // 关闭标签
  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const index = prev.findIndex(t => t.id === id)
      if (index === -1) return prev
      
      const newTabs = prev.filter(t => t.id !== id)
      return newTabs
    })

    setActiveTabId(prev => {
      if (prev !== id) return prev
      // 需要切换到相邻标签
      const currentTabs = tabs
      const index = currentTabs.findIndex(t => t.id === id)
      if (currentTabs.length <= 1) return null
      if (index > 0) return currentTabs[index - 1].id
      return currentTabs[1]?.id || null
    })
  }, [tabs])

  // 关闭其他标签
  const closeOtherTabs = useCallback((keepId: string) => {
    setTabs(prev => prev.filter(t => t.id === keepId))
    setActiveTabId(keepId)
  }, [])

  // 关闭所有标签
  const closeAllTabs = useCallback(() => {
    setTabs([])
    setActiveTabId(null)
  }, [])

  // 切换标签
  const switchTab = useCallback((id: string) => {
    setActiveTabId(id)
  }, [])

  // 更新内容
  const updateContent = useCallback((id: string, content: string) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== id) return tab
      return {
        ...tab,
        content,
        isDirty: content !== tab.originalContent,
      }
    }))
  }, [])

  // 保存标签
  const saveTab = useCallback((id: string): string | null => {
    let savedContent: string | null = null
    setTabs(prev => prev.map(tab => {
      if (tab.id !== id) return tab
      savedContent = tab.content
      return {
        ...tab,
        isDirty: false,
        originalContent: tab.content,
      }
    }))
    return savedContent
  }, [])

  // 保存所有脏标签
  const saveAllTabs = useCallback((): Array<{ id: string; content: string }> => {
    const saved: Array<{ id: string; content: string }> = []
    setTabs(prev => prev.map(tab => {
      if (!tab.isDirty) return tab
      saved.push({ id: tab.id, content: tab.content })
      return { ...tab, isDirty: false, originalContent: tab.content }
    }))
    return saved
  }, [])

  // 更新光标位置
  const updateCursorPosition = useCallback((id: string, line: number, column: number) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== id) return tab
      return { ...tab, cursorPosition: { line, column } }
    }))
  }, [])

  // 更新滚动位置
  const updateScrollPosition = useCallback((id: string, top: number, left: number) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== id) return tab
      return { ...tab, scrollPosition: { top, left } }
    }))
  }, [])

  // 重新排序
  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    setTabs(prev => {
      const newTabs = [...prev]
      const [moved] = newTabs.splice(fromIndex, 1)
      newTabs.splice(toIndex, 0, moved)
      return newTabs
    })
  }, [])

  const hasUnsavedChanges = tabs.some(t => t.isDirty)
  const dirtyCount = tabs.filter(t => t.isDirty).length

  return {
    tabs,
    activeTabId,
    activeTab,
    openFile,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    switchTab,
    updateContent,
    saveTab,
    saveAllTabs,
    updateCursorPosition,
    updateScrollPosition,
    hasUnsavedChanges,
    dirtyCount,
    reorderTabs,
  }
}
