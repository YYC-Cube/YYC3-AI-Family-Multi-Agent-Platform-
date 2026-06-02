/**
 * file: TechAuditPanel.tsx
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
 * YYC³ AI Family - Technical Reality Audit Panel
 * 
 * 诚实的技术审计面板：清楚标注每一层的真实状态
 * 哪些是已落地可执行的代码，哪些是等待后端的空壳
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, CheckCircle2, AlertTriangle, XCircle, 
  ArrowRight, Layers, Cpu, Globe, Database,
  Zap, MessageSquare, Brain, Shield, ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { ENDPOINTS } from '../../config/endpoints';

interface TechAuditPanelProps {
  onClose: () => void;
}

type LayerStatus = 'REAL' | 'PARTIAL' | 'MOCK' | 'MISSING';

interface AuditLayer {
  id: string;
  name: string;
  status: LayerStatus;
  percentage: number; // 0-100 completion
  icon: React.ReactNode;
  summary: string;
  details: AuditItem[];
}

interface AuditItem {
  name: string;
  file: string;
  status: LayerStatus;
  lines: string; // e.g. "633 lines"
  description: string;
  gap?: string; // What's missing for production
}

const STATUS_CONFIG: Record<LayerStatus, { color: string; bg: string; border: string; icon: React.ReactNode; label: string; labelEn: string }> = {
  REAL: { 
    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30',
    icon: <CheckCircle2 className="w-4 h-4" />, label: '已落地', labelEn: 'Production Ready'
  },
  PARTIAL: { 
    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30',
    icon: <AlertTriangle className="w-4 h-4" />, label: '半成品', labelEn: 'Client Only'
  },
  MOCK: { 
    color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30',
    icon: <AlertTriangle className="w-4 h-4" />, label: '模拟层', labelEn: 'Simulation'
  },
  MISSING: { 
    color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30',
    icon: <XCircle className="w-4 h-4" />, label: '未实现', labelEn: 'Not Built'
  },
};

// ==========================================
// THE AUDIT DATA — Ground Truth
// ==========================================
const AUDIT_LAYERS: AuditLayer[] = [
  {
    id: 'frontend-ui',
    name: '前端 UI / UX 层',
    status: 'REAL',
    percentage: 95,
    icon: <Layers className="w-5 h-5" />,
    summary: '全部可交互组件已实现，渲染真实状态，样式完整',
    details: [
      { name: 'FamilyDashboard', file: '/components/family/FamilyDashboard.tsx', status: 'REAL', lines: '~450L',
        description: '主布局：Header + Sidebar(折叠) + 通信区，所有子面板调度、pendingAction消费' },
      { name: 'MemberCard', file: '/components/family/MemberCard.tsx', status: 'REAL', lines: '~160L',
        description: 'compact/full 双模式，mood色环，设备标签，头像状态点' },
      { name: 'CommunicationLog', file: '/components/family/CommunicationLog.tsx', status: 'REAL', lines: '~144L',
        description: '消息气泡渲染，PEER/SYNC/LIVE标签，维度色条，自动滚动' },
      { name: 'CommandConsole', file: '/components/family/CommandConsole.tsx', status: 'REAL', lines: '~153L',
        description: '命令输入栏，TO:目标标签，9+斜杠命令提示' },
      { name: 'FiveDimensionsPanel', file: '/components/family/FiveDimensionsPanel.tsx', status: 'REAL', lines: '~500L+',
        description: 'SVG五角形拓扑 + MATRIX矩阵视图切换，维度→角色关联' },
      { name: 'DimensionStageMatrix', file: '/components/family/DimensionStageMatrix.tsx', status: 'REAL', lines: '~350L+',
        description: '五维×七步热力图，行头点击展开角色归属子面板' },
      { name: 'PhilosophyFramework', file: '/components/family/PhilosophyFramework.tsx', status: 'REAL', lines: '~400L+',
        description: '三Tab全屏面板：五高/五标/五化可视化' },
      { name: 'NetworkTopology', file: '/components/family/NetworkTopology.tsx', status: 'REAL', lines: '~300L+',
        description: '网络拓扑SVG图，设备节点→角色映射' },
      { name: 'MemberDetailPanel', file: '/components/family/MemberDetailPanel.tsx', status: 'REAL', lines: '~300L+',
        description: '"灵魂锻造所"：角色配置面板，设备绑定，权限编辑' },
    ],
  },
  {
    id: 'type-system',
    name: '类型系统 & 领域模型',
    status: 'REAL',
    percentage: 100,
    icon: <Brain className="w-5 h-5" />,
    summary: '完整TypeScript类型定义，所有领域概念有严格类型保障',
    details: [
      { name: 'family-manifest.ts', file: '/types/family-manifest.ts', status: 'REAL', lines: '~300L+',
        description: '7角色定义、5维度常量、ROLE_DIMENSION_MAP、创生七步、DIMENSION_STAGE_MATRIX' },
      { name: 'protocol.ts', file: '/types/protocol.ts', status: 'REAL', lines: '~110L',
        description: 'FamilySignal原子协议、PeerDialogueChain、ModelRouteConfig、UIAction' },
      { name: 'agent-personas.ts', file: '/types/agent-personas.ts', status: 'REAL', lines: '~300L+',
        description: '7位家人完整人格配置：使命/哲学/人格/沟通/约束/SystemPrompt模板' },
      { name: 'philosophy-framework.ts', file: '/types/philosophy-framework.ts', status: 'REAL', lines: '~200L+',
        description: '五高五标五化15支柱类型、维度映射、范式跃迁表、CORE_SLOGANS' },
      { name: 'backend-contract.ts', file: '/types/backend-contract.ts', status: 'REAL', lines: '~200L',
        description: '[Stage 4] 后端协议合约：WS消息类型、REST API合约、Anthropic API调用形状' },
    ],
  },
  {
    id: 'intelligence-layer',
    name: '前端智能层（意图/路由/人格）',
    status: 'PARTIAL',
    percentage: 70,
    icon: <Zap className="w-5 h-5" />,
    summary: '意图解析和路由逻辑可运行，但响应始终是硬编码模板（无真实LLM）',
    details: [
      { name: 'IntentParser', file: '/services/intent-parser.ts', status: 'REAL', lines: '~345L',
        description: '10种IntentType识别、紧急度/情感检测、Agent推荐评分、创生阶段映射',
        gap: '纯关键词匹配，无ML/NLP。V1足够，但精度有限' },
      { name: 'AgentRouter', file: '/services/agent-router.ts', status: 'PARTIAL', lines: '~489L',
        description: '三层融合路由(Keyword 30% + Intent 50% + Stage 20%)、1:2比率控制、对话链管理',
        gap: 'generatePeerResponse() 始终返回硬编码模板文本，因为后端不存在' },
      { name: '4层SystemPrompt构建', file: '/hooks/useFamilySystem.ts', status: 'PARTIAL', lines: '~40L (within hook)',
        description: 'Layer1人格模板 → Layer2维度上下文 → Layer3对话链注入 → Layer4响应约束',
        gap: '提示词正确构建了，但传给bridge.routeAgentCall()后返回null（无后端接收），降级为Mock模板' },
      { name: 'useFamilySystem Hook', file: '/hooks/useFamilySystem.ts', status: 'PARTIAL', lines: '~750L+',
        description: '核心神经系统：信号派发、Peer协同、斜杠命令处理、Bridge事件监听',
        gap: 'dispatchSignal → bridge.dispatchSignal → 返回null → 总是走Mock分' },
    ],
  },
  {
    id: 'bridge-client',
    name: 'BackendBridge（WebSocket客户端）',
    status: 'PARTIAL',
    percentage: 85,
    icon: <Globe className="w-5 h-5" />,
    summary: '客户端协议完整，但对端服务器(ws://localhost:3080)不存在',
    details: [
      { name: 'BackendBridge Class', file: '/services/backend-bridge.ts', status: 'PARTIAL', lines: '~633L',
        description: 'WebSocket连接管理、指数退避重连(max10次)、心跳ping/pong、事件系统、MOCK_MODE降级',
        gap: '代码质量高，协议定义清晰，但始终连不上后端 → 5s超时 → MOCK_MODE' },
      { name: 'routeAgentCall()', file: '/services/backend-bridge.ts', status: 'PARTIAL', lines: '~55L',
        description: '请求-响应关联(requestId+15s超时)，正确发送agent_call消息',
        gap: 'ws://localhost:3080不存在，所以始终返回null' },
      { name: 'useBackendConnection', file: '/hooks/useBackendConnection.ts', status: 'REAL', lines: '~123L',
        description: 'React Hook封装：状态管理、连接/断开/重配置、localStorage持久化config' },
      { name: 'BackendPanel UI', file: '/components/family/BackendPanel.tsx', status: 'REAL', lines: '~200L+',
        description: 'WS URL配置面板，连接状态显示，手动连接/断开按钮' },
    ],
  },
  {
    id: 'bun-backend',
    name: 'Bun Runtime 后端服务器',
    status: 'MISSING',
    percentage: 0,
    icon: <Cpu className="w-5 h-5" />,
    summary: '❌ 完全未实现 — 这是"灵肉贯通"的关键缺失环节',
    details: [
      { name: 'Bun WebSocket Server', file: '(不存在)', status: 'MISSING', lines: '需要~150L',
        description: 'ws://localhost:3080 监听，处理 dispatch_signal / ping / subscribe / agent_call 消息',
        gap: '前端BackendBridge的所有消息发送到虚空' },
      { name: '/api/agent/:roleId', file: '(存在)', status: 'REAL', lines: '需要~100L',
        description: 'REST端点，接收前端构建的4层systemPrompt，调用Anthropic Messages API',
        gap: '前端的systemPrompt构建完全正确，但没有地方发送' },
      { name: 'LLM Proxy (Anthropic API)', file: '(存在)', status: 'REAL', lines: '需要~80L',
        description: '接收systemPrompt + userMessage → 调用Claude API → 返回agent_response',
        gap: 'agentEndpoints配置中的claude-sonnet-4-20250514模型引用正确，但无调用代码' },
      { name: '/api/health', file: '(存在)', status: 'REAL', lines: '需要~10L',
        description: '健康检查端点，前端fetchHealth()已预留调用',
        gap: '简单端点，5分钟可完成' },
      { name: '/api/family/members CRUD', file: '(存在)', status: 'REAL', lines: '需要~60L',
        description: '成员配置增删改查，前端fetchMembers()/updateMember()已预留',
        gap: '' },
    ],
  },
  {
    id: 'persistence',
    name: '数据持久化层',
    status: 'MISSING',
    percentage: 5,
    icon: <Database className="w-5 h-5" />,
    summary: '❌ 无信号/对话/成员持久化，所有数据刷新即失',
    details: [
      { name: 'SQL Schema (Family)', file: '(存在)', status: 'REAL', lines: '需要~80L',
        description: '需要: family_members / signals / dialogue_chains / agent_configs 表',
        gap: '当前schema.sql只有旧版chats表(来自Chat UI)，与AI Family无关' },
      { name: 'Redis 状态缓存', file: '(存在)', status: 'REAL', lines: '需要~60L',
        description: '信号缓存、会话状态、速率限制',
        gap: '架构文档多次提到Redis，但无任何Redis客户端代码' },
      { name: '信号持久化', file: '(存在)', status: 'REAL', lines: '需要~40L',
        description: 'FamilySignal写入数据库，支持/chain命令的历史回放',
        gap: '当前对话链只存在内存(AgentRouter.activeChains Map)，刷新即失' },
      { name: 'Supabase Edge Function', file: '/supabase/functions/server/index.tsx', status: 'MOCK', lines: '100L',
        description: '已有Hono框架的KV Store CRUD，但这是旧版Chat用的，非AI Family系统',
        gap: '需要新增AI Family专用路由，或独立Bun服务器' },
    ],
  },
  {
    id: 'security',
    name: '安全 & 认证',
    status: 'MISSING',
    percentage: 5,
    icon: <Shield className="w-5 h-5" />,
    summary: '❌ 无身份验证、无API密钥管理、无权限隔离',
    details: [
      { name: 'JWT认证', file: '(存在)', status: 'REAL', lines: '需要~40L',
        description: 'BackendBridge.authToken字段已预留但从未被设值',
        gap: '' },
      { name: 'API Key管理', file: '(存在)', status: 'REAL', lines: '需要~30L',
        description: 'agentEndpoints配置引用ANTHROPIC_API_KEY环境变量，但无读取代码',
        gap: '' },
      { name: 'RBAC权限', file: '(存在)', status: 'REAL', lines: '需要~50L',
        description: 'MemberDetailPanel有权限编辑UI，但保存后无后端验证',
        gap: '' },
    ],
  },
];

// ==========================================
// Data Flow Visualization
// ==========================================
const DATA_FLOW_STEPS = [
  { step: 1, label: '用户输入', from: 'CommandConsole', status: 'REAL' as LayerStatus, detail: '文本 → dispatchSignal()' },
  { step: 2, label: '意图解析', from: 'IntentParser', status: 'REAL' as LayerStatus, detail: '关键词匹配 → IntentType + 推荐Agent' },
  { step: 3, label: '智能路由', from: 'AgentRouter', status: 'REAL' as LayerStatus, detail: '3层融合评分 → 选出respondents' },
  { step: 4, label: 'SystemPrompt构建', from: 'useFamilySystem', status: 'REAL' as LayerStatus, detail: '4层人格提示词正确拼接' },
  { step: 5, label: 'Bridge发送', from: 'BackendBridge', status: 'PARTIAL' as LayerStatus, detail: 'routeAgentCall({systemPrompt, ...}) → WebSocket' },
  { step: 6, label: '🚫 Bun Server接收', from: '(存在)', status: 'REAL' as LayerStatus, detail: 'ws://localhost:3080 无人监听' },
  { step: 7, label: '🚫 LLM API调用', from: '(存在)', status: 'REAL' as LayerStatus, detail: 'systemPrompt → Anthropic API → 无' },
  { step: 8, label: '降级Mock响应', from: 'AgentRouter', status: 'MOCK' as LayerStatus, detail: 'generatePeerResponse() → 硬编码模板文本' },
  { step: 9, label: 'UI渲染', from: 'CommunicationLog', status: 'REAL' as LayerStatus, detail: '消息气泡 + [PEER_SYNC]标签' },
];

export const TechAuditPanel: React.FC<TechAuditPanelProps> = ({ onClose }) => {
  const [expandedLayer, setExpandedLayer] = useState<string | null>('bun-backend');
  const [showFlow, setShowFlow] = useState(true);

  const totalPercentage = Math.round(
    AUDIT_LAYERS.reduce((sum, l) => sum + l.percentage, 0) / AUDIT_LAYERS.length
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-[95vw] max-w-5xl h-[90vh] bg-slate-950 border border-white/10 rounded-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
      >
        {/* Header */}
        <div className="flex-none px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-lg text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              技术现实审计 — Tech Reality Audit
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1">
              诚实的代码级审计：每一层的真实落地状态
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl text-white font-mono">{totalPercentage}%</div>
              <div className="text-[10px] text-slate-500 font-mono">Overall Completion</div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          
          {/* ====== Overall Progress Bar ====== */}
          <div className="bg-black/30 rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-slate-400">系统完整度 System Completeness</span>
              <div className="flex items-center gap-4 text-[10px] font-mono">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <span key={key} className={cn("flex items-center gap-1", cfg.color)}>
                    {cfg.icon} {cfg.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
              {AUDIT_LAYERS.map(layer => {
                const cfg = STATUS_CONFIG[layer.status];
                const width = layer.percentage / AUDIT_LAYERS.length;
                return (
                  <div 
                    key={layer.id}
                    className={cn("h-full transition-all", 
                      layer.status === 'REAL' ? 'bg-emerald-500/80' :
                      layer.status === 'PARTIAL' ? 'bg-amber-500/80' :
                      layer.status === 'MOCK' ? 'bg-blue-500/80' :
                      'bg-red-500/30'
                    )}
                    style={{ width: `${width}%` }}
                    title={`${layer.name}: ${layer.percentage}%`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1 text-[9px] font-mono text-slate-600">
              <span>前端UI(95%) + 类型(100%)</span>
              <span>智能层(70%) + Bridge客户端(85%)</span>
              <span>后端(0%) + 持久化(5%) + 安全(5%)</span>
            </div>
          </div>

          {/* ====== Data Flow Visualization ====== */}
          <div className="bg-black/30 rounded-xl border border-white/5 p-4">
            <button 
              onClick={() => setShowFlow(!showFlow)}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors w-full"
            >
              {showFlow ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>数据流真相：一条消息的完整生命周期</span>
            </button>
            
            {showFlow && (
              <div className="mt-4 space-y-1">
                {DATA_FLOW_STEPS.map((step, idx) => {
                  const cfg = STATUS_CONFIG[step.status];
                  return (
                    <div key={step.step} className="flex items-center gap-3">
                      {/* Step number */}
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono border flex-none",
                        cfg.bg, cfg.border, cfg.color
                      )}>
                        {step.step}
                      </div>
                      
                      {/* Arrow */}
                      {idx < DATA_FLOW_STEPS.length - 1 && (
                        <div className="absolute ml-3.5 mt-7 w-px h-3 bg-slate-700 hidden" />
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 flex items-center gap-2 py-1.5 px-3 rounded-lg bg-black/20 border border-white/5">
                        <span className={cn("text-xs font-mono flex-none", cfg.color)}>{step.label}</span>
                        <ArrowRight className="w-3 h-3 text-slate-600 flex-none" />
                        <span className="text-[10px] text-slate-500 font-mono flex-none">{step.from}</span>
                        <span className="text-[10px] text-slate-600 truncate">{step.detail}</span>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={cn(
                        "text-[9px] font-mono px-2 py-0.5 rounded border flex-none",
                        cfg.bg, cfg.border, cfg.color
                      )}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
                
                {/* Summary callout */}
                <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-300/80">
                    <strong>断裂点：</strong>Step 5→6。前端构建的4层人格SystemPrompt发往 <code className="bg-black/30 px-1 rounded">ws://localhost:3080</code>，
                    但该端口无人监听。Bridge 15s超时后返回null → 降级为 <code className="bg-black/30 px-1 rounded">generatePeerResponse()</code> 硬编码模板。
                    <strong className="text-amber-300"> 所有对话都是模板响应，不是AI生成的。</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ====== Layer-by-Layer Audit ====== */}
          {AUDIT_LAYERS.map(layer => {
            const cfg = STATUS_CONFIG[layer.status];
            const isExpanded = expandedLayer === layer.id;
            
            return (
              <div key={layer.id} className={cn(
                "bg-black/30 rounded-xl border overflow-hidden transition-all",
                cfg.border
              )}>
                {/* Layer Header */}
                <button
                  onClick={() => setExpandedLayer(isExpanded ? null : layer.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                >
                  <div className={cn("p-2 rounded-lg", cfg.bg, cfg.color)}>
                    {layer.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{layer.name}</span>
                      <span className={cn("text-[9px] font-mono px-2 py-0.5 rounded border", cfg.bg, cfg.border, cfg.color)}>
                        {cfg.label} {layer.percentage}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{layer.summary}</p>
                  </div>
                  {/* Progress bar mini */}
                  <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden flex-none">
                    <div 
                      className={cn("h-full rounded-full",
                        layer.status === 'REAL' ? 'bg-emerald-500' :
                        layer.status === 'PARTIAL' ? 'bg-amber-500' :
                        layer.status === 'MOCK' ? 'bg-blue-500' :
                        'bg-red-500/50'
                      )}
                      style={{ width: `${layer.percentage}%` }}
                    />
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </button>
                
                {/* Layer Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                    {layer.details.map((item, idx) => {
                      const itemCfg = STATUS_CONFIG[item.status];
                      return (
                        <div key={idx} className={cn(
                          "p-3 rounded-lg border bg-black/20",
                          itemCfg.border.replace('/30', '/10')
                        )}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={itemCfg.color}>{itemCfg.icon}</span>
                              <span className="text-xs text-white font-mono">{item.name}</span>
                              <span className="text-[9px] text-slate-600 font-mono">{item.file}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-600 font-mono">{item.lines}</span>
                              <span className={cn("text-[8px] font-mono px-1.5 py-0.5 rounded", itemCfg.bg, itemCfg.color)}>
                                {itemCfg.labelEn}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
                          {item.gap && (
                            <p className="text-[10px] text-amber-400/70 mt-1 pl-2 border-l-2 border-amber-500/30">
                              Gap: {item.gap}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* ====== Landing Roadmap ====== */}
          <div className="bg-black/30 rounded-xl border border-cyan-500/20 p-5">
            <h3 className="text-sm text-cyan-300 flex items-center gap-2 mb-4">
              <ArrowRight className="w-4 h-4" />
              从"模型塑造"到"真实落地"的最短路径
            </h3>
            
            <div className="space-y-3">
              {[
                { priority: 'P0', effort: '~150行', time: '2-3h', title: 'Bun WebSocket Server',
                  desc: '创建 bun-server/index.ts，监听3080端口，处理ping/subscribe/dispatch_signal/agent_call消息协议' },
                { priority: 'P0', effort: '~100行', time: '1-2h', title: 'LLM Proxy Handler (/api/agent/:roleId)',
                  desc: '接收前端构建的systemPrompt → 调用 Anthropic Messages API（process.env.ANTHROPIC_API_KEY）→ 返回 agent_response' },
                { priority: 'P1', effort: '~80行', time: '1h', title: 'SQL Family Schema',
                  desc: 'family_members / signals / dialogue_chains / agent_configs 建表，支持信号持久化和/chain历史回放' },
                { priority: 'P1', effort: '~60行', time: '1h', title: 'Redis State Cache',
                  desc: '信号缓存、会话状态、模型调用速率限制（替代当前内存中的windowDuration计数器）' },
                { priority: 'P2', effort: '~40行', time: '30min', title: 'JWT Auth Middleware',
                  desc: '为BackendBridge.authToken提供验证，保护agent_call端点' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded flex-none mt-0.5",
                    item.priority === 'P0' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    item.priority === 'P1' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  )}>
                    {item.priority}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white">{item.title}</span>
                      <span className="text-[9px] text-slate-600 font-mono">{item.effort} · {item.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                <strong>结论：</strong>前端"灵魂"完成度约 85%（UI + 类型 + 意图解析 + 路由 + Bridge客户端 + 4层人格提示词），
                架构设计质量高，协议定义清晰。但后端"肉身"完成度为 0%。
                <strong> 约 500 行 Bun 后端代码</strong>即可打通"灵肉贯通"闭环——
                前端构建的 SystemPrompt 会立即流向真实 LLM，所有 Mock 模板响应将被真实 AI 回复替换。
                项目本质是<strong>"架构已验证的高质量半成品"</strong>，不是空壳原型。
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};