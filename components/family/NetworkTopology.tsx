/**
 * file: NetworkTopology.tsx
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
 * YYC³ AI Family - NetworkTopology (网络拓扑图 + 哲学基因叠加层)
 *
 * Visualizes the physical network architecture with an optional
 * "Philosophical Genome Overlay" that colors nodes and edges
 * based on each member's Five Dimension attribution.
 */

import { cn } from '@/components/ui/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Brain,
  Database,
  Eye, EyeOff,
  Globe,
  Layers,
  Lock,
  MessageCircle,
  Orbit,
  Shield,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import {
  FAMILY_ROLES,
  FIVE_DIMENSIONS,
  FIVE_DIMENSIONS_CYCLE,
  ROLE_DIMENSION_MAP,
  RoleId
} from '../../types/family-manifest';

// ==========================================
// Node Data with Dimension Mapping — 九层家人档案 v2.0 八位家人
// 业务层 4 人 + 总指挥 1 人 + 守护层 3 人 = 8 人
// ==========================================
interface TopologyNode {
  id: string;
  name: string;
  ip: string;
  role: string;          // 角色头衔（中文，e.g. "导航员"）
  displayName: string;   // 家人中文全名（e.g. "言启·千行"）
  roleId: RoleId;
  icon: React.ReactNode;
  x: number;  // percentage position
  y: number;
}

const NODES: TopologyNode[] = [
  // ---- 业务层（右侧 / 顶部 / 底部 四方位） ----
  { id: 'navigator', name: 'Navigator Node', ip: '192.168.50.21', role: FAMILY_ROLES.NAVIGATOR.roleTitle, displayName: FAMILY_ROLES.NAVIGATOR.name, roleId: 'NAVIGATOR', icon: <Orbit className="w-5 h-5" />, x: 78, y: 18 },
  { id: 'thinker', name: 'Thinker Node', ip: '192.168.50.22', role: FAMILY_ROLES.THINKER.roleTitle, displayName: FAMILY_ROLES.THINKER.name, roleId: 'THINKER', icon: <Brain className="w-5 h-5" />, x: 78, y: 42 },
  { id: 'prophet', name: 'Prophet Node', ip: '192.168.50.23', role: FAMILY_ROLES.PROPHET.roleTitle, displayName: FAMILY_ROLES.PROPHET.name, roleId: 'PROPHET', icon: <Eye className="w-5 h-5" />, x: 78, y: 66 },
  { id: 'bole', name: 'Bole Node', ip: '192.168.50.24', role: FAMILY_ROLES.BOLE.roleTitle, displayName: FAMILY_ROLES.BOLE.name, roleId: 'BOLE', icon: <Layers className="w-5 h-5" />, x: 78, y: 88 },
  // ---- 总指挥（正中心） ----
  { id: 'meta-oracle', name: 'Meta-Oracle Core', ip: '192.168.50.10', role: FAMILY_ROLES.META_ORACLE.roleTitle, displayName: FAMILY_ROLES.META_ORACLE.name, roleId: 'META_ORACLE', icon: <Globe className="w-5 h-5" />, x: 50, y: 50 },
  // ---- 守护层（左侧三方位） ----
  { id: 'guardian', name: 'Guardian Gateway', ip: '192.168.50.11', role: FAMILY_ROLES.GUARDIAN.roleTitle, displayName: FAMILY_ROLES.GUARDIAN.name, roleId: 'GUARDIAN', icon: <Shield className="w-5 h-5" />, x: 22, y: 18 },
  { id: 'master', name: 'Master Audit', ip: '192.168.50.12', role: FAMILY_ROLES.MASTER.roleTitle, displayName: FAMILY_ROLES.MASTER.name, roleId: 'MASTER', icon: <Lock className="w-5 h-5" />, x: 22, y: 50 },
  { id: 'creative', name: 'Creative Studio', ip: '192.168.50.13', role: FAMILY_ROLES.CREATIVE.roleTitle, displayName: FAMILY_ROLES.CREATIVE.name, roleId: 'CREATIVE', icon: <Database className="w-5 h-5" />, x: 22, y: 82 },
];

// 五维评估图标映射（按档案 §五维评估：时间/空间/属性/事件/关联）
// 键为 FiveDimensionDef.icon 字段值（lucide 图标名）
const DIM_ICON_MAP: Record<string, React.ReactNode> = {
  'Clock': <Brain className="w-3 h-3" />,
  'HardDrive': <Layers className="w-3 h-3" />,
  'Tags': <Eye className="w-3 h-3" />,
  'Activity': <MessageCircle className="w-3 h-3" />,
  'Share2': <Users className="w-3 h-3" />,
};

