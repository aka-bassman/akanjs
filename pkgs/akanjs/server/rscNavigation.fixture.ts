import type { AkanRouterStateV1, AkanRscPatchMetadata } from "./routeState";
import { createAkanSegmentCacheTree, createRscNavigationCacheNode } from "./rscNavigationState";

export const makeRouterState = (href: string, routeId: string): AkanRouterStateV1 => ({
  version: 1,
  buildId: 3,
  href,
  routeId,
  segments: [
    { kind: "root-layout", path: "/", key: "root:/:0" },
    { kind: "layout", path: "/docs", key: "layout:/docs:1" },
    { kind: "page", path: routeId, key: `page:${routeId}:2` },
  ],
});

export const makePatch = (routeId = "/docs/api"): AkanRscPatchMetadata => ({
  patchStartIndex: 2,
  patchStartSegmentKey: `page:${routeId}:2`,
  segmentPath: ["root:/:0", "layout:/docs:1", `page:${routeId}:2`],
});

export const makeTreeOf = <Value>(routerState: AkanRouterStateV1, value: Value) =>
  createAkanSegmentCacheTree(
    createRscNavigationCacheNode({ href: routerState.href, thenable: Promise.resolve(value), routerState }),
  );
