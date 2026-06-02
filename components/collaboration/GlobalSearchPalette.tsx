/**
 * file: GlobalSearchPalette.tsx
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
 * GlobalSearchPalette - 全局文件搜索命令面板
 * 
 * 职责：
 * - Cmd+Shift+P / Ctrl+Shift+P 快捷键触发
 * - 文件名搜索 + 文件内容搜索（grep）
 * - 搜索结果预览（文件路径 + 匹配行 + 高亮）
 * - 点击结果打开对应文件标签页
 * 
 * Step 11c: 全局文件搜索
 * 
 * @file components/collaboration/GlobalSearchPalette.tsx
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  FileCode,
  FileText,
  X,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Hash,
  Folder,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'
import type { VirtualFile } from '../../hooks/useVirtualFileSystem'

// ==========================================
// Types
// ==========================================

export interface SearchResult {
  id: string
  type: 'file' | 'content'
  filePath: string
  fileName: string
  language: string
  /** 匹配行号（内容搜索） */
  lineNumber?: number
  /** 匹配行内容（内容搜索） */
  lineContent?: string
  /** 匹配关键词高亮偏移 */
  matchStart?: number
  matchEnd?: number
}

export interface GlobalSearchPaletteProps {
  visible: boolean
  onClose: () => void
  /** VFS 文件列表 */
  files: VirtualFile[]
  /** 选中结果回调（打开文件） */
  onSelect: (filePath: string, fileName: string, content: string, language: string, line?: number) => void
}

// ==========================================
// Helpers
// ==========================================

function getFileIcon(language: string) {
  if (language.includes('typescript') || language.includes('javascript')) return FileCode
  return FileText
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-emerald-400 bg-emerald-500/10 px-0.5 rounded">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

// ==========================================
// Component
// ==========================================

export function GlobalSearchPalette({
  visible,
  onClose,
  files,
  onSelect,
}: GlobalSearchPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchMode, setSearchMode] = useState<'file' | 'content'>('file')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 重置状态
  useEffect(() => {
    if (visible) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [visible])

  // 搜索结果
  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) {
      // 无查询 → 显示所有文件
      return files.slice(0, 20).map(f => ({
        id: f.path,
        type: 'file' as const,
        filePath: f.path,
        fileName: f.path.split('/').pop() || f.path,
        language: f.language,
      }))
    }

    const q = query.trim().toLowerCase()
    const results: SearchResult[] = []

    if (searchMode === 'file' || q.length < 3) {
      // 文件名搜索
      files.forEach(f => {
        const name = f.path.split('/').pop() || f.path
        if (name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)) {
          results.push({
            id: f.path,
            type: 'file',
            filePath: f.path,
            fileName: name,
            language: f.language,
          })
        }
      })
    }

    if (searchMode === 'content' && q.length >= 2) {
      // 文件内容搜索
      files.forEach(f => {
        const lines = f.content.split('\n')
        lines.forEach((line, idx) => {
          const matchIdx = line.toLowerCase().indexOf(q)
          if (matchIdx !== -1) {
            results.push({
              id: `${f.path}:${idx + 1}`,
              type: 'content',
              filePath: f.path,
              fileName: f.path.split('/').pop() || f.path,
              language: f.language,
              lineNumber: idx + 1,
              lineContent: line.trim(),
              matchStart: matchIdx,
              matchEnd: matchIdx + q.length,
            })
          }
        })
      })
    }

    return results.slice(0, 50)
  }, [query, files, searchMode])

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = results[selectedIndex]
      if (selected) {
        const file = files.find(f => f.path === selected.filePath)
        if (file) {
          onSelect(selected.filePath, selected.fileName, file.content, file.language, selected.lineNumber)
          onClose()
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      setSearchMode(prev => prev === 'file' ? 'content' : 'file')
      setSelectedIndex(0)
    }
  }, [results, selectedIndex, files, onSelect, onClose])

  // 自动滚动选中项
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="w-[560px] max-w-[90vw] bg-slate-950/98 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-white/[0.06]">
            <Search className="w-4 h-4 text-slate-500 flex-none mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
              onKeyDown={handleKeyDown}
              placeholder={searchMode === 'file' ? '搜索文件名...' : '搜索文件内容...'}
              spellCheck={false}
              autoComplete="off"
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 font-mono outline-none"
            />
            {/* 模式切换 */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => { setSearchMode('file'); setSelectedIndex(0) }}
                className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-mono border transition-all",
                  searchMode === 'file'
                    ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
                    : "text-slate-600 border-white/[0.04] hover:text-slate-400"
                )}
              >
                文件名
              </button>
              <button
                onClick={() => { setSearchMode('content'); setSelectedIndex(0) }}
                className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-mono border transition-all",
                  searchMode === 'content'
                    ? "text-violet-400 bg-violet-500/10 border-violet-500/20"
                    : "text-slate-600 border-white/[0.04] hover:text-slate-400"
                )}
              >
                内容
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/5 text-slate-600 hover:text-slate-400 transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-[350px] overflow-y-auto"
          >
            {results.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-600 text-xs font-mono">
                {query ? '未找到匹配结果' : '无文件'}
              </div>
            ) : (
              results.map((result, idx) => {
                const Icon = getFileIcon(result.language)
                return (
                  <button
                    key={result.id}
                    onClick={() => {
                      const file = files.find(f => f.path === result.filePath)
                      if (file) {
                        onSelect(result.filePath, result.fileName, file.content, file.language, result.lineNumber)
                        onClose()
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-left transition-all",
                      idx === selectedIndex
                        ? "bg-white/[0.06]"
                        : "hover:bg-white/[0.03]"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "flex-none w-5 h-5 rounded flex items-center justify-center",
                      result.type === 'content' ? "bg-violet-500/10" : "bg-cyan-500/10"
                    )}>
                      {result.type === 'content'
                        ? <Hash className="w-3 h-3 text-violet-400" />
                        : <Icon className="w-3 h-3 text-cyan-400" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {result.type === 'file' ? (
                        <>
                          <div className="text-[11px] text-slate-200 font-mono truncate">
                            {highlightMatch(result.fileName, query)}
                          </div>
                          <div className="text-[9px] text-slate-600 font-mono truncate">
                            {result.filePath}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-300 font-mono truncate">
                              {result.fileName}
                            </span>
                            <span className="text-[9px] text-violet-400 font-mono flex-none">
                              :{result.lineNumber}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {result.lineContent && highlightMatch(result.lineContent, query)}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Language badge */}
                    <span className="flex-none text-[8px] font-mono text-slate-700">
                      {result.language}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04] text-[9px] font-mono text-slate-700">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ArrowUp className="w-2.5 h-2.5" /><ArrowDown className="w-2.5 h-2.5" /> 导航
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-2.5 h-2.5" /> 打开
              </span>
              <span>Tab 切换模式</span>
              <span>Esc 关闭</span>
            </div>
            <span>{results.length} 结果</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
