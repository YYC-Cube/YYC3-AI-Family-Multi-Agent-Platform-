/**
 * file: crdt-engine.ts
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
 * YYC³ AI Family - CRDT 同步引擎 (Bun 服务端)
 * 
 * 职责：
 * - 管理协同编辑文档状态
 * - OT 操作转换（服务端仲裁）
 * - Presence 广播
 * - 会话管理（join/leave）
 * - 冲突检测与解决
 * - 版本向量维护
 * 
 * Step 7b: 接入 Bun 服务端真实 CRDT 同步引擎
 * 
 * @file bun-server/crdt-engine.ts
 */

// ==========================================
// Types
// ==========================================

export interface CRDTWebSocket {
  send: (data: string) => void;
  readyState: number;
}

export interface TextOperation {
  type: 'insert' | 'delete' | 'retain'
  position: number
  content?: string
  length?: number
  timestamp: number
  userId: string
  version: number
}

export interface CRDTDocument {
  documentId: string
  content: string
  version: number
  lastModified: number
  contributors: Set<string>
  operationLog: TextOperation[]
}

export interface CollabParticipant {
  userId: string
  userName: string
  avatarColor: string
  cursor: { line: number; column: number; timestamp: number } | null
  selection: { startLine: number; startColumn: number; endLine: number; endColumn: number } | null
  isOnline: boolean
  lastSeen: number
  role: 'owner' | 'editor' | 'viewer'
  ws: CRDTWebSocket | null
}

export interface CollabSession {
  sessionId: string
  documentId: string
  participants: Map<string, CollabParticipant>
  createdAt: number
  isActive: boolean
}

export interface CollabInboundMessage {
  type: string
  sessionId?: string
  documentId?: string
  userId?: string
  userName?: string
  operation?: TextOperation
  baseVersion?: number
  participant?: Partial<CollabParticipant>
  localVersion?: number
  retry?: number
}

export interface CollabOutboundMessage {
  type: string
  sessionId?: string
  [key: string]: unknown
}

// ==========================================
// OT 转换引擎
// ==========================================

function transformOperation(op1: TextOperation, op2: TextOperation): TextOperation {
  const transformed = { ...op1 }

  if (op1.type === 'insert' && op2.type === 'insert') {
    if (op2.position <= op1.position) {
      transformed.position += (op2.content?.length || 0)
    }
  } else if (op1.type === 'insert' && op2.type === 'delete') {
    if (op2.position < op1.position) {
      transformed.position = Math.max(op2.position, op1.position - (op2.length || 0))
    }
  } else if (op1.type === 'delete' && op2.type === 'insert') {
    if (op2.position <= op1.position) {
      transformed.position += (op2.content?.length || 0)
    }
  } else if (op1.type === 'delete' && op2.type === 'delete') {
    if (op2.position < op1.position) {
      transformed.position = Math.max(0, op1.position - (op2.length || 0))
    }
    const op1End = op1.position + (op1.length || 0)
    const op2End = op2.position + (op2.length || 0)
    if (op2.position < op1End && op2End > op1.position) {
      const overlap = Math.min(op1End, op2End) - Math.max(op1.position, op2.position)
      transformed.length = Math.max(0, (op1.length || 0) - overlap)
    }
  }

  return transformed
}

function applyOperation(content: string, op: TextOperation): string {
  switch (op.type) {
    case 'insert':
      return content.slice(0, op.position) + (op.content || '') + content.slice(op.position)
    case 'delete':
      return content.slice(0, op.position) + content.slice(op.position + (op.length || 0))
    case 'retain':
      return content
    default:
      return content
  }
}

// ==========================================
// CRDT Engine
// ==========================================

export class CRDTEngine {
  private documents: Map<string, CRDTDocument> = new Map()
  private sessions: Map<string, CollabSession> = new Map()
  private maxOperationLogSize = 1000

  /**
   * 获取或创建文档
   */
  getDocument(documentId: string, initialContent?: string): CRDTDocument {
    let doc = this.documents.get(documentId)
    if (!doc) {
      doc = {
        documentId,
        content: initialContent || '',
        version: 0,
        lastModified: Date.now(),
        contributors: new Set(),
        operationLog: [],
      }
      this.documents.set(documentId, doc)
    }
    return doc
  }

