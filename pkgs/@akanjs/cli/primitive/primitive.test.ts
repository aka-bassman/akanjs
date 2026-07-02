import { afterEach, describe, expect, test } from "bun:test";
import { CommandContainer } from "@akanjs/devkit";
import { ModuleRunner } from "../module/module.runner";
import { cleanupCliTempWorkspace, createTempModule } from "../testHelpers";
import { PrimitiveScript } from "./primitive.script";

const tempRoots: string[] = [];

afterEach(async () => {
  CommandContainer.clear();
  await Promise.all(tempRoots.splice(0).map((root) => cleanupCliTempWorkspace(root)));
});

describe("PrimitiveScript", () => {
  test("adds a source-limited field to module constant and dictionary files", async () => {
    const { root, workspace, module } = await createTempModule("post");
    tempRoots.push(root);
    await new ModuleRunner().createModuleTemplate(module);
    const script = CommandContainer.get(PrimitiveScript);

    const report = await script.addField(workspace, {
      app: "demo",
      module: "post",
      field: "priority",
      type: "String",
    });

    expect(report.status).toBe("passed");
    expect(report.changedFiles.map((file) => file.path)).toContain("apps/demo/lib/post/post.constant.ts");
    expect(report.validationCommands.map((validation) => validation.command)).toContain("akan sync demo");
    expect(report.nextActions.map((action) => action.command)).toContain("akan sync demo");
    expect(await module.readFile("post.constant.ts")).toContain("priority: field(String),");
    expect(await module.readFile("post.dictionary.ts")).toContain('priority: t(["Priority", "Priority"])');
  });

  test("normalizes integer and float field type aliases", async () => {
    const { root, workspace, module } = await createTempModule("post");
    tempRoots.push(root);
    await new ModuleRunner().createModuleTemplate(module);
    const script = CommandContainer.get(PrimitiveScript);

    const integerReport = await script.addField(workspace, {
      app: "demo",
      module: "post",
      field: "budget",
      type: "integer",
      defaultValue: "0",
    });
    const floatReport = await script.addField(workspace, {
      app: "demo",
      module: "post",
      field: "rating",
      type: "float",
      defaultValue: "0.5",
    });

    expect(integerReport.status).toBe("passed");
    expect(floatReport.status).toBe("passed");
    const constant = await module.readFile("post.constant.ts");
    expect(constant).toContain('import { Float, Int } from "akanjs/base";');
    expect(constant).toContain("budget: field(Int, { default: 0 }),");
    expect(constant).toContain("rating: field(Float, { default: 0.5 }),");
  });

  test("coerces boolean and string defaults and rejects invalid numeric defaults", async () => {
    const { root, workspace, module } = await createTempModule("post");
    tempRoots.push(root);
    await new ModuleRunner().createModuleTemplate(module);
    const script = CommandContainer.get(PrimitiveScript);

    const booleanReport = await script.addField(workspace, {
      app: "demo",
      module: "post",
      field: "published",
      type: "Boolean",
      defaultValue: "false",
    });
    const stringReport = await script.addField(workspace, {
      app: "demo",
      module: "post",
      field: "title",
      type: "String",
      defaultValue: "Untitled",
    });
    const invalidReport = await script.addField(workspace, {
      app: "demo",
      module: "post",
      field: "budget",
      type: "Int",
      defaultValue: "free",
    });

    expect(booleanReport.status).toBe("passed");
    expect(stringReport.status).toBe("passed");
    expect(invalidReport.status).toBe("failed");
    expect(invalidReport.diagnostics).toContainEqual(
      expect.objectContaining({ code: "primitive-default-value-invalid", input: "default" }),
    );
    const constant = await module.readFile("post.constant.ts");
    expect(constant).toContain("published: field(Boolean, { default: false }),");
    expect(constant).toContain('title: field(String, { default: "Untitled" }),');
    expect(constant).not.toContain("budget:");
  });

  test("rejects ambiguous number field types without writing source files", async () => {
    const { root, workspace, module } = await createTempModule("post");
    tempRoots.push(root);
    await new ModuleRunner().createModuleTemplate(module);
    const script = CommandContainer.get(PrimitiveScript);

    const lowerReport = await script.addField(workspace, {
      app: "demo",
      module: "post",
      field: "budget",
      type: "number",
    });
    const upperReport = await script.addField(workspace, {
      app: "demo",
      module: "post",
      field: "cost",
      type: "Number",
    });

    expect(lowerReport.status).toBe("failed");
    expect(upperReport.status).toBe("failed");
    expect(lowerReport.diagnostics).toContainEqual(
      expect.objectContaining({ code: "primitive-field-type-unsupported", input: "type" }),
    );
    const constant = await module.readFile("post.constant.ts");
    expect(constant).not.toContain("field(Number)");
    expect(constant).not.toContain("budget:");
    expect(constant).not.toContain("cost:");
  });

  test("adds an enum field and enum dictionary without syncing generated files", async () => {
    const { root, workspace, module } = await createTempModule("task");
    tempRoots.push(root);
    await new ModuleRunner().createModuleTemplate(module);
    const script = CommandContainer.get(PrimitiveScript);

    const report = await script.addEnumField(workspace, {
      app: "demo",
      module: "task",
      field: "priority",
      values: "low,medium,high",
      defaultValue: "medium",
    });

    expect(report.status).toBe("passed");
    expect(report.command).toBe("add-enum-field");
    expect(report.generatedFiles.every((file) => file.action === "sync")).toBe(true);
    const constant = await module.readFile("task.constant.ts");
    const dictionary = await module.readFile("task.dictionary.ts");
    expect(constant).toContain('export class TaskPriority extends enumOf("taskPriority"');
    expect(constant).toContain('priority: field(TaskPriority, { default: "medium" }),');
    expect(dictionary).toContain('import type { Task, TaskInsight, TaskPriority } from "./task.constant";');
    expect(dictionary).toContain('.enum<TaskPriority>("taskPriority"');
  });

  test("returns diagnostics for missing required inputs", async () => {
    const { root, workspace } = await createTempModule("unused");
    tempRoots.push(root);
    const report = await CommandContainer.get(PrimitiveScript).addField(workspace, {
      app: "demo",
      module: null,
      field: null,
      type: null,
    });

    expect(report.status).toBe("failed");
    expect(report.diagnostics.map((diagnostic) => diagnostic.input)).toEqual(["module", "field", "type"]);
    expect(report.changedFiles).toEqual([]);
  });
});
