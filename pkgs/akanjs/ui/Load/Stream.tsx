import type { PromiseOrObject } from "akanjs/base";
import { isThenable } from "akanjs/common";
import { type ReactNode, Suspense, type Usable, use } from "react";

interface StreamProps<Value> {
  of: PromiseOrObject<Value>;
  /** Rendered while `of` is pending. Only a thenable `of` gets a boundary, so a resolved one never shows it. */
  fallback?: ReactNode;
  children: (value: Value) => ReactNode;
}

/**
 * Renders whatever a route hands over, awaited or not.
 *
 * A resolved value renders with no boundary, keeping its markup in the SSR shell that prerendering, SEO
 * snapshots and pre-hydration E2E read. A thenable gets a boundary of its own and is read with `use()`, so the
 * server streams the real markup once the data lands and the rest of the page never waits for it; resolving it
 * in an effect instead commits a skeleton the browser then has to re-render.
 *
 * The file carries no `"use client"`, which is what lets one implementation serve both sides: a route keeps its
 * `children` on the server, and `Load.Units` and friends compile it into their own client chunk. `use()` is
 * exported by the `react-server` build too, so the same read works in either graph.
 */
export default function Stream<Value>({ of, fallback = null, children }: StreamProps<Value>) {
  return isThenable(of) ? (
    <Suspense fallback={fallback}>
      <Resolve of={of as PromiseLike<Value>}>{children}</Resolve>
    </Suspense>
  ) : (
    children(of as Value)
  );
}

interface ResolveProps<Value> {
  of: PromiseLike<Value>;
  children: (value: Value) => ReactNode;
}
const Resolve = <Value,>({ of, children }: ResolveProps<Value>) => children(use(of as Usable<Value>));
