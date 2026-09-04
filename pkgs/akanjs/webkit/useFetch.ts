"use client";
import { isThenable } from "akanjs/common";
import { useEffect, useMemo, useState } from "react";

/** Tracks fulfillment state for a promise or immediate value inside a client component. */
export const useFetch = <Return>(
  fnOrPromise: Promise<Return> | Return,
  { onError }: { onError?: (err: string) => void } = {},
): { fulfilled: boolean; value: Return | null } => {
  const [asyncState, setAsyncState] = useState<{ fulfilled: boolean; value: Return | null }>({
    fulfilled: false,
    value: null,
  });
  useEffect(() => {
    if (!isThenable(fnOrPromise)) return;
    let cancelled = false;
    void (async () => {
      try {
        const ret = await fnOrPromise;
        if (!cancelled) setAsyncState({ fulfilled: true, value: ret });
      } catch (err) {
        if (cancelled) return;
        const content = `Error: ${typeof err === "string" ? err : (err as Error).message}`;
        onError?.(content);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!isThenable(fnOrPromise)) {
    return { fulfilled: true, value: fnOrPromise as Return };
  }
  return asyncState;
};

/**
 * Like `useFetch`, but takes a factory function that is only called once
 * (or when `deps` change). Prevents duplicate network requests caused by
 * React re-renders.
 */
export const useFetchFn = <Return>(
  factory: () => Promise<Return> | Return,
  deps: unknown[] = [],
  options: { onError?: (err: string) => void } = {},
): { fulfilled: boolean; value: Return | null } => {
  const memoized = useMemo(factory, deps);
  return useFetch(memoized, options);
};
