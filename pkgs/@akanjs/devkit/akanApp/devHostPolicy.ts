import path from "node:path";
import type {
  BuilderMessage,
  BuildPhase,
  ChangeBatch,
  DevBuildStatus,
  DevChangePlan,
  DevChangeRole,
} from "akanjs/server";
import type { IncrementalBuilderStatus } from "../incrementalBuilder";

const BACKEND_RECOVERY_MAX_ATTEMPTS = 5;

/**
 * How many requests may wait for a builder that is coming back. Generous — a page load asks for
 * several routes — but finite, so a builder that never returns cannot grow this without bound. Past
 * it, requests are failed as they were before, which is the behaviour this limit falls back to.
 */
const HELD_BUILDER_REQUEST_LIMIT = 64;

export const BUILDER_MIN_RSS_RECYCLE_INTERVAL_MS = 30_000;

const BUILDER_TIGHT_RSS_REPORT_LIMIT = 2;

// Far enough above the ceiling that no purge would rescue it; recycle without waiting.
const BUILDER_RSS_HARD_MULTIPLE = 1.5;

// A sandbox between user turns pays for a watcher that is watching nothing change. Suspending build
// capacity after this long returns the builder's residency until the next edit or route request.
const DEV_IDLE_SUSPEND_MS = 300_000;

// A wake that immediately suspends again would flap around whatever woke it.
const DEV_IDLE_MIN_UPTIME_MS = 30_000;

export const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

/\.(css|scss|sass|less|json|svg|png|jpe?g|webp|gif|avif|ico|woff2?|ttf|otf|mp3|mp4|wav|html)$/i;
const SERVER_SUFFIXES = [".service.ts", ".document.ts"];

const SHARED_SUFFIXES = [".constant.ts", ".dictionary.ts", ".signal.ts"];

const RUNTIME_METADATA_BASENAMES = new Set(["dict.ts", "sig.ts", "useClient.ts", "useServer.ts"]);

export const shouldRestartBackendByDevPlan = (
  message: Extract<BuilderMessage, { type: "invalidate" }>,
): boolean | null => {
  if (!message.devPlan) return null;
  if (message.devPlan.actions.includes("report-error")) return false;
  if (message.devPlan.actions.includes("restart-builder")) return false;
  return message.devPlan.actions.includes("restart-backend");
};

export const shouldRestartBuilderByDevPlan = (message: Extract<BuilderMessage, { type: "invalidate" }>): boolean =>
  message.devPlan?.actions.includes("restart-builder") ?? false;

/**
 * A backend that keeps dying isn't going to heal by retrying the same code; after this many
 * consecutive attempts the host idles and the next server-side edit triggers a fresh restart.
 */
export const shouldAbandonBackendRecovery = (attempts: number, maxAttempts = BACKEND_RECOVERY_MAX_ATTEMPTS): boolean =>
  attempts >= maxAttempts;

/** The gateway reports backend failures with `generation: -1`; the host assigns its own counter then. */
export const normalizeBackendReportedGeneration = (generation: number): number | undefined =>
  generation >= 0 ? generation : undefined;

export const shouldRestartDevHostByDevPlan = (message: Extract<BuilderMessage, { type: "invalidate" }>): boolean =>
  message.devPlan?.actions.includes("restart-dev-host") ?? message.kinds.includes("config");

export type BackendLifecycleState = "starting" | "ready" | "restart-pending" | "stopping" | "recovering" | "stopped";

export interface BackendRestartReason {
  generation?: number;
  files: string[];
  roles: Extract<DevChangeRole, "server" | "shared" | "barrel" | "config">[];
}

const RESTART_ROLE_ORDER: BackendRestartReason["roles"] = ["server", "shared", "barrel", "config"];

const generationValue = (generation: number | undefined): number => generation ?? -1;

export const isLegacyBackendFallbackFile = (file: string, workspaceRoot: string): boolean => {
  const abs = path.resolve(file);
  const ext = path.extname(abs).toLowerCase();
  if (!SOURCE_EXTS.has(ext)) return false;
  const rel = path.relative(path.resolve(workspaceRoot), abs);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return false;
  const parts = rel.split(path.sep).filter(Boolean);
  const [scope] = parts;
  if (scope !== "apps" && scope !== "libs" && scope !== "pkgs") return false;

  const base = path.basename(abs);
  return (
    parts.includes("srvkit") ||
    parts.includes("common") ||
    SERVER_SUFFIXES.some((suffix) => base.endsWith(suffix)) ||
    SHARED_SUFFIXES.some((suffix) => base.endsWith(suffix)) ||
    RUNTIME_METADATA_BASENAMES.has(base) ||
    base === "main.ts" ||
    base === "server.ts"
  );
};

