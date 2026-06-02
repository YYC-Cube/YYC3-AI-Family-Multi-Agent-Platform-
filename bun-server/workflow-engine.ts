/**
 * file: workflow-engine.ts
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
 * YYC³ AI Family - Workflow Engine (创生流水线引擎)
 * 
 * Orchestrates multi-step pipelines:
 *   - Creation Seven-Step Pipeline (灵感→蓝图→织码→审视→脉动→诞生→守护)
 *   - Custom workflows (security scans, code reviews, deployments)
 *   - Cron-scheduled recurring tasks
 * 
 * Each step can invoke family members, run plugins, or call external services.
 * The engine enforces approval gates (人类导师审批) and timeout policies.
 */

import { workflow as wfConfig } from "./config";

// ==========================================
// Workflow Types
// ==========================================
export type WorkflowStatus = "PENDING" | "RUNNING" | "PAUSED" | "AWAITING_APPROVAL" | "COMPLETED" | "FAILED" | "CANCELLED";
export type StepStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED" | "AWAITING_APPROVAL";

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  agentId?: string;        // Which family member handles this step
  handler: string;         // Handler function name or plugin reference
  params: Record<string, unknown>;
  status: StepStatus;
  result?: unknown;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
  requiresApproval: boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: Omit<WorkflowStep, "status" | "result" | "error" | "startedAt" | "completedAt" | "retryCount">[];
  timeout: number;         // Total workflow timeout (ms)
  createdAt: number;
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  name: string;
  status: WorkflowStatus;
  currentStepIndex: number;
  steps: WorkflowStep[];
  params: Record<string, unknown>;
  output: Record<string, unknown>;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

// ==========================================
// Built-in: Creation Seven-Step Pipeline
// ==========================================
const CREATION_PIPELINE: WorkflowDefinition = {
  id: "creation_pipeline",
  name: "创生七步流水线",
  description: "从灵感火花到守护永恒的完整创生流程",
  timeout: 3600000, // 1 hour
  createdAt: Date.now(),
  steps: [
    {
      id: "spark",
      name: "灵感火花 (SPARK)",
      description: "沫言总定义需求意图，人类导师与智源架构师协商方向",
      agentId: "PRODUCT_MANAGER",
      handler: "creation_spark",
      params: { participants: ["PRODUCT_MANAGER", "CHIEF_ARCHITECT", "AI_ARCHITECT"] },
      requiresApproval: true,
    },
    {
      id: "blueprint",
      name: "蓝图织就 (BLUEPRINT)",
      description: "智源架构师绘制技术蓝图，织码者与人类导师评审",
      agentId: "AI_ARCHITECT",
      handler: "creation_blueprint",
      params: { participants: ["AI_ARCHITECT", "CODE_ARTISAN", "CHIEF_ARCHITECT"] },
      requiresApproval: true,
    },
    {
      id: "weaving",
      name: "匠心织码 (WEAVING)",
      description: "织码者编织实现代码，智源架构师与联结者协同",
      agentId: "CODE_ARTISAN",
      handler: "creation_weaving",
      params: { participants: ["CODE_ARTISAN", "AI_ARCHITECT", "COLLABORATOR"] },
      requiresApproval: false,
    },
    {
      id: "gaze",
      name: "天眼审视 (GAZE)",
      description: "守望者安全审计，智源架构师与织码者修复",
      agentId: "SENTINEL",
      handler: "creation_gaze",
      params: { participants: ["SENTINEL", "AI_ARCHITECT", "CODE_ARTISAN"] },
      requiresApproval: true,
    },
    {
      id: "pulse",
      name: "中枢脉动 (PULSE)",
      description: "中枢编排部署流水线，织码者与守望者验证",
      agentId: "CENTRAL_PULSE",
      handler: "creation_pulse",
      params: { participants: ["CENTRAL_PULSE", "CODE_ARTISAN", "SENTINEL"] },
      requiresApproval: false,
    },
    {
      id: "birth",
      name: "破茧诞生 (BIRTH)",
      description: "正式部署上线，中枢、守望者、联结者三方确认",
      agentId: "CENTRAL_PULSE",
      handler: "creation_birth",
      params: { participants: ["CENTRAL_PULSE", "SENTINEL", "COLLABORATOR"] },
      requiresApproval: true,
    },
    {
      id: "guardian",
      name: "守护永恒 (GUARDIAN)",
      description: "持续监控与维护，守望者领衔看护",
      agentId: "SENTINEL",
      handler: "creation_guardian",
      params: { participants: ["SENTINEL", "CENTRAL_PULSE", "CHIEF_ARCHITECT"] },
      requiresApproval: false,
    },
  ],
};

