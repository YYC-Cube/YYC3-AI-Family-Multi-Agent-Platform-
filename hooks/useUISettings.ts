/**
 * file: useUISettings.ts
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

import { useState, useEffect, useCallback } from 'react';
import { UISettings } from '../types/storage';
import { toast } from 'sonner';

const STORAGE_KEY = 'yyc3_ui_settings';
const CURRENT_VERSION = 1;

const DEFAULT_SETTINGS: UISettings = {
  theme: 'P1 (Green)',
  scanlines: 75,
  curvature: true,
  fontSize: 'medium',
  animations: true,
  version: CURRENT_VERSION,
};

export const useUISettings = () => {
  const [settings, setSettings] = useState<UISettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load Settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        if (parsed.version !== CURRENT_VERSION) {
          const migrated = { ...DEFAULT_SETTINGS, ...parsed, version: CURRENT_VERSION };
          setSettings(migrated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } else {
          setSettings(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load UI settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save Settings
  const saveSettings = useCallback((newSettings: UISettings) => {
    try {
      const updated = { ...newSettings, version: CURRENT_VERSION };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSettings(updated);
    } catch (err) {
      console.error('Failed to save UI settings:', err);
      toast.error('Failed to save display preferences');
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<UISettings>) => {
    // Functional update to ensure we have latest state if called in rapid succession
    setSettings(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, version: CURRENT_VERSION }));
      } catch (e) {
        console.error("Save failed", e);
      }
      return next;
    });
  }, []);

  return {
    settings,
    loading,
    updateSettings,
    saveSettings
  };
};