export const shouldMarkBuildPhaseRecovered = (
  previousByPhase: ReadonlyMap<BuildPhase, DevBuildStatus>,
  status: DevBuildStatus,
): boolean => {
  const previous = previousByPhase.get(status.phase);
  return Boolean(previous && status.ok && !previous.ok && generationValue(status.generation) >= previous.generation);
};

export const createBackendBuildStatus = ({
  generation,
  ok,
  files = [],
  message,
}: {
  generation: number;
  ok: boolean;
  files?: string[];
  message?: string;
}): DevBuildStatus => ({
  generation,
  phase: "backend",
  ok,
  files,
  message,
});

export const backendRestartReasonFromMessage = (
  message: Extract<BuilderMessage, { type: "invalidate" }>,
): BackendRestartReason => {
  const roleSet = new Set<BackendRestartReason["roles"][number]>();
  for (const role of message.devPlan?.roles ?? []) {
    if (role === "server" || role === "shared" || role === "barrel" || role === "config") roleSet.add(role);
  }
  return {
    generation: message.devPlan?.generation ?? message.generation,
    files: [...new Set(message.files)].sort(),
    roles: RESTART_ROLE_ORDER.filter((role) => roleSet.has(role)),
  };
};

export const mergeBackendRestartReasons = (
  current: BackendRestartReason | null,
  next: BackendRestartReason,
): BackendRestartReason => ({
  generation:
    generationValue(next.generation) >= generationValue(current?.generation) ? next.generation : current?.generation,
  files: [...new Set([...(current?.files ?? []), ...next.files])].sort(),
  roles: RESTART_ROLE_ORDER.filter((role) => current?.roles.includes(role) || next.roles.includes(role)),
});

export const shouldReplaceLastGoodMessage = (
  current:
    | Extract<BuilderMessage, { type: "pages-updated" }>
    | Extract<BuilderMessage, { type: "css-updated" }>
    | undefined,
  next: Extract<BuilderMessage, { type: "pages-updated" }> | Extract<BuilderMessage, { type: "css-updated" }>,
): boolean => !current || generationValue(next.data.generation) >= generationValue(current.data.generation);

export const shouldQueueBuildStatusReplay = (backendReady: boolean, pendingReplayCount: number): boolean =>
  !backendReady || pendingReplayCount > 0;

/**
 * Recycling the builder/backend on a generation whose build already failed is guaranteed to strand
 * the dev server: the rebooted builder hits the same compile error and exits before builder-ready.
 * Failing phase statuses for a generation arrive over IPC before that generation's invalidate, so
 * the host can check them here and defer the recycle until a healthy batch lands.
 */
export const hasBuildFailureForGeneration = (
  statusByPhase: ReadonlyMap<BuildPhase, DevBuildStatus>,
  generation: number | undefined,
): boolean => {
  if (typeof generation !== "number") return false;
  for (const status of statusByPhase.values()) {
    if (!status.ok && status.generation === generation) return true;
  }
  return false;
};

export type BuilderRssRecycleDecision = "unbounded" | "below-ceiling" | "build-failed" | "too-soon" | "recycle";

/**
 * Whether an over-ceiling builder should be replaced now.
 *
 * `Bun.build` never returns its native arenas, so the builder's RSS only comes back when the process
 * exits. Recycling it is therefore the only bound available — but it costs a boot build, so the two
 * cases where a recycle cannot help are excluded: a generation whose build already failed (the
 * replacement would hit the same compile error), and a recycle so soon after the last one that the
 * ceiling is evidently unreachable for this app.
 */
export const decideBuilderRssRecycle = ({
  rssBytes,
  ceilingBytes,
  buildFailed,
  msSinceLastRecycle,
  minIntervalMs = BUILDER_MIN_RSS_RECYCLE_INTERVAL_MS,
}: {
  rssBytes: number;
  ceilingBytes: number | null;
  buildFailed: boolean;
  msSinceLastRecycle: number | null;
  minIntervalMs?: number;
}): BuilderRssRecycleDecision => {
  if (!ceilingBytes) return "unbounded";
  if (rssBytes < ceilingBytes) return "below-ceiling";
  if (buildFailed) return "build-failed";
  if (msSinceLastRecycle !== null && msSinceLastRecycle < minIntervalMs) return "too-soon";
  return "recycle";
};

