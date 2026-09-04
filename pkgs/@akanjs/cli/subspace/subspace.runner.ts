import { runner, type Workspace } from "@akanjs/devkit/commandDecorators";
import { Subspace } from "@akanjs/devkit/subspace";
import { SubspaceConfig } from "@akanjs/devkit/subspaceConfig";

export class SubspaceRunner extends runner("subspace") {
  async subspaces(workspace: Workspace, names: string[]) {
    const config = await SubspaceConfig.from(workspace);
    if (!config)
      throw new Error(`No ${SubspaceConfig.fileName} at the workspace root. Declare the customer repos there first.`);
    const subspaces = config.select(names).map((declaration) => new Subspace(workspace, config, declaration));
    const branch = (await workspace.spawn("git", ["rev-parse", "--abbrev-ref", "HEAD"])).trim();
    return { config, subspaces, branch };
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