// Connection edges between nodes
interface TopologyEdge {
  from: string;
  to: string;
  label?: string;
  isDimensionFlow?: boolean;
}

const BASE_EDGES: TopologyEdge[] = [
  // 业务层 → 总指挥（META_ORACLE）
  { from: 'meta-oracle', to: 'navigator', label: '意图路由' },
  { from: 'meta-oracle', to: 'thinker', label: '洞察请求' },
  { from: 'meta-oracle', to: 'prophet', label: '预测请求' },
  { from: 'meta-oracle', to: 'bole', label: '推荐请求' },
  // 守护层 → 总指挥（META_ORACLE）
  { from: 'guardian', to: 'meta-oracle', label: '安全审计' },
  { from: 'master', to: 'meta-oracle', label: '质量报告' },
  { from: 'creative', to: 'meta-oracle', label: '创意交付' },
];

// Generate dimension flow edges based on FIVE_DIMENSIONS_CYCLE
function getDimensionFlowEdges(): TopologyEdge[] {
  const edges: TopologyEdge[] = [];
  const roleToNode: Record<string, string> = {};

  // Map roles to nodes
  for (const node of NODES) {
    roleToNode[node.roleId] = node.id;
  }

  // For each dimension, find primary carriers and create edges between them
  FIVE_DIMENSIONS_CYCLE.forEach((dimId, i) => {
    const nextDimId = FIVE_DIMENSIONS_CYCLE[(i + 1) % 5];

    // Find primary carriers of this dimension and next
    const currentCarriers = Object.entries(ROLE_DIMENSION_MAP)
      .filter(([_, attr]) => attr.primary === dimId)
      .map(([roleId]) => roleId as RoleId);

    const nextCarriers = Object.entries(ROLE_DIMENSION_MAP)
      .filter(([_, attr]) => attr.primary === nextDimId)
      .map(([roleId]) => roleId as RoleId);

    // Create flow edges between carriers
    for (const curr of currentCarriers) {
      for (const next of nextCarriers) {
        const fromNode = roleToNode[curr];
        const toNode = roleToNode[next];
        if (fromNode && toNode && fromNode !== toNode) {
          edges.push({ from: fromNode, to: toNode, isDimensionFlow: true });
        }
      }
    }
  });

  return edges;
}

