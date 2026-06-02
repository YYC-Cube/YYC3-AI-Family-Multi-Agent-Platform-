/**
 * file: CollaborationLayout.tsx
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
 * CollaborationLayout - 智能协同平台布局 (路由 /collab)
 * 
 * Step 5 升级版：
 * - 5a: WebSocket 实时协同编辑（CRDT + Presence）
 * - 5b: react-dnd 拖拽面板合并/拆分
 * - 5c: Monaco Editor 集成
 * 
 * 架构（基于 Functional-Spec.md 三栏式布局架构）：
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Header: Logo + 项目标题区 + 协同Presence + 公共图标区       │
 * ├─────────────────────────────────────────────────────────────┤
 * │  ViewSwitcher: << 返回 | 预览 | 代码 | 分栏 | 搜索 | 更多  │
 * ├─────────────────────────────────────────────────────────────┤
 * │  DraggablePanelLayout (react-dnd 多联式可拖拽面板)          │
 * │  ┌──────────┬──────────────────────────┬──────────────────┐│
 * │  │  AI交互  │  文件管理 / Monaco Editor │  代码详情/终端   ││
 * │  │  (25%)   │  (45%)                    │  (30%)          ││
 * │  └──────────┴──────────────────────────┴──────────────────┘│
 * └─────────────────────────────────────────────────────────────┘
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import {
  Blocks,
  Bell,
  Settings,
  Github,
  Share2,
  Rocket,
  User,
  Zap,
  Wifi,
  WifiOff,
  FolderOpen,
  ChevronDown,
  MessageSquare,
  Code2,
  RotateCcw,
  Layout,
  Terminal,
  Plus,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'
import { toast } from 'sonner'

import { UserAIPanel } from '../components/collaboration/UserAIPanel'
import { ProjectFileManager } from '../components/collaboration/ProjectFileManager'
import { CodeDetailPanel } from '../components/collaboration/CodeDetailPanel'
import { CollabViewSwitcher, ViewMode } from '../components/collaboration/CollabViewSwitcher'
import { DraggablePanelLayout } from '../components/collaboration/DraggablePanelLayout'
import { MonacoCodeEditor } from '../components/collaboration/MonacoCodeEditor'
import { CollaborationPresence } from '../components/collaboration/CollaborationPresence'
import { SandboxPreview } from '../components/collaboration/SandboxPreview'
import { EditorTabBar } from '../components/collaboration/EditorTabBar'
import { DiffViewer } from '../components/collaboration/DiffViewer'
import { TerminalPanel } from '../components/collaboration/TerminalPanel'
import { ProjectTemplateSelector } from '../components/collaboration/ProjectTemplateSelector'
import { GlobalSearchPalette } from '../components/collaboration/GlobalSearchPalette'
import { useCollaborativeEditing } from '../hooks/useCollaborativeEditing'
import { useDraggablePanels } from '../hooks/useDraggablePanels'
import { useEditorTabs } from '../hooks/useEditorTabs'
import { useVirtualFileSystem } from '../hooks/useVirtualFileSystem'
import { useTerminalVFS } from '../hooks/useTerminalVFS'
import { useAIContext } from '../hooks/useAIContext'
import { useAIAutoContext } from '../hooks/useAIAutoContext'
import type { PanelType } from '../types/collaboration'
import type { FileNode } from '../components/collaboration/ProjectFileManager'
import type { ProjectTemplate } from '../services/project-templates'
import type { QuickActionItem, ContextBadgeInfo } from '../components/collaboration/UserAIPanel'

// ==========================================
// Types
// ==========================================

interface RecentProject {
  id: string
  name: string
  description: string
  updatedAt: string
  status: 'active' | 'archived' | 'draft'
  color: string
}

// ==========================================
// Mock Data
// ==========================================

const RECENT_PROJECTS: RecentProject[] = [
  { id: 'p1', name: 'YYC³ Dashboard', description: 'AI Family 主控面板', updatedAt: '2分钟前', status: 'active', color: '#4ade80' },
  { id: 'p2', name: 'MCP Orchestrator', description: '工具编排引擎', updatedAt: '1小时前', status: 'active', color: '#38bdf8' },
  { id: 'p3', name: 'Knowledge Base', description: 'RAG 知识库系统', updatedAt: '3小时前', status: 'draft', color: '#fbbf24' },
  { id: 'p4', name: 'Auth Service', description: '认证服务模块', updatedAt: '昨天', status: 'archived', color: '#a78bfa' },
]

const INITIAL_CODE = `import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface PanelConfig {
  id: string
  title: string
  type: 'code' | 'preview' | 'terminal'
  width: string
  minWidth: number
}

/**
 * YYC³ AI Family - 多联式面板管理器
 * 支持拖拽合并/拆分操作
 * CRDT 实时协同编辑
 */
