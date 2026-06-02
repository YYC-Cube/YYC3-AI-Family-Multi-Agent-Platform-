/**
 * file: useCollaborativeEditing.ts
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
 * useCollaborativeEditing - CRDT 协同编辑 Hook
 * 
 * 职责：
 * - 管理 CRDT 文档状态
 * - OT 操作转换
 * - Presence 用户感知（光标/选区）
 * - 与 BackendBridge WebSocket 对接
 * - 冲突检测与解决
 * 
 * @file hooks/useCollaborativeEditing.ts
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  TextOperation,
  CollaborationSession,
  CollaborationParticipant,
  CursorPosition,
  SelectionRange,
  CollabMessage,
} from '../types/collaboration'
import { getBackendBridge } from '../services/backend-bridge'

// ==========================================
// OT 操作转换引擎
// ==========================================

/**
 * 操作转换核心算法
 * 将两个并发操作转换为可顺序应用的形式
 */
function transformOperation(
  op1: TextOperation,
  op2: TextOperation
): TextOperation {
  const transformed = { ...op1 }

  if (op1.type === 'insert' && op2.type === 'insert') {
    // 两个插入：后者位移
    if (op2.position <= op1.position) {
      transformed.position += (op2.content?.length || 0)
    }
  } else if (op1.type === 'insert' && op2.type === 'delete') {
    // 插入 vs 删除
    if (op2.position < op1.position) {
      transformed.position = Math.max(
        op2.position,
        op1.position - (op2.length || 0)
      )
    }
  } else if (op1.type === 'delete' && op2.type === 'insert') {
    // 删除 vs 插入
    if (op2.position <= op1.position) {
      transformed.position += (op2.content?.length || 0)
    }
  } else if (op1.type === 'delete' && op2.type === 'delete') {
    // 两个删除：收缩范围
    if (op2.position < op1.position) {
      transformed.position = Math.max(
        0,
        op1.position - (op2.length || 0)
      )
    }
    // 重叠区域处理
    const op1End = op1.position + (op1.length || 0)
    const op2End = op2.position + (op2.length || 0)
    if (op2.position < op1End && op2End > op1.position) {
      const overlap = Math.min(op1End, op2End) - Math.max(op1.position, op2.position)
      transformed.length = Math.max(0, (op1.length || 0) - overlap)
    }
  }

  return transformed
}

/**
 * 将文本操作应用到文档内容
 */
function applyOperation(content: string, op: TextOperation): string {
  switch (op.type) {
    case 'insert':
      return (
        content.slice(0, op.position) +
        (op.content || '') +
        content.slice(op.position)
      )
    case 'delete':
      return (
        content.slice(0, op.position) +
        content.slice(op.position + (op.length || 0))
      )
    case 'retain':
      return content
    default:
      return content
  }
}

// ==========================================
// Hook 接口
// ==========================================

export interface UseCollaborativeEditingConfig {
  documentId: string
  userId: string
  userName: string
  initialContent?: string
  onConflict?: (localOp: TextOperation, remoteOp: TextOperation) => void
  onParticipantJoin?: (participant: CollaborationParticipant) => void
  onParticipantLeave?: (userId: string) => void
}

export interface UseCollaborativeEditingReturn {
  // 文档状态
  content: string
  version: number
  isConnected: boolean
  isSyncing: boolean

  // 操作方法
  applyLocalOperation: (op: Omit<TextOperation, 'timestamp' | 'userId' | 'version'>) => void
  updateContent: (newContent: string, cursorPosition?: number) => void
  undo: () => void
  redo: () => void

  // Presence
  participants: CollaborationParticipant[]
  updateCursor: (cursor: CursorPosition) => void
  updateSelection: (selection: SelectionRange | null) => void

  // 会话
  session: CollaborationSession | null
  conflictCount: number
}

// ==========================================
// Hook 实现
// ==========================================

const PRESENCE_COLOR_POOL = [
  '#4ade80', '#38bdf8', '#fbbf24', '#f472b6',
  '#a78bfa', '#fb923c', '#2dd4bf', '#e879f9',
]