// ==========================================
// Component
// ==========================================
export const NetworkTopology: React.FC<{
  onClose: () => void;
  onNavigateToMember?: (roleId: RoleId) => void;
}> = ({ onClose, onNavigateToMember }) => {
  const [showDimensionOverlay, setShowDimensionOverlay] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const dimensionEdges = getDimensionFlowEdges();

  const getNodeById = (id: string) => NODES.find(n => n.id === id);

  const getDimColor = (roleId: RoleId): string => {
    const attr = ROLE_DIMENSION_MAP[roleId];
    return FIVE_DIMENSIONS[attr.primary].color;
  };

  const getDimInfo = (roleId: RoleId) => {
    const attr = ROLE_DIMENSION_MAP[roleId];
    const dim = FIVE_DIMENSIONS[attr.primary];
    return { dim, attr };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-40 bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden"
    >
      {/* Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-50">
        {/* Dimension Overlay Toggle */}
        <button
          onClick={() => setShowDimensionOverlay(!showDimensionOverlay)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all",
            showDimensionOverlay
              ? "bg-violet-500/15 text-violet-400 border-violet-500/40"
              : "bg-black/30 text-slate-500 border-white/10 hover:bg-white/5"
          )}
        >
          {showDimensionOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <Orbit className="w-3 h-3" />
          {showDimensionOverlay ? '5D_OVERLAY_ON' : '5D_OVERLAY'}
        </button>

        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <span className="font-mono text-xs border border-slate-700 px-3 py-1.5 rounded-lg hover:bg-white/10">[CLOSE_VIEW]</span>
        </button>
      </div>

      <div className="relative w-full max-w-5xl aspect-[16/10] bg-slate-900/50 rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Dimension Overlay Ambient Glow */}
        <AnimatePresence>
          {showDimensionOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {NODES.map(node => {
                const color = getDimColor(node.roleId);
                return (
                  <div
                    key={`glow-${node.id}`}
                    className="absolute w-32 h-32 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
                    style={{
                      left: `${node.x}%`, top: `${node.y}%`,
                      background: `${color}15`,
                    }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* SVG Layer: Edges */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62.5" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Gradient definitions for dimension flow edges */}
            {dimensionEdges.map((edge, i) => {
              const fromNode = getNodeById(edge.from);
              const toNode = getNodeById(edge.to);
              if (!fromNode || !toNode) return null;
              const fromColor = getDimColor(fromNode.roleId);
              const toColor = getDimColor(toNode.roleId);
              return (
                <linearGradient key={`dim-grad-${i}`} id={`dim-edge-${i}`}
                  x1={`${fromNode.x}%`} y1={`${fromNode.y}%`}
                  x2={`${toNode.x}%`} y2={`${toNode.y}%`}
                >
                  <stop offset="0%" stopColor={fromColor} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={toColor} stopOpacity="0.8" />
                </linearGradient>
              );
            })}
          </defs>

          {/* Base Infrastructure Edges */}
          {BASE_EDGES.map((edge, i) => {
            const from = getNodeById(edge.from);
            const to = getNodeById(edge.to);
            if (!from || !to) return null;

            const isHighlighted = hoveredNode === from.id || hoveredNode === to.id;

            return (
              <g key={`base-edge-${i}`}>
                <line
                  x1={from.x} y1={from.y * 0.625}
                  x2={to.x} y2={to.y * 0.625}
                  stroke={showDimensionOverlay ? 'rgba(255,255,255,0.05)' : (isHighlighted ? 'rgba(16,185,129,0.6)' : 'rgba(16,185,129,0.2)')}
                  strokeWidth={isHighlighted ? 0.3 : 0.15}
                  strokeDasharray={showDimensionOverlay ? "1 2" : "none"}
                  className="transition-all duration-500"
                />
                {!showDimensionOverlay && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) * 0.625 / 2 - 1}
                    textAnchor="middle"
                    fill="rgba(148,163,184,0.4)"
                    fontSize="1.5"
                    fontFamily="monospace"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Dimension Flow Edges (Overlay) */}
          <AnimatePresence>
            {showDimensionOverlay && dimensionEdges.map((edge, i) => {
              const from = getNodeById(edge.from);
              const to = getNodeById(edge.to);
              if (!from || !to) return null;

              return (
                <motion.g
                  key={`dim-edge-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <line
                    x1={from.x} y1={from.y * 0.625}
                    x2={to.x} y2={to.y * 0.625}
                    stroke={`url(#dim-edge-${i})`}
                    strokeWidth={0.4}
                    strokeDasharray="2 1"
                  />
                  {/* Animated flow particle */}
                  <motion.circle
                    r="0.6"
                    fill={getDimColor(from.roleId)}
                    animate={{
                      cx: [from.x, to.x],
                      cy: [from.y * 0.625, to.y * 0.625],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: i * 0.3,
                    }}
                  />
                </motion.g>
              );
            })}
          </AnimatePresence>

          {/* Gateway */}
          <g>
            <circle cx="22" cy="12.5" r="4" fill="none" stroke="rgba(16,185,129,0.4)" strokeWidth="0.3" />
            <text x="22" y="13.5" textAnchor="middle" fill="rgba(16,185,129,0.8)" fontSize="2.5" fontFamily="monospace">GW</text>
            <text x="22" y="20" textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="1.5" fontFamily="monospace">Huawei Enterprise</text>
          </g>

          {/* WAN */}
          <g>
            <text x="8" y="6" textAnchor="middle" fill="rgba(59,130,246,0.5)" fontSize="1.8" fontFamily="monospace">WAN</text>
            <line x1="8" y1="8" x2="18" y2="12.5" stroke="rgba(59,130,246,0.3)" strokeWidth="0.15" strokeDasharray="1 1" />
          </g>
        </svg>

        {/* Interactive Nodes */}
        {NODES.map((node) => {
          const { dim, attr } = getDimInfo(node.roleId);
          const role = FAMILY_ROLES[node.roleId];
          const isHovered = hoveredNode === node.id;
          const nodeColor = showDimensionOverlay ? dim.color : role.color;

          return (
            <motion.div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div
                className={cn(
                  "relative flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm border transition-all duration-300 cursor-pointer",
                  isHovered ? "shadow-xl" : "shadow-md"
                )}
                style={{
                  background: showDimensionOverlay
                    ? `linear-gradient(135deg, ${nodeColor}15, rgba(15,23,42,0.9))`
                    : 'rgba(30,41,59,0.8)',
                  borderColor: showDimensionOverlay
                    ? `${nodeColor}${isHovered ? '80' : '40'}`
                    : (isHovered ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'),
                  boxShadow: isHovered && showDimensionOverlay ? `0 0 20px ${nodeColor}20` : undefined,
                }}
                onClick={() => onNavigateToMember?.(node.roleId)}
              >
                {/* Node Icon */}
                <div
                  className="p-2 rounded-lg bg-black/30 flex-none"
                  style={{ color: nodeColor }}
                >
                  {node.icon}
                </div>

                {/* Node Info */}
                <div className="min-w-0">
                  <div className="font-bold text-sm text-white truncate" style={{ color: showDimensionOverlay ? nodeColor : undefined }}>
                    {node.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {node.ip} • {node.role}
                  </div>

                  {/* Dimension Badge (Overlay Mode) */}
                  <AnimatePresence>
                    {showDimensionOverlay && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1 flex items-center gap-1"
                      >
                        <span
                          className="inline-flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded-full border"
                          style={{
                            color: dim.color,
                            borderColor: `${dim.color}40`,
                            background: `${dim.color}10`,
                          }}
                        >
                          {DIM_ICON_MAP[dim.icon]}
                          {dim.subtitle}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Status Indicator */}
                <div className="ml-auto flex-none">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: showDimensionOverlay ? nodeColor : '#22c55e' }}
                  />
                </div>
              </div>

              {/* Hover Detail Popover */}
              <AnimatePresence>
                {isHovered && showDimensionOverlay && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 rounded-lg p-3 shadow-2xl z-50 min-w-[200px]"
                  >
                    <div className="text-[10px] font-bold mb-1" style={{ color: dim.color }}>
                      {dim.name} ({dim.subtitle})
                    </div>
                    <div className="text-[9px] text-slate-400 mb-2">
                      {attr.resonanceNote}
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-slate-500 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-white/5">Primary: {dim.subtitle}</span>
                      {attr.secondary.map(secId => (
                        <span key={secId} className="px-1.5 py-0.5 rounded bg-white/5">
                          {FIVE_DIMENSIONS[secId].subtitle}
                        </span>
                      ))}
                    </div>
                    <div className="text-[9px] text-amber-500/80 mt-2 font-mono">
                      Click to open detail panel
                    </div>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-l border-t border-white/10 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Gateway / Firewall Node (Fixed) */}
        <div className="absolute left-[22%] top-[20%] -translate-x-1/2 -translate-y-1/2">
          <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/50 shadow-lg flex flex-col items-center gap-1">
            <Shield className="w-6 h-6 text-emerald-400" />
            <div className="text-[10px] font-bold text-emerald-100">Firewall</div>
            <div className="text-[8px] font-mono text-emerald-500/60">ACTIVE</div>
          </div>
        </div>

        {/* WAN Entry Point */}
        <div className="absolute left-[8%] top-[10%] -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="p-2 rounded-full bg-blue-500/10 border border-blue-500/30">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-[9px] text-blue-300 mt-1">DDNS/VPN</div>
        </div>

        {/* Legend / Status Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 border-t border-white/5 p-3 flex justify-between items-center text-xs font-mono">
          <div className="flex gap-4">
            <span className="flex items-center gap-2 text-emerald-400"><Lock className="w-3 h-3" /> SECURE_TUNNEL</span>
            <span className="flex items-center gap-2 text-slate-400"><Database className="w-3 h-3" /> /volume1/family</span>
          </div>

          {/* Dimension Legend (when overlay is active) */}
          {showDimensionOverlay && (
            <div className="flex items-center gap-3">
              {FIVE_DIMENSIONS_CYCLE.map(dimId => {
                const dim = FIVE_DIMENSIONS[dimId];
                return (
                  <div key={dimId} className="flex items-center gap-1 text-[9px]" style={{ color: dim.color }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: dim.color }} />
                    {dim.subtitle}
                  </div>
                );
              })}
            </div>
          )}

          {!showDimensionOverlay && (
            <div className="text-slate-500">LATENCY: &lt;1ms (LOCAL)</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
