/**
 * file: BackendPanel.tsx
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
 * YYC³ AI Family - BackendPanel v2 (灵肉对接·六子系统运维中枢)
 * 
 * Comprehensive backend operations center:
 *   Tab 1: Overview    — /api/health + /api/config (server health, subsystems, LLM)
 *   Tab 2: LLM        — /api/llm/providers (model chain, primary/fallback status)
 *   Tab 3: MCP        — /api/mcp/tools, /resources, /prompts
 *   Tab 4: Workflow    — /api/workflow/list + /instances
 *   Tab 5: Plugins    — /api/plugin/list + /tools
 *   Tab 6: IDE Bridge — /api/ide/overview + /git/status
 *   Tab 7: Config     — Connection reconfiguration + quick setup guide
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Wifi, WifiOff, Activity, Server, Database,
  Zap, RefreshCw, Settings, Check, AlertTriangle,
  Radio, Cable, Timer, Gauge, ChevronDown, ChevronUp,
  Cpu, Network, Package, GitBranch, Workflow, Brain,
  HardDrive, Eye, Play, Pause, CheckCircle2, XCircle,
  Loader2, ArrowUpDown, Shield, Terminal, BookOpen,
  Layers, BarChart3, Clock, Hash, Wrench, FileCode,
  Plug, Bot, Route, Boxes
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { ConnectionStatus, ConnectionState, BackendConfig, DEFAULT_CONFIG } from '../../services/backend-bridge';
import { ENDPOINTS } from '../../config/endpoints';

// ==========================================
// Types
// ==========================================

interface BackendPanelProps {
  status: ConnectionStatus | null;
  config: BackendConfig;
  onReconfigure: (config: Partial<BackendConfig>) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onClose: () => void;
}

type TabId = 'overview' | 'llm' | 'mcp' | 'workflow' | 'plugins' | 'ide' | 'config';

interface LLMProviders {
  [key: string]: { configured: boolean; model: string; endpoint?: string };
}

interface HealthData {
  status: string;
  version: string;
  uptime: number;
  services: { websocket: boolean; redis: boolean; postgresql: boolean };
  subsystems: Record<string, boolean>;
  llm: { primary: string; fallback: string; providers: LLMProviders; ratio: string };
  connectedClients: number;
  timestamp: number;
}

interface ServerConfig {
  port: number;
  host: string;
  environment: string;
}

interface LLMProviderSetting {
  configured?: boolean;
  enabled?: boolean;
  model?: string;
  endpoint?: string;
}

interface LLMConfig {
  primary: string;
  fallback: string;
  ratio: string;
  [key: string]: string | LLMProviderSetting | undefined;
}

interface MCPConfig {
  enabled: boolean;
  tools: string[];
}

interface WorkflowConfig {
  enabled: boolean;
  maxConcurrent: number;
}

interface PluginConfig {
  enabled: boolean;
  directory: string;
}

interface KBConfig {
  enabled: boolean;
  provider: string;
}

interface IDEConfig {
  enabled: boolean;
  port: number;
}

interface ConfigData {
  server: ServerConfig;
  llm: LLMConfig;
  mcp: MCPConfig;
  workflow: WorkflowConfig;
  plugin: PluginConfig;
  kb: KBConfig;
  ide: IDEConfig;
}

interface FamilyMember {
  roleId: string;
  isOnline: boolean;
  currentActivity: string;
  mood: string;
}

interface MCPTool {
  name?: string;
  id?: string;
  description?: string;
}

interface MCPResource {
  uri?: string;
  name?: string;
  description?: string;
}

interface MCPPrompt {
  name?: string;
  description?: string;
}

interface WorkflowDef {
  id?: string;
  name?: string;
  description?: string;
  steps?: number | unknown[];
}

interface WorkflowInstance {
  id?: string;
  workflowId?: string;
  status?: string;
  currentStep?: number;
  totalSteps?: number;
}

interface PluginInfo {
  id?: string;
  name?: string;
  version?: string;
  enabled?: boolean;
  description?: string;
}

interface PluginTool {
  name?: string;
  id?: string;
  description?: string;
  pluginId?: string;
}

interface ProviderStatus {
  name: string;
  configured: boolean;
  model: string;
  endpoint?: string;
  status?: string;
}

interface IDEOverview {
  projectRoot?: string;
  files?: number;
  openFiles?: string[];
  diagnostics?: { errors: number; warnings: number };
}

interface GitStatusData {
  branch?: string;
  clean?: boolean;
  ahead?: number;
  behind?: number;
  staged?: string[];
  unstaged?: string[];
  untracked?: string[];
}

interface LLMProvidersData {
  primary?: string;
  fallback?: string;
  providers?: Record<string, ProviderStatus>;
}

// ==========================================
// State Config
// ==========================================

const STATE_CONFIG: Record<ConnectionState, { color: string; icon: React.ReactNode; label: string; bgGlow: string }> = {
  'CONNECTED': {
    color: 'text-emerald-400',
    icon: <Wifi className="w-4 h-4" />,
    label: 'NEURAL_LINK_ACTIVE',
    bgGlow: 'rgba(16, 185, 129, 0.08)'
  },
  'CONNECTING': {
    color: 'text-yellow-400',
    icon: <RefreshCw className="w-4 h-4 animate-spin" />,
    label: 'ESTABLISHING_LINK...',
    bgGlow: 'rgba(234, 179, 8, 0.08)'
  },
  'DISCONNECTED': {
    color: 'text-slate-500',
    icon: <WifiOff className="w-4 h-4" />,
    label: 'LINK_SEVERED',
    bgGlow: 'rgba(100, 116, 139, 0.08)'
  },
  'DEGRADED': {
    color: 'text-orange-400',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'DEGRADED_MODE',
    bgGlow: 'rgba(251, 146, 60, 0.08)'
  },
  'MOCK_MODE': {
    color: 'text-blue-400',
    icon: <Radio className="w-4 h-4" />,
    label: 'SIMULATION_MODE',
    bgGlow: 'rgba(59, 130, 246, 0.08)'
  },
};

const TAB_CONFIG: { id: TabId; label: string; icon: React.ReactNode; shortLabel: string }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-3.5 h-3.5" />, shortLabel: 'OVW' },
  { id: 'llm', label: 'LLM Chain', icon: <Brain className="w-3.5 h-3.5" />, shortLabel: 'LLM' },
  { id: 'mcp', label: 'MCP Tools', icon: <Wrench className="w-3.5 h-3.5" />, shortLabel: 'MCP' },
  { id: 'workflow', label: 'Workflows', icon: <Route className="w-3.5 h-3.5" />, shortLabel: 'WFL' },
  { id: 'plugins', label: 'Plugins', icon: <Plug className="w-3.5 h-3.5" />, shortLabel: 'PLG' },
  { id: 'ide', label: 'IDE Bridge', icon: <FileCode className="w-3.5 h-3.5" />, shortLabel: 'IDE' },
  { id: 'config', label: 'Config', icon: <Settings className="w-3.5 h-3.5" />, shortLabel: 'CFG' },
];

// ==========================================
// Main Component
// ==========================================

export const BackendPanel: React.FC<BackendPanelProps> = ({
  status,
  config,
  onReconfigure,
  onConnect,
  onDisconnect,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [providers, setProviders] = useState<LLMProvidersData | null>(null);
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
  const [mcpResources, setMcpResources] = useState<MCPResource[]>([]);
  const [mcpPrompts, setMcpPrompts] = useState<MCPPrompt[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDef[]>([]);
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstance[]>([]);
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [pluginTools, setPluginTools] = useState<PluginTool[]>([]);
  const [ideOverview, setIdeOverview] = useState<IDEOverview | null>(null);
  const [gitStatus, setGitStatus] = useState<GitStatusData | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [editConfig, setEditConfig] = useState({ wsUrl: config.wsUrl, apiUrl: config.apiUrl });
  const [isSaving, setIsSaving] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const state = status?.state || 'DISCONNECTED';
  const stateInfo = STATE_CONFIG[state];
  const apiUrl = config.apiUrl || ENDPOINTS.API_BASE;

  // ---- API Fetch Helper ----
  const fetchApi = useCallback(async (path: string, options?: RequestInit) => {
    try {
      const res = await fetch(`${apiUrl}${path}`, {
        ...options,
        signal: AbortSignal.timeout(5000),
        headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  }, [apiUrl]);

  // ---- Data Loaders ----
  const loadOverview = useCallback(async () => {
    setLoading(p => ({ ...p, overview: true }));
    const [health, cfg, members] = await Promise.all([
      fetchApi('/api/health'),
      fetchApi('/api/config'),
      fetchApi('/api/family/members'),
    ]);
    if (health) setHealthData(health);
    if (cfg) setConfigData(cfg);
    if (members?.members) setFamilyMembers(members.members);
    setLastRefresh(Date.now());
    setLoading(p => ({ ...p, overview: false }));
  }, [fetchApi]);

  const loadLLM = useCallback(async () => {
    setLoading(p => ({ ...p, llm: true }));
    const data = await fetchApi('/api/llm/providers');
    if (data) setProviders(data);
    setLoading(p => ({ ...p, llm: false }));
  }, [fetchApi]);

  const loadMCP = useCallback(async () => {
    setLoading(p => ({ ...p, mcp: true }));
    const [tools, resources, prompts] = await Promise.all([
      fetchApi('/api/mcp/tools'),
      fetchApi('/api/mcp/resources'),
      fetchApi('/api/mcp/prompts'),
    ]);
    if (tools?.tools) setMcpTools(tools.tools);
    if (resources?.resources) setMcpResources(resources.resources);
    if (prompts?.prompts) setMcpPrompts(prompts.prompts);
    setLoading(p => ({ ...p, mcp: false }));
  }, [fetchApi]);

  const loadWorkflows = useCallback(async () => {
    setLoading(p => ({ ...p, workflow: true }));
    const [wfList, instances] = await Promise.all([
      fetchApi('/api/workflow/list'),
      fetchApi('/api/workflow/instances'),
    ]);
    if (wfList?.workflows) setWorkflows(wfList.workflows);
    if (instances?.instances) setWorkflowInstances(instances.instances);
    setLoading(p => ({ ...p, workflow: false }));
  }, [fetchApi]);

  const loadPlugins = useCallback(async () => {
    setLoading(p => ({ ...p, plugins: true }));
    const [list, tools] = await Promise.all([
      fetchApi('/api/plugin/list'),
      fetchApi('/api/plugin/tools'),
    ]);
    if (list?.plugins) setPlugins(list.plugins);
    if (tools?.tools) setPluginTools(tools.tools);
    setLoading(p => ({ ...p, plugins: false }));
  }, [fetchApi]);

  const loadIDE = useCallback(async () => {
    setLoading(p => ({ ...p, ide: true }));
    const [overview, git] = await Promise.all([
      fetchApi('/api/ide/overview'),
      fetchApi('/api/ide/git/status'),
    ]);
    if (overview) setIdeOverview(overview);
    if (git) setGitStatus(git);
    setLoading(p => ({ ...p, ide: false }));
  }, [fetchApi]);

  // ---- Load data on tab change ----
  useEffect(() => {
    const loaders: Record<TabId, () => Promise<void>> = {
      overview: loadOverview,
      llm: loadLLM,
      mcp: loadMCP,
      workflow: loadWorkflows,
      plugins: loadPlugins,
      ide: loadIDE,
      config: async () => {},
    };
    loaders[activeTab]();
  }, [activeTab, loadOverview, loadLLM, loadMCP, loadWorkflows, loadPlugins, loadIDE]);

  // ---- Auto-poll overview every 10s ----
  useEffect(() => {
    if (activeTab === 'overview') {
      pollingRef.current = setInterval(loadOverview, 10000);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }
  }, [activeTab, loadOverview]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    onReconfigure(editConfig);
    await new Promise(r => setTimeout(r, 600));
    setIsSaving(false);
  };

  const formatUptime = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
  };

  // ==========================================
  // Tab Content Renderers
  // ==========================================

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Server Health Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <MiniMetric
          icon={<Server className="w-3.5 h-3.5" />}
          label="VERSION"
          value={healthData?.version || '--'}
          color="cyan"
        />
        <MiniMetric
          icon={<Clock className="w-3.5 h-3.5" />}
          label="UPTIME"
          value={healthData ? formatUptime(healthData.uptime) : '--'}
          color="emerald"
        />
        <MiniMetric
          icon={<Activity className="w-3.5 h-3.5" />}
          label="CLIENTS"
          value={String(healthData?.connectedClients ?? '--')}
          color="violet"
        />
        <MiniMetric
          icon={<Timer className="w-3.5 h-3.5" />}
          label="LATENCY"
          value={status?.latency !== undefined && status.latency >= 0 ? `${status.latency}ms` : '--'}
          color={!status?.latency ? 'slate' : status.latency < 50 ? 'emerald' : status.latency < 200 ? 'amber' : 'red'}
        />
      </div>

      {/* Subsystems Grid */}
      <div>
        <SectionTitle icon={<Boxes className="w-3.5 h-3.5" />} title="SUBSYSTEMS" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {healthData?.subsystems && Object.entries(healthData.subsystems).map(([name, enabled]) => (
            <div
              key={name}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-xl border transition-colors",
                enabled
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-slate-800/30 border-white/5 opacity-50"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", enabled ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-slate-600")} />
              <span className="text-[11px] font-mono text-slate-300 uppercase">{name}</span>
              <span className={cn("ml-auto text-[9px] font-mono", enabled ? "text-emerald-400" : "text-slate-600")}>
                {enabled ? 'ON' : 'OFF'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Services Status */}
      <div>
        <SectionTitle icon={<Database className="w-3.5 h-3.5" />} title="INFRASTRUCTURE" />
        <div className="grid grid-cols-3 gap-2 mt-2">
          {healthData?.services && Object.entries(healthData.services).map(([name, ok]) => (
            <div
              key={name}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-xl border",
                ok ? "bg-blue-500/5 border-blue-500/20" : "bg-red-500/5 border-red-500/20"
              )}
            >
              {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
              <span className="text-[11px] font-mono text-slate-300 uppercase">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LLM Quick Info */}
      {healthData?.llm && (
        <div>
          <SectionTitle icon={<Brain className="w-3.5 h-3.5" />} title="LLM ROUTING" />
          <div className="mt-2 p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Primary</span>
              <span className="text-xs font-mono text-violet-300">{healthData.llm.primary}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Fallback</span>
              <span className="text-xs font-mono text-blue-300">{healthData.llm.fallback}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Ratio</span>
              <span className="text-xs font-mono text-amber-300">{healthData.llm.ratio}</span>
            </div>
          </div>
        </div>
      )}

      {/* Family Members Quick */}
      {familyMembers.length > 0 && (
        <div>
          <SectionTitle icon={<Bot className="w-3.5 h-3.5" />} title={`FAMILY (${familyMembers.length} AGENTS)`} />
          <div className="grid grid-cols-1 gap-1.5 mt-2">
            {familyMembers.map((m: FamilyMember) => (
              <div key={m.roleId} className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                <div className={cn("w-2 h-2 rounded-full", m.isOnline ? "bg-emerald-400" : "bg-red-400")} />
                <span className="text-[11px] font-mono text-slate-300 w-32 truncate">{m.roleId}</span>
                <span className="text-[10px] text-slate-500 truncate flex-1">{m.currentActivity}</span>
                <span className={cn(
                  "text-[9px] font-mono px-1.5 py-0.5 rounded",
                  m.mood === 'FOCUSED' ? 'bg-amber-500/10 text-amber-400' :
                    m.mood === 'EXCITED' ? 'bg-pink-500/10 text-pink-400' :
                      m.mood === 'LOVING' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-cyan-500/10 text-cyan-400'
                )}>{m.mood}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!healthData && !loading.overview && (
        <EmptyState message="无法连接后端。请确认 Bun Server 已启动。" />
      )}
    </div>
  );

  const renderLLM = () => (
    <div className="space-y-4">
      <SectionTitle icon={<Brain className="w-3.5 h-3.5" />} title="LLM PROVIDER CHAIN" />

      {configData?.llm ? (
        <div className="space-y-3">
          {/* Primary / Fallback Header */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
              <div className="text-[9px] font-mono text-violet-400/60 uppercase mb-1">Primary Engine</div>
              <div className="text-sm font-mono text-violet-300">{configData.llm.primary}</div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">Ratio: {configData.llm.ratio}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <div className="text-[9px] font-mono text-blue-400/60 uppercase mb-1">Fallback Engine</div>
              <div className="text-sm font-mono text-blue-300">{configData.llm.fallback}</div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">Auto-failover enabled</div>
            </div>
          </div>

          {/* Provider Cards */}
          <div className="space-y-2">
            {['deepseek', 'ollama', 'anthropic', 'openai', 'qwen'].map(providerName => {
              const prov = configData.llm[providerName];
              if (!prov || typeof prov === 'string') return null;
              const isConfigured = prov.configured ?? prov.enabled ?? false;
              const isPrimary = configData.llm.primary?.toLowerCase().includes(providerName);
              const isFallback = configData.llm.fallback?.toLowerCase().includes(providerName);
              return (
                <div
                  key={providerName}
                  className={cn(
                    "p-3 rounded-xl border flex items-center gap-3 transition-colors",
                    isPrimary ? "bg-violet-500/8 border-violet-500/25" :
                      isFallback ? "bg-blue-500/8 border-blue-500/25" :
                        isConfigured ? "bg-emerald-500/5 border-emerald-500/15" :
                          "bg-slate-800/30 border-white/5 opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold border",
                    isPrimary ? "bg-violet-500/20 text-violet-300 border-violet-500/30" :
                      isFallback ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                        isConfigured ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" :
                          "bg-slate-800 text-slate-500 border-white/5"
                  )}>
                    {providerName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-white capitalize">{providerName}</span>
                      {isPrimary && <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono uppercase">Primary</span>}
                      {isFallback && <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono uppercase">Fallback</span>}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                      Model: {typeof prov !== 'string' ? (prov.model || 'N/A') : 'N/A'}
                    </div>
                  </div>
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    isConfigured ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "bg-slate-600"
                  )} />
                </div>
              );
            })}
          </div>

          {/* Raw Provider Health (if fetched) */}
          {providers && (
            <div className="mt-3">
              <SectionTitle icon={<Activity className="w-3.5 h-3.5" />} title="LIVE HEALTH CHECK" />
              <pre className="mt-2 p-3 rounded-xl bg-black/40 border border-white/5 text-[10px] font-mono text-slate-400 overflow-x-auto max-h-40 overflow-y-auto">
                {JSON.stringify(providers, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <EmptyState message="LLM 配置未获取。点击刷新按钮或确认后端已启动。" />
      )}
    </div>
  );

  const renderMCP = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <MiniMetric icon={<Wrench className="w-3.5 h-3.5" />} label="TOOLS" value={String(mcpTools.length)} color="cyan" />
        <MiniMetric icon={<Database className="w-3.5 h-3.5" />} label="RESOURCES" value={String(mcpResources.length)} color="blue" />
        <MiniMetric icon={<BookOpen className="w-3.5 h-3.5" />} label="PROMPTS" value={String(mcpPrompts.length)} color="violet" />
      </div>

      {/* Tools List */}
      {mcpTools.length > 0 && (
        <div>
          <SectionTitle icon={<Wrench className="w-3.5 h-3.5" />} title="REGISTERED TOOLS" />
          <div className="space-y-1.5 mt-2">
            {mcpTools.map((tool: MCPTool, i: number) => (
              <div key={i} className="p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/15 hover:border-cyan-500/30 transition-colors">
                <div className="text-xs font-mono text-cyan-300">{tool.name || tool.id || `Tool #${i + 1}`}</div>
                {tool.description && <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{tool.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources List */}
      {mcpResources.length > 0 && (
        <div>
          <SectionTitle icon={<Database className="w-3.5 h-3.5" />} title="RESOURCES" />
          <div className="space-y-1.5 mt-2">
            {mcpResources.map((res: MCPResource, i: number) => (
              <div key={i} className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
                <div className="text-xs font-mono text-blue-300">{res.uri || res.name || `Resource #${i + 1}`}</div>
                {res.description && <div className="text-[10px] text-slate-500 mt-0.5">{res.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompts List */}
      {mcpPrompts.length > 0 && (
        <div>
          <SectionTitle icon={<BookOpen className="w-3.5 h-3.5" />} title="PROMPT TEMPLATES" />
          <div className="space-y-1.5 mt-2">
            {mcpPrompts.map((p: MCPPrompt, i: number) => (
              <div key={i} className="p-2.5 rounded-xl bg-violet-500/5 border border-violet-500/15">
                <div className="text-xs font-mono text-violet-300">{p.name || `Prompt #${i + 1}`}</div>
                {p.description && <div className="text-[10px] text-slate-500 mt-0.5">{p.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {mcpTools.length === 0 && mcpResources.length === 0 && mcpPrompts.length === 0 && !loading.mcp && (
        <EmptyState message="MCP 服务未启动或无注册工具。确认 config.ts 中 mcp.enabled = true。" />
      )}
    </div>
  );

  const renderWorkflows = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <MiniMetric icon={<Route className="w-3.5 h-3.5" />} label="WORKFLOWS" value={String(workflows.length)} color="amber" />
        <MiniMetric icon={<Play className="w-3.5 h-3.5" />} label="INSTANCES" value={String(workflowInstances.length)} color="emerald" />
      </div>

      {/* Workflow Definitions */}
      {workflows.length > 0 && (
        <div>
          <SectionTitle icon={<Route className="w-3.5 h-3.5" />} title="WORKFLOW DEFINITIONS" />
          <div className="space-y-1.5 mt-2">
            {workflows.map((wf: WorkflowDef, i: number) => (
              <div key={i} className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-300">{wf.id || wf.name || `Workflow #${i + 1}`}</span>
                  <span className="text-[9px] font-mono text-slate-500">{Array.isArray(wf.steps) ? wf.steps.length : (typeof wf.steps === 'number' ? wf.steps : 0)} steps</span>
                </div>
                {wf.description && <div className="text-[10px] text-slate-500 mt-0.5">{wf.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Running Instances */}
      {workflowInstances.length > 0 && (
        <div>
          <SectionTitle icon={<Activity className="w-3.5 h-3.5" />} title="ACTIVE INSTANCES" />
          <div className="space-y-1.5 mt-2">
            {workflowInstances.map((inst: WorkflowInstance, i: number) => (
              <div key={i} className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-300">{inst.id?.substring(0, 12) || `Instance #${i + 1}`}</span>
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded",
                    inst.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-300' :
                      inst.status === 'WAITING_APPROVAL' ? 'bg-amber-500/20 text-amber-300' :
                        inst.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-slate-700 text-slate-400'
                  )}>{inst.status}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Step: {inst.currentStep ?? '?'} / {inst.totalSteps ?? '?'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {workflows.length === 0 && !loading.workflow && (
        <EmptyState message="Workflow 引擎未启动或无已注册流程。" />
      )}
    </div>
  );

  const renderPlugins = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <MiniMetric icon={<Plug className="w-3.5 h-3.5" />} label="PLUGINS" value={String(plugins.length)} color="rose" />
        <MiniMetric icon={<Wrench className="w-3.5 h-3.5" />} label="TOOLS" value={String(pluginTools.length)} color="cyan" />
      </div>

      {plugins.length > 0 && (
        <div>
          <SectionTitle icon={<Plug className="w-3.5 h-3.5" />} title="LOADED PLUGINS" />
          <div className="space-y-1.5 mt-2">
            {plugins.map((p: PluginInfo, i: number) => (
              <div key={i} className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-rose-300">{p.name || p.id || `Plugin #${i + 1}`}</span>
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded",
                    p.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                  )}>{p.enabled ? 'ACTIVE' : 'DISABLED'}</span>
                </div>
                {p.description && <div className="text-[10px] text-slate-500 mt-0.5">{p.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {pluginTools.length > 0 && (
        <div>
          <SectionTitle icon={<Wrench className="w-3.5 h-3.5" />} title="PLUGIN TOOLS" />
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {pluginTools.map((t: PluginTool, i: number) => (
              <div key={i} className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-[11px] font-mono text-cyan-300 truncate">
                {t.name || t.id || `Tool #${i + 1}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {plugins.length === 0 && !loading.plugins && (
        <EmptyState message="Plugin 系统未启动或无已加载插件。" />
      )}
    </div>
  );

  const renderIDE = () => (
    <div className="space-y-4">
      {/* Project Overview */}
      {ideOverview && (
        <div>
          <SectionTitle icon={<FileCode className="w-3.5 h-3.5" />} title="PROJECT OVERVIEW" />
          <pre className="mt-2 p-3 rounded-xl bg-black/40 border border-white/5 text-[10px] font-mono text-slate-400 overflow-x-auto max-h-48 overflow-y-auto">
            {JSON.stringify(ideOverview, null, 2)}
          </pre>
        </div>
      )}

      {/* Git Status */}
      {gitStatus && (
        <div>
          <SectionTitle icon={<GitBranch className="w-3.5 h-3.5" />} title="GIT STATUS" />
          <pre className="mt-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[10px] font-mono text-emerald-300/80 overflow-x-auto max-h-48 overflow-y-auto">
            {typeof gitStatus === 'string' ? gitStatus : JSON.stringify(gitStatus, null, 2)}
          </pre>
        </div>
      )}

      {!ideOverview && !gitStatus && !loading.ide && (
        <EmptyState message="IDE Bridge 未启动。确认 config.ts 中 ide.enabled = true。" />
      )}
    </div>
  );

  const renderConfig = () => (
    <div className="space-y-4">
      {/* Three-Channel Architecture */}
      <div>
        <SectionTitle icon={<Layers className="w-3.5 h-3.5" />} title="THREE-CHANNEL ARCHITECTURE" />
        <div className="space-y-1.5 mt-2">
          {[
            { name: '神经闪电网络', sub: 'Neural Lightning (WebSocket)', icon: <Zap className="w-3.5 h-3.5" />, st: state === 'CONNECTED' ? 'ACTIVE' : 'STANDBY', ep: config.wsUrl, color: 'emerald' },
            { name: '记忆长河', sub: 'Memory River (NAS/PostgreSQL)', icon: <Database className="w-3.5 h-3.5" />, st: state === 'CONNECTED' ? 'ACTIVE' : 'STANDBY', ep: 'postgresql://localhost:5432/yyc3', color: 'blue' },
            { name: '时空隧道', sub: 'Spacetime Tunnel (VPN/Secure)', icon: <Cable className="w-3.5 h-3.5" />, st: 'ENCRYPTED', ep: 'WireGuard / Huawei Enterprise', color: 'purple' },
          ].map(ch => (
            <div key={ch.name} className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className={cn(`p-1.5 rounded-lg bg-${ch.color}-500/10 text-${ch.color}-400`)}>{ch.icon}</div>
                <div>
                  <div className="text-[11px] font-bold text-white">{ch.name}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{ch.sub}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  "text-[9px] font-mono px-1.5 py-0.5 rounded inline-block",
                  ch.st === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                    ch.st === 'ENCRYPTED' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-slate-700/50 text-slate-400'
                )}>{ch.st}</div>
                <div className="text-[8px] text-slate-600 mt-0.5 font-mono max-w-[150px] truncate">{ch.ep}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Endpoint Configuration */}
      <div>
        <SectionTitle icon={<Settings className="w-3.5 h-3.5" />} title="ENDPOINT CONFIG" />
        <div className="mt-2 p-3 rounded-xl bg-black/30 border border-white/5 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 uppercase font-mono">WebSocket Endpoint</label>
            <input
              value={editConfig.wsUrl}
              onChange={e => setEditConfig({ ...editConfig, wsUrl: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="ws://localhost:3080"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 uppercase font-mono">REST API Endpoint</label>
            <input
              value={editConfig.apiUrl}
              onChange={e => setEditConfig({ ...editConfig, apiUrl: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="http://localhost:3080"
            />
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="w-full py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {isSaving ? 'RECONNECTING...' : 'SAVE & RECONNECT'}
          </button>
        </div>
      </div>

      {/* Quick Setup Guide */}
      <div className="p-3 rounded-xl bg-blue-900/10 border border-blue-500/20 space-y-1.5">
        <h4 className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
          <Terminal className="w-3 h-3" /> Quick Backend Setup
        </h4>
        <div className="text-[10px] text-blue-200/50 font-mono space-y-0.5 leading-relaxed">
          <p className="text-blue-200/30"># 1. Start Bun Runtime Server</p>
          <p className="text-blue-300">$ cd bun-server && bun run index.ts</p>
          <p className="text-blue-200/30 mt-1"># 2. Verify Health</p>
          <p className="text-blue-300">$ curl http://localhost:3080/api/health</p>
          <p className="text-blue-200/30 mt-1"># 3. Set .env (only DEEPSEEK_API_KEY needed)</p>
          <p className="text-blue-300">$ cp env-template.txt .env && vim .env</p>
        </div>
      </div>
    </div>
  );

  const tabRenderers: Record<TabId, () => React.ReactNode> = {
    overview: renderOverview,
    llm: renderLLM,
    mcp: renderMCP,
    workflow: renderWorkflows,
    plugins: renderPlugins,
    ide: renderIDE,
    config: renderConfig,
  };

  // ==========================================
  // Render
  // ==========================================
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex items-center justify-center p-3 md:p-6"
    >
      <div className="w-full max-w-3xl h-[85vh] max-h-[700px] bg-slate-900/80 rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">

        {/* ---- Header ---- */}
        <div className="relative px-5 pt-4 pb-3 border-b border-white/5 shrink-0" style={{ background: `radial-gradient(ellipse at center top, ${stateInfo.bgGlow}, transparent 70%)` }}>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl bg-black/30 border", stateInfo.color, state === 'CONNECTED' ? 'border-emerald-500/30' : 'border-white/10')}>
              {stateInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white tracking-wide">灵肉对接·运维中枢</h2>
              <div className={cn("text-[10px] font-mono", stateInfo.color)}>{stateInfo.label}</div>
            </div>

            {/* Quick Metrics */}
            <div className="hidden md:flex items-center gap-3 text-[10px] font-mono text-slate-500">
              <span>
                <Timer className="w-3 h-3 inline mr-1" />
                {status?.latency !== undefined && status.latency >= 0 ? `${status.latency}ms` : '--'}
              </span>
              <span>
                <Gauge className="w-3 h-3 inline mr-1" />
                {status?.reconnectAttempts ?? 0}
              </span>
            </div>

            {/* Connect/Disconnect */}
            {state === 'CONNECTED' ? (
              <button
                onClick={onDisconnect}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono transition-colors"
              >
                DISCONNECT
              </button>
            ) : state === 'CONNECTING' ? null : (
              <button
                onClick={onConnect}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3 h-3" /> CONNECT
              </button>
            )}
          </div>
        </div>

        {/* ---- Tab Bar ---- */}
        <div className="flex items-center border-b border-white/5 px-2 shrink-0 overflow-x-auto scrollbar-none">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-mono uppercase tracking-wide transition-colors whitespace-nowrap border-b-2 -mb-[1px]",
                activeTab === tab.id
                  ? "text-white border-emerald-400"
                  : "text-slate-500 hover:text-slate-300 border-transparent hover:border-white/10"
              )}
            >
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.shortLabel}</span>
            </button>
          ))}

          {/* Refresh Button */}
          <button
            onClick={() => {
              const loaders: Record<TabId, () => Promise<void>> = {
                overview: loadOverview, llm: loadLLM, mcp: loadMCP,
                workflow: loadWorkflows, plugins: loadPlugins, ide: loadIDE,
                config: async () => {},
              };
              loaders[activeTab]();
            }}
            className="ml-auto p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading[activeTab] && "animate-spin")} />
          </button>
        </div>

        {/* ---- Tab Content ---- */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
          {loading[activeTab] && !healthData && activeTab === 'overview' ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-[11px] font-mono">FETCHING DATA...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {tabRenderers[activeTab]()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ---- Footer ---- */}
        <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
          <div className="text-[9px] font-mono text-slate-600">
            BackendBridge v2.0 | {lastRefresh ? `Last: ${new Date(lastRefresh).toLocaleTimeString()}` : 'No data'}
          </div>
          <div className="text-[9px] font-mono text-slate-600">
            {apiUrl}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ==========================================
// Sub-Components
// ==========================================

const MiniMetric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/15', text: 'text-cyan-400' },
    emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/15', text: 'text-emerald-400' },
    violet: { bg: 'bg-violet-500/5', border: 'border-violet-500/15', text: 'text-violet-400' },
    blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/15', text: 'text-blue-400' },
    amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/15', text: 'text-amber-400' },
    rose: { bg: 'bg-rose-500/5', border: 'border-rose-500/15', text: 'text-rose-400' },
    red: { bg: 'bg-red-500/5', border: 'border-red-500/15', text: 'text-red-400' },
    slate: { bg: 'bg-slate-800/30', border: 'border-white/5', text: 'text-slate-400' },
  };
  const c = colorMap[color] || colorMap.slate;
  return (
    <div className={cn("p-2.5 rounded-xl border", c.bg, c.border)}>
      <div className="flex items-center gap-1 text-[8px] text-slate-500 font-mono uppercase mb-1">
        <span className={c.text}>{icon}</span>
        {label}
      </div>
      <div className={cn("text-sm font-mono font-bold", c.text)}>{value}</div>
    </div>
  );
};

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
    {icon}
    {title}
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
    <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
      <WifiOff className="w-6 h-6 text-slate-600" />
    </div>
    <p className="text-xs text-slate-500 max-w-xs font-mono">{message}</p>
  </div>
);