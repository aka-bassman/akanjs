import { command, Workspace } from "@akanjs/devkit/commandDecorators";
import { SubspaceScript } from "./subspace.script";

export class SubspaceCommand extends command("subspace", [SubspaceScript], ({ public: target }) => ({
  subspace: target({ desc: "Mirror apps and libraries between this workspace and the customer repos it serves" })
    .arg("action", String, {
      desc: "subspace action",
      default: "status",
      enum: ["status", "diff", "push", "pull"],
    })
    .arg("subspace", String, { desc: "subspace name; every subspace when omitted (required for pull)", nullable: true })
    .with(Workspace)
    .option("format", String, { desc: "output format", default: "text", enum: ["text", "json"] })
    .option("verify", Boolean, {
      flag: "y",
      desc: "run bun install + akan sync in the subspace before committing",
      default: true,
    })
    .option("adoptLibs", Boolean, { desc: "pull: also apply the subspace's library edits", default: false })
    .option("path", String, { desc: "diff: limit to one path", nullable: true })
    .exec(async function (action, subspace, workspace, format, verify, adoptLibs, filePath) {
      const names = subspace ? [subspace] : [];
      const output = format as "text" | "json";
      if (action === "status") await this.subspaceScript.status(workspace, names, output);
      else if (action === "push") await this.subspaceScript.push(workspace, names, { verify, format: output });
      else if (action === "diff" || action === "pull") {
        if (!subspace) throw new Error(`\`akan subspace ${action}\` needs a name — it is reviewed one repo at a time.`);
        if (action === "diff") await this.subspaceScript.diff(workspace, subspace, filePath, output);
        else await this.subspaceScript.pull(workspace, subspace, { adoptLibs, format: output });
      } else throw new Error(`Unknown subspace action: ${action}. Use status, diff, push or pull.`);
    }),
})) {}
