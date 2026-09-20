import { runner, type Workspace } from "@akanjs/devkit/commandDecorators";
import { type CodeAgentProfile, codeAgentPresets, isCodeAgentPresetName } from "akanjs/common";
import { akanCodeDefaultModel, type CodeAgentModelRef } from "./akanCodeModel";
import { CodeAgentStreamPrinter } from "./CodeAgentStreamPrinter";

export interface CodeRunOptions {
  workspace: Workspace;
  app?: string;
  profile: string;
  model?: string;
  json: boolean;
  thinking: boolean;
}

export class CodeRunner extends runner("code") {
  /**
   * Serves the agent over stdio as akan wire frames, for a host that drives it from another process.
   *
   * `consoleToStderr` is imported first and on its own line: it must run before the engine's module body does,
   * or anything the engine logs while loading lands on stdout and corrupts the very first frame.
   */
  async serve(options: CodeRunOptions) {
    await import("./consoleToStderr");
    const [{ CodeAgent }, { CodeAgentRpcHost }] = await Promise.all([
      import("./CodeAgent"),
      import("./CodeAgentRpcHost"),
    ]);
    const profile = CodeRunner.profileOf(options);
    const agent = await CodeAgent.create({
      workspace: options.workspace,
      cwd: profile.paths.root,
      profile,
      apps: options.app ? [options.app] : await options.workspace.getApps(),
      model: CodeRunner.modelOf(options.model),
      mode: "rpc",
    });
    await new CodeAgentRpcHost(agent).serve();
  }

  /**
   * The interactive terminal host.
   *
   * It reads the same wire the printer and the RPC host read, so what it can draw is exactly what the
   * contract carries — see {@link CodeTui}.
   */
  async tui(options: CodeRunOptions, seed: string) {
    const [{ CodeAgent }, { CodeTui }] = await Promise.all([import("./CodeAgent"), import("./CodeTui")]);
    const profile = CodeRunner.profileOf(options);
    const agent = await CodeAgent.create({
      workspace: options.workspace,
      cwd: profile.paths.root,
      profile,
      apps: options.app ? [options.app] : await options.workspace.getApps(),
      model: CodeRunner.modelOf(options.model),
      mode: "tui",
    });
    try {
      await new CodeTui(agent).run(seed);
    } finally {
      agent.dispose();
    }
  }

  /**
   * Runs one prompt to completion and prints the event stream.
   *
   * Non-interactive on purpose: it is the smallest host that exercises the whole contract, and a script or a CI
   * step wants exactly this shape.
   */
  async run(prompt: string, options: CodeRunOptions) {
    // The engine costs ~122MiB resident on import, and `akan --help` loads every command module. Importing it
    // here rather than at the top of the file keeps that cost on the one command that needs it.
    const { CodeAgent } = await import("./CodeAgent");
    const profile = CodeRunner.profileOf(options);
    const agent = await CodeAgent.create({
      workspace: options.workspace,
      cwd: profile.paths.root,
      profile,
      apps: options.app ? [options.app] : await options.workspace.getApps(),
      model: CodeRunner.modelOf(options.model),
    });
    const printer = new CodeAgentStreamPrinter({ json: options.json, thinking: options.thinking });
    agent.on((event) => printer.print(event));
    agent.announce();
    try {
      await agent.prompt(prompt);
      await agent.waitForIdle();
    } finally {
      printer.finish();
      agent.dispose();
    }
  }

  static profileOf(options: CodeRunOptions): CodeAgentProfile {
    if (!isCodeAgentPresetName(options.profile))
      throw new Error(`Unknown profile: ${options.profile}. Use local, pod, review, or web.`);
    const root = options.app
      ? `${options.workspace.workspaceRoot}/apps/${options.app}`
      : options.workspace.workspaceRoot;
    return codeAgentPresets[options.profile](root);
  }

  static modelOf(model: string | undefined): CodeAgentModelRef | undefined {
    if (!model) return undefined;
    const [provider, ...rest] = model.split("/");
    if (!provider || !rest.length)
      throw new Error(
        `Model must be "<provider>/<id>", e.g. ${akanCodeDefaultModel.provider}/${akanCodeDefaultModel.id}`,
      );
    return { provider, id: rest.join("/") };
  }
}
