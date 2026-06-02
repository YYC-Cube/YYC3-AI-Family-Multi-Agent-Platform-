/**
 * file: db-init.ts
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
 * YYC³ AI Family — Database Initialization & Migration
 * 
 * Commands:
 *   bun run db-init.ts                 # Auto-detect PG→SQLite, migrate + seed
 *   bun run db-init.ts --verify        # Verify tables + show detailed stats
 *   bun run db-init.ts --reset         # Drop all + re-create + re-seed (SQLite only)
 *   bun run db-init.ts --pg            # Output PostgreSQL schema SQL to stdout
 *   bun run db-init.ts --pg-create     # Create yyc3_family database in PG 15
 *   bun run db-init.ts --pg-extensions # Install PG extensions (pgvector, pg_trgm etc.)
 * 
 * PostgreSQL Quick Start:
 *   1. bun run db-init.ts --pg-create       # Create database
 *   2. bun run db-init.ts --pg-extensions   # Install extensions
 *   3. bun run db-init.ts                    # Apply schema + seed
 *   4. bun run db-init.ts --verify          # Confirm everything
 */

import { db } from "./db";
import { database as dbConfig } from "./config";

const args = process.argv.slice(2);
const isVerify = args.includes("--verify");
const isReset = args.includes("--reset");
const isPgExport = args.includes("--pg");
const isPgCreate = args.includes("--pg-create");
const isPgExtensions = args.includes("--pg-extensions");