export type BuilderRssSettleDecision = "recycle-now" | "wait-and-recheck";

/**
 * Whether an armed recycle should wait out the allocator's purge window before committing. A builder
 * far enough over the ceiling is not going to be rescued by a purge, so waiting there only delays a
 * recycle that has to happen.
 */
export const decideBuilderRssSettle = ({
  rssBytes,
  ceilingBytes,
  hardMultiple = BUILDER_RSS_HARD_MULTIPLE,
}: {
  rssBytes: number;
  ceilingBytes: number;
  hardMultiple?: number;
}): BuilderRssSettleDecision => (rssBytes >= ceilingBytes * hardMultiple ? "recycle-now" : "wait-and-recheck");

export type IdleSuspendDecision =
  | "disabled"
  | "already-suspended"
  | "builder-not-ready"
  | "backend-not-ready"
  | "build-failed"
  | "restart-pending"
  | "too-soon"
  | "suspend";

/**
 * Whether the dev host may drop its build capacity now. Every "no" here is a case where suspending
 * would either lose work or produce a wake that immediately re-suspends:
 *
 * - a red build means the developer is mid-fix and about to save again, and a wake would boot straight
 *   back into the same error via the degraded-boot path
 * - a pending restart/recovery already has its own plan for the builder
 * - `too-soon` keeps a wake from flapping around whatever triggered it
 */
export const decideIdleSuspend = ({
  enabled,
  suspended,
  builderReady,
  backendReady,
  buildFailed,
  restartPending,
  msSinceWake,
  minUptimeMs = DEV_IDLE_MIN_UPTIME_MS,
}: {
  enabled: boolean;
  suspended: boolean;
  builderReady: boolean;
  backendReady: boolean;
  buildFailed: boolean;
  restartPending: boolean;
  msSinceWake: number | null;
  minUptimeMs?: number;
}): IdleSuspendDecision => {
  if (!enabled) return "disabled";
  if (suspended) return "already-suspended";
  if (!builderReady) return "builder-not-ready";
  if (!backendReady) return "backend-not-ready";
  if (buildFailed) return "build-failed";
  if (restartPending) return "restart-pending";
  if (msSinceWake !== null && msSinceWake < minUptimeMs) return "too-soon";
  return "suspend";
};

/** `undefined` env means the default is on; any non-positive value turns idle suspend off. */
export const resolveIdleSuspendMs = (raw: string | undefined): number | null => {
  if (raw === undefined || raw === "") return DEV_IDLE_SUSPEND_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
};

/** Any red phase blocks a suspend, unlike the rss recycle which only cares about one generation. */
export const hasAnyBuildFailure = (statusByPhase: ReadonlyMap<BuildPhase, DevBuildStatus>): boolean =>
  [...statusByPhase.values()].some((status) => !status.ok);

/**
 * A config change while suspended cannot be applied by restarting the builder alone — the dev host
 * itself has to re-read the config, which is the same path an ordinary config save takes.
 */
export const shouldRefreshConfigOnIdleWake = (batch: ChangeBatch | null): boolean =>
  !!batch && batch.kinds.has("config");

/**
 * Whether a request that arrived while the builder was away should wait for the one coming back.
 *
 * A recycle or a crash-restart is a gap, not a failure — the request that lands in it is the page a
 * developer is waiting on. A stopped builder is a different thing: nothing is bringing it back, so
 * waiting would only delay the error.
 *
 * `recycling` is in here for the same reason as `restarting`, and was the hole this decision shipped
 * with: a draining builder is still alive, so the request reached it and came back refused while the
 * host still thought there was nothing to wait for.
 */
const RETURNING_BUILDER_STATUSES = new Set<IncrementalBuilderStatus>(["starting", "recycling", "restarting"]);
export const shouldHoldForReturningBuilder = ({
  status,
  heldCount,
  limit = HELD_BUILDER_REQUEST_LIMIT,
}: {
  status: IncrementalBuilderStatus;
  heldCount: number;
  limit?: number;
}): boolean => RETURNING_BUILDER_STATUSES.has(status) && heldCount < limit;

/**
 * Whether a builder that is over the ceiling again this soon after being replaced is worth saying so
 * about, once. Not a reason to stop enforcing the ceiling: the minimum interval already bounds what
 * this costs at one recycle per interval, and dropping the bound is how a container gets OOM-killed.
 *
 * This used to disable the ceiling for the session, on a count that a single page load reaches — two
 * route builds, two reports, both inside the interval. That is normal work on any app whose builds sit
 * above the ceiling, which is the same app the ceiling was derived for.
 */
