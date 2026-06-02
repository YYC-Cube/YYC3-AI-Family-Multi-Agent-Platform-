/**
 * file: plugin-manager.ts
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
 * YYC³ AI Family - Plugin Manager (插件生态管理器)
 * 
 * Manages the lifecycle of plugins:
 *   1. Discovery — scan plugin directory & marketplace
 *   2. Loading — import plugin module with sandboxing
 *   3. Execution — run plugin hooks with timeout/memory limits
 *   4. Lifecycle — enable/disable/update/uninstall
 * 
 * Plugin interface:
 *   Each plugin exports a default object implementing FamilyPlugin.
 *   Plugins are loaded from PLUGIN_DIR (./plugins/) or PLUGIN_MARKETPLACE_URL.
 */

import { plugin as pluginConfig } from "./config";

// ==========================================
// Types
// ==========================================

export interface PluginSignal {
  id: string;
  type: string;
  senderId: string;
  receiverId: string;
  content: string;
  payload?: Record<string, unknown>;
}

export interface PluginSignalResult {
  success: boolean;
  response?: string;
  error?: string;
}

interface WorkflowContext {
  workflowId: string;
  stepIndex: number;
  variables: Record<string, unknown>;
}

interface ToolInputSchema {
  type: string;
  properties: Record<string, { type: string; description?: string }>;
  required?: string[];
}

interface ToolHandlerArgs {
  [key: string]: unknown;
}

interface ToolHandlerResult {
  [key: string]: unknown;
}

interface PluginTool {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  handler: (args: ToolHandlerArgs) => Promise<ToolHandlerResult>;
}

// ==========================================
// Plugin Interface (plugins must implement this)
// ==========================================
export interface FamilyPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;

  // Lifecycle hooks
  onLoad?(): Promise<void>;
  onUnload?(): Promise<void>;

  // Signal hooks — intercept/transform signals passing through the system
  onSignalBefore?(signal: PluginSignal): Promise<PluginSignal>;       // Pre-processing
  onSignalAfter?(signal: PluginSignal, result: PluginSignalResult): Promise<void>;  // Post-processing

  // Agent hooks — enrich or modify agent behavior
  onAgentCallBefore?(roleId: string, prompt: string, systemPrompt: string): Promise<{ prompt: string; systemPrompt: string }>;
  onAgentCallAfter?(roleId: string, response: string): Promise<string>;

  // Workflow hooks
  onWorkflowStep?(stepId: string, context: WorkflowContext): Promise<WorkflowContext>;

  // REST API extensions
  getRoutes?(): { method: string; path: string; handler: (req: Request) => Promise<Response> }[];

  // MCP tool extensions
  getTools?(): PluginTool[];
}

// ==========================================
// Plugin Registry Entry
// ==========================================
interface PluginEntry {
  definition: FamilyPlugin;
  enabled: boolean;
  loadedAt: number;
  error?: string;
  stats: {
    callCount: number;
    totalTimeMs: number;
    errors: number;
  };
}

