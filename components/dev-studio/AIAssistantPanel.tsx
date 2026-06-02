/**
 * file: AIAssistantPanel.tsx
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

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, ChevronDown, ChevronUp, Copy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { useBigModel } from '../../hooks/useBigModel';
import { DEFAULT_MODEL } from '../../config/models';

/**
 * AIAssistantPanel - AI 助手面板
 * 
 * 职责：
 * - 代码生成建议
 * - 代码优化建议
 * - 错误诊断
 * - 与 BigModel SDK 集成
 */

interface AIAssistantPanelProps {
  currentCode: string;
  fileName: string;
  onInsertCode: (code: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  codeBlock?: string;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  currentCode,
  fileName,
  onInsertCode,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 使用 BigModel Hook
  const { complete, loading } = useBigModel({
    model: DEFAULT_MODEL,
  });

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // 构建上下文
    const context = `当前文件: ${fileName}\n当前代码:\n\`\`\`typescript\n${currentCode}\n\`\`\`\n\n用户问题: ${input}`;

    try {
      const response = await complete(context, { roleId: 'CODE_ARTISAN' });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response?.content || '无法获取响应',
        timestamp: Date.now(),
        codeBlock: extractCodeBlock(response?.content || ''),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，AI 助手暂时无法响应。请稍后重试。',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const extractCodeBlock = (text: string): string | undefined => {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    return match ? match[1].trim() : undefined;
  };

  const handleCopyCode = async (code: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('复制失败', err);
    }
  };

  const quickActions = [
    { label: '优化代码', prompt: '请帮我优化当前代码，提高性能和可读性' },
    { label: '添加注释', prompt: '请为当前代码添加详细的中文注释' },
    { label: '错误检查', prompt: '请检查代码中可能存在的错误和问题' },
    { label: '生成测试', prompt: '请为当前代码生成单元测试用例' },
  ];

  return (
    <div className={cn(
      "flex-none border-t border-white/[0.04] bg-slate-950/50 transition-all duration-300",
      isCollapsed ? "h-12" : "h-80"
    )}>
      {/* Header */}
      <div
        onClick={onToggleCollapse}
        className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">
            AI 助手
          </h3>
          {messages.length > 0 && (
            <span className="text-[10px] font-mono text-slate-600">
              ({messages.length} 条对话)
            </span>
          )}
        </div>
        <button className="p-1 rounded hover:bg-white/5 text-slate-500 transition-colors">
          {isCollapsed ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col h-[calc(100%-48px)]"
          >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent px-4 py-2">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Sparkles className="w-12 h-12 text-violet-400/30 mb-3" />
                  <p className="text-sm font-mono text-slate-500 mb-4">
                    AI 助手已就绪，问我任何关于代码的问题
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {quickActions.map(action => (
                      <button
                        key={action.label}
                        onClick={() => setInput(action.prompt)}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/30 transition-all"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3 text-xs",
                          message.role === 'user'
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : "bg-violet-500/10 text-violet-300 border border-violet-500/30"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words mb-2">
                          {message.content}
                        </p>
                        
                        {message.codeBlock && (
                          <div className="mt-2 relative group">
                            <pre className="bg-black/30 rounded p-2 text-[11px] font-mono overflow-x-auto">
                              <code>{message.codeBlock}</code>
                            </pre>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleCopyCode(message.codeBlock!, message.id)}
                                className="p-1 rounded bg-black/50 hover:bg-black/70 text-slate-400 hover:text-slate-200 transition-colors"
                                title="复制代码"
                              >
                                {copiedId === message.id ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                onClick={() => onInsertCode(message.codeBlock!)}
                                className="px-2 py-1 rounded bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-[10px] font-mono transition-colors"
                              >
                                插入
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="text-[9px] text-slate-600 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex-none px-4 py-2 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="问我任何关于代码的问题... (Enter 发送)"
                  className="flex-1 px-3 py-2 bg-black/20 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 border border-white/[0.06] focus:border-violet-500/50 focus:outline-none transition-colors"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all",
                    !input.trim() || loading
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                      : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30"
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>发送</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};