// Built-in workflow definitions
const BUILTIN_WORKFLOWS: Map<string, WorkflowDefinition> = new Map([
  ["creation_pipeline", CREATION_PIPELINE],
  ["security_scan", {
    id: "security_scan",
    name: "安全扫描",
    description: "守望者全面安全审计",
    timeout: 300000,
    createdAt: Date.now(),
    steps: [
      { id: "dep_audit", name: "依赖审计", description: "检查依赖漏洞", agentId: "SENTINEL", handler: "security_dep_audit", params: {}, requiresApproval: false },
      { id: "code_scan", name: "代码扫描", description: "静态安全分析", agentId: "SENTINEL", handler: "security_code_scan", params: {}, requiresApproval: false },
      { id: "report", name: "生成报告", description: "汇总安全报告", agentId: "SENTINEL", handler: "security_report", params: {}, requiresApproval: false },
    ],
  }],
  ["code_review", {
    id: "code_review",
    name: "代码审查",
    description: "织码者 + 守望者联合代码审查",
    timeout: 300000,
    createdAt: Date.now(),
    steps: [
      { id: "analyze", name: "代码分析", description: "静态分析与复杂度评估", agentId: "CODE_ARTISAN", handler: "review_analyze", params: {}, requiresApproval: false },
      { id: "security", name: "安全检查", description: "安全漏洞检查", agentId: "SENTINEL", handler: "review_security", params: {}, requiresApproval: false },
      { id: "suggest", name: "改进建议", description: "AI生成改进建议", agentId: "AI_ARCHITECT", handler: "review_suggest", params: {}, requiresApproval: false },
    ],
  }],
]);

// ==========================================
// Step Handlers Registry
// ==========================================
type StepHandler = (step: WorkflowStep, context: WorkflowInstance) => Promise<Record<string, unknown>>;

const stepHandlers: Map<string, StepHandler> = new Map();

// Register a default "echo" handler for all creation steps
for (const stepId of ["creation_spark", "creation_blueprint", "creation_weaving", "creation_gaze", "creation_pulse", "creation_birth", "creation_guardian"]) {
  stepHandlers.set(stepId, async (step, _ctx) => {
    console.log(`[WORKFLOW] Executing step: ${step.name} (${step.id}) | Agent: ${step.agentId || "system"}`);
    // In production: dispatch signal to agent, wait for response, validate output
    const participants = step.params.participants;
    const participantsStr = Array.isArray(participants) ? participants.join(", ") : "none";
    return {
      status: "completed",
      output: `Step '${step.name}' executed by ${step.agentId}. Participants: ${participantsStr}`,
      timestamp: Date.now(),
    };
  });
}

// Security scan handlers
for (const stepId of ["security_dep_audit", "security_code_scan", "security_report"]) {
  stepHandlers.set(stepId, async (step) => ({
    status: "completed",
    output: `Security step '${step.name}' completed`,
    timestamp: Date.now(),
  }));
}

// Code review handlers
for (const stepId of ["review_analyze", "review_security", "review_suggest"]) {
  stepHandlers.set(stepId, async (step) => ({
    status: "completed",
    output: `Review step '${step.name}' completed`,
    timestamp: Date.now(),
  }));
}

// ==========================================
// Workflow Engine
// ==========================================
export class WorkflowEngine {
  private instances: Map<string, WorkflowInstance> = new Map();
  private definitions: Map<string, WorkflowDefinition>;

  constructor() {
    this.definitions = new Map(BUILTIN_WORKFLOWS);
    console.log(`[WORKFLOW] Engine initialized: ${this.definitions.size} workflow definitions`);
  }

  // ---- Definition Management ----
  registerWorkflow(def: WorkflowDefinition): void {
    this.definitions.set(def.id, def);
    console.log(`[WORKFLOW] Registered: ${def.id} (${def.steps.length} steps)`);
  }

  listWorkflows(): { id: string; name: string; description: string; stepCount: number }[] {
    return Array.from(this.definitions.values()).map(d => ({
      id: d.id, name: d.name, description: d.description, stepCount: d.steps.length,
    }));
  }

