/**
 * file: SystemProtocols.tsx
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

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileCode, Server, Terminal, Lock } from 'lucide-react';
import { cn } from '@/components/ui/utils';

export const SystemProtocols: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl p-8 overflow-y-auto font-mono text-green-400"
    >
      <div className="max-w-4xl mx-auto border border-green-500/30 p-8 rounded-lg shadow-[0_0_50px_rgba(16,185,129,0.1)] relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-green-500/50 hover:text-green-400 transition-colors"
        >
          [CLOSE_TERMINAL]
        </button>

        <header className="mb-12 border-b border-green-500/30 pb-4">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Terminal className="w-8 h-8" />
            SYSTEM_CONSTITUTION_V1.0
          </h1>
          <p className="opacity-60">Soul Injection: TypeScript & API Protocols</p>
        </header>

        <div className="grid md:grid-cols-2 gap-12">
          {/* TypeScript Rules */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 border-l-4 border-green-500 pl-4">
              <FileCode className="w-5 h-5" /> TypeScript DNA
            </h2>
            <ul className="space-y-4 text-sm opacity-80 list-disc list-inside">
              <li>所有公共接口必须有明确的类型定义</li>
              <li>避免使用 <code className="bg-green-900/30 px-1">any</code>，必要时使用 <code className="bg-green-900/30 px-1">unknown</code></li>
              <li>使用严格的 TSConfig 配置</li>
              <li>自定义类型统一存放于 <code className="bg-green-900/30 px-1">types/</code> 目录</li>
            </ul>
            
            <h3 className="text-lg font-bold mt-8 mb-2">Component Design</h3>
            <ul className="space-y-4 text-sm opacity-80 list-disc list-inside">
              <li>React 组件遵循函数式写法</li>
              <li>Props 命名规范：<code className="bg-green-900/30 px-1">{`{ComponentName}Props`}</code></li>
              <li>使用 <code className="bg-green-900/30 px-1">forwardRef</code> 处理 Ref 传递</li>
            </ul>
          </section>

          {/* API & Security Rules */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 border-l-4 border-green-500 pl-4">
              <Server className="w-5 h-5" /> API & Security
            </h2>
            <ul className="space-y-4 text-sm opacity-80 list-disc list-inside">
              <li>遵循 RESTful 设计原则</li>
              <li>HTTP 状态码严格标识结果</li>
              <li>响应格式统一为 JSON</li>
              <li>支持分页的接口必须包含元数据</li>
            </ul>

            <div className="mt-8 p-4 border border-red-500/30 bg-red-900/10 rounded">
              <h3 className="text-lg font-bold mb-2 text-red-400 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Security Protocols
              </h3>
              <ul className="space-y-2 text-sm text-red-300/80">
                <li>• 所有接口实施认证检查</li>
                <li>• 敏感数据强制 HTTPS 传输</li>
                <li>• 输入数据实施验证与清理 (Sanitization)</li>
                <li>• 错误信息对用户友好，严禁暴露堆栈</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-green-500/30 text-center opacity-40 text-xs">
           <p>AUDITED BY: FIGMA AI FULL STACK MENTOR</p>
           <p>STATUS: ROCK_SOLID</p>
        </div>
      </div>
    </motion.div>
  );
};
