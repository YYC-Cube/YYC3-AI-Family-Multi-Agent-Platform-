/**
 * file: UserAIPanel.tsx
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
 * UserAIPanel - 用户与智能AI交互区（左栏）
 * 
 * 职责：
 * - 用户信息展示面板
 * - AI模型选择器
 * - AI对话交互主界面
 * - 用户聊天输入框
 * 
 * 对应规格：Functional-Spec §智能AI编程模式页面 → 左栏
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Bot,
  Send,
  ChevronDown,
  Sparkles,
  Settings,
  HelpCircle,
  Paperclip,
  ImagePlus,
  Zap,
  Circle,
  Loader2,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  FileCode,
  Play,
  Bug,
  Code,
  TestTube,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { RoleId, FAMILY_ROLES } from '../../types/family-manifest';

// ==========================================
// Types
// ==========================================

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  color: string;
  isAvailable: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

export interface UserAIPanelProps {
  activeModelId?: string;
  onModelChange?: (modelId: string) => void;
  onSendMessage?: (message: string) => void;
  isProcessing?: boolean;
  /** Step 8c: AI 生成代码后回调（写入 VFS + 打开标签） */
  onCodeGenerated?: (code: string, fileName: string, language: string) => void;
  /** Step 8c: 将代码应用到当前编辑器 */
  onApplyToEditor?: (code: string) => void;
  /** Step 11a: 动态快捷操作 */
  quickActions?: QuickActionItem[];
  /** Step 11a: 快捷操作点击回调 */
  onQuickAction?: (action: QuickActionItem) => void;
  /** Step 11a: 上下文信息 badge */
  contextInfo?: ContextBadgeInfo;
}

/** Step 11a: 快捷操作项 */
export interface QuickActionItem {
  id: string;
  label: string;
  prompt: string;
  icon: 'bug' | 'sparkles' | 'code' | 'refactor' | 'test' | 'docs';
  available: boolean;
  priority: number;
}

/** Step 11a: 上下文 badge 信息 */
export interface ContextBadgeInfo {
  activeFilePath: string | null;
  errorCount: number;
  warningCount: number;
  contextFileCount: number;
  isReady: boolean;
}

// ==========================================
// Constants
// ==========================================

import { MODEL_CATALOG, DEFAULT_MODEL } from '../../config/models';
import type { UIModelInfo } from '../../config/models';

const AI_MODELS = MODEL_CATALOG;

const QUICK_PROMPTS = [
  '帮我创建一个响应式面板布局',
  '分析当前代码架构',
  '生成组件测试用例',
  '优化代码性能',
];

// ==========================================
// Component
// ==========================================

