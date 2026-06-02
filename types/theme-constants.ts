/**
 * file: theme-constants.ts
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
 * YYC³ AI Family - Theme Constants
 * 
 * Centralized theme constants for consistent styling across the application
 * Replaces inline color definitions scattered throughout components
 */

import { FamilyMood } from './family-manifest';

/**
 * Mood Color Mapping
 * Used for mood badges, status indicators, and semantic coloring
 */
export const MOOD_COLORS: Record<FamilyMood, string> = {
  SERENE: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  FOCUSED: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  EXCITED: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  LOVING: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
};

/**
 * Mood Ring Colors
 * Used for avatar ring effects and active state indicators
 */
export const MOOD_RING_COLORS: Record<FamilyMood, string> = {
  SERENE: 'ring-blue-500/40',
  FOCUSED: 'ring-emerald-500/50',
  EXCITED: 'ring-orange-500/50',
  LOVING: 'ring-pink-500/50',
};

/**
 * Mood Labels (Chinese)
 * Display names for mood states
 */
export const MOOD_LABELS: Record<FamilyMood, string> = {
  SERENE: '宁静',
  FOCUSED: '专注',
  EXCITED: '兴奋',
  LOVING: '关爱',
};

/**
 * Mood Glow Colors
 * Used for glow effects and ambient lighting
 */
export const MOOD_GLOW_COLORS: Record<FamilyMood, string> = {
  SERENE: 'bg-blue-500/20',
  FOCUSED: 'bg-emerald-500/20',
  EXCITED: 'bg-orange-500/20',
  LOVING: 'bg-pink-500/20',
};

/**
 * Connection Status Colors
 */
export const CONNECTION_STATUS_COLORS = {
  CONNECTED: 'text-emerald-500',
  CONNECTING: 'text-yellow-500',
  DISCONNECTED: 'text-red-500',
  MOCK_MODE: 'text-blue-500',
  OFFLINE: 'text-slate-500',
} as const;

/**
 * Model Source Colors
 */
export const MODEL_SOURCE_COLORS = {
  REAL: 'text-emerald-500',
  MOCK: 'text-blue-500',
} as const;

/**
 * Priority Colors
 */
export const PRIORITY_COLORS = {
  LOW: 'text-slate-500',
  NORMAL: 'text-blue-500',
  HIGH: 'text-amber-500',
  CRITICAL: 'text-red-500',
} as const;

/**
 * Glass Morphism Styles
 * Reusable glass effect class names
 */
export const GLASS_STYLES = {
  /** Standard glass panel */
  PANEL: 'bg-slate-900/80 backdrop-blur-xl border border-white/[0.06]',
  
  /** Elevated glass card */
  CARD: 'bg-black/20 border border-white/5 rounded-xl',
  
  /** Dark glass overlay */
  OVERLAY: 'bg-slate-950/90 backdrop-blur-2xl',
  
  /** Subtle glass surface */
  SURFACE: 'bg-white/[0.02] border border-white/[0.04]',
} as const;

/**
 * Button Styles
 * Standard button variants
 */
export const BUTTON_STYLES = {
  /** Mono button (primary style) */
  MONO: 'px-2.5 py-1.5 rounded-lg text-xs font-mono border',
  
  /** Ghost button */
  GHOST: 'px-3 py-1.5 rounded-lg text-sm hover:bg-white/5 transition-colors',
  
  /** Icon button */
  ICON: 'p-2 rounded-lg hover:bg-white/5 transition-colors',
} as const;

/**
 * Avatar Sizes
 */
export const AVATAR_SIZES = {
  XS: 'w-8 h-8',
  SM: 'w-10 h-10',
  MD: 'w-12 h-12',
  LG: 'w-16 h-16',
  XL: 'w-20 h-20',
} as const;

/**
 * Animation Durations
 */
export const ANIMATION_DURATIONS = {
  FAST: 0.15,
  NORMAL: 0.3,
  SLOW: 0.5,
} as const;

/**
 * Z-Index Layers
 * Standardized z-index hierarchy
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 10,
  STICKY: 20,
  HEADER: 30,
  OVERLAY: 40,
  MODAL: 50,
  TOOLTIP: 60,
  TOAST: 70,
} as const;
