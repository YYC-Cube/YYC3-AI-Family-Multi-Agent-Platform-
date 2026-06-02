/**
 * file: CodeEditor.tsx
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
import { Copy, Download, RotateCcw, Save, Sparkles } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { toast } from 'sonner';

/**
 * CodeEditor - 代码编辑器面板
 * 
 * 职责：
 * - 代码编辑（简化版，使用 textarea）
 * - 语法高亮（基础支持）
 * - 自动保存
 * - AI 辅助按钮
 * 
 * 注意：不使用 monaco-editor（太重），使用简化方案
 */

interface CodeEditorProps {
  fileName: string;
  initialCode: string;
  language?: 'typescript' | 'javascript' | 'tsx' | 'jsx';
  onChange: (code: string) => void;
  onAIAssist?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  fileName,
  initialCode,
  language = 'typescript',
  onChange,
  onAIAssist,
}) => {
  const [code, setCode] = useState(initialCode);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 计算行数
  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);

  // 检测未保存变更
  useEffect(() => {
    setHasUnsavedChanges(code !== initialCode);
  }, [code, initialCode]);

  // 自动保存（防抖）
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timer = setTimeout(() => {
      onChange(code);
      setHasUnsavedChanges(false);
      toast.success('代码已自动保存', { duration: 1500 });
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, hasUnsavedChanges, onChange]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('代码已复制到剪贴板');
    } catch (err) {
      toast.error('复制失败');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`已下载 ${fileName}`);
  };

  const handleReset = () => {
    if (confirm('确定要重置为初始代码吗？未保存的更改将丢失。')) {
      setCode(initialCode);
      toast.info('代码已重置');
    }
  };

  const handleSave = () => {
    onChange(code);
    setHasUnsavedChanges(false);
    toast.success('代码已手动保存');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab 键支持
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      
      // 恢复光标位置
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }

    // Ctrl/Cmd + S 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/30">
      {/* Header */}
      <div className="flex-none px-4 py-2 border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-mono text-slate-300">
            {fileName}
          </h3>
          {hasUnsavedChanges && (
            <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              未保存
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onAIAssist}
            className="px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/30 transition-all"
            title="AI 辅助"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">AI 助手</span>
          </button>

          <div className="w-px h-4 bg-white/5 mx-1" />

          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            title="复制代码"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            title="下载文件"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
            title="重置代码"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={cn(
              "p-1.5 rounded transition-colors",
              hasUnsavedChanges
                ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                : "text-slate-600 cursor-not-allowed"
            )}
            title="手动保存 (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        <div className="flex-none w-12 bg-black/20 border-r border-white/[0.04] overflow-hidden">
          <div className="py-3 px-2 text-right text-xs font-mono text-slate-600 leading-6">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1}>{i + 1}</div>
            ))}
          </div>
        </div>

        {/* Code Textarea */}
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-3 bg-transparent text-slate-200 font-mono text-xs leading-6 resize-none focus:outline-none"
            style={{
              minHeight: '100%',
              tabSize: 2,
            }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex-none px-4 py-1.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-slate-600">
        <div className="flex items-center gap-4">
          <span>{language.toUpperCase()}</span>
          <span>{lineCount} 行</span>
          <span>{code.length} 字符</span>
        </div>
        <div>
          {hasUnsavedChanges ? '编辑中...' : '已保存'}
        </div>
      </div>
    </div>
  );
};