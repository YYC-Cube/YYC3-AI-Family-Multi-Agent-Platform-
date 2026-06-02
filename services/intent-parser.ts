/**
 * file: intent-parser.ts
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
 * YYC³ AI Family - IntentParser (意图解析引擎)
 * 
 * Based on "YYC3 AI Family Full Lifecycle Text Framework Design V2.0"
 * Chapter 5.3.2: Intent parsing → Agent routing → Collaboration coordination
 * 
 * Provides structured intent analysis that feeds into AgentRouter
 * for richer, more context-aware routing decisions.
 */

import { RoleId, FAMILY_ROLES, CreationStage, CREATION_STEPS } from '../types/family-manifest';
import { AGENT_PERSONAS } from '../types/agent-personas';

// ==========================================
// Intent Types
// ==========================================

export type IntentType = 
  | 'FEATURE'       // New feature request
  | 'BUGFIX'        // Bug report or fix request  
  | 'OPTIMIZATION'  // Performance/quality improvement
  | 'INQUIRY'       // Question or information request
  | 'ARCHITECTURE'  // Architecture design discussion
  | 'SECURITY'      // Security-related concern
  | 'DEPLOYMENT'    // Deployment or operations
  | 'COLLABORATION' // Team coordination
  | 'PHILOSOPHICAL' // Framework/philosophy discussion
  | 'GENERAL';      // General conversation

export type Urgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Sentiment = 'URGENT' | 'NORMAL' | 'RELAXED' | 'CURIOUS';

export interface ParsedIntent {
  primaryIntent: IntentType;
  secondaryIntents: IntentType[];
  keywords: string[];
  entities: string[];
  sentiment: Sentiment;
  urgency: Urgency;
  suggestedAgents: { roleId: RoleId; confidence: number; reason: string }[];
  suggestedStage: CreationStage | null;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresCollaboration: boolean;
  summary: string;
}

// ==========================================
// Intent Detection Keywords
// ==========================================

const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  FEATURE: ['功能', '新增', '添加', '需求', '实现', 'feature', 'add', 'implement', 'new', '开发', 'develop'],
  BUGFIX: ['修复', 'bug', '错误', '问题', 'fix', 'error', 'issue', '故障', '异常', 'crash', '崩溃'],
  OPTIMIZATION: ['优化', '性能', '提升', '改进', 'optimize', 'improve', 'performance', '加速', '缩减', 'refactor'],
  ARCHITECTURE: ['架构', '设计', '方案', '微服务', 'architecture', 'design', 'system', '蓝图', 'schema', 'API'],
  SECURITY: ['安全', '审计', '漏洞', '加密', 'security', 'audit', 'vulnerability', '防护', '权限', 'permission'],
  DEPLOYMENT: ['部署', '上线', '容器', 'CI/CD', 'deploy', 'release', 'docker', 'k8s', '发布', '运维'],
  COLLABORATION: ['协作', '协同', '同步', '团队', 'collaborate', 'sync', 'team', '沟通', '对齐'],
  PHILOSOPHICAL: ['哲学', '五维', '五高', '五标', '五化', '维度', '创生', 'philosophy', 'dimension', '闭环'],
  INQUIRY: ['什么', '怎么', '如何', '为什么', '状态', 'what', 'how', 'why', 'status', '查询', '说明'],
  GENERAL: [],
};

const URGENCY_KEYWORDS: Record<Urgency, string[]> = {
  CRITICAL: ['紧急', '立即', '严重', 'critical', 'urgent', 'immediately', '崩溃', '宕机'],
  HIGH: ['尽快', '重要', '优先', 'asap', 'important', 'priority', '高优'],
  MEDIUM: ['需要', '希望', '建议', 'need', 'suggest', 'should'],
  LOW: ['考虑', '以后', '未来', 'consider', 'future', 'maybe', '有空'],
};

const SENTIMENT_KEYWORDS: Record<Sentiment, string[]> = {
  URGENT: ['紧急', '马上', '立即', '快', 'urgent', 'now', 'immediately'],
  NORMAL: ['请', '帮我', '需要', 'please', 'help', 'need'],
  RELAXED: ['随便', '有空', '不急', 'whenever', 'casual', 'no rush'],
  CURIOUS: ['怎么', '为什么', '什么', '好奇', 'why', 'how', 'what', 'curious'],
};

// ==========================================
// IntentParser Class
// ==========================================

export class IntentParser {
  
  /**
   * Parse user input into a structured intent.
   * This is a local/heuristic parser — no API calls needed.
   */
  parse(input: string): ParsedIntent {
    const lower = input.toLowerCase();
    const words = lower.split(/[\s,，。.!！?？；;]+/).filter(Boolean);
    
    // 1. Detect intent types
    const intentScores = new Map<IntentType, number>();
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      const score = keywords.filter(kw => lower.includes(kw)).length;
      if (score > 0) {
        intentScores.set(intent as IntentType, score);
      }
    }
    
