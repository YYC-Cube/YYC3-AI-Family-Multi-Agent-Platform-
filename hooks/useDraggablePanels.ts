/**
 * file: useDraggablePanels.ts
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
 * useDraggablePanels - 多联式面板拖拽管理 Hook
 * 
 * 职责：
 * - 面板布局树状结构管理
 * - 拖拽合并（DnD drop 到边缘）
 * - 面板拆分（水平/垂直，2/3/4 区）
 * - 面板最大化/恢复
 * - 布局持久化 (localStorage)
 * 
 * @file hooks/useDraggablePanels.ts
 */

import { useState, useCallback, useEffect } from 'react'
import type {
  PanelLayoutNode,
  PanelLayoutState,
  PanelType,
  SplitDirection,
  DropPosition,
} from '../types/collaboration'
import { DEFAULT_PANEL_LAYOUT } from '../types/collaboration'

const STORAGE_KEY = 'yyc3-panel-layout'

// ==========================================
// 布局操作工具函数
// ==========================================

/** 深拷贝布局树 */
function cloneLayout(node: PanelLayoutNode): PanelLayoutNode {
  return JSON.parse(JSON.stringify(node))
}

/** 在布局树中查找节点 */
function findNode(
  root: PanelLayoutNode,
  id: string
): PanelLayoutNode | null {
  if (root.id === id) return root
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, id)
      if (found) return found
    }
  }
  return null
}

/** 在布局树中查找节点的父节点 */
function findParent(
  root: PanelLayoutNode,
  id: string
): { parent: PanelLayoutNode; index: number } | null {
  if (root.children) {
    for (let i = 0; i < root.children.length; i++) {
      if (root.children[i].id === id) {
        return { parent: root, index: i }
      }
      const found = findParent(root.children[i], id)
      if (found) return found
    }
  }
  return null
}

/** 从布局树中移除节点 */
function removeNode(root: PanelLayoutNode, id: string): PanelLayoutNode {
  const newRoot = cloneLayout(root)
  const parentInfo = findParent(newRoot, id)
  if (parentInfo) {
    parentInfo.parent.children!.splice(parentInfo.index, 1)
    // 如果父节点只剩一个子节点，提升该子节点
    if (parentInfo.parent.children!.length === 1) {
      const onlyChild = parentInfo.parent.children![0]
      // 用子节点替换父节点的属性
      parentInfo.parent.type = onlyChild.type
      parentInfo.parent.panelType = onlyChild.panelType
      parentInfo.parent.direction = onlyChild.direction
      parentInfo.parent.children = onlyChild.children
      parentInfo.parent.title = onlyChild.title
      parentInfo.parent.closable = onlyChild.closable
    }
  }
  return newRoot
}

// ==========================================
// Hook 接口
// ==========================================

export interface UseDraggablePanelsReturn {
  layout: PanelLayoutState
  
  // 面板操作
  splitPanel: (panelId: string, direction: SplitDirection, newPanelType?: PanelType) => void
  mergePanel: (sourceId: string, targetId: string, position: DropPosition) => void
  closePanel: (panelId: string) => void
  maximizePanel: (panelId: string) => void
  restorePanel: () => void
  setActivePanel: (panelId: string | null) => void
  
  // 拖拽状态
  setDragOver: (targetId: string | null, position: DropPosition | null) => void
  
  // 布局重置
  resetLayout: () => void
  
  // 调整面板比例
  resizePanel: (panelId: string, newRatio: number) => void
}

// ==========================================
// Hook 实现
// ==========================================

