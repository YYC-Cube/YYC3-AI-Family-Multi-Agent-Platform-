/**
 * file: CommunicationLog.tsx
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

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleId, FAMILY_ROLES, ROLE_DIMENSION_MAP, FIVE_DIMENSIONS } from '../../types/family-manifest';
import { cn } from '@/components/ui/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { BookOpen, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { useAutoScroll } from '../../hooks/useAutoScroll';

// ==========================================
// RAG Context Types & Log Message Types
// ==========================================
// CANONICAL SOURCE: /types/protocol.ts
// Re-exported here for backward compatibility (do not modify)
export type { RAGContextItem, LogMessage } from '../../types/protocol';
import type { RAGContextItem, LogMessage } from '../../types/protocol';

interface CommunicationLogProps {
  messages: LogMessage[];
  members?: any[]; // Passed from parent to get avatars
}

const USER_AVATAR = "https://images.unsplash.com/photo-1764336312138-14a5368a6cd3?w=200";

export const CommunicationLog: React.FC<CommunicationLogProps> = ({ messages, members = [] }) => {
  // Use the new auto-scroll hook
  const { scrollRef } = useAutoScroll({
    dependencies: [messages],
    behavior: 'auto',
    delay: 0,
  });

  const getMemberDetails = (id: string) => {
    const member = members.find(m => m.roleId === id);
    return member || { avatarUrl: null, roleId: id };
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col-reverse scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" ref={scrollRef}>
      <div className="space-y-6">
      <AnimatePresence initial={false}>
        {messages.map((msg) => {
          const isUser = msg.senderId === 'USER';
          const member = !isUser ? getMemberDetails(msg.senderId) : null;
          const roleInfo = !isUser ? FAMILY_ROLES[msg.senderId as RoleId] : null;
          const isPeer = msg.content.includes('[PEER_SYNC]') || msg.content.includes('[LIVE_MODEL]');
          const isSyncMsg = msg.content.includes('[PEER_SYNC] 同窗协同完成') || msg.content.includes('[ROUTING_STATS]');
          const dimColor = (!isUser && roleInfo) ? FIVE_DIMENSIONS[ROLE_DIMENSION_MAP[msg.senderId as RoleId]?.primary]?.color : undefined;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={cn(
                "flex gap-4 w-full max-w-4xl mx-auto",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div className="flex-none flex flex-col items-center gap-2">
                <div className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 shadow-lg relative z-10",
                  isUser ? "border-blue-500/50" 
                    : isPeer ? "border-amber-500/50"
                    : "border-emerald-500/50"
                )}>
                   <ImageWithFallback 
                     src={isUser ? USER_AVATAR : (member?.avatarUrl || USER_AVATAR)} 
                     alt={isUser ? "Commander" : roleInfo?.name || "System"}
                     className="w-full h-full object-cover"
                   />
                </div>
                {!isUser && roleInfo && (
                   <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{roleInfo.name}</span>
                )}
              </div>

              {/* Message Bubble */}
              <div className={cn(
                "flex flex-col gap-1 min-w-[120px] max-w-[80%]",
                isUser ? "items-end" : "items-start"
              )}>
                 {/* Header (Time/Name) */}
                 <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.type === 'THOUGHT' && (
                       <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded uppercase">Thinking</span>
                    )}
                    {isPeer && !isSyncMsg && (
                       <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded uppercase">Peer</span>
                    )}
                    {isSyncMsg && (
                       <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded uppercase">Sync</span>
                    )}
                 </div>

                 {/* Content */}
                 <div className={cn(
                   "p-4 rounded-2xl backdrop-blur-sm text-sm md:text-base leading-relaxed shadow-xl border relative",
                   isUser 
                     ? "bg-blue-600/20 border-blue-500/30 text-blue-50 rounded-tr-none"
                     : isSyncMsg
                       ? "bg-cyan-900/20 border-cyan-500/20 text-cyan-200/80 rounded-tl-none text-xs"
                       : isPeer
                         ? "bg-amber-900/10 border-amber-500/20 text-slate-200 rounded-tl-none"
                         : "bg-slate-800/80 border-white/10 text-slate-200 rounded-tl-none"
                 )}
                 style={isPeer && dimColor ? { borderLeftColor: dimColor, borderLeftWidth: 2 } : undefined}
                 >
                    {msg.content}
                    
                    {/* Tiny decorative corner */}
                    <div className={cn(
                      "absolute top-0 w-3 h-3 border-t border-l border-inherit bg-transparent",
                      isUser ? "-right-[1px] skew-x-12" : "-left-[1px] -skew-x-12"
                    )} />
                 </div>

                 {/* RAG Knowledge Context Cards */}
                 {msg.ragContext && msg.ragContext.length > 0 && (
                   <RAGContextCards items={msg.ragContext} />
                 )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Simulated "Typing" indicator if the last message was from User */}
      {messages.length > 0 && messages[messages.length - 1].senderId === 'USER' && (
        <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }}
           className="flex gap-4 w-full max-w-4xl mx-auto items-center"
        >
           <div className="w-10 h-10 rounded-full bg-slate-800/50 animate-pulse" />
           <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
           </div>
        </motion.div>
      )}
      </div>
    </div>
  );
};

// RAG Context Cards Component
interface RAGContextCardsProps {
  items: RAGContextItem[];
}

export const RAGContextCards: React.FC<RAGContextCardsProps> = ({ items }) => {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, 2);
  const hasMore = items.length > 2;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-1.5 w-full overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
        <Database className="w-3 h-3 text-cyan-500" />
        <span className="text-[9px] font-mono text-cyan-500/80 uppercase tracking-wider">
          知识库引用 · {items.length} 条匹配
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-1.5">
        {visibleItems.map((item, idx) => {
          const fileName = item.source.split('/').pop() || item.source;
          const simPct = (item.similarity * 100).toFixed(0);
          const simColor = item.similarity >= 0.7 ? 'text-emerald-400 bg-emerald-500/10' 
                         : item.similarity >= 0.4 ? 'text-yellow-400 bg-yellow-500/10'
                         : 'text-slate-400 bg-slate-500/10';

          return (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/10 hover:border-cyan-500/20 transition-colors"
            >
              <div className="flex items-start gap-2">
                <BookOpen className="w-3.5 h-3.5 text-cyan-500/60 mt-0.5 flex-none" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-cyan-400 truncate">{fileName}</span>
                    {item.section && (
                      <span className="text-[9px] font-mono text-slate-600 truncate">§ {item.section}</span>
                    )}
                    <span className="text-[8px] font-mono text-slate-700">[{item.chunkIndex + 1}/{item.totalChunks}]</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    {item.content.substring(0, 180)}{item.content.length > 180 ? '...' : ''}
                  </p>
                </div>
                <span className={cn("flex-none text-[10px] font-mono px-1.5 py-0.5 rounded", simColor)}>
                  {simPct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand / Collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-1 px-2 py-0.5 text-[9px] font-mono text-cyan-500/60 hover:text-cyan-400 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? '收起' : `展开全部 ${items.length} 条引用`}
        </button>
      )}
    </motion.div>
  );
};