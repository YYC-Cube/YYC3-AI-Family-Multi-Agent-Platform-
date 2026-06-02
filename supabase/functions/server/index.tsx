/**
 * file: index.tsx
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

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-f9d79316/health", (c) => {
  return c.json({ status: "ok" });
});

// GET /chats - Retrieve all chats
app.get("/make-server-f9d79316/chats", async (c) => {
  try {
    const channelId = c.req.query("channelId") || "main";
    // Prefix: "chat:{channelId}:"
    // Note: If channelId is "main", we might want to support legacy keys "chat:{id}" 
    // but for clean architecture, let's enforce namespacing.
    // Existing "chat:{id}" keys might be lost to the UI if we strictly filter.
    // For now, let's stick to the new strict namespacing: chat:{channelId}:{chatId}
    
    const prefix = `chat:${channelId}:`;
    const chats = await kv.getByPrefix(prefix);
    return c.json(chats);
  } catch (e: any) {
    console.error("Failed to get chats:", e);
    const msg = e.message || String(e);
    // Sanitize upstream HTML errors from Supabase/Cloudflare
    if (msg.includes("<!DOCTYPE html") || msg.includes("Internal server error")) {
       return c.json({ 
         error: "Upstream Database Unavailable", 
         details: "The KV store table may be missing or the database is paused.",
         code: "UPSTREAM_ERROR"
       }, 503);
    }
    return c.json({ error: msg }, 500);
  }
});

// POST /chats - Save/Sync chats
app.post("/make-server-f9d79316/chats", async (c) => {
  try {
    const { chats } = await c.req.json();
    
    if (!Array.isArray(chats)) {
      return c.json({ error: "Invalid input: 'chats' must be an array" }, 400);
    }

    if (chats.length === 0) {
      return c.json({ success: true, count: 0 });
    }

    // Create keys like "chat:{channelId}:{id}"
    // We assume the chat objects already have channelId injected by the frontend,
    // or we use the query param. 
    // The frontend should ensure chat objects have the correct structure, 
    // but for safety, we can enforce it if we pass channelId in query.
    
    // However, to keep it simple and consistent with the body payload:
    const keys = chats.map((chat: any) => {
       const channel = chat.channelId || "main";
       return `chat:${channel}:${chat.id}`;
    });
    
    // Bulk set
    await kv.mset(keys, chats);
    
    return c.json({ success: true, count: chats.length });
  } catch (e: any) {
    console.error("Failed to save chats:", e);
    const msg = e.message || String(e);
    if (msg.includes("<!DOCTYPE html") || msg.includes("Internal server error")) {
       return c.json({ 
         error: "Upstream Database Unavailable", 
         details: "The KV store table may be missing or the database is paused.",
         code: "UPSTREAM_ERROR"
       }, 503);
    }
    return c.json({ error: msg }, 500);
  }
});

Deno.serve(app.fetch);
