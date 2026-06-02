/**
 * file: usePanelManager.ts
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
 * YYC³ AI Family - Panel Manager Hook
 * 
 * Centralized modal/panel state management
 * Replaces 15+ boolean state variables with a single unified system
 * 
 * Benefits:
 * - Single source of truth for panel state
 * - Type-safe panel context management
 * - Automatic mutual exclusion (only one panel can be open at a time)
 * - Clean API for opening/closing panels
 * - Backward-compatible boolean getters and setter functions
 */

import { useReducer, useCallback, useMemo } from 'react';
import { PanelType, PanelState, PanelAction, UsePanelManagerReturn } from '../types/panel-manager';
import { RoleId } from '../types/family-manifest';

/**
 * Initial Panel State
 */
const initialState: PanelState = {
  activePanel: null,
  panelContext: undefined,
};

/**
 * Panel Reducer
 * Handles all panel state transitions
 */
function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'OPEN_PANEL':
      return {
        activePanel: action.panel,
        panelContext: action.context,
      };
    
    case 'CLOSE_PANEL':
      return {
        activePanel: null,
        panelContext: undefined,
      };
    
    case 'TOGGLE_PANEL':
      // If the panel is already active, close it; otherwise, open it
      if (state.activePanel === action.panel) {
        return {
          activePanel: null,
          panelContext: undefined,
        };
      }
      return {
        activePanel: action.panel,
        panelContext: action.context,
      };
    
    default:
      return state;
  }
}

/**
 * Backward-Compatible Panel Manager Return Type
 */
export interface PanelManagerReturn extends UsePanelManagerReturn {
  // Backward-compatible boolean getters
  showProtocols: boolean;
  showTopology: boolean;
  showBackendPanel: boolean;
  showFiveDimensions: boolean;
  showPhilosophy: boolean;
  showTechAudit: boolean;
  showKnowledgeBase: boolean;
  showTerminal: boolean;
  viewingMemberId: RoleId | null;
  fiveDimensionsInitialView: 'CYCLE' | 'MATRIX';
  
  // Backward-compatible close functions (accept true/false for backward compat)
  closeProtocols: () => void;
  closeTopology: () => void;
  closeBackendPanel: () => void;
  closeFiveDimensions: () => void;
  closePhilosophy: () => void;
  closeTechAudit: () => void;
  closeKnowledgeBase: () => void;
  closeTerminal: () => void;
  
  // Backward-compatible open functions
  openProtocols: () => void;
  openTopology: () => void;
  openBackendPanel: () => void;
  openFiveDimensions: () => void;
  openPhilosophy: () => void;
  openTechAudit: () => void;
  openKnowledgeBase: () => void;
  openTerminal: () => void;
  
  // Context management
  setViewingMemberId: (id: RoleId | null) => void;
  setFiveDimensionsInitialView: (view: 'CYCLE' | 'MATRIX') => void;
}

/**
 * usePanelManager Hook
 * 
 * @example
 * ```tsx
 * const panelManager = usePanelManager();
 * 
 * // New API (preferred)
 * panelManager.openPanel('TOPOLOGY');
 * panelManager.closePanel();
 * 
 * // Backward-compatible API
 * if (panelManager.showTopology) { ... }
 * panelManager.openTopology();
 * panelManager.closeTopology();
 * ```
 */
