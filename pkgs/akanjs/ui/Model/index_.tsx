import { lazy } from "akanjs/webkit";

// These mount on interaction, long after paint; without their own boundary a loading chunk would suspend the route.
const withSuspense = { suspense: true } as const;

// Host markup only: this module has no `"use client"`, so a client component (`Loading.Skeleton`) is `undefined`
// in the thunk, and a `"use client"` barrel would make `Model.*` a boundary that refuses model-instance props.
const bodyFallback = {
  suspense: true,
  loading: () => <div className="min-h-40 w-full animate-pulse rounded-box bg-muted" />,
} as const;

export const ViewModal = lazy(() => import("./ViewModal"), withSuspense);
export const EditModal = lazy(() => import("./EditModal"), withSuspense);
export const View = lazy(() => import("./View"), bodyFallback);
export const SureToRemove = lazy(() => import("./SureToRemove"), withSuspense);
export const Remove = lazy(() => import("./Remove"), withSuspense);
export const NewWrapper = lazy(() => import("./NewWrapper"), withSuspense);
export const EditWrapper = lazy(() => import("./EditWrapper"), withSuspense);
export const RemoveWrapper = lazy(() => import("./RemoveWrapper"), withSuspense);
export const LoadInit = lazy(() => import("./LoadStore").then((m) => m.LoadInit), withSuspense);
export const LoadView = lazy(() => import("./LoadStore").then((m) => m.LoadView), withSuspense);
export const ViewWrapper = lazy(() => import("./ViewWrapper"), withSuspense);
export const ViewEditModal = lazy(() => import("./ViewEditModal"), withSuspense);
export const Edit = lazy(() => import("./Edit"), withSuspense);
export const New = lazy(() => import("./New"), withSuspense);
export const AdminPanel = lazy(() => import("./AdminPanel"), bodyFallback);
