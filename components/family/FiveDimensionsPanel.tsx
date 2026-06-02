/**
 * file: FiveDimensionsPanel.tsx
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
 * YYC³ AI Family - FiveDimensionsPanel (五维深度哲学殿堂)
 * 
 * Visualizes the Five Dimensions of Depth as a living pentagonal cycle.
 * Each dimension is a philosophical pillar mapped to the Five-in-One Law.
 * 
 * Core Logic: The five dimensions form a closed-loop ecosystem where
 * each dimension supports and promotes the others, constituting the
 * intelligent life of the YYC³ AI Family.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Users, MessageCircle, Handshake, Layers, Brain,
  ArrowRight, Sparkles, Orbit, ChevronRight, Zap, 
  RotateCw, Shield, Grid3x3
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { 
  FiveDimensionId, FiveDimensionDef, 
  FIVE_DIMENSIONS, FIVE_DIMENSIONS_CYCLE,
  RoleId
} from '../../types/family-manifest';
import { DimensionStageMatrix } from './DimensionStageMatrix';

interface FiveDimensionsPanelProps {
  onClose: () => void;
  onNavigateToMember?: (roleId: RoleId) => void;
  initialViewMode?: 'CYCLE' | 'MATRIX';
}

// Icon mapping since we store icon names as strings
const ICON_MAP: Record<string, React.ReactNode> = {
  'Users': <Users className="w-5 h-5" />,
  'MessageCircle': <MessageCircle className="w-5 h-5" />,
  'Handshake': <Handshake className="w-5 h-5" />,
  'Layers': <Layers className="w-5 h-5" />,
  'Brain': <Brain className="w-5 h-5" />,
};

const ICON_MAP_LARGE: Record<string, React.ReactNode> = {
  'Users': <Users className="w-8 h-8" />,
  'MessageCircle': <MessageCircle className="w-8 h-8" />,
  'Handshake': <Handshake className="w-8 h-8" />,
  'Layers': <Layers className="w-8 h-8" />,
  'Brain': <Brain className="w-8 h-8" />,
};

export const FiveDimensionsPanel: React.FC<FiveDimensionsPanelProps> = ({ onClose, onNavigateToMember, initialViewMode }) => {
  const [activeDimension, setActiveDimension] = useState<FiveDimensionId | null>(null);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [viewMode, setViewMode] = useState<'CYCLE' | 'MATRIX'>(initialViewMode || 'CYCLE');

  // Auto-cycle through dimensions
  useEffect(() => {
    if (!isAutoPlaying || activeDimension || viewMode === 'MATRIX') return;
    const timer = setInterval(() => {
      setCycleIndex(prev => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, activeDimension, viewMode]);

  const highlightedId = activeDimension || FIVE_DIMENSIONS_CYCLE[cycleIndex];
  const highlighted = FIVE_DIMENSIONS[highlightedId];

  // Pentagon vertex positions (CSS percentages for responsive layout)
  // Top center, then clockwise
  const pentagonPositions = useMemo(() => [
    { x: 50, y: 8 },    // Top (Agent Differentiation)
    { x: 88, y: 38 },   // Top-right (Peer Communication)
    { x: 74, y: 82 },   // Bottom-right (Human-AI Fusion)
    { x: 26, y: 82 },   // Bottom-left (Multimodal Fusion)
    { x: 12, y: 38 },   // Top-left (Deep Reasoning)
  ], []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-xl overflow-hidden"
    >
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 transition-colors duration-1000"
          style={{ background: `radial-gradient(circle, ${highlighted.color}40, transparent 70%)` }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,6,23,0.8)_100%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <header className="flex-none px-6 py-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-white/10">
              <Orbit className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400">
                Five Dimensions of Depth
              </h1>
              <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                Philosophical Genome of the YYC³ AI Family
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all",
                isAutoPlaying 
                  ? "bg-violet-500/10 text-violet-400 border-violet-500/30" 
                  : "bg-black/20 text-slate-500 border-white/5"
              )}
            >
              <RotateCw className={cn("w-3 h-3", isAutoPlaying && "animate-spin")} />
              {isAutoPlaying ? 'AUTO' : 'MANUAL'}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'CYCLE' ? 'MATRIX' : 'CYCLE')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all",
                viewMode === 'MATRIX' 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                  : "bg-black/20 text-slate-500 border-white/5"
              )}
            >
              <Grid3x3 className="w-3 h-3" />
              {viewMode === 'MATRIX' ? '5D×7S' : 'MATRIX'}
            </button>
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Matrix View (full width when active) */}
          {viewMode === 'MATRIX' ? (
            <div className="flex-1 overflow-y-auto p-6 lg:p-10">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white mb-1">Dimension × Stage Matrix</h2>
                  <p className="text-xs text-slate-500 font-mono">五维深度 × 创生七步曲 交叉热力图 — Intensity: 0=Absent, 1=Supporting, 2=Active, 3=Dominant</p>
                </div>
                <DimensionStageMatrix onNavigateToMember={(roleId) => {
                  if (onNavigateToMember) {
                    onClose();
                    onNavigateToMember(roleId);
                  }
                }} />
              </div>
            </div>
          ) : (
          <>
          {/* Left: Pentagon Cycle Visualization */}
          <div className="flex-1 relative flex items-center justify-center p-4 lg:p-8 min-h-[400px]">
            {/* Pentagon Container */}
            <div className="relative w-full max-w-[500px] aspect-square">
              
              {/* SVG Connection Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <defs>
                  {FIVE_DIMENSIONS_CYCLE.map((dimId, i) => {
                    const dim = FIVE_DIMENSIONS[dimId];
                    const nextI = (i + 1) % 5;
                    return (
                      <linearGradient key={`grad-${i}`} id={`line-grad-${i}`} 
                        x1={pentagonPositions[i].x + '%'} y1={pentagonPositions[i].y + '%'}
                        x2={pentagonPositions[nextI].x + '%'} y2={pentagonPositions[nextI].y + '%'}
                      >
                        <stop offset="0%" stopColor={dim.color} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={FIVE_DIMENSIONS[FIVE_DIMENSIONS_CYCLE[nextI]].color} stopOpacity="0.6" />
                      </linearGradient>
                    );
                  })}
                </defs>
                
                {/* Pentagon edges */}
                {FIVE_DIMENSIONS_CYCLE.map((dimId, i) => {
                  const nextI = (i + 1) % 5;
                  const from = pentagonPositions[i];
                  const to = pentagonPositions[nextI];
                  const isActive = dimId === highlightedId || FIVE_DIMENSIONS_CYCLE[nextI] === highlightedId;
                  
                  return (
                    <g key={`edge-${i}`}>
                      <line
                        x1={from.x} y1={from.y}
                        x2={to.x} y2={to.y}
                        stroke={`url(#line-grad-${i})`}
                        strokeWidth={isActive ? 0.6 : 0.3}
                        strokeDasharray={isActive ? "none" : "2 2"}
                        className="transition-all duration-500"
                      />
                      {/* Flow arrow (small triangle at midpoint) */}
                      {isActive && (
                        <motion.circle
                          r="0.8"
                          fill={FIVE_DIMENSIONS[dimId].color}
                          initial={{ opacity: 0 }}
                          animate={{ 
                            opacity: [0, 1, 0],
                            cx: [from.x, to.x],
                            cy: [from.y, to.y],
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                    </g>
                  );
                })}

                {/* Center label */}
                <text x="50" y="47" textAnchor="middle" fill="white" opacity="0.15" fontSize="3.5" fontFamily="monospace" fontWeight="bold">
                  CLOSED-LOOP
                </text>
                <text x="50" y="53" textAnchor="middle" fill="white" opacity="0.15" fontSize="3.5" fontFamily="monospace" fontWeight="bold">
                  ECOSYSTEM
                </text>
              </svg>

              {/* Dimension Nodes */}
              {FIVE_DIMENSIONS_CYCLE.map((dimId, i) => {
                const dim = FIVE_DIMENSIONS[dimId];
                const pos = pentagonPositions[i];
                const isActive = dimId === highlightedId;

                return (
                  <motion.button
                    key={dimId}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 transition-all duration-300 group z-10",
                    )}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    onClick={() => {
                      setActiveDimension(dimId === activeDimension ? null : dimId);
                      setIsAutoPlaying(false);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Node Circle */}
                    <motion.div
                      className={cn(
                        "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-lg",
                      )}
                      style={{
                        background: isActive 
                          ? `linear-gradient(135deg, ${dim.color}30, ${dim.colorEnd}20)` 
                          : 'rgba(15, 23, 42, 0.8)',
                        borderColor: isActive ? dim.color : 'rgba(255,255,255,0.1)',
                        boxShadow: isActive ? `0 0 30px ${dim.color}30` : 'none',
                        color: isActive ? dim.color : '#94a3b8',
                      }}
                      animate={isActive ? { 
                        boxShadow: [`0 0 20px ${dim.color}20`, `0 0 40px ${dim.color}40`, `0 0 20px ${dim.color}20`]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {ICON_MAP[dim.icon]}
                    </motion.div>

                    {/* Label */}
                    <div className="text-center max-w-[100px]">
                      <div
                        className={cn(
                          "text-[10px] md:text-xs font-bold transition-colors duration-300 whitespace-nowrap",
                        )}
                        style={{ color: isActive ? dim.color : '#94a3b8' }}
                      >
                        {dim.name}
                      </div>
                      <div className="text-[8px] text-slate-600 font-mono hidden md:block">
                        {dim.subtitle}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right: Detail Panel */}
          <div className="flex-1 lg:max-w-[480px] border-t lg:border-t-0 lg:border-l border-white/5 bg-black/20 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={highlightedId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 lg:p-8 space-y-6"
              >
                {/* Dimension Header */}
                <div className="flex items-start gap-4">
                  <div 
                    className="p-3 rounded-xl border flex-none"
                    style={{ 
                      background: `linear-gradient(135deg, ${highlighted.color}20, transparent)`,
                      borderColor: `${highlighted.color}40`,
                      color: highlighted.color,
                    }}
                  >
                    {ICON_MAP_LARGE[highlighted.icon]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{highlighted.name}</h2>
                    <p className="text-xs font-mono text-slate-500">{highlighted.subtitle}</p>
                    <div 
                      className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full border"
                      style={{ 
                        color: highlighted.color, 
                        borderColor: `${highlighted.color}40`,
                        background: `${highlighted.color}10`,
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                      {highlighted.subtitle}
                    </div>
                  </div>
                </div>

                {/* Philosophy */}
                <section className="space-y-2">
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Philosophy
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed pl-4 border-l-2" style={{ borderColor: `${highlighted.color}60` }}>
                    {highlighted.description}
                  </p>
                </section>

                {/* Family Practice */}
                <section className="space-y-2">
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    Family Practice
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed pl-4 border-l-2 border-white/10">
                    {highlighted.description}
                  </p>
                </section>

                {/* Five-in-One Mapping */}
                <section className="space-y-2">
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Five-in-One Mapping
                  </h3>
                  <div 
                    className="p-4 rounded-xl border"
                    style={{ 
                      background: `linear-gradient(135deg, ${highlighted.color}08, transparent)`,
                      borderColor: `${highlighted.color}20`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span 
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ 
                          background: `${highlighted.color}20`, 
                          color: highlighted.color 
                        }}
                      >
                        {highlighted.subtitle}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-xs text-slate-400 font-mono">
                        {highlighted.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {highlighted.description}
                    </p>
                  </div>
                </section>

                {/* Flow Connection */}
                <section className="space-y-2">
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Cycle Flow
                  </h3>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/5">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-none"
                      style={{ background: `${highlighted.color}20`, color: highlighted.color }}
                    >
                      {ICON_MAP[highlighted.icon] && React.cloneElement(ICON_MAP[highlighted.icon] as React.ReactElement, { className: 'w-4 h-4' })}
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <ChevronRight className="w-3 h-3" />
                      <ChevronRight className="w-3 h-3 -ml-1.5" />
                      <ChevronRight className="w-3 h-3 -ml-1.5" />
                    </div>
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-none"
                      style={{ 
                        background: `${FIVE_DIMENSIONS[highlighted.flowsTo].color}20`, 
                        color: FIVE_DIMENSIONS[highlighted.flowsTo].color 
                      }}
                    >
                      {ICON_MAP[FIVE_DIMENSIONS[highlighted.flowsTo].icon] && React.cloneElement(ICON_MAP[FIVE_DIMENSIONS[highlighted.flowsTo].icon] as React.ReactElement, { className: 'w-4 h-4' })}
                    </div>
                    <div className="text-xs text-slate-500">
                      <span style={{ color: highlighted.color }}>{highlighted.name}</span>
                      {' '}promotes{' '}
                      <span style={{ color: FIVE_DIMENSIONS[highlighted.flowsTo].color }}>
                        {FIVE_DIMENSIONS[highlighted.flowsTo].name}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Quick Dimension Selector (Mobile-friendly) */}
                <div className="pt-4 border-t border-white/5">
                  <div className="flex gap-2 flex-wrap">
                    {FIVE_DIMENSIONS_CYCLE.map((dimId) => {
                      const dim = FIVE_DIMENSIONS[dimId];
                      const isThis = dimId === highlightedId;
                      return (
                        <button
                          key={dimId}
                          onClick={() => {
                            setActiveDimension(dimId);
                            setIsAutoPlaying(false);
                          }}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all",
                          )}
                          style={{
                            background: isThis ? `${dim.color}15` : 'transparent',
                            borderColor: isThis ? `${dim.color}40` : 'rgba(255,255,255,0.05)',
                            color: isThis ? dim.color : '#64748b',
                          }}
                        >
                          {React.cloneElement(
                            (ICON_MAP[dim.icon] || <span />) as React.ReactElement, 
                            { className: 'w-3 h-3' }
                          )}
                          {highlighted.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          </>
          )}
        </div>

        {/* Footer */}
        <footer className="flex-none px-6 py-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
          <div className="text-[10px] font-mono text-slate-600">
            Core Logic: Five Dimensions form a closed-loop ecosystem
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {FIVE_DIMENSIONS_CYCLE.map((dimId, i) => (
                <div
                  key={dimId}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: dimId === highlightedId ? FIVE_DIMENSIONS[dimId].color : 'rgba(255,255,255,0.1)',
                    boxShadow: dimId === highlightedId ? `0 0 6px ${FIVE_DIMENSIONS[dimId].color}` : 'none',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-slate-600">
              YYC³ Philosophical Genome v1.0
            </span>
          </div>
        </footer>
      </div>
    </motion.div>
  );
};