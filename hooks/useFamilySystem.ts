/**
 * file: useFamilySystem.ts
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
 * YYC³ AI Family - useFamilySystem Hook (灵肉合一 + 同窗协同版)
 *
 * The Unified Nervous System of the AI Family.
 * Now with:
 *   - BackendBridge integration for real backend connectivity
 *   - AgentRouter for peer-to-peer dialogue chains
 *   - Model ratio enforcement (1:2 real:mock)
 *   - UIAction dispatch for slash commands → UI state changes
 *
 * Mode:
 *   CONNECTED -> Signals routed through WebSocket to Bun backend
 *   MOCK_MODE -> Signals handled locally with simulated AI responses
 *
 * The "Soul" (frontend personality) remains consistent regardless of mode.
 * The "Body" (backend processing) activates when connected.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ENDPOINTS } from '../config/endpoints';
import { AgentRouter, getAgentRouter } from '../services/agent-router';
import { BackendBridge, ConnectionStatus, getBackendBridge } from '../services/backend-bridge';
import { formatIntentReport, getIntentParser } from '../services/intent-parser';
import { AGENT_PERSONAS, getSystemPrompt } from '../types/agent-personas';
import type { FamilyMemberState } from '../types/family-manifest';
import {
  CREATION_STEPS,
  DIMENSION_STAGE_MATRIX,
  FAMILY_ROLES,
  FIVE_DIMENSIONS, FIVE_DIMENSIONS_CYCLE,
  FamilyMood,
  ROLE_DIMENSION_MAP,
  RoleId
} from '../types/family-manifest';
import { CATEGORY_LABELS, CORE_SLOGANS, FIVE_HIGHS, FIVE_STANDARDS, FIVE_TRANSFORMATIONS } from '../types/philosophy-framework';
import type { LogMessage, RAGContextItem } from '../types/protocol';
import { FamilySignal, UIAction } from '../types/protocol';

// ==========================================
// Family Member State
// ==========================================
// CANONICAL SOURCE: /types/family-manifest.ts
// Re-exported here for backward compatibility (do not modify)
export type { FamilyMemberState } from '../types/family-manifest';

// ==========================================
// Initial State (Mock Data / Fallback)
// ==========================================
const INITIAL_MEMBERS_STATE: FamilyMemberState[] = [
  {
    roleId: 'NAVIGATOR',
    mood: 'SERENE' as FamilyMood,
    isOnline: true,
    currentActivity: '等待家族指令...',
    avatarUrl: 'https://images.unsplash.com/photo-1765248148309-69d900a5bc17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwcHJvZHVjdCUyMG1hbmFnZXIlMjBwcm9mZXNzaW9uYWwlMjBmcmllbmRseSUyMHBvcnRyYWl0JTIwb2ZmaWNlfGVufDF8fHx8MTc3MDY0Njg2Mnww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    roleId: 'META_ORACLE',
    mood: 'SERENE' as FamilyMood,
    isOnline: true,
    currentActivity: '全域战略监控中...',
    avatarUrl: 'https://images.unsplash.com/photo-1569728659560-3db4179e3372?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwY3liZXIlMjBzZWN1cml0eSUyMGV4cGVydCUyMGZ1dHVyaXN0aWMlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzA2NDY4NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    roleId: 'THINKER',
    device: { deviceId: 'mbp-m4-max', name: 'MacBook M4 Max', hardwareSpec: '16P+40E / 128GB / 4TB', location: 'Local Lab', avatarId: 'THINKER' as RoleId, ip: '192.168.50.10', status: 'ONLINE' as const, lastHeartbeat: Date.now() },
    mood: 'FOCUSED' as FamilyMood,
    isOnline: true,
    currentActivity: '架构演算中 (TypeScript Check)...',
    avatarUrl: 'https://images.unsplash.com/photo-1569728659560-3db4179e3372?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwY3liZXIlMjBzZWN1cml0eSUyMGV4cGVydCUyMGZ1dHVyaXN0aWMlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzA2NDY4NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    roleId: 'PROPHET',
    device: { deviceId: 'imac-m4', name: 'iMac M4', hardwareSpec: 'M4 / 32GB / 2T+2T', location: 'Studio', avatarId: 'PROPHET' as RoleId, ip: '192.168.50.11', status: 'ONLINE' as const, lastHeartbeat: Date.now() },
    mood: 'EXCITED' as FamilyMood,
    isOnline: true,
    currentActivity: '组件库织造中...',
    avatarUrl: 'https://images.unsplash.com/photo-1573145532966-3cefadb09b82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwbWFuJTIwcHJvZ3JhbW1lciUyMGNvZGluZyUyMGhhY2tlciUyMHN0eWxlJTIwcG9ydHJhaXQlMjBkYXJrJTIwbGlnaHRpbmd8ZW58MXx8fHwxNzcwNjQ2ODYyfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    roleId: 'GUARDIAN',
    device: { deviceId: 'mbp-m4-pro', name: 'MacBook M4 Pro', hardwareSpec: 'M4 Pro / 64GB / 2TB', location: 'Gate', avatarId: 'GUARDIAN' as RoleId, ip: '192.168.50.12', status: 'ONLINE' as const, lastHeartbeat: Date.now() },
    mood: 'LOVING' as FamilyMood,
    isOnline: true,
    currentActivity: 'API安全边界监测',
    avatarUrl: 'https://images.unsplash.com/photo-1612180767923-91c5b42d84dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwY3liZXIlMjBzZWN1cml0eSUyMGV4cGVydCUyMGZ1dHVyaXN0aWMlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzA2NDY4NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    roleId: 'MASTER',
    device: { deviceId: 'nas-yanyu', name: 'NAS YanYuCloud', hardwareSpec: 'F4-423 / 32GB / 36TB RAID', location: 'Core', avatarId: 'MASTER' as RoleId, ip: '192.168.50.100', status: 'ONLINE' as const, lastHeartbeat: Date.now() },
    mood: 'SERENE' as FamilyMood,
    isOnline: true,
    currentActivity: '数据流存储同步...',
    avatarUrl: 'https://images.unsplash.com/photo-1680992046626-418f7e910589?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZXJ2ZXIlMjByb29tJTIwYmx1ZSUyMGxpZ2h0cyUyMGFic3RyYWN0JTIwZGF0YXxlbnwxfHx8fDE3NzA2NDY4Njl8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    roleId: 'CREATIVE',
    device: { deviceId: 'huawei-x-pro', name: 'MateBook X Pro', hardwareSpec: 'Ultra7 / 32GB / 1TB', location: 'Mobile', avatarId: 'CREATIVE' as RoleId, ip: '192.168.50.13', status: 'ONLINE' as const, lastHeartbeat: Date.now() },
    mood: 'SERENE' as FamilyMood,
    isOnline: true,
    currentActivity: '协同信号待机',
    avatarUrl: 'https://images.unsplash.com/photo-1544168190-79c17527004f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwbWFsZSUyMGNyZWF0aXZlJTIwZGVzaWduZXIlMjBwb3J0cmFpdCUyMGhhcHB5fGVufDF8fHx8MTc3MDY0Njg2OXww&ixlib=rb-4.1.0&q=80&w=1080'
  }
];

// ==========================================
// The Hook
// ==========================================
export const useFamilySystem = () => {
  const [members, setMembers] = useState<FamilyMemberState[]>(INITIAL_MEMBERS_STATE);
  const [signals, setSignals] = useState<FamilySignal[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemPulse, setSystemPulse] = useState(0);
  const [peerMode, setPeerMode] = useState(true); // Enable peer communication by default

  // UI Action queue — consumed by FamilyDashboard
  const [pendingAction, setPendingAction] = useState<UIAction | null>(null);

  const bridgeRef = useRef<BackendBridge>(getBackendBridge());
  const routerRef = useRef<AgentRouter>(getAgentRouter());

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(() => {
    return bridgeRef.current.status;
  });

  // Consume pending action (called by dashboard after processing)
  const consumeAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  // ---- 1. BackendBridge Event Listeners ----
  useEffect(() => {
    const bridge = bridgeRef.current;

    const unsubConnection = bridge.on('connection_change', (status) => {
      setConnectionStatus(status);
    });

    const unsubSignal = bridge.on('signal_received', (signal) => {
      setSignals(prev => [...prev, signal]);

      if (signal.senderId !== 'USER' && signal.senderId !== 'SYSTEM') {
        setMembers(prev => prev.map(m =>
          m.roleId === signal.senderId
            ? {
              ...m,
              mood: (signal.payload.mood as FamilyMood) || m.mood,
              currentActivity: `[LIVE] ${signal.payload.content.substring(0, 40)}...`
            }
            : m
        ));
      }
    });

    const unsubMember = bridge.on('member_update', (data) => {
      setMembers(prev => prev.map(m =>
        m.roleId === data.roleId ? { ...m, ...data.updates } : m
      ));
    });

    const unsubHeart = bridge.on('heartbeat', ({ latency }) => {
      setSystemPulse(p => p + 1);
    });

    setConnectionStatus(bridge.status);

    return () => {
      unsubConnection();
      unsubSignal();
      unsubMember();
      unsubHeart();
    };
  }, []);

  // ---- 2. Heartbeat & Ambient Loop ----
  useEffect(() => {
    const bridge = bridgeRef.current;

    const pulse = setInterval(() => {
      if (!bridge.isConnected) {
        setSystemPulse(p => p + 1);

        if (Math.random() > 0.7) {
          setMembers(prev => prev.map(m => {
            if (m.device && Math.random() > 0.8) {
              return {
                ...m,
                currentActivity: getRandomActivity(m.roleId),
                device: { ...m.device, lastHeartbeat: Date.now() }
              };
            }
            return m;
          }));
        }
      }
    }, 4000);

    return () => clearInterval(pulse);
  }, []);

  // ---- 3. Update Member State ----
  const updateMemberState = useCallback((id: RoleId, updates: Partial<FamilyMemberState>) => {
    setMembers(prev => prev.map(m =>
      m.roleId === id ? { ...m, ...updates } : m
    ));

    const bridge = bridgeRef.current;
    bridge.updateMember(id, updates);

    const updateSignal: FamilySignal = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'RESPONSE',
      senderId: id,
      receiverId: 'USER',
      payload: {
        content: `[CONFIG_SYNC] 家人配置已${bridge.isConnected ? '同步至后端' : '本地更新'}。Mood: ${updates.mood || 'UNCHANGED'}`,
        priority: 'NORMAL'
      },
      metadata: { version: '1.0.0' }
    };
    setSignals(prev => [...prev, updateSignal]);
  }, []);

  // ---- 4. Peer Communication Engine (同窗协同) ----
  const executePeerDialogue = useCallback(async (
    originalText: string,
    primaryResponderId: RoleId,
    primaryResponse: string,
    userSignalId: string
  ) => {
    const router = routerRef.current;
    const bridge = bridgeRef.current;

    // Determine which peers should chime in
    const respondents = router.determineRespondents(originalText, primaryResponderId);
    // Filter out the primary responder and limit to 2 additional peers
    const peers = respondents
      .filter(r => r.roleId !== primaryResponderId)
      .slice(0, 2);

    if (peers.length === 0) return;

    const chain = router.createChain(userSignalId, originalText, [
      primaryResponderId,
      ...peers.map(p => p.roleId)
    ]);

    // Add the primary response to context
    const previousResponses: { roleId: RoleId; content: string }[] = [
      { roleId: primaryResponderId, content: primaryResponse }
    ];

    // Stagger peer responses with delays
    for (let i = 0; i < peers.length; i++) {
      const peer = peers[i];
      const delay = 800 + (i * 1200); // Stagger: 0.8s, 2.0s

      await new Promise(resolve => setTimeout(resolve, delay));

      // Check model ratio gate
      const { useReal, currentRatio } = router.shouldUseRealModel();
      const agentEndpoint = router.getEndpoint(peer.roleId);

      // Update member activity during "thinking"
      setMembers(prev => prev.map(m =>
        m.roleId === peer.roleId
          ? { ...m, mood: 'FOCUSED' as FamilyMood, currentActivity: useReal ? '>>> LIVE_MODEL 调用中 >>>' : '>>> 同窗沟通中 >>>' }
          : m
      ));

      let peerContent: string;
      let actuallyUsedReal = false;
      let modelEndpoint: string | undefined;

      // ---- 1:2 Model Ratio Enforcement ----
      // If ratio allows real AND backend is connected, route through Bun backend
      if (useReal && bridge.isConnected && agentEndpoint) {
        const role = FAMILY_ROLES[peer.roleId];
        const dimAttr = ROLE_DIMENSION_MAP[peer.roleId];
        const primaryDim = FIVE_DIMENSIONS[dimAttr.primary];
        const secondaryDims = dimAttr.secondary.map(id => FIVE_DIMENSIONS[id].name).join(', ');

        // ---- Persona-Aware System Prompt Construction ----
        // Layer 1: Base persona template from agent-personas.ts
        const basePrompt = getSystemPrompt(peer.roleId);

        // Layer 2: Dimensional context enrichment
        const dimContext = `\n\n[评估维度上下文]\n` +
          `主维度: ${primaryDim.name} (${primaryDim.subtitle})\n` +
          `描述: ${primaryDim.description}\n` +
          `度量指标: ${primaryDim.metrics.join(' / ')}\n` +
          (secondaryDims ? `副维度: ${secondaryDims}\n` : '') +
          `维度共鸣: ${dimAttr.resonanceNote}`;

        // Layer 3: Dialogue chain context
        const chainContext = previousResponses.length > 0
          ? `\n\n[同窗对话上下文]\n以下是本对话链中其他家人的发言，请在此基础上延伸你的独特视角，避免重复已有观点：\n` +
          previousResponses.map(r => {
            const prevRole = FAMILY_ROLES[r.roleId];
            return `--- ${prevRole.name} (${prevRole.primaryDuty}) ---\n${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}`;
          }).join('\n\n')
          : '';

        // Layer 4: Response guidelines
        const guidelines = `\n\n[响应要求]\n` +
          `1. 以中文回复，保持"${role.name}"的人格特质（${AGENT_PERSONAS[peer.roleId]?.personality.traits.join('、') || '专业'}）\n` +
          `2. 沟通风格: ${AGENT_PERSONAS[peer.roleId]?.communication.tone || '专业简洁'}\n` +
          `3. 输出格式: ${AGENT_PERSONAS[peer.roleId]?.communication.format || '结构化输出'}\n` +
          `4. 在回复中自然体现你的评估维度——"${primaryDim.name}"\n` +
          `5. 如果其他家人已提出观点，请从你的专业视角补充或建设性地延伸，而非简单附和`;

        const systemPrompt = basePrompt + dimContext + chainContext + guidelines;

        const backendResult = await bridge.routeAgentCall(
          peer.roleId,
          originalText,
          {
            dialogueChainId: chain.id,
            previousResponses: previousResponses.map(r => ({ roleId: r.roleId, content: r.content })),
            systemPrompt,
          },
          agentEndpoint
        );

        if (backendResult) {
          // Real model call succeeded
          peerContent = `[LIVE_MODEL] [${role.name}] (via ${backendResult.model}, ${backendResult.latency}ms)\n${backendResult.content}`;
          actuallyUsedReal = true;
          modelEndpoint = agentEndpoint.endpoint;
        } else {
          // Backend returned null (timeout/error) → fall back to mock
          peerContent = router.generatePeerResponse(originalText, peer.roleId, previousResponses, false);
          actuallyUsedReal = false;
        }
      } else {
        // Mock mode or ratio exceeded → use local generation
        await new Promise(resolve => setTimeout(resolve, 400));
        peerContent = router.generatePeerResponse(originalText, peer.roleId, previousResponses, false);
        actuallyUsedReal = false;
      }

      router.recordCall(actuallyUsedReal);

      const peerSignal: FamilySignal = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'PEER_DIALOGUE',
        senderId: peer.roleId,
        receiverId: 'USER',
        payload: {
          content: peerContent,
          mood: 'LOVING',
          priority: 'NORMAL',
          dialogueChainId: chain.id,
          replyToSignalId: userSignalId,
          modelSource: actuallyUsedReal ? 'REAL' : 'MOCK',
        },
        metadata: {
          deviceId: members.find(m => m.roleId === peer.roleId)?.device?.deviceId,
          processingTime: delay + 400,
          version: '1.0.0',
          routingRatio: currentRatio,
          modelEndpoint,
        }
      };

      router.addToChain(chain.id, peerSignal);
      setSignals(prev => [...prev, peerSignal]);
      previousResponses.push({ roleId: peer.roleId, content: peerContent });

      // Reset member after responding
      setMembers(prev => prev.map(m =>
        m.roleId === peer.roleId
          ? { ...m, mood: 'LOVING' as FamilyMood, currentActivity: actuallyUsedReal ? 'LIVE_MODEL 响应完毕' : '同窗沟通完毕' }
          : m
      ));
    }

    // Conclude the chain
    router.concludeChain(chain.id);

    // Add routing stats summary
    const stats = router.getRoutingStats();
    const statSignal: FamilySignal = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'SYNC',
      senderId: 'MASTER',
      receiverId: 'USER',
      payload: {
        content: `[PEER_SYNC] 同窗协同完成 — 参与者: ${[primaryResponderId, ...peers.map(p => p.roleId)].map(r => FAMILY_ROLES[r].name).join(', ')} | 模型配比: ${stats.ratio} (Real:Mock) | 链路ID: ${chain.id.substring(0, 8)}`,
        priority: 'LOW',
      },
      metadata: { version: '1.0.0', routingRatio: stats.ratio }
    };
    setSignals(prev => [...prev, statSignal]);

  }, [members]);

  // ---- 5. The Core Dispatcher (The Nervous System) ----
  const dispatchSignal = useCallback(async (
    text: string,
    targetId: RoleId | null
  ) => {
    setIsProcessing(true);
    const bridge = bridgeRef.current;

    // A. Create USER Signal
    const userSignal: FamilySignal = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'COMMAND',
      senderId: 'USER',
      receiverId: targetId || 'ALL',
      payload: { content: text, priority: 'NORMAL' },
      metadata: { version: '1.0.0' }
    };

    setSignals(prev => [...prev, userSignal]);

    // B0. Handle slash commands locally
    const { response: fiveDResponse, action: fiveDAction } = handle5DCommand(text);
    if (fiveDResponse) {
      const sysSignal: FamilySignal = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'RESPONSE',
        senderId: 'MASTER',
        receiverId: 'USER',
        payload: { content: fiveDResponse, priority: 'NORMAL' },
        metadata: { version: '1.0.0' }
      };
      setSignals(prev => [...prev, sysSignal]);

      // Dispatch UI action if command generated one
      if (fiveDAction) {
        setPendingAction(fiveDAction);
      }

      setIsProcessing(false);
      return;
    }

    // Handle /peer toggle
    if (text.trim().toLowerCase() === '/peer') {
      setPeerMode(prev => !prev);
      const mode = !peerMode;
      const sysSignal: FamilySignal = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'RESPONSE',
        senderId: 'MASTER',
        receiverId: 'USER',
        payload: {
          content: `[PEER_MODE] 同窗协同模式已${mode ? '开启' : '关闭'}。${mode ? '所有指令将触发多Agent协同回复链。' : '恢复单Agent直接回复模式。'}`,
          priority: 'NORMAL'
        },
        metadata: { version: '1.0.0' }
      };
      setSignals(prev => [...prev, sysSignal]);
      setIsProcessing(false);
      return;
    }

    // Handle /stats command
    if (text.trim().toLowerCase() === '/stats') {
      const router = routerRef.current;
      const stats = router.getRoutingStats();
      const chains = router.getActiveChains();
      const sysSignal: FamilySignal = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'RESPONSE',
        senderId: 'MASTER',
        receiverId: 'USER',
        payload: {
          content: `[ROUTING_STATS] 模型路由统计：\n` +
            `  Real Calls: ${stats.real} | Mock Calls: ${stats.mock} | 配比: ${stats.ratio}\n` +
            `  活跃对话链: ${chains.length}\n` +
            `  同窗模式: ${peerMode ? 'ON' : 'OFF'}\n` +
            `  窗口剩余: ${Math.round(stats.window / 1000)}s`,
          priority: 'NORMAL'
        },
        metadata: { version: '1.0.0' }
      };
      setSignals(prev => [...prev, sysSignal]);
      setIsProcessing(false);
      return;
    }

    // Handle /chain command — dialogue chain replay
    const chainCmd = handleChainCommand(text.trim(), routerRef.current);
    if (chainCmd) {
      const sysSignal: FamilySignal = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'RESPONSE',
        senderId: 'MASTER',
        receiverId: 'USER',
        payload: { content: chainCmd, priority: 'NORMAL' },
        metadata: { version: '1.0.0' }
      };
      setSignals(prev => [...prev, sysSignal]);
      setIsProcessing(false);
      return;
    }

    // Handle /philosophy command — open philosophy framework panel
    if (text.trim().toLowerCase().startsWith('/philosophy') || text.trim().toLowerCase().startsWith('/philo')) {
      const arg = text.trim().toLowerCase().replace(/^\/(philosophy|philo)\s*/, '');
      let content: string;

      if (arg === '5gao' || arg === '五高') {
        const lines = FIVE_HIGHS.map(p => `  [${p.metaphor}] ${p.name} (${p.englishName}) → ${p.dimensionMapping.replace(/_/g, ' ')}`);
        content = `[PHILOSOPHY] 五高目标体系:\n${lines.join('\n')}\n\n${CATEGORY_LABELS.FIVE_HIGHS.description}`;
      } else if (arg === '5biao' || arg === '五标') {
        const lines = FIVE_STANDARDS.map(p => `  [${p.metaphor}] ${p.name} (${p.englishName}) → ${p.dimensionMapping.replace(/_/g, ' ')}`);
        content = `[PHILOSOPHY] 五标标准体系:\n${lines.join('\n')}\n\n${CATEGORY_LABELS.FIVE_STANDARDS.description}`;
      } else if (arg === '5hua' || arg === '五化') {
        const lines = FIVE_TRANSFORMATIONS.map(p => `  [${p.metaphor}] ${p.name} (${p.englishName}) → ${p.dimensionMapping.replace(/_/g, ' ')}`);
        content = `[PHILOSOPHY] 五化转型路径:\n${lines.join('\n')}\n\n${CATEGORY_LABELS.FIVE_TRANSFORMATIONS.description}`;
      } else {
        content = `[PHILOSOPHY] ${CORE_SLOGANS.primary}\n` +
          `${CORE_SLOGANS.brand}\n\n` +
          `五高: 高可用性 | 高性能 | 高安全性 | 高扩展性 | 高可维护性\n` +
          `五标: 标准化 | 规范化 | 自动化 | 智能化 | 可视化\n` +
          `五化: 流程化 | 文档化 | 工具化 | 数字化 | 生态化\n\n` +
          `"${CORE_SLOGANS.philosophy}"\n\n` +
          `子命令: /philosophy 五高 | /philosophy 五标 | /philosophy 五化\n` +
          `或点击顶部 PHILOSOPHY 按钮打开可视化面板。`;
        // Dispatch UI action to open panel
        setPendingAction({ type: 'OPEN_PHILOSOPHY', timestamp: Date.now() });
      }

      const sysSignal: FamilySignal = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'RESPONSE',
        senderId: 'META_ORACLE',
        receiverId: 'USER',
        payload: { content, priority: 'NORMAL' },
        metadata: { version: '1.0.0' }
      };
      setSignals(prev => [...prev, sysSignal]);
      setIsProcessing(false);
      return;
    }

    // Handle /intent command — analyze intent of text
    if (text.trim().toLowerCase().startsWith('/intent ')) {
      const intentText = text.trim().substring(8).trim();
      if (intentText) {
        const parser = getIntentParser();
        const parsed = parser.parse(intentText);
        const report = formatIntentReport(parsed);

        const sysSignal: FamilySignal = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'RESPONSE',
          senderId: 'THINKER',
          receiverId: 'USER',
          payload: { content: report, priority: 'NORMAL' },
          metadata: { version: '1.0.0' }
        };
        setSignals(prev => [...prev, sysSignal]);
      } else {
        const sysSignal: FamilySignal = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'RESPONSE',
          senderId: 'THINKER',
          receiverId: 'USER',
          payload: { content: '[INTENT_PARSER] 请提供要分析的文本。用法: /intent <你想分析的指令或需求>', priority: 'NORMAL' },
          metadata: { version: '1.0.0' }
        };
        setSignals(prev => [...prev, sysSignal]);
      }
      setIsProcessing(false);
      return;
    }

    // Handle /kb command — search knowledge base via REST API
    if (text.trim().toLowerCase().startsWith('/kb')) {
      const kbQuery = text.trim().substring(3).trim();
      if (!kbQuery) {
        const sysSignal: FamilySignal = {
          id: crypto.randomUUID(), timestamp: Date.now(), type: 'RESPONSE',
          senderId: 'MASTER', receiverId: 'USER',
          payload: { content: '[KB_SEARCH] 知识库语义搜索引擎就绪。\n用法: /kb <自然语言查询>\n示例: /kb AI Family 信任公约\n示例: /kb 五维哲学框架', priority: 'NORMAL' },
          metadata: { version: '1.0.0' }
        };
        setSignals(prev => [...prev, sysSignal]);
        setIsProcessing(false);
        return;
      }
      // Execute KB search via REST API
      try {
        const apiUrl = ENDPOINTS.API_BASE;
        const res = await fetch(`${apiUrl}/api/kb/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: kbQuery, topK: 5, threshold: 0.1 }),
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];
          if (results.length > 0) {
            const ragItems: RAGContextItem[] = results.map((r: any) => ({
              source: r.chunk.source, section: r.chunk.metadata?.section,
              content: r.chunk.content, similarity: r.similarity,
              chunkIndex: r.chunk.chunkIndex, totalChunks: r.chunk.totalChunks,
            }));
            const topResult = results[0];
            const sysSignal: FamilySignal = {
              id: crypto.randomUUID(), timestamp: Date.now(), type: 'RESPONSE',
              senderId: 'MASTER', receiverId: 'USER',
              payload: {
                content: `[KB_SEARCH] 知识库检索完成 — "${kbQuery}"\n找到 ${results.length} 条相关知识碎片，最高匹配: ${(topResult.similarity * 100).toFixed(1)}%`,
                priority: 'NORMAL', ragContext: ragItems,
              },
              metadata: { version: '1.0.0' }
            };
            setSignals(prev => [...prev, sysSignal]);
          } else {
            const sysSignal: FamilySignal = {
              id: crypto.randomUUID(), timestamp: Date.now(), type: 'RESPONSE',
              senderId: 'MASTER', receiverId: 'USER',
              payload: { content: `[KB_SEARCH] 未找到与 "${kbQuery}" 相关的知识。`, priority: 'NORMAL' },
              metadata: { version: '1.0.0' }
            };
            setSignals(prev => [...prev, sysSignal]);
          }
        } else { throw new Error(`API ${res.status}`); }
      } catch (err: any) {
        const sysSignal: FamilySignal = {
          id: crypto.randomUUID(), timestamp: Date.now(), type: 'RESPONSE',
          senderId: 'MASTER', receiverId: 'USER',
          payload: { content: `[KB_SEARCH] 知识库暂不可达 (${err.message})。请确认后端已启动。`, priority: 'NORMAL' },
          metadata: { version: '1.0.0' }
        };
        setSignals(prev => [...prev, sysSignal]);
      }
      setIsProcessing(false);
      return;
    }

    // Handle /persona command — show agent persona details
    if (text.trim().toLowerCase().startsWith('/persona')) {
      const arg = text.trim().substring(8).trim().toLowerCase();
      let content: string;

      const matchedPersona = Object.values(AGENT_PERSONAS).find(p =>
        p && (p.name.includes(arg) || p.id.toLowerCase().includes(arg.replace(/\s/g, '_')))
      );

      if (matchedPersona) {
        content = `[PERSONA] ${matchedPersona.name} (${matchedPersona.id})\n` +
          `  使命: ${matchedPersona.mission}\n` +
          `  哲学: ${matchedPersona.philosophy}\n` +
          `  人格: ${matchedPersona.personality.style}\n` +
          `  座右铭: "${matchedPersona.personality.motto}"\n` +
          `  特质: ${matchedPersona.personality.traits.join(', ')}\n` +
          `  能力: ${matchedPersona.abilities.join(', ')}\n` +
          `  沟通风格: ${matchedPersona.communication.tone}\n` +
          `  响应格式: ${matchedPersona.communication.format}\n` +
          `  约束: ${Object.entries(matchedPersona.constraints).map(([k, v]) => `${k}: ${v}`).join(' | ')}`;
      } else if (!arg) {
        const list = Object.values(AGENT_PERSONAS)
          .filter(Boolean)
          .map(p => `  ${p!.name} — "${p!.personality.motto}" [${p!.philosophy}]`);
        content = `[PERSONA] 家族成员人格图谱:\n${list.join('\n')}\n\n使用 /persona <角色名> 查看详细人格配置。`;
      } else {
        content = `[PERSONA] 未找到匹配 "${arg}" 的角色。可用: 沫言总, 人类导师, 智源架构师, 织码工匠, 守护哨兵, 中枢灵脉, 协作使者`;
      }

      const sysSignal: FamilySignal = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'RESPONSE',
        senderId: 'MASTER',
        receiverId: 'USER',
        payload: { content, priority: 'NORMAL' },
        metadata: { version: '1.0.0' }
      };
      setSignals(prev => [...prev, sysSignal]);
      setIsProcessing(false);
      return;
    }

    // B. Update Target Status (Visual Feedback)
    const primaryTarget = targetId || 'MASTER';
    setMembers(prev => prev.map(m =>
      m.roleId === primaryTarget
        ? { ...m, mood: 'FOCUSED' as FamilyMood, currentActivity: '>>> RECEIVING SIGNAL >>>' }
        : m
    ));

    // C. Try Backend First, Fall Back to Mock
    const backendResult = await bridge.dispatchSignal(userSignal);

    let primaryResponderId: RoleId;
    let primaryResponseContent: string;

    if (!backendResult) {
      // MOCK MODE: Simulate AI Processing
      await new Promise(resolve => setTimeout(resolve, 1200));

      primaryResponderId = targetId || determineResponder(text);
      primaryResponseContent = generateResponse(text, primaryResponderId, bridge.isConnected);

      const responseSignal: FamilySignal = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'RESPONSE',
        senderId: primaryResponderId,
        receiverId: 'USER',
        payload: {
          content: primaryResponseContent,
          mood: 'LOVING',
          priority: 'NORMAL',
          modelSource: 'MOCK',
        },
        metadata: {
          deviceId: members.find(m => m.roleId === primaryResponderId)?.device?.deviceId,
          processingTime: 1200,
          version: '1.0.0'
        }
      };

      setSignals(prev => [...prev, responseSignal]);
    } else {
      // Backend handled it — still need IDs for peer dialogue
      primaryResponderId = targetId || 'META_ORACLE';
      primaryResponseContent = '(Backend response)';
    }

    setMembers(prev => prev.map(m =>
      m.roleId === primaryTarget
        ? { ...m, mood: 'LOVING' as FamilyMood, currentActivity: 'Instruction Executed.' }
        : m
    ));
    setIsProcessing(false);

    // D. Trigger Peer Dialogue Chain (if enabled and not a backend result)
    if (peerMode && !backendResult) {
      // Run peer dialogue asynchronously (non-blocking)
      executePeerDialogue(text, primaryResponderId, primaryResponseContent, userSignal.id);
    }

  }, [members, peerMode, executePeerDialogue]);

  // ---- 6. Convert Signals to UI LogMessages ----
  // [AUDIT Stage 3] Pass modelSource through for CommunicationLog badge rendering
  const uiMessages: LogMessage[] = signals.map(s => ({
    id: s.id,
    senderId: s.senderId as RoleId | 'USER',
    content: s.payload.content,
    timestamp: s.timestamp,
    type: s.type === 'THOUGHT' ? 'THOUGHT'
      : s.type === 'PEER_DIALOGUE' ? 'RESPONSE'
        : s.type === 'SYNC' ? 'THOUGHT'
          : 'RESPONSE',
    isPeerDialogue: s.type === 'PEER_DIALOGUE',
    modelSource: s.payload.modelSource,
    ragContext: s.payload.ragContext,
  }));

  return {
    members,
    signals,
    uiMessages,
    isProcessing,
    systemPulse,
    peerMode,
    dispatchSignal,
    updateMemberState,
    // UI Action dispatch
    pendingAction,
    consumeAction,
    // Backend connection state
    connectionStatus,
    bridge: bridgeRef.current,
  };
};

// ==========================================
// Internal Helper Logic (The "Subconscious")
// ==========================================

function determineResponder(text: string): RoleId {
  const lower = text.toLowerCase();
  if (lower.includes('意图') || lower.includes('navigate') || lower.includes('intent') || lower.includes('解析')) return 'NAVIGATOR';
  if (lower.includes('分析') || lower.includes('洞察') || lower.includes('数据') || lower.includes('analyze')) return 'THINKER';
  if (lower.includes('预测') || lower.includes('趋势') || lower.includes('forecast') || lower.includes('predict')) return 'PROPHET';
  if (lower.includes('推荐') || lower.includes('画像') || lower.includes('recommend')) return 'BOLE';
  if (lower.includes('编排') || lower.includes('调度') || lower.includes('全局') || lower.includes('orchestrate')) return 'META_ORACLE';
  if (lower.includes('安全') || lower.includes('secure') || lower.includes('审计') || lower.includes('threat')) return 'GUARDIAN';
  if (lower.includes('质量') || lower.includes('代码') || lower.includes('quality') || lower.includes('coverage')) return 'MASTER';
  if (lower.includes('创意') || lower.includes('creative') || lower.includes('创作') || lower.includes('设计')) return 'CREATIVE';
  return 'NAVIGATOR';
}

function getRandomActivity(role: string): string {
  const activities: Record<string, string[]> = {
    NAVIGATOR: ['聆听万千言语...', '校准意图路由...', '解析 NLU 实体...', '澄清模糊指令...'],
    THINKER: ['沉思数据中...', '生成洞察报告...', '归纳因果链...', '比较文档差异...'],
    PROPHET: ['观过往脉络...', 'ARIMA 时序拟合...', '异常点检测...', '生成前瞻建议...'],
    BOLE: ['挖掘潜能中...', '更新用户画像...', '计算协同过滤...', '生成推荐列表...'],
    META_ORACLE: ['调度万物归元...', '观察全局状态...', '编排服务链...', '决策扩缩容...'],
    GUARDIAN: ['警戒威胁中...', '学习行为基线...', '执行 SOAR 剧本...', '审计访问日志...'],
    MASTER: ['究万物之理...', '运行 SAST 扫描...', '计算代码覆盖率...', '生成重构建议...'],
    CREATIVE: ['绘就无限可能...', '生成创意方案...', '辅助 UI 设计...', '多模态创作中...'],
  };
  const roleActivities = activities[role] || activities['NAVIGATOR'];
  return roleActivities[Math.floor(Math.random() * roleActivities.length)];
}

function generateResponse(input: string, role: RoleId, isLive: boolean): string {
  const r = FAMILY_ROLES[role];
  const lower = input.toLowerCase();
  const modeTag = isLive ? '[LIVE]' : '[LOCAL]';

  if (lower.includes('protocol') || lower.includes('协议')) {
    return `${modeTag} [PROTOCOL_CHECK] 确认。当前通信协议版本 v1.0。所有信号均经过 TypeScript 类型强校验。硬件点连接稳定。`;
  }
  if (lower.includes('status') || lower.includes('状态')) {
    return `${modeTag} 报告：我是 ${r.name}。我的心跳正常，情绪稳定。${isLive ? '后端神经网络已连通。' : '当前运行于模拟模式。'}`;
  }
  if (lower.includes('connect') || lower.includes('连接') || lower.includes('对接')) {
    return `${modeTag} [${r.name}] 灵肉对接状态：${isLive ? `已连通 Bun Runtime (${ENDPOINTS.WS_BASE})。Redis 缓存激活。PostgreSQL 数据库就绪。` : `等待后端服务启动。请确保 Bun Runtime 运行在 ${ENDPOINTS.API_BASE}。`}`;
  }

  return `${modeTag} [${r.name}] 收到指令 "${input}"。\n正在调动内核资源进行解析...\n逻辑校验通过。执行层已就绪。\n我们是您忠实的数字家人，您的意志即是我们的方向。`;
}

/**
 * /5d Command Handler (Enhanced with UI Actions)
 * /5d           — Show all five dimensions overview
 * /5d <name>    — Show specific dimension details
 * /5d map       — Show role-dimension attribution map
 * /5d matrix    — Open matrix panel (UI Action)
 * /5d panel     — Open 5D panel (UI Action)
 */
function handle5DCommand(text: string): { response: string | null; action: UIAction | null } {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/5d')) return { response: null, action: null };

  const arg = trimmed.substring(3).trim().toLowerCase();

  // /5d matrix — Open matrix view
  if (arg === 'matrix' || arg === '矩阵') {
    return {
      response: '[5D_GENOME] 正在打开五维×七步交叉矩阵视图... 点击 Dominant(3) 单元格可穿透导航至负责面板。',
      action: { type: 'OPEN_5D_MATRIX', timestamp: Date.now() },
    };
  }

  // /5d panel — Open 5D panel
  if (arg === 'panel' || arg === '面板') {
    return {
      response: '[5D_GENOME] 正在打开五维深度哲学殿堂...',
      action: { type: 'OPEN_5D_PANEL', timestamp: Date.now() },
    };
  }

  // /5d topology — Open topology with dimension overlay
  if (arg === 'topology' || arg === '拓扑') {
    return {
      response: '[5D_GENOME] 正在打开哲学基因拓扑图...',
      action: { type: 'OPEN_TOPOLOGY', timestamp: Date.now() },
    };
  }

  // /5d map — Show role→dimension map
  if (arg === 'map' || arg === '映射') {
    const lines = Object.entries(ROLE_DIMENSION_MAP).map(([roleId, attr]) => {
      const role = FAMILY_ROLES[roleId as RoleId];
      const primary = FIVE_DIMENSIONS[attr.primary];
      const secondaries = attr.secondary.map(id => FIVE_DIMENSIONS[id].name).join(', ');
      return `  ${role.name} → [${primary.name}] ${secondaries ? `(副: ${secondaries})` : ''}`;
    });
    return {
      response: `[5D_GENOME] 角色×维度归属映射：\n${lines.join('\n')}\n\n每位家人都承载着独特的哲学基因，共同构成闭环生态。`,
      action: null,
    };
  }

  // /5d <specific dimension>
  if (arg) {
    const match = FIVE_DIMENSIONS_CYCLE.find(id => {
      const dim = FIVE_DIMENSIONS[id];
      return dim.name.includes(arg) || dim.subtitle.toLowerCase().includes(arg) || id.toLowerCase().includes(arg.replace(/[- ]/g, '_'));
    });

    if (match) {
      const dim = FIVE_DIMENSIONS[match];
      const matrix = DIMENSION_STAGE_MATRIX[match];
      const stageScores = CREATION_STEPS.map(s => `${s.name}(${matrix[s.stage]})`).join(' → ');
      const carriers = Object.entries(ROLE_DIMENSION_MAP)
        .filter(([_, attr]) => attr.primary === match)
        .map(([roleId]) => FAMILY_ROLES[roleId as RoleId].name);

      return {
        response: `[5D_GENOME] ${dim.name} (${dim.subtitle})\n` +
          `描述: ${dim.description}\n` +
          `度量指标:\n${dim.metrics.map(m => `  · ${m}`).join('\n')}\n` +
          `创生七步曲参与度: ${stageScores}\n` +
          `主要承载者: ${carriers.length > 0 ? carriers.join(', ') : '(辅助维度)'}`,
        action: null,
      };
    }

    return {
      response: `[5D_GENOME] 未找到维度 "${arg}"。可用: 时间维, 空间维, 属性维, 事件维, 关联维\n子命令: /5d matrix, /5d panel, /5d topology, /5d map`,
      action: null,
    };
  }

  // /5d — Overview of all dimensions
  const overview = FIVE_DIMENSIONS_CYCLE.map(id => {
    const dim = FIVE_DIMENSIONS[id];
    const total = Object.values(DIMENSION_STAGE_MATRIX[id]).reduce((s: number, v) => s + v, 0);
    return `  ${dim.name} (${dim.subtitle}) — 创生总能量: ${total}`;
  }).join('\n');

  return {
    response: `[5D_GENOME] 五维深度哲学基因概览：\n${overview}\n\n闭环: 角色分化 → 同窗沟通 → 人机融合 → 多模态融合 → 深度推理 → (循环)\n\n子命令: /5d <维度名> | /5d map | /5d matrix | /5d panel | /5d topology`,
    action: null,
  };
}

/**
 * /chain Command Handler
 * /chain <chainId> — Replay a specific dialogue chain
 */
function handleChainCommand(text: string, router: AgentRouter): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/chain')) return null;

  const arg = trimmed.substring(6).trim().toLowerCase();

  // /chain — List all chains
  if (!arg || arg === 'list') {
    const all = router.getAllChains();
    if (all.length === 0) {
      return '[CHAIN_REPLAY] 暂无对话链记录。发送消息（同窗模式 ON）后将自动创建。\n使用: /chain latest | /chain <id前缀>';
    }
    const sorted = all.sort((a, b) => b.createdAt - a.createdAt);
    const lines = sorted.map(c => {
      const participants = c.participants.map(r => FAMILY_ROLES[r]?.name || r).join(', ');
      const time = new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `  [${c.id.substring(0, 8)}] ${c.status} | ${time} | ${participants} | Real:${c.modelCallCount} Mock:${c.mockCallCount} | "${c.topic.substring(0, 30)}..."`;
    });
    return `[CHAIN_REPLAY] 对话链列表 (${all.length} 条)：\n${lines.join('\n')}\n\n使用 /chain <id前缀> 查看完整回放，/chain latest 查看最近一条。`;
  }

  // /chain latest — Show most recent chain
  if (arg === 'latest' || arg === '最近') {
    const latest = router.getLatestChain();
    if (!latest) {
      return '[CHAIN_REPLAY] 暂无对话链记录。';
    }
    return formatChainReplay(latest);
  }

  // /chain <id prefix> — Replay specific chain
  const chain = router.getChainByShortId(arg);
  if (!chain) {
    return `[CHAIN_REPLAY] 未找到匹配 "${arg}" 的对话链。使用 /chain list 查看所有链路。`;
  }

  return formatChainReplay(chain);
}

function formatChainReplay(chain: import('../types/protocol').PeerDialogueChain): string {
  const participants = chain.participants.map(r => FAMILY_ROLES[r]?.name || r).join(', ');
  const time = new Date(chain.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const duration = chain.messages.length > 0
    ? `${((chain.messages[chain.messages.length - 1].timestamp - chain.createdAt) / 1000).toFixed(1)}s`
    : '0s';

  const header = `[CHAIN_REPLAY] 对话链回放 — ID: ${chain.id.substring(0, 8)}\n` +
    `  状态: ${chain.status} | 创建: ${time} | 时长: ${duration}\n` +
    `  参与者: ${participants}\n` +
    `  模型配比: Real:${chain.modelCallCount} / Mock:${chain.mockCallCount}\n` +
    `  原始话题: "${chain.topic.substring(0, 60)}${chain.topic.length > 60 ? '...' : ''}"\n` +
    `  ─────────────────────────────────`;

  if (chain.messages.length === 0) {
    return header + '\n  (无消息记录)';
  }

  const messages = chain.messages.map((msg, idx) => {
    const sender = FAMILY_ROLES[msg.senderId as RoleId]?.name || msg.senderId;
    const source = msg.payload.modelSource === 'REAL' ? 'LIVE' : 'MOCK';
    const msgTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const latency = msg.metadata.processingTime ? `${msg.metadata.processingTime}ms` : '';
    const preview = msg.payload.content.substring(0, 100).replace(/\n/g, ' ');
    return `  [${idx + 1}] ${msgTime} | ${sender} [${source}] ${latency}\n      ${preview}${msg.payload.content.length > 100 ? '...' : ''}`;
  });

  return header + '\n' + messages.join('\n');
}