  /**
   * 处理协同消息
   */
  handleMessage(ws: CRDTWebSocket, msg: CollabInboundMessage): CollabOutboundMessage[] {
    const responses: CollabOutboundMessage[] = []

    switch (msg.type) {
      case 'collab:join':
        responses.push(...this.handleJoin(ws, msg))
        break
      case 'collab:leave':
        responses.push(...this.handleLeave(msg))
        break
      case 'collab:operation':
        responses.push(...this.handleOperation(ws, msg))
        break
      case 'collab:presence':
        responses.push(...this.handlePresence(ws, msg))
        break
      case 'collab:sync_request':
        responses.push(...this.handleSyncRequest(ws, msg))
        break
      case 'collab:version_check':
        responses.push(...this.handleVersionCheck(ws, msg))
        break
    }

    return responses
  }

  /**
   * 客户端断开时清理
   */
  handleDisconnect(ws: CRDTWebSocket): CollabOutboundMessage[] {
    const responses: CollabOutboundMessage[] = []

    this.sessions.forEach((session) => {
      session.participants.forEach((participant, userId) => {
        if (participant.ws === ws) {
          participant.isOnline = false
          participant.lastSeen = Date.now()

          // 广播离开消息
          responses.push({
            type: 'collab:presence',
            sessionId: session.sessionId,
            participant: this.serializeParticipant(participant),
            _broadcast: true,
            _excludeWs: ws,
          })

          console.log(`[CRDT] User ${userId} disconnected from session ${session.sessionId}`)
        }
      })
    })

    return responses
  }

  // ---- Handler Methods ----

  private handleJoin(ws: CRDTWebSocket, msg: CollabInboundMessage): CollabOutboundMessage[] {
    const { sessionId, documentId, userId, userName } = msg
    if (!sessionId || !documentId || !userId) return []

    const responses: CollabOutboundMessage[] = []

    // 获取或创建会话
    let session = this.sessions.get(sessionId)
    if (!session) {
      session = {
        sessionId,
        documentId,
        participants: new Map(),
        createdAt: Date.now(),
        isActive: true,
      }
      this.sessions.set(sessionId, session)
    }

    // 确保文档存在
    const doc = this.getDocument(documentId)
    doc.contributors.add(userId)

    // 颜色池
    const colors = ['#4ade80', '#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c', '#2dd4bf', '#e879f9']
    const colorIndex = userId.charCodeAt(0) % colors.length

    // 注册参与者
    const participant: CollabParticipant = {
      userId,
      userName: userName || userId,
      avatarColor: colors[colorIndex],
      cursor: null,
      selection: null,
      isOnline: true,
      lastSeen: Date.now(),
      role: session.participants.size === 0 ? 'owner' : 'editor',
      ws,
    }
    session.participants.set(userId, participant)

    // 发送全量同步给新参与者
    responses.push({
      type: 'collab:sync',
      sessionId,
      document: {
        documentId: doc.documentId,
        content: doc.content,
        version: doc.version,
        lastModified: doc.lastModified,
        contributors: Array.from(doc.contributors),
        operationLog: [],
      },
      participants: this.getSerializedParticipants(session),
      _targetWs: ws,
    })

    // 广播新参与者加入
    responses.push({
      type: 'collab:presence',
      sessionId,
      participant: this.serializeParticipant(participant),
      _broadcast: true,
      _excludeWs: ws,
    })

    console.log(`[CRDT] User ${userId} joined session ${sessionId} (${session.participants.size} participants)`)
    return responses
  }

  private handleLeave(msg: CollabInboundMessage): CollabOutboundMessage[] {
    const { sessionId, userId } = msg
    if (!sessionId || !userId) return []

    const session = this.sessions.get(sessionId)
    if (!session) return []

    const participant = session.participants.get(userId)
    if (participant) {
      participant.isOnline = false
      participant.lastSeen = Date.now()
    }

    return [{
      type: 'collab:presence',
      sessionId,
      participant: participant ? this.serializeParticipant(participant) : { userId, isOnline: false },
      _broadcast: true,
    }]
  }

