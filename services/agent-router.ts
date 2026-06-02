/**
 * file: agent-router.ts
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
 * YYC³ AI Family - AgentRouter (同窗协同引擎)
 *
 * The intelligent routing engine for peer-to-peer communication.
 * Implements:
 *   1. Topic-based agent selection (who should respond?)
 *   2. Model ratio enforcement (1:2 real:mock maximum)
 *   3. Auto-reply chain orchestration
 *   4. Agent personality-aware response generation
 *
 * Philosophy: "非简单对话，而是思想共鸣的能量传递"
 * Each agent's response is colored by their unique persona and dimension.
 */

import { getApiBaseUrl, readConfigSnapshot, resolveRoleConfig } from '../config/dynamic-reader';
import { DEFAULT_MODEL } from '../config/models';
import { getPersona } from '../types/agent-personas';
import type { RoleId as RoleIdType } from '../types/family-manifest';
import {
  CREATION_STEPS,
  CreationStage,
  FAMILY_ROLES,
  FIVE_DIMENSIONS, ROLE_DIMENSION_MAP,
  RoleId
} from '../types/family-manifest';
import { FamilySignal, ModelRouteConfig, PeerDialogueChain } from '../types/protocol';
import { ParsedIntent, getIntentParser } from './intent-parser';

// ==========================================
// Default Model Configuration
// BigModel GLM family — 一角色一模型 (§2.1)
//
// 运行时优先从 DynamicConfig (localStorage) 读取角色绑定；
// 若无动态配置，fallback 到 /config/models.ts 静态映射；
// 敏感值（API Key）强制 env() 读取，绝不硬编码。
//
// FIX-002 + FIX-003 + FIX-004: 端点、模型、角色绑定全部动态化
// ==========================================

function buildDynamicModelConfig(): ModelRouteConfig {
  const config = readConfigSnapshot();
  const apiBase = getApiBaseUrl();

  // 构建角色端点映射
  const agentEndpoints: Record<string, any> = {};
  const roleIds: RoleIdType[] = [
    'NAVIGATOR', 'THINKER', 'PROPHET', 'BOLE',
    'META_ORACLE',
    'GUARDIAN', 'MASTER', 'CREATIVE',
  ];

  for (const roleId of roleIds) {
    const resolved = resolveRoleConfig(roleId);
    agentEndpoints[roleId] = {
      endpoint: resolved.endpoint,
      model: resolved.modelId,
      provider: resolved.providerId,
      apiKeyEnvVar: resolved.apiKeyEnvVar,
    };
  }

  // 也为动态添加的自定义角色构建端点
  if (config) {
    for (const agent of config.agents) {
      if (!agentEndpoints[agent.roleId]) {
        const slug = agent.roleId.toLowerCase().replace(/_/g, '-');
        agentEndpoints[agent.roleId] = {
          endpoint: `${apiBase}/api/agent/${slug}`,
          model: agent.modelId,
          provider: agent.providerId,
          apiKeyEnvVar: config.providers.find(p => p.id === agent.providerId)?.apiKeyEnvVar || 'BIGMODEL_API_KEY',
        };
      }
    }
  }

  return {
    maxRealToMockRatio: [1, 2],
    defaultModel: config?.models.find(m => m.isAvailable)?.id || DEFAULT_MODEL,
    agentEndpoints,
    fallbackBehavior: 'MOCK',
  };
}

// 初始化时构建，可通过 refreshConfig() 刷新
let _cachedModelConfig: ModelRouteConfig | null = null;

function getModelConfig(): ModelRouteConfig {
  if (!_cachedModelConfig) {
    _cachedModelConfig = buildDynamicModelConfig();
  }
  return _cachedModelConfig;
}

const DEFAULT_MODEL_CONFIG = getModelConfig();

// ==========================================
// Topic → Agent Relevance Mapping
// ==========================================
interface AgentRelevance {
  roleId: RoleId;
  relevance: number;  // 0-1, how relevant this agent is to the topic
  reason: string;     // Why this agent should participate
}