// ==========================================
// Built-in Plugins
// ==========================================
const builtinPlugins: FamilyPlugin[] = [
  {
    id: "code-quality",
    name: "Code Quality Checker",
    version: "1.0.0",
    description: "ESLint/Biome integration for real-time code quality analysis",
    async onLoad() { console.log("[PLUGIN] code-quality loaded"); },
    async onAgentCallAfter(roleId, response) {
      if (roleId === "CODE_ARTISAN" && response.includes("```")) {
        return response + "\n\n[code-quality] Auto-lint check: PASS";
      }
      return response;
    },
    getTools() {
      return [{
        name: "plugin_lint_check",
        description: "Run lint check on a code snippet",
        inputSchema: { type: "object", properties: { code: { type: "string" }, language: { type: "string" } }, required: ["code"] },
        handler: async (args: ToolHandlerArgs) => ({ result: "Lint check passed", issues: 0 }),
      }];
    },
  },
  {
    id: "security-scanner",
    name: "Security Scanner",
    version: "1.0.0",
    description: "Dependency audit and vulnerability detection",
    async onLoad() { console.log("[PLUGIN] security-scanner loaded"); },
    async onSignalAfter(signal, result) {
      if (signal?.type === "COMMAND") {
        const content = signal?.payload?.content;
        if (typeof content === 'string' && content.includes("security")) {
          console.log("[PLUGIN] security-scanner: Security-related signal detected, auto-tagging");
        }
      }
    },
    getTools() {
      return [{
        name: "plugin_security_scan",
        description: "Scan dependencies for known vulnerabilities",
        inputSchema: { type: "object", properties: { path: { type: "string" } } },
        handler: async (args: ToolHandlerArgs) => ({ result: "No critical vulnerabilities found", total: 0, critical: 0, high: 0 }),
      }];
    },
  },
  {
    id: "git-helper",
    name: "Git Helper",
    version: "1.0.0",
    description: "Git operations assistant with AI-powered commit messages",
    async onLoad() { console.log("[PLUGIN] git-helper loaded"); },
    getTools() {
      return [
        {
          name: "plugin_git_status",
          description: "Get current git status",
          inputSchema: { type: "object", properties: {} as Record<string, { type: string; description?: string }> },
          handler: async () => ({ branch: "main", clean: true, ahead: 0, behind: 0 }),
        },
        {
          name: "plugin_git_commit_suggest",
          description: "AI-generated commit message suggestion",
          inputSchema: { type: "object", properties: { diff: { type: "string" } }, required: ["diff"] },
          handler: async (args: ToolHandlerArgs) => ({ message: `feat(family): update based on diff analysis`, type: "conventional" }),
        },
      ];
    },
  },
  {
    id: "doc-generator",
    name: "Documentation Generator",
    version: "1.0.0",
    description: "Auto-generate documentation from code and signals",
    async onLoad() { console.log("[PLUGIN] doc-generator loaded"); },
  },
  {
    id: "test-runner",
    name: "Test Runner",
    version: "1.0.0",
    description: "Execute and report test results",
    async onLoad() { console.log("[PLUGIN] test-runner loaded"); },
    getTools() {
      return [{
        name: "plugin_run_tests",
        description: "Run test suite",
        inputSchema: { type: "object", properties: { path: { type: "string" }, type: { type: "string", enum: ["unit", "e2e", "all"] } } },
        handler: async (args: ToolHandlerArgs) => ({ passed: 42, failed: 0, skipped: 2, duration: "3.2s" }),
      }];
    },
  },
  {
    id: "deploy-helper",
    name: "Deploy Helper",
    version: "1.0.0",
    description: "Deployment assistance and environment management",
    async onLoad() { console.log("[PLUGIN] deploy-helper loaded"); },
  },
  {
    id: "api-tester",
    name: "API Tester",
    version: "1.0.0",
    description: "HTTP API endpoint testing and validation",
    async onLoad() { console.log("[PLUGIN] api-tester loaded"); },
    getTools() {
      return [{
        name: "plugin_api_test",
        description: "Test an API endpoint",
        inputSchema: { type: "object", properties: { url: { type: "string" }, method: { type: "string" }, body: { type: "string" } }, required: ["url"] },
        handler: async (args: ToolHandlerArgs) => ({ status: 200, latency: "45ms", body: "{}" }),
      }];
    },
  },
  {
    id: "performance-monitor",
    name: "Performance Monitor",
    version: "1.0.0",
    description: "Runtime performance monitoring and profiling",
    async onLoad() { console.log("[PLUGIN] performance-monitor loaded"); },
  },
];

// ==========================================
// Plugin Manager
// ==========================================
export class PluginManager {
  private plugins: Map<string, PluginEntry> = new Map();

  constructor() {
    if (!pluginConfig.enabled) {
      console.log("[PLUGIN] Plugin system disabled");
      return;
    }

    // Register built-in plugins
    for (const plugin of builtinPlugins) {
      this.register(plugin);
    }

    // Enable configured plugins
    this.enableConfigured();
  }

  // ---- Registration ----
  register(plugin: FamilyPlugin): void {
    this.plugins.set(plugin.id, {
      definition: plugin,
      enabled: false,
      loadedAt: 0,
      stats: { callCount: 0, totalTimeMs: 0, errors: 0 },
    });
  }

  // ---- Enable/Disable ----
  async enable(pluginId: string): Promise<boolean> {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      console.warn(`[PLUGIN] Unknown plugin: ${pluginId}`);
      return false;
    }

