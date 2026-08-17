"use client";
import { Loading } from "akanjs/ui";
import { lazy } from "akanjs/webkit";

// Akan rich-text editor (Lexical). `Rich` edits; `RichContent` renders read-only.
//
// `Rich` carries its own Suspense boundary: it only ever mounts on interaction (an edit form opening),
// and the Lexical chunk is large enough that suspending to the route repaints the whole page as its
// loading fallback. The skeleton also holds the editor's height so the form does not collapse first.
//
// `RichContent` deliberately has none — it renders as page body on the *.View detail pages, where a
// boundary would push the content out of the first SSR flush.
export const Rich = lazy(() => import("./Lexical/Editor"), {
  suspense: true,
  loading: () => <Loading.Skeleton className="min-h-40" active />,
});
export const RichContent = lazy(() => import("./Lexical/Content"));
