import type { PromiseOrObject } from "akanjs/base";
import { isThenable } from "akanjs/common";
import { type ReactNode, Suspense, type Usable, use } from "react";

interface StreamProps<Value> {
  of: PromiseOrObject<Value>;
  /** Rendered while `of` is pending. Only a thenable `of` gets a boundary, so a resolved one never shows it. */
  fallback?: ReactNode;
  children: (value: Value) => ReactNode;
}

// A resolved value renders in the SSR shell with no boundary; a thenable gets its own boundary and `use()`, so the
// server streams it (an effect would commit a skeleton). No `"use client"`: `use()` works in both graphs.
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