async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║   YYC³ AI Family — Database Init v2.1             ║");
  console.log("║   PostgreSQL 15 Primary | SQLite Fallback         ║");
  console.log("╚═══════════════════════════════════════════════════╝\n");

  // ── PostgreSQL: Create Database ──
  if (isPgCreate) {
    console.log("  Creating PostgreSQL database...\n");
    try {
      const postgres = require("postgres");
      // Connect to default 'postgres' database to create yyc3_family
      // FIX-001: 使用环境变量，不再硬编码凭据
      const adminDbUrl = process.env.DATABASE_ADMIN_URL
        || dbConfig.url.replace(/\/yyc3_family\b/, '/postgres');
      const adminSql = postgres(adminDbUrl, {
        max: 1, idle_timeout: 5,
      });
      
      // Check if database exists
      const [existing] = await adminSql`
        SELECT 1 FROM pg_database WHERE datname = 'yyc3_family'
      `;
      
      if (existing) {
        console.log("  Database 'yyc3_family' already exists. Skipping.\n");
      } else {
        await adminSql.unsafe("CREATE DATABASE yyc3_family OWNER yyc3_max ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8'");
        console.log("  ✓ Database 'yyc3_family' created successfully.\n");
      }
      await adminSql.end();
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`  ✗ Failed: ${error.message}`);
      console.log("\n  Manual fallback:");
      console.log("  createdb -p $PGPORT -U $PGUSER yyc3_family\n");
      process.exit(1);
    }
    return;
  }

  // ── PostgreSQL: Install Extensions ──
  if (isPgExtensions) {
    console.log("  Installing PostgreSQL extensions...\n");
    try {
      const postgres = require("postgres");
      const sql = postgres(dbConfig.url, { max: 1, idle_timeout: 5 });
      
      const extensions = [
        { name: "uuid-ossp", desc: "UUID generation" },
        { name: "pgcrypto", desc: "Cryptographic functions" },
        { name: "pg_trgm", desc: "Trigram fuzzy search" },
        { name: "btree_gin", desc: "GIN for scalars" },
      ];

      for (const ext of extensions) {
        try {
          await sql.unsafe(`CREATE EXTENSION IF NOT EXISTS "${ext.name}"`);
          console.log(`  ✓ ${ext.name.padEnd(14)} — ${ext.desc}`);
        } catch (e: unknown) {
          const error = e as Error;
          console.log(`  ✗ ${ext.name.padEnd(14)} — ${error.message.substring(0, 60)}`);
        }
      }

      // pgvector (optional, may need brew install pgvector)
      try {
        await sql.unsafe('CREATE EXTENSION IF NOT EXISTS "vector"');
        console.log(`  ✓ vector         — pgvector (semantic KB search)`);
      } catch {
        console.log(`  ○ vector         — Not installed. Run: brew install pgvector`);
        console.log(`                     Then: ALTER SYSTEM SET shared_preload_libraries = 'vector';`);
        console.log(`                     And restart PostgreSQL.`);
      }

      await sql.end();
      console.log("\n  Done. Extensions installed.\n");
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`  ✗ Connection failed: ${error.message}`);
      process.exit(1);
    }
    return;
  }

  // ── PostgreSQL Schema Export ──
  if (isPgExport) {
    const schemaPath = new URL("../supabase/family-schema.sql", import.meta.url).pathname;
    try {
      const schema = await Bun.file(schemaPath).text();
      console.log(schema);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`ERROR: ${error.message}`);
      process.exit(1);
    }
    return;
  }

  // ── SQLite Reset ──
  if (isReset) {
    const fs = require("fs");
    const sqlitePath = dbConfig.sqlitePath;
    for (const f of [sqlitePath, `${sqlitePath}-wal`, `${sqlitePath}-shm`]) {
      try { fs.unlinkSync(f); console.log(`  Deleted: ${f}`); } catch {}
    }
    console.log("  SQLite files cleared.\n");
  }

  // ── Initialize (auto-detect engine) ──
  const pgUrl = dbConfig.url;
  console.log(`  DATABASE_URL: ${pgUrl.replace(/:[^:@]+@/, ":****@")}`);
  console.log(`  SQLite path:  ${dbConfig.sqlitePath}\n`);

  try {
    await db.init();
    console.log(`\n  Engine: ${db.engine.toUpperCase()}`);
    console.log("  Schema: OK");
    console.log("  Seed:   OK\n");
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`\n  ERROR: ${error.message}`);
    process.exit(1);
  }

  // ── Stats ──
  const stats = await db.getStats();
  console.log("  ┌─────────────────────────────────────────┐");
  console.log("  │          Table Statistics                │");
  console.log("  ├─────────────────────────────────────────┤");
  if (stats.tables) {
    for (const [table, count] of Object.entries(stats.tables)) {
      const icon = (count as number) > 0 ? "✓" : "○";
      console.log(`  │  ${icon} ${(table as string).padEnd(26)} ${String(count).padStart(6)} rows │`);
    }
  }
  console.log("  └─────────────────────────────────────────┘");
  if (stats.databaseSize) console.log(`  Database size: ${stats.databaseSize}`);
  if (stats.path) console.log(`  SQLite path: ${stats.path}`);

  // ── Verify ──
  if (isVerify) {
    console.log("\n  ══════ Verification ══════\n");

    // Members
    const members = await db.members.findAll();
    console.log(`  Family Members: ${members.length}`);
    for (const m of members) {
      const online = typeof m.is_online === "boolean" ? m.is_online : m.is_online === 1;
      console.log(`    ${online ? "●" : "○"} ${m.role_id.padEnd(18)} ${m.display_name} [${m.mood}]`);
    }

    // Agent logs
    const logStats = await db.agentLogs.getStats();
    console.log(`\n  Agent Call Log:`);
    console.log(`    Total calls:  ${logStats.totalCalls}`);
    console.log(`    Success rate: ${Math.round(logStats.successRate * 100)}%`);
    console.log(`    Avg latency:  ${logStats.avgLatency}ms`);
    console.log(`    Tokens (in):  ${logStats.totalTokensIn}`);
    console.log(`    Tokens (out): ${logStats.totalTokensOut}`);

    if (Object.keys(logStats.byModel).length > 0) {
      console.log(`    By model:`);
      for (const [m, c] of Object.entries(logStats.byModel)) {
        console.log(`      ${m}: ${c} calls`);
      }
    }

    // Rate limits
    const rl = await db.rateLimits.get();
    console.log(`\n  Rate Limits: ${rl ? "initialized" : "MISSING"}`);

    // KB
    const kbCount = await db.kbChunks.count();
    console.log(`  KB Chunks:   ${kbCount}`);

    // Health
    const healthy = await db.isHealthy();
    console.log(`\n  Health: ${healthy ? "✓ OK" : "✗ FAILED"}`);

    // PG-specific checks
    if (db.engine === "postgresql") {
      console.log("\n  ── PostgreSQL Specifics ──");
      try {
        const postgres = require("postgres");
        const sql = postgres(dbConfig.url, { max: 1, idle_timeout: 5 });
        
        // Extensions
        const exts = await sql`SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp','pgcrypto','pg_trgm','btree_gin','vector') ORDER BY extname`;
        console.log(`  Extensions:`);
        for (const e of exts) console.log(`    ✓ ${e.extname} v${e.extversion}`);
        
        // Index count
        const [idxCount] = await sql`SELECT COUNT(*) as count FROM pg_indexes WHERE schemaname = 'public'`;
        console.log(`  Indexes: ${idxCount.count}`);
        
        // DB size
        const [dbSize] = await sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`;
        console.log(`  DB size: ${dbSize.size}`);

        // Materialized views
        const mvs = await sql`SELECT matviewname FROM pg_matviews WHERE schemaname = 'public' ORDER BY matviewname`;
        if (mvs.length > 0) {
          console.log(`  Materialized views:`);
          for (const mv of mvs) console.log(`    ✓ ${mv.matviewname}`);
        }

        await sql.end();
      } catch (err: unknown) {
        const error = err as Error;
        console.log(`  (Could not run PG-specific checks: ${error.message})`);
      }
    }
  }

  console.log("\n  Done.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});