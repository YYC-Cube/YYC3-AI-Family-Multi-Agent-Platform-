/**
 * file: backend-bridge.ts
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
 * YYC³ AI Family - BackendBridge (灵肉桥梁)
 * 
 * The sacred bridge connecting the anthropomorphic frontend ("Soul")
 * with the Bun Runtime + WebSocket + Redis backend ("Body").
 * 
 * Architecture:
 *   [Frontend Soul] <-> [BackendBridge] <-> [Bun WS:3080 / REST API]
 * 
 * Design: "Neural Lightning Network" (神经闪电网络)
 * - WebSocket for real-time signals (heartbeat, commands, responses)
 * - REST API for CRUD operations (member config, permissions, etc.)
 * - Graceful degradation to mock mode when backend is unreachable
 */

import { RoleId } from '../types/family-manifest';
import { FamilySignal, SignalType } from '../types/protocol';
import { ENDPOINTS } from '../config/endpoints';
import { getApiBaseUrl, getWsBaseUrl, readConfigSnapshot } from '../config/dynamic-reader';
import type { NetworkConfig } from '../types/dynamic-config';

// ==========================================
// Connection Configuration
// FIX-004: 重连参数从 DynamicConfig 读取
// ==========================================
export interface BackendConfig {
  wsUrl: string;          // WebSocket endpoint
  apiUrl: string;         // REST API endpoint
  reconnectInterval: number;  // ms between reconnection attempts
  maxReconnectAttempts: number;
  heartbeatInterval: number;  // ms between heartbeat pings
  connectionTimeout: number;  // ms before connection timeout
  agentCallTimeout: number;   // ms before agent call timeout
  maxReconnectDelay: number;  // ms cap for exponential backoff
  backoffMultiplier: number;  // exponential backoff multiplier
  authToken?: string;         // JWT or session token
}

/**
 * 从 DynamicConfig 构建默认配置
 * 优先链：DynamicConfig → env() → 硬编码 fallback
 * 敏感值（authToken）不从配置读取
 */
function buildDefaultConfig(): BackendConfig {
  const snapshot = readConfigSnapshot();
  const net = snapshot?.networkConfig;

  return {
    wsUrl: getWsBaseUrl(),
    apiUrl: getApiBaseUrl(),
    reconnectInterval: net?.reconnectInterval ?? 3000,
    maxReconnectAttempts: net?.maxReconnectAttempts ?? 10,
    heartbeatInterval: net?.heartbeatInterval ?? 5000,
    connectionTimeout: net?.connectionTimeout ?? 5000,
    agentCallTimeout: net?.agentCallTimeout ?? 15000,
    maxReconnectDelay: net?.maxReconnectDelay ?? 30000,
    backoffMultiplier: net?.backoffMultiplier ?? 1.5,
  };
}

export const DEFAULT_CONFIG: BackendConfig = buildDefaultConfig();

// ==========================================
// Connection States
// ==========================================
export type ConnectionState = 
  | 'DISCONNECTED'   // Not connected
  | 'CONNECTING'     // Attempting connection
  | 'CONNECTED'      // WebSocket open and healthy
  | 'DEGRADED'       // Connected but some services unavailable
  | 'MOCK_MODE';     // Using simulated data (no backend)

export interface ConnectionStatus {
  state: ConnectionState;
  latency: number;           // Round-trip latency in ms
  reconnectAttempts: number;
  lastHeartbeat: number;     // Unix timestamp
  backendVersion?: string;   // Backend service version
  activeMembers: number;     // Number of online AI family members
  wsReadyState: number;      // WebSocket.readyState
  error?: string;
}

// ==========================================
// Backend Message Protocol
// Matches the Bun backend's WebSocket message format
// ==========================================
export interface BackendMessage {
  type: 'signal' | 'heartbeat' | 'member_update' | 'system_event' | 'error' | 'pong' | 'agent_response';
  payload: Record<string, unknown>;
  timestamp: number;
  requestId?: string;
}

export interface BackendCommand {
  type: 'dispatch_signal' | 'update_member' | 'get_members' | 'ping' | 'subscribe' | 'visual_analysis' | 'agent_call';
  payload: FamilySignal | Record<string, unknown>;
  requestId: string;
}

// ==========================================
// Event Types
// ==========================================
type EventCallback = (data: unknown) => void;

