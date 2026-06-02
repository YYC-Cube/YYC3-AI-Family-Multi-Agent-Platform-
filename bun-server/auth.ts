/**
 * file: auth.ts
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
 * YYC3 AI Family - JWT Authentication Middleware (权限卫士)
 * 
 * [P2] Optional JWT-based authentication.
 * When enabled, validates Bearer tokens on both WS upgrade and REST API.
 * 
 * The frontend's BackendBridge.authToken field will carry this JWT.
 * 
 * For P0 launch, auth is DISABLED — all requests pass through.
 * Enable by setting JWT_SECRET in .env
 */

const JWT_SECRET = process.env.JWT_SECRET || "";
const AUTH_ENABLED = !!JWT_SECRET && JWT_SECRET !== "yyc3-family-secret-change-in-production";

// ==========================================
// Simple JWT implementation (no external deps)
// For production, use jose or jsonwebtoken package
// ==========================================

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

export interface JWTPayload {
  sub: string;        // User ID
  role: string;       // "admin" | "member" | "viewer"
  familyId: string;   // Family namespace
  iat: number;        // Issued at
  exp: number;        // Expiry
}

/**
 * Generate a JWT token (for testing/development).
 * In production, this would be done by a proper auth service.
 */
export async function generateToken(payload: Omit<JWTPayload, "iat" | "exp">, expiresInHours: number = 24): Promise<string> {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");

  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + (expiresInHours * 3600),
  }));

  const data = `${header}.${body}`;
  
  // Sign with HMAC-SHA256 using Web Crypto API
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sig = base64url(String.fromCharCode(...new Uint8Array(signature)));

  return `${data}.${sig}`;
}

/**
 * Verify and decode a JWT token.
 * Returns the payload if valid, null if invalid or expired.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  if (!JWT_SECRET) return null;

  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;

    // Verify signature
    const data = `${header}.${body}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const sigBytes = Uint8Array.from(base64urlDecode(sig), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;

    // Decode payload
    const payload: JWTPayload = JSON.parse(base64urlDecode(body));

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware: Extract and validate auth token from request.
 * Returns the JWT payload if valid, null if no auth or invalid token.
 * 
 * When AUTH_ENABLED is false, returns a default admin payload (dev mode).
 */
export async function authenticate(req: Request): Promise<JWTPayload | null> {
  // Dev mode: bypass auth
  if (!AUTH_ENABLED) {
    return {
      sub: "dev-user",
      role: "admin",
      familyId: "yyc3-default",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  return verifyToken(token);
}

/**
 * Extract auth token from WebSocket upgrade request URL query params.
 * Frontend can pass: ws://localhost:3080?token=xxx
 */
export async function authenticateWS(req: Request): Promise<JWTPayload | null> {
  if (!AUTH_ENABLED) {
    return {
      sub: "dev-user",
      role: "admin",
      familyId: "yyc3-default",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return null;

  return verifyToken(token);
}

// Export auth state for logging
export const isAuthEnabled = AUTH_ENABLED;
