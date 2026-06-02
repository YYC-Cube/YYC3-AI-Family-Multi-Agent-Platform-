/**
 * file: EditorTabBar.tsx
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
 * EditorTabBar - 编辑器标签栏组件
 * 
 * 职责：
 * - 显示所有打开的文件标签页
 * - 标签页切换、关闭、脏标记
 * - 右键菜单（关闭、关闭其他、关闭所有）
 * - 文件图标和语言类型显示
 * 
 * Step 7c: 文件树与 Monaco Editor 联动
 * 
 * @file components/collaboration/EditorTabBar.tsx
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  FileCode,
  FileJson,
  FileText,
  File,
  Image as ImageIcon,
  Circle,
  Save,
  MoreHorizontal,
  GitCompare,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'
import type { EditorTab } from '../../hooks/useEditorTabs'

// ==========================================
// Types
// ==========================================

export interface EditorTabBarProps {
  tabs: EditorTab[]
  activeTabId: string | null
  onSwitchTab: (id: string) => void
  onCloseTab: (id: string) => void
  onCloseOtherTabs: (keepId: string) => void
  onCloseAllTabs: () => void
  onSaveTab?: (id: string) => void
  onSaveAllTabs?: () => void
  /** Step 9c: 查看变更回调 */
  onViewDiff?: (id: string) => void
  className?: string
}

// ==========================================
// Helpers
// ==========================================

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'tsx':
    case 'jsx':
      return <FileCode className="w-3 h-3 text-blue-400" />
    case 'ts':
    case 'js':
      return <FileCode className="w-3 h-3 text-yellow-400" />
    case 'json':
      return <FileJson className="w-3 h-3 text-amber-400" />
    case 'md':
      return <FileText className="w-3 h-3 text-slate-400" />
    case 'css':
    case 'scss':
      return <FileCode className="w-3 h-3 text-pink-400" />
    case 'html':
      return <FileCode className="w-3 h-3 text-orange-400" />
    case 'png':
    case 'jpg':
    case 'svg':
      return <ImageIcon className="w-3 h-3 text-pink-400" />
    default:
      return <File className="w-3 h-3 text-slate-500" />
  }
}

// ==========================================
// Context Menu
// ==========================================

interface TabContextMenuState {
  visible: boolean
  x: number
  y: number
  tabId: string | null
}

function TabContextMenu({
  state,
  onAction,
  onClose,
}: {
  state: TabContextMenuState
  onAction: (action: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (!state.visible) return null

  const items = [
    { id: 'close', label: '关闭' },
    { id: 'close-others', label: '关闭其他' },
    { id: 'close-all', label: '关闭全部' },
    { id: 'divider', label: '' },
    { id: 'save', label: '保存' },
    { id: 'save-all', label: '保存全部' },
    { id: 'divider2', label: '' },
    { id: 'view-diff', label: '📊 查看变更' },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed z-[100] min-w-[140px] bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl shadow-black/50 py-1"
      style={{ left: state.x, top: state.y }}
    >
      {items.map(item => {
        if (item.id === 'divider' || item.id === 'divider2') {
          return <div key={item.id} className="h-px bg-white/[0.06] my-1 mx-2" />
        }
        return (
          <button
            key={item.id}
            onClick={() => { onAction(item.id); onClose() }}
            className="w-full px-3 py-1.5 text-[11px] font-mono text-slate-300 hover:bg-white/[0.05] transition-all text-left"
          >
            {item.label}
          </button>
        )
      })}
    </motion.div>
  )
}

// ==========================================
// Component
// ==========================================

export function EditorTabBar({
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onCloseOtherTabs,
  onCloseAllTabs,
  onSaveTab,
  onSaveAllTabs,
  onViewDiff,
  className,
}: EditorTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<TabContextMenuState>({
    visible: false, x: 0, y: 0, tabId: null,
  })

  const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 160),
      y: Math.min(e.clientY, window.innerHeight - 200),
      tabId,
    })
  }, [])

  const handleContextAction = useCallback((action: string) => {
    const tabId = contextMenu.tabId
    if (!tabId) return

    switch (action) {
      case 'close':
        onCloseTab(tabId)
        break
      case 'close-others':
        onCloseOtherTabs(tabId)
        break
      case 'close-all':
        onCloseAllTabs()
        break
      case 'save':
        onSaveTab?.(tabId)
        break
      case 'save-all':
        onSaveAllTabs?.()
        break
      case 'view-diff':
        onViewDiff?.(tabId)
        break
    }
  }, [contextMenu.tabId, onCloseTab, onCloseOtherTabs, onCloseAllTabs, onSaveTab, onSaveAllTabs, onViewDiff])

  // 处理鼠标中键关闭
  const handleMouseDown = useCallback((e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault()
      onCloseTab(tabId)
    }
  }, [onCloseTab])

  if (tabs.length === 0) {
    return (
      <div className={cn(
        "flex items-center h-[30px] bg-black/20 border-b border-white/[0.04] px-3",
        className
      )}>
        <span className="text-[10px] font-mono text-slate-600">无打开的文件</span>
      </div>
    )
  }

  return (
    <>
      <div
        ref={scrollRef}
        className={cn(
          "flex items-stretch h-[30px] bg-black/20 border-b border-white/[0.04] overflow-x-auto overflow-y-hidden",
          "scrollbar-none",
          className
        )}
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          return (
            <motion.button
              key={tab.id}
              layout
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => onSwitchTab(tab.id)}
              onMouseDown={(e) => handleMouseDown(e, tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-0 text-[11px] font-mono border-r border-white/[0.04] transition-colors flex-none min-w-0 max-w-[160px] group",
                isActive
                  ? "bg-slate-900/60 text-slate-200 border-t border-t-emerald-500/50"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
              )}
            >
              {/* File Icon */}
              {getFileIcon(tab.name)}

              {/* File Name */}
              <span className="truncate">{tab.name}</span>

              {/* Dirty Indicator */}
              {tab.isDirty && (
                <Circle
                  className="w-2 h-2 flex-none text-amber-400"
                  fill="currentColor"
                />
              )}

              {/* Close Button */}
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(tab.id)
                }}
                className={cn(
                  "flex-none p-0.5 rounded hover:bg-white/10 transition-colors ml-auto",
                  isActive || tab.isDirty ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <X className="w-2.5 h-2.5" />
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Tab Context Menu */}
      <AnimatePresence>
        {contextMenu.visible && (
          <TabContextMenu
            state={contextMenu}
            onAction={handleContextAction}
            onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
          />
        )}
      </AnimatePresence>
    </>
  )
}