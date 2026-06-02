/**
 * file: DiffViewer.tsx
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
 * DiffViewer - Git 风格差异对比组件
 * 
 * 职责：
 * - 显示 originalContent vs currentContent 的 diff
 * - 支持并排（side-by-side）和内联（inline）两种模式
 * - 行级增删高亮
 * - 统计变更行数
 * - 支持 Monaco Diff Editor 集成
 * 
 * Step 9c: Git 风格 diff viewer
 * 
 * @file components/collaboration/DiffViewer.tsx
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  GitCompare,
  X,
  Columns,
  AlignLeft,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Copy,
  Undo2,
  Check,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'

// ==========================================
// Types
// ==========================================

export interface DiffViewerProps {
  /** 原始内容 */
  originalContent: string
  /** 当前内容 */
  currentContent: string
  /** 文件名 */
  fileName: string
  /** 语言 */
  language?: string
  /** 关闭回调 */
  onClose: () => void
  /** 恢复到原始内容 */
  onRevert?: () => void
  /** 可见性 */
  visible: boolean
}

type DiffMode = 'side-by-side' | 'inline'

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'modified'
  originalLine?: number
  currentLine?: number
  originalText?: string
  currentText?: string
  text?: string
}

interface DiffSeparatorLine {
  type: 'separator'
  count: number
}

type DiffDisplayLine = DiffLine | DiffSeparatorLine

interface DiffPair {
  left?: DiffLine
  right?: DiffLine
}

interface DiffSeparatorPair {
  separator: true
  count: number
}

type DiffDisplayPair = DiffPair | DiffSeparatorPair

interface DiffStats {
  additions: number
  deletions: number
  unchanged: number
  totalChanges: number
}

// ==========================================
// Diff Algorithm (Myers-like simplified)
// ==========================================

function computeDiff(original: string, current: string): DiffLine[] {
  const origLines = original.split('\n')
  const currLines = current.split('\n')
  const result: DiffLine[] = []

  // Simple LCS-based diff
  const lcs = computeLCS(origLines, currLines)
  
  let oi = 0, ci = 0, li = 0
  let origLineNum = 0, currLineNum = 0

  while (oi < origLines.length || ci < currLines.length) {
    if (li < lcs.length && oi < origLines.length && ci < currLines.length && 
        origLines[oi] === lcs[li] && currLines[ci] === lcs[li]) {
      // Unchanged line
      origLineNum++
      currLineNum++
      result.push({
        type: 'unchanged',
        originalLine: origLineNum,
        currentLine: currLineNum,
        text: origLines[oi],
      })
      oi++
      ci++
      li++
    } else if (oi < origLines.length && (li >= lcs.length || origLines[oi] !== lcs[li])) {
      // Removed line
      origLineNum++
      result.push({
        type: 'removed',
        originalLine: origLineNum,
        originalText: origLines[oi],
      })
      oi++
    } else if (ci < currLines.length && (li >= lcs.length || currLines[ci] !== lcs[li])) {
      // Added line
      currLineNum++
      result.push({
        type: 'added',
        currentLine: currLineNum,
        currentText: currLines[ci],
      })
      ci++
    } else {
      // Safety: advance both
      if (oi < origLines.length) {
        origLineNum++
        result.push({
          type: 'removed',
          originalLine: origLineNum,
          originalText: origLines[oi],
        })
        oi++
      }
      if (ci < currLines.length) {
        currLineNum++
        result.push({
          type: 'added',
          currentLine: currLineNum,
          currentText: currLines[ci],
        })
        ci++
      }
    }
  }

  return result
}

function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length, n = b.length
  // Optimize: limit to prevent huge allocations
  if (m > 5000 || n > 5000) {
    // Fallback: simple line matching for very large files
    return a.filter(line => b.includes(line))
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  const result: string[] = []
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1])
      i--; j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  return result
}

function computeStats(lines: DiffLine[]): DiffStats {
  let additions = 0, deletions = 0, unchanged = 0
  lines.forEach(l => {
    if (l.type === 'added') additions++
    else if (l.type === 'removed') deletions++
    else if (l.type === 'unchanged') unchanged++
  })
  return { additions, deletions, unchanged, totalChanges: additions + deletions }
}

