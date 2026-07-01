import { describe, expect, test } from "bun:test";
import type { WorkflowPlan } from "@akanjs/devkit";
import { WorkflowRunner } from "./workflow.runner";

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

  test("plans add-field as read-only json contract", () => {
    const output = new WorkflowRunner().plan(
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

  test("returns structured diagnostics for missing required input", () => {
    const output = new WorkflowRunner().plan("add-field", {
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
});