export function usePanelManager(): PanelManagerReturn {
  const [state, dispatch] = useReducer(panelReducer, initialState);

  /**
   * Open a specific panel with optional context
   */
  const openPanel = useCallback((panel: PanelType, context?: PanelState['panelContext']) => {
    dispatch({ type: 'OPEN_PANEL', panel, context });
  }, []);

  /**
   * Close the currently active panel
   */
  const closePanel = useCallback(() => {
    dispatch({ type: 'CLOSE_PANEL' });
  }, []);

  /**
   * Toggle a panel (close if already open, open if closed)
   */
  const togglePanel = useCallback((panel: PanelType, context?: PanelState['panelContext']) => {
    dispatch({ type: 'TOGGLE_PANEL', panel, context });
  }, []);

  /**
   * Check if a specific panel is currently active
   */
  const isPanelActive = useCallback((panel: PanelType): boolean => {
    return state.activePanel === panel;
  }, [state.activePanel]);

  /**
   * Get a specific value from the panel context
   */
  const getContext = useCallback(<K extends keyof NonNullable<PanelState['panelContext']>>(
    key: K
  ): NonNullable<PanelState['panelContext']>[K] | undefined => {
    return state.panelContext?.[key];
  }, [state.panelContext]);

  // ========================================
  // Backward-Compatible Helpers
  // ========================================

  const setViewingMemberId = useCallback((id: RoleId | null) => {
    if (id === null) {
      // Close member detail panel
      if (state.activePanel === 'MEMBER_DETAIL') {
        dispatch({ type: 'CLOSE_PANEL' });
      }
    } else {
      // Open member detail panel with roleId
      dispatch({ 
        type: 'OPEN_PANEL', 
        panel: 'MEMBER_DETAIL', 
        context: { viewingMemberId: id } 
      });
    }
  }, [state.activePanel]);

  const setFiveDimensionsInitialView = useCallback((view: 'CYCLE' | 'MATRIX') => {
    // Update context and open panel
    dispatch({
      type: 'OPEN_PANEL',
      panel: 'FIVE_DIMENSIONS',
      context: { 
        ...state.panelContext,
        fiveDimensionsView: view 
      },
    });
  }, [state.panelContext]);

  // Create individual open/close functions for backward compatibility
  const createPanelFunctions = useCallback((panelType: PanelType) => ({
    open: () => dispatch({ type: 'OPEN_PANEL', panel: panelType }),
    close: () => {
      if (state.activePanel === panelType) {
        dispatch({ type: 'CLOSE_PANEL' });
      }
    },
  }), [state.activePanel]);

  const protocolsFns = useMemo(() => createPanelFunctions('PROTOCOLS'), [createPanelFunctions]);
  const topologyFns = useMemo(() => createPanelFunctions('TOPOLOGY'), [createPanelFunctions]);
  const backendFns = useMemo(() => createPanelFunctions('BACKEND'), [createPanelFunctions]);
  const fiveDimFns = useMemo(() => createPanelFunctions('FIVE_DIMENSIONS'), [createPanelFunctions]);
  const philosophyFns = useMemo(() => createPanelFunctions('PHILOSOPHY'), [createPanelFunctions]);
  const techAuditFns = useMemo(() => createPanelFunctions('TECH_AUDIT'), [createPanelFunctions]);
  const kbFns = useMemo(() => createPanelFunctions('KNOWLEDGE_BASE'), [createPanelFunctions]);
  const terminalFns = useMemo(() => createPanelFunctions('TERMINAL'), [createPanelFunctions]);

  // Memoized backward-compatible getters
  const backwardCompatAPI = useMemo(() => ({
    showProtocols: state.activePanel === 'PROTOCOLS',
    showTopology: state.activePanel === 'TOPOLOGY',
    showBackendPanel: state.activePanel === 'BACKEND',
    showFiveDimensions: state.activePanel === 'FIVE_DIMENSIONS',
    showPhilosophy: state.activePanel === 'PHILOSOPHY',
    showTechAudit: state.activePanel === 'TECH_AUDIT',
    showKnowledgeBase: state.activePanel === 'KNOWLEDGE_BASE',
    showTerminal: state.activePanel === 'TERMINAL',
    viewingMemberId: state.panelContext?.viewingMemberId || null,
    fiveDimensionsInitialView: state.panelContext?.fiveDimensionsView || 'CYCLE',
    
    // Open functions
    openProtocols: protocolsFns.open,
    openTopology: topologyFns.open,
    openBackendPanel: backendFns.open,
    openFiveDimensions: fiveDimFns.open,
    openPhilosophy: philosophyFns.open,
    openTechAudit: techAuditFns.open,
    openKnowledgeBase: kbFns.open,
    openTerminal: terminalFns.open,
    
    // Close functions
    closeProtocols: protocolsFns.close,
    closeTopology: topologyFns.close,
    closeBackendPanel: backendFns.close,
    closeFiveDimensions: fiveDimFns.close,
    closePhilosophy: philosophyFns.close,
    closeTechAudit: techAuditFns.close,
    closeKnowledgeBase: kbFns.close,
    closeTerminal: terminalFns.close,
  }), [
    state, 
    protocolsFns, 
    topologyFns, 
    backendFns, 
    fiveDimFns, 
    philosophyFns, 
    techAuditFns, 
    kbFns, 
    terminalFns
  ]);

  return {
    state,
    openPanel,
    closePanel,
    togglePanel,
    isPanelActive,
    getContext,
    setViewingMemberId,
    setFiveDimensionsInitialView,
    ...backwardCompatAPI,
  };
}
