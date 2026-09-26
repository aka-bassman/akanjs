import type { PageConfig } from "akanjs/client";
import {
  type AkanHeadSnapshotV1,
  type AkanRscPatchDecision,
  encodeAkanHeadSnapshot,
  isAkanHeadSnapshotV1,
} from "./routeState";

export function resolveAkanRscHeadSafePatchDecision({
  partialCommitEnabled,
  patchDecision,
  pageConfig,
  headSnapshot,
}: {
  partialCommitEnabled: boolean;
  patchDecision: AkanRscPatchDecision;
  pageConfig?: PageConfig;
  headSnapshot?: AkanHeadSnapshotV1;
}): AkanRscPatchDecision {
  if (!partialCommitEnabled || patchDecision.status !== "patch" || !patchDecision.patch) return patchDecision;
  if (pageConfig?.rscPatchHeadSafe !== true) return fullDecision("head-unsafe", patchDecision);
  if (!headSnapshot) return fullDecision("head-missing", patchDecision);
  if (!isAkanHeadSnapshotV1(headSnapshot)) return fullDecision("head-invalid", patchDecision);
  if (!encodeAkanHeadSnapshot(headSnapshot)) return fullDecision("head-too-large", patchDecision);
  return { ...patchDecision, patch: { ...patchDecision.patch, headSafe: true, headSnapshot } };
}

const fullDecision = (reason: string, { commonPrefixLength }: AkanRscPatchDecision): AkanRscPatchDecision => ({
  status: "full",
  reason,
  commonPrefixLength,
});