  // ---- Instance Management ----
  async trigger(workflowId: string, params: Record<string, unknown> = {}): Promise<WorkflowInstance | null> {
    if (!wfConfig.enabled) {
      console.warn("[WORKFLOW] Engine disabled. Set WORKFLOW_ENABLED=true");
      return null;
    }

    const def = this.definitions.get(workflowId);
    if (!def) {
      console.error(`[WORKFLOW] Unknown workflow: ${workflowId}`);
      return null;
    }

    // Check concurrent limit
    const running = Array.from(this.instances.values()).filter(i => i.status === "RUNNING").length;
    if (running >= wfConfig.maxConcurrent) {
      console.warn(`[WORKFLOW] Concurrent limit reached (${running}/${wfConfig.maxConcurrent})`);
      return null;
    }

    const instance: WorkflowInstance = {
      id: crypto.randomUUID(),
      definitionId: def.id,
      name: def.name,
      status: "PENDING",
      currentStepIndex: 0,
      steps: def.steps.map(s => ({
        ...s,
        status: "PENDING" as StepStatus,
        retryCount: 0,
      })),
      params,
      output: {},
      startedAt: Date.now(),
    };

    this.instances.set(instance.id, instance);
    console.log(`[WORKFLOW] Triggered: ${def.name} (${instance.id.substring(0, 8)})`);

    // Start execution (non-blocking)
    this.executeWorkflow(instance).catch(err => {
      console.error(`[WORKFLOW] Unhandled error in ${instance.id}:`, err);
      instance.status = "FAILED";
      instance.error = err.message;
    });

    return instance;
  }

  getInstance(id: string): WorkflowInstance | undefined {
    return this.instances.get(id);
  }

  listInstances(): WorkflowInstance[] {
    return Array.from(this.instances.values());
  }

  // ---- Approval ----
  async approve(instanceId: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== "AWAITING_APPROVAL") return false;

    console.log(`[WORKFLOW] Approved: ${instance.name} step ${instance.currentStepIndex}`);
    instance.status = "RUNNING";

    // Continue execution
    this.executeWorkflow(instance).catch(err => {
      instance.status = "FAILED";
      instance.error = err.message;
    });

    return true;
  }

  async reject(instanceId: string, reason: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== "AWAITING_APPROVAL") return false;

    instance.status = "CANCELLED";
    instance.error = `Rejected: ${reason}`;
    instance.completedAt = Date.now();
    console.log(`[WORKFLOW] Rejected: ${instance.name} — ${reason}`);
    return true;
  }

  // ---- Execution ----
  private async executeWorkflow(instance: WorkflowInstance): Promise<void> {
    instance.status = "RUNNING";

    while (instance.currentStepIndex < instance.steps.length) {
      const step = instance.steps[instance.currentStepIndex];

      // Check if step requires approval
      if (step.requiresApproval && wfConfig.creation.requireApproval && step.status === "PENDING") {
        step.status = "AWAITING_APPROVAL";
        instance.status = "AWAITING_APPROVAL";
        console.log(`[WORKFLOW] Awaiting approval for step: ${step.name}`);
        return; // Paused — will resume after approve()
      }

      // Execute step
      step.status = "RUNNING";
      step.startedAt = Date.now();

      try {
        const handler = stepHandlers.get(step.handler);
        if (!handler) {
          throw new Error(`No handler for step: ${step.handler}`);
        }

        // Timeout enforcement
        const result = await Promise.race([
          handler(step, instance),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Step timeout: ${wfConfig.stepTimeout}ms`)), wfConfig.stepTimeout)
          ),
        ]);

        step.status = "COMPLETED";
        step.result = result;
        step.completedAt = Date.now();
        instance.output[step.id] = result;

        console.log(`[WORKFLOW] Step completed: ${step.name} (${step.completedAt - step.startedAt}ms)`);

      } catch (err: unknown) {
        const error = err as Error;
        step.retryCount++;
        if (step.retryCount <= wfConfig.retryMax) {
          console.warn(`[WORKFLOW] Step failed, retrying (${step.retryCount}/${wfConfig.retryMax}): ${step.name} — ${error.message}`);
          await new Promise(r => setTimeout(r, wfConfig.retryDelay));
          continue; // Retry same step
        }

        step.status = "FAILED";
        step.error = error.message;
        step.completedAt = Date.now();
        instance.status = "FAILED";
        instance.error = `Step '${step.name}' failed: ${error.message}`;
        instance.completedAt = Date.now();
        return;
      }

      // Auto-advance to next step
      instance.currentStepIndex++;

      if (!wfConfig.creation.autoAdvance && instance.definitionId === "creation_pipeline") {
        // Manual mode: pause between steps if not auto-advance
        // (But still continue if current step didn't require approval)
      }
    }

    // All steps completed
    instance.status = "COMPLETED";
    instance.completedAt = Date.now();
    const duration = instance.completedAt - instance.startedAt;
    console.log(`[WORKFLOW] Completed: ${instance.name} (${duration}ms, ${instance.steps.length} steps)`);
  }

  // ---- Register Custom Step Handler ----
  registerStepHandler(handlerName: string, handler: StepHandler): void {
    stepHandlers.set(handlerName, handler);
  }
}

// Singleton
let _engine: WorkflowEngine | null = null;
export function getWorkflowEngine(): WorkflowEngine {
  if (!_engine) {
    _engine = new WorkflowEngine();
  }
  return _engine;
}
