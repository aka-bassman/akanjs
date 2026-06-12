import type { PathRoute } from "akanjs/client";

export const AKAN_RSC_STATE_VERSION = 1;
export const AKAN_RSC_STATE_VERSION_HEADER = "X-Akan-Rsc-State-Version";
export const AKAN_RSC_CURRENT_ROUTE_HEADER = "X-Akan-Rsc-Current-Route";
export const AKAN_RSC_CURRENT_STATE_HEADER = "X-Akan-Rsc-Current-State";
export const AKAN_RSC_RESPONSE_STATE_HEADER = "X-Akan-Rsc-State";

export type AkanRscPartialStatus = "full" | "candidate" | "fallback";

export interface AkanRouteSegmentState {
  key: string;
  path: string;
  kind: "root-layout" | "layout" | "page";
}

export interface AkanRouterStateV1 {
  version: typeof AKAN_RSC_STATE_VERSION;
  buildId?: number;
  href: string;
  routeId: string;
  segments: AkanRouteSegmentState[];
}

export interface AkanRscPartialDecision {
  status: AkanRscPartialStatus;
  reason?: string;
  commonPrefixLength: number;
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string | null {
  try {
    const padded = value
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function isSegmentState(value: unknown): value is AkanRouteSegmentState {
  if (!value || typeof value !== "object") return false;
  const segment = value as Partial<AkanRouteSegmentState>;
  return (
    typeof segment.key === "string" &&
    typeof segment.path === "string" &&
    (segment.kind === "root-layout" || segment.kind === "layout" || segment.kind === "page")
  );
}

export function isAkanRouterStateV1(value: unknown): value is AkanRouterStateV1 {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<AkanRouterStateV1>;
  return (
    state.version === AKAN_RSC_STATE_VERSION &&
    (state.buildId === undefined || typeof state.buildId === "number") &&
    typeof state.href === "string" &&
    typeof state.routeId === "string" &&
    Array.isArray(state.segments) &&
    state.segments.every(isSegmentState)
  );
}

export function encodeAkanRouterState(state: AkanRouterStateV1): string {
  return encodeBase64Url(JSON.stringify(state));
}

export function decodeAkanRouterState(value: string | null | undefined): AkanRouterStateV1 | null {
  if (!value) return null;
  const json = decodeBase64Url(value);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as unknown;
    return isAkanRouterStateV1(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function appendAkanRouterStateRequestHeaders(
  headers: Headers,
  state: AkanRouterStateV1 | null | undefined,
): void {
  if (!state) return;
  headers.set(AKAN_RSC_STATE_VERSION_HEADER, String(state.version));
  headers.set(AKAN_RSC_CURRENT_ROUTE_HEADER, state.routeId);
  headers.set(AKAN_RSC_CURRENT_STATE_HEADER, encodeAkanRouterState(state));
}

export function readAkanRouterStateResponseHeader(headers: Headers): AkanRouterStateV1 | null {
  return decodeAkanRouterState(headers.get(AKAN_RSC_RESPONSE_STATE_HEADER));
}

export function createAkanRouterState({
  pathRoute,
  href,
  buildId,
}: {
  pathRoute: PathRoute;
  href: string;
  buildId?: number;
}): AkanRouterStateV1 {
  return {
    version: AKAN_RSC_STATE_VERSION,
    buildId,
    href,
    routeId: pathRoute.path,
    segments: createAkanRouteSegments(pathRoute),
  };
}

export function createAkanRouteSegments(pathRoute: PathRoute): AkanRouteSegmentState[] {
  const segments: AkanRouteSegmentState[] = [];
  const routePaths = pathRoute.pathSegments.length ? pathRoute.pathSegments : [pathRoute.path || "/"];
  const segmentPathAt = (index: number) => routePaths[Math.min(index, routePaths.length - 1)] ?? "/";

  for (let index = 0; index < pathRoute.renderRootLayouts.length; index++) {
    const path = segmentPathAt(index);
    segments.push({ kind: "root-layout", path, key: `root:${path}:${index}` });
  }

  for (let index = 0; index < pathRoute.renderLayouts.length; index++) {
    const stackIndex = pathRoute.renderRootLayouts.length + index;
    const path = segmentPathAt(stackIndex);
    segments.push({ kind: "layout", path, key: `layout:${path}:${stackIndex}` });
  }

  const pageIndex = pathRoute.renderRootLayouts.length + pathRoute.renderLayouts.length;
  segments.push({ kind: "page", path: pathRoute.path, key: `page:${pathRoute.path}:${pageIndex}` });
  return segments;
}

export function readAkanRouterStateRequest(headers: Headers): {
  state: AkanRouterStateV1 | null;
  currentRoute?: string;
  reason?: string;
} {
  const encoded = headers.get(AKAN_RSC_CURRENT_STATE_HEADER);
  if (!encoded) return { state: null, reason: "missing-state" };

  const version = headers.get(AKAN_RSC_STATE_VERSION_HEADER);
  if (version !== String(AKAN_RSC_STATE_VERSION)) return { state: null, reason: "version-mismatch" };

  const state = decodeAkanRouterState(encoded);
  if (!state) return { state: null, reason: "invalid-state" };

  return { state, currentRoute: headers.get(AKAN_RSC_CURRENT_ROUTE_HEADER) ?? undefined };
}

export function resolveAkanRscPartialDecision({
  currentState,
  currentRoute,
  targetState,
}: {
  currentState: AkanRouterStateV1 | null;
  currentRoute?: string;
  targetState: AkanRouterStateV1;
}): AkanRscPartialDecision {
  if (!currentState) return { status: "full", reason: "missing-state", commonPrefixLength: 0 };
  if (currentRoute && currentRoute !== currentState.routeId) {
    return { status: "fallback", reason: "current-route-mismatch", commonPrefixLength: 0 };
  }
  if (
    currentState.buildId !== undefined &&
    targetState.buildId !== undefined &&
    currentState.buildId !== targetState.buildId
  ) {
    return { status: "fallback", reason: "build-mismatch", commonPrefixLength: 0 };
  }

  const commonPrefixLength = countCommonRouteSegments(currentState.segments, targetState.segments);
  if (commonPrefixLength === 0) return { status: "full", reason: "root-mismatch", commonPrefixLength };
  if (currentState.href === targetState.href && currentState.routeId === targetState.routeId) {
    return { status: "full", reason: "same-route", commonPrefixLength };
  }
  return { status: "candidate", reason: "common-prefix", commonPrefixLength };
}

export function countCommonRouteSegments(
  currentSegments: AkanRouteSegmentState[],
  targetSegments: AkanRouteSegmentState[],
): number {
  const length = Math.min(currentSegments.length, targetSegments.length);
  for (let index = 0; index < length; index++) {
    if (currentSegments[index]?.key !== targetSegments[index]?.key) return index;
  }
  return length;
}
