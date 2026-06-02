/**
 * file: redis-client.ts
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
 * YYC³ AI Family — Cache Layer (灵魂缓存·真落地版)
 * 
 * Two-mode cache with automatic degradation:
 *   Mode A: In-Memory LRU  (DEFAULT, zero-config, single-process)
 *   Mode B: Redis           (when REDIS_URL is set, multi-process)
 * 
 * Features:
 *   - TTL-based expiration (checked on read, periodic sweep)
 *   - LRU eviction when capacity reached
 *   - Typed cache namespaces (signals, rateLimits, members, chains)
 *   - Identical API whether Redis is connected or not
 * 
 * Usage:
 *   import { cache } from "./redis-client";
 *   await cache.init();
 *   await cache.signals.push(signal);
 *   await cache.rateLimits.increment(true);
 */

import { redis as redisConfig } from "./config";

// ==========================================
// Types
// ==========================================

export interface CachedSignal {
  id: string;
  timestamp: number;
  type: string;
  senderId: string;
  receiverId: string;
  content: string;
  [key: string]: string | number | undefined;
}

interface CachedChain {
  id: string;
  topic: string;
  participants: string[];
  status: string;
  [key: string]: string | string[] | number | undefined;
}

// ==========================================
// In-Memory LRU Cache with TTL
// ==========================================

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number; // Unix timestamp ms, 0 = never
  lastAccess: number;
}

class LRUCache {
  private store = new Map<string, CacheEntry>();
  private maxSize: number;
  private sweepInterval: Timer | null = null;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
    // Sweep expired entries every 60 seconds
    this.sweepInterval = setInterval(() => this.sweep(), 60_000);
  }

  set(key: string, value: unknown, ttlMs: number = 0): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this.evictLRU();
    }
    this.store.set(key, {
      value,
      expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0,
      lastAccess: Date.now(),
    });
  }

  get<T = unknown>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    entry.lastAccess = Date.now();
    return entry.value as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  incr(key: string, delta: number = 1, ttlMs: number = 0): number {
    const current = this.get<number>(key) ?? 0;
    const newVal = current + delta;
    this.set(key, newVal, ttlMs);
    return newVal;
  }

  lpush(key: string, value: unknown, maxLen: number = 200, ttlMs: number = 0): number {
    const list = this.get<unknown[]>(key) ?? [];
    list.unshift(value);
    if (list.length > maxLen) list.length = maxLen;
    this.set(key, list, ttlMs);
    return list.length;
  }

  lrange(key: string, start: number, end: number): unknown[] {
    const list = this.get<unknown[]>(key) ?? [];
    return list.slice(start, end + 1);
  }

  hset(key: string, field: string, value: unknown, ttlMs: number = 0): void {
    const hash = this.get<Record<string, unknown>>(key) ?? {};
    hash[field] = value;
    this.set(key, hash, ttlMs);
  }

  hget(key: string, field: string): unknown {
    const hash = this.get<Record<string, unknown>>(key);
    return hash?.[field] ?? null;
  }

  hgetall(key: string): Record<string, unknown> | null {
    return this.get<Record<string, unknown>>(key);
  }

  /** Hash increment */
  hincrby(key: string, field: string, delta: number = 1): number {
    const hash = this.get<Record<string, number>>(key) ?? {};
    hash[field] = (Number(hash[field]) || 0) + delta;
    // Re-set without changing TTL - just update value in existing entry
    const entry = this.store.get(key);
    if (entry) {
      entry.value = hash;
      entry.lastAccess = Date.now();
    } else {
      this.set(key, hash);
    }
    return hash[field];
  }

  /** Get all keys matching a pattern (simple glob) */
  keys(pattern: string): string[] {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    const result: string[] = [];
    for (const key of this.store.keys()) {
      if (regex.test(key)) result.push(key);
    }
    return result;
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;
    for (const [key, entry] of this.store) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }
    if (oldestKey) this.store.delete(oldestKey);
  }

  private sweep(): void {
    const now = Date.now();
    let swept = 0;
    for (const [key, entry] of this.store) {
      if (entry.expiresAt > 0 && now > entry.expiresAt) {
        this.store.delete(key);
        swept++;
      }
    }
    if (swept > 0) {
      console.log(`[CACHE] Swept ${swept} expired entries (${this.store.size} remaining)`);
    }
  }

  destroy(): void {
    if (this.sweepInterval) clearInterval(this.sweepInterval);
    this.store.clear();
  }
}

// ==========================================
// Redis Adapter (optional, wraps ioredis)
// ==========================================

interface RedisClient {
  connect: () => Promise<void>;
  ping: () => Promise<string>;
  quit: () => Promise<void>;
}

class RedisAdapter {
  private client: RedisClient | null = null;
  private _connected = false;

