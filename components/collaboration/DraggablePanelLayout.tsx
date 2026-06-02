/**
 * file: DraggablePanelLayout.tsx
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
 * DraggablePanelLayout - 多联式可拖拽面板布局引擎
 * 
 * 职责：
 * - 渲染树形面板布局
 * - react-dnd 拖拽交互
 * - 面板边缘放置指示器
 * - 面板合并/拆分/最大化
 * - 面板标签页 Header
 * 
 * 对应规格：Functional-Spec §面板操作链路 / §面板合并链路 / §面板拆分链路
 * 
 * @file components/collaboration/DraggablePanelLayout.tsx
 */

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import {
  GripVertical,
  Maximize2,
  Minimize2,
  X,
  SplitSquareVertical,
  SplitSquareHorizontal,
  MoreHorizontal,
  Plus,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'
import type {
  PanelLayoutNode,
  PanelLayoutState,
  PanelType,
  PanelDragItem,
  PanelDropResult,
  DropPosition,
  SplitDirection,
} from '../../types/collaboration'

// ==========================================
// DnD Item Type
// ==========================================

const PANEL_DND_TYPE = 'PANEL_TAB'

// ==========================================
// Types
// ==========================================

export interface DraggablePanelLayoutProps {
  layout: PanelLayoutState
  onSplit: (panelId: string, direction: SplitDirection, newPanelType?: PanelType) => void
  onMerge: (sourceId: string, targetId: string, position: DropPosition) => void
  onClose: (panelId: string) => void
  onMaximize: (panelId: string) => void
  onRestore: () => void
  onSetActive: (panelId: string | null) => void
  onDragOver: (targetId: string | null, position: DropPosition | null) => void
  renderPanel: (panelType: PanelType, panelId: string) => React.ReactNode
}

// ==========================================
// DropZone Indicator Component
// ==========================================

interface DropZoneIndicatorProps {
  position: DropPosition
  isActive: boolean
}

function DropZoneIndicator({ position, isActive }: DropZoneIndicatorProps) {
  const positionStyles: Record<DropPosition, string> = {
    left: 'left-0 top-0 w-1/4 h-full',
    right: 'right-0 top-0 w-1/4 h-full',
    top: 'left-0 top-0 w-full h-1/4',
    bottom: 'left-0 bottom-0 w-full h-1/4',
    center: 'left-1/4 top-1/4 w-1/2 h-1/2',
    tab: 'left-0 top-0 w-full h-8',
  }

  return (
    <div
      className={cn(
        'absolute z-40 pointer-events-none transition-all duration-150 rounded-md',
        positionStyles[position],
        isActive
          ? 'bg-emerald-500/20 border-2 border-emerald-500/60 border-dashed'
          : 'bg-transparent border-transparent'
      )}
    />
  )
}

// ==========================================
// Panel Header (Draggable Tab)
// ==========================================

interface PanelHeaderProps {
  panelId: string
  panelType: PanelType
  title: string
  isActive: boolean
  closable: boolean
  isMaximized: boolean
  onActivate: () => void
  onClose: () => void
  onMaximize: () => void
  onSplitH: () => void
  onSplitV: () => void
}

function PanelHeader({
  panelId,
  panelType,
  title,
  isActive,
  closable,
  isMaximized,
  onActivate,
  onClose,
  onMaximize,
  onSplitH,
  onSplitV,
}: PanelHeaderProps) {
  const [showMenu, setShowMenu] = useState(false)

  const [{ isDragging }, dragRef] = useDrag<PanelDragItem, PanelDropResult, { isDragging: boolean }>({
    type: PANEL_DND_TYPE,
    item: { type: 'panel', panelId, panelType },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  return (
    <div
      ref={dragRef as any}
      onClick={onActivate}
      className={cn(
        'flex items-center gap-1 px-2 py-1 border-b cursor-grab active:cursor-grabbing select-none transition-all',
        isActive
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-white/[0.06] bg-black/20',
        isDragging && 'opacity-50'
      )}
    >
      <GripVertical className="w-3 h-3 text-slate-700 flex-none" />
      <span className={cn(
        'flex-1 text-[10px] font-mono truncate',
        isActive ? 'text-emerald-400' : 'text-slate-500'
      )}>
        {title}
      </span>

      <div className="flex items-center gap-0.5 flex-none">
        {/* Split Menu */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            className="p-0.5 rounded hover:bg-white/5 text-slate-600 hover:text-slate-400 transition-colors"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="absolute right-0 top-full mt-0.5 z-50 bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl py-0.5 min-w-[140px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { onSplitH(); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-2.5 py-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                >
                  <SplitSquareHorizontal className="w-3 h-3" />
                  水平拆分
                </button>
                <button
                  onClick={() => { onSplitV(); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-2.5 py-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                >
                  <SplitSquareVertical className="w-3 h-3" />
                  垂直拆分
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onMaximize() }}
          className="p-0.5 rounded hover:bg-white/5 text-slate-600 hover:text-slate-400 transition-colors"
        >
          {isMaximized
            ? <Minimize2 className="w-3 h-3" />
            : <Maximize2 className="w-3 h-3" />
          }
        </button>

        {closable && (
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="p-0.5 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

// ==========================================
// Panel Container (Drop Target)
// ==========================================

interface PanelContainerProps {
  node: PanelLayoutNode
  layoutState: PanelLayoutState
  onSplit: (panelId: string, direction: SplitDirection, newPanelType?: PanelType) => void
  onMerge: (sourceId: string, targetId: string, position: DropPosition) => void
  onClose: (panelId: string) => void
  onMaximize: (panelId: string) => void
  onRestore: () => void
  onSetActive: (panelId: string | null) => void
  onDragOver: (targetId: string | null, position: DropPosition | null) => void
  renderPanel: (panelType: PanelType, panelId: string) => React.ReactNode
}

function PanelContainer({
  node,
  layoutState,
  onSplit,
  onMerge,
  onClose,
  onMaximize,
  onRestore,
  onSetActive,
  onDragOver,
  renderPanel,
}: PanelContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredZone, setHoveredZone] = useState<DropPosition | null>(null)

  const [{ isOver, canDrop }, dropRef] = useDrop<PanelDragItem, PanelDropResult, { isOver: boolean; canDrop: boolean }>({
    accept: PANEL_DND_TYPE,
    canDrop: (item) => item.panelId !== node.id,
    hover: (item, monitor) => {
      if (!containerRef.current || item.panelId === node.id) return
      const rect = containerRef.current.getBoundingClientRect()
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) return

      const x = (clientOffset.x - rect.left) / rect.width
      const y = (clientOffset.y - rect.top) / rect.height

      let zone: DropPosition = 'center'
      if (x < 0.25) zone = 'left'
      else if (x > 0.75) zone = 'right'
      else if (y < 0.25) zone = 'top'
      else if (y > 0.75) zone = 'bottom'

      setHoveredZone(zone)
      onDragOver(node.id, zone)
    },
    drop: (item, monitor) => {
      if (monitor.didDrop()) return undefined
      if (hoveredZone && item.panelId !== node.id) {
        onMerge(item.panelId, node.id, hoveredZone)
      }
      setHoveredZone(null)
      onDragOver(null, null)
      return { targetId: node.id, position: hoveredZone || 'center' }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  })

  // Combine refs
  const setRefs = useCallback((el: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    dropRef(el)
  }, [dropRef])

  const isActive = layoutState.activePanel === node.id
  const isMaximized = layoutState.maximizedPanel === node.id

  if (node.type === 'split' && node.children) {
    return (
      <div
        className={cn(
          'flex overflow-hidden',
          node.direction === 'horizontal' ? 'flex-row' : 'flex-col'
        )}
        style={{ flex: `${node.ratio || 100} 1 0%` }}
      >
        {node.children.map((child, idx) => (
          <React.Fragment key={child.id}>
            {idx > 0 && (
              <div
                className={cn(
                  'flex-none bg-slate-800/50 hover:bg-emerald-500/20 transition-colors',
                  node.direction === 'horizontal'
                    ? 'w-[3px] cursor-col-resize'
                    : 'h-[3px] cursor-row-resize'
                )}
              />
            )}
            <PanelContainer
              node={child}
              layoutState={layoutState}
              onSplit={onSplit}
              onMerge={onMerge}
              onClose={onClose}
              onMaximize={onMaximize}
              onRestore={onRestore}
              onSetActive={onSetActive}
              onDragOver={onDragOver}
              renderPanel={renderPanel}
            />
          </React.Fragment>
        ))}
      </div>
    )
  }

  // Leaf panel node
  return (
    <div
      ref={setRefs}
      className={cn(
        'flex flex-col overflow-hidden relative border-r border-b border-white/[0.04]',
        isOver && canDrop && 'ring-1 ring-emerald-500/40',
      )}
      style={{ flex: `${node.ratio || 100} 1 0%`, minWidth: node.minSize || 120, minHeight: node.minSize || 80 }}
    >
      {/* Panel Header */}
      <PanelHeader
        panelId={node.id}
        panelType={node.panelType || 'code-editor'}
        title={node.title || '面板'}
        isActive={isActive}
        closable={node.closable !== false}
        isMaximized={isMaximized}
        onActivate={() => onSetActive(node.id)}
        onClose={() => onClose(node.id)}
        onMaximize={() => isMaximized ? onRestore() : onMaximize(node.id)}
        onSplitH={() => onSplit(node.id, 'horizontal')}
        onSplitV={() => onSplit(node.id, 'vertical')}
      />

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {node.panelType && renderPanel(node.panelType, node.id)}
      </div>

      {/* Drop Zone Indicators */}
      {isOver && canDrop && (
        <>
          <DropZoneIndicator position="left" isActive={hoveredZone === 'left'} />
          <DropZoneIndicator position="right" isActive={hoveredZone === 'right'} />
          <DropZoneIndicator position="top" isActive={hoveredZone === 'top'} />
          <DropZoneIndicator position="bottom" isActive={hoveredZone === 'bottom'} />
          <DropZoneIndicator position="center" isActive={hoveredZone === 'center'} />
        </>
      )}
    </div>
  )
}

// ==========================================
// Main Component
// ==========================================

export function DraggablePanelLayout({
  layout,
  onSplit,
  onMerge,
  onClose,
  onMaximize,
  onRestore,
  onSetActive,
  onDragOver,
  renderPanel,
}: DraggablePanelLayoutProps) {
  // 最大化面板时只显示该面板
  const maximizedNode = useMemo(() => {
    if (!layout.maximizedPanel) return null
    const findLeaf = (node: PanelLayoutNode): PanelLayoutNode | null => {
      if (node.id === layout.maximizedPanel) return node
      if (node.children) {
        for (const child of node.children) {
          const found = findLeaf(child)
          if (found) return found
        }
      }
      return null
    }
    return findLeaf(layout.root)
  }, [layout.root, layout.maximizedPanel])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {maximizedNode ? (
            <motion.div
              key="maximized"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <PanelContainer
                node={{ ...maximizedNode, ratio: 100 }}
                layoutState={layout}
                onSplit={onSplit}
                onMerge={onMerge}
                onClose={onClose}
                onMaximize={onMaximize}
                onRestore={onRestore}
                onSetActive={onSetActive}
                onDragOver={onDragOver}
                renderPanel={renderPanel}
              />
            </motion.div>
          ) : (
            <motion.div
              key="normal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex overflow-hidden"
            >
              <PanelContainer
                node={layout.root}
                layoutState={layout}
                onSplit={onSplit}
                onMerge={onMerge}
                onClose={onClose}
                onMaximize={onMaximize}
                onRestore={onRestore}
                onSetActive={onSetActive}
                onDragOver={onDragOver}
                renderPanel={renderPanel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  )
}
