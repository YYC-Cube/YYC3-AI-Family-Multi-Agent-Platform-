/**
 * file: useChannelManager.ts
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

import { useState, useEffect, useCallback } from "react";

const CHANNELS_KEY = "yyc3_channels_meta";

export interface Channel {
  id: string;
  name: string;
  createdAt: Date;
  isEncrypted?: boolean;
  preset?: string;
}

const DEFAULT_CHANNEL: Channel = {
  id: "main",
  name: "Main Console",
  createdAt: new Date(),
  preset: "General"
};

export function useChannelManager() {
  const [channels, setChannels] = useState<Channel[]>([DEFAULT_CHANNEL]);
  const [activeChannelId, setActiveChannelId] = useState<string>("main");

  // Load channels
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHANNELS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored, (key, value) => {
            if (key === "createdAt") return new Date(value);
            return value;
        });
        setChannels(parsed);
      } else {
        localStorage.setItem(CHANNELS_KEY, JSON.stringify([DEFAULT_CHANNEL]));
      }
    } catch (e) {
      console.error("Failed to load channels:", e);
    }
  }, []);

  // Save channels
  const saveChannels = useCallback((newChannels: Channel[]) => {
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(newChannels));
    setChannels(newChannels);
  }, []);

  const createChannel = useCallback((name: string, options?: { isEncrypted?: boolean, preset?: string }) => {
    const newChannel: Channel = {
      id: `chan_${Date.now()}`,
      name: name,
      createdAt: new Date(),
      isEncrypted: options?.isEncrypted,
      preset: options?.preset || "General"
    };
    saveChannels([...channels, newChannel]);
    return newChannel.id;
  }, [channels, saveChannels]);

  const deleteChannel = useCallback((id: string) => {
    if (id === "main") return; // Protect main channel
    
    // Clean up channel data
    localStorage.removeItem(`yyc3_chat_history_${id}`);
    
    const newChannels = channels.filter(c => c.id !== id);
    saveChannels(newChannels);
    
    if (activeChannelId === id) {
      setActiveChannelId("main");
    }
  }, [channels, activeChannelId, saveChannels]);

  const updateChannelName = useCallback((id: string, name: string) => {
    const newChannels = channels.map(c => 
      c.id === id ? { ...c, name } : c
    );
    saveChannels(newChannels);
  }, [channels, saveChannels]);

  return {
    channels,
    activeChannelId,
    setActiveChannelId,
    createChannel,
    deleteChannel,
    updateChannelName
  };
}
