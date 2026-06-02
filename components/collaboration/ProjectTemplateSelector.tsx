/**
 * file: ProjectTemplateSelector.tsx
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
 * ProjectTemplateSelector - 项目模板选择器组件
 * 
 * 职责：
 * - 展示可用项目模板卡片
 * - 模板预览（文件列表 + 描述）
 * - 一键初始化 VFS
 * - 动画过渡
 * 
 * Step 10c: 项目模板系统
 * 
 * @file components/collaboration/ProjectTemplateSelector.tsx
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  FolderOpen,
  FileCode,
  Check,
  ChevronRight,
  Sparkles,
  Package,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'
import { PROJECT_TEMPLATES, type ProjectTemplate } from '../../services/project-templates'

// ==========================================
// Types
// ==========================================

export interface ProjectTemplateSelectorProps {
  visible: boolean
  onClose: () => void
  /** 选择模板后回调（传递模板 ID） */
  onSelectTemplate: (template: ProjectTemplate) => void
}

// ==========================================
// Component
// ==========================================

export function ProjectTemplateSelector({
  visible,
  onClose,
  onSelectTemplate,
}: ProjectTemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const selectedTemplate = selectedId
    ? PROJECT_TEMPLATES.find(t => t.id === selectedId)
    : null

  const handleConfirm = useCallback(() => {
    if (!selectedTemplate) return
    setConfirmed(true)
    // 短暂延迟让动画完成
    setTimeout(() => {
      onSelectTemplate(selectedTemplate)
      setConfirmed(false)
      setSelectedId(null)
      onClose()
    }, 500)
  }, [selectedTemplate, onSelectTemplate, onClose])

  const handleClose = useCallback(() => {
    setSelectedId(null)
    setConfirmed(false)
    onClose()
  }, [onClose])

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-[700px] max-w-[90vw] max-h-[80vh] bg-slate-950/98 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-none flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-violet-500/10 rounded-lg">
                <Package className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <div className="text-sm text-slate-200 font-mono">新建项目</div>
                <div className="text-[10px] text-slate-600 font-mono">选择模板快速初始化项目</div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content: Templates Grid + Preview */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Left: Templates */}
            <div className="w-[55%] overflow-y-auto p-4 space-y-2 border-r border-white/[0.04]">
              {PROJECT_TEMPLATES.map((template) => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedId(template.id)}
                  className={cn(
                    'w-full flex items-start gap-3 px-3.5 py-3 rounded-xl text-left transition-all border',
                    selectedId === template.id
                      ? 'bg-white/[0.06] border-white/[0.12]'
                      : 'bg-black/10 border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.06]'
                  )}
                >
                  {/* Icon */}
                  <div
                    className="flex-none w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ background: `${template.color}15`, border: `1px solid ${template.color}30` }}
                  >
                    {template.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-200 font-mono">{template.name}</span>
                      {selectedId === template.id && (
                        <Check className="w-3 h-3 text-emerald-400 flex-none" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 line-clamp-2">
                      {template.description}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {template.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-[8px] font-mono rounded bg-white/[0.04] text-slate-500 border border-white/[0.04]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ChevronRight className={cn(
                    'w-3.5 h-3.5 text-slate-600 flex-none mt-1 transition-transform',
                    selectedId === template.id && 'text-slate-400 translate-x-0.5'
                  )} />
                </motion.button>
              ))}
            </div>

            {/* Right: Preview */}
            <div className="w-[45%] flex flex-col overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedTemplate ? (
                  <motion.div
                    key={selectedTemplate.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    {/* Preview Header */}
                    <div className="flex-none px-4 py-3 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                        <span className="text-lg">{selectedTemplate.icon}</span>
                        <span>{selectedTemplate.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono mt-1">
                        {Object.keys(selectedTemplate.files).length} 个文件 · 入口: {selectedTemplate.entryPoint}
                      </div>
                    </div>

                    {/* File List */}
                    <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
                      <div className="text-[9px] font-mono text-slate-700 uppercase tracking-widest mb-2">
                        文件结构
                      </div>
                      <div className="space-y-0.5">
                        {Object.entries(selectedTemplate.files).map(([path, file]) => {
                          const isEntry = path === selectedTemplate.entryPoint
                          return (
                            <div
                              key={path}
                              className={cn(
                                'flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-mono',
                                isEntry ? 'bg-emerald-500/[0.06] text-emerald-400' : 'text-slate-500'
                              )}
                            >
                              <FileCode className="w-3 h-3 flex-none" />
                              <span className="flex-1 truncate">{path}</span>
                              <span className="flex-none text-[8px] text-slate-700">{file.language}</span>
                              {isEntry && (
                                <span className="flex-none text-[8px] text-emerald-500 bg-emerald-500/10 px-1 rounded">
                                  入口
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Confirm Button */}
                    <div className="flex-none px-4 py-3 border-t border-white/[0.04]">
                      <button
                        onClick={handleConfirm}
                        disabled={confirmed}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-all',
                          confirmed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-white/[0.08] hover:border-white/[0.15] hover:shadow-lg hover:shadow-emerald-500/10'
                        )}
                      >
                        {confirmed ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            项目已创建
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            使用此模板创建项目
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <FolderOpen className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                      <div className="text-[11px] text-slate-600 font-mono">选择一个模板</div>
                      <div className="text-[9px] text-slate-700 font-mono mt-1">查看文件结构预览</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
