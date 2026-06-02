/**
 * file: DimensionStageMatrix.tsx
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
 * YYC³ AI Family - DimensionStageMatrix (五维×七步交叉矩阵)
 * 
 * A heatmap visualization showing how each of the Five Dimensions
 * participates across the seven Creation Stages (创生七步曲).
 * Intensity levels: 0=absent, 1=supporting, 2=active, 3=dominant
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageCircle, Handshake, Layers, Brain,
  Sparkles, Flame, PenTool, Eye, Waves, Rocket, Shield
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { 
  FiveDimensionId, CreationStage,
  FIVE_DIMENSIONS, FIVE_DIMENSIONS_CYCLE,
  CREATION_STEPS, DIMENSION_STAGE_MATRIX,
  MatrixIntensity, RoleId,
  ROLE_DIMENSION_MAP, FAMILY_ROLES
} from '../../types/family-manifest';

// Icon maps
const DIM_ICONS: Record<string, React.ReactNode> = {
  'Users': <Users className="w-3.5 h-3.5" />,
  'MessageCircle': <MessageCircle className="w-3.5 h-3.5" />,
  'Handshake': <Handshake className="w-3.5 h-3.5" />,
  'Layers': <Layers className="w-3.5 h-3.5" />,
  'Brain': <Brain className="w-3.5 h-3.5" />,
};

const STAGE_ICONS: Record<CreationStage, React.ReactNode> = {
  [CreationStage.SPARK]: <Sparkles className="w-3.5 h-3.5" />,
  [CreationStage.BLUEPRINT]: <PenTool className="w-3.5 h-3.5" />,
  [CreationStage.WEAVING]: <Flame className="w-3.5 h-3.5" />,
  [CreationStage.GAZE]: <Eye className="w-3.5 h-3.5" />,
  [CreationStage.PULSE]: <Waves className="w-3.5 h-3.5" />,
  [CreationStage.BIRTH]: <Rocket className="w-3.5 h-3.5" />,
  [CreationStage.GUARDIAN]: <Shield className="w-3.5 h-3.5" />,
};

const INTENSITY_LABELS: Record<MatrixIntensity, string> = {
  0: 'Absent',
  1: 'Supporting',
  2: 'Active',
  3: 'Dominant',
};

interface DimensionStageMatrixProps {
  className?: string;
  onNavigateToMember?: (roleId: RoleId) => void;
}

export const DimensionStageMatrix: React.FC<DimensionStageMatrixProps> = ({ className, onNavigateToMember }) => {
  const [hoveredCell, setHoveredCell] = useState<{ dim: FiveDimensionId; stage: CreationStage } | null>(null);
  const [expandedDim, setExpandedDim] = useState<FiveDimensionId | null>(null);

  const getIntensityStyle = (intensity: MatrixIntensity, dimColor: string) => {
    const opacityMap: Record<MatrixIntensity, number> = { 0: 0, 1: 0.2, 2: 0.5, 3: 0.85 };
    return {
      background: intensity > 0 ? `${dimColor}${Math.round(opacityMap[intensity] * 255).toString(16).padStart(2, '0')}` : 'transparent',
      borderColor: intensity > 0 ? `${dimColor}30` : 'rgba(255,255,255,0.03)',
    };
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Legend */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider">
          Dimension × Stage Heatmap
        </h3>
        <div className="flex items-center gap-3 text-[9px] font-mono text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border border-white/5" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
            <span>1</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500/50 border border-emerald-500/30" />
            <span>2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500/85 border border-emerald-500/30" />
            <span>3</span>
          </div>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Column Headers (Stages) */}
          <div className="grid gap-1" style={{ gridTemplateColumns: '140px repeat(7, 1fr)' }}>
            <div /> {/* Empty corner cell */}
            {CREATION_STEPS.map((step) => (
              <div 
                key={step.stage}
                className="text-center py-2 text-[9px] font-mono text-slate-500 flex flex-col items-center gap-1"
              >
                <span className="text-slate-600">{STAGE_ICONS[step.stage]}</span>
                <span className="truncate w-full px-1">{step.name}</span>
              </div>
            ))}
          </div>

          {/* Rows (Dimensions) */}
          {FIVE_DIMENSIONS_CYCLE.map((dimId) => {
            const dim = FIVE_DIMENSIONS[dimId];
            const isExpanded = expandedDim === dimId;
            
            // Gather roles attributed to this dimension
            const primaryRoles = Object.entries(ROLE_DIMENSION_MAP)
              .filter(([_, attr]) => attr.primary === dimId)
              .map(([roleId, attr]) => ({ roleId: roleId as RoleId, role: FAMILY_ROLES[roleId as RoleId], attr, isPrimary: true }));
            const secondaryRoles = Object.entries(ROLE_DIMENSION_MAP)
              .filter(([_, attr]) => attr.secondary.includes(dimId))
              .map(([roleId, attr]) => ({ roleId: roleId as RoleId, role: FAMILY_ROLES[roleId as RoleId], attr, isPrimary: false }));

            return (
              <div key={dimId}>
                <div 
                  className="grid gap-1 mt-1"
                  style={{ gridTemplateColumns: '140px repeat(7, 1fr)' }}
                >
                  {/* Row Header — Clickable to expand */}
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 rounded-l-lg cursor-pointer transition-all hover:bg-white/5",
                      isExpanded && "bg-white/5 ring-1 ring-inset"
                    )}
                    style={{ color: dim.color, ...(isExpanded ? { ringColor: `${dim.color}40` } : {}) }}
                    onClick={() => setExpandedDim(isExpanded ? null : dimId)}
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-none text-[10px] opacity-50"
                    >
                      ▶
                    </motion.div>
                    {DIM_ICONS[dim.icon]}
                    <span className="text-[10px] font-mono truncate">{dim.name}</span>
                  </div>

                  {/* Cells */}
                  {CREATION_STEPS.map((step) => {
                    const intensity = DIMENSION_STAGE_MATRIX[dimId][step.stage];
                    const isHovered = hoveredCell?.dim === dimId && hoveredCell?.stage === step.stage;
                    const style = getIntensityStyle(intensity, dim.color);

                    return (
                      <motion.div
                        key={`${dimId}-${step.stage}`}
                        className={cn(
                          "relative rounded border flex items-center justify-center transition-all",
                          isHovered && "ring-1 ring-white/30 z-10",
                          intensity === 3 && onNavigateToMember && "cursor-pointer ring-1 ring-white/10"
                        )}
                        style={style}
                        onMouseEnter={() => setHoveredCell({ dim: dimId, stage: step.stage })}
                        onMouseLeave={() => setHoveredCell(null)}
                        whileHover={{ scale: 1.15 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        onClick={() => {
                          if (intensity === 3 && onNavigateToMember) {
                            onNavigateToMember(step.ownerId as RoleId);
                          }
                        }}
                      >
                        <span 
                          className={cn(
                            "text-[10px] font-bold font-mono",
                            intensity === 3 ? "text-white" : intensity === 2 ? "text-white/80" : intensity === 1 ? "text-white/50" : "text-slate-700"
                          )}
                        >
                          {intensity}
                        </span>

                        {/* Tooltip on Hover */}
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 rounded-lg p-2.5 shadow-xl z-50 whitespace-nowrap pointer-events-none"
                          >
                            <div className="text-[10px] font-bold text-white mb-1">
                              {dim.name} × {step.name}
                            </div>
                            <div className="text-[9px] font-mono" style={{ color: dim.color }}>
                              Intensity: {intensity} ({INTENSITY_LABELS[intensity]})
                            </div>
                            {intensity === 3 && (
                              <div className="text-[9px] font-mono text-amber-400 mt-1 flex items-center gap-1">
                                Click to visit: {step.ownerId}
                              </div>
                            )}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-white/10 rotate-45" />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Expanded Role Attribution Panel */}
                <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="mt-1 mb-2 ml-2 mr-2 rounded-lg border overflow-hidden"
                    style={{ borderColor: `${dim.color}20`, background: `${dim.color}05` }}
                  >
                    <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: `${dim.color}15` }}>
                      <span className="text-[10px] font-mono font-bold" style={{ color: dim.color }}>
                        {dim.subtitle} — 角色归属
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        Primary: {primaryRoles.length} | Secondary: {secondaryRoles.length}
                      </span>
                    </div>
                    
                    <div className="p-2 space-y-1.5">
                      {/* Primary carriers */}
                      {primaryRoles.map(({ roleId, role, attr }) => (
                        <div 
                          key={roleId}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md border transition-all",
                            onNavigateToMember && "cursor-pointer hover:bg-white/5"
                          )}
                          style={{ borderColor: `${dim.color}25`, background: `${dim.color}08` }}
                          onClick={() => onNavigateToMember?.(roleId)}
                        >
                          <div 
                            className="w-2 h-2 rounded-full flex-none" 
                            style={{ background: dim.color }} 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-white">{role.name}</span>
                              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full" style={{ color: dim.color, background: `${dim.color}15` }}>
                                PRIMARY
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 truncate">{attr.resonanceNote}</div>
                          </div>
                          <div className="text-[9px] text-slate-600 font-mono flex-none">{role.primaryDuty}</div>
                        </div>
                      ))}
                      
                      {/* Secondary carriers */}
                      {secondaryRoles.map(({ roleId, role, attr }) => (
                        <div 
                          key={roleId}
                          className={cn(
                            "flex items-center gap-3 px-3 py-1.5 rounded-md border border-white/5 transition-all",
                            onNavigateToMember && "cursor-pointer hover:bg-white/5"
                          )}
                          onClick={() => onNavigateToMember?.(roleId)}
                        >
                          <div className="w-2 h-2 rounded-full flex-none border" style={{ borderColor: `${dim.color}50` }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-300">{role.name}</span>
                              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full text-slate-500 bg-white/5">
                                SECONDARY
                              </span>
                            </div>
                          </div>
                          <div className="text-[9px] text-slate-600 font-mono flex-none">{role.primaryDuty}</div>
                        </div>
                      ))}
                      
                      {primaryRoles.length === 0 && secondaryRoles.length === 0 && (
                        <div className="text-[10px] text-slate-600 font-mono text-center py-2">
                          无直接归属角色 (该维度为系统性维度)
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/5">
        {FIVE_DIMENSIONS_CYCLE.map((dimId) => {
          const dim = FIVE_DIMENSIONS[dimId];
          const values = Object.values(DIMENSION_STAGE_MATRIX[dimId]) as MatrixIntensity[];
          const total = values.reduce((sum: number, v) => sum + v, 0);
          const dominant = values.filter(v => v === 3).length;
          
          return (
            <div 
              key={dimId}
              className="text-center p-2 rounded-lg border"
              style={{ borderColor: `${dim.color}15`, background: `${dim.color}05` }}
            >
              <div className="text-[10px] font-mono font-bold" style={{ color: dim.color }}>
                {total}
              </div>
              <div className="text-[8px] text-slate-600 font-mono">
                Total / {dominant}D
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};