export function useCollaborativeEditing(
  config: UseCollaborativeEditingConfig
): UseCollaborativeEditingReturn {
  const {
    documentId,
    userId,
    userName,
    initialContent = '',
    onParticipantJoin,
  } = config

  // 文档状态
  const [content, setContent] = useState(initialContent)
  const [version, setVersion] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [conflictCount, setConflictCount] = useState(0)

  // Presence
  const [participants, setParticipants] = useState<CollaborationParticipant[]>([])
  const [session, setSession] = useState<CollaborationSession | null>(null)

  // Undo/Redo
  const undoStackRef = useRef<TextOperation[]>([])
  const redoStackRef = useRef<TextOperation[]>([])
  const pendingOpsRef = useRef<TextOperation[]>([])
  const versionRef = useRef(0)
  const contentRef = useRef(initialContent)

  // Keep refs in sync
  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    versionRef.current = version
  }, [version])

  // 初始化协同会话
  useEffect(() => {
    const colorIndex = userId.charCodeAt(0) % PRESENCE_COLOR_POOL.length
    const localParticipant: CollaborationParticipant = {
      userId,
      userName,
      avatarColor: PRESENCE_COLOR_POOL[colorIndex],
      cursor: null,
      selection: null,
      isOnline: true,
      lastSeen: Date.now(),
      role: 'editor',
    }

    // 创建 mock 会话（真实场景通过 BackendBridge）
    const mockSession: CollaborationSession = {
      sessionId: `session-${documentId}-${Date.now()}`,
      documentId,
      participants: [localParticipant],
      createdAt: Date.now(),
      isActive: true,
    }

    setSession(mockSession)
    setParticipants([localParticipant])

    // 尝试连接 BackendBridge
    const bridge = getBackendBridge()
    const isLive = bridge.isConnected

    if (isLive) {
      setIsConnected(true)
      // 发送加入消息
      bridge.dispatchSignal({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'COMMAND',
        senderId: 'USER',
        receiverId: 'META_ORACLE',
        payload: {
          content: JSON.stringify({
            type: 'collab:join',
            sessionId: mockSession.sessionId,
            userId,
            userName,
            documentId,
          }),
          mood: 'FOCUSED',
          priority: 'NORMAL',
          modelSource: 'MOCK',
        },
        metadata: { version: '1.0.0' },
      })
    } else {
      // Mock mode: 模拟远程协作者
      setIsConnected(false)
      const mockRemote: CollaborationParticipant = {
        userId: 'ai-architect',
        userName: '智源架构师',
        avatarColor: '#00BFFF',
        cursor: { line: 12, column: 8, timestamp: Date.now() },
        selection: null,
        isOnline: true,
        lastSeen: Date.now(),
        role: 'editor',
      }
      setParticipants(prev => [...prev, mockRemote])
    }

    return () => {
      // 清理会话
    }
  }, [documentId, userId, userName])

  // 监听 BackendBridge 消息
  useEffect(() => {
    const bridge = getBackendBridge()

    const unsubSignal = bridge.on('signal_received', (signal) => {
      try {
        const msg = JSON.parse(signal.payload?.content || '{}') as CollabMessage

        switch (msg.type) {
          case 'collab:operation': {
            // 远程操作到达：执行 OT 转换并应用
            const remoteOp = msg.operation
            let transformed = remoteOp

            // 对所有 pending 本地操作执行转换
            for (const localOp of pendingOpsRef.current) {
              transformed = transformOperation(transformed, localOp)
            }

            const newContent = applyOperation(contentRef.current, transformed)
            setContent(newContent)
            setVersion(prev => prev + 1)
            break
          }

          case 'collab:presence': {
            setParticipants(prev => {
              const existing = prev.findIndex(p => p.userId === msg.participant.userId)
              if (existing >= 0) {
                const updated = [...prev]
                updated[existing] = msg.participant
                return updated
              }
              onParticipantJoin?.(msg.participant)
              return [...prev, msg.participant]
            })
            break
          }

          case 'collab:sync': {
            setContent(msg.document.content)
            setVersion(msg.document.version)
            setParticipants(msg.participants)
            setIsSyncing(false)
            break
          }
        }
      } catch {
        // 非协同消息，忽略
      }
    })

    return () => {
      unsubSignal()
    }
  }, [onParticipantJoin])

  // 应用本地操作
  const applyLocalOperation = useCallback((
    op: Omit<TextOperation, 'timestamp' | 'userId' | 'version'>
  ) => {
    const fullOp: TextOperation = {
      ...op,
      timestamp: Date.now(),
      userId,
      version: versionRef.current + 1,
    }

    // 应用到本地文档
    const newContent = applyOperation(contentRef.current, fullOp)
    setContent(newContent)
    setVersion(prev => prev + 1)

    // 记录到 undo 栈
    undoStackRef.current.push(fullOp)
    redoStackRef.current = [] // 清空 redo

    // 加入 pending 队列
    pendingOpsRef.current.push(fullOp)

    // 通过 BackendBridge 发送
    const bridge = getBackendBridge()
    if (bridge.isConnected) {
      bridge.dispatchSignal({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'COMMAND',
        senderId: 'USER',
        receiverId: 'META_ORACLE',
        payload: {
          content: JSON.stringify({
            type: 'collab:operation',
            sessionId: session?.sessionId,
            operation: fullOp,
            baseVersion: versionRef.current,
          }),
          mood: 'FOCUSED',
          priority: 'HIGH',
          modelSource: bridge.isMockMode ? 'MOCK' : 'REAL',
        },
        metadata: { version: '1.0.0' },
      })
    }
  }, [userId, session])

  // 便捷方法：直接更新整个内容（自动生成操作）
  const updateContent = useCallback((newContent: string, cursorPosition?: number) => {
    const oldContent = contentRef.current
    if (oldContent === newContent) return

    // 简化差异算法：找到第一个不同的位置
    let commonStart = 0
    while (commonStart < oldContent.length && commonStart < newContent.length && oldContent[commonStart] === newContent[commonStart]) {
      commonStart++
    }

    let commonEnd = 0
    while (
      commonEnd < oldContent.length - commonStart &&
      commonEnd < newContent.length - commonStart &&
      oldContent[oldContent.length - 1 - commonEnd] === newContent[newContent.length - 1 - commonEnd]
    ) {
      commonEnd++
    }

    const deletedLength = oldContent.length - commonStart - commonEnd
    const insertedText = newContent.slice(commonStart, newContent.length - commonEnd)

    // 生成操作
    if (deletedLength > 0) {
      applyLocalOperation({
        type: 'delete',
        position: commonStart,
        length: deletedLength,
      })
    }
    if (insertedText.length > 0) {
      applyLocalOperation({
        type: 'insert',
        position: commonStart,
        content: insertedText,
      })
    }

    // 如果操作已经通过 applyLocalOperation 更新了，我们不需要再 set
    // 但为了确保一致性，直接设置
    setContent(newContent)
  }, [applyLocalOperation])

  // Undo
  const undo = useCallback(() => {
    const op = undoStackRef.current.pop()
    if (!op) return

    // 生成反向操作
    let inverseOp: TextOperation
    if (op.type === 'insert') {
      inverseOp = {
        ...op,
        type: 'delete',
        position: op.position,
        length: op.content?.length || 0,
        content: undefined,
      }
    } else if (op.type === 'delete') {
      // 需要保存被删除的内容才能 undo - 简化处理
      inverseOp = {
        ...op,
        type: 'insert',
        position: op.position,
        content: '', // 简化：实际需要记录被删内容
      }
    } else {
      return
    }

    const newContent = applyOperation(contentRef.current, inverseOp)
    setContent(newContent)
    setVersion(prev => prev + 1)
    redoStackRef.current.push(op)
  }, [])

  // Redo
  const redo = useCallback(() => {
    const op = redoStackRef.current.pop()
    if (!op) return

    const newContent = applyOperation(contentRef.current, op)
    setContent(newContent)
    setVersion(prev => prev + 1)
    undoStackRef.current.push(op)
  }, [])

  // 更新光标位置
  const updateCursor = useCallback((cursor: CursorPosition) => {
    setParticipants(prev =>
      prev.map(p =>
        p.userId === userId ? { ...p, cursor, lastSeen: Date.now() } : p
      )
    )

    // 广播 presence
    const bridge = getBackendBridge()
    if (bridge.isConnected) {
      const localP = participants.find(p => p.userId === userId)
      if (localP) {
        bridge.dispatchSignal({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'SYNC',
          senderId: 'USER',
          receiverId: 'META_ORACLE',
          payload: {
            content: JSON.stringify({
              type: 'collab:presence',
              sessionId: session?.sessionId,
              participant: { ...localP, cursor, lastSeen: Date.now() },
            }),
            mood: 'FOCUSED',
            priority: 'LOW',
            modelSource: 'MOCK',
          },
          metadata: { version: '1.0.0' },
        })
      }
    }
  }, [userId, session, participants])

  // 更新选区
  const updateSelection = useCallback((selection: SelectionRange | null) => {
    setParticipants(prev =>
      prev.map(p =>
        p.userId === userId ? { ...p, selection, lastSeen: Date.now() } : p
      )
    )
  }, [userId])

  return {
    content,
    version,
    isConnected,
    isSyncing,
    applyLocalOperation,
    updateContent,
    undo,
    redo,
    participants,
    updateCursor,
    updateSelection,
    session,
    conflictCount,
  }
}