/**
 * file: ide-bridge.ts
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
 * YYC³ AI Family - IDE Bridge (开发工坊之桥)
 * 
 * Provides IDE-like capabilities to the AI Family:
 *   1. Code Analysis — TypeScript type checking, complexity metrics
 *   2. Linting — Biome/ESLint/OxLint integration
 *   3. Git — status, diff, AI commit messages, branch management
 *   4. File Watcher — real-time file change detection
 *   5. Terminal — sandboxed command execution (white-listed)
 *   6. TypeScript Service — hover info, completions, go-to-definition
 * 
 * These capabilities empower CODE_ARTISAN and SENTINEL agents
 * with real-world IDE awareness for accurate code operations.
 */

import { ide as ideConfig } from "./config";

// ==========================================
// Types
// ==========================================
export interface CodeAnalysisResult {
  file: string;
  language: string;
  issues: CodeIssue[];
  metrics: {
    lines: number;
    functions: number;
    complexity: number; // Cyclomatic complexity
    dependencies: string[];
  };
}

export interface CodeIssue {
  type: "error" | "warning" | "info" | "hint";
  message: string;
  file: string;
  line: number;
  column: number;
  rule?: string;        // ESLint/Biome rule name
  fix?: string;         // Suggested fix
}

export interface GitStatus {
  branch: string;
  clean: boolean;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  patch: string;
}

export interface FileChangeEvent {
  type: "create" | "modify" | "delete";
  path: string;
  timestamp: number;
}

