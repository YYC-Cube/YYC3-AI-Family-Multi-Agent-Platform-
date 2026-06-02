/**
 * file: SandboxPreview.tsx
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
 * SandboxPreview - iframe 沙箱实时预览组件
 * 
 * 职责：
 * - 将代码实时编译/渲染到隔离 iframe 中
 * - 支持 React JSX/TSX 代码转译预览
 * - 错误边界捕获与友好展示
 * - 自动刷新 (debounced) 与手动刷新
 * - 响应式视口切换 (Desktop / Tablet / Mobile)
 * - 完成 "设计→代码→预览" 闭环
 * 
 * 对应规格：Functional-Spec §实时预览 (iframe 沙箱)
 * 
 * @file components/collaboration/SandboxPreview.tsx
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Eye,
  Code2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'

// ==========================================
// Types
// ==========================================

export interface SandboxPreviewProps {
  /** 源代码（TypeScript/JSX） — 单文件模式 */
  code: string
  /** 文件语言 */
  language?: string
  /** 额外 CSS 注入 */
  customCSS?: string
  /** 自动刷新延迟 (ms)，0 表示禁用 */
  autoRefreshDelay?: number
  /** 类名 */
  className?: string
  /** 是否全屏 */
  isFullscreen?: boolean
  /** 切换全屏回调 */
  onToggleFullscreen?: () => void
  /** 多文件打包 HTML（优先于 code） — Step 7a */
  bundledHTML?: string
  /** 打包文件数量 */
  bundleFileCount?: number
  /** 打包错误 */
  bundleErrors?: Array<{ file: string; message: string }>
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile'

interface PreviewError {
  message: string
  line?: number
  column?: number
}

// ==========================================
// Constants
// ==========================================

const VIEWPORT_SIZES: Record<ViewportMode, { width: string; height: string; label: string }> = {
  desktop: { width: '100%', height: '100%', label: '桌面' },
  tablet: { width: '768px', height: '100%', label: '平板' },
  mobile: { width: '375px', height: '100%', label: '手机' },
}

const SCALE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5]

// ==========================================
// Code Transpiler (简化版)
// ==========================================

/**
 * 简化的 TSX → JS 转换
 * 实际生产中应使用 @babel/standalone 或 sucrase
 * 这里实现一个轻量级的 JSX 转译用于预览
 */
