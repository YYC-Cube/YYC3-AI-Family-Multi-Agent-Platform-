/**
 * file: CommandConsole.tsx
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

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles, ChevronRight, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleId, FAMILY_ROLES } from '../../types/family-manifest';
import { cn } from '@/components/ui/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface CommandConsoleProps {
  activeMemberId: RoleId | null; // null means Broadcast to All
  onSendCommand: (text: string) => void;
  isProcessing: boolean;
  targetMemberAvatar?: string;
  peerMode?: boolean;
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({ 
  activeMemberId, 
  onSendCommand, 
  isProcessing,
  targetMemberAvatar,
  peerMode = true
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const activeRole = activeMemberId ? FAMILY_ROLES[activeMemberId] : null;
  const placeholderText = activeRole 
    ? `Message ${activeRole.name}...` 
    : "Broadcast to Family Channel...";

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendCommand(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeMemberId]);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Context Indicator Tag */}
      <div className="mb-2 flex items-center gap-2">
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           key={activeMemberId || 'all'}
           className={cn(
             "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border shadow-lg backdrop-blur-md transition-all",
             activeRole 
                ? "bg-slate-900/80 border-slate-700 text-slate-200" 
                : "bg-blue-900/40 border-blue-500/30 text-blue-200"
           )}
         >
            {/* Tiny Avatar in the Tag */}
            <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 bg-slate-800 flex items-center justify-center">
              {activeRole && targetMemberAvatar ? (
                 <ImageWithFallback src={targetMemberAvatar} alt="Target" className="w-full h-full object-cover" />
              ) : (
                 <Users className="w-3 h-3" />
              )}
            </div>
            
            <span className="tracking-wide text-[11px]">
                {activeRole ? `TO: ${activeRole.name}` : "TO: ALL CHANNELS"}
            </span>
         </motion.div>
      </div>

      <motion.form 
        onSubmit={handleSubmit}
        className={cn(
          "relative flex items-center gap-2 p-2 rounded-[24px] border backdrop-blur-xl transition-all duration-300",
          "bg-slate-900/80 shadow-2xl",
          activeRole 
             ? "border-slate-700 focus-within:border-emerald-500/50" 
             : "border-blue-500/30 focus-within:border-blue-500/60"
        )}
        style={{
          boxShadow: isProcessing ? '0 0 30px rgba(16, 185, 129, 0.1)' : '0 10px 30px -10px rgba(0,0,0,0.5)'
        }}
      >
        <div className="pl-4 pr-2 text-slate-500">
          <ChevronRight className={cn("w-5 h-5", isProcessing && "animate-pulse text-emerald-400")} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          disabled={isProcessing}
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 font-sans text-lg h-12"
          autoComplete="off"
        />

        <div className="flex items-center gap-2 pr-1">
          <button 
            type="button" 
            className="p-3 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Voice Input (Simulation)"
          >
            <Mic className="w-5 h-5" />
          </button>

          <button 
            type="submit"
            disabled={!input.trim() || isProcessing}
            className={cn(
              "h-10 px-4 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm",
              input.trim() && !isProcessing
                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 hover:scale-105" 
                : "bg-white/5 text-slate-600 cursor-not-allowed"
            )}
          >
            <span>SEND</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </motion.form>
      
      {/* Footer Hints */}
      <div className="flex justify-between mt-3 px-6 text-[10px] text-slate-600 font-mono">
        <span className="flex items-center gap-1.5">
           <span className={cn("w-1.5 h-1.5 rounded-full", peerMode ? "bg-amber-500/70" : "bg-emerald-500/50")} />
           {peerMode ? 'PEER_SYNC_ON' : 'CHANNEL_SECURE'}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-violet-500/60 hidden sm:inline">/5d — Genome</span>
          <span className="text-amber-500/60 hidden sm:inline">/peer ��� Toggle</span>
          <span className="text-cyan-500/60 hidden sm:inline">/stats — Routing</span>
          <span className="text-emerald-500/60 hidden md:inline">/chain — Replay</span>
          <span className="text-rose-500/60 hidden lg:inline">/philosophy</span>
          <span className="text-sky-500/60 hidden lg:inline">/intent</span>
          <span className="text-pink-500/60 hidden xl:inline">/persona</span>
          <span>YYC³ PROTOCOL V1.0</span>
        </div>
      </div>
    </div>
  );
};