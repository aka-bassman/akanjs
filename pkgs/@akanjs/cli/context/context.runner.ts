import { AkanContextAnalyzer, type AkanContextFormat, Prompter, runner, type Workspace } from "@akanjs/devkit";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};
type McpFraming = "content-length" | "newline";
type CursorMcpConfig = {
  mcpServers?: Record<string, unknown>;
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
const cursorMcpConfigPath = ".cursor/mcp.json";
const cursorWorkspaceFolder = "$" + "{workspaceFolder}";
const akanCursorMcpServer = {
  type: "stdio",
  command: "bash",
  args: ["-lc", `cd "${cursorWorkspaceFolder}" && akan mcp`],
};

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

  async installMcp(workspace: Workspace, target: "cursor", { force = false }: { force?: boolean } = {}) {
    if (target !== "cursor") throw new Error(`Unknown MCP install target: ${target}. Use cursor.`);
    const existing = (await workspace.exists(cursorMcpConfigPath))
      ? ((await workspace.readJson(cursorMcpConfigPath)) as CursorMcpConfig)
      : {};
    const mcpServers = existing.mcpServers ?? {};
    const currentAkanServer = mcpServers.akan;
    if (currentAkanServer && !force && JSON.stringify(currentAkanServer) !== JSON.stringify(akanCursorMcpServer)) {
      throw new Error(`${cursorMcpConfigPath} already has an "akan" MCP server. Re-run with --force to overwrite it.`);
    }
    const nextConfig: CursorMcpConfig = {
      ...existing,
      mcpServers: {
        ...mcpServers,
        akan: akanCursorMcpServer,
      },
    };
    await workspace.writeFile(cursorMcpConfigPath, `${JSON.stringify(nextConfig, null, 2)}\n`);
    return cursorMcpConfigPath;
  }

  async runMcp(workspace: Workspace) {
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
              {
                name: "doctor_workspace",
                inputSchema: { type: "object", properties: { strict: { type: "boolean" } } },
              },
            ],
          },
          framing,
        );
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
        respond(
          request.id,
          {
            content: [{ type: "text", text: typeof result === "string" ? result : jsonText(result) }],
          },
          framing,
        );
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
      while (true) {
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