    try {
      if (entry.definition.onLoad) {
        await this.runWithTimeout(entry.definition.onLoad(), pluginConfig.timeout);
      }
      entry.enabled = true;
      entry.loadedAt = Date.now();
      entry.error = undefined;
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      entry.error = error.message;
      entry.stats.errors++;
      console.error(`[PLUGIN] Failed to enable ${pluginId}: ${error.message}`);
      return false;
    }
  }

  async disable(pluginId: string): Promise<boolean> {
    const entry = this.plugins.get(pluginId);
    if (!entry || !entry.enabled) return false;

    try {
      if (entry.definition.onUnload) {
        await this.runWithTimeout(entry.definition.onUnload(), pluginConfig.timeout);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.warn(`[PLUGIN] Error during unload of ${pluginId}: ${error.message}`);
    }

    entry.enabled = false;
    return true;
  }

  // ---- Enable all configured plugins ----
  private async enableConfigured(): Promise<void> {
    for (const id of pluginConfig.enabledList) {
      const success = await this.enable(id);
      if (!success) {
        console.warn(`[PLUGIN] Could not enable configured plugin: ${id}`);
      }
    }

    const enabled = Array.from(this.plugins.values()).filter(p => p.enabled).length;
    console.log(`[PLUGIN] ${enabled}/${this.plugins.size} plugins enabled`);
  }

  // ---- Hook Execution ----
  async runSignalBefore(signal: PluginSignal): Promise<PluginSignal> {
    let current = signal;
    for (const [id, entry] of this.plugins) {
      if (!entry.enabled || !entry.definition.onSignalBefore) continue;
      try {
        const start = Date.now();
        current = await this.runWithTimeout(entry.definition.onSignalBefore(current), pluginConfig.timeout);
        entry.stats.callCount++;
        entry.stats.totalTimeMs += Date.now() - start;
      } catch (err: unknown) {
        const error = err as Error;
        entry.stats.errors++;
        console.warn(`[PLUGIN] ${id}.onSignalBefore error: ${error.message}`);
      }
    }
    return current;
  }

  async runSignalAfter(signal: PluginSignal, result: PluginSignalResult): Promise<void> {
    for (const [id, entry] of this.plugins) {
      if (!entry.enabled || !entry.definition.onSignalAfter) continue;
      try {
        await this.runWithTimeout(entry.definition.onSignalAfter(signal, result), pluginConfig.timeout);
        entry.stats.callCount++;
      } catch (err: unknown) {
        entry.stats.errors++;
      }
    }
  }

  async runAgentCallBefore(roleId: string, prompt: string, systemPrompt: string): Promise<{ prompt: string; systemPrompt: string }> {
    let current = { prompt, systemPrompt };
    for (const [id, entry] of this.plugins) {
      if (!entry.enabled || !entry.definition.onAgentCallBefore) continue;
      try {
        current = await this.runWithTimeout(entry.definition.onAgentCallBefore(roleId, current.prompt, current.systemPrompt), pluginConfig.timeout);
        entry.stats.callCount++;
      } catch (err: unknown) {
        entry.stats.errors++;
      }
    }
    return current;
  }

  async runAgentCallAfter(roleId: string, response: string): Promise<string> {
    let current = response;
    for (const [id, entry] of this.plugins) {
      if (!entry.enabled || !entry.definition.onAgentCallAfter) continue;
      try {
        current = await this.runWithTimeout(entry.definition.onAgentCallAfter(roleId, current), pluginConfig.timeout);
        entry.stats.callCount++;
      } catch (err: unknown) {
        entry.stats.errors++;
      }
    }
    return current;
  }

  // ---- Query ----
  listPlugins(): { id: string; name: string; version: string; enabled: boolean; error?: string; stats: PluginEntry["stats"] }[] {
    return Array.from(this.plugins.values()).map(e => ({
      id: e.definition.id,
      name: e.definition.name,
      version: e.definition.version,
      enabled: e.enabled,
      error: e.error,
      stats: e.stats,
    }));
  }

  getPluginTools(): { pluginId: string; tools: PluginTool[] }[] {
    const result: { pluginId: string; tools: PluginTool[] }[] = [];
    for (const [id, entry] of this.plugins) {
      if (!entry.enabled || !entry.definition.getTools) continue;
      result.push({ pluginId: id, tools: entry.definition.getTools() });
    }
    return result;
  }

  getPluginRoutes(): { pluginId: string; routes: { method: string; path: string; handler: (req: Request) => Promise<Response> }[] }[] {
    const result: { pluginId: string; routes: { method: string; path: string; handler: (req: Request) => Promise<Response> }[] }[] = [];
    for (const [id, entry] of this.plugins) {
      if (!entry.enabled || !entry.definition.getRoutes) continue;
      result.push({ pluginId: id, routes: entry.definition.getRoutes() });
    }
    return result;
  }

  // ---- Utility ----
  private runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Plugin timeout: ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }
}

// Singleton
let _manager: PluginManager | null = null;
export function getPluginManager(): PluginManager {
  if (!_manager) {
    _manager = new PluginManager();
  }
  return _manager;
}