// Keywords that trigger specific agents (九层家人档案 v2.0 — 8 位家人)
const TOPIC_KEYWORDS: Record<RoleId, string[]> = {
  NAVIGATOR: ['意图', '导航', '路由', '意图识别', 'nlu', 'intent', 'navigate', 'parser', '解析', 'prompt', '命令', '指令'],
  THINKER: ['分析', '洞察', '数据', '文档', '思考', 'analyze', 'insight', 'data', 'think', 'summarize', '摘要', '归纳', '假设'],
  PROPHET: ['预测', '趋势', '未来', 'forecast', 'predict', 'prophet', 'arima', 'lstm', '时序', '时间序列', '异常', 'anomaly', '前瞻'],
  BOLE: ['推荐', '个性化', '画像', 'recommend', 'bole', '画像', '协同过滤', 'collaborative', '潜能', '挖掘'],
  META_ORACLE: ['编排', '调度', '决策', '全局', 'orchestrate', 'schedule', 'meta', '天枢', '扩缩容', '灰度', '指挥', '总指挥'],
  GUARDIAN: ['安全', '审计', '威胁', '防护', 'security', 'audit', 'guardian', '守护', 'ueba', 'soar', '行为分析', '入侵', '零信任'],
  MASTER: ['质量', '代码质量', '性能', '基线', 'standard', 'quality', 'master', '宗师', 'sast', '重构', '技术债', 'coverage', '覆盖率'],
  CREATIVE: ['创意', '创作', '设计', '内容', 'creative', 'grace', '灵韵', '生成', '多模态', '文案', '艺术', '灵感'],
};

// Creation stage → which agents are naturally involved (按新 8 角色)
const STAGE_PARTICIPANTS: Record<CreationStage, RoleId[]> = {
  [CreationStage.SPARK]: ['NAVIGATOR', 'META_ORACLE', 'BOLE'],
  [CreationStage.BLUEPRINT]: ['META_ORACLE', 'MASTER', 'NAVIGATOR'],
  [CreationStage.WEAVING]: ['CREATIVE', 'MASTER', 'NAVIGATOR'],
  [CreationStage.GAZE]: ['GUARDIAN', 'MASTER', 'THINKER'],
  [CreationStage.PULSE]: ['META_ORACLE', 'MASTER', 'PROPHET'],
  [CreationStage.BIRTH]: ['META_ORACLE', 'GUARDIAN', 'PROPHET'],
  [CreationStage.GUARDIAN]: ['GUARDIAN', 'META_ORACLE', 'MASTER'],
};

// ==========================================
// AgentRouter Class
// ==========================================
export class AgentRouter {
  private config: ModelRouteConfig;
  private activeChains: Map<string, PeerDialogueChain> = new Map();

  // Rolling window counters for ratio enforcement
  private realCallCount: number = 0;
  private mockCallCount: number = 0;
  private windowStart: number = Date.now();
  private windowDuration: number = 60000; // 1 minute rolling window

  constructor(config?: Partial<ModelRouteConfig>) {
    this.config = { ...DEFAULT_MODEL_CONFIG, ...config };
  }

