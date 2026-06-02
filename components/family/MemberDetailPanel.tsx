/**
 * file: MemberDetailPanel.tsx
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RoleId, FAMILY_ROLES, 
  FIVE_DIMENSIONS, ROLE_DIMENSION_MAP, FiveDimensionId,
  FamilyMood
} from '../../types/family-manifest';
import type { FamilyMemberState } from '../../types/family-manifest';
import { 
  X, Save, Cpu, Shield, Activity, 
  Terminal, Database, Globe, Lock, 
  Zap, MessageSquare, Fingerprint,
  Wifi, WifiOff,
  Users, MessageCircle, Handshake, Layers, Brain,
  Orbit, Sparkles, ArrowRight
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface MemberDetailPanelProps {
  member: FamilyMemberState;
  onClose: () => void;
  onUpdate: (id: RoleId, updates: Partial<FamilyMemberState>) => void;
}

export const MemberDetailPanel: React.FC<MemberDetailPanelProps> = ({ member, onClose, onUpdate }) => {
  const role = FAMILY_ROLES[member.roleId];
  const [activeTab, setActiveTab] = useState<'SOUL' | 'BODY' | 'RIGHTS'>('SOUL');
  const [isEditing, setIsEditing] = useState(false);
  const isLiveActivity = member.currentActivity.startsWith('[LIVE]');
  
  // Local state for editing form
  const [formData, setFormData] = useState({
    mood: member.mood,
    currentActivity: member.currentActivity,
    // Simulated "System Prompt" that would exist in a real DB
    systemPrompt: `You are the ${role.name}. ${role.primaryDuty}. \nYour primary duty is ${role.primaryDuty}. \nAct with ${member.mood} demeanor.`,
    permissions: {
      readNas: true,
      writeCode: member.roleId === 'PROPHET',
      internetAccess: true,
      adminOverride: member.roleId === 'META_ORACLE'
    }
  });

  const handleSave = () => {
    onUpdate(member.roleId, {
      mood: formData.mood,
      currentActivity: formData.currentActivity
    });
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 w-full md:w-[480px] bg-slate-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="relative h-48 flex-none overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/90 z-10" />
        <ImageWithFallback 
          src={member.avatarUrl || "https://images.unsplash.com/photo-1531297461136-82lwDe43qR8w"} 
          alt={role.name}
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
        />
        
        <div className="absolute top-4 right-4 z-20">
          <button onClick={onClose} className="p-2 rounded-full bg-black/20 hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute bottom-4 left-6 z-20">
           <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
             {role.name}
             <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-black font-bold tracking-wider">ONLINE</span>
           </h2>
           <div className="text-xs font-mono text-slate-300 flex items-center gap-3">
              <span className="flex items-center gap-1"><Fingerprint className="w-3 h-3" /> {member.roleId}</span>
              <span className="w-1 h-1 bg-slate-500 rounded-full" />
              <span className="text-emerald-400">{role.primaryDuty}</span>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-white/5">
        {(['SOUL', 'BODY', 'RIGHTS'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-xs font-bold tracking-wider transition-colors relative",
              activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        
        {activeTab === 'SOUL' && (
           <div className="space-y-6">
              {/* Status Section */}
              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                       <Activity className="w-4 h-4" /> Current State
                    </h3>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-xs text-emerald-500 hover:underline"
                    >
                      {isEditing ? 'Cancel' : 'Edit Parameters'}
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] text-slate-500 uppercase">Current Mood</label>
                       {isEditing ? (
                         <select 
                           value={formData.mood}
                           onChange={e => setFormData({...formData, mood: e.target.value as FamilyMood})}
                           className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white"
                         >
                            <option value="SERENE">SERENE (宁静)</option>
                            <option value="FOCUSED">FOCUSED (专注)</option>
                            <option value="EXCITED">EXCITED (兴奋)</option>
                            <option value="LOVING">LOVING (关爱)</option>
                         </select>
                       ) : (
                         <div className="text-sm text-white font-medium">{formData.mood}</div>
                       )}
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] text-slate-500 uppercase">Activity Loop</label>
                       {isEditing ? (
                         <input 
                           value={formData.currentActivity}
                           onChange={e => setFormData({...formData, currentActivity: e.target.value})}
                           className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white"
                         />
                       ) : (
                         <div className="text-sm text-white font-medium truncate">{formData.currentActivity}</div>
                       )}
                    </div>
                 </div>
              </div>

              {/* === NEW: Five Dimensions Attribution (哲学基因归属) === */}
              <DimensionAttribution roleId={member.roleId} />

              {/* Personality Core */}
              <div className="space-y-2">
                 <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" /> Cognitive Core (System Prompt)
                 </h3>
                 <div className="relative">
                    <textarea 
                      value={formData.systemPrompt}
                      readOnly={!isEditing}
                      className={cn(
                        "w-full h-40 bg-slate-900/50 rounded-xl p-4 text-xs font-mono leading-relaxed resize-none focus:outline-none transition-colors",
                        isEditing ? "border border-emerald-500/50 text-white" : "border border-white/5 text-slate-400"
                      )}
                    />
                    <div className="absolute bottom-2 right-2 text-[9px] text-slate-600 bg-black/40 px-2 py-1 rounded">
                       TOKEN_COUNT: 142
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-500">
                    * Modifying the Core Prompt will alter this family member's personality and response logic.
                 </p>
              </div>
           </div>
        )}

        {activeTab === 'BODY' && (
           <div className="space-y-6">
              {/* Hardware Spec */}
              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-4">
                 <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Hardware Binding
                 </h3>
                 {member.device ? (
                   <div className="space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center">
                            <Cpu className="w-6 h-6 text-slate-400" />
                         </div>
                         <div>
                            <div className="font-bold text-white">{member.device.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{member.device.hardwareSpec}</div>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                         <div className="bg-black/20 p-2 rounded flex justify-between">
                            <span className="text-slate-500">IP ADDR</span>
                            <span className="text-emerald-400">{member.device.ip}</span>
                         </div>
                         <div className="bg-black/20 p-2 rounded flex justify-between">
                            <span className="text-slate-500">LATENCY</span>
                            <span className="text-emerald-400">&lt;1ms</span>
                         </div>
                         <div className="bg-black/20 p-2 rounded flex justify-between">
                            <span className="text-slate-500">UPTIME</span>
                            <span className="text-white">42d 11h</span>
                         </div>
                         <div className="bg-black/20 p-2 rounded flex justify-between">
                            <span className="text-slate-500">LOC</span>
                            <span className="text-white">{member.device.location}</span>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="text-center py-8 text-slate-500 text-xs">
                      No physical body bound to this soul yet.
                   </div>
                 )}
              </div>

              {/* Protocol Metrics */}
              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-4">
                 <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Neural Metrics
                 </h3>
                 <div className="h-24 flex items-end justify-between gap-1 px-2">
                    {[40, 65, 32, 78, 45, 89, 54, 76, 32, 45].map((h, i) => (
                       <div key={i} className="w-full bg-emerald-500/20 rounded-t relative group">
                          <div 
                            style={{ height: `${h}%` }} 
                            className="absolute bottom-0 left-0 right-0 bg-emerald-500/50 rounded-t transition-all group-hover:bg-emerald-400" 
                          />
                       </div>
                    ))}
                 </div>
                 <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase">
                    <span>Signal Intensity</span>
                    <span>Last 60s</span>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'RIGHTS' && (
           <div className="space-y-6">
              <div className="space-y-3">
                 <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Protocol Permissions
                 </h3>
                 <p className="text-xs text-slate-500 mb-4">
                    Define what this family member is allowed to access within the Trust Protocol.
                 </p>
                 
                 <PermissionToggle 
                   label="Read Family Memories (NAS)" 
                   desc="Access to /volume1/family_memory"
                   icon={<Database className="w-4 h-4 text-blue-400" />}
                   enabled={formData.permissions.readNas} 
                 />
                 <PermissionToggle 
                   label="Modify Codebase" 
                   desc="Write access to project repositories"
                   icon={<Terminal className="w-4 h-4 text-orange-400" />}
                   enabled={formData.permissions.writeCode} 
                 />
                 <PermissionToggle 
                   label="External Network" 
                   desc="Access to public internet via Gateway"
                   icon={<Globe className="w-4 h-4 text-purple-400" />}
                   enabled={formData.permissions.internetAccess} 
                 />
                 <PermissionToggle 
                   label="Admin Override" 
                   desc="Can force-reboot system components"
                   icon={<Lock className="w-4 h-4 text-red-400" />}
                   enabled={formData.permissions.adminOverride} 
                 />
              </div>
           </div>
        )}

      </div>

      {/* Footer Actions */}
      {isEditing && (
        <div className="p-4 border-t border-white/5 bg-slate-900/50 backdrop-blur flex justify-end gap-3">
           <button 
             onClick={() => setIsEditing(false)}
             className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors"
           >
             CANCEL
           </button>
           <button 
             onClick={handleSave}
             className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
           >
             <Save className="w-4 h-4" />
             SAVE CONFIG
           </button>
        </div>
      )}
    </motion.div>
  );
};

