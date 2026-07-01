import {
  AkanContextAnalyzer,
  type AkanContextFormat,
  type AkanMcpMode,
  CommandContainer,
  type CursorMcpConfig,
  createAkanCursorMcpServer,
  createWorkflowStepRegistry,
  cursorMcpConfigPath,
  type JsonRpcRequest,
  jsonText,
  type McpFraming,
  Prompter,
  renderDoctorText,
  resourceList,
  runner,
  type WorkflowPlanInputs,
  type Workspace,
} from "@akanjs/devkit";
import { ModuleScript } from "../module/module.script";
import { PrimitiveScript } from "../primitive/primitive.script";
import { RepairRunner } from "../repair/repair.runner";
import { ScalarScript } from "../scalar/scalar.script";
import { WorkflowRunner } from "../workflow/workflow.runner";

type McpToolDefinition = {
  name: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

const emptySchema = { type: "object" as const, properties: {} };
const stringProperty = { type: "string" };
const booleanProperty = { type: "boolean" };
const objectProperty = { type: "object", additionalProperties: true };

const parseJsonOutput = (output: string) => JSON.parse(output) as unknown;

const stringArg = (args: Record<string, unknown>, key: string) => {
  const value = args[key];
  if (typeof value !== "string" || !value) throw new Error(`MCP tool argument "${key}" is required.`);
  return value;
};

const workflowInputsArg = (args: Record<string, unknown>) => {
  const value = args.inputs;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as WorkflowPlanInputs;
};

const createCliWorkflowStepRegistry = (workspace: Workspace) =>
  createWorkflowStepRegistry({
    workspace,
    createModule: (sys, module) => CommandContainer.get(ModuleScript).createModuleTemplate(sys, module),
    createScalar: (sys, scalar) => CommandContainer.get(ScalarScript).createScalar(sys, scalar),
    createUi: (input) => CommandContainer.get(PrimitiveScript).createUi(workspace, input),
    addField: (input) => CommandContainer.get(PrimitiveScript).addField(workspace, input),
    addEnumField: (input) => CommandContainer.get(PrimitiveScript).addEnumField(workspace, input),
  });

const readonlyMcpTools: McpToolDefinition[] = [
  { name: "get_workspace_summary", inputSchema: emptySchema },
  { name: "list_apps", inputSchema: emptySchema },
  { name: "list_modules", inputSchema: emptySchema },
  {
    name: "get_module_context",
    inputSchema: { type: "object", properties: { module: stringProperty }, required: ["module"] },
  },
  {
    name: "get_guideline",
    inputSchema: { type: "object", properties: { name: stringProperty }, required: ["name"] },
  },
  {
    name: "explain_command",
    inputSchema: { type: "object", properties: { command: stringProperty }, required: ["command"] },
  },
  {
    name: "doctor_workspace",
    inputSchema: { type: "object", properties: { strict: booleanProperty } },
  },
  { name: "get_validation_contract", inputSchema: emptySchema },
];

const planMcpTools: McpToolDefinition[] = [
  { name: "list_workflows", inputSchema: emptySchema },
  {
    name: "explain_workflow",
    inputSchema: { type: "object", properties: { workflow: stringProperty }, required: ["workflow"] },
  },
  {
    name: "plan_workflow",
    inputSchema: {
      type: "object",
      properties: { workflow: stringProperty, inputs: objectProperty },
      required: ["workflow"],
    },
  },
];

const applyMcpTools: McpToolDefinition[] = [
  {
    name: "apply_workflow",
    inputSchema: {
      type: "object",
      properties: { planPath: stringProperty, dryRun: booleanProperty },
      required: ["planPath"],
    },
  },
  {
    name: "run_validation",
    inputSchema: {
      type: "object",
      properties: { runIdOrPlan: stringProperty },
      required: ["runIdOrPlan"],
    },
  },
  {
    name: "repair_generated",
    inputSchema: { type: "object", properties: { app: stringProperty }, required: ["app"] },
  },
  {
    name: "repair_imports",
    inputSchema: { type: "object", properties: { target: stringProperty }, required: ["target"] },
  },
  {
    name: "repair_module_shape",
    inputSchema: {
      type: "object",
      properties: { app: stringProperty, module: stringProperty },
      required: ["app", "module"],
    },
  },
];

export class ContextRunner extends runner("context") {
  async getContext(
    workspace: Workspace,
    {
      format = "markdown",
      app = null,
      module = null,
    }: { format?: AkanContextFormat; app?: string | null; module?: string | null } = {},
  ) {
    const context = await AkanContextAnalyzer.analyze(workspace, {
      app,
      module,
      includeAbstractContent: !!module,
    });
    return format === "json" ? jsonText(context) : AkanContextAnalyzer.renderMarkdown(context, { module });
  }

  async doctor(
    workspace: Workspace,
    { format = "text", strict = false }: { format?: "text" | "json"; strict?: boolean } = {},
  ) {
    const result = await AkanContextAnalyzer.doctor(workspace, { strict });
    return format === "json" ? jsonText(result) : renderDoctorText(result);
  }

  async getGuidelineResource(name: string) {
    return await Prompter.getInstruction(name);
  }

  async installMcp(
    workspace: Workspace,
    target: "cursor",
    { force = false, mode = "readonly" }: { force?: boolean; mode?: AkanMcpMode } = {},
  ) {
    if (target !== "cursor") throw new Error(`Unknown MCP install target: ${target}. Use cursor.`);
    const existing = (await workspace.exists(cursorMcpConfigPath))
      ? ((await workspace.readJson(cursorMcpConfigPath)) as CursorMcpConfig)
      : {};
    const mcpServers = existing.mcpServers ?? {};
    const currentAkanServer = mcpServers.akan;
    const nextAkanServer = createAkanCursorMcpServer(mode);
    if (currentAkanServer && !force && JSON.stringify(currentAkanServer) !== JSON.stringify(nextAkanServer)) {
      throw new Error(`${cursorMcpConfigPath} already has an "akan" MCP server. Re-run with --force to overwrite it.`);
    }
    const nextConfig: CursorMcpConfig = {
      ...existing,
      mcpServers: {
        ...mcpServers,
        akan: nextAkanServer,
      },
    };
    await workspace.writeFile(cursorMcpConfigPath, `${JSON.stringify(nextConfig, null, 2)}\n`);
    return cursorMcpConfigPath;
  }

  listMcpTools(mode: AkanMcpMode = "readonly") {
    if (mode === "readonly") return readonlyMcpTools;
    if (mode === "plan") return [...readonlyMcpTools, ...planMcpTools];
    return [...readonlyMcpTools, ...planMcpTools, ...applyMcpTools];
  }

  async callMcpTool(
    workspace: Workspace,
    name: string,
    args: Record<string, unknown> = {},
    { mode = "readonly" }: { mode?: AkanMcpMode } = {},
  ) {
    const availableTools = this.listMcpTools(mode);
    if (!availableTools.some((tool) => tool.name === name)) {
      throw new Error(`MCP tool "${name}" is not available in ${mode} mode.`);
    }

    if (
      name === "get_workspace_summary" ||
      name === "list_apps" ||
      name === "list_modules" ||
      name === "get_module_context"
    ) {
      const context = await AkanContextAnalyzer.analyze(workspace, {
        module: (args.module as string | undefined) ?? null,
        includeAbstractContent: name === "get_module_context",
      });
      if (name === "get_workspace_summary") return context;
      if (name === "list_apps") return context.apps;
      if (name === "list_modules") return AkanContextAnalyzer.findModules(context);
      return AkanContextAnalyzer.findModules(context, args.module as string | undefined);
    }

    if (name === "get_guideline") return await Prompter.getInstruction(stringArg(args, "name"));
    if (name === "doctor_workspace") return await AkanContextAnalyzer.doctor(workspace, { strict: !!args.strict });
    if (name === "explain_command") return this.explainCommand(stringArg(args, "command"));
    if (name === "get_validation_contract")
      return {
        schemaVersion: 1,
        reports: ["WorkflowPlan", "WorkflowApplyReport", "WorkflowValidationRunReport", "RepairReport"],
        modes: {
          readonly: this.listMcpTools("readonly").map((tool) => tool.name),
          plan: this.listMcpTools("plan").map((tool) => tool.name),
          apply: this.listMcpTools("apply").map((tool) => tool.name),
        },
        validationCommands: [
          "akan workflow validate <run-id-or-plan> --format json",
          "akan workflow report <run-id> --format json",
          "akan doctor --strict --format json",
        ],
        repairCommands: [
          "akan repair generated --app <app-or-lib> --format json",
          "akan repair format --target <app-or-lib-or-pkg> --format json",
          "akan repair imports --target <app-or-lib-or-pkg> --format json",
          "akan repair dictionary --app <app-or-lib> --module <module> --format json",
          "akan repair module-shape --app <app-or-lib> --module <module> --format json",
        ],
      };

    if (name === "list_workflows") return parseJsonOutput(new WorkflowRunner().list({ format: "json" }));
    if (name === "explain_workflow")
      return parseJsonOutput(new WorkflowRunner().explain(stringArg(args, "workflow"), { format: "json" }));
    if (name === "plan_workflow")
      return parseJsonOutput(
        await new WorkflowRunner().plan(stringArg(args, "workflow"), workflowInputsArg(args), {
          format: "json",
        }),
      );
    if (name === "apply_workflow")
      return parseJsonOutput(
        await new WorkflowRunner().apply(stringArg(args, "planPath"), {
          format: "json",
          dryRun: !!args.dryRun,
          registry: createCliWorkflowStepRegistry(workspace),
        }),
      );
    if (name === "run_validation")
      return parseJsonOutput(
        await new WorkflowRunner().validate(stringArg(args, "runIdOrPlan"), { format: "json", workspace }),
      );
    if (name === "repair_generated")
      return parseJsonOutput(
        await new RepairRunner().repair("generated", { workspace, app: stringArg(args, "app"), format: "json" }),
      );
    if (name === "repair_imports")
      return parseJsonOutput(
        await new RepairRunner().repair("imports", {
          workspace,
          target: stringArg(args, "target"),
          format: "json",
        }),
      );
    if (name === "repair_module_shape")
      return parseJsonOutput(
        await new RepairRunner().repair("module-shape", {
          workspace,
          app: stringArg(args, "app"),
          module: stringArg(args, "module"),
          format: "json",
        }),
      );

    throw new Error(`Unknown tool: ${name}`);
  }

  async runMcp(workspace: Workspace, { mode = "readonly" }: { mode?: AkanMcpMode } = {}) {
    const decoder = new TextDecoder();
    let buffer = "";
    const writeMessage = (message: unknown, framing: McpFraming) => {
      const payload = JSON.stringify(message);
      if (framing === "newline") process.stdout.write(`${payload}\n`);
      else process.stdout.write(`Content-Length: ${Buffer.byteLength(payload)}\r\n\r\n${payload}`);
    };
    const respond = (id: JsonRpcRequest["id"], result: unknown, framing: McpFraming) => {
      writeMessage({ jsonrpc: "2.0", id, result }, framing);
    };
    const respondError = (id: JsonRpcRequest["id"], code: number, message: string, framing: McpFraming) => {
      writeMessage({ jsonrpc: "2.0", id, error: { code, message } }, framing);
    };
    const readResource = async (uri: string) => {
      const context = await AkanContextAnalyzer.analyze(workspace);
      if (uri === "akan://docs/framework" || uri === "akan://guidelines/framework")
        return { uri, mimeType: "text/markdown", text: await Prompter.getInstruction("framework") };
      if (uri === "akan://guidelines/modelSignal")
        return { uri, mimeType: "text/markdown", text: await Prompter.getInstruction("modelSignal") };
      if (uri === "akan://workspace/summary")
        return { uri, mimeType: "application/json", text: jsonText(context, { trailingNewline: false }) };
      if (uri === "akan://workspace/apps")
        return { uri, mimeType: "application/json", text: jsonText(context.apps, { trailingNewline: false }) };
      if (uri === "akan://workspace/modules")
        return {
          uri,
          mimeType: "application/json",
          text: jsonText(AkanContextAnalyzer.findModules(context), { trailingNewline: false }),
        };
      const abstractMatch = uri.match(/^akan:\/\/workspace\/modules\/(.+)\/abstract$/);
      if (abstractMatch) {
        const detailed = await AkanContextAnalyzer.analyze(workspace, {
          module: abstractMatch[1],
          includeAbstractContent: true,
        });
        const abstract = AkanContextAnalyzer.findModules(detailed, abstractMatch[1])[0]?.abstract;
        return { uri, mimeType: "text/markdown", text: abstract?.content ?? "" };
      }
      throw new Error(`Unknown resource: ${uri}`);
    };
    const handle = async (request: JsonRpcRequest, framing: McpFraming) => {
      const params = request.params ?? {};
      if (request.method === "initialize") {
        respond(
          request.id,
          {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {}, resources: {} },
            serverInfo: { name: "akan", version: process.env.AKAN_VERSION ?? "0.0.0" },
          },
          framing,
        );
      } else if (request.method === "tools/list") {
        respond(
          request.id,
          {
            tools: this.listMcpTools(mode),
          },
          framing,
        );
      } else if (request.method === "tools/call") {
        const name = params.name as string;
        const args = (params.arguments ?? {}) as Record<string, unknown>;
        try {
          const result = await this.callMcpTool(workspace, name, args, { mode });
          respond(
            request.id,
            {
              content: [
                {
                  type: "text",
                  text: typeof result === "string" ? result : jsonText(result, { trailingNewline: false }),
                },
              ],
            },
            framing,
          );
        } catch (error) {
          respondError(request.id, -32602, error instanceof Error ? error.message : String(error), framing);
        }
      } else if (request.method === "resources/list") {
        respond(request.id, { resources: resourceList }, framing);
      } else if (request.method === "resources/read") {
        respond(request.id, { contents: [await readResource(params.uri as string)] }, framing);
      } else if (!request.method.endsWith("/initialized")) {
        respondError(request.id, -32601, `Unknown method: ${request.method}`, framing);
      }
    };
    const parseContentLengthMessage = async () => {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd < 0) return false;
      const header = buffer.slice(0, headerEnd);
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) {
        buffer = buffer.slice(headerEnd + 4);
        return true;
      }
      const length = Number(match[1]);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + length;
      if (buffer.length < bodyEnd) return false;
      const body = buffer.slice(bodyStart, bodyEnd);
      buffer = buffer.slice(bodyEnd);
      await handle(JSON.parse(body) as JsonRpcRequest, "content-length");
      return true;
    };
    const parseLineMessage = async () => {
      const lineEnd = buffer.indexOf("\n");
      if (lineEnd < 0) return false;
      const line = buffer.slice(0, lineEnd).trim();
      buffer = buffer.slice(lineEnd + 1);
      if (!line) return true;
      await handle(JSON.parse(line) as JsonRpcRequest, "newline");
      return true;
    };
    const parse = async () => {
      for (;;) {
        buffer = buffer.trimStart();
        if (/^Content-Length:/i.test(buffer)) {
          if (await parseContentLengthMessage()) continue;
          return;
        }
        if (buffer.includes("\r\n\r\n") && (await parseContentLengthMessage())) continue;
        if (await parseLineMessage()) continue;
        return;
      }
    };
    for await (const chunk of Bun.stdin.stream()) {
      buffer += decoder.decode(chunk);
      await parse();
    }
  }

  explainCommand(command: string) {
    const explanations: Record<string, string> = {
      context: "`akan context` prints agent-readable workspace, app, module, and abstract metadata.",
      "create-module": "`akan create-module <name> --app <app>` scaffolds a database-backed domain module.",
      "create-scalar": "`akan create-scalar <name> --app <app>` scaffolds a reusable scalar value module.",
      "create-service": "`akan create-service <name> --app <app>` scaffolds a non-database service module.",
      "create-view": "`akan create-view --app <app> --module <module>` creates a module View component.",
      "create-unit": "`akan create-unit --app <app> --module <module>` creates a module Unit component.",
      "create-template": "`akan create-template --app <app> --module <module>` creates a module Template component.",
      "create-ui":
        "`akan create-ui --app <app-or-lib> --module <module> --surface <view|unit|template> --format json` creates one UI surface and returns a primitive write report.",
      "add-field":
        "`akan add-field --app <app-or-lib> --module <module> --field <field> --type <type> --format json` updates source constant/dictionary files and reports sync/lint next actions.",
      "add-enum-field":
        "`akan add-enum-field --app <app-or-lib> --module <module> --field <field> --values a,b --format json` adds an enum field to source constant/dictionary files without editing generated files.",
      sync: "`akan sync <app-or-lib>` refreshes generated Akan files from source conventions.",
      lint: "`akan lint <app-or-lib-or-pkg>` runs Biome linting after preparing generated files.",
      typecheck: "`akan typecheck <app-name>` runs an application typecheck after preparing generated files.",
      test: "`akan test <app-or-lib-or-pkg>` prepares the target and runs its tests.",
      build: "`akan build <app-name>` creates a production build after preparing generated files.",
      doctor:
        "`akan doctor --strict --format json` reports agent-readable workspace convention diagnostics and validation hints.",
      "guideline show": "`akan guideline show <name>` prints an Akan codegen guideline instruction.",
      workflow:
        "`akan workflow list|explain|plan|apply|validate|report` lists, plans, applies, validates, and reports agent-readable Akan workflows.",
      "workflow list": "`akan workflow list` lists parseable read-only workflow specs.",
      "workflow explain":
        "`akan workflow explain <workflow>` explains inputs, optional surfaces, steps, and validation.",
      "workflow plan":
        "`akan workflow plan <workflow> ... --out .akan/workflows/plans/<name>.json --format json` returns a read-only plan and can store a local plan artifact.",
      "workflow apply":
        "`akan workflow apply [--dry-run] <plan-path> --format json` reads an approved plan artifact and returns a workflow apply report.",
      "workflow validate":
        "`akan workflow validate <run-id-or-plan> --format json` runs validation commands from a plan or apply report and stores a structured run report.",
      "workflow report":
        "`akan workflow report <run-id> --format json` reads .akan/workflows/runs/<run-id>.json and prints the stored report.",
      repair:
        "`akan repair generated|format|imports|dictionary|module-shape --format json` runs narrow safe repairs or returns repair-oriented next actions.",
      "repair generated": "`akan repair generated --app <app-or-lib> --format json` refreshes generated Akan files.",
      "repair format":
        "`akan repair format --target <app-or-lib-or-pkg> --format json` runs the lint/format repair path.",
      "repair imports":
        "`akan repair imports --target <app-or-lib-or-pkg> --format json` runs the import organization repair path.",
      "repair dictionary":
        "`akan repair dictionary --app <app-or-lib> --module <module> --format json` reports dictionary label repair candidates.",
      "repair module-shape":
        "`akan repair module-shape --app <app-or-lib> --module <module> --format json` reports missing module source files and source-safe next actions.",
      agent: "`akan agent install <target>` writes editor-specific agent rules with overwrite protection.",
      mcp: "`akan mcp --mode readonly|plan|apply` starts the Akan MCP server over stdio with an explicit permission mode.",
      "mcp-install":
        "`akan mcp-install cursor --mode readonly|plan|apply` installs the Akan MCP server config for Cursor.",
    };
    return (
      explanations[command] ??
      `No detailed explanation is available for ${command}. Run \`akan --help\` for command help.`
    );
  }
}
