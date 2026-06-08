import { afterEach, describe, expect, test } from "bun:test";
import { AkanContextAnalyzer, CommandContainer } from "@akanjs/devkit";
import { AgentRunner } from "../agent/agent.runner";
import { ModuleRunner } from "../module/module.runner";
import { cleanupCliTempWorkspace, createTempApp, createTempModule, writeText } from "../testHelpers";
import { ContextRunner } from "./context.runner";

const tempRoots: string[] = [];

afterEach(async () => {
  CommandContainer.clear();
  await Promise.all(tempRoots.splice(0).map((root) => cleanupCliTempWorkspace(root)));
});

describe("ContextRunner", () => {
  test("prints module context with abstract content before module files", async () => {
    const { root, workspace, module } = await createTempModule("post");
    tempRoots.push(root);
    await new ModuleRunner().createModuleTemplate(module);

    const output = await new ContextRunner().getContext(workspace, { module: "post" });

    expect(output).toContain("# Module Abstract");
    expect(output.indexOf("# Module Abstract")).toBeLessThan(output.indexOf("- Files:"));
  });

  test("reports missing abstract as warning by default and error in strict mode", async () => {
    const { root, workspace, app } = await createTempApp("demo");
    tempRoots.push(root);
    await writeText(`${app.cwdPath}/lib/post/post.constant.ts`, "export class Post {}\n");

    const loose = await AkanContextAnalyzer.doctor(workspace);
    const strict = await AkanContextAnalyzer.doctor(workspace, { strict: true });

    expect(loose.diagnostics[0]).toMatchObject({ code: "module-abstract-missing", severity: "warning" });
    expect(strict.diagnostics[0]).toMatchObject({ code: "module-abstract-missing", severity: "error" });
  });

  test("explains the MCP command", () => {
    expect(new ContextRunner().explainCommand("mcp")).toContain("read-only Akan MCP server");
  });
});

describe("AgentRunner", () => {
  test("installs agent rules with abstract guidance and overwrite protection", async () => {
    const { root, workspace } = await createTempApp("demo");
    tempRoots.push(root);
    const runner = new AgentRunner();

    const written = await runner.install(workspace, ["cursor"]);

    expect(written).toEqual([".cursor/rules/akan.mdc"]);
    expect(await Bun.file(`${root}/.cursor/rules/akan.mdc`).text()).toContain("Before changing a domain");
    await expect(runner.install(workspace, ["cursor"])).rejects.toThrow("already exists");
  });
});