export function UserAIPanel({
  activeModelId = DEFAULT_MODEL,
  onModelChange,
  onSendMessage,
  isProcessing = false,
  onCodeGenerated,
  onApplyToEditor,
  quickActions,
  onQuickAction,
  contextInfo,
}: UserAIPanelProps) {
  const [selectedModel, setSelectedModel] = useState(activeModelId);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-1',
      role: 'system',
      content: '欢迎使用 YYC³ 智能协同平台。我是您的 AI 编程助手，可以帮助您进行设计、编码和调试。',
      timestamp: Date.now() - 60000,
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close model selector on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(e.target as Node)) {
        setShowModelSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectModel = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    setShowModelSelector(false);
    onModelChange?.(modelId);
  }, [onModelChange]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    onSendMessage?.(inputText.trim());
    setInputText('');

    // Mock AI response
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `收到您的需求："${userMsg.content.substring(0, 50)}..."。正在分析并生成解决方案，请稍候。\n\n\`\`\`typescript\n// 示例代码片段\nexport const Component = () => {\n  return <div>Generated</div>;\n};\n\`\`\``,
        timestamp: Date.now(),
        model: currentModel.name,
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1500);
  }, [inputText, isProcessing, onSendMessage, currentModel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleClearChat = useCallback(() => {
    setMessages([{
      id: 'sys-clear',
      role: 'system',
      content: '对话已清空。随时可以开始新的对话。',
      timestamp: Date.now(),
    }]);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950/50">
      {/* User Info Section */}
      <div className="flex-none px-3 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-200 truncate font-mono">YYC³ Developer</div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
              <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
              <span>在线</span>
              <span className="text-slate-700">|</span>
              <span>协同模式</span>
            </div>
          </div>
          <button className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI Model Selector */}
      <div className="flex-none px-3 py-2 border-b border-white/[0.06]" ref={modelSelectorRef}>
        <button
          onClick={() => setShowModelSelector(!showModelSelector)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-black/30 border border-white/[0.06] hover:border-white/10 transition-all"
        >
          <Bot className="w-3.5 h-3.5" style={{ color: currentModel.color }} />
          <div className="flex-1 text-left min-w-0">
            <div className="text-[11px] text-slate-300 font-mono truncate">{currentModel.name}</div>
            <div className="text-[9px] text-slate-600 font-mono">{currentModel.provider} · {currentModel.description}</div>
          </div>
          <ChevronDown className={cn(
            "w-3 h-3 text-slate-500 transition-transform",
            showModelSelector && "rotate-180"
          )} />
        </button>

        <AnimatePresence>
          {showModelSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 overflow-hidden"
            >
              <div className="bg-slate-900/90 rounded-lg border border-white/[0.06] overflow-hidden">
                {AI_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleSelectModel(model.id)}
                    disabled={!model.isAvailable}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-left transition-all",
                      model.id === selectedModel
                        ? "bg-white/[0.06]"
                        : "hover:bg-white/[0.03]",
                      !model.isAvailable && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: model.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-300 font-mono truncate">{model.name}</div>
                      <div className="text-[9px] text-slate-600 font-mono">{model.description}</div>
                    </div>
                    {model.id === selectedModel && (
                      <Zap className="w-3 h-3 text-emerald-400 flex-none" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-2",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            {msg.role !== 'user' && (
              <div className="flex-none w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
            )}
            <div className={cn(
              "max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed",
              msg.role === 'user'
                ? "bg-emerald-500/10 border border-emerald-500/20 text-slate-200"
                : msg.role === 'system'
                  ? "bg-slate-800/50 border border-white/[0.04] text-slate-400 italic"
                  : "bg-slate-800/80 border border-white/[0.06] text-slate-300"
            )}>
              {msg.content.split('```').map((part, idx) =>
                idx % 2 === 0
                  ? <span key={idx}>{part}</span>
                  : (() => {
                    // Step 8c: 提取语言和代码内容
                    const langMatch = part.match(/^(\w+)\n/);
                    const lang = langMatch?.[1] || 'typescript';
                    const codeContent = langMatch ? part.slice(langMatch[0].length) : part;
                    return (
                      <div key={idx} className="relative group my-1.5">
                        <div className="flex items-center justify-between px-2 py-1 bg-black/40 rounded-t-md border border-b-0 border-white/[0.06]">
                          <span className="text-[9px] font-mono text-slate-500">{lang}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(codeContent);
                              }}
                              className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
                              title="复制代码"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {onApplyToEditor && (
                              <button
                                onClick={() => onApplyToEditor(codeContent)}
                                className="p-0.5 rounded hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400 transition-colors"
                                title="应用到编辑器"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            )}
                            {onCodeGenerated && (
                              <button
                                onClick={() => {
                                  const ext = lang === 'typescript' || lang === 'tsx' ? 'tsx' : lang === 'css' ? 'css' : 'ts';
                                  const fileName = `ai-generated-${Date.now()}.${ext}`;
                                  onCodeGenerated(codeContent, fileName, lang);
                                }}
                                className="p-0.5 rounded hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 transition-colors"
                                title="创建新文件"
                              >
                                <FileCode className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <pre className="bg-black/30 rounded-b-md px-2 py-1.5 text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap border border-t-0 border-white/[0.06]">
                          {codeContent}
                        </pre>
                      </div>
                    );
                  })()
              )}
              {msg.model && (
                <div className="mt-1 text-[9px] text-slate-600 font-mono">via {msg.model}</div>
              )}
            </div>
          </motion.div>
        ))}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-2"
          >
            <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
            <span className="text-[10px] text-slate-500 font-mono">AI 正在思考...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Step 11a: Context Badge */}
      {contextInfo && contextInfo.isReady && (
        <div className="flex-none px-3 py-1.5 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-black/20 border border-white/[0.04]">
            <FileText className="w-3 h-3 text-cyan-400 flex-none" />
            <span className="text-[9px] font-mono text-slate-400 truncate flex-1">
              {contextInfo.activeFilePath
                ? contextInfo.activeFilePath.split('/').pop()
                : '无活动文件'}
            </span>
            {contextInfo.errorCount > 0 && (
              <span className="flex items-center gap-0.5 text-[8px] font-mono text-red-400 bg-red-500/10 px-1 rounded">
                <Bug className="w-2.5 h-2.5" />
                {contextInfo.errorCount}
              </span>
            )}
            {contextInfo.warningCount > 0 && (
              <span className="flex items-center gap-0.5 text-[8px] font-mono text-amber-400 bg-amber-500/10 px-1 rounded">
                <AlertTriangle className="w-2.5 h-2.5" />
                {contextInfo.warningCount}
              </span>
            )}
            {contextInfo.contextFileCount > 0 && (
              <span className="text-[8px] font-mono text-slate-600">
                +{contextInfo.contextFileCount} 文件
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step 11a: Dynamic Quick Actions / Fallback Quick Prompts */}
      <div className="flex-none px-3 py-1.5 border-t border-white/[0.04]">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1">
          {quickActions && quickActions.length > 0 ? (
            quickActions.map((action) => {
              const IconComponent = action.icon === 'bug' ? Bug
                : action.icon === 'sparkles' ? Sparkles
                : action.icon === 'code' ? Code
                : action.icon === 'refactor' ? RefreshCw
                : action.icon === 'test' ? TestTube
                : BookOpen;
              const colorMap: Record<string, string> = {
                bug: 'text-red-400 hover:bg-red-500/10 border-red-500/20',
                sparkles: 'text-violet-400 hover:bg-violet-500/10 border-violet-500/20',
                code: 'text-cyan-400 hover:bg-cyan-500/10 border-cyan-500/20',
                refactor: 'text-amber-400 hover:bg-amber-500/10 border-amber-500/20',
                test: 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20',
                docs: 'text-slate-400 hover:bg-white/5 border-white/10',
              };
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    if (onQuickAction) {
                      onQuickAction(action);
                    } else {
                      setInputText(action.prompt);
                    }
                  }}
                  className={cn(
                    "flex-none flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-mono bg-black/20 border transition-all whitespace-nowrap",
                    colorMap[action.icon] || 'text-slate-500 border-white/[0.04]'
                  )}
                >
                  <IconComponent className="w-2.5 h-2.5" />
                  {action.label}
                </button>
              );
            })
          ) : (
            QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInputText(prompt)}
                className="flex-none px-2 py-1 rounded-md text-[9px] font-mono text-slate-500 bg-black/20 border border-white/[0.04] hover:border-white/10 hover:text-slate-300 transition-all whitespace-nowrap"
              >
                {prompt}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Input */}
      <div className="flex-none px-3 py-2.5 border-t border-white/[0.06] bg-slate-950/70">
        <div className="flex items-end gap-2">
          <div className="flex gap-1">
            <button className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors" title="附件">
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors" title="图片">
              <ImagePlus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述你的需求..."
              rows={1}
              className="w-full bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 text-[12px] text-slate-200 placeholder-slate-600 font-mono resize-none focus:outline-none focus:border-emerald-500/30 transition-colors"
              style={{ minHeight: '36px', maxHeight: '120px' }}
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-md hover:bg-white/5 text-slate-600 hover:text-slate-400 transition-colors"
              title="清空对话"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isProcessing}
              className={cn(
                "p-2 rounded-lg transition-all",
                inputText.trim() && !isProcessing
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/[0.03] text-slate-600 border border-white/[0.04] cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}