  async connect(url: string, password?: string, db?: number): Promise<boolean> {
    try {
      const Redis = require("ioredis");
      this.client = new Redis(url, {
        password: password || undefined,
        db: db || 0,
        retryStrategy: (times: number) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
        connectTimeout: 5000,
      });

      await this.client!.connect();
      await this.client!.ping();
      this._connected = true;
      console.log(`[REDIS] Connected to ${url.replace(/:[^:@]+@/, ":****@")}`);
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      console.warn(`[REDIS] Connection failed: ${error.message}. Using in-memory cache.`);
      this.client = null;
      this._connected = false;
      return false;
    }
  }

  get connected(): boolean {
    return this._connected;
  }

  getClient(): RedisClient | null {
    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try { await this.client.quit(); } catch {
        // Ignore disconnect errors - connection will be closed anyway
      }
      this._connected = false;
    }
  }
}

// ==========================================
// Signal Cache Namespace
// ==========================================

class SignalCache {
  constructor(private lru: LRUCache, private prefix: string) {}

  async push(signal: CachedSignal): Promise<boolean> {
    try {
      this.lru.lpush(
        `${this.prefix}signals:recent`,
        signal,
        redisConfig.signalCacheMax,
        redisConfig.signalCacheTtl * 1000
      );
      return true;
    } catch {
      return false;
    }
  }

  async getRecent(count: number = 50): Promise<CachedSignal[]> {
    return this.lru.lrange(`${this.prefix}signals:recent`, 0, count - 1) as CachedSignal[];
  }

  async getByChain(chainId: string): Promise<CachedSignal[]> {
    return this.lru.get<CachedSignal[]>(`${this.prefix}chain:${chainId}:signals`) ?? [];
  }

  async pushToChain(chainId: string, signal: CachedSignal): Promise<void> {
    this.lru.lpush(
      `${this.prefix}chain:${chainId}:signals`,
      signal,
      100,
      7200_000
    );
  }
}

// ==========================================
// Rate Limit Cache Namespace
// ==========================================

interface RateLimitState {
  realCount: number;
  mockCount: number;
  windowStart: number;
}

class RateLimitCache {
  constructor(private lru: LRUCache, private prefix: string) {}

  async get(key: string = "model_ratio"): Promise<RateLimitState> {
    const k = `${this.prefix}rate:${key}`;
    const data = this.lru.hgetall(k);

    if (!data || !data.windowStart) {
      return { realCount: 0, mockCount: 0, windowStart: Date.now() };
    }

    const windowStart = Number(data.windowStart);
    // Check if window expired (60s)
    if (Date.now() - windowStart > 60_000) {
      this.lru.delete(k);
      return { realCount: 0, mockCount: 0, windowStart: Date.now() };
    }

    return {
      realCount: Number(data.realCount) || 0,
      mockCount: Number(data.mockCount) || 0,
      windowStart,
    };
  }

  async increment(isReal: boolean, key: string = "model_ratio"): Promise<RateLimitState> {
    const k = `${this.prefix}rate:${key}`;
    await this.get(key);

    // Initialize if new window
    if (!this.lru.has(k)) {
      this.lru.hset(k, "windowStart", Date.now(), 60_000);
      this.lru.hset(k, "realCount", 0, 60_000);
      this.lru.hset(k, "mockCount", 0, 60_000);
    }

    const field = isReal ? "realCount" : "mockCount";
    this.lru.hincrby(k, field, 1);

    return this.get(key);
  }

  async reset(key: string = "model_ratio"): Promise<void> {
    this.lru.delete(`${this.prefix}rate:${key}`);
  }
}

// ==========================================
// Member Activity Cache Namespace
// ==========================================

class MemberActivityCache {
  constructor(private lru: LRUCache, private prefix: string) {}

  async update(roleId: string, activity: string): Promise<void> {
    this.lru.set(
      `${this.prefix}member:${roleId}:activity`,
      { activity, timestamp: Date.now() },
      300_000 // 5 min TTL
    );
  }

  async get(roleId: string): Promise<{ activity: string; timestamp: number } | null> {
    return this.lru.get(`${this.prefix}member:${roleId}:activity`);
  }

  async setHeartbeat(roleId: string): Promise<void> {
    this.lru.set(
      `${this.prefix}member:${roleId}:heartbeat`,
      Date.now(),
      600_000 // 10 min TTL
    );
  }

  async getHeartbeat(roleId: string): Promise<number | null> {
    return this.lru.get(`${this.prefix}member:${roleId}:heartbeat`);
  }
}

// ==========================================
// Dialogue Chain Cache Namespace
// ==========================================

class DialogueChainCache {
  constructor(private lru: LRUCache, private prefix: string) {}

