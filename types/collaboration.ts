/**
 * file: collaboration.ts
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
 * YYC³ AI Family - 协同编辑类型系统
 * 
 * 覆盖：
 * - CRDT 操作类型（文本操作转换）
 * - 面板布局规范（拖拽合并/拆分）
 * - 用户在线感知（Presence）
 * - WebSocket 协同消息协议
 * 
 * @file types/collaboration.ts
 */

// ==========================================
// CRDT / OT 操作类型
// ==========================================

/** 文本操作类型 */
export type TextOperationType = 'insert' | 'delete' | 'retain'

/** 单个文本操作 */
export interface TextOperation {
  type: TextOperationType
  position: number
  content?: string     // insert 时的内容
  length?: number      // delete / retain 的长度
  timestamp: number
  userId: string
  version: number      // 操作版本号（Lamport 时钟）
}

/** OT 转换后的操作 */
export interface TransformedOperation extends TextOperation {
  originalVersion: number
  transformedAgainst: string[]  // 已转换过的操作 ID 列表
}

/** CRDT 文档状态 */
export interface CRDTDocumentState {
  documentId: string
  content: string
  version: number
  lastModified: number
  contributors: string[]
  operationLog: TextOperation[]
}

/** 协同编辑会话 */
export interface CollaborationSession {
  sessionId: string
  documentId: string
  participants: CollaborationParticipant[]
  createdAt: number
  isActive: boolean
}

// ==========================================
// 用户在线感知 (Presence)
// ==========================================

/** 协同参与者 */
export interface CollaborationParticipant {
  userId: string
  userName: string
  avatarColor: string
  cursor: CursorPosition | null
  selection: SelectionRange | null
  isOnline: boolean
  lastSeen: number
  role: 'owner' | 'editor' | 'viewer'
}

/** 光标位置 */
export interface CursorPosition {
  line: number
  column: number
  timestamp: number
}

/** 选区范围 */
export interface SelectionRange {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
}

// ==========================================
// 面板布局类型（拖拽合并/拆分）
// ==========================================

/** 面板类型 */
export type PanelType = 
  | 'ai-chat'
  | 'file-tree'
  | 'code-editor'
  | 'terminal'
  | 'preview'
  | 'code-detail'

/** 拆分方向 */
export type SplitDirection = 'horizontal' | 'vertical'

/** 面板布局节点（树形结构） */
export interface PanelLayoutNode {
  id: string
  type: 'panel' | 'split'
  /** panel 类型时的面板内容类型 */
  panelType?: PanelType
  /** split 类型时的方向 */
  direction?: SplitDirection
  /** split 类型时的子节点 */
  children?: PanelLayoutNode[]
  /** 在父 split ��的比例 (0-100) */
  ratio?: number
  /** 最小尺寸 (px) */
  minSize?: number
  /** 面板标题 */
  title?: string
  /** 是否可关闭 */
  closable?: boolean
}

/** 拖拽放置位置 */
export type DropPosition = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'tab'

/** 面板拖拽事件 */
export interface PanelDragItem {
  type: 'panel'
  panelId: string
  panelType: PanelType
  sourceLayoutId?: string
}

/** 面板放置结果 */
export interface PanelDropResult {
  targetId: string
  position: DropPosition
}

/** 面板布局状态 */
export interface PanelLayoutState {
  root: PanelLayoutNode
  activePanel: string | null
  maximizedPanel: string | null
  dragOverTarget: string | null
  dragOverPosition: DropPosition | null
}

// ==========================================
// WebSocket 协同消息协议
// ==========================================

/** 协同消息类型 */
export type CollabMessageType =
  | 'collab:join'
  | 'collab:leave'
  | 'collab:operation'
  | 'collab:presence'
  | 'collab:sync'
  | 'collab:ack'
  | 'collab:conflict'
  | 'collab:sync_request'
  | 'collab:version_check'

/** 协同加入消息 */
export interface CollabJoinMessage {
  type: 'collab:join'
  sessionId: string
  userId: string
  userName: string
  documentId: string
}

/** 协同操作消息 */
export interface CollabOperationMessage {
  type: 'collab:operation'
  sessionId: string
  operation: TextOperation
  baseVersion: number
}

/** 协同 Presence 消息 */
export interface CollabPresenceMessage {
  type: 'collab:presence'
  sessionId: string
  participant: CollaborationParticipant
}

/** 协同同步消息 */
export interface CollabSyncMessage {
  type: 'collab:sync'
  sessionId: string
  document: CRDTDocumentState
  participants: CollaborationParticipant[]
}

/** 协同 ACK 消息 (Step 6c) */
export interface CollabAckMessage {
  type: 'collab:ack'
  sessionId: string
  operationId: string
  serverVersion: number
}

/** 协同冲突消息 (Step 6c) */
export interface CollabConflictMessage {
  type: 'collab:conflict'
  sessionId: string
  localOp: TextOperation
  remoteOp: TextOperation
  resolvedContent?: string
}

/** 版本检查消息 (Step 6c) */
export interface CollabVersionCheckMessage {
  type: 'collab:version_check'
  documentId: string
  userId: string
  localVersion: number
}

/** 全量同步请求消息 (Step 6c) */
export interface CollabSyncRequestMessage {
  type: 'collab:sync_request'
  documentId: string
  userId: string
  localVersion: number
}

/** 所有协同消息联合类型 */
export type CollabMessage =
  | CollabJoinMessage
  | CollabOperationMessage
  | CollabPresenceMessage
  | CollabSyncMessage
  | CollabAckMessage
  | CollabConflictMessage

// ==========================================
// 默认面板布局配置
// ==========================================

export const DEFAULT_PANEL_LAYOUT: PanelLayoutNode = {
  id: 'root',
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      id: 'left-panel',
      type: 'panel',
      panelType: 'ai-chat',
      ratio: 25,
      minSize: 240,
      title: '智能AI交互',
      closable: false,
    },
    {
      id: 'center-panel',
      type: 'split',
      direction: 'vertical',
      ratio: 45,
      minSize: 300,
      children: [
        {
          id: 'center-top',
          type: 'panel',
          panelType: 'file-tree',
          ratio: 35,
          minSize: 120,
          title: '文件管理',
          closable: false,
        },
        {
          id: 'center-bottom',
          type: 'panel',
          panelType: 'code-editor',
          ratio: 65,
          minSize: 200,
          title: '代码编辑器',
          closable: false,
        },
      ],
    },
    {
      id: 'right-panel',
      type: 'split',
      direction: 'vertical',
      ratio: 30,
      minSize: 280,
      children: [
        {
          id: 'right-top',
          type: 'panel',
          panelType: 'code-detail',
          ratio: 60,
          minSize: 150,
          title: '代码详情',
          closable: true,
        },
        {
          id: 'right-bottom',
          type: 'panel',
          panelType: 'terminal',
          ratio: 40,
          minSize: 120,
          title: '终端',
          closable: true,
        },
      ],
    },
  ],
}

/** Presence 颜色池 */
export const PRESENCE_COLORS = [
  '#4ade80', // green
  '#38bdf8', // sky
  '#fbbf24', // amber
  '#f472b6', // pink
  '#a78bfa', // violet
  '#fb923c', // orange
  '#2dd4bf', // teal
  '#e879f9', // fuchsia
]