// ==========================================
// Component
// ==========================================

export function DiffViewer({
  originalContent,
  currentContent,
  fileName,
  language = 'typescript',
  onClose,
  onRevert,
  visible,
}: DiffViewerProps) {
  const [mode, setMode] = useState<DiffMode>('inline')
  const [showUnchanged, setShowUnchanged] = useState(true)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const diffLines = useMemo(() => computeDiff(originalContent, currentContent), [originalContent, currentContent])
  const stats = useMemo(() => computeStats(diffLines), [diffLines])

  const isIdentical = originalContent === currentContent

  const handleCopyDiff = useCallback(() => {
    const diffText = diffLines.map(l => {
      if (l.type === 'added') return `+ ${l.currentText || ''}`
      if (l.type === 'removed') return `- ${l.originalText || ''}`
      return `  ${l.text || ''}`
    }).join('\n')
    navigator.clipboard.writeText(diffText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [diffLines])

  // 过滤显示行（可选隐藏未变更行，保留变更周围上下文）
  const displayLines = useMemo(() => {
    if (showUnchanged) return diffLines
    const result: (DiffLine | { type: 'separator'; count: number })[] = []
    let hiddenCount = 0

    diffLines.forEach((line, i) => {
      if (line.type === 'unchanged') {
        // 保留变更前后 3 行上下文
        const nearChange = diffLines.slice(Math.max(0, i - 3), Math.min(diffLines.length, i + 4))
          .some(l => l.type !== 'unchanged')
        if (nearChange) {
          if (hiddenCount > 0) {
            result.push({ type: 'separator', count: hiddenCount })
            hiddenCount = 0
          }
          result.push(line)
        } else {
          hiddenCount++
        }
      } else {
        if (hiddenCount > 0) {
          result.push({ type: 'separator', count: hiddenCount })
          hiddenCount = 0
        }
        result.push(line)
      }
    })

    if (hiddenCount > 0) {
      result.push({ type: 'separator', count: hiddenCount })
    }

    return result
  }, [diffLines, showUnchanged])

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-50 flex flex-col bg-slate-950/98 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-500/10 rounded-lg">
            <GitCompare className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
              <span>变更对比</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">{fileName}</span>
            </div>
            {!isIdentical && (
              <div className="flex items-center gap-2 text-[9px] font-mono mt-0.5">
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <Plus className="w-2.5 h-2.5" />
                  {stats.additions}
                </span>
                <span className="text-red-400 flex items-center gap-0.5">
                  <Minus className="w-2.5 h-2.5" />
                  {stats.deletions}
                </span>
                <span className="text-slate-600">
                  {stats.unchanged} 行未变
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 视图切换 */}
          <div className="flex items-center bg-black/30 rounded-lg border border-white/[0.06] p-0.5">
            <button
              onClick={() => setMode('inline')}
              className={cn(
                "p-1 rounded text-[10px] font-mono transition-all",
                mode === 'inline' ? "bg-amber-500/20 text-amber-400" : "text-slate-500 hover:text-slate-300"
              )}
              title="内联视图"
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => setMode('side-by-side')}
              className={cn(
                "p-1 rounded text-[10px] font-mono transition-all",
                mode === 'side-by-side' ? "bg-amber-500/20 text-amber-400" : "text-slate-500 hover:text-slate-300"
              )}
              title="并排视图"
            >
              <Columns className="w-3 h-3" />
            </button>
          </div>

          {/* 显示/隐藏未变更 */}
          <button
            onClick={() => setShowUnchanged(!showUnchanged)}
            className={cn(
              "px-2 py-1 rounded-md text-[10px] font-mono border transition-all",
              showUnchanged
                ? "text-slate-500 border-white/[0.06] hover:bg-white/5"
                : "text-amber-400 bg-amber-500/10 border-amber-500/20"
            )}
          >
            {showUnchanged ? '隐藏未变更' : '显示全部'}
          </button>

          {/* 复制 diff */}
          <button
            onClick={handleCopyDiff}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            title="复制差异"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* 恢复 */}
          {onRevert && !isIdentical && (
            <button
              onClick={onRevert}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
              title="恢复到原始内容"
            >
              <Undo2 className="w-3 h-3" />
              恢复
            </button>
          )}

          {/* 关闭 */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div ref={scrollRef} className="flex-1 overflow-auto font-mono text-[11px]">
        {isIdentical ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm text-slate-300">文件未修改</div>
              <div className="text-[10px] text-slate-600 mt-1">当前内容与原始内容完全一致</div>
            </div>
          </div>
        ) : mode === 'inline' ? (
          <InlineDiffView lines={displayLines} />
        ) : (
          <SideBySideDiffView lines={diffLines} showUnchanged={showUnchanged} />
        )}
      </div>

      {/* Footer Stats */}
      {!isIdentical && (
        <div className="flex-none flex items-center justify-between px-4 py-1.5 border-t border-white/[0.04] bg-black/30 text-[9px] font-mono text-slate-600">
          <span>{stats.totalChanges} 处变更</span>
          <span>{language} | {originalContent.split('\n').length} → {currentContent.split('\n').length} 行</span>
        </div>
      )}
    </motion.div>
  )
}