function transpileToPreviewHTML(code: string, customCSS?: string): string {
  // 提取导出的组件函数名
  const exportMatch = code.match(/export\s+(?:default\s+)?function\s+(\w+)/)
  const componentName = exportMatch?.[1] || 'App'
  
  // 简化转译：移除 TypeScript 类型注解
  const jsCode = code
    // 移除 import 语句（iframe 里直接用全局 React）
    .replace(/^import\s+.*$/gm, '')
    // 移除 interface/type 定义
    .replace(/^(export\s+)?(interface|type)\s+\w+[\s\S]*?^}/gm, '')
    // 移除类型注解 <T>
    .replace(/<[A-Z]\w+(?:\[\])?>/g, '')
    // 移除参数类型标注
    .replace(/:\s*(?:string|number|boolean|any|void|React\.\w+|[A-Z]\w+(?:\[\])?)\s*(?=[,)\]=;{])/g, '')
    // 移除 as const
    .replace(/\s+as\s+const/g, '')
    // 移除 export 关键字
    .replace(/^export\s+(?:default\s+)?/gm, '')
    .trim()

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YYC³ Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #020617;
      color: #e2e8f0;
      min-height: 100vh;
    }
    #root { min-height: 100vh; }
    .preview-error {
      padding: 24px;
      background: #1e1012;
      border: 1px solid #f8717150;
      border-radius: 12px;
      margin: 16px;
      color: #fca5a5;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      white-space: pre-wrap;
    }
    .preview-error-title {
      color: #ef4444;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    ${customCSS || ''}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
    const { useState, useEffect, useCallback, useMemo, useRef } = React;

    // 用户代码（已转译）
    try {
      ${jsCode}

      // 尝试渲染组件
      const rootEl = document.getElementById('root');
      const root = ReactDOM.createRoot(rootEl);
      root.render(React.createElement(${componentName}));
    } catch (err) {
      document.getElementById('root').innerHTML = 
        '<div class="preview-error">' +
        '<div class="preview-error-title">⚠ 渲染错误</div>' +
        err.message +
        '</div>';
      
      // 通知父窗口
      window.parent.postMessage({
        type: 'preview-error',
        error: { message: err.message }
      }, '*');
    }
  </script>
  <script>
    // 全局错误捕获
    window.onerror = function(msg, url, line, col, error) {
      document.getElementById('root').innerHTML = 
        '<div class="preview-error">' +
        '<div class="preview-error-title">⚠ 运行时错误</div>' +
        msg + (line ? ' (行 ' + line + ')' : '') +
        '</div>';
      window.parent.postMessage({
        type: 'preview-error',
        error: { message: String(msg), line: line, column: col }
      }, '*');
      return true;
    };

    // Babel 转译错误
    window.addEventListener('unhandledrejection', function(event) {
      document.getElementById('root').innerHTML = 
        '<div class="preview-error">' +
        '<div class="preview-error-title">⚠ 转译错误</div>' +
        event.reason +
        '</div>';
      window.parent.postMessage({
        type: 'preview-error',
        error: { message: String(event.reason) }
      }, '*');
    });

    // 加载完成通知
    window.addEventListener('load', function() {
      window.parent.postMessage({ type: 'preview-ready' }, '*');
    });
  </script>
</body>
</html>`
}

// ==========================================
// Component
// ==========================================

export function SandboxPreview({
  code,
  language = 'typescript',
  customCSS,
  autoRefreshDelay = 800,
  className,
  isFullscreen = false,
  onToggleFullscreen,
  bundledHTML,
  bundleFileCount,
  bundleErrors,
}: SandboxPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')
  const [scale, setScale] = useState(1)
  const [error, setError] = useState<PreviewError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)

  // 渲染预览
  const renderPreview = useCallback(() => {
    if (!iframeRef.current) return
    
    setIsLoading(true)
    setError(null)

    try {
      // Step 7a: 优先使用多文件打包 HTML
      const html = bundledHTML || transpileToPreviewHTML(code, customCSS)
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      iframeRef.current.src = url
      setLastRefresh(Date.now())
      setRefreshCount(prev => prev + 1)
      
      // 清理 blob URL
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (err: any) {
      setError({ message: err.message || '预览渲染失败' })
      setIsLoading(false)
    }
  }, [code, customCSS, bundledHTML])

  // 监听 iframe 消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'preview-error') {
        setError(event.data.error)
        setIsLoading(false)
      } else if (event.data?.type === 'preview-ready') {
        setIsLoading(false)
        setError(null)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // 自动刷新（debounced）
  useEffect(() => {
    if (!autoRefresh || autoRefreshDelay <= 0) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      renderPreview()
    }, autoRefreshDelay)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [code, autoRefresh, autoRefreshDelay, renderPreview])

  // 初始渲染
  useEffect(() => {
    renderPreview()
  }, [])

  // 手动刷新
  const handleRefresh = useCallback(() => {
    renderPreview()
  }, [renderPreview])

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 2))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.25))
  }, [])

  const handleResetZoom = useCallback(() => {
    setScale(1)
  }, [])

  // iframe 尺寸
  const viewportSize = VIEWPORT_SIZES[viewportMode]

  return (
    <div className={cn('flex flex-col h-full bg-slate-950/40 overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex-none flex items-center justify-between px-2 py-1.5 border-b border-white/[0.06] bg-slate-950/60">
        {/* Left: Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">预览</span>
          </div>
          
          {/* Status indicator */}
          {isLoading ? (
            <span className="flex items-center gap-1 text-[9px] font-mono text-amber-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              渲染中...
            </span>
          ) : error ? (
            <span className="flex items-center gap-1 text-[9px] font-mono text-red-400">
              <AlertTriangle className="w-3 h-3" />
              错误
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-500">
              <CheckCircle2 className="w-3 h-3" />
              就绪
            </span>
          )}
        </div>

        {/* Center: Viewport Switcher */}
        <div className="flex items-center gap-0.5">
          {([
            { mode: 'desktop' as const, icon: Monitor, label: '桌面' },
            { mode: 'tablet' as const, icon: Tablet, label: '平板' },
            { mode: 'mobile' as const, icon: Smartphone, label: '手机' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewportMode(mode)}
              className={cn(
                "p-1.5 rounded-md text-[10px] font-mono transition-all",
                viewportMode === mode
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
              title={label}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}

          <div className="w-px h-3 bg-white/[0.06] mx-1" />

          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            title="重置缩放"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            title="放大"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-mono border transition-all",
              autoRefresh
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "text-slate-500 border-white/[0.06] hover:bg-white/5"
            )}
            title={autoRefresh ? '关闭自动刷新' : '开启自动刷新'}
          >
            <RotateCcw className="w-2.5 h-2.5" />
            自动
          </button>
          
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-mono text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:bg-white/5 transition-all"
            title="手动刷新"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            刷新
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
              title={isFullscreen ? '退出全屏' : '全屏预览'}
            >
              {isFullscreen
                ? <Minimize2 className="w-3 h-3" />
                : <Maximize2 className="w-3 h-3" />
              }
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-none px-3 py-2 bg-red-950/30 border-b border-red-500/20 overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-none mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono text-red-400">渲染错误</span>
                <p className="text-[10px] font-mono text-red-300/80 mt-0.5 truncate">
                  {error.message}
                </p>
                {error.line && (
                  <span className="text-[9px] font-mono text-red-500/60">
                    行 {error.line}{error.column ? `, 列 ${error.column}` : ''}
                  </span>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                className="p-0.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"
              >
                <span className="text-[10px]">✕</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Area */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto bg-[#0a0f1e] p-2">
        <div
          className={cn(
            "relative transition-all duration-200 origin-center",
            viewportMode !== 'desktop' && "border border-white/10 rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
          )}
          style={{
            width: viewportSize.width,
            height: viewportSize.height,
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `scale(${scale})`,
          }}
        >
          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                  <span className="text-[10px] text-slate-500 font-mono">编译渲染中...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* iframe */}
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0 bg-white/[0.02]"
            sandbox="allow-scripts allow-same-origin"
            title="YYC³ Sandbox Preview"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>

      {/* Bottom Status */}
      <div className="flex-none flex items-center justify-between px-3 py-1 border-t border-white/[0.06] bg-black/20 text-[9px] font-mono text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye className="w-2.5 h-2.5" />
            {viewportSize.label} {viewportMode !== 'desktop' ? viewportSize.width : ''}
          </span>
          <span>缩放 {Math.round(scale * 100)}%</span>
          <span>刷新 #{refreshCount}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{autoRefresh ? `自动刷新 ${autoRefreshDelay}ms` : '手动刷新'}</span>
          <span>沙箱隔离</span>
        </div>
      </div>
    </div>
  )
}