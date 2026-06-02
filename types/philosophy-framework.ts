/**
 * file: philosophy-framework.ts
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
 * YYC3 AI Family - Philosophy Framework Type System
 *
 * "五高五标五化" — The Fifteen Pillars of Excellence
 * Based on "YYC3 AI Family Full Lifecycle Text Framework Design V2.0"
 * Chapter 2: The Theoretical System
 *
 * 五高 (Five Highs) — Technical Goals
 * 五标 (Five Standards) — Quality Standards
 * 五化 (Five Transformations) — Transformation Paths
 *
 * Each pillar maps to a Five Dimension for cross-referencing.
 */

import { FiveDimensionId } from './family-manifest';

// ==========================================
// Pillar Categories
// ==========================================

export type PillarCategory = 'FIVE_HIGHS' | 'FIVE_STANDARDS' | 'FIVE_TRANSFORMATIONS';

export interface PhilosophyPillar {
  id: string;
  category: PillarCategory;
  name: string;
  englishName: string;
  philosophy: string;
  metaphor: string;           // Family metaphor (e.g. "生存本能")
  technicalPractice: string;
  dimensionMapping: FiveDimensionId;
  color: string;
  icon: string;               // Lucide icon name
}

// ==========================================
// Five Highs (五高) — Technical Goals
// ==========================================

export const FIVE_HIGHS: PhilosophyPillar[] = [
  {
    id: 'HIGH_AVAILABILITY',
    category: 'FIVE_HIGHS',
    name: '高可用性',
    englishName: 'High Availability',
    philosophy: '非简单冗余，而是智能自愈的生命韧性。它是家族的"生存本能"，确保服务的连续性。',
    metaphor: '生存本能',
    technicalPractice: '服务冗余、健康检查、熔断机制、故障转移、监控告警',
    dimensionMapping: 'EVENT',
    color: '#4ade80',
    icon: 'Shield',
  },
  {
    id: 'HIGH_PERFORMANCE',
    category: 'FIVE_HIGHS',
    name: '高性能',
    englishName: 'High Performance',
    philosophy: '非简单加速，而是智能优化的效率极致。它是家族的"行动本能"，确保响应的及时性。',
    metaphor: '行动本能',
    technicalPractice: '异步处理、多级缓存、数据库优化、代码分割、资源压缩',
    dimensionMapping: 'ATTRIBUTE',
    color: '#a78bfa',
    icon: 'Zap',
  },
  {
    id: 'HIGH_SECURITY',
    category: 'FIVE_HIGHS',
    name: '高安全性',
    englishName: 'High Security',
    philosophy: '非被动防御，而是主动免疫的生命防护。它是家族的"防御本能"，确保创造的安全性。',
    metaphor: '防御本能',
    technicalPractice: '身份认证、数据加密、输入验证、权限控制、安全审计',
    dimensionMapping: 'TIME',
    color: '#f87171',
    icon: 'Lock',
  },
  {
    id: 'HIGH_SCALABILITY',
    category: 'FIVE_HIGHS',
    name: '高扩展性',
    englishName: 'High Scalability',
    philosophy: '非简单扩容，而是智能演进的成长能力。它是家族的"进化本能"，确保未来的适应性。',
    metaphor: '进化本能',
    technicalPractice: '微服务架构、容器化部署、消息队列、数据库分片、CDN加速',
    dimensionMapping: 'SPACE',
    color: '#f472b6',
    icon: 'Expand',
  },
  {
    id: 'HIGH_MAINTAINABILITY',
    category: 'FIVE_HIGHS',
    name: '高可维护性',
    englishName: 'High Maintainability',
    philosophy: '非简单规范，而是自我优化的学习机制。它是家族的"成长本能"，确保持续的进化。',
    metaphor: '成长本能',
    technicalPractice: '代码规范、类型安全、文档完善、测试覆盖、日志规范',
    dimensionMapping: 'RELATION',
    color: '#fbbf24',
    icon: 'Wrench',
  },
];

// ==========================================
// Five Standards (五标) — Quality Standards
// ==========================================