    const sortedIntents = Array.from(intentScores.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const primaryIntent: IntentType = sortedIntents.length > 0 
      ? sortedIntents[0][0] 
      : 'GENERAL';
    const secondaryIntents = sortedIntents.slice(1, 3).map(([intent]) => intent);
    
    // 2. Extract keywords
    const allKeywords = Object.values(INTENT_KEYWORDS).flat();
    const matchedKeywords = allKeywords.filter(kw => lower.includes(kw));
    
    // 3. Detect urgency
    const urgency = this.detectUrgency(lower);
    
    // 4. Detect sentiment
    const sentiment = this.detectSentiment(lower);
    
    // 5. Suggest agents
    const suggestedAgents = this.suggestAgents(primaryIntent, secondaryIntents, matchedKeywords);
    
    // 6. Suggest creation stage
    const suggestedStage = this.suggestStage(primaryIntent);
    
    // 7. Assess complexity
    const complexity = this.assessComplexity(input, sortedIntents.length, matchedKeywords.length);
    
    // 8. Check collaboration need
    const requiresCollaboration = suggestedAgents.length > 1 || 
      primaryIntent === 'COLLABORATION' ||
      complexity === 'HIGH';
    
    // 9. Generate summary
    const summary = this.generateSummary(primaryIntent, matchedKeywords, urgency);
    
    // 10. Extract entities (simple NER)
    const entities = this.extractEntities(input);

    return {
      primaryIntent,
      secondaryIntents,
      keywords: matchedKeywords,
      entities,
      sentiment,
      urgency,
      suggestedAgents,
      suggestedStage,
      complexity,
      requiresCollaboration,
      summary,
    };
  }

  private detectUrgency(lower: string): Urgency {
    for (const [urgency, keywords] of Object.entries(URGENCY_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return urgency as Urgency;
      }
    }
    return 'MEDIUM';
  }

  private detectSentiment(lower: string): Sentiment {
    for (const [sentiment, keywords] of Object.entries(SENTIMENT_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return sentiment as Sentiment;
      }
    }
    return 'NORMAL';
  }

  private suggestAgents(
    primary: IntentType, 
    secondary: IntentType[], 
    keywords: string[]
  ): { roleId: RoleId; confidence: number; reason: string }[] {
    const agents: { roleId: RoleId; confidence: number; reason: string }[] = [];
    
    const intentAgentMap: Partial<Record<IntentType, { roleId: RoleId; confidence: number; reason: string }[]>> = {
      FEATURE: [
        { roleId: 'NAVIGATOR',   confidence: 0.9, reason: '意图识别与需求路由' },
        { roleId: 'META_ORACLE', confidence: 0.8, reason: '架构方案编排' },
        { roleId: 'CREATIVE',    confidence: 0.7, reason: '创意实现评估' },
      ],
      BUGFIX: [
        { roleId: 'MASTER',    confidence: 0.9, reason: '代码诊断与质量分析' },
        { roleId: 'GUARDIAN',  confidence: 0.7, reason: '安全影响评估' },
        { roleId: 'NAVIGATOR', confidence: 0.5, reason: '意图重新路由' },
      ],
      OPTIMIZATION: [
        { roleId: 'MASTER',      confidence: 0.85, reason: '代码与性能优化建议' },
        { roleId: 'META_ORACLE', confidence: 0.7,  reason: '全局编排优化' },
        { roleId: 'THINKER',     confidence: 0.6,  reason: '性能数据洞察' },
      ],
      ARCHITECTURE: [
        { roleId: 'META_ORACLE', confidence: 0.95, reason: '核心架构决策职责' },
        { roleId: 'MASTER',      confidence: 0.8,  reason: '架构质量评估' },
        { roleId: 'GUARDIAN',    confidence: 0.5,  reason: '安全架构审计' },
      ],
      SECURITY: [
        { roleId: 'GUARDIAN', confidence: 0.95, reason: '安全审计核心职责' },
        { roleId: 'MASTER',   confidence: 0.6,  reason: '安全代码质量分析' },
      ],
      DEPLOYMENT: [
        { roleId: 'META_ORACLE', confidence: 0.9,  reason: '全局编排与调度' },
        { roleId: 'GUARDIAN',    confidence: 0.7,  reason: '部署安全检查' },
        { roleId: 'MASTER',      confidence: 0.5,  reason: '部署质量基线' },
      ],
      COLLABORATION: [
        { roleId: 'NAVIGATOR',   confidence: 0.7, reason: '协同意图识别' },
        { roleId: 'META_ORACLE', confidence: 0.7, reason: '全局协调调度' },
        { roleId: 'BOLE',        confidence: 0.5, reason: '协同成员推荐' },
      ],
      PHILOSOPHICAL: [
        { roleId: 'THINKER',     confidence: 0.9,  reason: '深度思考与哲学洞察' },
        { roleId: 'META_ORACLE', confidence: 0.7,  reason: '全局哲学映射' },
        { roleId: 'MASTER',      confidence: 0.5,  reason: '标准哲学反思' },
      ],
      INQUIRY: [
        { roleId: 'NAVIGATOR', confidence: 0.8, reason: '意图识别与查询路由' },
        { roleId: 'THINKER',   confidence: 0.6, reason: '信息洞察与综合' },
      ],
      GENERAL: [
        { roleId: 'NAVIGATOR',   confidence: 0.6, reason: '默认意图识别' },
        { roleId: 'META_ORACLE', confidence: 0.5, reason: '默认全局决策响应' },
      ],
    };
    
    // Add primary intent agents
    const primaryAgents = intentAgentMap[primary] || intentAgentMap['GENERAL']!;
    agents.push(...primaryAgents);
    
    // Add secondary intent agents (with reduced confidence)
    for (const sec of secondary) {
      const secAgents = intentAgentMap[sec];
      if (secAgents) {
        for (const a of secAgents) {
          if (!agents.find(existing => existing.roleId === a.roleId)) {
            agents.push({ ...a, confidence: a.confidence * 0.6 });
          }
        }
      }
    }
    
    return agents.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  }

