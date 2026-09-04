import { runner, type Workspace } from "@akanjs/devkit/commandDecorators";
import { Subspace } from "@akanjs/devkit/subspace";
import { SubspaceConfig } from "@akanjs/devkit/subspaceConfig";

export type SubspaceAction = "status" | "diff" | "push" | "pull";
type SubspacePrompts = Pick<typeof import("@inquirer/prompts"), "checkbox" | "select">;

// @inquirer is ~24MB and only the no-name form of a command ever prompts, so the stack loads on first use.
const loadPrompts = async (): Promise<SubspacePrompts> => await import("@inquirer/prompts");

export class SubspaceRunner extends runner("subspace") {
  static readonly multiTargetActions: readonly SubspaceAction[] = ["status", "push"];

  async config(workspace: Workspace) {
    const config = await SubspaceConfig.from(workspace);
    if (!config)
      throw new Error(`No ${SubspaceConfig.fileName} at the workspace root. Declare the customer repos there first.`);
    return config;
  }

  async subspaces(workspace: Workspace, names: string[]) {
    const config = await this.config(workspace);
    const subspaces = config.select(names).map((declaration) => new Subspace(workspace, config, declaration));
    const branch = (await workspace.spawn("git", ["rev-parse", "--abbrev-ref", "HEAD"])).trim();
    return { config, subspaces, branch };
  }

  /** The names `akan subspace <action>` acts on when none was given: asked in a terminal, refused elsewhere. */
  async selectNames(workspace: Workspace, action: SubspaceAction): Promise<string[]> {
    const config = await this.config(workspace);
    const interactive = process.stdin.isTTY === true && process.stdout.isTTY === true;
    return await SubspaceRunner.chooseNames(config, action, { interactive });
  }

  static async chooseNames(
    config: SubspaceConfig,
    action: SubspaceAction,
    { interactive, prompts }: { interactive: boolean; prompts?: SubspacePrompts },
  ): Promise<string[]> {
    const multiple = SubspaceRunner.multiTargetActions.includes(action);
    if (!config.subspaces.length) throw new Error(`${SubspaceConfig.fileName} declares no subspaces.`);
    if (!interactive) {
      throw new Error(
        multiple
          ? `\`akan subspace ${action}\` needs a subspace name when it cannot prompt. Pass one, or run \`akan subspace ${action}-all\` for every subspace.`
          : `\`akan subspace ${action}\` needs a subspace name when it cannot prompt — it is reviewed one repo at a time.`,
      );
    }
    const { checkbox, select } = prompts ?? (await loadPrompts());
    const choices = config.subspaces.map((subspace) => ({
      name: subspace.name,
      value: subspace.name,
      description: `${subspace.repo} · ${subspace.apps.join(", ")}`,
    }));
    if (multiple) return await checkbox({ message: `Select subspaces to ${action}`, choices, required: true });
    return [await select({ message: `Select a subspace to ${action}`, choices })];
  }

  async status(workspace: Workspace, names: string[]) {
    const { subspaces, branch } = await this.subspaces(workspace, names);
    //? Sequentially: every one of these fetches into the same object store, and concurrent fetches
    //? contend on the same index lock.
    const statuses = [];
    for (const subspace of subspaces) statuses.push(await subspace.status(branch));
    return statuses;
  }

  async push(workspace: Workspace, names: string[], { verify }: { verify?: boolean } = {}) {
    const { config, subspaces, branch } = await this.subspaces(workspace, names);
    config.assertPushable(branch);
    const results = [];
    for (const subspace of subspaces) results.push(await subspace.push(branch, { verify }));
    return results;
  }

  async diff(workspace: Workspace, name: string, filter?: string | null) {
    const { subspaces, branch } = await this.subspaces(workspace, [name]);
    const [subspace] = subspaces;
    if (!subspace) throw new Error(`Unknown subspace "${name}"`);
    return await subspace.diff(branch, filter);
  }

  async pull(workspace: Workspace, name: string, { adoptLibs }: { adoptLibs?: boolean } = {}) {
    const { subspaces, branch } = await this.subspaces(workspace, [name]);
    const [subspace] = subspaces;
    if (!subspace) throw new Error(`Unknown subspace "${name}"`);
    return await subspace.pull(branch, { adoptLibs });
  }
}
