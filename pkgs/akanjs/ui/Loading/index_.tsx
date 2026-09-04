"use client";
import { createOverridable } from "../UiOverride";
import { Area } from "./Area";
import { Button } from "./Button";
import { Input } from "./Input";
import { ProgressBar } from "./ProgressBar";
import { Skeleton } from "./Skeleton";
import { Spin } from "./Spin";

/**
 * One named export per member, rather than the `Loading` namespace object itself, because the `"use client"`
 * transform replaces a client module's *exports* with `registerClientReference` stubs. A namespace exported
 * from here would reach a server component as one reference for the whole object, and `Loading.Skeleton` on it
 * would read a property the stub does not have — `undefined`, which React reports as an invalid element type.
 * The namespace is assembled in `index.ts`, which carries no directive, so each member crosses on its own.
 */
export const LoadingArea = createOverridable("LoadingArea", Area);
export const LoadingButton = createOverridable("LoadingButton", Button);
export const LoadingInput = createOverridable("LoadingInput", Input);
export const LoadingProgressBar = createOverridable("LoadingProgressBar", ProgressBar);
export const LoadingSkeleton = createOverridable("LoadingSkeleton", Skeleton);
export const LoadingSpin = createOverridable("LoadingSpin", Spin);