export const shouldWarnBuilderRssCeilingTight = (
  reportsSinceRecycle: number,
  limit = BUILDER_TIGHT_RSS_REPORT_LIMIT,
): boolean => reportsSinceRecycle >= limit;

/**
 * Whether recycling can ever bring this builder under the ceiling.
 *
 * Measured on a replacement the moment it is ready, before it has built anything on demand: that is
 * the floor every future replacement lands on, so a floor already over the ceiling is the one case
 * where the recycle loop is pure cost. It is also the case the escape hatch was always described as
 * being for — the previous rule inferred it from report timing and caught ordinary work instead.
 */
export const isRssCeilingUnreachable = (freshRssBytes: number | null, ceilingBytes: number | null): boolean =>
  freshRssBytes !== null && ceilingBytes !== null && freshRssBytes >= ceilingBytes;

/**
 * Whether a recycled builder's re-announced boot artifact actually differs from what the backend
 * already has. Both payload identities are content hashes — `pages-[hash].js` and
 * `<name>-[hash].css` — so an unchanged recycle produces identical ones and needs no reload. Only a
 * save that raced the recycle moves them, and that is the case worth pushing.
 */
export const shouldRelayRecycledFrontendState = (
  current:
    | Extract<BuilderMessage, { type: "pages-updated" }>
    | Extract<BuilderMessage, { type: "css-updated" }>
    | undefined,
  next: Extract<BuilderMessage, { type: "pages-updated" }> | Extract<BuilderMessage, { type: "css-updated" }>,
): boolean => {
  if (!current || current.type !== next.type) return true;
  if (current.type === "pages-updated" && next.type === "pages-updated")
    return current.data.bundlePath !== next.data.bundlePath;
  if (current.type === "css-updated" && next.type === "css-updated")
    return JSON.stringify(current.data.cssAssets) !== JSON.stringify(next.data.cssAssets);
  return true;
};

const mergeDevPlans = (current?: DevChangePlan, next?: DevChangePlan): DevChangePlan | undefined => {
  if (!current) return next;
  if (!next) return current;
  const reasonByFile: Record<string, string[]> = { ...current.reasonByFile };
  for (const [file, reasons] of Object.entries(next.reasonByFile)) {
    reasonByFile[file] = [...new Set([...(reasonByFile[file] ?? []), ...reasons])].sort();
  }
  return {
    generation: Math.max(current.generation, next.generation),
    files: [...new Set([...current.files, ...next.files])].sort(),
    generatedFiles: [...new Set([...current.generatedFiles, ...next.generatedFiles])].sort(),
    roles: [...new Set([...current.roles, ...next.roles])].sort(),
    actions: [...new Set([...current.actions, ...next.actions])].sort(),
    reasonByFile,
  };
};

/** A deferred recycle accumulates every batch it skipped so the eventual restart covers them all. */
export const mergeInvalidateMessages = (
  current: Extract<BuilderMessage, { type: "invalidate" }>,
  next: Extract<BuilderMessage, { type: "invalidate" }>,
): Extract<BuilderMessage, { type: "invalidate" }> => {
  const generation = Math.max(generationValue(current.generation), generationValue(next.generation));
  return {
    type: "invalidate",
    kinds: [...new Set([...current.kinds, ...next.kinds])].sort(),
    files: [...new Set([...current.files, ...next.files])].sort(),
    generation: generation >= 0 ? generation : undefined,
    devPlan: mergeDevPlans(current.devPlan, next.devPlan),
  };
};

export const buildStatusReplaySequence = (
  pendingReplay: readonly DevBuildStatus[],
  latestByPhase: ReadonlyMap<BuildPhase, DevBuildStatus>,
): DevBuildStatus[] => [...pendingReplay, ...latestByPhase.values()];

/** `(mtimeMs, size)` per file — what a save moves, and what a rebuild of identical content does not. */
export type SourceFingerprints = ReadonlyMap<string, string>;

/**
 * Which of the files in `before` are no longer stamped the way they were.
 *
 * Only files present in `before` are compared. The question this answers is which *running* code went
 * stale while nothing was watching, and a file that did not exist then is not running anywhere.
 */
export const filesChangedSince = (before: SourceFingerprints, after: SourceFingerprints): string[] =>
  [...before].filter(([file, stamp]) => after.get(file) !== stamp).map(([file]) => file);