// ==========================================
// Inline Diff View
// ==========================================

function InlineDiffView({ lines }: { lines: DiffDisplayLine[] }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {lines.map((line, idx: number) => {
          if (line.type === 'separator') {
            return (
              <tr key={`sep-${idx}`}>
                <td colSpan={3} className="py-1 px-4 text-center text-[9px] text-slate-700 bg-slate-900/30 border-y border-white/[0.03]">
                  <div className="flex items-center justify-center gap-2">
                    <ChevronDown className="w-2.5 h-2.5" />
                    <span>{line.count} 行未变更</span>
                    <ChevronDown className="w-2.5 h-2.5" />
                  </div>
                </td>
              </tr>
            )
          }

          const bgClass =
            line.type === 'added' ? 'bg-emerald-500/[0.06]' :
            line.type === 'removed' ? 'bg-red-500/[0.06]' : ''
          const textClass =
            line.type === 'added' ? 'text-emerald-400' :
            line.type === 'removed' ? 'text-red-400' : 'text-slate-400'
          const prefix =
            line.type === 'added' ? '+' :
            line.type === 'removed' ? '-' : ' '
          const lineNum = line.originalLine || line.currentLine || ''
          const text = line.text ?? line.originalText ?? line.currentText ?? ''

          return (
            <tr key={idx} className={cn('group', bgClass)}>
              <td className="w-[48px] text-right pr-2 text-[9px] text-slate-700 select-none align-top py-[1px] border-r border-white/[0.03]">
                {line.originalLine || ''}
              </td>
              <td className="w-[48px] text-right pr-2 text-[9px] text-slate-700 select-none align-top py-[1px] border-r border-white/[0.03]">
                {line.currentLine || ''}
              </td>
              <td className={cn('pl-2 pr-4 whitespace-pre py-[1px]', textClass)}>
                <span className="select-none text-slate-700 mr-2">{prefix}</span>
                {text}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ==========================================
// Side-by-Side Diff View
// ==========================================

function SideBySideDiffView({ lines, showUnchanged }: { lines: DiffLine[]; showUnchanged: boolean }) {
  // 将 diff 行分为左右两列
  const pairs = useMemo(() => {
    const result: DiffPair[] = []
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (line.type === 'unchanged') {
        result.push({ left: line, right: line })
        i++
      } else if (line.type === 'removed') {
        // Check if next is added (modification pair)
        if (i + 1 < lines.length && lines[i + 1].type === 'added') {
          result.push({ left: lines[i], right: lines[i + 1] })
          i += 2
        } else {
          result.push({ left: lines[i], right: undefined })
          i++
        }
      } else if (line.type === 'added') {
        result.push({ left: undefined, right: lines[i] })
        i++
      } else {
        i++
      }
    }
    return result
  }, [lines])

  // 过滤未变更行
  const displayPairs = useMemo(() => {
    if (showUnchanged) return pairs as DiffDisplayPair[]
    const result: Array<{ left?: DiffLine; right?: DiffLine } | { separator: true; count: number }> = []
    let hiddenCount = 0

    pairs.forEach((pair, i) => {
      const isChange = (pair.left && pair.left.type !== 'unchanged') || 
                       (pair.right && pair.right.type !== 'unchanged') ||
                       !pair.left || !pair.right

      if (!isChange && pair.left?.type === 'unchanged') {
        const nearChange = pairs.slice(Math.max(0, i - 3), Math.min(pairs.length, i + 4))
          .some(p => (p.left && p.left.type !== 'unchanged') || (p.right && p.right.type !== 'unchanged') || !p.left || !p.right)
        if (nearChange) {
          if (hiddenCount > 0) { result.push({ separator: true, count: hiddenCount }); hiddenCount = 0 }
          result.push(pair)
        } else {
          hiddenCount++
        }
      } else {
        if (hiddenCount > 0) { result.push({ separator: true, count: hiddenCount }); hiddenCount = 0 }
        result.push(pair)
      }
    })
    if (hiddenCount > 0) result.push({ separator: true, count: hiddenCount })
    return result
  }, [pairs, showUnchanged])

  return (
    <div className="flex w-full">
      {/* Left (Original) */}
      <div className="w-1/2 border-r border-white/[0.06]">
        <div className="sticky top-0 z-10 px-3 py-1 bg-red-500/[0.06] border-b border-white/[0.04] text-[9px] font-mono text-red-400 uppercase tracking-widest">
          原始
        </div>
        <table className="w-full border-collapse">
          <tbody>
            {displayPairs.map((pair, idx: number) => {
              if ('separator' in pair) {
                return (
                  <tr key={`sep-l-${idx}`}>
                    <td colSpan={2} className="py-0.5 text-center text-[9px] text-slate-700 bg-slate-900/30">
                      ··· {pair.count} 行 ···
                    </td>
                  </tr>
                )
              }
              const left = (pair as DiffPair).left
              const bgClass = left?.type === 'removed' ? 'bg-red-500/[0.06]' : ''
              return (
                <tr key={`l-${idx}`} className={bgClass}>
                  <td className="w-[40px] text-right pr-1.5 text-[9px] text-slate-700 select-none py-[1px] border-r border-white/[0.03]">
                    {left?.originalLine || ''}
                  </td>
                  <td className={cn(
                    'pl-2 pr-2 whitespace-pre py-[1px]',
                    left?.type === 'removed' ? 'text-red-400' : 'text-slate-400'
                  )}>
                    {left?.text ?? left?.originalText ?? ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Right (Current) */}
      <div className="w-1/2">
        <div className="sticky top-0 z-10 px-3 py-1 bg-emerald-500/[0.06] border-b border-white/[0.04] text-[9px] font-mono text-emerald-400 uppercase tracking-widest">
          当前
        </div>
        <table className="w-full border-collapse">
          <tbody>
            {displayPairs.map((pair, idx: number) => {
              if ('separator' in pair) {
                return (
                  <tr key={`sep-r-${idx}`}>
                    <td colSpan={2} className="py-0.5 text-center text-[9px] text-slate-700 bg-slate-900/30">
                      ··· {pair.count} 行 ···
                    </td>
                  </tr>
                )
              }
              const right = (pair as DiffPair).right
              const bgClass = right?.type === 'added' ? 'bg-emerald-500/[0.06]' : ''
              return (
                <tr key={`r-${idx}`} className={bgClass}>
                  <td className="w-[40px] text-right pr-1.5 text-[9px] text-slate-700 select-none py-[1px] border-r border-white/[0.03]">
                    {right?.currentLine || right?.originalLine || ''}
                  </td>
                  <td className={cn(
                    'pl-2 pr-2 whitespace-pre py-[1px]',
                    right?.type === 'added' ? 'text-emerald-400' : 'text-slate-400'
                  )}>
                    {right?.text ?? right?.currentText ?? ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
