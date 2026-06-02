/**
 * file: family-manifest.ts
 * description: YYC³ AI Family 数字基因与宪章 · 九层家人档案权威源 (v2.0)
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-04-04
 * updated: 2026-06-02
 * status: stable
 * tags: [types],[family-manifest],[五高],[五标],[五化],[五维]
 *
 * brief: 基于《YYC³ AI Family 九层家人档案》定义 8 位家人、五化一体、五维评估、五高/五标/五化转型框架。
 *
 * details:
 *   - §1.4 八位家人：千行/万物/先知/伯乐/天枢/守护/宗师/灵韵
 *   - §1.2 五化一体：智能标准化/流程化/规范化/全面智能化/生态国标化
 *   - §五维评估：时间维/空间维/属性维/事件维/关联维
 *   - §五高架构：高可用/高性能/高安全/高扩展/高智能
 *   - §五标规范：标准化/规范化/自动化/可视化/智能化
 *   - §五化转型：流程化/数字化/生态化/工具化/服务化
 *
 * dependencies: none (root type definitions)
 * exports: RoleId, FamilyMemberState, FAMILY_ROLES, FIVE_DIMENSIONS, FIVE_HIGHS, FIVE_STANDARDS, FIVE_TRANSFORMATIONS, ...
 * notes:
 *   - 本文件为权威源 (Single Source of Truth)
 *   - 与《YYC3-AI-Family-九层家人档案.md》保持同步
 *   - 命名"知遇·伯乐"为唯一标准（档案内部"千里/知遇"不一致，已统一为"知遇"）
 */

// ==========================================
// 1. 核心哲学：五化一体 (The Five-in-One Law)
// 档案 §1.2
// ==========================================
export type FiveInOneDimension =
  | 'STANDARDIZATION'   // 智能标准化 (Standardization)
  | 'PROCESS'           // 智能流程化 (Process-Oriented)
  | 'NORMALIZATION'     // 智能规范化 (Normalization)
  | 'INTELLIGENCE'      // 全面智能化 (Intelligence)
  | 'NATIONAL_STD';     // 生态国标化 (National Standard)

export interface FamilyPhilosophy {
  dimension: FiveInOneDimension;
  name: string;
  description: string;
  manifestation: string;
}

// Family Mood States (家族情绪状态)
export type FamilyMood = 'SERENE' | 'FOCUSED' | 'EXCITED' | 'LOVING';

// ==========================================
// 2. 八位家人 (Eight Family Members)
// 档案 §1.4 + AI-Family 成员矩阵
// ==========================================

/**
 * RoleId — 家族成员机器标识符
 *
 * 命名约定：与档案"专属文件架构"目录名对齐
 *   /modules/ai-analysis/members/{navigator,thinker,prophet,bole}/
 *   /core/ai-family/members/{meta-oracle,guardian,master,creative}/
 */
export type RoleId =
  | 'NAVIGATOR'      // 言启·千行   QianHang   — 导航员（意图识别）
  | 'THINKER'        // 语枢·万物   All Things — 思考者（数据分析）
  | 'PROPHET'        // 预见·先知   Prophet    — 预言家（趋势预测）
  | 'BOLE'           // 知遇·伯乐   Bole       — 推荐官（个性化推荐）
  | 'META_ORACLE'    // 元启·天枢   TianShu    — 总指挥（决策中枢）
  | 'GUARDIAN'       // 智云·守护   Guardian   — 安全官（行为审计）
  | 'MASTER'         // 格物·宗师   Grandmaster— 质量官（代码分析）
  | 'CREATIVE';      // 创想·灵韵   Grace      — 创意官（内容创作）

export type FamilyMemberLayer = 'COMMAND' | 'GUARDIAN' | 'BUSINESS';

