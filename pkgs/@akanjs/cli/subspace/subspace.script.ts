import { script, type Workspace } from "@akanjs/devkit/commandDecorators";
import {
  formatSubspaceDiff,
  formatSubspacePullResult,
  formatSubspacePushResults,
  formatSubspaceStatuses,
} from "@akanjs/devkit/subspace";
import { Logger } from "akanjs/common";
import { SubspaceRunner } from "./subspace.runner";

export class SubspaceScript extends script("subspace", [SubspaceRunner]) {
  async status(workspace: Workspace, names: string[], format: "text" | "json" = "text") {
    const spinner = workspace.spinning("Checking subspaces...");
    const statuses = await this.subspaceRunner.status(workspace, names);
    const drifted = statuses.filter((status) => status.driftedLibs.length).length;
    spinner.succeed(`Checked ${statuses.length} subspace(s) (${drifted} with library drift)`);
    Logger.rawLog(format === "json" ? JSON.stringify(statuses, null, 2) : formatSubspaceStatuses(statuses));
  }

  async push(
    workspace: Workspace,
    names: string[],
    { verify, format }: { verify?: boolean; format?: "text" | "json" },
  ) {
    const spinner = workspace.spinning("Pushing to subspaces...");
    const results = await this.subspaceRunner.push(workspace, names, { verify });
    const pushed = results.filter((result) => result.outcome === "pushed").length;
    spinner.succeed(`Pushed ${pushed} of ${results.length} subspace(s)`);
    Logger.rawLog(format === "json" ? JSON.stringify(results, null, 2) : formatSubspacePushResults(results));
    if (results.some((result) => result.outcome === "refused")) process.exitCode = 1;
  }

  async diff(workspace: Workspace, name: string, filter: string | null, format: "text" | "json" = "text") {
    const spinner = workspace.spinning(`Diffing ${name}...`);
    const result = await this.subspaceRunner.diff(workspace, name, filter);
    const total = result.app.files.length + result.libs.files.length;
    spinner.succeed(`${total} file(s) differ (${result.libs.files.length} in shared libraries)`);
    Logger.rawLog(format === "json" ? JSON.stringify(result, null, 2) : formatSubspaceDiff(result));
  }

  async pull(
    workspace: Workspace,
    name: string,
    { adoptLibs, format }: { adoptLibs?: boolean; format?: "text" | "json" },
  ) {
    const spinner = workspace.spinning(`Pulling customer commits from ${name}...`);
    const result = await this.subspaceRunner.pull(workspace, name, { adoptLibs });
    spinner.succeed(`${result.incoming.length} customer commit(s), ${result.applied.length} file(s) applied`);
    Logger.rawLog(format === "json" ? JSON.stringify(result, null, 2) : formatSubspacePullResult(result));
  }
}
