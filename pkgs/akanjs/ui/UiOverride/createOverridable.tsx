"use client";
import { type ComponentType, createElement, type ReactNode } from "react";

import type { AkanUiOverrides } from "./context";
import { useUiOverride } from "./useUiOverride";

/** Renders the nearest `_overrides.tsx` entry for `name`, else `Default`. */
export const createOverridable = <K extends keyof AkanUiOverrides>(
  name: K,
  Default: AkanUiOverrides[K],
): AkanUiOverrides[K] => {
  // Narrowed before `??`: the deferred union `AkanUiOverrides[K]` would otherwise trip TS2590.
  const Fallback = Default as unknown as ComponentType<Record<string, unknown>>;
  const Overridable = (props: Record<string, unknown>): ReactNode => {
    const Override = useUiOverride(name) as unknown as ComponentType<Record<string, unknown>> | undefined;
    return createElement(Override ?? Fallback, props);
  };
  return Overridable as unknown as AkanUiOverrides[K];
};
