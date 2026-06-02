/**
 * file: useBackendConnection.ts
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
 * YYC³ AI Family - useBackendConnection Hook
 * 
 * Manages the lifecycle of the BackendBridge connection.
 * Provides reactive connection status to all components.
 * 
 * Design Pattern: "Neural Lightning Network" state management
 * - Auto-connects on mount
 * - Exposes connection status, latency, and mode
 * - Supports dynamic reconfiguration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BackendBridge, 
  BackendConfig, 
  ConnectionStatus, 
  ConnectionState,
  DEFAULT_CONFIG,
  getBackendBridge,
  resetBackendBridge
} from '../services/backend-bridge';
import { getApiBaseUrl, getWsBaseUrl, readConfigSnapshot } from '../config/dynamic-reader';

export interface UseBackendConnectionReturn {
  // Status
  status: ConnectionStatus;
  isConnected: boolean;
  isMockMode: boolean;
  connectionLabel: string;
  
  // Bridge instance
  bridge: BackendBridge;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  reconfigure: (config: Partial<BackendConfig>) => void;
  
  // Config
  config: BackendConfig;
}

// Load saved config from localStorage
function loadConfig(): Partial<BackendConfig> {
  try {
    const saved = localStorage.getItem('yyc3_backend_config');
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore localStorage errors - fall back to default config
  }
  
  // 从 DynamicConfig 读取 WS/API 地址
  const snapshot = readConfigSnapshot();
  const net = snapshot?.networkConfig;
  return {
    wsUrl: getWsBaseUrl(),
    apiUrl: getApiBaseUrl(),
    reconnectInterval: net?.reconnectInterval,
    maxReconnectAttempts: net?.maxReconnectAttempts,
    heartbeatInterval: net?.heartbeatInterval,
    connectionTimeout: net?.connectionTimeout,
    agentCallTimeout: net?.agentCallTimeout,
    maxReconnectDelay: net?.maxReconnectDelay,
    backoffMultiplier: net?.backoffMultiplier,
  };
}

function saveConfig(config: Partial<BackendConfig>): void {
  try {
    localStorage.setItem('yyc3_backend_config', JSON.stringify(config));
  } catch {
    // Ignore localStorage errors - config will not persist across sessions
  }
}

const CONNECTION_LABELS: Record<ConnectionState, string> = {
  'DISCONNECTED': '已断开',
  'CONNECTING': '连接中...',
  'CONNECTED': '神经网络已连通',
  'DEGRADED': '连接降级',
  'MOCK_MODE': '模拟模式',
};

export function useBackendConnection(): UseBackendConnectionReturn {
  const savedConfig = loadConfig();
  const [config, setConfig] = useState<BackendConfig>({ ...DEFAULT_CONFIG, ...savedConfig });
  const bridgeRef = useRef<BackendBridge>(getBackendBridge(config));
  const [status, setStatus] = useState<ConnectionStatus>(bridgeRef.current.status);

  // Listen to connection changes
  useEffect(() => {
    const bridge = bridgeRef.current;
    
    const unsubConnection = bridge.on('connection_change', (newStatus) => {
      setStatus({ ...newStatus });
    });

    // Initialize status from bridge (starts in MOCK_MODE)
    setStatus(bridge.status);

    return () => {
      unsubConnection();
    };
  }, []);

  const connect = useCallback(async () => {
    await bridgeRef.current.connect();
  }, []);

  const disconnect = useCallback(() => {
    bridgeRef.current.disconnect();
  }, []);

  const reconfigure = useCallback((newConfig: Partial<BackendConfig>) => {
    const merged = { ...config, ...newConfig };
    setConfig(merged);
    saveConfig(newConfig);
    
    // Reset and reconnect with new config
    resetBackendBridge();
    bridgeRef.current = getBackendBridge(merged);
    
    const bridge = bridgeRef.current;
    const unsub = bridge.on('connection_change', (s) => setStatus({ ...s }));
    bridge.connect();
    
    // Note: the old unsub from useEffect will clean up on unmount
  }, [config]);

  return {
    status,
    isConnected: status.state === 'CONNECTED',
    isMockMode: status.state === 'MOCK_MODE',
    connectionLabel: CONNECTION_LABELS[status.state] || status.state,
    bridge: bridgeRef.current,
    connect,
    disconnect,
    reconfigure,
    config,
  };
}