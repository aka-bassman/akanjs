import { LoadingArea, LoadingButton, LoadingInput, LoadingProgressBar, LoadingSkeleton, LoadingSpin } from "./index_";

/**
 * Loading indicators. Each member is an independent override slot (`LoadingSpin`, `LoadingSkeleton`,
 * `LoadingProgressBar`, `LoadingButton`, `LoadingInput`, `LoadingArea`), resolved from the closest
 * `page/**\/_overrides.tsx` in the route's ancestry, otherwise the shipped default.
 */
export const Loading = {
  Area: LoadingArea,
  Button: LoadingButton,
  Input: LoadingInput,
  ProgressBar: LoadingProgressBar,
  Skeleton: LoadingSkeleton,
  Spin: LoadingSpin,
};