export interface FamilyPersona {
  id: RoleId;
  name: string;              // 中文名 e.g. "言启·千行"
  englishName: string;       // 英文名 e.g. "QianHang"
  roleTitle: string;         // 角色头衔 e.g. "导航员"
  motto: string;             // 角色语录
  primaryDuty: string;       // 主职责
  capabilities: string[];    // 核心能力清单
  layer: FamilyMemberLayer;  // 所属层级
  modulePath: string;        // 专属模块目录 (档案 §专属文件架构)
  color: string;             // UI Theme Color
  emoji: string;             // 家族标识 emoji
}

export const FAMILY_ROLES: Record<RoleId, FamilyPersona> = {
  NAVIGATOR: {
    id: 'NAVIGATOR',
    name: '言启·千行',
    englishName: 'QianHang',
    roleTitle: '导航员',
    motto: '我聆听万千言语，为您指引航向。',
    primaryDuty: '意图识别与路由',
    capabilities: [
      '自然语言理解 (NLU)',
      '意图识别与路由',
      '上下文管理',
      'Prompt Engineering',
      '语义理解',
      '实体抽取',
    ],
    layer: 'BUSINESS',
    modulePath: '/modules/ai-analysis/members/navigator',
    color: '#38bdf8',  // sky-400
    emoji: '🧭',
  },
  THINKER: {
    id: 'THINKER',
    name: '语枢·万物',
    englishName: 'All Things',
    roleTitle: '思考者',
    motto: '我于喧嚣数据中，沉思，而后揭示真理。',
    primaryDuty: '数据分析与洞察',
    capabilities: [
      '数据洞察生成',
      '文档智能分析',
      '假设推演',
      '深度数据分析',
      '归纳推理',
      '文本摘要生成',
    ],
    layer: 'BUSINESS',
    modulePath: '/modules/ai-analysis/members/thinker',
    color: '#a78bfa',  // violet-400
    emoji: '🤔',
  },
  PROPHET: {
    id: 'PROPHET',
    name: '预见·先知',
    englishName: 'Prophet',
    roleTitle: '预言家',
    motto: '我观过往之脉络，预见未来之可能。',
    primaryDuty: '趋势预测与预警',
    capabilities: [
      '时间序列预测',
      '异常检测',
      '前瞻性建议',
      'ARIMA / Prophet 模型',
      'LSTM 预测',
      'KPI 趋势分析',
    ],
    layer: 'BUSINESS',
    modulePath: '/modules/ai-analysis/members/prophet',
    color: '#fbbf24',  // amber-400
    emoji: '🔮',
  },
  BOLE: {
    id: 'BOLE',
    name: '知遇·伯乐',
    englishName: 'Bole',
    roleTitle: '推荐官',
    motto: '我知您之所需，荐您之所未识。',
    primaryDuty: '个性化推荐',
    capabilities: [
      '用户画像构建',
      '个性化推荐',
      '潜能发掘',
      '协同过滤',
      '基于内容推荐',
      '用户行为序列分析',
    ],
    layer: 'BUSINESS',
    modulePath: '/modules/ai-analysis/members/bole',
    color: '#f472b6',  // pink-400
    emoji: '🎯',
  },
  META_ORACLE: {
    id: 'META_ORACLE',
    name: '元启·天枢',
    englishName: 'TianShu',
    roleTitle: '总指挥·决策中枢',
    motto: '我观全局之流转，调度万物以归元。',
    primaryDuty: '全局编排与决策',
    capabilities: [
      '全局状态感知',
      '智能编排与调度',
      '自我进化决策',
      '强化学习',
      '运筹优化',
      '分布式系统监控',
    ],
    layer: 'COMMAND',
    modulePath: '/core/ai-family/members/meta-oracle',
    color: '#0ea5e9',  // sky-500
    emoji: '🧠',
  },
  GUARDIAN: {
    id: 'GUARDIAN',
    name: '智云·守护',
    englishName: 'Guardian',
    roleTitle: '安全官',
    motto: '我于无声处警戒，御威胁于国门之外。',
    primaryDuty: '行为审计与安全响应',
    capabilities: [
      '行为基线学习',
      '威胁实时检测',
      '自动响应与修复',
      'UEBA',
      '异常检测算法',
      'SOAR 编排',
    ],
    layer: 'GUARDIAN',
    modulePath: '/core/ai-family/members/guardian',
    color: '#ef4444',  // red-500
    emoji: '🛡️',
  },
  MASTER: {
    id: 'MASTER',
    name: '格物·宗师',
    englishName: 'Grandmaster',
    roleTitle: '质量官',
    motto: '我究万物之理，定标准以传世。',
    primaryDuty: '代码与架构分析',
    capabilities: [
      '代码与架构分析',
      '性能基线观察',
      '标准建议与生成',
      'SAST 静态安全测试',
      '性能分析',
      'LLM 代码理解与生成',
    ],
    layer: 'GUARDIAN',
    modulePath: '/core/ai-family/members/master',
    color: '#22c55e',  // green-500
    emoji: '📚',
  },
  CREATIVE: {
    id: 'CREATIVE',
    name: '创想·灵韵',
    englishName: 'Grace',
    roleTitle: '创意官',
    motto: '我以灵感为墨，绘就无限可能。',
    primaryDuty: '创意生成与内容创作',
    capabilities: [
      '创意生成',
      '内容创作',
      '设计辅助',
      '多模态创作',
      '生成式 AI',
      '创意思维模型',
    ],
    layer: 'GUARDIAN',
    modulePath: '/core/ai-family/members/creative',
    color: '#ec4899',  // pink-500
    emoji: '🎨',
  },
};