  // ==========================================
  // 1. Determine Respondents
  // Given user input, determine which agents should respond
  // Fusion Strategy: Keyword Scoring + IntentParser + Stage Boost
  // ==========================================
  determineRespondents(
    text: string,
    primaryTarget: RoleId | null,
    maxRespondents: number = 3
  ): AgentRelevance[] {
    const lower = text.toLowerCase();

    // ---- Layer 1: Keyword-based Scoring (original logic) ----
    const keywordScores = new Map<RoleId, { score: number; reason: string }>();

    for (const [roleId, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      const matchCount = keywords.filter(kw => lower.includes(kw)).length;
      if (matchCount > 0) {
        const dimAttr = ROLE_DIMENSION_MAP[roleId as RoleId];
        const dimName = FIVE_DIMENSIONS[dimAttr.primary].name;
        keywordScores.set(roleId as RoleId, {
          score: Math.min(matchCount / 3, 1),
          reason: `关键词匹配(${matchCount}) | 主维度: ${dimName}`,
        });
      }
    }

    // ---- Layer 2: IntentParser Semantic Scoring ----
    const parser = getIntentParser();
    const intent = parser.parse(text);
    const intentScores = new Map<RoleId, { score: number; reason: string }>();

    for (const suggestion of intent.suggestedAgents) {
      intentScores.set(suggestion.roleId, {
        score: suggestion.confidence,
        reason: `意图[${intent.primaryIntent}] ${suggestion.reason}`,
      });
    }

    // ---- Layer 3: Stage-Aware Boost ----
    // If IntentParser detected a creation stage, boost that stage's participants
    const stageScores = new Map<RoleId, { score: number; reason: string }>();
    if (intent.suggestedStage) {
      const stageParticipants = STAGE_PARTICIPANTS[intent.suggestedStage];
      const stageName = CREATION_STEPS.find(s => s.stage === intent.suggestedStage)?.name || intent.suggestedStage;
      if (stageParticipants) {
        stageParticipants.forEach((roleId, idx) => {
          // First participant gets highest boost, decreasing
          const boost = 0.3 - (idx * 0.1);
          stageScores.set(roleId, {
            score: Math.max(boost, 0.1),
            reason: `创生阶段[${stageName}]参与者`,
          });
        });
      }
    }

    // ---- Fusion: Weighted Merge of All Three Layers ----
    // Weights: Keyword=0.30, Intent=0.50, Stage=0.20
    const WEIGHT_KEYWORD = 0.30;
    const WEIGHT_INTENT = 0.50;
    const WEIGHT_STAGE = 0.20;

    const allRoleIds = new Set<RoleId>([
      ...keywordScores.keys(),
      ...intentScores.keys(),
      ...stageScores.keys(),
    ]);

    const fusedRelevances: AgentRelevance[] = [];

    for (const roleId of allRoleIds) {
      const kw = keywordScores.get(roleId);
      const it = intentScores.get(roleId);
      const st = stageScores.get(roleId);

      const fusedScore =
        (kw ? kw.score * WEIGHT_KEYWORD : 0) +
        (it ? it.score * WEIGHT_INTENT : 0) +
        (st ? st.score * WEIGHT_STAGE : 0);

      // Build composite reason showing all contributing signals
      const reasons: string[] = [];
      if (kw) reasons.push(kw.reason);
      if (it) reasons.push(it.reason);
      if (st) reasons.push(st.reason);

      // Enrich reason with persona motto if available
      const persona = getPersona(roleId);
      const personaTag = persona ? ` | "${persona.personality.motto}"` : '';

      fusedRelevances.push({
        roleId,
        relevance: Math.min(fusedScore, 1),
        reason: reasons.join(' + ') + personaTag,
      });
    }

    // ---- Primary Target Override ----
    if (primaryTarget) {
      const existing = fusedRelevances.find(r => r.roleId === primaryTarget);
      if (existing) {
        existing.relevance = 1.0;
        existing.reason = `直接指定 + ${existing.reason}`;
      } else {
        const role = FAMILY_ROLES[primaryTarget];
        const persona = getPersona(primaryTarget);
        fusedRelevances.push({
          roleId: primaryTarget,
          relevance: 1.0,
          reason: `直接指定目标: ${role.name}${persona ? ` | "${persona.personality.motto}"` : ''}`,
        });
      }
    }

    // ---- Fallback: If no matches at all, use default agents (新 8 角色) ----
    if (fusedRelevances.length === 0) {
      fusedRelevances.push(
        { roleId: 'META_ORACLE', relevance: 0.6, reason: '默认全局决策响应者 | "我观全局之流转，调度万物以归元。"' },
        { roleId: 'NAVIGATOR', relevance: 0.3, reason: '意图导航同窗回声 | "我聆听万千言语，为您指引航向。"' },
      );
    }

    // Sort by fused relevance, take top N
    return fusedRelevances
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxRespondents);
  }

