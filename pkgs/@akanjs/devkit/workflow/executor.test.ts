import { describe, expect, test } from "bun:test";
import { WorkflowExecutor, workflowStepKey } from "./executor";
import type {
  PrimitiveChangedFile,
  WorkflowDiagnostic,
  WorkflowPlan,
  WorkflowStep,
  WorkflowStepRegistry,
  WorkflowStepResult,
} from "./types";

/**
 * `WorkflowExecutor` takes its registry by constructor injection and its plan as data, so `apply` runs with
 * no filesystem and no workspace — the `workspace` argument is what gates every post-apply check. These
 * cover the ordering rules that `cli/workflow/workflow.test.ts` can only reach through a real scaffold.
 */
const step = (id: string, tool = `tool:${id}`): WorkflowStep => ({
  id,
  tool,
  title: id,
  description: id,
});

// Every field spelled out rather than cast through `unknown`: `apply` reads `validation` before the first
// step runs, so a partial literal fails at runtime instead of at the type level.
const planOf = (steps: WorkflowStep[], diagnostics: WorkflowDiagnostic[] = []): WorkflowPlan => ({
  schemaVersion: 1,
  workflow: "add-field",
  mode: "plan",
  inputs: {},
  optionalSurfaces: {},
  steps,
  predictedChanges: [],
  validation: [],
  diagnostics,
  recommendations: [],
  requiresApproval: true,
});

/**
 * A registry that records **which key** each call resolved through, not just that a step ran — the
 * resolution order is the thing under test, and every candidate key would otherwise record the same step id.
 */
const changed = (path: string): PrimitiveChangedFile => ({ path, action: "modify", reason: "test" });

const recordingRegistry = (results: Record<string, WorkflowStepResult | undefined> = {}) => {
  const calls: string[] = [];
  const registry: WorkflowStepRegistry = {};
  const on = (key: string) => {
    registry[key] = async () => {
      calls.push(key);
      return results[key];
    };
  };
  return { calls, registry, on };
};

describe("WorkflowExecutor.apply", () => {
  test("runs no step when the plan already carries an error diagnostic", async () => {
    const { calls, registry, on } = recordingRegistry();
    on(workflowStepKey("add-field", "one"));
    const plan = planOf([step("one")], [{ severity: "error", code: "plan-invalid", message: "bad inputs" }]);

    const report = await new WorkflowExecutor(registry).apply(plan);

    expect(calls).toEqual([]);
    expect(report.diagnostics.map((diagnostic) => diagnostic.code)).toContain("plan-invalid");
  });

  test("a warning in the plan does not stop the steps", async () => {
    const { calls, registry, on } = recordingRegistry();
    on(workflowStepKey("add-field", "one"));
    const plan = planOf([step("one")], [{ severity: "warning", code: "plan-note", message: "heads up" }]);

    await new WorkflowExecutor(registry).apply(plan);

    expect(calls).toEqual([workflowStepKey("add-field", "one")]);
  });

  test("resolves a runner by workflow-scoped key first, then tool, then bare step id", async () => {
    const { calls, registry, on } = recordingRegistry();
    // All three keys are registered for the same step, so only the winner records a call.
    on(workflowStepKey("add-field", "scoped"));
    on("tool:scoped");
    on("scoped");
    await new WorkflowExecutor(registry).apply(planOf([step("scoped")]));
    expect(calls).toEqual([workflowStepKey("add-field", "scoped")]);

    const byTool = recordingRegistry();
    byTool.on("tool:viaTool");
    byTool.on("viaTool");
    await new WorkflowExecutor(byTool.registry).apply(planOf([step("viaTool")]));
    expect(byTool.calls).toEqual(["tool:viaTool"]);

    const byId = recordingRegistry();
    byId.on("viaId");
    await new WorkflowExecutor(byId.registry).apply(planOf([step("viaId")]));
    expect(byId.calls).toEqual(["viaId"]);
  });

  test("an unsupported step is reported and abandons the rest of the plan", async () => {
    const { calls, registry, on } = recordingRegistry();
    on(workflowStepKey("add-field", "first"));
    on(workflowStepKey("add-field", "third"));

    const report = await new WorkflowExecutor(registry).apply(planOf([step("first"), step("second"), step("third")]));

    expect(calls).toEqual([workflowStepKey("add-field", "first")]);
    expect(report.diagnostics.map((diagnostic) => diagnostic.code)).toContain("workflow-step-unsupported");
    expect(report.nextActions.map((action) => action.command)).toContain("akan workflow explain add-field");
  });

  test("accumulates changed files and diagnostics across steps, and stops at the first error", async () => {
    const key = (id: string) => workflowStepKey("add-field", id);
    const { calls, registry, on } = recordingRegistry({
      [key("a")]: { changedFiles: [changed("apps/demo/lib/task/task.constant.ts")] },
      [key("b")]: {
        changedFiles: [changed("apps/demo/lib/task/task.dictionary.ts")],
        diagnostics: [{ severity: "error", code: "step-failed", message: "no such module" }],
      },
      [key("c")]: { changedFiles: [changed("never-reached.ts")] },
    });
    on(key("a"));
    on(key("b"));
    on(key("c"));

    const report = await new WorkflowExecutor(registry).apply(planOf([step("a"), step("b"), step("c")]));

    expect(calls).toEqual([key("a"), key("b")]);
    expect(report.changedFiles.map((file) => file.path)).toEqual([
      "apps/demo/lib/task/task.constant.ts",
      "apps/demo/lib/task/task.dictionary.ts",
    ]);
    expect(report.diagnostics.map((diagnostic) => diagnostic.code)).toContain("step-failed");
  });

  test("a runner that answers nothing is not an error", async () => {
    const { calls, registry, on } = recordingRegistry();
    on(workflowStepKey("add-field", "silent"));
    const report = await new WorkflowExecutor(registry).apply(planOf([step("silent")]));

    expect(calls).toEqual([workflowStepKey("add-field", "silent")]);
    expect(report.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([]);
    expect(report.changedFiles).toEqual([]);
  });
});
