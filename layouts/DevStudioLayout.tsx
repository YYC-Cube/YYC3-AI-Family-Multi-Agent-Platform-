/**
 * file: DevStudioLayout.tsx
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

import React, { useState } from 'react';
import { Code2, Home, Settings, Save, Play, Blocks } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '@/components/ui/utils';
import { ComponentTree, TreeNode } from '../components/dev-studio/ComponentTree';
import { CodeEditor } from '../components/dev-studio/CodeEditor';
import { LivePreview } from '../components/dev-studio/LivePreview';
import { AIAssistantPanel } from '../components/dev-studio/AIAssistantPanel';
import { toast } from 'sonner';

/**
 * DevStudioLayout - 智能开发工具布局
 * 
 * 架构：
 * ┌──────────────────────────────────────────────┐
 * │  Header (项目名 + 工具栏)                     │
 * ├────────────┬────────────────────┬────────────┤
 * │            │                    │            │
 * │  组件树    │   代码编辑器       │  实时预览  │
 * │  (左)      │   (中)             │  (右)      │
 * │            │                    │            │
 * ├────────────┴────────────────────┴────────────┤
 * │  AI 助手面板 (可折叠)                         │
 * └──────────────────────────────────────────────┘
 * 
 * 特性：
 * - 三栏布局（组件树 20% | 编辑器 50% | 预览 30%）
 * - 实时代码编辑与预览
 * - AI 代码助手集成
 * - 组件树可视化
 */

// 示例代码
const EXAMPLE_CODE = `// YYC³ AI Family - 示例组件
import React from 'react';

export const WelcomeCard = () => {
  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '1rem',
      color: 'white',
      maxWidth: '600px',
      margin: '2rem auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        🚀 YYC³ 智能开发工具
      </h1>
      <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }}>
        欢迎使用多模态智能工作台！
      </p>
      <div style={{
        marginTop: '1.5rem',
        display: 'flex',
        gap: '1rem'
      }}>
        <button style={{
          padding: '0.75rem 1.5rem',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '0.5rem',
          color: 'white',
          cursor: 'pointer',
          fontSize: '0.9rem'
        }}>
          开始探索
        </button>
        <button style={{
          padding: '0.75rem 1.5rem',
          background: 'rgba(255,255,255,0.9)',
          border: 'none',
          borderRadius: '0.5rem',
          color: '#667eea',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          查看文档
        </button>
      </div>
    </div>
  );
};

// 渲染到页面
const root = document.getElementById('preview-root');
if (root) {
  root.appendChild(document.createElement('div')).innerHTML = '<div id="app"></div>';
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = WelcomeCard().outerHTML;
  }
}`;

export const DevStudioLayout: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [currentCode, setCurrentCode] = useState(EXAMPLE_CODE);
  const [projectName] = useState('YYC³ Dev Project');
  const [isAICollapsed, setIsAICollapsed] = useState(false);

  const handleSelectNode = (node: TreeNode) => {
    setSelectedNode(node);
    toast.info(`已选择: ${node.name}`);
  };

  const handleCodeChange = (newCode: string) => {
    setCurrentCode(newCode);
  };

  const handleInsertCode = (code: string) => {
    setCurrentCode(prev => prev + '\n\n' + code);
    toast.success('代码已插入到编辑器');
  };

  const handleRunCode = () => {
    toast.success('代码已运行，查看右侧预览');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-none px-4 py-2.5 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/90 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-violet-500/10 rounded-lg border border-violet-500/20">
            <Code2 className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-400">
              {projectName}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono tracking-widest uppercase">
              <span>智能开发工具</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span className="text-violet-500">DEV MODE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
          >
            <Play className="w-3 h-3" />
            <span>运行</span>
          </button>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/30 transition-all"
          >
            <Save className="w-3 h-3" />
            <span className="hidden sm:inline">保存项目</span>
          </button>

          <div className="w-px h-4 bg-white/5 mx-1" />

          <button
            className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            title="设置"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => navigate('/collab')}
            className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-cyan-400 transition-colors"
            title="智能协同平台"
          >
            <Blocks className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            title="返回聊天室"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Component Tree (20%) */}
        <div className="w-[20%] min-w-[200px] max-w-[400px] border-r border-white/[0.06]">
          <ComponentTree
            onSelectNode={handleSelectNode}
            selectedNodeId={selectedNode?.id || null}
          />
        </div>

        {/* Center Panel - Code Editor (50%) */}
        <div className="flex-1 border-r border-white/[0.06]">
          <CodeEditor
            fileName={selectedNode?.name || 'example.tsx'}
            initialCode={currentCode}
            language="tsx"
            onChange={handleCodeChange}
            onAIAssist={() => setIsAICollapsed(false)}
          />
        </div>

        {/* Right Panel - Live Preview (30%) */}
        <div className="w-[30%] min-w-[300px] max-w-[600px]">
          <LivePreview
            code={currentCode}
            fileName={selectedNode?.name || 'preview'}
          />
        </div>
      </div>

      {/* Bottom Panel - AI Assistant */}
      <AIAssistantPanel
        currentCode={currentCode}
        fileName={selectedNode?.name || 'example.tsx'}
        onInsertCode={handleInsertCode}
        isCollapsed={isAICollapsed}
        onToggleCollapse={() => setIsAICollapsed(!isAICollapsed)}
      />

      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-violet-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
};