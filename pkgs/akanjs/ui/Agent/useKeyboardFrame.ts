"use client";
import { type CSSProperties, useEffect, useState } from "react";

// Only `visualViewport` reports the on-screen keyboard: `dvh` tracks the browser's own chrome, not the keyboard.
// iOS pans the visual viewport up to the focused field instead of shrinking the page, so a padding inset alone leaves
// a full-screen panel's header panned off the top; below `sm` the panel is pinned to the visible rectangle instead.
export const useKeyboardFrame = () => {
  const [frame, setFrame] = useState<CSSProperties>();
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const fullScreen = window.matchMedia("(width < 40rem)");
    const apply = (next?: CSSProperties) =>
      setFrame((prev) =>
        prev?.top === next?.top && prev?.height === next?.height && prev?.paddingBottom === next?.paddingBottom
          ? prev
          : next,
      );
    const measure = () => {
      // A pinch zoom shrinks the visual viewport too, and chasing it would drag the panel around under the fingers.
      if (viewport.height >= window.innerHeight || viewport.scale > 1.01) apply(undefined);
      else if (fullScreen.matches) apply({ top: viewport.offsetTop, bottom: "auto", height: viewport.height });
      else {
        const inset = window.innerHeight - viewport.height - viewport.offsetTop;
        apply(inset > 0 ? { paddingBottom: inset } : undefined);
      }
    };
    measure();
    viewport.addEventListener("resize", measure);
    viewport.addEventListener("scroll", measure);
    return () => {
      viewport.removeEventListener("resize", measure);
      viewport.removeEventListener("scroll", measure);
    };
  }, []);
  return frame;
};
