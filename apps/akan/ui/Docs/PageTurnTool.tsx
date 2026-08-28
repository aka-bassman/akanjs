"use client";
import { st } from "@apps/akan/client";
import { router } from "akanjs/client";

interface DocsPage {
  name: string;
  href: string;
}
interface PageTurnToolProps {
  prev: DocsPage | null;
  next: DocsPage | null;
}

/** Tool declarations are mount-static, so both stay published at either end of the reading order; the guard answers there instead. */
export const PageTurnTool = ({ prev, next }: PageTurnToolProps) => {
  st.expose(
    "docsReadingOrder",
    { prev, next },
    {
      desc: "The neighboring pages in the docs reading order.",
      serialize: () => ({
        prev: prev ? `${prev.name} (${prev.href})` : null,
        next: next ? `${next.name} (${next.href})` : null,
      }),
    },
  );
  const openPage = (page: DocsPage | null) => {
    if (!page) return;
    router.push(page.href, { scrollToTop: true });
    return `Opening ${page.name} (${page.href}).`;
  };
  st.tool("openPrevDocsPage", {
    desc: "Open the previous page in the docs reading order.",
    effect: "state",
    guard: () => (prev ? true : "Already at the first page of the docs."),
  }).exec(() => openPage(prev));
  st.tool("openNextDocsPage", {
    desc: "Open the next page in the docs reading order.",
    effect: "state",
    guard: () => (next ? true : "Already at the last page of the docs."),
  }).exec(() => openPage(next));
  return null;
};
