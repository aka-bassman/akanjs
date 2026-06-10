export interface RscNavigationCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): boolean;
  keys(): IterableIterator<string>;
  readonly size: number;
}

export function rememberRscCacheEntry<T>(
  cache: RscNavigationCache<T>,
  href: string,
  thenable: T,
  maxEntries: number,
): void {
  cache.delete(href);
  cache.set(href, thenable);
  while (cache.size > maxEntries) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

export function deleteRscCacheEntryIfCurrent<T>(cache: RscNavigationCache<T>, href: string, thenable: T): boolean {
  if (cache.get(href) !== thenable) return false;
  return cache.delete(href);
}

interface CommitRscNavigationInput<T> {
  cache: RscNavigationCache<T>;
  href: string;
  thenable: T;
  maxEntries: number;
  startTransition: (callback: () => void) => void;
  commitThenable: (thenable: T) => void;
  updateHistory?: () => void;
  scrollToTop?: boolean;
  bumpScrollToTop?: () => void;
}

export function commitRscNavigation<T>({
  cache,
  href,
  thenable,
  maxEntries,
  startTransition,
  commitThenable,
  updateHistory,
  scrollToTop,
  bumpScrollToTop,
}: CommitRscNavigationInput<T>): void {
  rememberRscCacheEntry(cache, href, thenable, maxEntries);
  startTransition(() => {
    commitThenable(thenable);
    updateHistory?.();
    if (scrollToTop) bumpScrollToTop?.();
  });
}

export function commitLatestRscNavigation<T>({
  navId,
  getCurrentNavId,
  ...input
}: CommitRscNavigationInput<T> & {
  navId: number;
  getCurrentNavId: () => number;
}): boolean {
  if (navId !== getCurrentNavId()) return false;
  commitRscNavigation(input);
  return true;
}

export function observeRscNavigation<T extends PromiseLike<unknown>>({
  cache,
  href,
  thenable,
  navId,
  getCurrentNavId,
  isExpectedNavigationError,
  onLatestError,
}: {
  cache: RscNavigationCache<T>;
  href: string;
  thenable: T;
  navId: number;
  getCurrentNavId: () => number;
  isExpectedNavigationError?: (error: unknown) => boolean;
  onLatestError: (error: unknown) => void;
}): void {
  void Promise.resolve(thenable).catch((error) => {
    deleteRscCacheEntryIfCurrent(cache, href, thenable);
    if (isExpectedNavigationError?.(error)) return;
    if (navId === getCurrentNavId()) onLatestError(error);
  });
}
