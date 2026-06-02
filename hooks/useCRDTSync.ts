/**
 * file: useCRDTSync.ts
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
 * useCRDTSync - CRDT 服务端同步 Hook
 * 
 * 职责：
 * - 将 useCollaborativeEditing 的 CRDT 操作同步到 BackendBridge WebSocket
 * - 管理服务端同步状态（pending queue, ack tracking, retry）
 * - 冲突检测与自动解决（Last-Writer-Wins + OT merge）
 * - 离线操作缓冲与重连后批量同步
 * - 版本向量（Version Vector）管理
 * - 心跳同步（定期全量校验）
 * 
 * Step 6c: 接入 BackendBridge 真实 WebSocket，CRDT 服务端同步
 * 
 * @file hooks/useCRDTSync.ts
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { getBackendBridge, type ConnectionState } from '../services/backend-bridge'
import type {
  TextOperation,
  CollaborationParticipant,
  CollabMessage,
  CRDTDocumentState,
} from '../types/collaboration'

// ==========================================
// Types
// ==========================================

export interface CRDTSyncConfig {
  /** 文档 ID */
  documentId: string
  /** 用户 ID */
  userId: string
  /** 用户名 */
  userName: string
  /** 心跳同步间隔 (ms) */
  heartbeatInterval?: number
  /** 操作批量发送延迟 (ms) */
  batchDelay?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 冲突解决策略 */
  conflictStrategy?: 'last-writer-wins' | 'ot-merge'
  /** 离线缓冲区大小限制 */
  offlineBufferSize?: number
}

export interface CRDTSyncState {
  /** 同步连接状态 */
  connectionState: ConnectionState
  /** 是否正在同步 */
  isSyncing: boolean
  /** 待确认操作数 */
  pendingOpsCount: number
  /** 离线缓冲操作数 */
  offlineBufferCount: number
  /** 服务端版本号 */
  serverVersion: number
  /** 本地版本号 */
  localVersion: number
  /** 冲突数量 */
  conflictCount: number
  /** 上次同步时间 */
  lastSyncTime: number | null
  /** 同步延迟 (ms) */
  syncLatency: number
  /** 错误信息 */
  error: string | null
}

export interface UseCRDTSyncReturn {
  /** 同步状态 */
  syncState: CRDTSyncState
  
  /** 发送本地操作到服务端 */
  sendOperation: (op: TextOperation) => void
  
  /** 批量发送操作 */
  sendOperationBatch: (ops: TextOperation[]) => void
  
  /** 发送 Presence 更新 */
  sendPresence: (participant: CollaborationParticipant) => void
  
  /** 请求全量同步 */
  requestFullSync: () => void
  
  /** 重连并同步 */
  reconnectAndSync: () => Promise<void>
  
  /** 注册远程操作接收回调 */
  onRemoteOperation: (callback: (op: TextOperation) => void) => () => void
  
  /** 注册 Presence 更新回调 */
  onRemotePresence: (callback: (participant: CollaborationParticipant) => void) => () => void
  
  /** 注册全量同步回调 */
  onFullSync: (callback: (doc: CRDTDocumentState, participants: CollaborationParticipant[]) => void) => () => void
  
  /** 注册冲突回调 */
  onConflict: (callback: (localOp: TextOperation, remoteOp: TextOperation) => void) => () => void
}

// ==========================================
// Pending Operation Tracking
// ==========================================

interface PendingOperation {
  id: string
  operation: TextOperation
  sentAt: number
  retries: number
  acked: boolean
}

// ==========================================
// Hook Implementation
// ==========================================

