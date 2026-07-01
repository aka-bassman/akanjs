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
