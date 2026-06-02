/**
 * file: MemberCard.tsx
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

import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, Cpu, Activity, Lock, Database, Settings } from 'lucide-react';
import { RoleId, FAMILY_ROLES, FamilyMood, DeviceNode } from '../../types/family-manifest';
import { MOOD_COLORS, MOOD_RING_COLORS, MOOD_LABELS } from '../../types/theme-constants';
import { cn } from '@/components/ui/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface MemberCardProps {
  roleId: RoleId;
  device?: DeviceNode;
  mood: FamilyMood;
  isOnline: boolean;
  currentActivity: string;
  avatarUrl?: string;
  onConfig?: () => void;
  compact?: boolean; // Compact mode for sidebar
}

export const MemberCard: React.FC<MemberCardProps> = ({ 
  roleId, 
  device, 
  mood, 
  isOnline,
  currentActivity,
  avatarUrl,
  onConfig,
  compact = false
}) => {
  const role = FAMILY_ROLES[roleId];
  const moodStyle = MOOD_COLORS[mood] || MOOD_COLORS.SERENE;
  const finalAvatarUrl = avatarUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400";

  // ---- Compact Mode: Avatar tile for sidebar ----
  if (compact) {
    return (
      <div className={cn(
        "relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 group cursor-pointer",
        isOnline ? "hover:bg-white/5" : "opacity-50 grayscale"
      )}>
        {/* Config on hover */}
        {onConfig && (
          <button 
            onClick={(e) => { e.stopPropagation(); onConfig(); }}
            className="absolute top-0.5 right-0.5 p-1 rounded-md bg-black/60 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-30"
            title="Configure"
          >
            <Settings className="w-2.5 h-2.5" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative">
          <div className={cn(
            "w-12 h-12 rounded-full overflow-hidden ring-2 transition-all duration-300",
            MOOD_RING_COLORS[mood] || 'ring-white/10',
            "group-hover:ring-offset-1 group-hover:ring-offset-slate-950"
          )}>
            <ImageWithFallback 
              src={finalAvatarUrl} 
              alt={role.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          {/* Online dot */}
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-slate-950 rounded-full flex items-center justify-center z-20">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", mood === 'FOCUSED' ? "bg-emerald-500" : "bg-blue-500")} />
            </div>
          )}
        </div>

        {/* Name */}
        <span className="text-[10px] text-slate-400 font-mono text-center truncate w-full leading-tight">
          {role.name}
        </span>
        
        {/* Device tag (if has hardware) */}
        {device && (
          <div className="flex items-center gap-1 text-[8px] text-slate-600 font-mono">
            {roleId === 'MASTER' ? <Database className="w-2 h-2" /> : <Cpu className="w-2 h-2" />}
            <span className="truncate max-w-[60px]">{device.name.split(' ').slice(0, 2).join(' ')}</span>
          </div>
        )}
      </div>
    );
  }

  // ---- Full Mode: Standard card ----
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border transition-all duration-300 bg-slate-900/40 backdrop-blur-md group h-full",
      isOnline ? "border-slate-800 hover:border-slate-600" : "border-slate-800 opacity-60 grayscale"
    )}>
      {/* Activity Status Bar - Top */}
      <div className={cn("h-1 w-full absolute top-0 left-0 transition-colors duration-500", moodStyle.split(' ')[2].replace('/10','/80'))} />

      {/* Config Button (Hover Only) */}
      {onConfig && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onConfig();
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all z-30"
          title="Configure Soul & Body"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="p-4 flex items-start gap-4">
        {/* Avatar Section */}
        <div className="relative flex-none">
          <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/10 relative z-10">
             <ImageWithFallback 
               src={finalAvatarUrl} 
               alt={role.name}
               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
             />
          </div>
          
          {/* Status Indicator Dot */}
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-slate-950 rounded-full flex items-center justify-center z-20">
               <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", mood === 'FOCUSED' ? "bg-emerald-500" : "bg-blue-500")} />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 pr-6">
            <h3 className="font-bold text-slate-200 text-sm truncate">{role.name}</h3>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider", moodStyle)}>
               {MOOD_LABELS[mood]}
            </span>
          </div>
          
          <div className="text-xs text-slate-400 font-mono mb-2 truncate">
             {role.primaryDuty}
          </div>

          {/* Dynamic Activity Text */}
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/10">
            <Activity className="w-3 h-3 animate-pulse" />
            <span className="truncate">{currentActivity}</span>
          </div>
        </div>
      </div>

      {/* Hardware Footer (If available) */}
      {device && (
        <div className="mt-2 px-4 py-2 border-t border-white/5 bg-black/20 flex items-center justify-between text-[10px] text-slate-500 font-mono">
           <div className="flex items-center gap-1.5">
              {roleId === 'MASTER' ? <Database className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
              <span className="truncate max-w-[120px]">{device.name}</span>
           </div>
           <div>{device.ip.split('.').slice(-2).join('.')}</div>
        </div>
      )}
    </div>
  );
};