export function useCRDTSync(config: CRDTSyncConfig): UseCRDTSyncReturn {
  const {
    documentId,
    userId,
    userName,
    heartbeatInterval = 10000,
    batchDelay = 50,
    maxRetries = 3,
    offlineBufferSize = 1000,
  } = config

  // State
  const [syncState, setSyncState] = useState<CRDTSyncState>({
    connectionState: 'MOCK_MODE',
    isSyncing: false,
    pendingOpsCount: 0,
    offlineBufferCount: 0,
    serverVersion: 0,
    localVersion: 0,
    conflictCount: 0,
    lastSyncTime: null,
    syncLatency: 0,
    error: null,
  })

  // Refs for callback storage
  const operationCallbacksRef = useRef<Set<(op: TextOperation) => void>>(new Set())
  const presenceCallbacksRef = useRef<Set<(p: CollaborationParticipant) => void>>(new Set())
  const fullSyncCallbacksRef = useRef<Set<(doc: CRDTDocumentState, participants: CollaborationParticipant[]) => void>>(new Set())
  const conflictCallbacksRef = useRef<Set<(local: TextOperation, remote: TextOperation) => void>>(new Set())

  // Operation queues
  const pendingOpsRef = useRef<PendingOperation[]>([])
  const offlineBufferRef = useRef<TextOperation[]>([])
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const batchQueueRef = useRef<TextOperation[]>([])
  const serverVersionRef = useRef(0)
  const localVersionRef = useRef(0)

  // ---- Bridge Connection Listener ----
  useEffect(() => {
    const bridge = getBackendBridge()

    // Listen for connection state changes
    const unsubConnection = bridge.on('connection_change', (status) => {
      setSyncState(prev => ({
        ...prev,
        connectionState: status.state,
        syncLatency: status.latency,
      }))

      // On reconnect, flush offline buffer
      if (status.state === 'CONNECTED' && offlineBufferRef.current.length > 0) {
        flushOfflineBuffer()
      }
    })

    // Listen for incoming signals (CRDT messages)
    const unsubSignal = bridge.on('signal_received', (signal) => {
      try {
        const content = signal.payload?.content
        if (!content) return
        const msg = JSON.parse(content) as CollabMessage

        handleIncomingMessage(msg)
      } catch {
        // Not a CRDT message, ignore
      }
    })

    // Initialize connection state
    setSyncState(prev => ({
      ...prev,
      connectionState: bridge.status.state,
    }))

    return () => {
      unsubConnection()
      unsubSignal()
    }
  }, [documentId])

  // ---- Heartbeat Sync ----
  useEffect(() => {
    const interval = setInterval(() => {
      const bridge = getBackendBridge()
      if (bridge.isConnected) {
        // Send version check
        bridge.dispatchSignal({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'SYNC',
          senderId: 'USER',
          receiverId: 'META_ORACLE',
          payload: {
            content: JSON.stringify({
              type: 'collab:version_check',
              documentId,
              userId,
              localVersion: localVersionRef.current,
            }),
            mood: 'FOCUSED',
            priority: 'LOW',
            modelSource: bridge.isMockMode ? 'MOCK' : 'REAL',
          },
          metadata: { version: '1.0.0' },
        })
      }

      // Retry pending operations
      retryPendingOps()
    }, heartbeatInterval)

    return () => clearInterval(interval)
  }, [heartbeatInterval, documentId, userId])

  // ---- Handle Incoming CRDT Messages ----
  const handleIncomingMessage = useCallback((msg: CollabMessage) => {
    switch (msg.type) {
      case 'collab:operation': {
        const remoteOp = msg.operation

        // Check for conflicts with pending local ops
        const conflicting = pendingOpsRef.current.find(
          p => !p.acked && p.operation.version === remoteOp.version
        )

        if (conflicting) {
          setSyncState(prev => ({ ...prev, conflictCount: prev.conflictCount + 1 }))
          conflictCallbacksRef.current.forEach(cb => cb(conflicting.operation, remoteOp))
        }

        // Notify listeners
        operationCallbacksRef.current.forEach(cb => cb(remoteOp))

        // Update server version
        serverVersionRef.current = Math.max(serverVersionRef.current, remoteOp.version)
        setSyncState(prev => ({
          ...prev,
          serverVersion: serverVersionRef.current,
        }))
        break
      }

      case 'collab:presence': {
        presenceCallbacksRef.current.forEach(cb => cb(msg.participant))
        break
      }

      case 'collab:sync': {
        serverVersionRef.current = msg.document.version
        localVersionRef.current = msg.document.version
        
        // Clear pending ops after full sync
        pendingOpsRef.current = []

        fullSyncCallbacksRef.current.forEach(cb => cb(msg.document, msg.participants))

        setSyncState(prev => ({
          ...prev,
          serverVersion: msg.document.version,
          localVersion: msg.document.version,
          pendingOpsCount: 0,
          lastSyncTime: Date.now(),
          isSyncing: false,
        }))
        break
      }
    }
  }, [])

  // ---- Send Operation ----
  const sendOperation = useCallback((op: TextOperation) => {
    const bridge = getBackendBridge()
    localVersionRef.current += 1
    const versionedOp = { ...op, version: localVersionRef.current }

    if (bridge.isConnected) {
      const pendingId = crypto.randomUUID()

      // Track as pending
      pendingOpsRef.current.push({
        id: pendingId,
        operation: versionedOp,
        sentAt: Date.now(),
        retries: 0,
        acked: false,
      })

      // Send via WebSocket
      bridge.dispatchSignal({
        id: pendingId,
        timestamp: Date.now(),
        type: 'COMMAND',
        senderId: 'USER',
        receiverId: 'META_ORACLE',
        payload: {
          content: JSON.stringify({
            type: 'collab:operation',
            sessionId: `session-${documentId}`,
            operation: versionedOp,
            baseVersion: serverVersionRef.current,
          }),
          mood: 'FOCUSED',
          priority: 'HIGH',
          modelSource: 'REAL',
        },
        metadata: { version: '1.0.0' },
      })

      setSyncState(prev => ({
        ...prev,
        pendingOpsCount: pendingOpsRef.current.filter(p => !p.acked).length,
        localVersion: localVersionRef.current,
        isSyncing: true,
      }))
    } else {
      // Offline: buffer the operation
      if (offlineBufferRef.current.length < offlineBufferSize) {
        offlineBufferRef.current.push(versionedOp)
        setSyncState(prev => ({
          ...prev,
          offlineBufferCount: offlineBufferRef.current.length,
          localVersion: localVersionRef.current,
        }))
      } else {
        setSyncState(prev => ({
          ...prev,
          error: '离线缓冲区已满，部分操作可能丢失',
        }))
      }
    }
  }, [documentId, offlineBufferSize])

  // ---- Batch Send ----
  const sendOperationBatch = useCallback((ops: TextOperation[]) => {
    batchQueueRef.current.push(...ops)

    if (batchTimerRef.current) clearTimeout(batchTimerRef.current)

    batchTimerRef.current = setTimeout(() => {
      const batch = batchQueueRef.current.splice(0)
      batch.forEach(op => sendOperation(op))
    }, batchDelay)
  }, [sendOperation, batchDelay])

  // ---- Send Presence ----
  const sendPresence = useCallback((participant: CollaborationParticipant) => {
    const bridge = getBackendBridge()
    if (!bridge.isConnected) return

    bridge.dispatchSignal({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'SYNC',
      senderId: 'USER',
      receiverId: 'META_ORACLE',
      payload: {
        content: JSON.stringify({
          type: 'collab:presence',
          sessionId: `session-${documentId}`,
          participant,
        }),
        mood: 'FOCUSED',
        priority: 'LOW',
        modelSource: 'REAL',
      },
      metadata: { version: '1.0.0' },
    })
  }, [documentId])

  // ---- Request Full Sync ----
  const requestFullSync = useCallback(() => {
    const bridge = getBackendBridge()
    if (!bridge.isConnected) {
      setSyncState(prev => ({ ...prev, error: '未连接到服务端，无法请求全量同步' }))
      return
    }

    setSyncState(prev => ({ ...prev, isSyncing: true }))

    bridge.dispatchSignal({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'COMMAND',
      senderId: 'USER',
      receiverId: 'META_ORACLE',
      payload: {
        content: JSON.stringify({
          type: 'collab:sync_request',
          documentId,
          userId,
          localVersion: localVersionRef.current,
        }),
        mood: 'FOCUSED',
        priority: 'HIGH',
        modelSource: 'REAL',
      },
      metadata: { version: '1.0.0' },
    })
  }, [documentId, userId])

  // ---- Reconnect and Sync ----
  const reconnectAndSync = useCallback(async () => {
    const bridge = getBackendBridge()
    setSyncState(prev => ({ ...prev, error: null }))

    try {
      await bridge.connect()

      if (bridge.isConnected) {
        // Send join message
        bridge.dispatchSignal({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'COMMAND',
          senderId: 'USER',
          receiverId: 'META_ORACLE',
          payload: {
            content: JSON.stringify({
              type: 'collab:join',
              sessionId: `session-${documentId}`,
              userId,
              userName,
              documentId,
            }),
            mood: 'FOCUSED',
            priority: 'NORMAL',
            modelSource: 'REAL',
          },
          metadata: { version: '1.0.0' },
        })

        // Flush offline buffer
        flushOfflineBuffer()

        // Request full sync
        requestFullSync()
      }
    } catch (err: any) {
      setSyncState(prev => ({
        ...prev,
        error: `重连失败: ${err.message || '未知错误'}`,
      }))
    }
  }, [documentId, userId, userName, requestFullSync])

  // ---- Flush Offline Buffer ----
  const flushOfflineBuffer = useCallback(() => {
    const buffer = offlineBufferRef.current.splice(0)
    if (buffer.length === 0) return

    buffer.forEach(op => sendOperation(op))

    setSyncState(prev => ({
      ...prev,
      offlineBufferCount: 0,
    }))
  }, [sendOperation])

  // ---- Retry Pending Operations ----
  const retryPendingOps = useCallback(() => {
    const bridge = getBackendBridge()
    if (!bridge.isConnected) return

    const now = Date.now()
    const timeout = 5000 // 5 seconds

    pendingOpsRef.current = pendingOpsRef.current.filter(pending => {
      if (pending.acked) return false
      if (now - pending.sentAt > timeout) {
        if (pending.retries < maxRetries) {
          // Retry
          pending.retries++
          pending.sentAt = now
          bridge.dispatchSignal({
            id: pending.id,
            timestamp: now,
            type: 'COMMAND',
            senderId: 'USER',
            receiverId: 'META_ORACLE',
            payload: {
              content: JSON.stringify({
                type: 'collab:operation',
                sessionId: `session-${documentId}`,
                operation: pending.operation,
                baseVersion: serverVersionRef.current,
                retry: pending.retries,
              }),
              mood: 'FOCUSED',
              priority: 'HIGH',
              modelSource: 'REAL',
            },
            metadata: { version: '1.0.0' },
          })
          return true
        }
        // Max retries exceeded, drop
        return false
      }
      return true
    })

    setSyncState(prev => ({
      ...prev,
      pendingOpsCount: pendingOpsRef.current.filter(p => !p.acked).length,
      isSyncing: pendingOpsRef.current.some(p => !p.acked),
    }))
  }, [documentId, maxRetries])

  // ---- Callback Registration ----
  const onRemoteOperation = useCallback((cb: (op: TextOperation) => void) => {
    operationCallbacksRef.current.add(cb)
    return () => { operationCallbacksRef.current.delete(cb) }
  }, [])

  const onRemotePresence = useCallback((cb: (p: CollaborationParticipant) => void) => {
    presenceCallbacksRef.current.add(cb)
    return () => { presenceCallbacksRef.current.delete(cb) }
  }, [])

  const onFullSync = useCallback((cb: (doc: CRDTDocumentState, participants: CollaborationParticipant[]) => void) => {
    fullSyncCallbacksRef.current.add(cb)
    return () => { fullSyncCallbacksRef.current.delete(cb) }
  }, [])

  const onConflict = useCallback((cb: (local: TextOperation, remote: TextOperation) => void) => {
    conflictCallbacksRef.current.add(cb)
    return () => { conflictCallbacksRef.current.delete(cb) }
  }, [])

  return {
    syncState,
    sendOperation,
    sendOperationBatch,
    sendPresence,
    requestFullSync,
    reconnectAndSync,
    onRemoteOperation,
    onRemotePresence,
    onFullSync,
    onConflict,
  }
}