export interface MemberUpdateEvent {
  roleId: string;
  updates: Record<string, unknown>;
}

interface EventMap {
  'connection_change': ConnectionStatus;
  'signal_received': FamilySignal;
  'member_update': MemberUpdateEvent;
  'system_event': Record<string, unknown>;
  'error': Error;
  'heartbeat': { latency: number; timestamp: number };
}

// ==========================================
// BackendBridge Class
// ==========================================
export class BackendBridge {
  private config: BackendConfig;
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pingTimestamp: number = 0;
  private reconnectAttempts: number = 0;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private _status: ConnectionStatus;
  private isDestroyed: boolean = false;
  private connectResolve: ((status: ConnectionStatus) => void) | null = null;
  // Pending agent call tracking for request-response correlation
  private pendingAgentCalls: Map<string, {
    resolve: (response: string) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
    roleId: RoleId;
  }> = new Map();

  constructor(config: Partial<BackendConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._status = {
      state: 'MOCK_MODE',
      latency: 0,
      reconnectAttempts: 0,
      lastHeartbeat: 0,
      activeMembers: 0,
      wsReadyState: WebSocket.CLOSED,
    };
  }

  // ---- Public API ----

  get status(): ConnectionStatus {
    return { ...this._status };
  }

  get isConnected(): boolean {
    return this._status.state === 'CONNECTED';
  }

  get isMockMode(): boolean {
    return this._status.state === 'MOCK_MODE';
  }