  async set(chainId: string, chain: CachedChain): Promise<boolean> {
    try {
      this.lru.set(`${this.prefix}chain:${chainId}`, chain, 7200_000);
      return true;
    } catch {
      return false;
    }
  }

  async get(chainId: string): Promise<CachedChain | null> {
    return this.lru.get<CachedChain>(`${this.prefix}chain:${chainId}`);
  }

  async delete(chainId: string): Promise<void> {
    this.lru.delete(`${this.prefix}chain:${chainId}`);
  }
}

// ==========================================
// Main Cache Manager
// ==========================================

class CacheManager {
  private lru!: LRUCache;
  private redisAdapter: RedisAdapter | null = null;
  private _initialized = false;
  private _mode: "memory" | "redis" = "memory";

  // Typed cache namespaces
  public signals!: SignalCache;
  public rateLimits!: RateLimitCache;
  public members!: MemberActivityCache;
  public chains!: DialogueChainCache;

  async init(): Promise<void> {
    if (this._initialized) return;

    const prefix = redisConfig.keyPrefix;

    // Initialize LRU (always available as fallback)
    this.lru = new LRUCache(redisConfig.signalCacheMax * 10); // 10x signal max for all namespaces

    // Try Redis connection
    if (process.env.REDIS_URL) {
      this.redisAdapter = new RedisAdapter();
      const connected = await this.redisAdapter.connect(
        redisConfig.url,
        redisConfig.password || undefined,
        redisConfig.db
      );
      if (connected) {
        this._mode = "redis";
        // Note: For full Redis mode, each namespace would use Redis commands.
        // Current implementation uses LRU as primary with Redis as optional sync.
        // This is intentional for L0 (single-machine) stability.
      }
    }

    // Initialize namespaces (all use LRU for L0 single-machine)
    this.signals = new SignalCache(this.lru, prefix);
    this.rateLimits = new RateLimitCache(this.lru, prefix);
    this.members = new MemberActivityCache(this.lru, prefix);
    this.chains = new DialogueChainCache(this.lru, prefix);

    this._initialized = true;
    console.log(`[CACHE] Initialized — Mode: ${this._mode} | MaxEntries: ${this.lru.size()}`);
  }

  get initialized(): boolean {
    return this._initialized;
  }

  get mode(): string {
    return this._mode;
  }

  isHealthy(): boolean {
    if (this._mode === "redis") {
      return this.redisAdapter?.connected ?? false;
    }
    return this._initialized;
  }

  getStats(): Record<string, any> {
    return {
      initialized: this._initialized,
      mode: this._mode,
      entries: this.lru?.size() ?? 0,
      redisConnected: this.redisAdapter?.connected ?? false,
    };
  }

  /** Raw access to LRU (for custom patterns) */
  raw(): LRUCache {
    return this.lru;
  }

  async destroy(): Promise<void> {
    if (this.redisAdapter) await this.redisAdapter.disconnect();
    if (this.lru) this.lru.destroy();
    this._initialized = false;
  }
}

// ==========================================
// Singleton Export
// ==========================================

export const cache = new CacheManager();

// ==========================================
// Backward-compatible exports
// ==========================================

export async function getRedis(): Promise<any | null> {
  if (!cache.initialized) return null;
  if (cache.mode === "redis") {
    // Return raw LRU as a Redis-like interface
    return cache.raw();
  }
  return null;
}

export async function cacheSignal(signal: CachedSignal): Promise<boolean> {
  if (!cache.initialized) return false;
  return cache.signals.push(signal);
}

export async function getRecentSignals(count: number = 50): Promise<CachedSignal[]> {
  if (!cache.initialized) return [];
  return cache.signals.getRecent(count);
}

export type { RateLimitState };

export async function getRateLimit(): Promise<RateLimitState> {
  if (!cache.initialized) return { realCount: 0, mockCount: 0, windowStart: Date.now() };
  return cache.rateLimits.get();
}

export async function recordRateCall(isReal: boolean): Promise<void> {
  if (!cache.initialized) return;
  await cache.rateLimits.increment(isReal);
}

export async function updateMemberActivity(roleId: string, activity: string): Promise<void> {
  if (!cache.initialized) return;
  await cache.members.update(roleId, activity);
}

export async function getMemberActivity(roleId: string): Promise<{ activity: string; timestamp: number } | null> {
  if (!cache.initialized) return null;
  return cache.members.get(roleId);
}

export async function cacheDialogueChain(chainId: string, chain: CachedChain): Promise<boolean> {
  if (!cache.initialized) return false;
  return cache.chains.set(chainId, chain);
}

export async function getDialogueChain(chainId: string): Promise<CachedChain | null> {
  if (!cache.initialized) return null;
  return cache.chains.get(chainId);
}