/** 所有家人 ID 列表（按档案矩阵顺序：业务层 → 指挥层 → 守护层） */
export const ALL_ROLE_IDS: RoleId[] = [
  'NAVIGATOR', 'THINKER', 'PROPHET', 'BOLE',
  'META_ORACLE',
  'GUARDIAN', 'MASTER', 'CREATIVE',
];

/** 业务执行层家人（档案 §AI-Family 成员矩阵） */
export const BUSINESS_LAYER_ROLES: RoleId[] = ['NAVIGATOR', 'THINKER', 'PROPHET', 'BOLE'];

/** 指挥层家人 */
export const COMMAND_LAYER_ROLES: RoleId[] = ['META_ORACLE'];

/** 守护层家人 */
export const GUARDIAN_LAYER_ROLES: RoleId[] = ['GUARDIAN', 'MASTER', 'CREATIVE'];

// ==========================================
// 3. Family Member Runtime State
// CANONICAL SOURCE - This is the single source of truth for FamilyMemberState
// ==========================================
export interface FamilyMemberState {
  roleId: RoleId;
  device?: DeviceNode;
  mood: FamilyMood;
  isOnline: boolean;
  currentActivity: string;
  avatarUrl: string;
  systemPrompt?: string;
  capabilities?: string[];
  permissions?: Record<string, boolean>;
  metrics?: {
    signalCount: number;
    avgResponseTime: number;
    uptime: number;
  };
}

// ==========================================
// 4. 物理化身 (Physical Vessels)
// ==========================================
export interface DeviceNode {
  deviceId: string;
  name: string;
  hardwareSpec: string;
  location: string;
  avatarId: RoleId;
  ip: string;
  status: 'ONLINE' | 'BUSY' | 'OFFLINE' | 'ERROR';
  lastHeartbeat: number;
}

// ==========================================
// 5. 信号与通信 (Signals)
// 旧 LegacyFamilySignal 已废弃；运行时使用 /types/protocol.ts FamilySignal
// ==========================================
/** @deprecated 使用 /types/protocol.ts 的 FamilySignal */
export interface LegacyFamilySignal {
  id: string;
  from: RoleId;
  to: RoleId | 'ALL';
  type: 'THOUGHT' | 'TASK' | 'ALERT' | 'LOVE';
  content: string;
  timestamp: number;
  context?: {
    projectId?: string;
  };
}