  private suggestStage(intent: IntentType): CreationStage | null {
    const stageMap: Partial<Record<IntentType, CreationStage>> = {
      FEATURE: CreationStage.SPARK,
      ARCHITECTURE: CreationStage.BLUEPRINT,
      BUGFIX: CreationStage.WEAVING,
      OPTIMIZATION: CreationStage.WEAVING,
      SECURITY: CreationStage.GAZE,
      DEPLOYMENT: CreationStage.PULSE,
    };
    return stageMap[intent] || null;
  }

  private assessComplexity(input: string, intentCount: number, keywordCount: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (input.length > 200 || intentCount >= 3 || keywordCount >= 5) return 'HIGH';
    if (input.length > 80 || intentCount >= 2 || keywordCount >= 3) return 'MEDIUM';
    return 'LOW';
  }

  private generateSummary(intent: IntentType, keywords: string[], urgency: Urgency): string {
    const intentLabels: Record<IntentType, string> = {
      FEATURE: '新功能需求',
      BUGFIX: '问题修复请求',
      OPTIMIZATION: '性能优化请求',
      ARCHITECTURE: '架构设计讨论',
      SECURITY: '安全相关关注',
      DEPLOYMENT: '部署运维操作',
      COLLABORATION: '协同协作需求',
      PHILOSOPHICAL: '哲学框架讨论',
      INQUIRY: '信息查询请求',
      GENERAL: '一般对话',
    };
    
    const urgencyLabels: Record<Urgency, string> = {
      CRITICAL: '紧急',
      HIGH: '高优',
      MEDIUM: '常规',
      LOW: '低优',
    };
    
    return `[${urgencyLabels[urgency]}] ${intentLabels[intent]}${keywords.length > 0 ? ` | 关键词: ${keywords.slice(0, 3).join(', ')}` : ''}`;
  }

  private extractEntities(input: string): string[] {
    const entities: string[] = [];
    
    // Simple pattern-based entity extraction
    // Technical terms
    const techTerms = [
      'React', 'TypeScript', 'Node.js', 'Docker', 'K8s', 'Redis',
      'PostgreSQL', 'WebSocket', 'API', 'REST', 'GraphQL', 'CI/CD',
      'Bun', 'Next.js', 'TailwindCSS', 'ShadCN', 'Supabase',
    ];
    
    for (const term of techTerms) {
      if (input.toLowerCase().includes(term.toLowerCase())) {
        entities.push(term);
      }
    }
    
    // Family member names
    const memberNames = Object.values(FAMILY_ROLES).map(r => r.name);
    for (const name of memberNames) {
      if (input.includes(name)) {
        entities.push(name);
      }
    }
    
    return entities;
  }
}

// Singleton
let _parserInstance: IntentParser | null = null;

export function getIntentParser(): IntentParser {
  if (!_parserInstance) {
    _parserInstance = new IntentParser();
  }
  return _parserInstance;
}

/**
 * Format a ParsedIntent into a human-readable report.
 */
export function formatIntentReport(intent: ParsedIntent): string {
  const agentList = intent.suggestedAgents
    .map(a => `  ${FAMILY_ROLES[a.roleId].name} (${Math.round(a.confidence * 100)}%) — ${a.reason}`)
    .join('\n');
  
  const stageLabel = intent.suggestedStage 
    ? CREATION_STEPS.find(s => s.stage === intent.suggestedStage)?.name || intent.suggestedStage
    : '未指定';

  return `[INTENT_ANALYSIS] 意图解析报告\n` +
    `  主意图: ${intent.primaryIntent}${intent.secondaryIntents.length > 0 ? ` | 副意图: ${intent.secondaryIntents.join(', ')}` : ''}\n` +
    `  摘要: ${intent.summary}\n` +
    `  情感: ${intent.sentiment} | 紧急度: ${intent.urgency} | 复杂度: ${intent.complexity}\n` +
    `  需要协同: ${intent.requiresCollaboration ? 'YES' : 'NO'}\n` +
    `  创生阶段: ${stageLabel}\n` +
    `${intent.entities.length > 0 ? `  识别实体: ${intent.entities.join(', ')}\n` : ''}` +
    `  建议响应者:\n${agentList}`;
}