  private handleOperation(ws: CRDTWebSocket, msg: CollabInboundMessage): CollabOutboundMessage[] {
    const { sessionId, operation, baseVersion } = msg
    if (!sessionId || !operation) return []

    const session = this.sessions.get(sessionId)
    if (!session) return []

    const doc = this.getDocument(session.documentId)
    const responses: CollabOutboundMessage[] = []

    // OT 转换：如果 baseVersion < doc.version，需要转换
    let transformedOp = { ...operation }
    if (baseVersion !== undefined && baseVersion < doc.version) {
      // 获取 baseVersion 之后的所有操作
      const missedOps = doc.operationLog.filter(op => op.version > baseVersion)
      for (const serverOp of missedOps) {
        transformedOp = transformOperation(transformedOp, serverOp)
      }
    }

    // 应用操作
    try {
      doc.content = applyOperation(doc.content, transformedOp)
      doc.version++
      doc.lastModified = Date.now()
      transformedOp.version = doc.version

      // 记录操作日志
      doc.operationLog.push(transformedOp)
      if (doc.operationLog.length > this.maxOperationLogSize) {
        doc.operationLog = doc.operationLog.slice(-Math.floor(this.maxOperationLogSize / 2))
      }

      // 添加贡献者
      if (operation.userId) {
        doc.contributors.add(operation.userId)
      }

      // ACK 给发送者
      responses.push({
        type: 'collab:ack',
        sessionId,
        operationId: `op-${doc.version}`,
        serverVersion: doc.version,
        _targetWs: ws,
      })

      // 广播操作给其他参与者
      responses.push({
        type: 'collab:operation',
        sessionId,
        operation: transformedOp,
        baseVersion: doc.version,
        _broadcast: true,
        _excludeWs: ws,
      })

    } catch (err: unknown) {
      const error = err as Error;
      // 冲突
      responses.push({
        type: 'collab:conflict',
        sessionId,
        localOp: operation,
        remoteOp: transformedOp,
        resolvedContent: doc.content,
        error: error.message,
        _targetWs: ws,
      })
    }

    return responses
  }

  private handlePresence(ws: CRDTWebSocket, msg: CollabInboundMessage): CollabOutboundMessage[] {
    const { sessionId, participant: participantData } = msg
    if (!sessionId || !participantData || !participantData.userId) return []

    const session = this.sessions.get(sessionId)
    if (!session) return []

    const existing = session.participants.get(participantData.userId)
    if (existing) {
      existing.cursor = participantData.cursor || existing.cursor
      existing.selection = participantData.selection || existing.selection
      existing.lastSeen = Date.now()
    }

    return [{
      type: 'collab:presence',
      sessionId,
      participant: participantData,
      _broadcast: true,
      _excludeWs: ws,
    }]
  }

  private handleSyncRequest(ws: CRDTWebSocket, msg: CollabInboundMessage): CollabOutboundMessage[] {
    const { documentId, userId } = msg
    if (!documentId) return []

    const doc = this.documents.get(documentId)
    if (!doc) return []

    // 找到该文档的会话
    let targetSession: CollabSession | null = null
    for (const session of this.sessions.values()) {
      if (session.documentId === documentId) {
        targetSession = session
        break
      }
    }

    return [{
      type: 'collab:sync',
      sessionId: targetSession ? targetSession.sessionId : `session-${documentId}`,
      document: {
        documentId: doc.documentId,
        content: doc.content,
        version: doc.version,
        lastModified: doc.lastModified,
        contributors: Array.from(doc.contributors),
        operationLog: [],
      },
      participants: targetSession ? this.getSerializedParticipants(targetSession) : [],
      _targetWs: ws,
    }]
  }

  private handleVersionCheck(ws: CRDTWebSocket, msg: CollabInboundMessage): CollabOutboundMessage[] {
    const { documentId, localVersion } = msg
    if (!documentId) return []

    const doc = this.documents.get(documentId)
    if (!doc) return []

    // 如果客户端版本落后，发送差量操作
    if (localVersion !== undefined && localVersion < doc.version) {
      const missedOps = doc.operationLog.filter(op => op.version > localVersion)
      
      if (missedOps.length > 0 && missedOps.length < 50) {
        // 少量差异，发送差量操作
        return missedOps.map(op => ({
          type: 'collab:operation',
          sessionId: `session-${documentId}`,
          operation: op,
          baseVersion: doc.version,
          _targetWs: ws,
        }))
      } else {
        // 差异过大或操作日志不足，发送全量同步
        return this.handleSyncRequest(ws, msg)
      }
    }

    return []
  }

  // ---- Serialization Helpers ----

  private serializeParticipant(p: CollabParticipant): Omit<CollabParticipant, 'ws'> {
    const { ws, ...rest } = p
    return rest
  }

  private getSerializedParticipants(session: CollabSession): Omit<CollabParticipant, 'ws'>[] {
    return Array.from(session.participants.values()).map(p => this.serializeParticipant(p))
  }

  // ---- Stats ----

  getStats() {
    return {
      documents: this.documents.size,
      sessions: this.sessions.size,
      totalParticipants: Array.from(this.sessions.values())
        .reduce((sum, s) => sum + s.participants.size, 0),
      onlineParticipants: Array.from(this.sessions.values())
        .reduce((sum, s) => {
          let online = 0
          s.participants.forEach(p => { if (p.isOnline) online++ })
          return sum + online
        }, 0),
    }
  }
}

// ==========================================
// Singleton
// ==========================================

let _instance: CRDTEngine | null = null

export function getCRDTEngine(): CRDTEngine {
  if (!_instance) {
    _instance = new CRDTEngine()
  }
  return _instance
}
