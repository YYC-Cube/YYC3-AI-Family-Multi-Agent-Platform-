/**
 * file: SettingsModal.tsx
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
 * YYC³ AI Family — System Control Panel (SYS_CTRL)
 * 
 * 全面 CRUD 动态配置面板：
 * - 所有数据 UI 可编辑、可增删改查
 * - localStorage 持久化
 * - 敏感数据（API Key）仅存环境变量名
 * - 支持导入/导出配置 JSON
 */

import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Settings, ChevronRight, Plus, Terminal, 
  Cpu, Network, Package, GitBranch, Workflow, Sliders, Database, Search, Play, Pause, 
  RotateCw, CheckCircle, AlertCircle, Command, Trash2, Users, Monitor, Type, Palette, HardDrive, 
  Download, Upload, Folder, Lock, Unlock, Edit3, Save, XCircle, Server, Globe, ArrowUpDown,
  RefreshCw, Copy, Eye, EyeOff, ChevronDown
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "./ui/textarea";
import { useChannelConfig, PRESETS, AIConfig } from "../hooks/useChannelConfig";
import { useDynamicConfig, performHealthCheck } from "../hooks/useDynamicConfig";
import { refreshAgentRouter } from "../services/agent-router";
import type {
  NetworkConfig,
  UIConfig,
  LLMProviderConfig,
  ModelConfig,
  AIAgentConfig,
  EndpointConfig,
  MCPServerConfig,
  WorkflowConfig,
  ExtensionConfig,
  ComputeNodeConfig,
} from "../types/dynamic-config";

// ==========================================
// Types
// ==========================================

interface Channel {
  id: string;
  name: string;
  createdAt: Date;
  isEncrypted?: boolean;
  preset?: string;
}

interface ChannelManager {
  channels: Channel[];
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  createChannel: (name: string, options?: { isEncrypted?: boolean, preset?: string }) => string;
  deleteChannel: (id: string) => void;
  updateChannelName: (id: string, name: string) => void;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: TabId;
  channelManager?: ChannelManager;
  onExportChannel?: () => void;
  onImportChannel?: (json: string) => void;
}

type TabId = 'profile' | 'models' | 'providers' | 'connectivity' | 'extensions' | 'gitops' | 'workflows' | 'ai_family' | 'ui_ux' | 'channels' | 'endpoints' | 'compute_nodes' | 'network' | 'ui_params';

// ==========================================
// Inline Edit Row Component
// ==========================================