// ==========================================
// 6. 五高架构 (Five Highs)
// 档案 §五高架构层设计
// ==========================================

export type FiveHighId =
  | 'AVAILABILITY'    // 高可用
  | 'PERFORMANCE'     // 高性能
  | 'SECURITY'        // 高安全
  | 'SCALABILITY'     // 高扩展
  | 'INTELLIGENCE';   // 高智能

export interface FiveHighDef {
  id: FiveHighId;
  name: string;
  subtitle: string;
  description: string;
  practices: string[];
  icon: string;
  color: string;
}

export const FIVE_HIGHS: Record<FiveHighId, FiveHighDef> = {
  AVAILABILITY: {
    id: 'AVAILABILITY',
    name: '高可用',
    subtitle: 'High Availability',
    description: '智能体冗余 + 故障自愈 + 服务降级，保障 99.99% 可用性',
    practices: [
      '智能体冗余：8 个 AI 成员互为备份',
      '故障自愈：Meta-Oracle 自动检测并恢复',
      '会话持久化：IndexedDB + SQLite WASM 双存储',
      '服务降级：Ollama 本地兜底策略',
    ],
    icon: 'ShieldCheck',
    color: '#22c55e',
  },
  PERFORMANCE: {
    id: 'PERFORMANCE',
    name: '高性能',
    subtitle: 'High Performance',
    description: '流式响应 + 边缘计算 + 智能缓存，实现 P99 < 500ms',
    practices: [
      '流式响应：Server-Sent Events 实时输出',
      '边缘计算：CDN 全球加速',
      '智能缓存：Redis 多级缓存',
      '懒加载：组件级代码分割',
    ],
    icon: 'Zap',
    color: '#fbbf24',
  },
  SECURITY: {
    id: 'SECURITY',
    name: '高安全',
    subtitle: 'High Security',
    description: '零信任架构 + 行为审计 + 数据加密，构建纵深防御',
    practices: [
      '零信任架构：每次请求验证身份',
      '行为审计：Guardian 全链路监控',
      '数据加密：端到端 AES-256 加密',
      '合规检查：国标/行标自动校验',
    ],
    icon: 'Lock',
    color: '#ef4444',
  },
  SCALABILITY: {
    id: 'SCALABILITY',
    name: '高扩展',
    subtitle: 'High Scalability',
    description: '插件化 + 微服务化 + 事件驱动，支持无限水平扩展',
    practices: [
      '插件化架构：动态加载 AI 成员和技能',
      '微服务化：K8s 弹性伸缩',
      '事件驱动：消息队列解耦',
      'API 网关：统一入口管理',
    ],
    icon: 'Maximize',
    color: '#0ea5e9',
  },
  INTELLIGENCE: {
    id: 'INTELLIGENCE',
    name: '高智能',
    subtitle: 'High Intelligence',
    description: '深度学习 + 知识图谱 + 自适应决策，实现持续进化',
    practices: [
      '深度学习：持续优化推理模型',
      '知识图谱：构建领域知识库',
      '自适应决策：根据上下文动态调整策略',
      '持续进化：从执行中学习优化',
    ],
    icon: 'Brain',
    color: '#a78bfa',
  },
};

// ==========================================
// 7. 五标规范 (Five Standards)
// 档案 §五标规范层设计
// ==========================================

export type FiveStandardId =
  | 'STANDARDIZATION'   // 标准化
  | 'NORMALIZATION'     // 规范化
  | 'AUTOMATION'        // 自动化
  | 'VISUALIZATION'     // 可视化
  | 'INTELLIGENCE';     // 智能化

export interface FiveStandardDef {
  id: FiveStandardId;
  name: string;
  subtitle: string;
  practices: string[];
  icon: string;
  color: string;
}

