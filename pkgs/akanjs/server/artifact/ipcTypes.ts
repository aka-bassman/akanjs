export interface BuildRouteResultPayload {
  manifestDelta: Record<string, { id: string; chunks: string[]; name: string; async: boolean }>;
  ssrManifestDelta: Record<string, Record<string, { id: string; chunks: string[]; name: string; async: boolean }>>;
  newEntries: string[];
  discoveredEntries?: string[];
  clientDeps: string[];
  clientDepsByEntry?: Record<string, string[]>;
  routeId?: string;
  generation?: number;
}

/**
 * Marks a frontend payload that re-announces a freshly booted artifact rather than reporting an edit.
 * A recycled builder rebuilds every artifact from scratch, but a running backend read
 * `base-artifact.json` once at boot and never re-reads it, so the new state has to be pushed. The
 * host drops such a payload when the hashed output did not actually move, which keeps a clean
 * recycle invisible to connected browsers.
 */
export type BuilderStateReason = "builder-recycle";

export interface CssPayload {
  cssAssets: Record<string, { cssUrl: string; cssRelPath: string }>;
  cssBase64ByUrl: Record<string, string>;
  generation?: number;
  changedFiles?: string[];
  reason?: BuilderStateReason;
}

export type DevChangeRole = "server" | "client" | "shared" | "barrel" | "config" | "css";

export type DevChangeAction =
  | "restart-backend"
  | "restart-builder"
  | "rebuild-client"
  | "rebuild-css"
  | "sync-generated"
  | "restart-dev-host"
  | "report-error";

export interface DevChangePlan {
  generation: number;
  files: string[];
  generatedFiles: string[];
  roles: DevChangeRole[];
  actions: DevChangeAction[];
  reasonByFile: Record<string, string[]>;
}

export type BuildPhase = "scan" | "barrel" | "csr" | "pages" | "css" | "route" | "backend";

export interface DevBuildStatus {
  generation: number;
  phase: BuildPhase;
  ok: boolean;
  files: string[];
  message?: string;
}

// --- backend → builder (request/response) -------------------------------

export type BuilderReq = {
  type: "build-route";
  id: number;
  routeId: string;
  seeds: string[];
  knownEntries: string[];
  generation?: number;
};

export type BuilderRes =
  | { type: "build-route-res"; id: number; ok: true; data: BuildRouteResultPayload }
  | { type: "build-route-res"; id: number; ok: false; error: string };

/**
 * Dev CSR artifacts are only reachable through the opt-in `/__csr` and `?csr=true` routes (mobile
 * local dev points a device WebView at the latter), so the builder skips them until a request
 * actually needs one. The first such request arms the builder through this pair and waits for the
 * build, after which every save keeps CSR in sync.
 */
export type BuilderCsrReq = { type: "build-csr"; id: number; reason: string };

export type BuilderCsrRes =
  | { type: "build-csr-res"; id: number; ok: true }
  | { type: "build-csr-res"; id: number; ok: false; error: string };

// --- dev host → builder (control) ---------------------------------------

/**
 * Asks the builder to finish its queued work and exit, which is the only way bundler memory is
 * returned to the OS (see `BuilderMetrics`). The host's existing restart path brings up a
 * replacement, so a graceful drain — rather than a kill — keeps a rebuild in flight from being
 * truncated.
 */
export type BuilderControl = { type: "builder-shutdown"; reason: string };

// --- builder → backend (unsolicited events) -----------------------------

export interface PagesBundlePayload {
  bundlePath: string;
  buildId: number;
  generation?: number;
  changedFiles?: string[];
  reason?: BuilderStateReason;
}

/**
 * `Bun.build` retains native bundler arenas the process never returns — `Bun.gc(true)` reclaims
 * nothing and the JS heap stays flat while RSS climbs — so the builder's memory only comes back when
 * it exits. It reports its own RSS here whenever its queues drain, and the dev host recycles it past
 * a ceiling to turn unbounded growth into a bounded sawtooth.
 */
export interface BuilderMetrics {
  rssBytes: number;
  /** The builder's newest generation; 0 until it has processed a watch batch since spawning. */
  generation: number;
  /** Work items completed since this builder spawned, so a host can require real work before recycling. */
  workCount: number;
}

export type BuilderEvent =
  | { type: "builder-ready"; buildId: string }
  | { type: "backend-ready"; pid: number }
  | {
      type: "invalidate";
      kinds: ("code" | "css" | "config")[];
      files: string[];
      generation?: number;
      devPlan?: DevChangePlan;
    }
  | { type: "css-updated"; data: CssPayload }
  | { type: "pages-updated"; data: PagesBundlePayload }
  | { type: "build-status"; data: DevBuildStatus }
  | { type: "builder-metrics"; data: BuilderMetrics };

export type BuilderMessage = BuilderReq | BuilderRes | BuilderCsrReq | BuilderCsrRes | BuilderControl | BuilderEvent;
