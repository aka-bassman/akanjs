import type { Workspace } from "@akanjs/devkit/commandDecorators";
import type { ExtensionAPI, InlineExtension } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { AkanEditScope } from "./AkanEditScope";
import { AkanVerifier } from "./AkanVerifier";

export interface AkanToolPackOptions {
  workspace: Workspace;
  cwd: string;
  /** `readonly` for a reviewer, `apply` for an agent that may run a workflow. */
  mode: "readonly" | "plan" | "apply";
}

/**
 * Publishes the workspace's own agent tools — context inspection, workflows, repair, validation — to the model.
 *
 * These already exist as the akan MCP catalogue, dispatched in-process by `ContextRunner.callMcpTool`. Wrapping
 * that dispatcher is the whole implementation: a second copy of "what does add-field do" would drift from the
 * one the editors already talk to.
 */
export class AkanToolPack {
  readonly #options: AkanToolPackOptions;

  constructor(options: AkanToolPackOptions) {
    this.#options = options;
  }

  extension(): InlineExtension {
    return { name: "akan-tools", factory: async (pi) => await this.#register(pi) };
  }

  /**
   * The names this pack will register.
   *
   * A `tools` allowlist on the session is an allowlist over *every* tool, extension ones included — pass only
   * the built-ins and the model is told the akan tools do not exist, which is exactly what it then reports.
   */
  async names() {
    const { ContextRunner } = await import("../context/context.runner");
    return [
      ...new ContextRunner().listMcpTools(this.#options.mode).map((tool) => tool.name),
      AkanToolPack.verifyToolName,
    ];
  }

  static readonly verifyToolName = "akan_verify";

  async #register(pi: ExtensionAPI) {
    const { ContextRunner } = await import("../context/context.runner");
    const runner = new ContextRunner();
    const guidelineNames = await AkanToolPack.#guidelineNames();
    for (const tool of runner.listMcpTools(this.#options.mode, { guidelineNames })) {
      const description = tool.description ?? tool.name;
      pi.registerTool({
        name: tool.name,
        label: tool.name,
        description,
        // Without a snippet a custom tool is left out of the system prompt's tool list entirely, and a model
        // whose built-ins are narrowed then reads "Available tools: (none)" and stops trusting the list.
        promptSnippet: `${tool.name}: ${description.split(".")[0] ?? description}`,
        parameters: Type.Unsafe<Record<string, unknown>>(tool.inputSchema),
        execute: async (_id, params) => {
          const result = await runner.callMcpTool(this.#options.workspace, tool.name, params ?? {}, {
            mode: this.#options.mode,
          });
          return { content: [{ type: "text", text: AkanToolPack.#render(result) }], details: undefined };
        },
      });
    }
    this.#registerVerify(pi);
  }

  #registerVerify(pi: ExtensionAPI) {
    const verifier = new AkanVerifier(this.#options.cwd);
    pi.registerTool({
      name: AkanToolPack.verifyToolName,
      label: "akan verify",
      description:
        "Run the akan validation chain (sync, lint, typecheck, and quality ssr for .tsx changes) over everything the working tree has changed, and report what failed. Call this after editing before you finish.",
      promptSnippet: "akan_verify: run sync/lint/typecheck/quality over the working tree's changes",
      parameters: Type.Object({}),
      execute: async () => {
        const scope = await AkanEditScope.since(this.#options.cwd, new Set());
        const report = await verifier.verify(scope);
        return {
          content: [{ type: "text", text: AkanVerifier.summarize(report) }],
          details: undefined,
          isError: !report.ok,
        };
      },
    });
  }

  /** The guideline list is a directory read, so a model cannot name one without being handed the enum. */
  static async #guidelineNames() {
    try {
      const { Prompter } = await import("@akanjs/devkit/prompter");
      return await Prompter.listGuidelines();
    } catch {
      return [];
    }
  }

  static #render(result: unknown) {
    if (typeof result === "string") return result;
    return JSON.stringify(result, null, 2);
  }
}