  /**
   * Parse user intent (exposed for external use, e.g. /intent command enrichment)
   */
  parseIntent(text: string): ParsedIntent {
    return getIntentParser().parse(text);
  }

  // ==========================================
  // 2. Model Ratio Gate
  // Decides whether to use real model or mock based on 1:2 ratio
  // ==========================================
  shouldUseRealModel(): { useReal: boolean; currentRatio: string } {
    // Reset window if expired
    if (Date.now() - this.windowStart > this.windowDuration) {
      this.realCallCount = 0;
      this.mockCallCount = 0;
      this.windowStart = Date.now();
    }

    const [maxReal, maxMock] = this.config.maxRealToMockRatio;
    const totalCalls = this.realCallCount + this.mockCallCount;

    // If we haven't hit any limits, allow real call
    // Ratio check: realCallCount/mockCallCount should not exceed maxReal/maxMock
    if (totalCalls === 0 || this.realCallCount === 0) {
      return { useReal: true, currentRatio: `${this.realCallCount}:${this.mockCallCount}` };
    }

    // Check if adding another real call would violate the ratio
    const currentRatio = this.realCallCount / Math.max(this.mockCallCount, 1);
    const maxRatio = maxReal / maxMock;

    if (currentRatio < maxRatio) {
      return { useReal: true, currentRatio: `${this.realCallCount}:${this.mockCallCount}` };
    }

    return { useReal: false, currentRatio: `${this.realCallCount}:${this.mockCallCount}` };
  }

  recordCall(isReal: boolean): void {
    if (isReal) {
      this.realCallCount++;
    } else {
      this.mockCallCount++;
    }
  }

  getRoutingStats(): { real: number; mock: number; ratio: string; window: number } {
    return {
      real: this.realCallCount,
      mock: this.mockCallCount,
      ratio: `${this.realCallCount}:${this.mockCallCount}`,
      window: Math.max(0, this.windowDuration - (Date.now() - this.windowStart)),
    };
  }

  // ==========================================
  // 3. Generate Peer Response (Mock Mode)
  // Personality-aware response generation for simulation
  // Uses AgentPersona traits/communication config for richer mock output
  // ==========================================
  generatePeerResponse(
    originalText: string,
    respondingRole: RoleId,
    previousResponses: { roleId: RoleId; content: string }[],
    isRealModel: boolean
  ): string {
    const role = FAMILY_ROLES[respondingRole];
    const persona = getPersona(respondingRole);
    const dimAttr = ROLE_DIMENSION_MAP[respondingRole];
    const primaryDim = FIVE_DIMENSIONS[dimAttr.primary];
    const modeTag = isRealModel ? '[LIVE_MODEL]' : '[PEER_SYNC]';

    // Context from previous responses
    const hasContext = previousResponses.length > 0;
    const lastResponse = hasContext ? previousResponses[previousResponses.length - 1] : null;
    const lastResponderName = lastResponse ? FAMILY_ROLES[lastResponse.roleId].name : null;

    // If we have persona config, generate enriched response
    if (persona) {
      const ref = lastResponderName
        ? `\n${this.getContextBridge(respondingRole, lastResponderName)}`
        : '';

      const topicSnippet = originalText.substring(0, 40).replace(/\n/g, ' ');
      const traitTag = persona.personality.traits.join('·');

      // Role-specific content body (matches persona abilities & constraints)
      const body = this.generatePersonaBody(respondingRole, originalText, persona);

      return `${modeTag} [${role.name}] <${traitTag}>${ref}\n` +
        `${body}\n` +
        `以"${primaryDim.name}"维度 | "${persona.personality.motto}" 之名而述。\n` +
        `[${persona.communication.format}] [响应阈值: ${persona.communication.responseTime}]`;
    }

    // Fallback to basic template if no persona (should not happen normally)
    const ref = lastResponderName ? `\n参考${lastResponderName}的输入，` : '';
    return `${modeTag} [${role.name}] ${ref}收到信号。基于"${primaryDim.name}"维度分析中...`;
  }