function InlineEditField({ 
  value, onSave, placeholder = '', type = 'text', className = '' 
}: { 
  value: string; onSave: (v: string) => void; placeholder?: string; type?: string; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  if (!editing) {
    return (
      <span 
        className={`cursor-pointer hover:text-green-400 transition-colors ${className}`}
        onClick={() => setEditing(true)}
        title="点击编辑"
      >
        {value || <span className="text-green-500/20 italic">空</span>}
        <Edit3 className="inline-block w-2.5 h-2.5 ml-1 opacity-30" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onSave(draft); setEditing(false); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        onBlur={() => { onSave(draft); setEditing(false); }}
        placeholder={placeholder}
        className="bg-green-500/10 border border-green-500/40 text-green-400 px-1.5 py-0.5 text-xs font-mono outline-none focus:border-green-500 w-full max-w-[200px]"
      />
    </span>
  );
}

// ==========================================
// Confirm Delete Button
// ==========================================

function DeleteButton({ onDelete, label = '' }: { onDelete: () => void; label?: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <button onClick={() => { onDelete(); setConfirming(false); }} className="px-2 py-1 bg-red-500 text-black text-[10px] font-bold uppercase tracking-widest hover:bg-red-400 transition-all">
          确认删除
        </button>
        <button onClick={() => setConfirming(false)} className="px-2 py-1 border border-green-500/30 text-green-500/50 text-[10px] font-bold uppercase tracking-widest hover:text-green-500 transition-all">
          取消
        </button>
      </span>
    );
  }

  return (
    <button 
      onClick={() => setConfirming(true)} 
      className="p-1.5 text-green-500/20 hover:text-red-500 transition-colors"
      title={`删除${label}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

// ==========================================
// Main Component
// ==========================================

export function SettingsModal({ isOpen, onClose, defaultTab = 'providers', channelManager, onExportChannel, onImportChannel }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const dynConfig = useDynamicConfig();
  const { config } = dynConfig;

  // 当配置版本变化时刷新 AgentRouter（使运行时 LLM 调用读取最新配置）
  const configVersionRef = useRef(config.version);
  useEffect(() => {
    if (config.version !== configVersionRef.current) {
      configVersionRef.current = config.version;
      refreshAgentRouter();
    }
  }, [config.version]);

  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);
  
  // Model Settings State (channel-specific)
  const { config: channelCfg, saveConfig: saveChannelConfig, applyPreset } = useChannelConfig(channelManager?.activeChannelId || "main");
  
  const [modelProvider, setModelProvider] = useState(channelCfg.provider);
  const [modelName, setModelName] = useState(channelCfg.model);
  const [modelHints, setModelHints] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState(channelCfg.apiKey);
  const [temperature, setTemperature] = useState(channelCfg.temperature);
  const [baseUrl, setBaseUrl] = useState(channelCfg.baseUrl);

  useEffect(() => {
    setModelProvider(channelCfg.provider);
    setModelName(channelCfg.model);
    setApiKey(channelCfg.apiKey);
    setTemperature(channelCfg.temperature);
    setBaseUrl(channelCfg.baseUrl);
  }, [channelCfg]);

  // Add-new form states
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showAddEndpoint, setShowAddEndpoint] = useState(false);
  const [showAddMCP, setShowAddMCP] = useState(false);
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [showAddExtension, setShowAddExtension] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);

  // Health check state
  const [checkingHealth, setCheckingHealth] = useState<Record<string, boolean>>({});

  // New item drafts
  const [newProvider, setNewProvider] = useState({ name: '', displayName: '', baseUrl: '', apiKeyEnvVar: '', color: '#00BFFF', description: '' });
  const [newModel, setNewModel] = useState({ name: '', displayName: '', providerId: '', description: '', color: '#00BFFF' });
  const [newAgent, setNewAgent] = useState({ name: '', nameCN: '', role: '', roleCN: '', modelId: '', color: '#FFD700' });
  const [newEndpoint, setNewEndpoint] = useState<{ name: string; url: string; envVar: string; description: string; category: 'api' | 'websocket' | 'database' | 'cache' | 'llm' | 'vector' | 'custom' }>({ name: '', url: '', envVar: '', description: '', category: 'api' });
  const [newMCP, setNewMCP] = useState({ name: '', url: '', description: '' });
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '', steps: 1 });
  const [newExtension, setNewExtension] = useState({ name: '', description: '', version: '1.0.0', author: '', category: 'runtime' });
  const [newNode, setNewNode] = useState({ name: '', host: '', cpu: '', gpu: '', memory: '', storage: '' });

  // Git State
  const [gitStatus, setGitStatus] = useState<"idle" | "syncing" | "success">("idle");
  const [gitRepo, setGitRepo] = useState("esmondrio/yyc3-ai-family");

  // UI/UX Settings
  const [uiSettings, setUiSettings] = useState({
    theme: "P1 (Green)",
    fontSize: "medium" as string,
    scanlines: 30,
    curvature: false,
  });

  // Channel State
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelPreset, setNewChannelPreset] = useState("General");
  const [newChannelEncrypted, setNewChannelEncrypted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  // ==========================================
  // Handlers
  // ==========================================

  const handleSave = () => {
    saveChannelConfig({
      provider: modelProvider,
      model: modelName,
      apiKey: apiKey,
      baseUrl: baseUrl,
      temperature: temperature,
    });
    toast.success("SYSTEM_CONFIG_UPDATED", { description: "Neural pathways re-routed to new endpoints." });
  };

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;
    if (channelManager) {
      const id = channelManager.createChannel(newChannelName, { preset: newChannelPreset, isEncrypted: newChannelEncrypted });
      const presetConfig = PRESETS[newChannelPreset];
      if (presetConfig) localStorage.setItem(`yyc3_config_${id}`, JSON.stringify(presetConfig));
      channelManager.setActiveChannelId(id);
      setNewChannelName("");
      toast.success("CHANNEL_CREATED_INIT", { description: `Partition allocated: ${newChannelName} [${newChannelPreset.toUpperCase()}]` });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportChannel) {
      const reader = new FileReader();
      reader.onload = (event) => { onImportChannel(event.target?.result as string); toast.success("DATA_INGESTION_COMPLETE"); };
      reader.readAsText(file);
    }
  };

  const handleModelInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setModelName(val);
    if (val.length > 1) {
      const allModels = config.models.map(m => m.id);
      const matches = allModels.filter(m => m.toLowerCase().includes(val.toLowerCase()));
      setModelHints(matches.slice(0, 8));
    } else {
      setModelHints([]);
    }
  };

  const handleGitOperation = (operation: string) => {
    setGitStatus("syncing");
    toast.info(`EXECUTING_GIT_OP: ${operation}...`);
    setTimeout(() => {
      setGitStatus("success");
      toast.success(`GIT_OP_SUCCESS: ${operation} completed.`);
      setTimeout(() => setGitStatus("idle"), 3000);
    }, 2000);
  };

  const handleUiChange = (key: string, value: string | boolean | number) => {
    setUiSettings(prev => ({ ...prev, [key]: value }));
    toast.info(`UI_CONFIG_UPDATED: ${key.toUpperCase()}`);
  };

  // Add handlers
  const handleAddProvider = () => {
    if (!newProvider.name.trim()) return;
    dynConfig.addProvider({
      id: `provider-${Date.now()}`,
      name: newProvider.name.toLowerCase().replace(/\s+/g, '-'),
      displayName: newProvider.displayName || newProvider.name,
      baseUrl: newProvider.baseUrl,
      apiKeyEnvVar: newProvider.apiKeyEnvVar || `${newProvider.name.toUpperCase().replace(/\s+/g, '_')}_API_KEY`,
      isEnabled: true,
      priority: config.providers.length + 1,
      color: newProvider.color,
      models: [],
      description: newProvider.description,
    });
    setNewProvider({ name: '', displayName: '', baseUrl: '', apiKeyEnvVar: '', color: '#00BFFF', description: '' });
    setShowAddProvider(false);
    toast.success("PROVIDER_ADDED", { description: newProvider.name });
  };

  const handleAddModel = () => {
    if (!newModel.name.trim()) return;
    dynConfig.addModel({
      id: newModel.name.toLowerCase().replace(/\s+/g, '-'),
      name: newModel.name,
      displayName: newModel.displayName || newModel.name,
      providerId: newModel.providerId || config.providers[0]?.id || 'custom',
      description: newModel.description,
      color: newModel.color,
      isAvailable: true,
      capabilities: ['chat'],
    });
    setNewModel({ name: '', displayName: '', providerId: '', description: '', color: '#00BFFF' });
    setShowAddModel(false);
    toast.success("MODEL_ADDED", { description: newModel.name });
  };

  const handleAddAgent = () => {
    if (!newAgent.nameCN.trim()) return;
    dynConfig.addAgent({
      id: `agent-${Date.now()}`,
      roleId: newAgent.name.toUpperCase().replace(/\s+/g, '_'),
      name: newAgent.name,
      nameCN: newAgent.nameCN,
      version: 'v1.0',
      role: newAgent.role,
      roleCN: newAgent.roleCN,
      modelId: newAgent.modelId || config.models[0]?.id || 'glm-4-plus',
      providerId: config.providers[0]?.id || 'bigmodel',
      color: newAgent.color,
      status: 'standby',
      capabilities: [],
      permissions: { canDeploy: false, canReview: false },
    });
    setNewAgent({ name: '', nameCN: '', role: '', roleCN: '', modelId: '', color: '#FFD700' });
    setShowAddAgent(false);
    toast.success("AGENT_DEPLOYED", { description: newAgent.nameCN });
  };

  const handleAddEndpoint = () => {
    if (!newEndpoint.name.trim()) return;
    dynConfig.addEndpoint({
      id: `ep-${Date.now()}`,
      name: newEndpoint.name,
      url: newEndpoint.url,
      envVar: newEndpoint.envVar || `VITE_${newEndpoint.name.toUpperCase().replace(/\s+/g, '_')}_URL`,
      description: newEndpoint.description,
      category: newEndpoint.category,
      isHealthy: false,
    });
    setNewEndpoint({ name: '', url: '', envVar: '', description: '', category: 'api' });
    setShowAddEndpoint(false);
    toast.success("ENDPOINT_REGISTERED", { description: newEndpoint.name });
  };

  const handleAddMCP = () => {
    if (!newMCP.name.trim()) return;
    dynConfig.addMCPServer({
      id: `mcp-${Date.now()}`,
      name: newMCP.name,
      url: newMCP.url,
      status: 'disconnected',
      latency: '-',
      description: newMCP.description,
      isEnabled: true,
      capabilities: [],
    });
    setNewMCP({ name: '', url: '', description: '' });
    setShowAddMCP(false);
    toast.success("MCP_SERVER_ADDED", { description: newMCP.name });
  };

  const handleAddWorkflow = () => {
    if (!newWorkflow.name.trim()) return;
    dynConfig.addWorkflow({
      id: `wf-${Date.now()}`,
      name: newWorkflow.name,
      description: newWorkflow.description,
      steps: newWorkflow.steps,
      status: 'inactive',
      trigger: 'manual',
      createdAt: Date.now(),
    });
    setNewWorkflow({ name: '', description: '', steps: 1 });
    setShowAddWorkflow(false);
    toast.success("WORKFLOW_CREATED", { description: newWorkflow.name });
  };

  const handleAddExtension = () => {
    if (!newExtension.name.trim()) return;
    dynConfig.addExtension({
      id: `ext-${Date.now()}`,
      name: newExtension.name,
      description: newExtension.description,
      isInstalled: false,
      isEnabled: false,
      version: newExtension.version,
      author: newExtension.author,
      category: newExtension.category,
    });
    setNewExtension({ name: '', description: '', version: '1.0.0', author: '', category: 'runtime' });
    setShowAddExtension(false);
    toast.success("EXTENSION_REGISTERED", { description: newExtension.name });
  };

  const handleAddNode = () => {
    if (!newNode.name.trim()) return;
    dynConfig.addComputeNode({
      id: `node-${Date.now()}`,
      name: newNode.name,
      host: newNode.host,
      type: 'remote',
      status: 'offline',
      specs: { cpu: newNode.cpu, gpu: newNode.gpu, memory: newNode.memory, storage: newNode.storage },
      metrics: { gpuUtil: 0, memUtil: 0, temperature: 0 },
      isEnabled: true,
    });
    setNewNode({ name: '', host: '', cpu: '', gpu: '', memory: '', storage: '' });
    setShowAddNode(false);
    toast.success("COMPUTE_NODE_ADDED", { description: newNode.name });
  };

  // ==========================================
  // Nav Items
  // ==========================================

  const navItems = [
    { id: 'providers', icon: Globe, label: "PROVIDERS" },
    { id: 'models', icon: Cpu, label: "AI_MODELS" },
    { id: 'ai_family', icon: Users, label: "AI_FAMILY" },
    { id: 'endpoints', icon: Server, label: "ENDPOINTS" },
    { id: 'connectivity', icon: Network, label: "MCP_SERVERS" },
    { id: 'compute_nodes', icon: HardDrive, label: "COMPUTE" },
    { id: 'network', icon: Globe, label: "NETWORK" },
    { id: 'ui_params', icon: Sliders, label: "UI_PARAMS" },
    { id: 'workflows', icon: Workflow, label: "WORKFLOWS" },
    { id: 'extensions', icon: Package, label: "EXTENSIONS" },
    { id: 'channels', icon: Folder, label: "CHANNELS" },
    { id: 'gitops', icon: GitBranch, label: "GIT_OPS" },
    { id: 'ui_ux', icon: Monitor, label: "UI/UX" },
    { id: 'profile', icon: User, label: "PROFILE" },
  ];

  // ==========================================
  // Section Header
  // ==========================================

  const SectionHeader = ({ icon: Icon, title, count, onAdd, addLabel = "ADD" }: { icon: React.ComponentType<{ className?: string }>; title: string; count: number; onAdd: () => void; addLabel?: string }) => (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {title}
        <span className="text-green-500/30 ml-1">({count})</span>
      </h3>
      <button
        onClick={onAdd}
        className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-bold uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all flex items-center gap-1.5"
      >
        <Plus className="h-3 w-3" /> {addLabel}
      </button>
    </div>
  );

  // ==========================================
  // Add Form Wrapper
  // ==========================================

  const AddForm = ({ show, onSubmit, onCancel, children }: { show: boolean; onSubmit: () => void; onCancel: () => void; children: React.ReactNode }) => {
    if (!show) return null;
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-6 p-4 border border-dashed border-green-500/40 bg-green-500/5"
      >
        <div className="space-y-3">
          {children}
          <div className="flex gap-2 pt-2">
            <button onClick={onSubmit} className="px-4 py-2 bg-green-500 text-black text-[10px] font-bold uppercase tracking-widest hover:bg-green-400 transition-all flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> 确认添加
            </button>
            <button onClick={onCancel} className="px-4 py-2 border border-green-500/30 text-green-500/50 text-[10px] font-bold uppercase tracking-widest hover:text-green-500 transition-all">
              取消
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const FormInput = ({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-green-500/50 uppercase tracking-widest">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black border border-green-500/20 text-green-500 text-xs font-mono px-3 py-2 outline-none focus:border-green-500/50 transition-colors"
      />
    </div>
  );

  // ==========================================
  // Render Content
  // ==========================================

  const renderContent = () => {
    switch (activeTab) {

      // ========== PROVIDERS ==========
      case 'providers':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader icon={Globe} title="LLM_PROVIDERS" count={config.providers.length} onAdd={() => setShowAddProvider(true)} addLabel="ADD_PROVIDER" />

            <AddForm show={showAddProvider} onSubmit={handleAddProvider} onCancel={() => setShowAddProvider(false)}>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="名称" value={newProvider.name} onChange={v => setNewProvider(p => ({ ...p, name: v }))} placeholder="e.g. deepseek" />
                <FormInput label="显示名" value={newProvider.displayName} onChange={v => setNewProvider(p => ({ ...p, displayName: v }))} placeholder="e.g. DeepSeek" />
                <FormInput label="Base URL" value={newProvider.baseUrl} onChange={v => setNewProvider(p => ({ ...p, baseUrl: v }))} placeholder="https://api.example.com/v1" />
                <FormInput label="API Key 环境变量名" value={newProvider.apiKeyEnvVar} onChange={v => setNewProvider(p => ({ ...p, apiKeyEnvVar: v }))} placeholder="MY_API_KEY" />
                <FormInput label="描述" value={newProvider.description} onChange={v => setNewProvider(p => ({ ...p, description: v }))} placeholder="Provider 描述" />
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-green-500/50 uppercase tracking-widest">主题色</label>
                  <input type="color" value={newProvider.color} onChange={e => setNewProvider(p => ({ ...p, color: e.target.value }))} className="w-full h-8 bg-black border border-green-500/20 cursor-pointer" />
                </div>
              </div>
            </AddForm>

            <div className="space-y-3">
              {config.providers.map((provider, idx) => (
                <div key={provider.id} className={`p-4 border transition-all group ${provider.isEnabled ? 'border-green-500/30 bg-green-500/5' : 'border-green-500/10 bg-black opacity-60'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 border flex items-center justify-center shrink-0" style={{ borderColor: provider.color, color: provider.color }}>
                        <Globe className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <InlineEditField
                            value={provider.displayName}
                            onSave={v => dynConfig.updateProvider(provider.id, { displayName: v })}
                            className="text-sm font-bold text-green-500 font-mono"
                          />
                          <span className="text-[9px] px-1.5 py-0.5 border border-green-500/20 text-green-500/40 uppercase tracking-widest">P{provider.priority}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <InlineEditField
                            value={provider.baseUrl}
                            onSave={v => dynConfig.updateProvider(provider.id, { baseUrl: v })}
                            className="text-[10px] text-green-500/40 font-mono truncate"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-green-500/30 uppercase tracking-widest">ENV:</span>
                          <InlineEditField
                            value={provider.apiKeyEnvVar}
                            onSave={v => dynConfig.updateProvider(provider.id, { apiKeyEnvVar: v })}
                            className="text-[10px] text-green-500/40 font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-green-500/25 mt-1">{provider.description}</p>
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {provider.models.map(m => (
                            <span key={m} className="text-[9px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/10 text-green-500/50 font-mono">{m}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => dynConfig.updateProvider(provider.id, { isEnabled: !provider.isEnabled })}
                        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          provider.isEnabled
                            ? 'bg-green-500/20 border-green-500/40 text-green-500'
                            : 'bg-transparent border-green-500/10 text-green-500/30 hover:border-green-500/30'
                        }`}
                      >
                        {provider.isEnabled ? 'ON' : 'OFF'}
                      </button>
                      <DeleteButton onDelete={() => dynConfig.deleteProvider(provider.id)} label={provider.displayName} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ========== MODELS ==========
      case 'models':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader icon={Cpu} title="MODEL_REGISTRY" count={config.models.length} onAdd={() => setShowAddModel(true)} addLabel="ADD_MODEL" />

            <AddForm show={showAddModel} onSubmit={handleAddModel} onCancel={() => setShowAddModel(false)}>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="模型 ID" value={newModel.name} onChange={v => setNewModel(p => ({ ...p, name: v }))} placeholder="e.g. gpt-4o" />
                <FormInput label="显示名" value={newModel.displayName} onChange={v => setNewModel(p => ({ ...p, displayName: v }))} placeholder="e.g. GPT-4o" />
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-green-500/50 uppercase tracking-widest">所属 Provider</label>
                  <select
                    value={newModel.providerId}
                    onChange={e => setNewModel(p => ({ ...p, providerId: e.target.value }))}
                    className="w-full bg-black border border-green-500/20 text-green-500 text-xs font-mono px-3 py-2 outline-none"
                  >
                    <option value="">选择 Provider...</option>
                    {config.providers.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                  </select>
                </div>
                <FormInput label="描述" value={newModel.description} onChange={v => setNewModel(p => ({ ...p, description: v }))} placeholder="模型描述" />
              </div>
            </AddForm>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.models.map(model => {
                const provider = config.providers.find(p => p.id === model.providerId);
                return (
                  <div key={model.id} className={`p-4 border transition-all group relative ${model.isAvailable ? 'border-green-500/20 bg-black hover:border-green-500/40' : 'border-green-500/10 bg-black/50 opacity-50'}`}>
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        onClick={() => dynConfig.updateModel(model.id, { isAvailable: !model.isAvailable })}
                        className={`w-2 h-2 rounded-full transition-all ${model.isAvailable ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-red-500/50'}`}
                        title={model.isAvailable ? '可用' : '不可用'}
                      />
                      <DeleteButton onDelete={() => dynConfig.deleteModel(model.id)} />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: model.color }} />
                      <InlineEditField
                        value={model.displayName}
                        onSave={v => dynConfig.updateModel(model.id, { displayName: v })}
                        className="text-sm font-bold text-green-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-green-500/30 uppercase">ID:</span>
                        <span className="text-[10px] text-green-500/50 font-mono">{model.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-green-500/30 uppercase">Provider:</span>
                        <span className="text-[10px] font-mono" style={{ color: provider?.color || '#666' }}>{provider?.displayName || model.providerId}</span>
                      </div>
                      <p className="text-[10px] text-green-500/30">{model.description}</p>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {model.capabilities?.map(c => (
                          <span key={c} className="text-[8px] px-1 py-0.5 border border-green-500/10 text-green-500/40 uppercase">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Channel Model Config */}
            <div className="mt-8 pt-6 border-t border-green-500/10">
              <h3 className="text-xs font-bold text-green-500/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                CHANNEL_HYPERPARAMETERS
              </h3>
              <div className="p-6 border border-dashed border-green-500/20 bg-green-500/5 relative">
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-green-500/50" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-green-500/50" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-green-500/50" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-green-500/50" />
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Provider</label>
                      <select
                        value={modelProvider}
                        onChange={e => {
                          setModelProvider(e.target.value);
                          const prov = config.providers.find(p => p.name === e.target.value || p.id === e.target.value);
                          if (prov) setBaseUrl(prov.baseUrl);
                        }}
                        className="w-full bg-black border border-green-500/20 text-green-500 text-xs font-mono px-3 py-2.5 outline-none focus:border-green-500/50"
                      >
                        {config.providers.filter(p => p.isEnabled).map(p => (
                          <option key={p.id} value={p.name}>{p.displayName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Model</label>
                      <div className="relative">
                        <input
                          value={modelName}
                          onChange={handleModelInput}
                          placeholder="Model ID..."
                          className="w-full bg-black border border-green-500/20 text-green-500 text-xs font-mono px-3 py-2.5 outline-none focus:border-green-500/50"
                        />
                        {modelHints.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-green-500/30 shadow-lg z-50 max-h-40 overflow-y-auto">
                            {modelHints.map(hint => (
                              <button key={hint} onClick={() => { setModelName(hint); setModelHints([]); }} className="w-full text-left px-3 py-2 text-xs text-green-500/70 hover:bg-green-500/20 hover:text-green-500 font-mono">
                                {hint}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Base URL</label>
                    <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className="w-full bg-black border border-green-500/20 text-green-500 text-xs font-mono px-3 py-2.5 outline-none focus:border-green-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest">API Key</label>
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." className="w-full bg-black border border-green-500/20 text-green-500 text-xs font-mono px-3 py-2.5 outline-none focus:border-green-500/50" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Temperature</span>
                      <span className="text-green-500 font-mono text-sm">{temperature.toFixed(1)}</span>
                    </div>
                    <div className="relative h-2 bg-green-900/20 rounded-full">
                      <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="absolute w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="absolute h-full bg-green-500/20 rounded-full" style={{ width: `${(temperature / 2) * 100}%` }} />
                      <div className="absolute h-4 w-4 bg-green-500 rounded-full top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(34,197,94,0.8)]" style={{ left: `${(temperature / 2) * 100}%`, transform: `translate(-50%, -50%)` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // ========== AI FAMILY ==========
      case 'ai_family':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader icon={Users} title="AI_FAMILY_AGENTS" count={config.agents.length} onAdd={() => setShowAddAgent(true)} addLabel="DEPLOY_AGENT" />

            <AddForm show={showAddAgent} onSubmit={handleAddAgent} onCancel={() => setShowAddAgent(false)}>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="英文名" value={newAgent.name} onChange={v => setNewAgent(p => ({ ...p, name: v }))} placeholder="e.g. DataMaster" />
                <FormInput label="中文名" value={newAgent.nameCN} onChange={v => setNewAgent(p => ({ ...p, nameCN: v }))} placeholder="e.g. 数据大师" />
                <FormInput label="角色 (EN)" value={newAgent.role} onChange={v => setNewAgent(p => ({ ...p, role: v }))} placeholder="e.g. Data Analysis" />
                <FormInput label="角色 (CN)" value={newAgent.roleCN} onChange={v => setNewAgent(p => ({ ...p, roleCN: v }))} placeholder="e.g. 数据分析" />
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-green-500/50 uppercase tracking-widest">绑定模型</label>
                  <select value={newAgent.modelId} onChange={e => setNewAgent(p => ({ ...p, modelId: e.target.value }))} className="w-full bg-black border border-green-500/20 text-green-500 text-xs font-mono px-3 py-2 outline-none">
                    <option value="">选择模型...</option>
                    {config.models.map(m => <option key={m.id} value={m.id}>{m.displayName}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-green-500/50 uppercase tracking-widest">主题色</label>
                  <input type="color" value={newAgent.color} onChange={e => setNewAgent(p => ({ ...p, color: e.target.value }))} className="w-full h-8 bg-black border border-green-500/20 cursor-pointer" />
                </div>
              </div>
            </AddForm>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.agents.map(agent => {
                const agentModel = config.models.find(m => m.id === agent.modelId);
                return (
                  <div key={agent.id} className="p-4 border border-green-500/20 bg-black hover:border-green-500/50 transition-all group relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl to-transparent transition-opacity ${agent.status === 'active' ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `linear-gradient(to bottom left, ${agent.color}15, transparent)` }} />
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border flex items-center justify-center font-bold" style={{ borderColor: agent.status === 'active' ? agent.color : `${agent.color}40`, backgroundColor: agent.status === 'active' ? agent.color : 'transparent', color: agent.status === 'active' ? '#000' : `${agent.color}40` }}>
                          {agent.nameCN[0]}
                        </div>
                        <div>
                          <InlineEditField value={agent.nameCN} onSave={v => dynConfig.updateAgent(agent.id, { nameCN: v })} className="text-sm font-bold font-mono" style-override />
                          <div className="flex items-center gap-2">
                            <InlineEditField value={agent.version} onSave={v => dynConfig.updateAgent(agent.id, { version: v })} className="text-[10px] text-green-500/40 uppercase tracking-widest" />
                            <span className="text-[9px] font-mono" style={{ color: agentModel?.color || '#666' }}>{agentModel?.displayName || agent.modelId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500 animate-pulse' : agent.status === 'standby' ? 'bg-yellow-500/50' : 'bg-red-500/50'}`} />
                        <DeleteButton onDelete={() => dynConfig.deleteAgent(agent.id)} label={agent.nameCN} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] font-bold text-green-500/40 uppercase tracking-widest">职能</label>
                        <InlineEditField value={agent.roleCN || agent.role} onSave={v => dynConfig.updateAgent(agent.id, { roleCN: v, role: v })} className="text-xs text-green-500/80 font-mono block mt-0.5" />
                      </div>
                      
                      <div className="flex gap-1">
                        {(['active', 'standby', 'disabled'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => {
                              dynConfig.updateAgent(agent.id, { status: s });
                              toast.info(`AGENT_STATUS: ${agent.nameCN} → ${s.toUpperCase()}`);
                            }}
                            className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-all ${
                              agent.status === s
                                ? s === 'active' ? 'bg-green-500/20 border-green-500 text-green-500'
                                  : s === 'standby' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500'
                                  : 'bg-red-500/20 border-red-500/50 text-red-500'
                                : 'border-green-500/10 text-green-500/20 hover:text-green-500/50'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      // ========== ENDPOINTS ==========
      case 'endpoints':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader icon={Server} title="ENDPOINT_REGISTRY" count={config.endpoints.length} onAdd={() => setShowAddEndpoint(true)} addLabel="ADD_ENDPOINT" />

            {/* Batch health check */}
            <button
              onClick={async () => {
                toast.info("BATCH_HEALTH_CHECK: Pinging all endpoints...");
                const httpEndpoints = config.endpoints.filter(ep => ep.url.startsWith('http'));
                const ids = httpEndpoints.map(ep => ep.id);
                setCheckingHealth(prev => { const next = { ...prev }; ids.forEach(id => next[id] = true); return next; });
                const results = await Promise.all(httpEndpoints.map(async ep => {
                  const result = await performHealthCheck(ep.url);
                  dynConfig.updateEndpoint(ep.id, { isHealthy: result.healthy, lastChecked: Date.now() });
                  return { name: ep.name, ...result };
                }));
                setCheckingHealth(prev => { const next = { ...prev }; ids.forEach(id => next[id] = false); return next; });
                const ok = results.filter(r => r.healthy).length;
                const fail = results.filter(r => !r.healthy).length;
                const nonHttp = config.endpoints.length - httpEndpoints.length;
                toast.success(`BATCH_COMPLETE: ${ok} OK / ${fail} FAIL / ${nonHttp} SKIP (non-HTTP)`);
              }}
              className="w-full py-2 border border-dashed border-green-500/20 text-green-500/40 hover:text-green-500 hover:bg-green-500/5 hover:border-green-500/40 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-3 w-3" /> PING_ALL_ENDPOINTS
            </button>

            <AddForm show={showAddEndpoint} onSubmit={handleAddEndpoint} onCancel={() => setShowAddEndpoint(false)}>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="名称" value={newEndpoint.name} onChange={v => setNewEndpoint(p => ({ ...p, name: v }))} placeholder="e.g. MyAPI" />
                <FormInput label="URL" value={newEndpoint.url} onChange={v => setNewEndpoint(p => ({ ...p, url: v }))} placeholder="http://..." />
                <FormInput label="环境变量名" value={newEndpoint.envVar} onChange={v => setNewEndpoint(p => ({ ...p, envVar: v }))} placeholder="VITE_..." />
                <FormInput label="描述" value={newEndpoint.description} onChange={v => setNewEndpoint(p => ({ ...p, description: v }))} placeholder="描述" />
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-green-500/50 uppercase tracking-widest">类别</label>
                  <select value={newEndpoint.category} onChange={e => setNewEndpoint(p => ({ ...p, category: e.target.value as 'api' | 'websocket' | 'database' | 'cache' | 'llm' | 'vector' | 'custom' }))} className="w-full bg-black border border-green-500/20 text-green-500 text-xs font-mono px-3 py-2 outline-none">
                    {['api', 'websocket', 'database', 'cache', 'llm', 'vector', 'custom'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
            </AddForm>

            <div className="space-y-3">
              {config.endpoints.map(ep => (
                <div key={ep.id} className="p-4 border border-green-500/20 bg-black hover:border-green-500/40 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${ep.isHealthy ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500/50'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <InlineEditField value={ep.name} onSave={v => dynConfig.updateEndpoint(ep.id, { name: v })} className="text-sm font-bold text-green-500 font-mono" />
                          <span className="text-[9px] px-1.5 py-0.5 border border-green-500/15 text-green-500/30 uppercase tracking-widest">{ep.category}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <InlineEditField value={ep.url} onSave={v => dynConfig.updateEndpoint(ep.id, { url: v })} className="text-[10px] text-green-500/50 font-mono" />
                          <span className="text-[9px] text-green-500/20">ENV: {ep.envVar}</span>
                        </div>
                        <p className="text-[10px] text-green-500/25 mt-0.5">{ep.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={async () => {
                          setCheckingHealth(prev => ({ ...prev, [ep.id]: true }));
                          toast.info(`HEALTH_CHECK: ${ep.name}...`);
                          const result = await performHealthCheck(ep.url);
                          dynConfig.updateEndpoint(ep.id, { 
                            isHealthy: result.healthy, 
                            lastChecked: Date.now() 
                          });
                          setCheckingHealth(prev => ({ ...prev, [ep.id]: false }));
                          if (result.healthy) {
                            toast.success(`HEALTH_OK: ${ep.name} (${result.latencyMs}ms)`);
                          } else {
                            toast.error(`HEALTH_FAIL: ${ep.name} — ${result.error || 'UNREACHABLE'}`);
                          }
                        }}
                        disabled={checkingHealth[ep.id]}
                        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-green-500/20 transition-all ${
                          checkingHealth[ep.id] 
                            ? 'text-yellow-500 border-yellow-500/30 animate-pulse' 
                            : 'text-green-500/40 hover:text-green-500 hover:border-green-500/50'
                        }`}
                      >
                        {checkingHealth[ep.id] ? '...' : 'PING'}
                      </button>
                      <DeleteButton onDelete={() => dynConfig.deleteEndpoint(ep.id)} label={ep.name} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ========== MCP SERVERS ==========
      case 'connectivity':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader icon={Network} title="MCP_SERVERS" count={config.mcpServers.length} onAdd={() => setShowAddMCP(true)} addLabel="ADD_SERVER" />

            <AddForm show={showAddMCP} onSubmit={handleAddMCP} onCancel={() => setShowAddMCP(false)}>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="名称" value={newMCP.name} onChange={v => setNewMCP(p => ({ ...p, name: v }))} placeholder="e.g. Redis_Bridge" />
                <FormInput label="URL" value={newMCP.url} onChange={v => setNewMCP(p => ({ ...p, url: v }))} placeholder="mcp://..." />
                <FormInput label="描述" value={newMCP.description} onChange={v => setNewMCP(p => ({ ...p, description: v }))} placeholder="描述" />
              </div>
            </AddForm>

            <div className="space-y-3">
              {config.mcpServers.map(server => (
                <div key={server.id} className="flex items-center justify-between p-4 border border-green-500/20 bg-black hover:border-green-500/50 transition-all group">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${server.status === 'connected' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : server.status === 'error' ? 'bg-red-500' : 'bg-red-500/50'}`} />
                    <div className="min-w-0 flex-1">
                      <InlineEditField value={server.name} onSave={v => dynConfig.updateMCPServer(server.id, { name: v })} className="text-sm font-bold text-green-500 font-mono" />
                      <div className="flex items-center gap-2 mt-0.5">
                        <InlineEditField value={server.url} onSave={v => dynConfig.updateMCPServer(server.id, { url: v })} className="text-[10px] text-green-500/40 uppercase tracking-widest font-mono" />
                        <span className="text-[10px] text-green-500/30">· {server.latency}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        const next = server.status === 'connected' ? 'disconnected' : 'connected';
                        dynConfig.updateMCPServer(server.id, { status: next, latency: next === 'connected' ? `${Math.floor(Math.random() * 200)}ms` : '-' });
                        toast.info(`MCP_${next.toUpperCase()}: ${server.name}`);
                      }}
                      className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-green-500/20 text-green-500/50 hover:text-green-500 hover:border-green-500/50 transition-all"
                    >
                      {server.status === 'connected' ? 'DISCONNECT' : 'CONNECT'}
                    </button>
                    <button
                      onClick={() => {
                        dynConfig.updateMCPServer(server.id, { isEnabled: !server.isEnabled });
                        toast.info(`MCP_SERVER: ${server.name} ${!server.isEnabled ? 'ENABLED' : 'DISABLED'}`);
                      }}
                      className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border transition-all ${server.isEnabled ? 'border-green-500/40 text-green-500' : 'border-green-500/10 text-green-500/20'}`}
                    >
                      {server.isEnabled ? 'ON' : 'OFF'}
                    </button>
                    <DeleteButton onDelete={() => dynConfig.deleteMCPServer(server.id)} label={server.name} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ========== COMPUTE NODES ==========
      case 'compute_nodes':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader icon={HardDrive} title="COMPUTE_NODES" count={config.computeNodes.length} onAdd={() => setShowAddNode(true)} addLabel="ADD_NODE" />

            <AddForm show={showAddNode} onSubmit={handleAddNode} onCancel={() => setShowAddNode(false)}>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="节点名" value={newNode.name} onChange={v => setNewNode(p => ({ ...p, name: v }))} placeholder="e.g. GPU Server #2" />
                <FormInput label="主机地址" value={newNode.host} onChange={v => setNewNode(p => ({ ...p, host: v }))} placeholder="e.g. 192.168.1.100" />
                <FormInput label="CPU" value={newNode.cpu} onChange={v => setNewNode(p => ({ ...p, cpu: v }))} placeholder="e.g. AMD EPYC 7763" />
                <FormInput label="GPU" value={newNode.gpu} onChange={v => setNewNode(p => ({ ...p, gpu: v }))} placeholder="e.g. NVIDIA A100 80GB" />
                <FormInput label="内存" value={newNode.memory} onChange={v => setNewNode(p => ({ ...p, memory: v }))} placeholder="e.g. 256GB DDR5" />
                <FormInput label="存储" value={newNode.storage} onChange={v => setNewNode(p => ({ ...p, storage: v }))} placeholder="e.g. 4TB NVMe" />
              </div>
            </AddForm>

            <div className="space-y-4">
              {config.computeNodes.map(node => (
                <div key={node.id} className={`p-5 border transition-all ${node.status === 'online' ? 'border-green-500/30 bg-green-500/5' : 'border-green-500/10 bg-black'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 border flex items-center justify-center ${node.status === 'online' ? 'border-green-500 bg-green-500/10' : 'border-green-500/20'}`}>
                        <Server className={`h-5 w-5 ${node.status === 'online' ? 'text-green-500' : 'text-green-500/30'}`} />
                      </div>
                      <div>
                        <InlineEditField value={node.name} onSave={v => dynConfig.updateComputeNode(node.id, { name: v })} className="text-sm font-bold text-green-500 font-mono" />
                        <div className="flex items-center gap-2 mt-0.5">
                          <InlineEditField value={node.host} onSave={v => dynConfig.updateComputeNode(node.id, { host: v })} className="text-[10px] text-green-500/40 font-mono" />
                          <span className="text-[9px] px-1 py-0.5 border border-green-500/15 text-green-500/30 uppercase">{node.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(['online', 'offline', 'maintenance'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => dynConfig.updateComputeNode(node.id, { status: s })}
                          className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all ${
                            node.status === s
                              ? s === 'online' ? 'bg-green-500/20 border-green-500 text-green-500'
                                : s === 'maintenance' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500'
                                : 'bg-red-500/20 border-red-500/50 text-red-500'
                              : 'border-green-500/10 text-green-500/15 hover:text-green-500/40'
                          }`}
                        >
                          {s === 'online' ? '在线' : s === 'offline' ? '离线' : '维护'}
                        </button>
                      ))}
                      <DeleteButton onDelete={() => dynConfig.deleteComputeNode(node.id)} label={node.name} />
                    </div>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {[
                      { label: 'CPU', value: node.specs.cpu, key: 'cpu' },
                      { label: 'GPU', value: node.specs.gpu, key: 'gpu' },
                      { label: 'MEM', value: node.specs.memory, key: 'memory' },
                      { label: 'DISK', value: node.specs.storage, key: 'storage' },
                    ].map(spec => (
                      <div key={spec.key} className="p-2 border border-green-500/10 bg-black/50">
                        <label className="text-[8px] font-bold text-green-500/30 uppercase tracking-widest block mb-0.5">{spec.label}</label>
                        <InlineEditField
                          value={spec.value}
                          onSave={v => dynConfig.updateComputeNode(node.id, { specs: { ...node.specs, [spec.key]: v } })}
                          className="text-[10px] text-green-500/60 font-mono"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Metrics (editable) */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'GPU利用率', value: node.metrics.gpuUtil, key: 'gpuUtil', unit: '%', color: 'green' },
                      { label: '内存利用率', value: node.metrics.memUtil, key: 'memUtil', unit: '%', color: 'blue' },
                      { label: '温度', value: node.metrics.temperature, key: 'temperature', unit: '°C', color: 'orange' },
                    ].map(metric => (
                      <div key={metric.key} className="p-2 border border-green-500/10 bg-black/50">
                        <label className="text-[8px] font-bold text-green-500/30 uppercase tracking-widest block mb-1">{metric.label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max={metric.key === 'temperature' ? 120 : 100}
                            value={metric.value}
                            onChange={e => dynConfig.updateComputeNode(node.id, { metrics: { ...node.metrics, [metric.key]: parseInt(e.target.value) } })}
                            className="flex-1 h-1 opacity-50 cursor-pointer"
                          />
                          <span className="text-xs text-green-500 font-mono w-10 text-right">{metric.value}{metric.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ========== WORKFLOWS ==========
      case 'workflows':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader icon={Workflow} title="WORKFLOW_PIPELINES" count={config.workflows.length} onAdd={() => setShowAddWorkflow(true)} addLabel="NEW_FLOW" />

            <AddForm show={showAddWorkflow} onSubmit={handleAddWorkflow} onCancel={() => setShowAddWorkflow(false)}>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="名称" value={newWorkflow.name} onChange={v => setNewWorkflow(p => ({ ...p, name: v }))} placeholder="e.g. Auto_Deploy" />
                <FormInput label="描述" value={newWorkflow.description} onChange={v => setNewWorkflow(p => ({ ...p, description: v }))} placeholder="描述" />
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-green-500/50 uppercase tracking-widest">步骤数</label>
                  <input type="number" min="1" max="20" value={newWorkflow.steps} onChange={e => setNewWorkflow(p => ({ ...p, steps: parseInt(e.target.value) || 1 }))} className="w-full bg-black border border-green-500/20 text-green-500 text-xs font-mono px-3 py-2 outline-none" />
                </div>
              </div>
            </AddForm>

            <div className="space-y-3">
              {config.workflows.map(flow => (
                <div key={flow.id} className="p-4 border border-green-500/20 bg-black flex items-center justify-between group hover:border-green-500/50 transition-all">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                      onClick={() => {
                        const next = flow.status === 'active' ? 'inactive' : 'active';
                        dynConfig.updateWorkflow(flow.id, { status: next });
                        toast.message("WORKFLOW_STATUS_CHANGED", { description: `${flow.name} → ${next.toUpperCase()}` });
                      }}
                      className={`p-2 border transition-all shrink-0 ${flow.status === 'active' ? 'border-green-500 bg-green-500/10' : 'border-green-500/30 bg-transparent hover:border-green-500'}`}
                    >
                      <Command className={`h-4 w-4 ${flow.status === 'active' ? 'text-green-500' : 'text-green-500/50'}`} />
                    </button>
                    <div className="min-w-0">
                      <InlineEditField value={flow.name} onSave={v => dynConfig.updateWorkflow(flow.id, { name: v })} className="text-sm font-bold text-green-500 font-mono" />
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-green-500/40 uppercase tracking-widest">{flow.steps} STEPS</span>
                        <span className="text-[10px] text-green-500/30">·</span>
                        <select
                          value={flow.trigger}
                          onChange={e => dynConfig.updateWorkflow(flow.id, { trigger: e.target.value as 'auto' | 'manual' | 'schedule' })}
                          className="bg-transparent text-[10px] text-green-500/40 uppercase tracking-widest outline-none cursor-pointer"
                        >
                          <option value="auto">AUTO</option>
                          <option value="manual">MANUAL</option>
                          <option value="schedule">SCHEDULE</option>
                        </select>
                      </div>
                      {flow.description && <p className="text-[10px] text-green-500/25 mt-0.5">{flow.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toast.info(`RUNNING: ${flow.name}...`)} className="p-1.5 text-green-500/50 hover:text-green-500 transition-colors"><Play className="h-3.5 w-3.5" /></button>
                    <DeleteButton onDelete={() => dynConfig.deleteWorkflow(flow.id)} label={flow.name} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ========== EXTENSIONS ==========
      case 'extensions':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader icon={Package} title="EXTENSION_REGISTRY" count={config.extensions.length} onAdd={() => setShowAddExtension(true)} addLabel="ADD_PACKAGE" />

            <AddForm show={showAddExtension} onSubmit={handleAddExtension} onCancel={() => setShowAddExtension(false)}>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="名称" value={newExtension.name} onChange={v => setNewExtension(p => ({ ...p, name: v }))} placeholder="e.g. Code_Formatter" />
                <FormInput label="描述" value={newExtension.description} onChange={v => setNewExtension(p => ({ ...p, description: v }))} placeholder="描述" />
                <FormInput label="版本" value={newExtension.version} onChange={v => setNewExtension(p => ({ ...p, version: v }))} placeholder="1.0.0" />
                <FormInput label="作者" value={newExtension.author} onChange={v => setNewExtension(p => ({ ...p, author: v }))} placeholder="作者" />
              </div>
            </AddForm>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.extensions.map(ext => (
                <div key={ext.id} className="p-4 border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-all flex flex-col justify-between min-h-[160px]">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Package className="h-5 w-5 text-green-500" />
                      <div className="flex items-center gap-1">
                        {ext.isInstalled ? (
                          <span className="text-[10px] bg-green-500 text-black px-1.5 py-0.5 font-bold uppercase tracking-widest">INSTALLED</span>
                        ) : (
                          <span className="text-[10px] border border-green-500/30 text-green-500/50 px-1.5 py-0.5 font-bold uppercase tracking-widest">AVAILABLE</span>
                        )}
                        <DeleteButton onDelete={() => dynConfig.deleteExtension(ext.id)} label={ext.name} />
                      </div>
                    </div>
                    <InlineEditField value={ext.name} onSave={v => dynConfig.updateExtension(ext.id, { name: v })} className="text-sm font-bold text-green-500 font-mono block mb-1" />
                    <p className="text-xs text-green-500/60 leading-relaxed">{ext.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-green-500/30">v{ext.version}</span>
                      <span className="text-[9px] text-green-500/20">by {ext.author}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      dynConfig.updateExtension(ext.id, { isInstalled: !ext.isInstalled, isEnabled: !ext.isInstalled });
                      toast.success(ext.isInstalled ? `PACKAGE_REMOVED: ${ext.name}` : `PACKAGE_INSTALLED: ${ext.name}`);
                    }}
                    className={`w-full rounded-none text-xs font-bold uppercase tracking-widest border mt-3 ${
                      ext.isInstalled
                        ? "bg-transparent text-green-500/50 border-green-500/20 hover:text-red-500 hover:border-red-500/50"
                        : "bg-green-500 text-black border-green-500 hover:bg-green-400"
                    }`}
                  >
                    {ext.isInstalled ? "DISABLE / UNINSTALL" : "INSTALL_PACKAGE"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      // ========== GIT OPS ==========
      case 'gitops':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 p-6 bg-green-500/5 border border-green-500/20">
              <div className="w-12 h-12 bg-black border border-green-500 flex items-center justify-center">
                <GitBranch className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-green-500">GITHUB_INTEGRATION_V2</h4>
                <p className="text-xs text-green-500/50 mt-1">Status: Authenticated as @esmondrio</p>
              </div>
              <Button onClick={() => toast.info("RE-AUTHENTICATING_GITHUB...")} className="ml-auto bg-green-500 text-black font-bold uppercase text-xs tracking-widest rounded-none hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                RE-AUTH
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input value={gitRepo} onChange={(e) => setGitRepo(e.target.value)} placeholder="username/repository-name" className="flex-1 bg-black border-green-500/30 text-green-500 font-mono focus-visible:ring-0 focus-visible:border-green-500" />
                <Button onClick={() => toast.info(`SEARCHING_REPO: ${gitRepo}...`)} className="bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-black rounded-none">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'CREATE_REPO', icon: Plus, op: 'CREATE_REPO' },
                  { label: gitStatus === 'syncing' ? 'PUSHING...' : 'PUSH_CHANGES', icon: RotateCw, op: 'PUSH_CHANGES' },
                  { label: 'PULL_LATEST', icon: CheckCircle, op: 'PULL_LATEST' },
                ].map(({ label, icon: Icon, op }) => (
                  <button key={op} onClick={() => handleGitOperation(op)} className="p-4 border border-green-500/20 hover:bg-green-500/10 hover:border-green-500 transition-all flex flex-col items-center gap-2 group hover:-translate-y-1 duration-300">
                    <Icon className={`h-6 w-6 text-green-500/50 group-hover:text-green-500 ${op === 'PUSH_CHANGES' && gitStatus === 'syncing' ? 'animate-spin text-green-500' : ''}`} />
                    <span className="text-xs font-bold text-green-500 uppercase tracking-widest">{label}</span>
                  </button>
                ))}
              </div>

              {gitStatus === "success" && (
                <div className="p-3 bg-green-500/20 border border-green-500 text-green-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle className="h-4 w-4" /> OPERATION_SUCCESSFUL
                </div>
              )}
            </div>
          </div>
        );

      // ========== UI/UX ==========
      case 'ui_ux':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section>
              <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Monitor className="h-4 w-4" /> INTERFACE_PARAMETERS
              </h3>
              <div className="grid gap-8 p-6 border border-green-500/20 bg-green-500/5">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                    <Palette className="h-3 w-3" /> PHOSPHOR_TYPE
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["P1 (Green)", "P3 (Amber)", "P4 (White)", "B2 (Blue)"].map(theme => (
                      <button key={theme} onClick={() => handleUiChange('theme', theme)} className={`h-10 text-xs font-bold uppercase tracking-wider border transition-all ${uiSettings.theme === theme ? "bg-green-500 text-black border-green-500" : "bg-black text-green-500/30 border-green-500/20 hover:border-green-500/50 hover:text-green-500"}`}>
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                    <Type className="h-3 w-3" /> TERMINAL_FONT_SIZE
                  </label>
                  <div className="flex items-center gap-4 bg-black border border-green-500/20 p-1">
                    {['small', 'medium', 'large'].map(size => (
                      <button key={size} onClick={() => handleUiChange('fontSize', size)} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all ${uiSettings.fontSize === size ? "bg-green-500 text-black" : "text-green-500/40 hover:text-green-500"}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest">SCANLINE_INTENSITY</label>
                      <span className="text-xs font-mono text-green-500">{uiSettings.scanlines}%</span>
                    </div>
                    <div className="relative h-2 bg-green-900/20 rounded-full">
                      <input type="range" min="0" max="100" value={uiSettings.scanlines} onChange={e => handleUiChange('scanlines', parseInt(e.target.value))} className="absolute w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="absolute h-full bg-green-500/20 rounded-full" style={{ width: `${uiSettings.scanlines}%` }} />
                      <div className="absolute h-4 w-4 bg-green-500 rounded-full top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(34,197,94,0.8)]" style={{ left: `${uiSettings.scanlines}%`, transform: `translate(-50%, -50%)` }} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center h-full pt-6">
                      <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest">CRT_CURVATURE_FX</label>
                      <button onClick={() => handleUiChange('curvature', !uiSettings.curvature)} className={`w-12 h-6 rounded-full border transition-all relative ${uiSettings.curvature ? "bg-green-500/20 border-green-500" : "bg-black border-green-500/20"}`}>
                        <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full transition-all shadow-[0_0_10px_rgba(34,197,94,0.8)] ${uiSettings.curvature ? "right-1" : "left-1 opacity-50"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        );

      // ========== NETWORK CONFIG (FIX-004) ==========
      case 'network':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-green-500" />
              <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest">NETWORK_CONFIG</h3>
              <span className="ml-auto text-[10px] text-green-500/30 font-mono">FIX-004: WS_RECONNECT_PARAMS</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {([
                { key: 'reconnectInterval', label: 'WS 重连间隔', unit: 'ms', desc: 'WebSocket 断开后首次重连的等待时间' },
                { key: 'maxReconnectAttempts', label: '最大重连次数', unit: '次', desc: '达到上限后进入 MOCK 模式' },
                { key: 'heartbeatInterval', label: '心跳间隔', unit: 'ms', desc: '发送 ping/pong 的频率' },
                { key: 'connectionTimeout', label: '连接超时', unit: 'ms', desc: 'WebSocket 握手超时' },
                { key: 'agentCallTimeout', label: 'Agent 调用超时', unit: 'ms', desc: 'LLM 响应等待上限' },
                { key: 'maxReconnectDelay', label: '最大重连延迟', unit: 'ms', desc: '指数退避的延迟上限' },
                { key: 'backoffMultiplier', label: '退避系数', unit: '×', desc: '每次重连延迟 = 基础 × 系数^次数' },
              ] as const).map(({ key, label, unit, desc }) => (
                <div key={key} className="bg-black/20 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-green-400 font-mono">{label}</div>
                    <div className="text-[10px] text-green-500/30">{desc}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={config.networkConfig?.[key] ?? 0}
                      onChange={(e) => {
                        const val = key === 'backoffMultiplier' ? parseFloat(e.target.value) : parseInt(e.target.value);
                        if (!isNaN(val)) {
                          dynConfig.updateNetworkConfig({ [key]: val });
                        }
                      }}
                      step={key === 'backoffMultiplier' ? 0.1 : 100}
                      className="w-24 bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-1 text-xs font-mono text-right outline-none focus:border-green-500"
                    />
                    <span className="text-[10px] text-green-500/40 font-mono w-6">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ========== UI PARAMS (FIX-005) ==========
      case 'ui_params':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="h-4 w-4 text-green-500" />
              <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest">UI_PARAMETERS</h3>
              <span className="ml-auto text-[10px] text-green-500/30 font-mono">FIX-005: MAGIC_NUMBERS</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {([
                { key: 'avatarRailCollapsedWidth', label: '头像轨道折叠宽度', unit: 'px', desc: '侧边头像栏折叠时的宽度' },
                { key: 'avatarRailExpandedWidth', label: '头像轨道展开宽度', unit: 'px', desc: '侧边头像栏展开时的宽度' },
                { key: 'maxVisibleMessages', label: '消息最大显示条数', unit: '条', desc: '聊天区域保留的最大消息数' },
                { key: 'terminalMaxLines', label: '终端最大行数', unit: '行', desc: '集成终端的最大历史行数' },
                { key: 'animationDuration', label: '动画持续时间', unit: 'ms', desc: 'Motion 动画的默认时长' },
                { key: 'typingSpeed', label: '打字效果速度', unit: 'ms/字', desc: '逐字显示的间隔' },
                { key: 'toastDuration', label: 'Toast 持续时间', unit: 'ms', desc: '通知消息的显示时长' },
              ] as const).map(({ key, label, unit, desc }) => (
                <div key={key} className="bg-black/20 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-green-400 font-mono">{label}</div>
                    <div className="text-[10px] text-green-500/30">{desc}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={config.uiConfig?.[key] ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 0) {
                          dynConfig.updateUIConfig({ [key]: val });
                        }
                      }}
                      step={key === 'typingSpeed' ? 5 : 10}
                      className="w-24 bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-1 text-xs font-mono text-right outline-none focus:border-green-500"
                    />
                    <span className="text-[10px] text-green-500/40 font-mono w-8">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ========== CHANNELS ==========
      case 'channels':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section>
              <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Folder className="h-4 w-4" /> STORAGE_PARTITIONS
              </h3>
              <div className="grid gap-6">
                <div className="p-4 border border-green-500/20 bg-green-500/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-green-500 uppercase tracking-wide">
                      ACTIVE: {channelManager?.channels.find(c => c.id === channelManager.activeChannelId)?.name || 'UNKNOWN'}
                    </h4>
                    <p className="text-xs text-green-500/50 mt-1 font-mono">ID: {channelManager?.activeChannelId}</p>
                  </div>
                  <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="h-8 border-green-500/30 text-green-500 hover:bg-green-500/10 rounded-none text-xs font-bold uppercase tracking-widest gap-2">
                      <Upload className="h-3 w-3" /> IMPORT
                    </Button>
                    <Button onClick={onExportChannel} variant="outline" size="sm" className="h-8 border-green-500/30 text-green-500 hover:bg-green-500/10 rounded-none text-xs font-bold uppercase tracking-widest gap-2">
                      <Download className="h-3 w-3" /> EXPORT
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {channelManager?.channels.map(channel => (
                    <div key={channel.id} className={`p-4 border transition-all flex items-center justify-between ${channel.id === channelManager.activeChannelId ? "border-green-500 bg-green-500/10" : "border-green-500/20 bg-black hover:border-green-500/50"}`}>
                      <div className="flex items-center gap-4">
                        <Folder className={`h-5 w-5 ${channel.id === channelManager.activeChannelId ? "text-green-500" : "text-green-500/30"}`} />
                        <div>
                          <h4 className={`text-sm font-bold font-mono ${channel.id === channelManager.activeChannelId ? "text-green-500" : "text-green-500/70"}`}>
                            {channel.name}
                            {channel.isEncrypted && <Lock className="inline-block w-3 h-3 ml-2 text-green-500/50" />}
                          </h4>
                          <span className="text-[10px] text-green-500/30 uppercase tracking-widest">
                            {channel.preset?.toUpperCase() || "GENERAL"} · {new Date(channel.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {channel.id === channelManager.activeChannelId ? (
                          <span className="px-3 py-1 bg-green-500 text-black text-[10px] font-bold uppercase tracking-widest">MOUNTED</span>
                        ) : (
                          <Button onClick={() => { channelManager.setActiveChannelId(channel.id); toast.success("VOLUME_MOUNTED"); }} variant="ghost" size="sm" className="text-green-500/50 hover:text-green-500 hover:bg-green-500/10 rounded-none border border-transparent hover:border-green-500/30 text-xs font-bold uppercase tracking-widest">
                            MOUNT
                          </Button>
                        )}
                        {channel.id !== 'main' && channel.id !== channelManager.activeChannelId && (
                          <Button onClick={() => { if (confirm("CONFIRM_DELETION?")) { channelManager.deleteChannel(channel.id); toast.success("VOLUME_FORMATTED"); } }} variant="ghost" size="icon" className="h-8 w-8 text-green-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-none">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border border-dashed border-green-500/20 bg-black/50">
                  <label className="text-[10px] font-bold text-green-500/50 uppercase tracking-widest mb-2 block">NEW_PARTITION</label>
                  <div className="flex flex-col gap-3">
                    <Input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="PARTITION_LABEL..." className="bg-black border-green-500/30 text-green-500 font-mono focus-visible:ring-0 focus-visible:border-green-500 h-10 rounded-none" />
                    <div className="flex gap-2">
                      <select value={newChannelPreset} onChange={e => setNewChannelPreset(e.target.value)} className="bg-black border border-green-500/30 text-green-500 text-xs font-bold uppercase tracking-widest h-10 px-3 outline-none">
                        {Object.keys(PRESETS).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                      </select>
                      <button onClick={() => setNewChannelEncrypted(!newChannelEncrypted)} className={`px-3 border h-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${newChannelEncrypted ? "bg-green-500 text-black border-green-500" : "bg-transparent text-green-500/30 border-green-500/30 hover:border-green-500"}`}>
                        {newChannelEncrypted ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        {newChannelEncrypted ? "SECURE" : "OPEN"}
                      </button>
                      <Button onClick={handleCreateChannel} disabled={!newChannelName.trim()} className="flex-1 bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-black rounded-none font-bold uppercase tracking-widest text-xs h-10">
                        <Plus className="h-4 w-4 mr-2" /> CREATE
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        );

      // ========== PROFILE ==========
      default:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                <div className="w-24 h-24 bg-black border border-green-500 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                  <User className="h-10 w-10 text-green-500" />
                </div>
                <button onClick={() => toast.info("UPLOAD_AVATAR_INIT...")} className="absolute -bottom-2 -right-2 p-2 bg-black border border-green-500 hover:bg-green-500 hover:text-black text-green-500 transition-all shadow-lg">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div>
                <h4 className="text-lg font-bold text-green-500 mb-1 tracking-wider">USER_ADMIN</h4>
                <p className="text-xs text-green-500/40 font-mono">ID: 0x8F3A2C1B</p>
                <div className="inline-flex items-center gap-1.5 mt-3 px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-500 text-[9px] font-bold uppercase tracking-widest">
                  ROOT_PRIVILEGES
                </div>
              </div>
            </div>

            {/* Config Export/Import/Reset */}
            <div className="mt-8 pt-6 border-t border-green-500/10">
              <h3 className="text-xs font-bold text-green-500/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Database className="h-4 w-4" /> CONFIG_MANAGEMENT
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(dynConfig.exportConfig());
                    toast.success("CONFIG_EXPORTED", { description: "JSON copied to clipboard" });
                  }}
                  className="p-4 border border-green-500/20 hover:bg-green-500/10 hover:border-green-500 transition-all flex flex-col items-center gap-2"
                >
                  <Copy className="h-5 w-5 text-green-500/50" />
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">EXPORT_CONFIG</span>
                </button>
                <button
                  onClick={() => {
                    const json = prompt("粘贴配置 JSON:");
                    if (json) {
                      const ok = dynConfig.importConfig(json);
                      toast[ok ? 'success' : 'error'](ok ? "CONFIG_IMPORTED" : "IMPORT_FAILED");
                    }
                  }}
                  className="p-4 border border-green-500/20 hover:bg-green-500/10 hover:border-green-500 transition-all flex flex-col items-center gap-2"
                >
                  <Upload className="h-5 w-5 text-green-500/50" />
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">IMPORT_CONFIG</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm("RESET_ALL_CONFIG? 所有配置将恢复默认值。")) {
                      dynConfig.resetToDefaults();
                      toast.success("CONFIG_RESET", { description: "All configurations restored to defaults" });
                    }
                  }}
                  className="p-4 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500 transition-all flex flex-col items-center gap-2"
                >
                  <RefreshCw className="h-5 w-5 text-red-500/50" />
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">RESET_DEFAULTS</span>
                </button>
              </div>
              <div className="mt-4 p-3 bg-green-500/5 border border-green-500/10">
                <p className="text-[10px] text-green-500/30 font-mono">
                  CONFIG_VERSION: v{config.version} · LAST_MODIFIED: {new Date(config.lastModified).toLocaleString()} · ITEMS: {config.providers.length}P/{config.models.length}M/{config.agents.length}A/{config.endpoints.length}E
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  // ==========================================
  // Main Render
  // ==========================================

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-5xl h-[85vh] bg-black border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)] flex overflow-hidden z-50"
          >
            {/* Sidebar */}
            <div className="w-60 border-r border-green-500/20 flex flex-col bg-black/50 shrink-0">
              <div className="p-5 border-b border-green-500/20">
                <h2 className="text-lg font-bold text-green-500 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  SYS_CTRL
                </h2>
                <p className="text-[10px] text-green-500/40 uppercase tracking-widest mt-1">v{config.version} · Dynamic Config</p>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-0.5">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as TabId)}
                    className={`w-full px-5 py-2.5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider transition-all relative overflow-hidden group ${
                      activeTab === item.id
                        ? "text-black bg-green-500"
                        : "text-green-500/50 hover:text-green-500 hover:bg-green-500/5"
                    }`}
                  >
                    <item.icon className={`h-3.5 w-3.5 relative z-10 ${activeTab === item.id ? "text-black" : "text-green-500/50 group-hover:text-green-500"}`} />
                    <span className="relative z-10">{item.label}</span>
                    {activeTab === item.id && (
                      <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1 bg-green-900 z-20" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 border-t border-green-500/20">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 bg-green-500 rounded-none flex items-center justify-center text-black font-bold text-xs">YY</div>
                  <div>
                    <p className="text-xs font-bold text-green-500">YanYu_Admin</p>
                    <p className="text-[10px] text-green-500/40 uppercase">Level 5 Access</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-black/90 relative">
              <div className="h-14 border-b border-green-500/20 flex items-center justify-between px-6 bg-green-500/5 shrink-0">
                <div className="flex items-center gap-2 text-green-500/40 text-xs font-mono uppercase tracking-widest">
                  <span>ROOT</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>CONFIG</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-green-500 font-bold">{activeTab.replace('_', ' ')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={onClose} className="h-7 border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black hover:border-green-500 transition-all rounded-none text-[10px] font-bold uppercase tracking-widest">
                    ESC
                  </Button>
                  <Button size="sm" onClick={handleSave} className="h-7 bg-green-500 text-black hover:bg-green-400 rounded-none text-[10px] font-bold uppercase tracking-widest gap-1 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <CheckCircle className="h-3 w-3" /> SAVE
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
