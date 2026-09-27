import type { AkanUiOverrideManifest } from "./UiOverride";

/** Checks an `_overrides.tsx` manifest against each slot's contract; a server-safe identity, so no `"use client"`. */
export const override = (overrides: AkanUiOverrideManifest): AkanUiOverrideManifest => overrides;
