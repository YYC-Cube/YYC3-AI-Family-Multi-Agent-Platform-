/**
 * file: protocol.ts
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

import { RoleId, FamilyMood } from './family-manifest';

// ==========================================
// RAG Context Types (Knowledge Base)
// CANONICAL SOURCE - Single source of truth for RAG types
// ==========================================
export interface RAGContextItem {
  source: string;
  section?: string;
  content: string;
  similarity: number;
  chunkIndex: number;
  totalChunks: number;
}

// ==========================================
// Communication Log Message Types
// CANONICAL SOURCE - Single source of truth for LogMessage
// ==========================================
export interface LogMessage {
  id: string;
  senderId: RoleId | 'USER';
  content: string;
  timestamp: number;
  type: 'THOUGHT' | 'RESPONSE';
  isPeerDialogue?: boolean;
  modelSource?: 'REAL' | 'MOCK';
  /** RAG knowledge context injected from KB search */
  ragContext?: RAGContextItem[];
}

// ==========================================
// 📡 YYC³ FAMILY COMMUNICATION PROTOCOL v1.0
// ==========================================

/**
 * SignalType definition:
 * - COMMAND: User to Member (Direct Instruction)
 * - THOUGHT: Member internal processing (Monologue)
 * - RESPONSE: Member to User (Reply)
 * - HEARTBEAT: System status update (Background)
 * - SYNC: Data synchronization between members
 * - ALERT: High priority security/error signal
 * - PEER_DIALOGUE: Peer-to-peer communication between members
 */
export type SignalType = 'COMMAND' | 'THOUGHT' | 'RESPONSE' | 'HEARTBEAT' | 'SYNC' | 'ALERT' | 'PEER_DIALOGUE';

/**
 * The Standard Atom of Communication
 * All family members must speak this language.
 */
export interface FamilySignal {
  id: string;              // Unique Signal ID (UUID)
  timestamp: number;       // Unix Timestamp
  type: SignalType;        // The intent of the signal
  
  senderId: RoleId | 'USER' | 'SYSTEM';
  receiverId: RoleId | 'ALL' | 'USER';
  
  payload: {
    content: string;       // Human readable text
    data?: unknown;        // Structured data (optional, strictly typed in implementation)
    mood?: FamilyMood;     // Emotional context
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    // Peer dialogue chain tracking
    dialogueChainId?: string;   // Groups related peer messages
    replyToSignalId?: string;   // Which signal this is replying to
    modelSource?: 'REAL' | 'MOCK';  // Whether response came from real model or simulation
    // RAG knowledge context from KB search
    ragContext?: RAGContextItem[];   // Knowledge base search results attached to response
  };

  metadata: {
    deviceId?: string;     // Which physical device sent this?
    processingTime?: number; // Latency tracking
    version: '1.0.0';
    modelEndpoint?: string;   // Which API endpoint was used
    routingRatio?: string;    // e.g. "1:2" tracking
  };
}

// ==========================================
// UI Action Signals (Frontend-only)
// Dispatched by slash commands to trigger UI state changes
// ==========================================
export type UIActionType = 
  | 'OPEN_5D_MATRIX'
  | 'OPEN_5D_PANEL'
  | 'NAVIGATE_TO_MEMBER'
  | 'OPEN_TOPOLOGY'
  | 'TOGGLE_PEER_MODE'
  | 'OPEN_PHILOSOPHY';

export interface UIAction {
  type: UIActionType;
  payload?: {
    roleId?: RoleId;
    [key: string]: unknown;
  };
  timestamp: number;
}

// ==========================================
// Peer Communication Protocol (同窗沟通)
// ==========================================
export interface PeerDialogueChain {
  id: string;
  originSignalId: string;      // The user command that triggered this chain
  topic: string;               // What the dialogue is about
  participants: RoleId[];      // Which agents are involved
  messages: FamilySignal[];    // Ordered list of peer messages
  status: 'ACTIVE' | 'CONCLUDED' | 'TIMEOUT';
  modelCallCount: number;      // Real model calls used in this chain
  mockCallCount: number;       // Mock responses used
  createdAt: number;
}

// ==========================================
// Agent Model Routing Configuration
// ==========================================
export interface ModelRouteConfig {
  maxRealToMockRatio: [number, number];  // e.g. [1, 2] means 1 real per 2 mock
  defaultModel: string;                   // e.g. "glm-4-plus"
  agentEndpoints: Partial<Record<RoleId, {
    endpoint: string;        // API endpoint URL
    model: string;           // Model name
    provider: string;        // LLM provider: bigmodel | deepseek | ollama | anthropic | openai | qwen
    apiKeyEnvVar: string;    // Environment variable holding the API key
  }>>;
  fallbackBehavior: 'MOCK' | 'QUEUE' | 'SKIP';
}

/**
 * The Nervous System State
 * Represents the "Single Source of Truth" for the family.
 */
export interface FamilySystemState {
  networkStatus: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  pulseCount: number;
  lastSignal?: FamilySignal;
  activeChannels: string[]; // List of active conversation IDs
}