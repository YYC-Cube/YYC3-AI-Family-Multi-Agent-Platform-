/**
 * file: CollaborationPresence.tsx
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
 * CollaborationPresence - 协同参与者在线状态指示器
 * 
 * 职责：
 * - 显示当前协同参与者头像列表
 * - 实时光标/选区位置
 * - 在线/离线状态
 * - 协同会话信息
 * 
 * @file components/collaboration/CollaborationPresence.tsx
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Users,
  Circle,
  Wifi,
  WifiOff,
  GitBranch,
  Clock,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'
import type { CollaborationParticipant, CollaborationSession } from '../../types/collaboration'

// ==========================================
// Types
// ==========================================

export interface CollaborationPresenceProps {
  participants: CollaborationParticipant[]
  session: CollaborationSession | null
  isConnected: boolean
  version: number
  conflictCount: number
}

// ==========================================
// Component
// ==========================================

export function CollaborationPresence({
  participants,
  session,
  isConnected,
  version,
  conflictCount,
}: CollaborationPresenceProps) {
  const [expanded, setExpanded] = useState(false)

  const onlineCount = participants.filter(p => p.isOnline).length

  return (
    <div className="relative">
      {/* Compact Bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/20 border border-white/[0.04] hover:border-white/[0.08] transition-all"
      >
        {/* Connection Status */}
        <div className={cn(
          'flex items-center gap-1 text-[9px] font-mono',
          isConnected ? 'text-emerald-500' : 'text-blue-500'
        )}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{isConnected ? 'LIVE' : 'LOCAL'}</span>
        </div>

        <div className="w-px h-3 bg-white/[0.06]" />

        {/* Participant Avatars */}
        <div className="flex items-center -space-x-1">
          {participants.slice(0, 4).map(p => (
            <div
              key={p.userId}
              className="w-4 h-4 rounded-full border border-slate-900 flex items-center justify-center text-[7px] text-white"
              style={{ backgroundColor: p.avatarColor }}
              title={p.userName}
            >
              {p.userName.charAt(0)}
            </div>
          ))}
          {participants.length > 4 && (
            <div className="w-4 h-4 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-[7px] text-slate-400">
              +{participants.length - 4}
            </div>
          )}
        </div>

        <span className="text-[9px] font-mono text-slate-600">
          {onlineCount} 在线
        </span>

        {/* Version Badge */}
        <span className="text-[8px] font-mono text-slate-700 bg-black/30 px-1 py-0.5 rounded">
          v{version}
        </span>

        {conflictCount > 0 && (
          <span className="text-[8px] font-mono text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">
            {conflictCount} 冲突
          </span>
        )}

        <ChevronDown className={cn(
          'w-3 h-3 text-slate-600 transition-transform',
          expanded && 'rotate-180'
        )} />
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            className="absolute right-0 top-full mt-1 z-50 bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 p-3 min-w-[260px]"
          >
            {/* Session Info */}
            {session && (
              <div className="mb-2 pb-2 border-b border-white/[0.04]">
                <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-1">
                  协同会话
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <GitBranch className="w-3 h-3" />
                  <span className="truncate">{session.sessionId.slice(0, 20)}...</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>创建于 {new Date(session.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            )}

            {/* Participants List */}
            <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-1.5">
              参与者 ({participants.length})
            </div>
            <div className="space-y-1.5">
              {participants.map(p => (
                <div key={p.userId} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white flex-none"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-slate-300 truncate">
                      {p.userName}
                    </div>
                    <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-600">
                      <Circle
                        className="w-1.5 h-1.5"
                        style={{
                          color: p.isOnline ? '#10b981' : '#475569',
                          fill: p.isOnline ? '#10b981' : '#475569',
                        }}
                      />
                      <span>{p.isOnline ? '在线' : '离线'}</span>
                      <span className="text-slate-700">|</span>
                      <span>{p.role === 'owner' ? '所有者' : p.role === 'editor' ? '编辑者' : '查看者'}</span>
                      {p.cursor && (
                        <>
                          <span className="text-slate-700">|</span>
                          <span>L{p.cursor.line}:C{p.cursor.column}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[9px] font-mono text-slate-600">
              <span>文档版本: v{version}</span>
              <span>CRDT 模式</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
