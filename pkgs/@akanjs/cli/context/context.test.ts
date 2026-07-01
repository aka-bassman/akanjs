import { afterEach, describe, expect, test } from "bun:test";
import { AkanContextAnalyzer, CommandContainer, createAkanCursorMcpServer } from "@akanjs/devkit";
import { AgentRunner } from "../agent/agent.runner";
import { ModuleRunner } from "../module/module.runner";
import { cleanupCliTempWorkspace, createTempApp, createTempModule, writeText } from "../testHelpers";
import { WorkflowRunner } from "../workflow/workflow.runner";
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

  test("prints generated file and validation contracts in json context", async () => {
    const { root, workspace } = await createTempApp("demo");
    tempRoots.push(root);

    const output = await new ContextRunner().getContext(workspace, { format: "json" });
    const context = JSON.parse(output) as Awaited<ReturnType<typeof AkanContextAnalyzer.analyze>>;

    expect(context.generatedFiles).toContain("*/lib/option.ts");
    expect(context.generatedFiles).toContain("*/ui/index.ts");
    expect(context.validationCommands).toContain("akan sync <app-or-lib>");
    expect(context.validationCommands).toContain("akan doctor --strict --format json");
    expect(context.validationCommands.join("\n")).not.toContain("akan scan");
  });

  test("reports missing abstract as warning by default and error in strict mode", async () => {
    const { root, workspace, app } = await createTempApp("demo");
    tempRoots.push(root);
    await writeText(`${app.cwdPath}/lib/post/post.constant.ts`, "export class Post {}\n");

    const loose = await AkanContextAnalyzer.doctor(workspace);
    const strict = await AkanContextAnalyzer.doctor(workspace, { strict: true });

    expect(loose.diagnostics[0]).toMatchObject({ code: "module-abstract-missing", severity: "warning" });
    expect(strict.diagnostics[0]).toMatchObject({ code: "module-abstract-missing", severity: "error" });
    expect(strict.status).toBe("failed");
    expect(strict.generatedFilesFreshness.refreshCommand).toBe("akan sync <app-or-lib>");
    expect(strict.validationCommands).toContain("akan doctor --strict --format json");
    expect(strict.repairActions.map((action) => action.command)).toContain(
      "akan repair module-shape --app demo --module post",
    );
  });

  test("reports unknown app root entries as errors", async () => {
    const { root, workspace, app } = await createTempApp("demo");
    tempRoots.push(root);
    await writeText(`${app.cwdPath}/base.ts`, "export const bad = true;\n");

    const result = await AkanContextAnalyzer.doctor(workspace);

    expect(result.status).toBe("failed");
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "app-root-unknown-entry", severity: "error", path: "apps/demo/base.ts" }),
    );
  });

  test("explains core agent-facing commands", () => {
    const runner = new ContextRunner();

    expect(runner.explainCommand("mcp")).toContain("permission mode");
    expect(runner.explainCommand("create-module")).toContain("scaffolds a database-backed domain module");
    expect(runner.explainCommand("mcp-install")).toContain("installs the Akan MCP server config");
    expect(runner.explainCommand("typecheck")).toContain("runs an application typecheck");
    expect(runner.explainCommand("sync")).toContain("refreshes generated Akan files");
    expect(runner.explainCommand("workflow plan")).toContain("returns a read-only plan");
    expect(runner.explainCommand("workflow validate")).toContain("stores a structured run report");
    expect(runner.explainCommand("repair generated")).toContain("refreshes generated Akan files");
    expect(runner.explainCommand("create-ui")).toContain("returns a primitive write report");
    expect(runner.explainCommand("add-field")).toContain("updates source constant/dictionary files");
    expect(runner.explainCommand("add-enum-field")).toContain("without editing generated files");
  });

  test("lists MCP tools by permission mode", () => {
    const runner = new ContextRunner();
    const readonlyTools = runner.listMcpTools("readonly").map((tool) => tool.name);
    const planTools = runner.listMcpTools("plan").map((tool) => tool.name);
    const applyTools = runner.listMcpTools("apply").map((tool) => tool.name);

    expect(readonlyTools).toContain("doctor_workspace");
    expect(readonlyTools).not.toContain("plan_workflow");
    expect(planTools).toContain("plan_workflow");
    expect(planTools).not.toContain("apply_workflow");
    expect(applyTools).toContain("apply_workflow");
    expect(applyTools).toContain("repair_module_shape");
    expect(
      runner.listMcpTools("plan").find((tool) => tool.name === "plan_workflow")?.inputSchema.properties,
    ).not.toHaveProperty("out");
  });

  test("returns validation contract modes as cumulative MCP tool lists", async () => {
    const { root, workspace } = await createTempApp("demo");
    tempRoots.push(root);

    const contract = (await new ContextRunner().callMcpTool(workspace, "get_validation_contract")) as {
      modes: Record<"readonly" | "plan" | "apply", string[]>;
    };

    expect(contract.modes.readonly).toContain("doctor_workspace");
    expect(contract.modes.readonly).not.toContain("plan_workflow");
    expect(contract.modes.plan).toContain("doctor_workspace");
    expect(contract.modes.plan).toContain("plan_workflow");
    expect(contract.modes.plan).not.toContain("apply_workflow");
    expect(contract.modes.apply).toContain("doctor_workspace");
    expect(contract.modes.apply).toContain("plan_workflow");
    expect(contract.modes.apply).toContain("apply_workflow");
  });

  test("installs Cursor MCP config while preserving existing servers", async () => {
    const { root, workspace } = await createTempApp("demo");
    tempRoots.push(root);
    await writeText(
      `${root}/.cursor/mcp.json`,
      `${JSON.stringify({ mcpServers: { existing: { type: "stdio", command: "node", args: ["server.js"] } } }, null, 2)}\n`,
    );

    const written = await new ContextRunner().installMcp(workspace, "cursor");
    const config = (await workspace.readJson(".cursor/mcp.json")) as {
      mcpServers: Record<string, { type: string; command: string; args: string[] }>;
    };

    expect(written).toBe(".cursor/mcp.json");
    expect(config.mcpServers.existing).toEqual({ type: "stdio", command: "node", args: ["server.js"] });
    expect(config.mcpServers.akan).toEqual(createAkanCursorMcpServer("readonly"));
  });

  test("installs Cursor MCP config with explicit apply mode", async () => {
    const { root, workspace } = await createTempApp("demo");
    tempRoots.push(root);

    await new ContextRunner().installMcp(workspace, "cursor", { mode: "apply" });
    const config = (await workspace.readJson(".cursor/mcp.json")) as {
      mcpServers: Record<string, { type: string; command: string; args: string[] }>;
    };

    expect(config.mcpServers.akan).toEqual(createAkanCursorMcpServer("apply"));
  });

  test("requires force before overwriting an existing Akan MCP server entry", async () => {
    const { root, workspace } = await createTempApp("demo");
    tempRoots.push(root);
    await writeText(
      `${root}/.cursor/mcp.json`,
      `${JSON.stringify({ mcpServers: { akan: { type: "stdio", command: "other" } } }, null, 2)}\n`,
    );
    const runner = new ContextRunner();

    await expect(runner.installMcp(workspace, "cursor")).rejects.toThrow('already has an "akan" MCP server');
    await expect(runner.installMcp(workspace, "cursor", { force: true })).resolves.toBe(".cursor/mcp.json");
  });

  test("runs workflow read tools through MCP plan mode", async () => {
    const { root, workspace } = await createTempApp("demo");
    tempRoots.push(root);
    const runner = new ContextRunner();
    const planPath = `${root}/.akan/workflows/plans/task-priority.json`;

    const plan = (await runner.callMcpTool(
      workspace,
      "plan_workflow",
      {
        workflow: "add-field",
        inputs: { app: "demo", module: "task", field: "priority", type: "string" },
        out: planPath,
      },
      { mode: "plan" },
    )) as { mode: string; workflow: string };
    await new WorkflowRunner().plan(
      "add-field",
      { app: "demo", module: "task", field: "priority", type: "string" },
      { format: "json", out: planPath },
    );
    const dryRun = (await runner.callMcpTool(
      workspace,
      "apply_workflow",
      { planPath, dryRun: true },
      { mode: "apply" },
    )) as { mode: string; status: string };

    expect(plan).toMatchObject({ mode: "plan", workflow: "add-field" });
    expect(await Bun.file(planPath).exists()).toBe(true);
    expect(dryRun).toMatchObject({ mode: "dry-run", status: "passed" });
  });

  test("does not write a plan artifact from MCP plan_workflow", async () => {
    const { root, workspace } = await createTempApp("demo");
    tempRoots.push(root);
    const planPath = `${root}/.akan/workflows/plans/task-priority.json`;

    const plan = (await new ContextRunner().callMcpTool(
      workspace,
      "plan_workflow",
      {
        workflow: "add-field",
        inputs: { app: "demo", module: "task", field: "priority", type: "string" },
        out: planPath,
      },
      { mode: "plan" },
    )) as { mode: string; workflow: string };

    expect(plan).toMatchObject({ mode: "plan", workflow: "add-field" });
    expect(await Bun.file(planPath).exists()).toBe(false);
  });

  test("blocks apply tools outside apply MCP mode", async () => {
    const { root, workspace } = await createTempApp("demo");
    tempRoots.push(root);

    await expect(
      new ContextRunner().callMcpTool(
        workspace,
        "apply_workflow",
        { planPath: `${root}/missing.json`, dryRun: true },
        { mode: "readonly" },
      ),
    ).rejects.toThrow('MCP tool "apply_workflow" is not available in readonly mode');
  });

  test("returns repair reports through apply MCP mode", async () => {
    const { root, workspace, app } = await createTempApp("demo");
    tempRoots.push(root);
    await writeText(`${app.cwdPath}/lib/post/post.constant.ts`, "export class Post {}\n");

    const report = (await new ContextRunner().callMcpTool(
      workspace,
      "repair_module_shape",
      { app: "demo", module: "post" },
      { mode: "apply" },
    )) as { command: string; kind: string; repairActions: { command: string }[] };

    expect(report).toMatchObject({ command: "repair module-shape", kind: "module-shape" });
    expect(report.repairActions.map((action) => action.command)).toContain(
      "akan create-module post --app demo --format json",
    );
  });
});

describe("AgentRunner", () => {
  test("installs agent rules with workflow policy and overwrite protection", async () => {
    const { root, workspace } = await createTempApp("demo");
    tempRoots.push(root);
    const runner = new AgentRunner();

    const written = await runner.install(workspace, ["cursor", "agents-md", "claude"]);

    expect(written).toEqual([".cursor/rules/akan.mdc", "AGENTS.md", "CLAUDE.md"]);
    for (const filePath of written) {
      const content = await Bun.file(`${root}/${filePath}`).text();
      expect(content).toContain("Before changing a domain");
      expect(content).toContain("Prefer Akan MCP workflows before direct source edits");
      expect(content).toContain("Direct source edits are denied");
      expect(content).toContain("akan mcp --mode plan");
      expect(content).toContain("akan mcp --mode apply");
      expect(content).toContain("akan repair generated");
    }
    await expect(runner.install(workspace, ["cursor"])).rejects.toThrow("already exists");
  });
});
