import path from "node:path";
import type { SubspaceConfigInput, SubspaceDeclaration } from "akanjs";
import type { WorkspaceExecutor } from "./executors";
import { FileSys } from "./fileSys";

export type { SubspaceConfigInput, SubspaceDeclaration };

/**
 * `akan.subspace.ts` at the workspace root: which customer repo each app is mirrored to.
 *
 * There is no branch field. The branch is whichever one the workspace is on, so the same declaration
 * serves `develop` and `main`, and every subspace on one branch holds the same akanjs version and the
 * same library source.
 */
export class SubspaceConfig {
  static readonly fileName = "akan.subspace.ts";
  static readonly defaultPushableBranches = ["main", "develop", "debug"];

  static async from(workspace: WorkspaceExecutor): Promise<SubspaceConfig | null> {
    const configPath = path.join(workspace.workspaceRoot, SubspaceConfig.fileName);
    if (!(await FileSys.fileExists(configPath))) return null;
    const input = await import(configPath).then((mod: { default: SubspaceConfigInput }) => mod.default);
    return new SubspaceConfig(input);
  }

  readonly pushableBranches: string[];
  readonly exclude: string[];
  readonly subspaces: SubspaceDeclaration[];

  constructor(input: SubspaceConfigInput) {
    this.pushableBranches = input.pushableBranches ?? SubspaceConfig.defaultPushableBranches;
    this.exclude = input.exclude ?? [];
    this.subspaces = input.subspaces ?? [];
    this.#assertValid();
  }

  #assertValid() {
    const seenNames = new Set<string>();
    const appOwners = new Map<string, string>();
    for (const subspace of this.subspaces) {
      if (!subspace.name || !subspace.repo)
        throw new Error(`${SubspaceConfig.fileName}: every subspace needs a name and a repo`);
      if (seenNames.has(subspace.name))
        throw new Error(`${SubspaceConfig.fileName}: duplicate subspace "${subspace.name}"`);
      seenNames.add(subspace.name);
      if (!subspace.apps?.length)
        throw new Error(`${SubspaceConfig.fileName}: subspace "${subspace.name}" declares no apps`);
      for (const app of subspace.apps) {
        const owner = appOwners.get(app);
        //* One app never goes to two subspaces: the two would need per-subspace domains and ids, which
        //* this declaration cannot express. Share code through a lib instead.
        if (owner)
          throw new Error(
            `${SubspaceConfig.fileName}: app "${app}" is claimed by both "${owner}" and "${subspace.name}"`,
          );
        appOwners.set(app, subspace.name);
      }
    }
  }

  select(names: string[]) {
    if (!names.length) return this.subspaces;
    return names.map((name) => {
      const subspace = this.subspaces.find((candidate) => candidate.name === name);
      if (!subspace) throw new Error(`${SubspaceConfig.fileName}: unknown subspace "${name}"`);
      return subspace;
    });
  }

  assertPushable(branch: string) {
    if (this.pushableBranches.includes(branch)) return;
    throw new Error(
      `Branch "${branch}" is not pushable. ${SubspaceConfig.fileName} allows: ${this.pushableBranches.join(", ")}`,
    );
  }
}