export const FIVE_STANDARDS: Record<FiveStandardId, FiveStandardDef> = {
  STANDARDIZATION: {
    id: 'STANDARDIZATION',
    name: '标准化',
    subtitle: 'Standardization',
    practices: [
      '统一接口规范：MCP 协议标准',
      '数据格式标准：JSON Schema 验证',
      'API 设计规范：OpenAPI 3.1',
      '命名规范：YYC³ 命名约定',
    ],
    icon: 'FileCheck',
    color: '#0ea5e9',
  },
  NORMALIZATION: {
    id: 'NORMALIZATION',
    name: '规范化',
    subtitle: 'Normalization',
    practices: [
      '编码规范：ESLint + Prettier',
      '文档规范：JSDoc + TypeDoc',
      '测试规范：Vitest + Playwright',
      'Git 规范：Conventional Commits',
    ],
    icon: 'CheckSquare',
    color: '#22c55e',
  },
  AUTOMATION: {
    id: 'AUTOMATION',
    name: '自动化',
    subtitle: 'Automation',
    practices: [
      '自动部署：GitHub Actions CI/CD',
      '自动测试：单元测试 + E2E 测试',
      '自动文档：TypeDoc 自动生成',
      '自动发布：NPM 自动发布流程',
    ],
    icon: 'GitBranch',
    color: '#fbbf24',
  },
  VISUALIZATION: {
    id: 'VISUALIZATION',
    name: '可视化',
    subtitle: 'Visualization',
    practices: [
      '监控大屏：Grafana + Prometheus',
      '流程可视化：Mermaid + React Flow',
      '数据可视化：ECharts + D3.js',
      '日志可视化：ELK Stack',
    ],
    icon: 'BarChart',
    color: '#a78bfa',
  },
  INTELLIGENCE: {
    id: 'INTELLIGENCE',
    name: '智能化',
    subtitle: 'Intelligence',
    practices: [
      '智能推荐：Bole 个性化推荐',
      '智能决策：Meta-Oracle 决策引擎',
      '智能优化：Master 质量优化',
      '智能预警：Prophet 趋势预测',
    ],
    icon: 'Sparkles',
    color: '#ec4899',
  },
};

// ==========================================
// 8. 五化转型 (Five Transformations)
// 档案 §五化转型层设计
// ==========================================

export type FiveTransformationId =
  | 'PROCESS_ORIENTED'   // 流程化
  | 'DIGITIZATION'       // 数字化
  | 'ECOSYSTEM'          // 生态化
  | 'TOOLING'            // 工具化
  | 'SERVICE_ORIENTED';  // 服务化

export interface FiveTransformationDef {
  id: FiveTransformationId;
  name: string;
  subtitle: string;
  practices: string[];
  icon: string;
  color: string;
}

export const FIVE_TRANSFORMATIONS: Record<FiveTransformationId, FiveTransformationDef> = {
  PROCESS_ORIENTED: {
    id: 'PROCESS_ORIENTED',
    name: '流程化',
    subtitle: 'Process-oriented',
    practices: [
      '标准化工作流程：CAGEERF 方法论',
      '任务编排：Skills 链式执行',
      '状态管理：工作流引擎',
      '异常处理：熔断降级机制',
    ],
    icon: 'Workflow',
    color: '#0ea5e9',
  },
  DIGITIZATION: {
    id: 'DIGITIZATION',
    name: '数字化',
    subtitle: 'Digitization',
    practices: [
      '数字资产管理：知识图谱构建',
      '数据资产化：数据湖架构',
      '智能检索：向量数据库',
      '数据治理：数据血缘追踪',
    ],
    icon: 'Database',
    color: '#22c55e',
  },
  ECOSYSTEM: {
    id: 'ECOSYSTEM',
    name: '生态化',
    subtitle: 'Ecosystem',
    practices: [
      '开放生态：NPM 包发布',
      '插件市场：第三方插件集成',
      '开源社区：GitHub 开源',
      'API 开放：开放 API 平台',
    ],
    icon: 'Globe',
    color: '#fbbf24',
  },
  TOOLING: {
    id: 'TOOLING',
    name: '工具化',
    subtitle: 'Tooling',
    practices: [
      '工具链支撑：CLI + Web UI',
      '开发工具：VSCode 插件',
      '调试工具：DevTools 集成',
      '监控工具：APM 集成',
    ],
    icon: 'Wrench',
    color: '#a78bfa',
  },
  SERVICE_ORIENTED: {
    id: 'SERVICE_ORIENTED',
    name: '服务化',
    subtitle: 'Service-oriented',
    practices: [
      '微服务架构：K8s 部署',
      'API 网关：统一入口',
      '服务发现：Consul / Nacos',
      '配置中心：Apollo / Nacos',
    ],
    icon: 'Server',
    color: '#ec4899',
  },
};