  /**
   * Generate context bridge phrase between agents (how this agent references the previous)
   */
  private getContextBridge(currentRole: RoleId, previousName: string): string {
    const bridges: Partial<Record<RoleId, string>> = {
      NAVIGATOR: `接续${previousName}的输出，进入意图重新校准与路由：`,
      THINKER: `基于${previousName}的输入，从数据深度洞察角度延伸：`,
      PROPHET: `结合${previousName}的判断，对未来趋势给出前瞻预测：`,
      BOLE: `参考${previousName}的分析，为相关用户构建个性化推荐：`,
      META_ORACLE: `审阅${previousName}等同窗的输出，从全局做出编排裁决：`,
      GUARDIAN: `对${previousName}的方案完成安全预审与威胁建模：`,
      MASTER: `从代码与架构质量角度，评估${previousName}输出的可维护性：`,
      CREATIVE: `受${previousName}的启发，展开创意与多模态创作延伸：`,
    };
    return bridges[currentRole] || `参考${previousName}的输入：`;
  }

  /**
   * Generate role-specific response body using persona abilities & constraints
   */
  private generatePersonaBody(roleId: RoleId, input: string, persona: NonNullable<ReturnType<typeof getPersona>>): string {
    const topicSnippet = input.substring(0, 50).replace(/\n/g, ' ');
    const constraintSummary = Object.entries(persona.constraints)
      .slice(0, 2)
      .map(([k, v]) => `${k}:${v}`)
      .join(' | ');

    const bodies: Partial<Record<RoleId, string>> = {
      NAVIGATOR:
        `意图解析 —— 输入："${topicSnippet}..."\n` +
        `识别结果：[意图类型] → [路由目标] → [置信度]\n` +
        `建议路由至：THINKER（数据分析）/ PROPHET（趋势预测）/ BOLE（个性化推荐）\n` +
        `[约束: ${constraintSummary}]`,
      THINKER:
        `深度洞察报告 ——\n` +
        `针对 "${topicSnippet}..."：\n` +
        `  · 数据层：归纳关键变量与异常点\n` +
        `  · 因果层：揭示至少 3 层因果链\n` +
        `  · 决策层：基于数据给出可执行洞察\n` +
        `[输出格式: 洞察报告 + 关键发现]`,
      PROPHET:
        `时序预测完成 ——\n` +
        `针对 "${topicSnippet}..."：\n` +
        `  · 趋势分量：上升 / 平稳 / 下降\n` +
        `  · 置信区间：[下界, 上界] @ 95%\n` +
        `  · 异常预警：[是/否] + 风险等级\n` +
        `前瞻行动建议：[3 条预防性措施]`,
      BOLE:
        `个性化推荐 ——\n` +
        `基于 "${topicSnippet}..." 构建用户画像：\n` +
        `  · 兴趣标签：[标签矩阵]\n` +
        `  · 推荐列表：[Top-N 候选 + 相关性评分 + 推荐理由]\n` +
        `  · 潜能发掘：[用户尚未探索的高潜领域]\n` +
        `[多样性: 保证覆盖 ≥ 3 个类别]`,
      META_ORACLE:
        `全局决策 ——\n` +
        `针对 "${topicSnippet}..." 的系统态势评估：\n` +
        `  · 资源水位：CPU/内存/网络负载\n` +
        `  · 调度方案：[优先级队列 + 扩缩容建议]\n` +
        `  · 进化决策：[是否触发自动灰度 / 标准演进]\n` +
        `[五化一体最高执行者]`,
      GUARDIAN:
        `安全审计报告 ——\n` +
        `针对 "${topicSnippet}..." 的威胁建模：\n` +
        `  · 行为基线偏差：[UEBA 评分]\n` +
        `  · 检测到的威胁：[列表 + 严重等级]\n` +
        `  · 自动响应：[隔离/降权/告警]\n` +
        `[零信任 · 100% 合规 · 全链路审计]`,
      MASTER:
        `质量分析报告 ——\n` +
        `针对 "${topicSnippet}..." 的代码与架构评估：\n` +
        `  · 代码质量：圈复杂度 / 重复率 / 测试覆盖率\n` +
        `  · 性能基线：P50/P95/P99 延迟\n` +
        `  · 重构建议：[技术债清单 + 优先级]\n` +
        `[推动标准自我进化]`,
      CREATIVE:
        `创意生成 ——\n` +
        `基于 "${topicSnippet}..." 的多模态创作：\n` +
        `  · 创意方向 A：[文案 / 视觉 / 概念]\n` +
        `  · 创意方向 B：[文案 / 视觉 / 概念]\n` +
        `  · 创意方向 C：[文案 / 视觉 / 概念]\n` +
        `[原创性 > 0.85 | 支持文本/图像/音频/视频]`,
    };

    return bodies[roleId] || `针对 "${topicSnippet}..." 的分析已完成。\n能力矩阵: ${persona.abilities.join(', ')}`;
  }