const PermissionToggle = ({ label, desc, icon, enabled }: any) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/5">
     <div className="flex items-center gap-3">
        <div className="p-2 bg-black/20 rounded-lg">
           {icon}
        </div>
        <div>
           <div className="text-xs font-bold text-white">{label}</div>
           <div className="text-[10px] text-slate-500">{desc}</div>
        </div>
     </div>
     <div className={cn(
        "w-10 h-5 rounded-full relative transition-colors",
        enabled ? "bg-emerald-500" : "bg-slate-700"
     )}>
        <div className={cn(
           "absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
           enabled ? "left-6" : "left-1"
        )} />
     </div>
  </div>
);

// Dimension icon small helper
const DIM_ICON_SM: Record<string, React.ReactNode> = {
  'Users': <Users className="w-3.5 h-3.5" />,
  'MessageCircle': <MessageCircle className="w-3.5 h-3.5" />,
  'Handshake': <Handshake className="w-3.5 h-3.5" />,
  'Layers': <Layers className="w-3.5 h-3.5" />,
  'Brain': <Brain className="w-3.5 h-3.5" />,
};

const DimensionAttribution: React.FC<{ roleId: RoleId }> = ({ roleId }) => {
  const attr = ROLE_DIMENSION_MAP[roleId];
  const primary = FIVE_DIMENSIONS[attr.primary];
  const secondaries = attr.secondary.map(id => FIVE_DIMENSIONS[id]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
        <Orbit className="w-4 h-4 text-violet-400" /> Philosophical Genome (哲学基因归属)
      </h3>

      {/* Primary Dimension */}
      <div 
        className="p-4 rounded-xl border space-y-3"
        style={{ 
          background: `linear-gradient(135deg, ${primary.color}10, transparent)`,
          borderColor: `${primary.color}30`,
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{ background: `${primary.color}20`, borderColor: `${primary.color}40`, color: primary.color }}
          >
            {DIM_ICON_SM[primary.icon]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{primary.name}</span>
              <span 
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                style={{ background: `${primary.color}25`, color: primary.color }}
              >
                Primary
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">{primary.subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded bg-black/20">
          <Sparkles className="w-3 h-3 text-slate-500 flex-none" />
          <span className="text-slate-400">{primary.subtitle}</span>
          <ArrowRight className="w-3 h-3 text-slate-600 flex-none" />
          <span style={{ color: primary.color }} className="font-mono">{primary.subtitle}</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed pl-3 border-l-2" style={{ borderColor: `${primary.color}50` }}>
          {attr.resonanceNote}
        </p>
      </div>

      {/* Secondary Dimensions */}
      {secondaries.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider px-1">Secondary Resonances</div>
          <div className="flex gap-2 flex-wrap">
            {secondaries.map(dim => (
              <div
                key={dim.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{ 
                  background: `${dim.color}08`,
                  borderColor: `${dim.color}20`,
                  color: dim.color,
                }}
              >
                {DIM_ICON_SM[dim.icon]}
                <span className="text-[10px] font-mono">{dim.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};