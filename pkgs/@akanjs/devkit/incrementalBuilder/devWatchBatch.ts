import type { BuilderEvent, ChangeBatch, DevChangePlan } from "akanjs/server";
import type { DevChangePlanner, GeneratedIndexSyncResult } from "../frontendBuild";

export interface PrepareDevWatchBatchOptions {
  generation: number;
  batch: ChangeBatch;
  indexSync: GeneratedIndexSyncResult;
  changePlanner: DevChangePlanner;
}

export interface PreparedDevWatchBatch {
  files: string[];
  kinds: ("code" | "css" | "config")[];
  expandedBatch: ChangeBatch;
  /** The same plan the event carries, where `devPlan` is optional — read it here, not off the event. */
  devPlan: DevChangePlan;
  event: Extract<BuilderEvent, { type: "invalidate" }>;
  hasSyncErrors: boolean;
}

export const prepareDevWatchBatch = ({
  generation,
  batch,
  indexSync,
  changePlanner,
}: PrepareDevWatchBatchOptions): PreparedDevWatchBatch => {
  const files = [...new Set([...batch.files, ...indexSync.changedFiles])].sort();
  const kindSet = new Set(batch.kinds);
  if (indexSync.changedFiles.length > 0) kindSet.add("code");
  const kinds = [...kindSet] as ("code" | "css" | "config")[];
  const expandedBatch: ChangeBatch = { files, kinds: kindSet };
  const devPlan = changePlanner.plan({
    generation,
    files,
    kinds,
    generatedFiles: indexSync.changedFiles,
  });

  if (indexSync.errors.length > 0 && !devPlan.actions.includes("report-error")) {
    const withReport: DevChangePlan["actions"] = [...devPlan.actions, "report-error"];
    devPlan.actions = withReport.sort();
  }

  return {
    files,
    kinds,
    expandedBatch,
    devPlan,
    event: { type: "invalidate", kinds, files, generation, devPlan },
    hasSyncErrors: indexSync.errors.length > 0,
  };
};