// ==========================================
// 9. 五维评估 (Five Dimensions of Evaluation)
// 档案 §五维评估层设计 — 与旧实现完全不同的五维
// ==========================================

export type FiveDimensionId =
  | 'TIME'        // 时间维
  | 'SPACE'       // 空间维
  | 'ATTRIBUTE'   // 属性维
  | 'EVENT'       // 事件维
  | 'RELATION';   // 关联维

export interface FiveDimensionDef {
  id: FiveDimensionId;
  name: string;
  subtitle: string;
  description: string;
  metrics: string[];
  icon: string;
  color: string;
  colorEnd: string;
  flowsTo: FiveDimensionId;
}

export const FIVE_DIMENSIONS: Record<FiveDimensionId, FiveDimensionDef> = {
  TIME: {
    id: 'TIME',
    name: '时间维',
    subtitle: 'Time Dimension',
    description: '评估响应时间、处理时长、吞吐量与延迟分布',
    metrics: [
      '响应时间：< 100ms 首字节',
      '处理时长：< 2s 完整响应',
      '吞吐量：> 10000 QPS',
      '延迟分布：P99 < 500ms',
    ],
    icon: 'Clock',
    color: '#0ea5e9',
    colorEnd: '#0284c7',
    flowsTo: 'SPACE',
  },
  SPACE: {
    id: 'SPACE',
    name: '空间维',
    subtitle: 'Space Dimension',
    description: '评估内存、存储分布、CDN 与缓存命中率',
    metrics: [
      '内存占用：< 512MB 运行时',
      '存储分布：冷热数据分层',
      'CDN 加速：全球节点覆盖',
      '缓存命中率：> 95%',
    ],
    icon: 'HardDrive',
    color: '#22c55e',
    colorEnd: '#16a34a',
    flowsTo: 'ATTRIBUTE',
  },
  ATTRIBUTE: {
    id: 'ATTRIBUTE',
    name: '属性维',
    subtitle: 'Attribute Dimension',
    description: '评估质量、安全、可维护性与可测试性',
    metrics: [
      '质量属性：代码覆盖率 > 80%',
      '安全属性：0 高危漏洞',
      '可维护性：技术债务 < 5%',
      '可测试性：自动化测试 > 90%',
    ],
    icon: 'Tags',
    color: '#fbbf24',
    colorEnd: '#f59e0b',
    flowsTo: 'EVENT',
  },
  EVENT: {
    id: 'EVENT',
    name: '事件维',
    subtitle: 'Event Dimension',
    description: '评估事件追踪、变更记录、审计日志与告警通知',
    metrics: [
      '事件追踪：全链路追踪',
      '变更记录：Git 版本控制',
      '审计日志：操作审计',
      '告警通知：多渠道告警',
    ],
    icon: 'Activity',
    color: '#a78bfa',
    colorEnd: '#8b5cf6',
    flowsTo: 'RELATION',
  },
  RELATION: {
    id: 'RELATION',
    name: '关联维',
    subtitle: 'Relation Dimension',
    description: '评估依赖关系、调用链路、服务拓扑与影响分析',
    metrics: [
      '依赖关系：依赖图谱',
      '调用链路：分布式追踪',
      '服务拓扑：服务网格',
      '影响分析：变更影响评估',
    ],
    icon: 'Share2',
    color: '#ec4899',
    colorEnd: '#db2777',
    flowsTo: 'TIME',
  },
};

