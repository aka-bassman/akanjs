"use client";
import { createOverridable } from "../UiOverride";
import { ProgressBar } from "./ProgressBar";
import { Button, Input, Skeleton } from "./Skeleton";
import { Area, Spin } from "./Spin";

// One export per member, not the namespace: a `"use client"` module's exports become client-reference stubs, so
// `Loading.Skeleton` off one stub would be `undefined` on the server. `index.ts` assembles the namespace instead.
export const LoadingArea = createOverridable("LoadingArea", Area);
export const LoadingButton = createOverridable("LoadingButton", Button);
export const LoadingInput = createOverridable("LoadingInput", Input);
export const LoadingProgressBar = createOverridable("LoadingProgressBar", ProgressBar);
export const LoadingSkeleton = createOverridable("LoadingSkeleton", Skeleton);
export const LoadingSpin = createOverridable("LoadingSpin", Spin);