export function useDraggablePanels(
  initialLayout?: PanelLayoutNode
): UseDraggablePanelsReturn {
  // 尝试从 localStorage 恢复
  const loadLayout = (): PanelLayoutNode => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {}
    return initialLayout || cloneLayout(DEFAULT_PANEL_LAYOUT)
  }

  const [layout, setLayout] = useState<PanelLayoutState>({
    root: loadLayout(),
    activePanel: null,
    maximizedPanel: null,
    dragOverTarget: null,
    dragOverPosition: null,
  })

  // 持久化
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout.root))
    } catch {}
  }, [layout.root])

  // 拆分面板
  const splitPanel = useCallback((
    panelId: string,
    direction: SplitDirection,
    newPanelType: PanelType = 'code-editor'
  ) => {
    setLayout(prev => {
      const newRoot = cloneLayout(prev.root)
      const node = findNode(newRoot, panelId)
      if (!node || node.type !== 'panel') return prev

      // 将当前面板转为 split，包含原面板和新面板
      const originalPanel: PanelLayoutNode = {
        id: `${panelId}-original-${Date.now()}`,
        type: 'panel',
        panelType: node.panelType,
        ratio: 50,
        minSize: node.minSize || 120,
        title: node.title,
        closable: true,
      }

      const newPanel: PanelLayoutNode = {
        id: `panel-${Date.now()}`,
        type: 'panel',
        panelType: newPanelType,
        ratio: 50,
        minSize: 120,
        title: getPanelTitle(newPanelType),
        closable: true,
      }

      // 转换当前节点为 split
      node.type = 'split'
      node.direction = direction
      node.children = [originalPanel, newPanel]
      node.panelType = undefined
      node.title = undefined
      node.closable = undefined

      return { ...prev, root: newRoot }
    })
  }, [])

  // 合并面板（拖拽放置）
  const mergePanel = useCallback((
    sourceId: string,
    targetId: string,
    position: DropPosition
  ) => {
    if (sourceId === targetId) return

    setLayout(prev => {
      let newRoot = cloneLayout(prev.root)
      const sourceNode = findNode(newRoot, sourceId)
      if (!sourceNode || sourceNode.type !== 'panel') return prev

      // 先从原位置移除
      const sourcePanelType = sourceNode.panelType
      const sourceTitle = sourceNode.title
      newRoot = removeNode(newRoot, sourceId)

      // 在目标位置创建新的 split
      const targetNode = findNode(newRoot, targetId)
      if (!targetNode) return prev

      if (position === 'center' || position === 'tab') {
        // Tab 合并：暂时简化为替换
        return prev
      }

      // 方向映射
      const direction: SplitDirection =
        position === 'left' || position === 'right' ? 'horizontal' : 'vertical'

      const newPanel: PanelLayoutNode = {
        id: `panel-merged-${Date.now()}`,
        type: 'panel',
        panelType: sourcePanelType,
        ratio: 50,
        minSize: 120,
        title: sourceTitle,
        closable: true,
      }

      if (targetNode.type === 'panel') {
        // 将目标面板转为 split
        const targetCopy: PanelLayoutNode = {
          id: `${targetId}-kept-${Date.now()}`,
          type: 'panel',
          panelType: targetNode.panelType,
          ratio: 50,
          minSize: targetNode.minSize || 120,
          title: targetNode.title,
          closable: targetNode.closable,
        }

        targetNode.type = 'split'
        targetNode.direction = direction
        targetNode.children =
          position === 'left' || position === 'top'
            ? [newPanel, targetCopy]
            : [targetCopy, newPanel]
        targetNode.panelType = undefined
        targetNode.title = undefined
        targetNode.closable = undefined
      } else if (targetNode.type === 'split' && targetNode.children) {
        // 添加到已有 split
        if (position === 'left' || position === 'top') {
          targetNode.children.unshift(newPanel)
        } else {
          targetNode.children.push(newPanel)
        }
        // 重新平分比例
        const count = targetNode.children.length
        targetNode.children.forEach(c => { c.ratio = Math.floor(100 / count) })
      }

      return { ...prev, root: newRoot, dragOverTarget: null, dragOverPosition: null }
    })
  }, [])

  // 关闭面板
  const closePanel = useCallback((panelId: string) => {
    setLayout(prev => {
      const newRoot = removeNode(prev.root, panelId)
      return {
        ...prev,
        root: newRoot,
        activePanel: prev.activePanel === panelId ? null : prev.activePanel,
      }
    })
  }, [])

  // 最大化面板
  const maximizePanel = useCallback((panelId: string) => {
    setLayout(prev => ({
      ...prev,
      maximizedPanel: prev.maximizedPanel === panelId ? null : panelId,
    }))
  }, [])

  // 恢复面板
  const restorePanel = useCallback(() => {
    setLayout(prev => ({ ...prev, maximizedPanel: null }))
  }, [])

  // 设置活动面板
  const setActivePanel = useCallback((panelId: string | null) => {
    setLayout(prev => ({ ...prev, activePanel: panelId }))
  }, [])

  // 设置拖拽悬停状态
  const setDragOver = useCallback((
    targetId: string | null,
    position: DropPosition | null
  ) => {
    setLayout(prev => ({
      ...prev,
      dragOverTarget: targetId,
      dragOverPosition: position,
    }))
  }, [])

  // 重置布局
  const resetLayout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setLayout({
      root: cloneLayout(DEFAULT_PANEL_LAYOUT),
      activePanel: null,
      maximizedPanel: null,
      dragOverTarget: null,
      dragOverPosition: null,
    })
  }, [])

  // 调整面板比例
  const resizePanel = useCallback((panelId: string, newRatio: number) => {
    setLayout(prev => {
      const newRoot = cloneLayout(prev.root)
      const node = findNode(newRoot, panelId)
      if (node) {
        node.ratio = Math.max(10, Math.min(90, newRatio))
      }
      return { ...prev, root: newRoot }
    })
  }, [])

  return {
    layout,
    splitPanel,
    mergePanel,
    closePanel,
    maximizePanel,
    restorePanel,
    setActivePanel,
    setDragOver,
    resetLayout,
    resizePanel,
  }
}

// ==========================================
// 工具函数
// ==========================================

function getPanelTitle(type: PanelType): string {
  const titles: Record<PanelType, string> = {
    'ai-chat': '智能AI交互',
    'file-tree': '文件管理',
    'code-editor': '代码编辑器',
    'terminal': '终端',
    'preview': '实时预览',
    'code-detail': '代码详情',
  }
  return titles[type] || '面板'
}
