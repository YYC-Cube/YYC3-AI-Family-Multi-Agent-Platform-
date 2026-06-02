/**
 * file: dynamic-config.ts
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
 * YYC³ AI Family — Dynamic Configuration Type System
 * 
 * 所有 UI 可编辑配置的类型定义
 * 支持 CRUD 操作：增删改查
 * 
 * 敏感值（API Key、密码）通过 env() 读取，UI 仅存 localStorage
 * 绝不在代码中硬编码不可逆的敏感数据
 */

// ==========================================
// LLM Provider 配置
// ==========================================

export interface LLMProviderConfig {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  apiKeyEnvVar: string;       // 环境变量名，而非值本身
  apiKeyOverride?: string;    // UI 输入的临时覆盖（localStorage）
  isEnabled: boolean;
  priority: number;           // 越小优先级越高
  color: string;
  models: string[];           // 该 provider 下可用模型 ID
  description: string;
}

// ==========================================
// 模型配置
// ==========================================

export interface ModelConfig {
  id: string;
  name: string;
  displayName: string;
  providerId: string;
  description: string;
  color: string;
  isAvailable: boolean;
  capabilities: string[];     // e.g. ['chat','code','vision']
  maxTokens?: number;
  contextWindow?: number;
}

// ==========================================
// AI Family 角色配置
// ==========================================

export interface AIAgentConfig {
  id: string;
  roleId: string;
  name: string;
  nameCN: string;
  version: string;
  role: string;
  roleCN: string;
  modelId: string;
  providerId: string;
  color: string;
  status: 'active' | 'standby' | 'disabled';
  systemPromptTemplate?: string;
  capabilities: string[];
  permissions: Record<string, boolean>;
}

// ==========================================
// Endpoint 配置
// ==========================================

export interface EndpointConfig {
  id: string;
  name: string;
  url: string;
  envVar: string;             // 环境变量名
  description: string;
  category: 'api' | 'websocket' | 'database' | 'cache' | 'llm' | 'vector' | 'custom';
  isHealthy: boolean;
  lastChecked?: number;
}

// ==========================================
// MCP Server 配置
// ==========================================

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'error';
  latency: string;
  description: string;
  isEnabled: boolean;
  capabilities: string[];
}

// ==========================================
// Workflow 配置
// ==========================================

export interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  steps: number;
  status: 'active' | 'inactive' | 'error';
  trigger: 'auto' | 'manual' | 'schedule';
  createdAt: number;
  lastRun?: number;
}

// ==========================================
// Extension 配置
// ==========================================

export interface ExtensionConfig {
  id: string;
  name: string;
  description: string;
  isInstalled: boolean;
  isEnabled: boolean;
  version: string;
  author: string;
  category: string;
}

// ==========================================
// 计算节点配置
// ==========================================

export interface ComputeNodeConfig {
  id: string;
  name: string;
  host: string;
  type: 'local' | 'remote' | 'cloud';
  status: 'online' | 'offline' | 'maintenance';
  specs: {
    cpu: string;
    gpu: string;
    memory: string;
    storage: string;
  };
  metrics: {
    gpuUtil: number;
    memUtil: number;
    temperature: number;
  };
  isEnabled: boolean;
}

// ==========================================
// 网络/连接配置 (FIX-004: WS 重连参数动态化)
// ==========================================

export interface NetworkConfig {
  /** WebSocket 重连间隔 (ms) */
  reconnectInterval: number;
  /** 最大重连次数 */
  maxReconnectAttempts: number;
  /** 心跳间隔 (ms) */
  heartbeatInterval: number;
  /** 连接超时 (ms) */
  connectionTimeout: number;
  /** Agent 调用超时 (ms) */
  agentCallTimeout: number;
  /** 重连最大延迟上限 (ms) */
  maxReconnectDelay: number;
  /** 退避系数 (指数退避) */
  backoffMultiplier: number;
}

// ==========================================
// UI 配置 (FIX-005: UI 魔法数字动态化)
// ==========================================

export interface UIConfig {
  /** 头像轨道折叠宽度 (px) */
  avatarRailCollapsedWidth: number;
  /** 头像轨道展开宽度 (px) */
  avatarRailExpandedWidth: number;
  /** 消息列表最大显示条数 */
  maxVisibleMessages: number;
  /** 终端最大行数 */
  terminalMaxLines: number;
  /** 动画持续时间 (ms) */
  animationDuration: number;
  /** 打字效果速度 (ms/字) */
  typingSpeed: number;
  /** Toast 显示持续时间 (ms) */
  toastDuration: number;
}

// ==========================================
// 完整动态配置
// ==========================================

export interface DynamicConfig {
  providers: LLMProviderConfig[];
  models: ModelConfig[];
  agents: AIAgentConfig[];
  endpoints: EndpointConfig[];
  mcpServers: MCPServerConfig[];
  workflows: WorkflowConfig[];
  extensions: ExtensionConfig[];
  computeNodes: ComputeNodeConfig[];
  networkConfig: NetworkConfig;
  uiConfig: UIConfig;
  version: number;             // 配置版本号，每次修改递增
  lastModified: number;
  _schemaVersion?: number;     // Schema 迁移版本号
}

// ==========================================
// CRUD 操作类型
// ==========================================

export type ConfigSection = keyof Omit<DynamicConfig, 'version' | 'lastModified' | '_schemaVersion' | 'networkConfig' | 'uiConfig'>;

export interface ConfigAction<T> {
  type: 'add' | 'update' | 'delete' | 'reorder' | 'reset';
  section: ConfigSection;
  id?: string;
  data?: Partial<T>;
  index?: number;
}