export function PanelManager() {
  const [panels, setPanels] = useState<PanelConfig[]>([])
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    // 从 localStorage 恢复板布局
    const saved = localStorage.getItem('yyc3-panel-layout')
    if (saved) {
      try {
        setPanels(JSON.parse(saved))
      } catch {
        setPanels(getDefaultPanels())
      }
    }
  }, [])

  const handlePanelDrop = (
    sourceId: string,
    targetId: string,
    position: 'left' | 'right' | 'top' | 'bottom'
  ) => {
    const newPanels = calculateMergedLayout(
      panels, sourceId, targetId, position
    )
    setPanels(newPanels)
    setIsDragging(false)
  }

  return (
    <motion.div className="flex h-full gap-1" layout>
      {panels.map(panel => (
        <PanelView
          key={panel.id}
          config={panel}
          isActive={activePanel === panel.id}
          onActivate={() => setActivePanel(panel.id)}
          onDrop={handlePanelDrop}
        />
      ))}
    </motion.div>
  )
}`

// ==========================================
// Component
// ==========================================

export const CollaborationLayout: React.FC = () => {
  const navigate = useNavigate()

  // Layout state
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [projectName] = useState('YYC³ 多联式协同设计器')
  const [selectedModelId, setSelectedModelId] = useState('glm-4-plus')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showProjectList, setShowProjectList] = useState(false)
  const [useDndLayout, setUseDndLayout] = useState(false)

  // Step 10a: 终端面板状态
  const [showTerminal, setShowTerminal] = useState(false)
  const [terminalFullscreen, setTerminalFullscreen] = useState(false)

  // Step 10c: 模板选择器状态
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  // Step 11c: 全局搜索面板状态
  const [showSearchPalette, setShowSearchPalette] = useState(false)

  // Step 11c: 全局搜索快捷键（Cmd+Shift+P / Ctrl+Shift+P）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setShowSearchPalette(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Step 5a: 协同编辑
  const collab = useCollaborativeEditing({
    documentId: 'main-document',
    userId: 'local-user',
    userName: 'Developer',
    initialContent: INITIAL_CODE,
  })

  // Step 5b: 拖拽面板
  const panels = useDraggablePanels()

  // Step 7a: 虚拟文件系统
  const vfs = useVirtualFileSystem()

  // Step 7c: 编辑器标签页
  const editorTabs = useEditorTabs()

  // Step 9a: 终端 VFS 联动
  const terminalVFS = useTerminalVFS(vfs)

  // Step 9b: AI 上下文
  const aiContext = useAIContext()

  // Step 10b: AI 自动上下文注入
  const aiAutoContext = useAIAutoContext({
    aiContext,
    activeTab: editorTabs.activeTab,
    tabs: editorTabs.tabs,
    vfs,
    vfsChangeCount: terminalVFS.changeCount,
  })

  // Step 11c: 搜索结果选择 → 打开文件标签
  const handleSearchSelect = useCallback((filePath: string, fileName: string, content: string, language: string, line?: number) => {
    editorTabs.openFile(filePath, fileName, content, language)
    collab.updateContent(content)
    if (line) {
      toast.info(`跳转到 ${fileName} 第 ${line} 行`)
    }
  }, [editorTabs, collab])

  // Step 9c: Diff Viewer 状态
  const [diffState, setDiffState] = useState<{
    visible: boolean
    tabId: string | null
  }>({ visible: false, tabId: null })

  // Connection UI
  const connectionState = collab.isConnected ? 'online' : 'mock'
  const connColor = connectionState === 'online' ? 'text-emerald-500' : 'text-blue-500'
  const connLabel = connectionState === 'online' ? 'LIVE' : 'MOCK'

  // Event handlers
  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleViewChange = useCallback((view: ViewMode) => {
    setViewMode(view)
    toast.info(`切换至${view === 'preview' ? '预览' : view === 'code' ? '代码' : '分栏'}视图`)
  }, [])

  const handleSendMessage = useCallback((message: string) => {
    setIsProcessing(true)
    setTimeout(() => setIsProcessing(false), 2000)
  }, [])

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModelId(modelId)
    toast.success(`模型已切换至 ${modelId}`)
  }, [])

  const handleCodeChange = useCallback((newCode: string) => {
    collab.updateContent(newCode)
    // Step 7c: 同时更新活动标签页内容
    if (editorTabs.activeTabId) {
      editorTabs.updateContent(editorTabs.activeTabId, newCode)
    }
    // Step 7a: 同步到虚拟文件系统
    if (editorTabs.activeTab) {
      vfs.writeFile(editorTabs.activeTab.id, newCode)
    }
  }, [collab, editorTabs, vfs])

  // Step 7c: 文件树选择 → 打开编辑器标签页
  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === 'folder') return
    // 从 VFS 读取或使用 mock 内容
    const content = vfs.readFile(`/src/${file.name}`) || vfs.readFile(`/${file.name}`) || `// ${file.name}\n// 文件内容加载中...\n`
    const lang = file.language || 'typescript'
    editorTabs.openFile(file.id, file.name, content, lang)
    // 同步到 collab
    collab.updateContent(content)
  }, [vfs, editorTabs, collab])

  // Step 7c: 标签页切换 → 切换 Monaco 内容
  const handleTabSwitch = useCallback((id: string) => {
    editorTabs.switchTab(id)
    const tab = editorTabs.tabs.find(t => t.id === id)
    if (tab) {
      collab.updateContent(tab.content)
    }
  }, [editorTabs, collab])

  // Step 7c: 关闭标签页
  const handleTabClose = useCallback((id: string) => {
    editorTabs.closeTab(id)
    // 切换到新活动标签后，同步内容
    const remaining = editorTabs.tabs.filter(t => t.id !== id)
    if (remaining.length > 0) {
      const nextTab = remaining[remaining.length - 1]
      collab.updateContent(nextTab.content)
    }
  }, [editorTabs, collab])

  // Step 7c: 保存标签页
  const handleTabSave = useCallback((id: string) => {
    const content = editorTabs.saveTab(id)
    if (content) {
      vfs.writeFile(id, content)
      vfs.markSaved(id)
      toast.success(`已保存 ${editorTabs.tabs.find(t => t.id === id)?.name || id}`)
    }
  }, [editorTabs, vfs])

  // Step 7a: 当前编辑器内容和活动标签
  const currentEditorContent = editorTabs.activeTab?.content || collab.content
  const currentFileName = editorTabs.activeTab?.name || 'PanelManager.tsx'
  const currentLanguage = editorTabs.activeTab?.language || 'typescript'

  // Step 7a: VFS 打包结果（用于预览面板）
  const bundleResult = useMemo(() => vfs.bundle(), [vfs])

  // Step 8c: AI 生成代码 → 写入 VFS + 打开标签
  const handleCodeGenerated = useCallback((code: string, fileName: string, language: string) => {
    const filePath = `/src/${fileName}`
    vfs.writeFile(filePath, code, language)
    editorTabs.openFile(filePath, fileName, code, language)
    collab.updateContent(code)
    toast.success(`AI 生成文件: ${fileName}`)
  }, [vfs, editorTabs, collab])

  // Step 8c: AI 代码应用到当前编辑器
  const handleApplyToEditor = useCallback((code: string) => {
    collab.updateContent(code)
    if (editorTabs.activeTabId) {
      editorTabs.updateContent(editorTabs.activeTabId, code)
    }
    if (editorTabs.activeTab) {
      vfs.writeFile(editorTabs.activeTab.id, code)
    }
    toast.success('代码已应用到编辑器')
  }, [collab, editorTabs, vfs])

  const handleToggleDnd = useCallback(() => {
    setUseDndLayout(prev => !prev)
    toast.info(useDndLayout ? '切换至经典布局' : '切换至拖拽布局')
  }, [useDndLayout])

  const handleResetLayout = useCallback(() => {
    panels.resetLayout()
    toast.success('布局已重置')
  }, [panels])

  // Step 10c: 模板选择 → 初始化 VFS
  const handleSelectTemplate = useCallback((template: ProjectTemplate) => {
    vfs.reset()
    Object.entries(template.files).forEach(([path, file]) => {
      vfs.writeFile(path, file.content, file.language)
    })
    vfs.setEntryPoint(template.entryPoint)
    // 打开入口文件标签
    const entryFile = template.files[template.entryPoint]
    if (entryFile) {
      const name = template.entryPoint.split('/').pop() || template.entryPoint
      editorTabs.closeAllTabs()
      editorTabs.openFile(template.entryPoint, name, entryFile.content, entryFile.language)
      collab.updateContent(entryFile.content)
    }
    toast.success(`项目已初始化: ${template.name} (${Object.keys(template.files).length} 个文件)`)
  }, [vfs, editorTabs, collab])

  // Step 9c: 查看变更（Diff Viewer）
  const handleViewDiff = useCallback((tabId: string) => {
    const tab = editorTabs.tabs.find(t => t.id === tabId)
    if (!tab) return
    if (tab.content === tab.originalContent) {
      toast.info('文件未修改')
      return
    }
    setDiffState({ visible: true, tabId })
  }, [editorTabs.tabs])

  const handleCloseDiff = useCallback(() => {
    setDiffState({ visible: false, tabId: null })
  }, [])

  const handleRevertDiff = useCallback(() => {
    if (!diffState.tabId) return
    const tab = editorTabs.tabs.find(t => t.id === diffState.tabId)
    if (tab) {
      editorTabs.updateContent(diffState.tabId, tab.originalContent)
      collab.updateContent(tab.originalContent)
      vfs.writeFile(diffState.tabId, tab.originalContent)
      toast.success('已恢复到原始内容')
    }
    setDiffState({ visible: false, tabId: null })
  }, [diffState.tabId, editorTabs, collab, vfs])

  // Step 9c: Diff Viewer 的文件数据
  const diffTab = diffState.tabId ? editorTabs.tabs.find(t => t.id === diffState.tabId) : null

  // Step 5b: 面板内容渲染器
  const renderPanelContent = useCallback((panelType: PanelType, panelId: string): React.ReactNode => {
    switch (panelType) {
      case 'ai-chat':
        return (
          <UserAIPanel
            activeModelId={selectedModelId}
            onModelChange={handleModelChange}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            onCodeGenerated={handleCodeGenerated}
            onApplyToEditor={handleApplyToEditor}
          />
        )
      case 'file-tree':
        return <ProjectFileManager />
      case 'code-editor':
        return (
          <MonacoCodeEditor
            value={collab.content}
            language="typescript"
            filePath="PanelManager.tsx"
            onChange={handleCodeChange}
            participants={collab.participants}
            currentUserId="local-user"
            onCursorChange={(line, col) => {
              collab.updateCursor({ line, column: col, timestamp: Date.now() })
            }}
          />
        )
      case 'code-detail':
        return (
          <CodeDetailPanel
            code={collab.content}
            fileName="PanelManager.tsx"
            language="typescript"
          />
        )
      case 'terminal':
        return <TerminalPanel terminal={terminalVFS} visible />
      case 'preview':
        return (
          <SandboxPreview
            code={collab.content}
            language="typescript"
            bundledHTML={bundleResult.html}
            bundleFileCount={bundleResult.dependencies.length}
            bundleErrors={bundleResult.errors}
          />
        )
      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-600 text-[10px] font-mono">
            面板: {panelType}
          </div>
        )
    }
  }, [selectedModelId, handleModelChange, handleSendMessage, isProcessing, collab, handleCodeChange, bundleResult, handleCodeGenerated, handleApplyToEditor])

  // Step 11a: 将 aiContext quickActions 转为 UserAIPanel 格式
  const mappedQuickActions: QuickActionItem[] = useMemo(
    () => aiAutoContext.quickActions.map(a => ({
      id: a.id,
      label: a.label,
      prompt: a.prompt,
      icon: a.icon,
      available: a.available,
      priority: a.priority,
    })),
    [aiAutoContext.quickActions]
  )

  const contextBadgeInfo: ContextBadgeInfo = useMemo(
    () => ({
      activeFilePath: aiAutoContext.activeFilePath,
      errorCount: aiAutoContext.errorCount,
      warningCount: aiAutoContext.warningCount,
      contextFileCount: aiContext.contextFiles.filter(f => !f.isActive).length,
      isReady: aiAutoContext.isContextReady,
    }),
    [aiAutoContext, aiContext.contextFiles]
  )

  const handleQuickAction = useCallback((action: QuickActionItem) => {
    const enriched = aiAutoContext.executeQuickAction(action as any)
    // 触发消息发送
    handleSendMessage(enriched)
  }, [aiAutoContext, handleSendMessage])

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden relative">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-violet-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] bg-emerald-600/3 rounded-full blur-[100px]" />
      </div>

      {/* ============================================================ */}
      {/* Header                                                        */}
      {/* ============================================================ */}
      <header className="relative z-30 flex-none px-4 py-2.5 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl">
        {/* Left: Logo + Project Title */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Blocks className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                {projectName}
              </h1>
              <button
                onClick={() => setShowProjectList(!showProjectList)}
                className="p-0.5 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  showProjectList && "rotate-180"
                )} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono tracking-widest uppercase">
              <span>智能协同平台</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span className="text-cyan-500">COLLAB MODE</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span className={cn("flex items-center gap-1", connColor)}>
                {connectionState === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {connLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Public Icons + Presence */}
        <div className="hidden md:flex items-center gap-2">
          {/* Layout Toggle */}
          <button
            onClick={handleToggleDnd}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono border transition-all",
              useDndLayout
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "text-slate-500 hover:text-slate-300 border-white/[0.06] hover:bg-white/5"
            )}
            title={useDndLayout ? '切换至经典布局' : '切换至拖拽布局'}
          >
            <Layout className="w-3 h-3" />
            <span>{useDndLayout ? 'DnD' : '经典'}</span>
          </button>

          {useDndLayout && (
            <button
              onClick={handleResetLayout}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono text-slate-500 hover:text-slate-300 border border-white/[0.06] hover:bg-white/5 transition-all"
              title="重置布局"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          <div className="w-px h-4 bg-white/[0.06]" />

          {/* Collaboration Presence (5a) */}
          <CollaborationPresence
            participants={collab.participants}
            session={collab.session}
            isConnected={collab.isConnected}
            version={collab.version}
            conflictCount={collab.conflictCount}
          />

          <div className="w-px h-4 bg-white/[0.06]" />

          {/* Action Icons */}
          <div className="flex items-center gap-0.5">
            {[
              { icon: <FolderOpen className="w-3.5 h-3.5" />, label: '项目', color: 'text-amber-400 hover:bg-amber-500/10' },
              { icon: <Bell className="w-3.5 h-3.5" />, label: '通知', color: 'text-slate-400 hover:bg-white/5' },
              { icon: <Settings className="w-3.5 h-3.5" />, label: '设置', color: 'text-slate-400 hover:bg-white/5' },
              { icon: <Github className="w-3.5 h-3.5" />, label: 'GitHub', color: 'text-slate-400 hover:bg-white/5' },
              { icon: <Share2 className="w-3.5 h-3.5" />, label: '分享', color: 'text-slate-400 hover:bg-white/5' },
              { icon: <Rocket className="w-3.5 h-3.5" />, label: '发布', color: 'text-emerald-400 hover:bg-emerald-500/10' },
            ].map(btn => (
              <button
                key={btn.label}
                className={cn("p-1.5 rounded-md transition-all", btn.color)}
                title={btn.label}
                onClick={() => toast.info(`${btn.label}功能开发中...`)}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Right: User Info + Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition-all"
            title="聊天室"
          >
            <MessageSquare className="w-3 h-3" />
            <span className="hidden sm:inline">聊天室</span>
          </button>

          <button
            onClick={() => navigate('/dev')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition-all"
            title="开发工具"
          >
            <Code2 className="w-3 h-3" />
            <span className="hidden sm:inline">开发</span>
          </button>

          <div className="w-px h-5 bg-white/[0.06]" />

          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/20 border border-white/[0.04]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-mono text-slate-300">Developer</div>
              <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-500">
                <Zap className="w-2 h-2" />
                Pro
              </div>
            </div>
          </div>
        </div>

        {/* Project List Dropdown */}
        <AnimatePresence>
          {showProjectList && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-4 mt-1 z-50 bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 p-2 min-w-[320px]"
            >
              <div className="px-2 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                最近项目
              </div>
              <div className="space-y-0.5">
                {RECENT_PROJECTS.map(project => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setShowProjectList(false)
                      toast.info(`切换至项目: ${project.name}`)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all text-left"
                  >
                    <div className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: project.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-300 font-mono truncate">{project.name}</div>
                      <div className="text-[9px] text-slate-600 font-mono">{project.description}</div>
                    </div>
                    <div className="flex-none text-[9px] text-slate-600 font-mono">{project.updatedAt}</div>
                    <div className={cn(
                      "flex-none w-1.5 h-1.5 rounded-full",
                      project.status === 'active' ? "bg-emerald-500" : project.status === 'draft' ? "bg-amber-500" : "bg-slate-600"
                    )} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ============================================================ */}
      {/* ViewSwitcher                                                  */}
      {/* ============================================================ */}
      <CollabViewSwitcher
        currentView={viewMode}
        onViewChange={handleViewChange}
        onBack={handleBack}
      />

      {/* ============================================================ */}
      {/* Main Content Area                                              */}
      {/* ============================================================ */}
      {useDndLayout ? (
        /* Step 5b: DnD 拖拽面板布局 */
        <DraggablePanelLayout
          layout={panels.layout}
          onSplit={panels.splitPanel}
          onMerge={panels.mergePanel}
          onClose={panels.closePanel}
          onMaximize={panels.maximizePanel}
          onRestore={panels.restorePanel}
          onSetActive={panels.setActivePanel}
          onDragOver={panels.setDragOver}
          renderPanel={renderPanelContent}
        />
      ) : (
        /* 经典三栏布局 */
        <div className="flex-1 flex overflow-hidden relative z-10">
          {/* Left Panel - 用户与智能AI交互区 (25%) */}
          <AnimatePresence mode="wait">
            {viewMode !== 'preview' && (
              <motion.div
                key="left-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: viewMode === 'split' ? '25%' : '30%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex-none overflow-hidden border-r border-white/[0.06]"
                style={{ minWidth: viewMode === 'split' ? '240px' : '280px', maxWidth: '400px' }}
              >
                <UserAIPanel
                  activeModelId={selectedModelId}
                  onModelChange={handleModelChange}
                  onSendMessage={handleSendMessage}
                  isProcessing={isProcessing}
                  onCodeGenerated={handleCodeGenerated}
                  onApplyToEditor={handleApplyToEditor}
                  quickActions={mappedQuickActions}
                  contextInfo={contextBadgeInfo}
                  onQuickAction={handleQuickAction}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center Panel - 项目文件管理区 + Monaco Editor (45%) */}
          <motion.div
            layout
            className={cn(
              "overflow-hidden border-r border-white/[0.06] flex flex-col",
              viewMode === 'preview' ? "flex-1" : viewMode === 'code' ? "flex-1" : "flex-[1.8]"
            )}
            style={{ minWidth: '300px' }}
          >
            {/* 上半：文件树（紧凑） */}
            <div className="flex-none h-[180px] border-b border-white/[0.06] overflow-hidden">
              <ProjectFileManager onSelectFile={handleFileSelect} />
            </div>
            {/* Step 7c: 编辑器标签栏 */}
            <EditorTabBar
              tabs={editorTabs.tabs}
              activeTabId={editorTabs.activeTabId}
              onSwitchTab={handleTabSwitch}
              onCloseTab={handleTabClose}
              onCloseOtherTabs={editorTabs.closeOtherTabs}
              onCloseAllTabs={editorTabs.closeAllTabs}
              onSaveTab={handleTabSave}
              onSaveAllTabs={() => {
                const saved = editorTabs.saveAllTabs()
                saved.forEach(({ id, content }) => {
                  vfs.writeFile(id, content)
                  vfs.markSaved(id)
                })
                if (saved.length > 0) toast.success(`已保存 ${saved.length} 个文件`)
              }}
              onViewDiff={handleViewDiff}
            />
            {/* 下半：Monaco Editor (5c + 7c) */}
            <div className="flex-1 min-h-0">
              <MonacoCodeEditor
                value={currentEditorContent}
                language={currentLanguage}
                filePath={currentFileName}
                onChange={handleCodeChange}
                participants={collab.participants}
                currentUserId="local-user"
                onCursorChange={(line, col) => {
                  collab.updateCursor({ line, column: col, timestamp: Date.now() })
                  if (editorTabs.activeTabId) {
                    editorTabs.updateCursorPosition(editorTabs.activeTabId, line, col)
                  }
                }}
              />
            </div>
          </motion.div>

          {/* Right Panel - 文件代码编辑区 (30%) */}
          <AnimatePresence mode="wait">
            {viewMode !== 'code' && (
              <motion.div
                key="right-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: viewMode === 'split' ? '30%' : '40%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex-none overflow-hidden"
                style={{ minWidth: viewMode === 'split' ? '280px' : '320px', maxWidth: '600px' }}
              >
                <CodeDetailPanel
                  code={collab.content}
                  fileName="PanelManager.tsx"
                  language="typescript"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Step 9c: Diff Viewer */}
      {diffState.visible && diffTab && (
        <DiffViewer
          originalContent={diffTab.originalContent}
          currentContent={diffTab.content}
          fileName={diffTab.name}
          language={diffTab.language}
          onClose={handleCloseDiff}
          onRevert={handleRevertDiff}
          visible={diffState.visible}
        />
      )}

      {/* Step 10a: Terminal Panel (底部可折叠) */}
      <AnimatePresence>
        {showTerminal && (
          <TerminalPanel
            terminal={terminalVFS}
            visible={showTerminal}
            onClose={() => { setShowTerminal(false); setTerminalFullscreen(false) }}
            isFullscreen={terminalFullscreen}
            onToggleFullscreen={() => setTerminalFullscreen(f => !f)}
          />
        )}
      </AnimatePresence>

      {/* Step 10a/10c: 底部工具栏 */}
      <div className="relative z-20 flex-none flex items-center justify-between px-3 py-1 border-t border-white/[0.04] bg-slate-950/90 text-[9px] font-mono text-slate-600">
        <div className="flex items-center gap-2">
          {/* 终端切换 */}
          <button
            onClick={() => setShowTerminal(prev => !prev)}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded transition-all",
              showTerminal
                ? "text-cyan-400 bg-cyan-500/10"
                : "hover:text-slate-400 hover:bg-white/5"
            )}
          >
            <Terminal className="w-3 h-3" />
            <span>终端</span>
          </button>

          {/* 新建项目 */}
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-violet-400 hover:bg-violet-500/10 transition-all"
          >
            <Plus className="w-3 h-3" />
            <span>新建项目</span>
          </button>

          {/* AI 上下文状态 */}
          {aiAutoContext.isContextReady && (
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI 上下文就绪
              {aiAutoContext.errorCount > 0 && (
                <span className="text-red-400 ml-1">{aiAutoContext.errorCount} 错误</span>
              )}
              {aiAutoContext.warningCount > 0 && (
                <span className="text-amber-400 ml-1">{aiAutoContext.warningCount} 警告</span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span>{vfs.files.length} 文件</span>
          <span>{editorTabs.tabs.length} 标签</span>
          <span>{terminalVFS.changeCount} 变更</span>
          <span className="text-slate-700">YYC³ v3.0</span>
        </div>
      </div>

      {/* Step 10c: 模板选择器 */}
      <ProjectTemplateSelector
        visible={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Step 11c: 全局搜索面板 */}
      <GlobalSearchPalette
        visible={showSearchPalette}
        onClose={() => setShowSearchPalette(false)}
        files={vfs.files}
        onSelect={handleSearchSelect}
      />
    </div>
  )
}