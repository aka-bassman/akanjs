import { afterEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CommandContainer,
  createWorkflowStepRegistry,
  type WorkflowApplyReport,
  type WorkflowPlan,
  type WorkflowValidationRunReport,
} from "@akanjs/devkit";
import { ModuleRunner } from "../module/module.runner";
import { ModuleScript } from "../module/module.script";
import { PrimitiveScript } from "../primitive/primitive.script";
import { ScalarScript } from "../scalar/scalar.script";
import { cleanupCliTempWorkspace, createTempModule } from "../testHelpers";
import { WorkflowRunner } from "./workflow.runner";

const tempRoots: string[] = [];

afterEach(async () => {
  CommandContainer.clear();
  await Promise.all(tempRoots.splice(0).map((root) => cleanupCliTempWorkspace(root)));
});

describe("WorkflowRunner", () => {
  test("lists initial workflow specs", () => {
    const output = new WorkflowRunner().list({ format: "json" });
    const result = JSON.parse(output) as {
      workflows: { name: string }[];
    };

    expect(result.workflows.map((workflow) => workflow.name)).toEqual([
      "add-enum-field",
      "add-field",
      "add-mutation",
      "add-slice",
      "create-module",
      "create-scalar",
      "create-ui",
    ]);
  });

  test("explains add-field with ordered steps and optional surfaces", () => {
    const output = new WorkflowRunner().explain("add-field");

    expect(output).toContain("# Workflow: add-field");
    expect(output).toContain("1. `inspect-module`");
    expect(output).toContain("2. `update-constant`");
    expect(output).toContain("- `template`: infer");
    expect(output).toContain("akan sync <app-or-lib>");
  });

  test("plans add-field as read-only json contract", async () => {
    const output = await new WorkflowRunner().plan(
      "add-field",
      {
        app: "demo",
        module: "task",
        field: "priority",
        type: "enum",
        values: "low,medium,high",
        default: null,
        scalar: null,
        surface: null,
        mutation: null,
        slice: null,
      },
      { format: "json" },
    );
    const plan = JSON.parse(output) as WorkflowPlan;

    expect(plan).toMatchObject({
      schemaVersion: 1,
      workflow: "add-field",
      mode: "plan",
      requiresApproval: true,
      diagnostics: [],
    });
    expect(plan.inputs).toMatchObject({ app: "demo", module: "task", field: "priority", type: "enum" });
    expect(plan.optionalSurfaces.template).toBe("infer");
    expect(plan.validation.map((validation) => validation.command)).toContain("akan sync <app-or-lib>");
    expect(output).not.toContain("akan scan");
  });

  test("writes workflow plan artifact when out is provided", async () => {
    const { root } = await createTempModule("task");
    tempRoots.push(root);
    const out = path.join(root, ".akan/workflows/plans/task-priority.json");

    const output = await new WorkflowRunner().plan(
      "add-field",
      {
        app: "demo",
        module: "task",
        field: "priority",
        type: "enum",
        values: "low,medium,high",
        default: null,
        scalar: null,
        surface: null,
        mutation: null,
        slice: null,
      },
      { format: "json", out },
    );
    const saved = JSON.parse(await readFile(out, "utf8")) as WorkflowPlan;

    expect(saved.workflow).toBe("add-field");
    expect(saved.inputs.values).toEqual(["low", "medium", "high"]);
    expect(JSON.parse(output)).toMatchObject({ workflow: "add-field", mode: "plan" });
  });

  test("returns structured diagnostics for missing required input", async () => {
    const output = await new WorkflowRunner().plan("add-field", {
      app: "demo",
      module: null,
      field: null,
      type: null,
      values: null,
      default: null,
      scalar: null,
      surface: null,
      mutation: null,
      slice: null,
    });

    expect(output).toContain("[error] workflow-input-missing");
    expect(output).toContain('requires input "module"');
    expect(output).toContain('requires input "field"');
    expect(output).toContain('requires input "type"');
  });

  test("dry-runs workflow apply from a plan artifact without writing files", async () => {
    const { root, module } = await createTempModule("task");
    tempRoots.push(root);
    await new ModuleRunner().createModuleTemplate(module);
    const planPath = path.join(root, ".akan/workflows/plans/task-priority.json");
    const runner = new WorkflowRunner();
    await runner.plan(
      "add-field",
      {
        app: "demo",
        module: "task",
        field: "priority",
        type: "String",
        values: null,
        default: null,
        scalar: null,
        surface: null,
        mutation: null,
        slice: null,
      },
      { format: "json", out: planPath },
    );

    const output = await runner.apply(planPath, { dryRun: true, format: "json" });
    const report = JSON.parse(output) as WorkflowApplyReport;

    expect(report).toMatchObject({ workflow: "add-field", mode: "dry-run", status: "passed" });
    expect(report.changedFiles.map((file) => file.path)).toContain("*/lib/<module>/<module>.constant.ts");
    expect(report.commands.map((command) => command.command)).toContain("akan sync demo");
    expect(await module.readFile("task.constant.ts")).not.toContain("priority");
  });

  test("applies add-field workflow through primitive step runners", async () => {
    const { root, workspace, module } = await createTempModule("task");
    tempRoots.push(root);
    await new ModuleRunner().createModuleTemplate(module);
    const planPath = path.join(root, ".akan/workflows/plans/task-priority.json");
    const runner = new WorkflowRunner();
    await runner.plan(
      "add-field",
      {
        app: "demo",
        module: "task",
        field: "priority",
        type: "String",
        values: null,
        default: null,
        scalar: null,
        surface: null,
        mutation: null,
        slice: null,
      },
      { format: "json", out: planPath },
    );

    const output = await runner.apply(planPath, {
      format: "json",
      registry: createWorkflowStepRegistry({
        workspace,
        createModule: (sys, module) => CommandContainer.get(ModuleScript).createModuleTemplate(sys, module),
        createScalar: (sys, scalar) => CommandContainer.get(ScalarScript).createScalar(sys, scalar),
        createUi: (input) => CommandContainer.get(PrimitiveScript).createUi(workspace, input),
        addField: (input) => CommandContainer.get(PrimitiveScript).addField(workspace, input),
        addEnumField: (input) => CommandContainer.get(PrimitiveScript).addEnumField(workspace, input),
      }),
    });
    const report = JSON.parse(output) as WorkflowApplyReport;

    expect(report).toMatchObject({ workflow: "add-field", mode: "apply", status: "passed" });
    expect(report.changedFiles.map((file) => file.path)).toContain("apps/demo/lib/task/task.constant.ts");
    expect(report.commands.map((command) => command.command)).toContain("akan sync demo");
    expect(await module.readFile("task.constant.ts")).toContain("priority: field(String),");
  });

  test("returns failed report for unsupported workflow steps", async () => {
    const { root, workspace } = await createTempModule("task");
    tempRoots.push(root);
    const planPath = path.join(root, ".akan/workflows/plans/archive-task.json");
    const runner = new WorkflowRunner();
    await runner.plan(
      "add-mutation",
      {
        app: "demo",
        module: "task",
        field: null,
        type: null,
        values: null,
        default: null,
        scalar: null,
        surface: null,
        mutation: "archive",
        slice: null,
      },
      { format: "json", out: planPath },
    );

    const output = await runner.apply(planPath, {
      format: "json",
      registry: createWorkflowStepRegistry({
        workspace,
        createModule: (sys, module) => CommandContainer.get(ModuleScript).createModuleTemplate(sys, module),
        createScalar: (sys, scalar) => CommandContainer.get(ScalarScript).createScalar(sys, scalar),
        createUi: (input) => CommandContainer.get(PrimitiveScript).createUi(workspace, input),
        addField: (input) => CommandContainer.get(PrimitiveScript).addField(workspace, input),
        addEnumField: (input) => CommandContainer.get(PrimitiveScript).addEnumField(workspace, input),
      }),
    });
    const report = JSON.parse(output) as WorkflowApplyReport;

    expect(report.status).toBe("failed");
    expect(report.diagnostics.map((diagnostic) => diagnostic.code)).toContain("workflow-step-unsupported");
    expect(report.nextActions.map((action) => action.command)).toContain("akan workflow explain add-mutation");
  });

  test("validates a workflow plan and stores a run report", async () => {
    const { root, workspace } = await createTempModule("task");
    tempRoots.push(root);
    const planPath = path.join(root, ".akan/workflows/plans/task-priority.json");
    const runner = new WorkflowRunner();
    await runner.plan(
      "add-field",
      {
        app: "demo",
        module: "task",
        field: "priority",
        type: "String",
        values: null,
        default: null,
        scalar: null,
        surface: null,
        mutation: null,
        slice: null,
      },
      { format: "json", out: planPath },
    );

    const output = await runner.validate(planPath, {
      format: "json",
      workspace,
      execute: async (command) => ({
        command: command.command,
        reason: command.reason,
        status: "passed",
        exitCode: 0,
        stdout: "ok",
      }),
    });
    const report = JSON.parse(output) as WorkflowValidationRunReport;
    const saved = JSON.parse(await readFile(path.join(root, ".akan/workflows/runs", `${report.runId}.json`), "utf8"));

    expect(report).toMatchObject({ workflow: "add-field", mode: "validate", status: "passed" });
    expect(report.commands.map((command) => command.command)).toContain("akan sync demo");
    expect(saved.runId).toBe(report.runId);
  });

  test("reads stored workflow run reports", async () => {
    const { root, workspace } = await createTempModule("task");
    tempRoots.push(root);
    const runner = new WorkflowRunner();
    const planPath = path.join(root, ".akan/workflows/plans/task-priority.json");
    const validateOutput = await (async () => {
      await runner.plan(
        "add-field",
        {
          app: "demo",
          module: "task",
          field: "priority",
          type: "String",
          values: null,
          default: null,
          scalar: null,
          surface: null,
          mutation: null,
          slice: null,
        },
        { format: "json", out: planPath },
      );
      return await runner.validate(planPath, {
        format: "json",
        workspace,
        execute: async (command) => ({
          command: command.command,
          reason: command.reason,
          status: "passed",
          exitCode: 0,
        }),
      });
    })();
    const run = JSON.parse(validateOutput) as WorkflowValidationRunReport;

    const output = await runner.report(run.runId, { format: "json", workspace });

    expect(JSON.parse(output)).toMatchObject({ runId: run.runId, workflow: "add-field", mode: "validate" });
  });
});