  /**
   * Connect to the backend WebSocket server.
   * If connection fails, enters MOCK_MODE for graceful degradation.
   */
  async connect(): Promise<ConnectionStatus> {
    if (this.isDestroyed) return this._status;
    
    // Guard: already connected or connecting
    if (this._status.state === 'CONNECTED' || (this._status.state === 'CONNECTING' && this.ws)) {
      return this._status;
    }
    
    this.updateStatus({ state: 'CONNECTING', error: undefined });

    return new Promise((resolve) => {
      this.connectResolve = resolve;
      
      try {
        this.ws = new WebSocket(this.config.wsUrl);

        // Connection timeout - if no response in 5s, go to mock mode
        const timeout = setTimeout(() => {
          if (this._status.state === 'CONNECTING') {
            console.warn('[BackendBridge] Connection timeout. Entering MOCK_MODE.');
            this.enterMockMode();
            this.resolveConnect();
          }
        }, this.config.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.reconnectAttempts = 0;
          this.updateStatus({ 
            state: 'CONNECTED', 
            reconnectAttempts: 0,
            wsReadyState: WebSocket.OPEN 
          });
          this.startHeartbeat();
          
          // Subscribe to family channel
          this.send({
            type: 'subscribe',
            payload: { channel: 'family_signals' },
            requestId: crypto.randomUUID(),
          });

          console.log('[BackendBridge] Connected to backend.');
          this.resolveConnect();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg: BackendMessage = JSON.parse(event.data);
            this.handleMessage(msg);
          } catch (e) {
            console.error('[BackendBridge] Failed to parse message:', e);
          }
        };

        this.ws.onerror = () => {
          clearTimeout(timeout);
          // WebSocket errors are expected when backend is not running - keep it quiet
          if (this.reconnectAttempts === 0) {
            console.info('[BackendBridge] Backend unreachable at', this.config.wsUrl);
          }
          this.updateStatus({ error: 'WebSocket connection error' });
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          this.stopHeartbeat();
          
          if (!this.isDestroyed) {
            if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
              this.scheduleReconnect();
            } else {
              console.info('[BackendBridge] Max reconnect attempts reached. Entering MOCK_MODE.');
              this.enterMockMode();
              this.resolveConnect();
            }
          }
          
          this.updateStatus({ wsReadyState: WebSocket.CLOSED });
        };

      } catch (err) {
        console.info('[BackendBridge] Cannot create WebSocket. Entering MOCK_MODE.');
        this.enterMockMode();
        this.resolveConnect();
      }
    });
  }

  /**
   * Disconnect from backend and clean up resources.
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on manual close
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.isDestroyed = false; // Allow reconnection after manual disconnect
    this.resolveConnect(); // Resolve any pending connect promise
    this.updateStatus({ state: 'MOCK_MODE', wsReadyState: WebSocket.CLOSED, latency: 0, error: undefined });
  }

  /**
   * Fully destroy the bridge. Cannot reconnect after this.
   */
  destroy(): void {
    this.isDestroyed = true;
    // [AUDIT Stage 2] Clear all pending agent calls and their timeouts
    for (const [requestId, pending] of this.pendingAgentCalls) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Bridge destroyed'));
    }
    this.pendingAgentCalls.clear();
    this.disconnect();
    this.updateStatus({ state: 'DISCONNECTED', wsReadyState: WebSocket.CLOSED });
    this.listeners.clear();
  }

  /**
   * Dispatch a family signal through the WebSocket to the backend.
   * Falls back to local simulation in MOCK_MODE.
   */
  async dispatchSignal(signal: FamilySignal): Promise<FamilySignal | null> {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      const requestId = crypto.randomUUID();
      this.send({
        type: 'dispatch_signal',
        payload: signal,
        requestId,
      });
      return signal; // Backend will echo back processed signal
    }
    
    // MOCK_MODE: return null to let the hook handle simulation
    return null;
  }

  /**
   * Update a family member's configuration through the backend.
   */
  async updateMember(roleId: RoleId, updates: Record<string, unknown>): Promise<boolean> {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        type: 'update_member',
        payload: { roleId, updates },
        requestId: crypto.randomUUID(),
      });
      return true;
    }

    // Try REST fallback
    try {
      const res = await fetch(`${this.config.apiUrl}/api/family/members/${roleId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(this.config.authToken ? { 'Authorization': `Bearer ${this.config.authToken}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false; // Backend unreachable, local update only
    }
  }

  /**
   * Fetch all family members from the backend REST API.
   */
  async fetchMembers(): Promise<unknown[] | null> {
    try {
      const res = await fetch(`${this.config.apiUrl}/api/family/members`, {
        headers: this.config.authToken 
          ? { 'Authorization': `Bearer ${this.config.authToken}` } 
          : {},
      });
      if (res.ok) {
        const data = await res.json() as { members?: unknown[] } | unknown[];
        return Array.isArray(data) ? data : (data as { members?: unknown[] }).members || [];
      }
    } catch {
      // Backend unreachable
    }
    return null;
  }

  /**
   * Fetch system health from backend.
   */
  async fetchHealth(): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(`${this.config.apiUrl}/api/health`, { 
        signal: AbortSignal.timeout(3000) 
      });
      if (res.ok) return await res.json() as Record<string, unknown>;
    } catch {
      // Backend unreachable
    }
    return null;
  }

  /**
   * Route an agent call through the backend (1:2 model ratio enforcement).
   * The backend Bun server proxies to the actual model API endpoint.
   * Returns the model response text, or null if backend unavailable.
   * 
   * Protocol:
   *   Frontend → { type: 'agent_call', payload: { roleId, prompt, context, endpoint, model }, requestId }
   *   Backend  → { type: 'agent_response', payload: { content, roleId, model, latency }, requestId }
   */
  async routeAgentCall(
    roleId: RoleId,
    prompt: string,
    context: {
      dialogueChainId?: string;
      previousResponses?: { roleId: string; content: string }[];
      systemPrompt?: string;
    },
    agentEndpoint?: { endpoint: string; model: string; provider?: string }
  ): Promise<{ content: string; latency: number; model: string } | null> {
    if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) {
      return null;
    }

    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      // Set timeout for agent response (15s max)
      const timeout = setTimeout(() => {
        this.pendingAgentCalls.delete(requestId);
        resolve(null); // Timeout → fall back to mock
      }, this.config.agentCallTimeout);

      this.pendingAgentCalls.set(requestId, {
        resolve: (content: string) => {
          clearTimeout(timeout);
          this.pendingAgentCalls.delete(requestId);
          resolve({
            content,
            latency: Date.now() - startTime,
            model: agentEndpoint?.model || 'unknown',
          });
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          this.pendingAgentCalls.delete(requestId);
          resolve(null); // Error → fall back to mock
        },
        timeout,
        roleId,
      });

      this.send({
        type: 'agent_call',
        payload: {
          roleId,
          prompt,
          context,
          endpoint: agentEndpoint?.endpoint,
          model: agentEndpoint?.model,
          provider: agentEndpoint?.provider,
        },
        requestId,
      });
    });
  }

  // ---- Event System ----

  on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback as EventCallback);
    };
  }

  private emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    this.listeners.get(event)?.forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error(`[BackendBridge] Error in ${event} listener:`, e);
      }
    });
  }

  // ---- Internal Methods ----

  private send(command: BackendCommand): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    }
  }

  private handleMessage(msg: BackendMessage): void {
    switch (msg.type) {
      case 'pong':
        const latency = Date.now() - this.pingTimestamp;
        this.updateStatus({ latency, lastHeartbeat: Date.now() });
        this.emit('heartbeat', { latency, timestamp: Date.now() });
        break;

      case 'signal':
        this.emit('signal_received', msg.payload as unknown as FamilySignal);
        break;

      case 'agent_response':
        // Correlate with pending agent call by requestId
        if (msg.requestId && this.pendingAgentCalls.has(msg.requestId)) {
          const pending = this.pendingAgentCalls.get(msg.requestId)!;
          const payload = msg.payload as { error?: string; content?: string };
          if (payload.error) {
            pending.reject(new Error(payload.error));
          } else {
            pending.resolve(payload.content || '');
          }
        }
        break;

      case 'member_update':
        this.emit('member_update', msg.payload as unknown as MemberUpdateEvent);
        break;

      case 'system_event':
        this.emit('system_event', msg.payload);
        break;

      case 'error':
        const errorPayload = msg.payload as { message?: string };
        this.emit('error', new Error(errorPayload.message || 'Backend error'));
        break;

      default:
        console.log('[BackendBridge] Unknown message type:', msg.type);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.pingTimestamp = Date.now();
        this.send({
          type: 'ping',
          payload: { timestamp: this.pingTimestamp },
          requestId: crypto.randomUUID(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(this.config.backoffMultiplier, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );
    
    this.updateStatus({ 
      state: 'CONNECTING', 
      reconnectAttempts: this.reconnectAttempts 
    });
    
    if (this.reconnectAttempts <= 3) {
      console.log(`[BackendBridge] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    }
    
    this.reconnectTimer = setTimeout(() => {
      if (this.isDestroyed) return;
      // For reconnects, don't create a new promise - just try to connect directly
      this.attemptReconnect();
    }, delay);
  }

  private attemptReconnect(): void {
    if (this.isDestroyed) return;
    
    try {
      this.ws = new WebSocket(this.config.wsUrl);

      const timeout = setTimeout(() => {
        if (this._status.state === 'CONNECTING') {
          this.enterMockMode();
          this.resolveConnect();
        }
      }, this.config.connectionTimeout);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.reconnectAttempts = 0;
        this.updateStatus({ 
          state: 'CONNECTED', 
          reconnectAttempts: 0,
          wsReadyState: WebSocket.OPEN,
          error: undefined
        });
        this.startHeartbeat();
        
        this.send({
          type: 'subscribe',
          payload: { channel: 'family_signals' },
          requestId: crypto.randomUUID(),
        });

        console.log('[BackendBridge] Reconnected to backend.');
        this.resolveConnect();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: BackendMessage = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('[BackendBridge] Failed to parse message:', e);
        }
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        this.updateStatus({ error: 'WebSocket connection error' });
      };

      this.ws.onclose = () => {
        clearTimeout(timeout);
        this.stopHeartbeat();
        
        if (!this.isDestroyed) {
          if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            console.info('[BackendBridge] Max reconnect attempts. Entering MOCK_MODE.');
            this.enterMockMode();
            this.resolveConnect();
          }
        }
        
        this.updateStatus({ wsReadyState: WebSocket.CLOSED });
      };
    } catch {
      this.enterMockMode();
      this.resolveConnect();
    }
  }

  private resolveConnect(): void {
    if (this.connectResolve) {
      this.connectResolve(this._status);
      this.connectResolve = null;
    }
  }

  private enterMockMode(): void {
    this.updateStatus({ state: 'MOCK_MODE', latency: 0 });
    console.log('[BackendBridge] Running in MOCK_MODE. All operations will use local simulation.');
  }

  private updateStatus(partial: Partial<ConnectionStatus>): void {
    this._status = { ...this._status, ...partial };
    this.emit('connection_change', this._status);
  }
}

// ==========================================
// Singleton Instance
// ==========================================
let _instance: BackendBridge | null = null;

export function getBackendBridge(config?: Partial<BackendConfig>): BackendBridge {
  if (!_instance) {
    _instance = new BackendBridge(config);
  }
  return _instance;
}

export function resetBackendBridge(): void {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}