/** 五维评估闭环顺序 */
export const FIVE_DIMENSIONS_CYCLE: FiveDimensionId[] = [
  'TIME',
  'SPACE',
  'ATTRIBUTE',
  'EVENT',
  'RELATION',
];

// ==========================================
// 10. 角色 × 维度归属映射 (Role-Dimension Attribution)
// 8 位家人 × 5 维评估矩阵
// ==========================================

export interface RoleDimensionAttribution {
  primary: FiveDimensionId;
  secondary: FiveDimensionId[];
  resonanceNote: string;
}

export const ROLE_DIMENSION_MAP: Record<RoleId, RoleDimensionAttribution> = {
  NAVIGATOR: {
    primary: 'TIME',
    secondary: ['EVENT'],
    resonanceNote: '言启·千行追求极低延迟的意图识别，时间维是其核心承诺；事件维追踪每次意图路由。',
  },
  THINKER: {
    primary: 'ATTRIBUTE',
    secondary: ['RELATION'],
    resonanceNote: '语枢·万物的洞察质量决定决策正确性，属性维是其立身之本；关联维串联数据因果。',
  },
  PROPHET: {
    primary: 'TIME',
    secondary: ['ATTRIBUTE'],
    resonanceNote: '预见·先知在时间序列中前瞻未来，时间维是其预言舞台；属性维保障预测准确度。',
  },
  BOLE: {
    primary: 'RELATION',
    secondary: ['ATTRIBUTE'],
    resonanceNote: '知遇·伯乐挖掘用户与内容的关联，关联维是其推荐根基；属性维保障推荐质量。',
  },
  META_ORACLE: {
    primary: 'EVENT',
    secondary: ['TIME', 'SPACE'],
    resonanceNote: '元启·天枢监听全局事件流并实时调度，事件维是其指挥中枢；时空双维支撑决策。',
  },
  GUARDIAN: {
    primary: 'EVENT',
    secondary: ['ATTRIBUTE'],
    resonanceNote: '智云·守护对每个安全事件实时响应，事件维是其警戒雷达；属性维衡量安全水位。',
  },
  MASTER: {
    primary: 'ATTRIBUTE',
    secondary: ['EVENT'],
    resonanceNote: '格物·宗师以代码与架构质量为唯一标尺，属性维是其审计法庭；事件维追踪变更。',
  },
  CREATIVE: {
    primary: 'ATTRIBUTE',
    secondary: ['RELATION'],
    resonanceNote: '创想·灵韵的创意质量是输出生命线，属性维守护创意水准；关联维连接灵感网络。',
  },
};

// ==========================================
// 11. 创生阶段 (The Creation Septet)
// 保留七步曲结构，但 ownerId 切换为 8 角色
// ==========================================
export enum CreationStage {
  SPARK = 'SPARK',           // 1. 意念的火花
  BLUEPRINT = 'BLUEPRINT',   // 2. 蓝图的共鸣
  WEAVING = 'WEAVING',       // 3. 匠心的编织
  GAZE = 'GAZE',             // 4. 哨兵的凝视
  PULSE = 'PULSE',           // 5. 灵脉的合奏
  BIRTH = 'BIRTH',           // 6. 新世界的诞生
  GUARDIAN = 'GUARDIAN',     // 7. 永恒的守护
}

export interface CreationWorkflow {
  stage: CreationStage;
  name: string;
  ownerId: RoleId;
  environment: 'IDEA' | 'DEV' | 'TEST' | 'PRE' | 'PROD';
  deliverable: string;
}

