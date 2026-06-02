/**
 * file: PhilosophyFramework.tsx
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
 * YYC³ AI Family - PhilosophyFramework Panel
 * 
 * Visualizes the "五高五标五化" (15 Pillars of Excellence)
 * with their Five-Dimension mappings, paradigm shifts, and symbiosis pillars.
 * 
 * Accessible via /philosophy command or header button.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Shield, Zap, Lock, Expand, Wrench, Ruler, FileCheck, Cog, 
  Brain, Eye, GitBranch, BookOpen, Hammer, Binary, Network,
  ChevronRight, Sparkles, ArrowRight, Heart
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { 
  PhilosophyPillar, PillarCategory, CATEGORY_LABELS,
  FIVE_HIGHS, FIVE_STANDARDS, FIVE_TRANSFORMATIONS,
  PARADIGM_SHIFTS, SYMBIOSIS_PILLARS, CORE_SLOGANS
} from '../../types/philosophy-framework';
import { FIVE_DIMENSIONS, FiveDimensionId } from '../../types/family-manifest';

// ==========================================
// Icon mapping
// ==========================================
const ICON_MAP: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Lock: <Lock className="w-4 h-4" />,
  Expand: <Expand className="w-4 h-4" />,
  Wrench: <Wrench className="w-4 h-4" />,
  Ruler: <Ruler className="w-4 h-4" />,
  FileCheck: <FileCheck className="w-4 h-4" />,
  Cog: <Cog className="w-4 h-4" />,
  Brain: <Brain className="w-4 h-4" />,
  Eye: <Eye className="w-4 h-4" />,
  GitBranch: <GitBranch className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  Hammer: <Hammer className="w-4 h-4" />,
  Binary: <Binary className="w-4 h-4" />,
  Network: <Network className="w-4 h-4" />,
};

// ==========================================
// Pillar Card Component
// ==========================================
const PillarCard: React.FC<{
  pillar: PhilosophyPillar;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ pillar, isExpanded, onToggle }) => {
  const dim = FIVE_DIMENSIONS[pillar.dimensionMapping];
  
  return (
    <motion.div
      layout
      className={cn(
        "border rounded-lg overflow-hidden cursor-pointer transition-all",
        isExpanded ? "col-span-full" : ""
      )}
      style={{ 
        borderColor: `${pillar.color}30`,
        background: isExpanded ? `${pillar.color}08` : 'transparent',
      }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 p-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-none"
          style={{ background: `${pillar.color}15`, color: pillar.color }}
        >
          {ICON_MAP[pillar.icon] || <Sparkles className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white">{pillar.name}</span>
            <span className="text-[8px] font-mono text-slate-500">{pillar.englishName}</span>
          </div>
          <div className="text-[9px] text-slate-500 truncate">{pillar.metaphor}</div>
        </div>
        <div 
          className="text-[7px] font-mono px-1.5 py-0.5 rounded-full flex-none"
          style={{ color: dim.color, background: `${dim.color}15` }}
        >
          {dim.name.substring(0, 6)}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          className="text-slate-600 flex-none"
        >
          <ChevronRight className="w-3 h-3" />
        </motion.div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: `${pillar.color}15` }}>
              <p className="text-[10px] text-slate-300 mt-2 leading-relaxed">
                {pillar.philosophy}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pillar.technicalPractice.split('、').map((practice, i) => (
                  <span 
                    key={i}
                    className="text-[8px] font-mono px-2 py-0.5 rounded-full border"
                    style={{ borderColor: `${pillar.color}25`, color: pillar.color }}
                  >
                    {practice}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] text-slate-600 font-mono">五维映射:</span>
                <span className="text-[9px]" style={{ color: dim.color }}>
                  {dim.name} ({pillar.metaphor})
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==========================================
// Category Section
// ==========================================
const CategorySection: React.FC<{
  category: PillarCategory;
  pillars: PhilosophyPillar[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}> = ({ category, pillars, expandedId, onToggle }) => {
  const label = CATEGORY_LABELS[category];
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full" style={{ background: label.color }} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">{label.name}</span>
            <span className="text-[9px] font-mono text-slate-500">{label.englishName}</span>
          </div>
          <div className="text-[9px] text-slate-600">{label.description}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {pillars.map(pillar => (
          <PillarCard
            key={pillar.id}
            pillar={pillar}
            isExpanded={expandedId === pillar.id}
            onToggle={() => onToggle(expandedId === pillar.id ? '' : pillar.id)}
          />
        ))}
      </div>
    </div>
  );
};

// ==========================================
// Main Component
// ==========================================
interface PhilosophyFrameworkProps {
  onClose: () => void;
}

export const PhilosophyFramework: React.FC<PhilosophyFrameworkProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'pillars' | 'paradigm' | 'symbiosis'>('pillars');
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-5xl max-h-[90vh] bg-slate-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-violet-400 to-cyan-400">
              {CORE_SLOGANS.primary}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-slate-500">PHILOSOPHY_FRAMEWORK</span>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-500">
                {CORE_SLOGANS.philosophy}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Brand Banner */}
        <div className="px-5 py-3 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-amber-400/80 font-mono">{CORE_SLOGANS.brand}</span>
              <span className="text-[9px] text-slate-600 font-mono hidden sm:inline">{CORE_SLOGANS.english.subtitle}</span>
            </div>
            <span className="text-[10px] text-cyan-500/60 font-mono">{CORE_SLOGANS.motto}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-4">
          {[
            { id: 'pillars' as const, label: '五高五标五化', count: 15 },
            { id: 'paradigm' as const, label: '范式跃迁', count: 5 },
            { id: 'symbiosis' as const, label: '共生三柱', count: 3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-mono transition-all",
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-[9px] opacity-50">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {activeTab === 'pillars' && (
            <>
              <CategorySection
                category="FIVE_HIGHS"
                pillars={FIVE_HIGHS}
                expandedId={expandedPillar}
                onToggle={setExpandedPillar}
              />
              <CategorySection
                category="FIVE_STANDARDS"
                pillars={FIVE_STANDARDS}
                expandedId={expandedPillar}
                onToggle={setExpandedPillar}
              />
              <CategorySection
                category="FIVE_TRANSFORMATIONS"
                pillars={FIVE_TRANSFORMATIONS}
                expandedId={expandedPillar}
                onToggle={setExpandedPillar}
              />

              {/* Cross-Reference Matrix */}
              <div className="mt-6 pt-4 border-t border-white/5">
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">
                  Cross-Reference: Pillars x Dimensions
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {(['TIME', 'RELATION', 'EVENT', 'SPACE', 'ATTRIBUTE'] as FiveDimensionId[]).map(dimId => {
                    const dim = FIVE_DIMENSIONS[dimId];
                    const mapped = [...FIVE_HIGHS, ...FIVE_STANDARDS, ...FIVE_TRANSFORMATIONS].filter(p => p.dimensionMapping === dimId);
                    return (
                      <div key={dimId} className="rounded-lg border p-2" style={{ borderColor: `${dim.color}15`, background: `${dim.color}03` }}>
                        <div className="text-[9px] font-mono mb-1.5" style={{ color: dim.color }}>{dim.name}</div>
                        <div className="space-y-1">
                          {mapped.map(p => (
                            <div key={p.id} className="text-[8px] text-slate-500 flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full" style={{ background: CATEGORY_LABELS[p.category].color }} />
                              {p.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'paradigm' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-sm text-white mb-1">从"人机交互"到"人机一体"的哲学跃迁</h3>
                <p className="text-[10px] text-slate-500">Human-AI Interaction → Human-AI Integration</p>
              </div>
              
              <div className="space-y-3">
                {PARADIGM_SHIFTS.map((shift, i) => (
                  <motion.div
                    key={shift.dimension}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg border border-white/5 hover:bg-white/5 transition-all"
                  >
                    <div className="w-20 text-right">
                      <span className="text-[10px] text-slate-400">{shift.dimension}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-[10px] text-red-400/60 px-2 py-1 bg-red-500/5 rounded border border-red-500/10">
                        {shift.traditional}
                      </span>
                      <ArrowRight className="w-4 h-4 text-emerald-500/50 flex-none" />
                      <span className="text-[10px] text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                        {shift.newParadigm}
                      </span>
                    </div>
                    <div className="text-[9px] text-amber-400/60 font-mono hidden sm:block">
                      {shift.essence}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'symbiosis' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-sm text-white mb-1">人机共生的三大支柱</h3>
                <p className="text-[10px] text-slate-500">The Three Pillars of Human-AI Symbiosis</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SYMBIOSIS_PILLARS.map((pillar, i) => (
                  <motion.div
                    key={pillar.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="p-4 rounded-xl border text-center"
                    style={{ borderColor: `${pillar.color}25`, background: `${pillar.color}05` }}
                  >
                    <div 
                      className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                      style={{ background: `${pillar.color}15` }}
                    >
                      <Heart className="w-5 h-5" style={{ color: pillar.color }} />
                    </div>
                    <h4 className="text-sm text-white mb-2">{pillar.name}</h4>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">{pillar.description}</p>
                    <div className="text-[9px] font-mono px-3 py-1.5 rounded-lg bg-black/30 border border-white/5" style={{ color: pillar.color }}>
                      {pillar.mechanism}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Vision Statement */}
              <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-violet-500/5 via-rose-500/5 to-cyan-500/5 border border-white/5 text-center">
                <p className="text-sm text-slate-300 leading-relaxed mb-2">
                  {CORE_SLOGANS.technical}
                </p>
                <p className="text-[11px] text-amber-400/70 font-mono">
                  "{CORE_SLOGANS.primary}"
                </p>
                <div className="mt-3 text-[9px] text-slate-600">
                  一言一语一华章，人机共生谱新篇
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[9px] font-mono text-slate-600">
            YYC3 AI Family | {CORE_SLOGANS.familyName} | V2.0.0
          </span>
          <span className="text-[9px] font-mono text-slate-600">
            {CORE_SLOGANS.english.brand}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