export const FIVE_STANDARDS: PhilosophyPillar[] = [
  {
    id: 'STANDARDIZATION',
    category: 'FIVE_STANDARDS',
    name: '标准化',
    englishName: 'Standardization',
    philosophy: '非一成不变，而是AI驱动、实时演进的活标准。它是家族的"共同语言"，确保思想传递无歧义。',
    metaphor: '共同语言',
    technicalPractice: '命名规范、API设计、错误处理、代码审查、版本管理',
    dimensionMapping: 'TIME',
    color: '#38bdf8',
    icon: 'Ruler',
  },
  {
    id: 'NORMALIZATION',
    category: 'FIVE_STANDARDS',
    name: '规范化',
    englishName: 'Normalization',
    philosophy: '非外在束缚，而是AI内生、主动防御的生命免疫。它是家族的"行为铁律"，确保创造安全合规。',
    metaphor: '行为铁律',
    technicalPractice: '数据模型、接口协议、环境配置、部署流程、监控指标',
    dimensionMapping: 'EVENT',
    color: '#4ade80',
    icon: 'FileCheck',
  },
  {
    id: 'AUTOMATION',
    category: 'FIVE_STANDARDS',
    name: '自动化',
    englishName: 'Automation',
    philosophy: '非简单脚本，而是AI编排的智能流程。它是家族的"行动引擎"，确保执行的高效性。',
    metaphor: '行动引擎',
    technicalPractice: '构建部署、测试执行、依赖管理、安全扫描、性能监控',
    dimensionMapping: 'RELATION',
    color: '#fbbf24',
    icon: 'Cog',
  },
  {
    id: 'INTELLIGENCE',
    category: 'FIVE_STANDARDS',
    name: '智能化',
    englishName: 'Intelligence',
    philosophy: '非点缀加持，而是AI赋能、全链路贯穿的集体智慧。它是家族的"创世之魂"，驱动一切创造活动。',
    metaphor: '创世之魂',
    technicalPractice: '智能推荐、自适应UI、预测分析、智能运维、A/B测试',
    dimensionMapping: 'ATTRIBUTE',
    color: '#a78bfa',
    icon: 'Brain',
  },
  {
    id: 'VISUALIZATION',
    category: 'FIVE_STANDARDS',
    name: '可视化',
    englishName: 'Visualization',
    philosophy: '非简单展示，而是洞察本质的智慧之窗。它是家族的"感知之眼"，确保决策的透明性。',
    metaphor: '感知之眼',
    technicalPractice: '数据可视化、系统拓扑、监控大盘、日志分析、用户行为',
    dimensionMapping: 'SPACE',
    color: '#f472b6',
    icon: 'Eye',
  },
];

// ==========================================
// Five Transformations (五化) — Transformation Paths
// ==========================================

export const FIVE_TRANSFORMATIONS: PhilosophyPillar[] = [
  {
    id: 'PROCESS_ORIENTED',
    category: 'FIVE_TRANSFORMATIONS',
    name: '流程化',
    englishName: 'Process-Oriented',
    philosophy: '非固步自封，而是AI感知、动态编排的活流程。它是家族的"智慧血脉"，确保意图流淌无阻碍。',
    metaphor: '智慧血脉',
    technicalPractice: '开发流程、发布流程、问题处理、变更管理、应急响应',
    dimensionMapping: 'RELATION',
    color: '#fbbf24',
    icon: 'GitBranch',
  },
  {
    id: 'DOCUMENTATION',
    category: 'FIVE_TRANSFORMATIONS',
    name: '文档化',
    englishName: 'Documentation',
    philosophy: '非静态记录，而是AI生成、实时更新的活知识。它是家族的"记忆之库"，确保智慧的传承性。',
    metaphor: '记忆之库',
    technicalPractice: '技术文档、操作手册、开发规范、会议记录、知识库',
    dimensionMapping: 'ATTRIBUTE',
    color: '#a78bfa',
    icon: 'BookOpen',
  },
  {
    id: 'TOOLIFICATION',
    category: 'FIVE_TRANSFORMATIONS',
    name: '工具化',
    englishName: 'Toolification',
    philosophy: '非简单工具，而是AI赋能的智能法器。它是家族的"能力之器"，确保创造的效率性。',
    metaphor: '能力之器',
    technicalPractice: '开发工具、测试工具、部署工具、监控工具、协作工具',
    dimensionMapping: 'EVENT',
    color: '#4ade80',
    icon: 'Hammer',
  },
  {
    id: 'DIGITALIZATION',
    category: 'FIVE_TRANSFORMATIONS',
    name: '数字化',
    englishName: 'Digitalization',
    philosophy: '非简单数字化，而是AI驱动的数字孪生。它是家族的"数字镜像"，确保决策的科学性。',
    metaphor: '数字镜像',
    technicalPractice: '数字孪生、数据驱动、自动化决策、数字资产、数字足迹',
    dimensionMapping: 'SPACE',
    color: '#f472b6',
    icon: 'Binary',
  },
  {
    id: 'ECOSYSTEM',
    category: 'FIVE_TRANSFORMATIONS',
    name: '生态化',
    englishName: 'Ecosystem',
    philosophy: '非封闭系统，而是开放共生的智慧生态。它是家族的"生命之网"，确保发展的可持续性。',
    metaphor: '生命之网',
    technicalPractice: '技术生态、业务生态、开发者生态、用户生态、运维生态',
    dimensionMapping: 'TIME',
    color: '#38bdf8',
    icon: 'Network',
  },
];