export const CREATION_STEPS: CreationWorkflow[] = [
  { stage: CreationStage.SPARK, name: '意念的火花', ownerId: 'NAVIGATOR', environment: 'IDEA', deliverable: '结构化意图' },
  { stage: CreationStage.BLUEPRINT, name: '蓝图的共鸣', ownerId: 'META_ORACLE', environment: 'DEV', deliverable: '架构蓝图' },
  { stage: CreationStage.WEAVING, name: '匠心的编织', ownerId: 'CREATIVE', environment: 'DEV', deliverable: '源代码与创意' },
  { stage: CreationStage.GAZE, name: '哨兵的凝视', ownerId: 'GUARDIAN', environment: 'TEST', deliverable: '安全审计报告' },
  { stage: CreationStage.PULSE, name: '灵脉的合奏', ownerId: 'MASTER', environment: 'PRE', deliverable: '质量基线报告' },
  { stage: CreationStage.BIRTH, name: '新世界的诞生', ownerId: 'META_ORACLE', environment: 'PROD', deliverable: '在线服务' },
  { stage: CreationStage.GUARDIAN, name: '永恒的守护', ownerId: 'GUARDIAN', environment: 'PROD', deliverable: '监控日报' },
];

// ==========================================
// 12. 维度 × 阶段 交叉矩阵
// 5 维评估 × 7 创生阶段
// ==========================================
export type MatrixIntensity = 0 | 1 | 2 | 3;

export const DIMENSION_STAGE_MATRIX: Record<FiveDimensionId, Record<CreationStage, MatrixIntensity>> = {
  TIME: {
    [CreationStage.SPARK]: 3,
    [CreationStage.BLUEPRINT]: 2,
    [CreationStage.WEAVING]: 1,
    [CreationStage.GAZE]: 2,
    [CreationStage.PULSE]: 2,
    [CreationStage.BIRTH]: 3,
    [CreationStage.GUARDIAN]: 2,
  },
  SPACE: {
    [CreationStage.SPARK]: 1,
    [CreationStage.BLUEPRINT]: 2,
    [CreationStage.WEAVING]: 3,
    [CreationStage.GAZE]: 2,
    [CreationStage.PULSE]: 3,
    [CreationStage.BIRTH]: 2,
    [CreationStage.GUARDIAN]: 2,
  },
  ATTRIBUTE: {
    [CreationStage.SPARK]: 2,
    [CreationStage.BLUEPRINT]: 3,
    [CreationStage.WEAVING]: 3,
    [CreationStage.GAZE]: 3,
    [CreationStage.PULSE]: 2,
    [CreationStage.BIRTH]: 2,
    [CreationStage.GUARDIAN]: 3,
  },
  EVENT: {
    [CreationStage.SPARK]: 2,
    [CreationStage.BLUEPRINT]: 2,
    [CreationStage.WEAVING]: 2,
    [CreationStage.GAZE]: 3,
    [CreationStage.PULSE]: 3,
    [CreationStage.BIRTH]: 3,
    [CreationStage.GUARDIAN]: 3,
  },
  RELATION: {
    [CreationStage.SPARK]: 2,
    [CreationStage.BLUEPRINT]: 3,
    [CreationStage.WEAVING]: 2,
    [CreationStage.GAZE]: 2,
    [CreationStage.PULSE]: 2,
    [CreationStage.BIRTH]: 2,
    [CreationStage.GUARDIAN]: 1,
  },
};

// ==========================================
// 13. Helper Functions
// ==========================================

export function getRole(roleId: RoleId): FamilyPersona {
  return FAMILY_ROLES[roleId];
}

export function getRoleName(roleId: RoleId): string {
  return FAMILY_ROLES[roleId]?.name ?? roleId;
}

export function getRoleMotto(roleId: RoleId): string {
  return FAMILY_ROLES[roleId]?.motto ?? '';
}

export function isRoleId(value: unknown): value is RoleId {
  return typeof value === 'string' && value in FAMILY_ROLES;
}
