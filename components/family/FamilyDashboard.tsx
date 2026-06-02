/**
 * file: FamilyDashboard.tsx
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

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemberCard } from './MemberCard';
import { CommandConsole } from './CommandConsole';
import { CommunicationLog } from './CommunicationLog';
import { SystemProtocols } from './SystemProtocols';
import { NetworkTopology } from './NetworkTopology';
import { MemberDetailPanel } from './MemberDetailPanel';
import { BackendPanel } from './BackendPanel';
import { FiveDimensionsPanel } from './FiveDimensionsPanel';
import { PhilosophyFramework } from './PhilosophyFramework';
import { TechAuditPanel } from './TechAuditPanel';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';
import { IntegratedTerminal } from './IntegratedTerminal';
import { useFamilySystem } from '../../hooks/useFamilySystem';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { usePanelManager } from '../../hooks/usePanelManager';
import { RoleId, FAMILY_ROLES } from '../../types/family-manifest';
import { Activity, Radio, Terminal as TerminalIcon, Network, Router, Zap, Wifi, WifiOff, Cable, Orbit, Users2, BookOpen, PanelLeftClose, PanelLeftOpen, ClipboardCheck, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export const FamilyDashboard: React.FC = () => {
  const { 
    members, 
    uiMessages, 
    isProcessing, 
    systemPulse, 
    peerMode,
    dispatchSignal,
    signals,
    updateMemberState,
    connectionStatus,
    pendingAction,
    consumeAction,
  } = useFamilySystem();

  const {
    status: backendStatus,
    isConnected,
    isMockMode,
    connectionLabel,
    connect,
    disconnect,
    reconfigure,
    config,
  } = useBackendConnection();

  // ========================================
  // NEW: Use centralized panel manager
  // ========================================
  const panelManager = usePanelManager();

  // Legacy state variables (keep only non-panel states)
  const [selectedMemberId, setSelectedMemberId] = useState<RoleId | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [avatarBarExpanded, setAvatarBarExpanded] = useState(false);
  const [headerToolsOpen, setHeaderToolsOpen] = useState(false);
  const headerToolsRef = useRef<HTMLDivElement>(null);
  
  const lastSignal = signals[signals.length - 1];
  const viewingMember = members.find(m => m.roleId === panelManager.viewingMemberId);
  
  // Connection state visual
  const connState = backendStatus?.state || connectionStatus?.state || 'MOCK_MODE';
  const connColor = connState === 'CONNECTED' ? 'text-emerald-500' : 
                    connState === 'CONNECTING' ? 'text-yellow-500' : 
                    connState === 'MOCK_MODE' ? 'text-blue-500' : 'text-slate-500';
  const connIcon = connState === 'CONNECTED' ? <Wifi className="w-3 h-3" /> : 
                   connState === 'CONNECTING' ? <Cable className="w-3 h-3 animate-pulse" /> :
                   <WifiOff className="w-3 h-3" />;

  // ---- Handle Pending UI Actions from useFamilySystem ----
  useEffect(() => {
    if (!pendingAction) return;

    switch (pendingAction.type) {
      case 'OPEN_5D_MATRIX':
        panelManager.openPanel('FIVE_DIMENSIONS', { fiveDimensionsView: 'MATRIX' });
        break;
      case 'OPEN_5D_PANEL':
        panelManager.openPanel('FIVE_DIMENSIONS', { fiveDimensionsView: 'CYCLE' });
        break;
      case 'NAVIGATE_TO_MEMBER':
        if (pendingAction.payload?.roleId) {
          panelManager.setViewingMemberId(pendingAction.payload.roleId);
        }
        break;
      case 'OPEN_TOPOLOGY':
        panelManager.openPanel('TOPOLOGY');
        break;
      case 'OPEN_PHILOSOPHY':
        panelManager.openPanel('PHILOSOPHY');
        break;
      case 'TOGGLE_PEER_MODE':
        // Handled inside useFamilySystem
        break;
    }

    consumeAction();
  }, [pendingAction, consumeAction, panelManager]);

  // Navigate to member from child components
  const handleNavigateToMember = (roleId: RoleId) => {
    panelManager.closePanel(); // Close any open panel
    setTimeout(() => panelManager.setViewingMemberId(roleId), 100);
  };

  // Close header dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerToolsRef.current && !headerToolsRef.current.contains(e.target as Node)) {
        setHeaderToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden relative">
      <AnimatePresence>
        {panelManager.showProtocols && <SystemProtocols onClose={panelManager.closeProtocols} />}
        {panelManager.showTopology && (
          <NetworkTopology 
            onClose={panelManager.closeTopology} 
            onNavigateToMember={handleNavigateToMember}
          />
        )}
        {panelManager.showFiveDimensions && (
          <FiveDimensionsPanel 
            onClose={panelManager.closeFiveDimensions} 
            onNavigateToMember={handleNavigateToMember}
            initialViewMode={panelManager.fiveDimensionsInitialView}
          />
        )}
        {panelManager.showPhilosophy && (
          <PhilosophyFramework onClose={panelManager.closePhilosophy} />
        )}
        {panelManager.showTechAudit && (
          <TechAuditPanel onClose={panelManager.closeTechAudit} />
        )}
        {panelManager.showBackendPanel && (
          <BackendPanel 
            status={backendStatus}
            config={config}
            onReconfigure={reconfigure}
            onConnect={connect}
            onDisconnect={disconnect}
            onClose={panelManager.closeBackendPanel}
          />
        )}
        {viewingMember && (
          <MemberDetailPanel 
            member={viewingMember} 
            onClose={() => panelManager.setViewingMemberId(null)}
            onUpdate={updateMemberState}
          />
        )}
        {panelManager.showKnowledgeBase && (
          <KnowledgeBasePanel 
            onClose={panelManager.closeKnowledgeBase}
            apiUrl={config.apiUrl}
          />
        )}
        {panelManager.showTerminal && (
          <IntegratedTerminal 
            onClose={panelManager.closeTerminal}
            apiUrl={config.apiUrl}
          />
        )}
      </AnimatePresence>

      {/* Ambient BG */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Header - Compact with dropdown tools */}
      <header className="relative z-30 flex-none px-4 md:px-6 py-2.5 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              YYC³ Mission Control
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono tracking-widest uppercase">
              <span>Sync: <span className="text-emerald-500">OPTIMAL</span></span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span>Protocol: <span className="text-emerald-500">v1.0</span></span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span className={cn("flex items-center gap-1", connColor)}>
                {connIcon}
                {connState === 'CONNECTED' ? 'LIVE' : connState === 'MOCK_MODE' ? 'MOCK' : connState}
              </span>
              <span className="w-1 h-1 bg-slate-700 rounded-full hidden sm:inline-block" />
              <span className={cn("hidden sm:flex items-center gap-1", peerMode ? "text-amber-500" : "text-slate-600")}>
                <Users2 className="w-3 h-3" />
                PEER:{peerMode ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Collapsible tools dropdown trigger */}
        <div className="flex items-center gap-2" ref={headerToolsRef}>
          {/* Bridge button always visible */}
          <button 
            onClick={() => panelManager.openBackendPanel()}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-mono border",
              connState === 'CONNECTED' 
                ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                : connState === 'MOCK_MODE'
                  ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30"
                  : "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            )}
          >
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">{connState === 'CONNECTED' ? 'BRIDGE_LIVE' : connState === 'MOCK_MODE' ? 'BRIDGE_MOCK' : 'BRIDGE'}</span>
            {backendStatus && backendStatus.latency >= 0 && (
              <span className="text-[9px] opacity-60">{backendStatus.latency}ms</span>
            )}
          </button>

          {/* Pulse indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5">
            <Radio className="w-3 h-3 text-emerald-500" />
            <span className="text-xs font-mono text-slate-400">PULSE: {systemPulse}</span>
          </div>

          {/* Dropdown toggle for all tool buttons */}
          <button
            onClick={() => setHeaderToolsOpen(!headerToolsOpen)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-mono border",
              headerToolsOpen
                ? "bg-white/10 text-white border-white/20"
                : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-200"
            )}
          >
            <span className="hidden sm:inline">TOOLS</span>
            {headerToolsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Dropdown panel */}
          <AnimatePresence>
            {headerToolsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-4 mt-1 z-50 bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 p-2 min-w-[280px]"
              >
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { label: '5D_GENOME', icon: <Orbit className="w-3.5 h-3.5" />, color: 'text-violet-400 hover:bg-violet-500/10', action: () => { panelManager.openPanel('FIVE_DIMENSIONS', { fiveDimensionsView: 'CYCLE' }); setHeaderToolsOpen(false); } },
                    { label: 'PHILOSOPHY', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-rose-400 hover:bg-rose-500/10', action: () => { panelManager.openPhilosophy(); setHeaderToolsOpen(false); } },
                    { label: 'NET_TOPOLOGY', icon: <Router className="w-3.5 h-3.5" />, color: 'text-blue-400 hover:bg-blue-500/10', action: () => { panelManager.openTopology(); setHeaderToolsOpen(false); } },
                    { label: 'SIGNAL_MON', icon: <Network className="w-3.5 h-3.5" />, color: showDebug ? 'text-emerald-300 bg-emerald-500/10' : 'text-slate-400 hover:bg-white/5', action: () => { setShowDebug(!showDebug); setHeaderToolsOpen(false); } },
                    { label: 'SYS_PROTO', icon: <TerminalIcon className="w-3.5 h-3.5" />, color: 'text-green-400 hover:bg-green-500/10', action: () => { panelManager.openProtocols(); setHeaderToolsOpen(false); } },
                    { label: 'TECH_AUDIT', icon: <ClipboardCheck className="w-3.5 h-3.5" />, color: 'text-amber-400 hover:bg-amber-500/10', action: () => { panelManager.openTechAudit(); setHeaderToolsOpen(false); } },
                    { label: 'KB_RIVER', icon: <Database className="w-3.5 h-3.5" />, color: 'text-cyan-400 hover:bg-cyan-500/10', action: () => { panelManager.openKnowledgeBase(); setHeaderToolsOpen(false); } },
                    { label: 'TERMINAL', icon: <TerminalIcon className="w-3.5 h-3.5" />, color: 'text-gray-400 hover:bg-gray-500/10', action: () => { panelManager.openTerminal(); setHeaderToolsOpen(false); } },
                  ].map(tool => (
                    <button
                      key={tool.label}
                      onClick={tool.action}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-mono",
                        tool.color
                      )}
                    >
                      {tool.icon}
                      <span>{tool.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content: Full width communication area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* ============================================ */}
        {/* Main Area: Communication Nexus              */}
        {/* ============================================ */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Chat History Area */}
          <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
             {uiMessages.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                 <div className="relative mb-6">
                   <Radio className="w-16 h-16 opacity-10" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-6 h-6 border-2 border-emerald-500/20 rounded-full animate-ping" />
                   </div>
                 </div>
                 <p className="text-sm font-mono text-slate-500 mb-2">SIGNAL_READY. AWAITING INPUT.</p>
                 <p className="text-[11px] font-mono text-slate-600/60 max-w-md leading-relaxed">
                   {connState === 'CONNECTED' 
                     ? 'Backend connected. Signals route through Bun Runtime.' 
                     : 'Running in mock mode. Click BRIDGE to configure backend.'}
                 </p>
                 <p className="text-[10px] font-mono mt-2 text-slate-600/40">
                   Peer Mode: {peerMode ? 'ON — Multi-agent dialogue enabled' : 'OFF — Single agent response'}
                 </p>
                 
                 {/* Quick action hints */}
                 <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-sm">
                   {[
                     { cmd: '/5d', label: 'Genome', color: 'text-violet-500/50 border-violet-500/20' },
                     { cmd: '/peer', label: 'Toggle', color: 'text-amber-500/50 border-amber-500/20' },
                     { cmd: '/kb', label: 'Search KB', color: 'text-cyan-500/50 border-cyan-500/20' },
                     { cmd: '/stats', label: 'Routing', color: 'text-emerald-500/50 border-emerald-500/20' },
                     { cmd: '/philosophy', label: 'Framework', color: 'text-rose-500/50 border-rose-500/20' },
                   ].map(hint => (
                     <span 
                       key={hint.cmd}
                       className={cn("text-[9px] font-mono px-2 py-1 rounded-md border bg-black/20", hint.color)}
                     >
                       {hint.cmd} — {hint.label}
                     </span>
                   ))}
                 </div>
               </div>
             ) : (
               <CommunicationLog messages={uiMessages} members={members} />
             )}

             {/* Protocol Monitor (Debug View) */}
             <AnimatePresence>
                {showDebug && lastSignal && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-black/80 border-t border-emerald-500/30 font-mono text-[10px] p-2 text-emerald-400 overflow-hidden"
                  >
                    <div className="flex justify-between items-center opacity-50 mb-1">
                       <span>LATEST_SIGNAL_PACKET [{connState}]</span>
                       <span>ID: {lastSignal.id.substring(0,8)}</span>
                    </div>
                    <pre className="whitespace-pre-wrap break-all opacity-80 max-h-32 overflow-y-auto">
                      {JSON.stringify(lastSignal, null, 2)}
                    </pre>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* Bottom Bar: Avatar strip + Input Console */}
          <div className="flex-none bg-slate-950/90 border-t border-white/[0.06] backdrop-blur-xl z-20">
            {/* Avatar Bar - horizontal, next to input */}
            <div className="flex items-stretch gap-0">
              {/* Collapsible Avatar Rail */}
              <div className={cn(
                "flex-none transition-all duration-300 ease-in-out overflow-hidden border-r border-white/[0.04]",
                avatarBarExpanded ? "w-[200px]" : "w-[56px]"
              )}>
                <div className="flex flex-col h-full">
                  {/* Toggle */}
                  <div className="flex items-center justify-between px-2 py-1.5">
                    {avatarBarExpanded && (
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Family</span>
                    )}
                    <button
                      onClick={() => setAvatarBarExpanded(!avatarBarExpanded)}
                      className="p-1 rounded-md hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors ml-auto"
                      title={avatarBarExpanded ? "Collapse" : "Expand"}
                    >
                      {avatarBarExpanded 
                        ? <PanelLeftClose className="w-3 h-3" /> 
                        : <PanelLeftOpen className="w-3 h-3" />
                      }
                    </button>
                  </div>

                  {/* Members - vertical scroll */}
                  <div className={cn(
                    "flex-1 overflow-y-auto overflow-x-hidden py-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
                    avatarBarExpanded ? "px-2" : "px-1.5"
                  )}>
                    {avatarBarExpanded ? (
                      /* Expanded: name + avatar rows */
                      <div className="space-y-0.5">
                        {members.map((member) => {
                          const role = FAMILY_ROLES[member.roleId];
                          const isSelected = member.roleId === selectedMemberId;
                          return (
                            <div
                              key={member.roleId}
                              onClick={() => setSelectedMemberId(member.roleId === selectedMemberId ? null : member.roleId)}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150",
                                isSelected 
                                  ? "bg-emerald-500/10 border border-emerald-500/30" 
                                  : "hover:bg-white/[0.04] border border-transparent"
                              )}
                            >
                              <div className={cn(
                                "w-7 h-7 rounded-full overflow-hidden ring-1.5 flex-none transition-all",
                                isSelected ? "ring-emerald-500" : "ring-white/10"
                              )}>
                                <ImageWithFallback 
                                  src={member.avatarUrl} 
                                  alt={role.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-mono text-slate-300 truncate">{role.name}</div>
                                <div className="text-[8px] font-mono text-slate-600 truncate">{member.currentActivity}</div>
                              </div>
                              {member.isOnline && (
                                <div className={cn("w-1.5 h-1.5 rounded-full flex-none", member.mood === 'FOCUSED' ? "bg-emerald-500" : "bg-blue-500")} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Collapsed: just avatars stacked */
                      <div className="flex flex-col items-center gap-1.5">
                        {members.map((member) => {
                          const role = FAMILY_ROLES[member.roleId];
                          const isSelected = member.roleId === selectedMemberId;
                          return (
                            <div 
                              key={member.roleId} 
                              onClick={() => setSelectedMemberId(member.roleId === selectedMemberId ? null : member.roleId)}
                              className="cursor-pointer relative group"
                              title={role.name}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-full overflow-hidden ring-2 transition-all duration-200",
                                isSelected ? "ring-emerald-500 scale-110" : "ring-white/10 group-hover:ring-white/30"
                              )}>
                                <ImageWithFallback 
                                  src={member.avatarUrl} 
                                  alt={role.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {member.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-slate-950 rounded-full flex items-center justify-center">
                                  <div className={cn("w-1.5 h-1.5 rounded-full", member.mood === 'FOCUSED' ? "bg-emerald-500" : "bg-blue-500")} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Console */}
              <div className="flex-1 min-w-0 p-3 md:p-4">
                <CommandConsole 
                  activeMemberId={selectedMemberId}
                  onSendCommand={(text) => dispatchSignal(text, selectedMemberId)}
                  isProcessing={isProcessing}
                  targetMemberAvatar={members.find(m => m.roleId === selectedMemberId)?.avatarUrl}
                  peerMode={peerMode}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};