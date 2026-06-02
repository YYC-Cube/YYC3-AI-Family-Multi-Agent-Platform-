/**
 * file: panel-manager.ts
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
 * YYC³ AI Family - Panel Manager Type Definitions
 * 
 * Centralized panel/modal state management types
 * Replaces 15+ boolean state variables with a single union type
 */

import { RoleId } from './family-manifest';

/**
 * Panel Type Union
 * All possible panels/modals that can be displayed in FamilyDashboard
 */
export type PanelType = 
  | 'PROTOCOLS'           // SystemProtocols overlay
  | 'TOPOLOGY'            // NetworkTopology overlay
  | 'DEBUG'               // Debug panel (future)
  | 'BACKEND'             // BackendPanel configuration
  | 'FIVE_DIMENSIONS'     // FiveDimensionsPanel (5D Genome visualization)
  | 'PHILOSOPHY'          // PhilosophyFramework (五高五标五化)
  | 'TECH_AUDIT'          // TechAuditPanel (technical debt dashboard)
  | 'KNOWLEDGE_BASE'      // KnowledgeBasePanel (RAG search UI)
  | 'TERMINAL'            // IntegratedTerminal
  | 'MEMBER_DETAIL';      // MemberDetailPanel

/**
 * Panel State Interface
 * Encapsulates all panel-related state
 */
export interface PanelState {
  /** Currently active panel (null if all closed) */
  activePanel: PanelType | null;
  
  /** Context data for the active panel */
  panelContext?: {
    /** Member being viewed in MEMBER_DETAIL panel */
    viewingMemberId?: RoleId;
    
    /** Initial view mode for FIVE_DIMENSIONS panel */
    fiveDimensionsView?: 'CYCLE' | 'MATRIX';
  };
}

/**
 * Panel Manager Actions
 */
export type PanelAction =
  | { type: 'OPEN_PANEL'; panel: PanelType; context?: PanelState['panelContext'] }
  | { type: 'CLOSE_PANEL' }
  | { type: 'TOGGLE_PANEL'; panel: PanelType; context?: PanelState['panelContext'] };

/**
 * Panel Manager Return Type
 */
export interface UsePanelManagerReturn {
  /** Current panel state */
  state: PanelState;
  
  /** Open a specific panel with optional context */
  openPanel: (panel: PanelType, context?: PanelState['panelContext']) => void;
  
  /** Close the currently active panel */
  closePanel: () => void;
  
  /** Toggle a panel (close if already open, open if closed) */
  togglePanel: (panel: PanelType, context?: PanelState['panelContext']) => void;
  
  /** Check if a specific panel is currently active */
  isPanelActive: (panel: PanelType) => boolean;
  
  /** Get the current panel context */
  getContext: <K extends keyof NonNullable<PanelState['panelContext']>>(
    key: K
  ) => NonNullable<PanelState['panelContext']>[K] | undefined;
}