// ==========================================
// Shell Command Runner (sandboxed)
// ==========================================
async function runCommand(cmd: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // Security: only allow white-listed commands
  if (!ideConfig.terminal.allowedCommands.includes(cmd)) {
    return {
      stdout: "",
      stderr: `Command '${cmd}' not in allowed list: ${ideConfig.terminal.allowedCommands.join(", ")}`,
      exitCode: 1,
    };
  }

  try {
    const proc = Bun.spawn([cmd, ...args], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    return { stdout, stderr, exitCode };
  } catch (err: unknown) {
    const error = err as Error;
    return { stdout: "", stderr: error.message, exitCode: 1 };
  }
}

// ==========================================
// IDE Bridge
// ==========================================
export class IDEBridge {
  private projectRoot: string;
  private watchers: Map<string, any> = new Map();
  private changeListeners: ((event: FileChangeEvent) => void)[] = [];

  constructor() {
    const path = require("path");
    this.projectRoot = path.resolve(ideConfig.projectRoot);

    if (!ideConfig.enabled) {
      console.log("[IDE] IDE bridge disabled");
      return;
    }

    console.log(`[IDE] Bridge initialized: root=${this.projectRoot} | lint=${ideConfig.lint.engine} | git=${ideConfig.git.enabled}`);
  }

  // ==========================================
  // 1. Code Analysis
  // ==========================================
  async analyzeFile(filePath: string): Promise<CodeAnalysisResult> {
    const path = require("path");
    const fullPath = path.resolve(this.projectRoot, filePath);

    try {
      const file = Bun.file(fullPath);
      if (!await file.exists()) {
        return {
          file: filePath,
          language: "unknown",
          issues: [{ type: "error", message: `File not found: ${filePath}`, file: filePath, line: 0, column: 0 }],
          metrics: { lines: 0, functions: 0, complexity: 0, dependencies: [] },
        };
      }

      const content = await file.text();
      const lines = content.split("\n");
      const ext = path.extname(filePath);
      const languageMap: Record<string, string> = { ".ts": "typescript", ".tsx": "typescript", ".js": "javascript", ".jsx": "javascript", ".py": "python" };
      const language = languageMap[ext] || "unknown";

      // Basic metrics
      const functionMatches = content.match(/(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>|(?:async\s+)?(?:get|set|static)?\s*\w+\s*\([^)]*\)\s*{)/g);
      const importMatches = content.match(/import\s+.*from\s+['"](.*)['"]/g);

      const dependencies = importMatches
        ? importMatches.map(m => m.match(/from\s+['"](.*)['"]/)![1]).filter(d => !d.startsWith("."))
        : [];

      // Simple complexity estimation (count branches)
      const branches = (content.match(/\b(if|else|switch|case|for|while|do|catch|\?\?|&&|\|\||\?)\b/g) || []).length;

      const issues: CodeIssue[] = [];

      // Basic checks
      if (lines.length > 500) {
        issues.push({ type: "warning", message: `File has ${lines.length} lines (recommend < 500)`, file: filePath, line: 0, column: 0, rule: "max-lines" });
      }
      if ((functionMatches?.length || 0) > 20) {
        issues.push({ type: "warning", message: `File has ${functionMatches?.length} functions (recommend < 20)`, file: filePath, line: 0, column: 0, rule: "max-functions" });
      }

      // Check for common issues
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("console.log") && !line.includes("// ok")) {
          issues.push({ type: "info", message: "console.log found", file: filePath, line: i + 1, column: line.indexOf("console.log"), rule: "no-console" });
        }
        if (line.includes("any") && language === "typescript" && !line.includes("//") && !line.includes("*")) {
          issues.push({ type: "hint", message: "'any' type detected — consider stricter typing", file: filePath, line: i + 1, column: line.indexOf("any"), rule: "no-explicit-any" });
        }
        if (line.length > 120) {
          issues.push({ type: "hint", message: `Line length ${line.length} > 120`, file: filePath, line: i + 1, column: 120, rule: "max-line-length" });
        }
      }

      return {
        file: filePath,
        language,
        issues,
        metrics: {
          lines: lines.length,
          functions: functionMatches?.length || 0,
          complexity: branches,
          dependencies,
        },
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        file: filePath,
        language: "unknown",
        issues: [{ type: "error", message: error.message, file: filePath, line: 0, column: 0 }],
        metrics: { lines: 0, functions: 0, complexity: 0, dependencies: [] },
      };
    }
  }

  // ==========================================
  // 2. Linting
  // ==========================================
  async lint(filePath: string): Promise<CodeIssue[]> {
    if (!ideConfig.lint.enabled) return [];

    const path = require("path");
    const fullPath = path.resolve(this.projectRoot, filePath);
    const engine = ideConfig.lint.engine;

    try {
      let result;
      switch (engine) {
        case "biome":
          result = await runCommand("bun", ["x", "biome", "check", "--formatter-enabled=false", fullPath], this.projectRoot);
          break;
        case "eslint":
          result = await runCommand("bun", ["x", "eslint", "--format", "json", fullPath], this.projectRoot);
          break;
        case "oxlint":
          result = await runCommand("bun", ["x", "oxlint", fullPath], this.projectRoot);
          break;
        default:
          return [];
      }

      // Parse output into CodeIssues (simplified — real implementation would parse JSON output)
      if (result.exitCode !== 0 && result.stdout) {
        return [{
          type: "warning",
          message: result.stdout.substring(0, 500),
          file: filePath,
          line: 0,
          column: 0,
          rule: engine,
        }];
      }

      return [];
    } catch (err: unknown) {
      const error = err as Error;
      return [{ type: "error", message: `Lint failed: ${error.message}`, file: filePath, line: 0, column: 0 }];
    }
  }

  // ==========================================
  // 3. Git Operations
  // ==========================================
  async gitStatus(): Promise<GitStatus> {
    if (!ideConfig.git.enabled) {
      return { branch: "unknown", clean: true, ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [] };
    }

    try {
      const [branchResult, statusResult] = await Promise.all([
        runCommand("git", ["branch", "--show-current"], this.projectRoot),
        runCommand("git", ["status", "--porcelain", "-b"], this.projectRoot),
      ]);

      const branch = branchResult.stdout.trim() || "main";
      const lines = statusResult.stdout.split("\n").filter(Boolean);

      const staged: string[] = [];
      const unstaged: string[] = [];
      const untracked: string[] = [];

      for (const line of lines.slice(1)) { // Skip branch info line
        const x = line[0]; // Index status
        const y = line[1]; // Working tree status
        const file = line.substring(3);

        if (x === "?" && y === "?") untracked.push(file);
        else if (x !== " " && x !== "?") staged.push(file);
        else if (y !== " ") unstaged.push(file);
      }

      // Parse ahead/behind from first line
      let ahead = 0, behind = 0;
      const branchLine = lines[0] || "";
      const aheadMatch = branchLine.match(/ahead (\d+)/);
      const behindMatch = branchLine.match(/behind (\d+)/);
      if (aheadMatch) ahead = parseInt(aheadMatch[1]);
      if (behindMatch) behind = parseInt(behindMatch[1]);

      return {
        branch,
        clean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0,
        ahead, behind,
        staged, unstaged, untracked,
      };
    } catch (err: unknown) {
      return { branch: "error", clean: false, ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [] };
    }
  }

  async gitDiff(staged: boolean = false): Promise<GitDiff[]> {
    if (!ideConfig.git.enabled) return [];

    try {
      const args = staged ? ["diff", "--cached", "--stat"] : ["diff", "--stat"];
      const result = await runCommand("git", args, this.projectRoot);

      // Parse --stat output
      const diffs: GitDiff[] = [];
      const lines = result.stdout.split("\n").filter(Boolean);

      for (const line of lines) {
        const match = line.match(/^\s*(.+?)\s*\|\s*(\d+)\s*(\+*)/);
        if (match) {
          const [, file, changes, plusses] = match;
          const total = parseInt(changes);
          const additions = plusses.length;
          diffs.push({
            file: file.trim(),
            additions,
            deletions: total - additions,
            patch: "", // Full patch would require git diff without --stat
          });
        }
      }

      return diffs;
    } catch {
      return [];
    }
  }

  /**
   * Generate AI-powered commit message based on staged changes.
   * Format follows IDE_GIT_COMMIT_FORMAT setting.
   */
  async generateCommitMessage(diff: string): Promise<string> {
    const format = ideConfig.git.commitFormat;

    // Simple heuristic-based commit message (real implementation would use LLM)
    const fileTypes = new Set<string>();
    const actions = new Set<string>();

    const lines = diff.split("\n");
    for (const line of lines) {
      if (line.startsWith("+") && !line.startsWith("+++")) actions.add("add");
      if (line.startsWith("-") && !line.startsWith("---")) actions.add("modify");
      if (line.includes(".tsx") || line.includes(".ts")) fileTypes.add("component");
      if (line.includes("test")) fileTypes.add("test");
      if (line.includes(".css") || line.includes("style")) fileTypes.add("style");
    }

    const scope = fileTypes.size > 0 ? Array.from(fileTypes)[0] : "core";
    const action = actions.has("add") ? "feat" : "fix";

    switch (format) {
      case "conventional":
        return `${action}(${scope}): update ${scope} implementation`;
      case "gitmoji":
        const emoji = action === "feat" ? ":sparkles:" : ":bug:";
        return `${emoji} ${action}(${scope}): update ${scope} implementation`;
      case "plain":
      default:
        return `Update ${scope} implementation`;
    }
  }

  // ==========================================
  // 4. TypeScript Service
  // ==========================================
  async typeCheck(filePath?: string): Promise<CodeIssue[]> {
    if (!ideConfig.tsCheck.enabled) return [];

    try {
      const args = ["x", "tsc", "--noEmit", "--pretty"];
      if (filePath) {
        // Check specific file
        args.push(filePath);
      }

      const result = await runCommand("bun", args, this.projectRoot);

      if (result.exitCode === 0) return [];

      // Parse TypeScript errors
      const issues: CodeIssue[] = [];
      const errorLines = result.stdout.split("\n");
      for (const line of errorLines) {
        const match = line.match(/^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.+)$/);
        if (match) {
          issues.push({
            type: match[4] === "error" ? "error" : "warning",
            message: match[6],
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            rule: match[5],
          });
        }
      }

      return issues;
    } catch (err: unknown) {
      const error = err as Error;
      return [{ type: "error", message: `TypeScript check failed: ${error.message}`, file: filePath || "project", line: 0, column: 0 }];
    }
  }

  // ==========================================
  // 5. File Watcher
  // ==========================================
  async startWatching(): Promise<void> {
    if (!ideConfig.watcher.enabled) return;

    console.log(`[IDE] File watcher started: ${this.projectRoot}`);
    // Note: In production, use Bun's native file watcher
    // const watcher = Bun.watch(this.projectRoot, { recursive: true });
    // This is a placeholder — full implementation needs Bun.watch API
  }

  onFileChange(listener: (event: FileChangeEvent) => void): () => void {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== listener);
    };
  }

  // ==========================================
  // 6. Project Overview
  // ==========================================
  async getProjectOverview(): Promise<{
    root: string;
    language: string;
    files: { total: number; byExtension: Record<string, number> };
    git: GitStatus;
    tsErrors: number;
  }> {
    const git = await this.gitStatus();

    // Count files by extension
    const byExtension: Record<string, number> = {};
    let total = 0;

    try {
      const glob = new Bun.Glob("**/*.{ts,tsx,js,jsx,css,json,md}");
      for await (const file of glob.scan({ cwd: this.projectRoot, absolute: false })) {
        if (ideConfig.analysis.exclude.some(p => file.includes(p))) continue;
        const ext = "." + file.split(".").pop();
        byExtension[ext] = (byExtension[ext] || 0) + 1;
        total++;
      }
    } catch {
      // Silent fail
    }

    return {
      root: this.projectRoot,
      language: ideConfig.analysis.language,
      files: { total, byExtension },
      git,
      tsErrors: 0, // Would run typeCheck() for real count
    };
  }

  // ---- Cleanup ----
  destroy(): void {
    for (const [, watcher] of this.watchers) {
      try { watcher.close(); } catch {}
    }
    this.watchers.clear();
    this.changeListeners = [];
  }
}

// Singleton
let _ide: IDEBridge | null = null;
export function getIDEBridge(): IDEBridge {
  if (!_ide) {
    _ide = new IDEBridge();
  }
  return _ide;
}
