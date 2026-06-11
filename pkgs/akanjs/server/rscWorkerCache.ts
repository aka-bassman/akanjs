import {
  hasRouteCacheInvalidationScope,
  type LruTtlCache,
  type RouteCacheInvalidation,
  type RouteCacheRenderState,
  shouldInvalidateRouteCacheEntry,
} from "./cachePolicy";

export interface CachedRscResult {
  chunks: Uint8Array[];
  bytes: number;
  chunksCount: number;
  pathname: string;
  routeId?: string;
  tags?: string[];
  theme?: string;
  cacheState: RouteCacheRenderState;
}

export function invalidateCachedRscResults(
  cache: LruTtlCache<CachedRscResult>,
  invalidation: RouteCacheInvalidation,
): void {
  if (!hasRouteCacheInvalidationScope(invalidation)) {
    cache.clear();
    return;
  }
  cache.invalidate((_key, result) =>
    shouldInvalidateRouteCacheEntry(
      {
        pathname: result.pathname,
        routeId: result.routeId,
        tags: result.tags,
      },
      invalidation,
    ),
  );
}