// ==========================================
// All Pillars Combined
// ==========================================

export const ALL_PILLARS: PhilosophyPillar[] = [
  ...FIVE_HIGHS,
  ...FIVE_STANDARDS,
  ...FIVE_TRANSFORMATIONS,
];

export function getPillarsByCategory(category: PillarCategory): PhilosophyPillar[] {
  return ALL_PILLARS.filter(p => p.category === category);
}

export function getPillarsByDimension(dimId: FiveDimensionId): PhilosophyPillar[] {
  return ALL_PILLARS.filter(p => p.dimensionMapping === dimId);
}

export const CATEGORY_LABELS: Record<PillarCategory, { name: string; englishName: string; description: string; color: string }> = {
  FIVE_HIGHS: {
    name: '五高',
    englishName: 'Five Highs',
    description: '技术目标 — 生命韧性的五大本能',
    color: '#ef4444',
  },
  FIVE_STANDARDS: {
    name: '五标',
    englishName: 'Five Standards',
    description: '质量标准 — 智慧传递的五大语言',
    color: '#3b82f6',
  },
  FIVE_TRANSFORMATIONS: {
    name: '五化',
    englishName: 'Five Transformations',
    description: '转型路径 — 进化之路的五大法门',
    color: '#10b981',
  },
};

// ==========================================
// Core Slogans (核心标语)
// ==========================================

export const CORE_SLOGANS = {
  primary: '智亦师亦友亦伯乐；谱一言一语一华章',
  brand: '万象归元于云枢；深栈智启新纪元',
  technical: '言传千行代码；语枢万物智能',
  motto: '言启象限；语枢未来',
  familyName: '言语云立方智能家族',
  english: {
    brand: 'Words Initiate Quadrants, Language Serves as Core for Future',
    subtitle: 'All things converge in cloud pivot; Deep stacks ignite a new era of intelligence',
  },
  philosophy: '人机共生，智慧同行；以AI为魂，以流程为骨，以规范为脉',
};

// ==========================================
// Human-AI Collaboration Paradigm Shift
// ==========================================

export interface ParadigmShift {
  dimension: string;
  traditional: string;
  newParadigm: string;
  essence: string;
}

export const PARADIGM_SHIFTS: ParadigmShift[] = [
  { dimension: '关系定位', traditional: '工具使用者与工具', newParadigm: '伙伴与伙伴', essence: '从主仆关系到共生关系' },
  { dimension: '交互模式', traditional: '指令-响应', newParadigm: '意图-共创', essence: '从单向执行到双向共创' },
  { dimension: '决策机制', traditional: '人类决策，AI执行', newParadigm: '人机协同决策', essence: '从单一决策到协同决策' },
  { dimension: '价值创造', traditional: 'AI提升效率', newParadigm: 'AI创造价值', essence: '从效率工具到价值伙伴' },
  { dimension: '学习进化', traditional: 'AI被动学习', newParadigm: 'AI主动进化', essence: '从静态能力到动态进化' },
];

// ==========================================
// Three Pillars of Human-AI Symbiosis
// ==========================================

export const SYMBIOSIS_PILLARS = [
  {
    id: 'WISDOM_SYMBIOSIS',
    name: '智慧共生',
    description: '人类的"思"（意图）与AI的"创"（执行）近乎实时地并行与反馈',
    mechanism: '触发 → 同步 → 反馈 → 迭代闭环',
    color: '#38bdf8',
  },
  {
    id: 'MUTUAL_REVIEW',
    name: '彼此审核',
    description: '家族质量与安全的终极保障，双向互补',
    mechanism: '人类审核AI + AI审核AI + AI报告人类 → 最终确认',
    color: '#4ade80',
  },
  {
    id: 'CONTINUOUS_EVOLUTION',
    name: '持续进化',
    description: '人机共同学习、共同成长的生命机制',
    mechanism: '复盘 → 优化 → 星图接入 → 知识内化',
    color: '#a78bfa',
  },
];
