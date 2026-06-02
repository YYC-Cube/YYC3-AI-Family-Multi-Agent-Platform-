/**
 * file: LivePreview.tsx
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

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Maximize2, Minimize2, Smartphone, Monitor, Tablet, AlertCircle } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LivePreview - 实时预览面板
 * 
 * 职责：
 * - 实时渲染代码预览
 * - 响应式视口切换（Desktop/Tablet/Mobile）
 * - 错误边界处理
 * - 刷新控制
 */

interface LivePreviewProps {
  code: string;
  fileName: string;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const LivePreview: React.FC<LivePreviewProps> = ({ code, fileName }) => {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 视口尺寸配置
  const viewportSizes = {
    desktop: { width: '100%', height: '100%', label: 'Desktop' },
    tablet: { width: '768px', height: '1024px', label: 'Tablet' },
    mobile: { width: '375px', height: '667px', label: 'Mobile' },
  };

  // 刷新预览
  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1);
    setError(null);
  };

  // 渲染预览内容
  useEffect(() => {
    if (!iframeRef.current) return;

    try {
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) return;

      // 基础 HTML 模板
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview - ${fileName}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: #0f172a;
                color: #f1f5f9;
                padding: 1rem;
                min-height: 100vh;
              }
              .preview-container {
                max-width: 1200px;
                margin: 0 auto;
              }
              .error-boundary {
                background: #7f1d1d;
                border: 1px solid #991b1b;
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
                color: #fecaca;
              }
            </style>
          </head>
          <body>
            <div class="preview-container">
              <div id="preview-root"></div>
            </div>
            <script type="module">
              try {
                ${code}
              } catch (err) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-boundary';
                errorDiv.innerHTML = '<h3>运行时错误</h3><pre>' + err.message + '</pre>';
                document.getElementById('preview-root').appendChild(errorDiv);
              }
            </script>
          </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '预览渲染失败');
    }
  }, [code, fileName, previewKey]);

  const currentViewport = viewportSizes[viewportMode];

  return (
    <div className="h-full flex flex-col bg-slate-950/30">
      {/* Header */}
      <div className="flex-none px-4 py-2 border-b border-white/[0.04] flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">
          实时预览
        </h3>

        <div className="flex items-center gap-1">
          {/* Viewport Mode Selector */}
          <div className="flex items-center gap-0.5 bg-black/20 rounded-lg p-0.5 mr-2">
            <button
              onClick={() => setViewportMode('desktop')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewportMode === 'desktop'
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-slate-500 hover:text-slate-300"
              )}
              title="Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('tablet')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewportMode === 'tablet'
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-slate-500 hover:text-slate-300"
              )}
              title="Tablet"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewportMode === 'mobile'
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-slate-500 hover:text-slate-300"
              )}
              title="Mobile"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            title="刷新预览"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            title={isFullscreen ? "退出全屏" : "全屏预览"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className={cn(
          "w-full h-full flex items-center justify-center p-4",
          viewportMode !== 'desktop' && "bg-slate-900/50"
        )}>
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md w-full"
              >
                <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-none mt-0.5" />
                    <div>
                      <h4 className="text-sm font-mono text-red-400 mb-2">预览错误</h4>
                      <pre className="text-xs font-mono text-red-300/80 whitespace-pre-wrap break-all">
                        {error}
                      </pre>
                      <button
                        onClick={handleRefresh}
                        className="mt-3 px-3 py-1.5 rounded-lg text-xs font-mono bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
                      >
                        重新加载
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`preview-${previewKey}-${viewportMode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="shadow-2xl"
                style={{
                  width: currentViewport.width,
                  height: currentViewport.height,
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
              >
                <iframe
                  ref={iframeRef}
                  key={previewKey}
                  className="w-full h-full bg-slate-950 rounded-lg border border-white/[0.06]"
                  title="Live Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none px-4 py-1.5 border-t border-white/[0.04] text-[10px] font-mono text-slate-600 flex items-center justify-between">
        <span>{currentViewport.label} 视图</span>
        <span className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          实时更新
        </span>
      </div>
    </div>
  );
};