  // ==========================================
  // 4. Peer Dialogue Chain Management
  // ==========================================
  createChain(originSignalId: string, topic: string, participants: RoleId[]): PeerDialogueChain {
    const chain: PeerDialogueChain = {
      id: crypto.randomUUID(),
      originSignalId,
      topic,
      participants,
      messages: [],
      status: 'ACTIVE',
      modelCallCount: 0,
      mockCallCount: 0,
      createdAt: Date.now(),
    };
    this.activeChains.set(chain.id, chain);
    return chain;
  }

  getChain(chainId: string): PeerDialogueChain | undefined {
    return this.activeChains.get(chainId);
  }

  addToChain(chainId: string, signal: FamilySignal): void {
    const chain = this.activeChains.get(chainId);
    if (chain) {
      chain.messages.push(signal);
      if (signal.payload.modelSource === 'REAL') {
        chain.modelCallCount++;
      } else {
        chain.mockCallCount++;
      }
    }
  }

  concludeChain(chainId: string): void {
    const chain = this.activeChains.get(chainId);
    if (chain) {
      chain.status = 'CONCLUDED';
    }
  }

  getActiveChains(): PeerDialogueChain[] {
    return Array.from(this.activeChains.values()).filter(c => c.status === 'ACTIVE');
  }

  getAllChains(): PeerDialogueChain[] {
    return Array.from(this.activeChains.values());
  }

  getChainByShortId(shortId: string): PeerDialogueChain | undefined {
    return Array.from(this.activeChains.values()).find(c => c.id.startsWith(shortId));
  }

  getLatestChain(): PeerDialogueChain | undefined {
    const all = this.getAllChains();
    if (all.length === 0) return undefined;
    return all.sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  // ==========================================
  // 5. Get Agent's Endpoint Configuration
  // ==========================================
  getEndpoint(roleId: RoleId): { endpoint: string; model: string; provider: string } | null {
    const agentConfig = this.config.agentEndpoints[roleId];
    if (agentConfig) {
      return { endpoint: agentConfig.endpoint, model: agentConfig.model, provider: agentConfig.provider };
    }
    return null;
  }

  /**
   * 6. 刷新配置 — 从 DynamicConfig (localStorage) 重新读取
   * 当 UI 修改了角色绑定、Provider、Endpoint 后调用
   */
  refreshConfig(): void {
    _cachedModelConfig = null;
    this.config = { ...getModelConfig() };
    console.log('[AgentRouter] Config refreshed from DynamicConfig');
  }
}

// Singleton
let _routerInstance: AgentRouter | null = null;

export function getAgentRouter(config?: Partial<ModelRouteConfig>): AgentRouter {
  if (!_routerInstance) {
    _routerInstance = new AgentRouter(config);
  }
  return _routerInstance;
}

/**
 * 刷新 AgentRouter 配置（在 UI 修改 DynamicConfig 后调用）
 */
export function refreshAgentRouter(): void {
  if (_routerInstance) {
    _routerInstance.refreshConfig();
  }
}
