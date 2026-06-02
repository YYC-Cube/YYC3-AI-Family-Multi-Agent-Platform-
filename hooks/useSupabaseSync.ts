/**
 * file: useSupabaseSync.ts
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

import { useCallback, useEffect, useState } from 'react';
import { Chat } from '../types/storage';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f9d79316`;

export const useSupabaseSync = (
  channelId: string,
  localChats: Chat[],
  onRemoteUpdate: (remoteChats: Chat[]) => void
) => {
  const [isOffline, setIsOffline] = useState(false);

  // Upload local chats to Supabase Edge Function (KV Store)
  const syncToSupabase = useCallback(async (chats: Chat[]) => {
    try {
      // Ensure all chats have the correct channelId
      const taggedChats = chats.map(c => ({ ...c, channelId }));

      const response = await fetch(`${SERVER_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ chats: taggedChats }),
      });

      if (!response.ok) {
        if (response.status === 503) {
            setIsOffline(true);
            console.warn("Cloud sync paused: Upstream database unavailable.");
            return;
        }
        throw new Error(`Sync failed: ${response.statusText}`);
      }
      
      if (isOffline) setIsOffline(false); // Recovery

    } catch (err) {
      console.error('Sync to Supabase failed:', err);
      // Don't set offline for generic network errors unless repeated, 
      // but here we just log.
    }
  }, [isOffline]);

  // Download chats from Supabase Edge Function
  const syncFromSupabase = useCallback(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/chats?channelId=${channelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
      });

      if (!response.ok) {
        if (response.status === 503) {
            setIsOffline(true);
            toast.error("CLOUD_LINK_OFFLINE", {
                description: "Running in local-only mode. Cloud sync paused."
            });
            return;
        }
        // Try to read error body
        const errBody = await response.text();
        throw new Error(`Fetch failed: ${response.status} ${errBody.slice(0, 100)}`);
      }

      const remoteChats: Chat[] = await response.json();

      if (Array.isArray(remoteChats)) {
        // Convert string dates back to Date objects
        const parsedChats = remoteChats.map(chat => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
            messages: chat.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }))
        })).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        onRemoteUpdate(parsedChats);
        
        if (isOffline) {
            setIsOffline(false);
            toast.success("CLOUD_LINK_RESTORED");
        } else {
             toast.success('CLOUD_SYNC_COMPLETE', {
                description: "Data synchronized from central mainframe."
            });
        }
      }
    } catch (err) {
      console.error('Sync from Supabase failed:', err);
    }
  }, [onRemoteUpdate, isOffline]);

  // Initial Sync
  useEffect(() => {
    syncFromSupabase();
  }, [syncFromSupabase]);

  return {
    syncToSupabase,
    syncFromSupabase,
    isOffline
  };
};
