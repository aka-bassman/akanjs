import { AkanContextAnalyzer, type AkanContextFormat, Prompter, runner, type Workspace } from "@akanjs/devkit";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

const jsonText = (value: unknown) => JSON.stringify(value, null, 2);

const renderDoctorText = (result: Awaited<ReturnType<typeof AkanContextAnalyzer.doctor>>) => {
  if (result.diagnostics.length === 0) return "No Akan workspace diagnostics found.\n";
  return `${result.diagnostics
    .map((diagnostic) =>
      [
        `[${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`,
        diagnostic.path ? `  ${diagnostic.path}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n")}\n`;
};

const resourceList = [
  { uri: "akan://docs/framework", name: "Akan framework guide", mimeType: "text/markdown" },
  { uri: "akan://guidelines/framework", name: "Framework guideline", mimeType: "text/markdown" },
  { uri: "akan://guidelines/modelSignal", name: "Model signal guideline", mimeType: "text/markdown" },
  { uri: "akan://workspace/summary", name: "Workspace summary", mimeType: "application/json" },
  { uri: "akan://workspace/apps", name: "Workspace apps", mimeType: "application/json" },
  { uri: "akan://workspace/modules", name: "Workspace modules", mimeType: "application/json" },
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
    return format === "json" ? `${jsonText(context)}\n` : AkanContextAnalyzer.renderMarkdown(context, { module });
  }

  async doctor(
    workspace: Workspace,
    { format = "text", strict = false }: { format?: "text" | "json"; strict?: boolean } = {},
  ) {
    const result = await AkanContextAnalyzer.doctor(workspace, { strict });
    return format === "json" ? `${jsonText(result)}\n` : renderDoctorText(result);
  }

  async getGuidelineResource(name: string) {
    return await Prompter.getInstruction(name);
  }

  async runMcp(workspace: Workspace) {
    const decoder = new TextDecoder();
    let buffer = "";
    const respond = (id: JsonRpcRequest["id"], result: unknown) => {
      const payload = JSON.stringify({ jsonrpc: "2.0", id, result });
      process.stdout.write(`Content-Length: ${Buffer.byteLength(payload)}\r\n\r\n${payload}`);
    };
    const respondError = (id: JsonRpcRequest["id"], code: number, message: string) => {
      const payload = JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } });
      process.stdout.write(`Content-Length: ${Buffer.byteLength(payload)}\r\n\r\n${payload}`);
    };
    const readResource = async (uri: string) => {
      const context = await AkanContextAnalyzer.analyze(workspace);
      if (uri === "akan://docs/framework" || uri === "akan://guidelines/framework")
        return { uri, mimeType: "text/markdown", text: await Prompter.getInstruction("framework") };
      if (uri === "akan://guidelines/modelSignal")
        return { uri, mimeType: "text/markdown", text: await Prompter.getInstruction("modelSignal") };
      if (uri === "akan://workspace/summary") return { uri, mimeType: "application/json", text: jsonText(context) };
      if (uri === "akan://workspace/apps") return { uri, mimeType: "application/json", text: jsonText(context.apps) };
      if (uri === "akan://workspace/modules")
        return { uri, mimeType: "application/json", text: jsonText(AkanContextAnalyzer.findModules(context)) };
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
    const handle = async (request: JsonRpcRequest) => {
      const params = request.params ?? {};
      if (request.method === "initialize") {
        respond(request.id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {}, resources: {} },
          serverInfo: { name: "akan", version: process.env.AKAN_VERSION ?? "0.0.0" },
        });
      } else if (request.method === "tools/list") {
        respond(request.id, {
          tools: [
            { name: "get_workspace_summary", inputSchema: { type: "object", properties: {} } },
            { name: "list_apps", inputSchema: { type: "object", properties: {} } },
            { name: "list_modules", inputSchema: { type: "object", properties: {} } },
            {
              name: "get_module_context",
              inputSchema: { type: "object", properties: { module: { type: "string" } } },
            },
            {
              name: "get_guideline",
              inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
            },
            {
              name: "explain_command",
              inputSchema: { type: "object", properties: { command: { type: "string" } }, required: ["command"] },
            },
            { name: "doctor_workspace", inputSchema: { type: "object", properties: { strict: { type: "boolean" } } } },
          ],
        });
      } else if (request.method === "tools/call") {
        const name = params.name as string;
        const args = (params.arguments ?? {}) as Record<string, unknown>;
        const context = await AkanContextAnalyzer.analyze(workspace, {
          module: (args.module as string | undefined) ?? null,
          includeAbstractContent: name === "get_module_context",
        });
        const result = await (async () => {
          if (name === "get_workspace_summary") return context;
          if (name === "list_apps") return context.apps;
          if (name === "list_modules") return AkanContextAnalyzer.findModules(context);
          if (name === "get_module_context")
            return AkanContextAnalyzer.findModules(context, args.module as string | undefined);
          if (name === "get_guideline") return await Prompter.getInstruction(args.name as string);
          if (name === "doctor_workspace")
            return await AkanContextAnalyzer.doctor(workspace, { strict: !!args.strict });
          if (name === "explain_command") return this.explainCommand(args.command as string);
          throw new Error(`Unknown tool: ${name}`);
        })();
        respond(request.id, {
          content: [{ type: "text", text: typeof result === "string" ? result : jsonText(result) }],
        });
      } else if (request.method === "resources/list") {
        respond(request.id, { resources: resourceList });
      } else if (request.method === "resources/read") {
        respond(request.id, { contents: [await readResource(params.uri as string)] });
      } else if (!request.method.endsWith("/initialized")) {
        respondError(request.id, -32601, `Unknown method: ${request.method}`);
      }
    };
    const parse = async () => {
      while (true) {
        const headerEnd = buffer.indexOf("\r\n\r\n");
        if (headerEnd < 0) return;
        const header = buffer.slice(0, headerEnd);
        const match = /Content-Length:\s*(\d+)/i.exec(header);
        if (!match) {
          buffer = buffer.slice(headerEnd + 4);
          continue;
        }
        const length = Number(match[1]);
        const bodyStart = headerEnd + 4;
        const bodyEnd = bodyStart + length;
        if (buffer.length < bodyEnd) return;
        const body = buffer.slice(bodyStart, bodyEnd);
        buffer = buffer.slice(bodyEnd);
        await handle(JSON.parse(body) as JsonRpcRequest);
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
      doctor: "`akan doctor` reports workspace convention diagnostics. Use `--format json` for agents.",
      "guideline show": "`akan guideline show <name>` prints an Akan codegen guideline instruction.",
      agent: "`akan agent install <target>` writes editor-specific agent rules with overwrite protection.",
      mcp: "`akan mcp` starts the read-only Akan MCP server over stdio.",
    };
    return (
      explanations[command] ??
      `No detailed explanation is available for ${command}. Run \`akan --help\` for command help.`
    );
  }
}
