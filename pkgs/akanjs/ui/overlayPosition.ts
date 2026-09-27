"use client";
import { clamp } from "akanjs/common";
import { type RefObject, useCallback, useEffect, useLayoutEffect, useState } from "react";

const TRIGGER_GAP = 4;
const VIEWPORT_MARGIN = 8;
const POINTER_INSET = 16;

export interface OverlayPosition {
  top: number;
  left: number;
  above: boolean;
  /** The trigger's centre relative to the panel's left edge, held clear of the panel's rounded corners. */
  anchorOffset: number;
  anchorWidth: number;
}

// Placed here, not by CSS: in its own tree a panel is clipped by every `overflow` ancestor, and `fixed` in place is
// clipped by the modal surface's transform.
export const useOverlayPosition = ({
  opened,
  triggerRef,
  panelRef,
  align,
  gap = TRIGGER_GAP,
}: {
  opened: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  align: "start" | "end";
  gap?: number;
}) => {
  const [position, setPosition] = useState<OverlayPosition | null>(null);

  const measure = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    const panel = panelRef.current;
    if (!trigger || !panel) return;
    const { offsetHeight: height, offsetWidth: width } = panel;
    const spaceBelow = window.innerHeight - trigger.bottom - gap - VIEWPORT_MARGIN;
    const spaceAbove = trigger.top - gap - VIEWPORT_MARGIN;
    const above = spaceBelow < height && spaceAbove > spaceBelow;
    const left = clamp(
      align === "start" ? trigger.left : trigger.right - width,
      VIEWPORT_MARGIN,
      window.innerWidth - VIEWPORT_MARGIN - width,
    );
    const next = {
      top: clamp(
        above ? trigger.top - gap - height : trigger.bottom + gap,
        VIEWPORT_MARGIN,
        window.innerHeight - VIEWPORT_MARGIN - height,
      ),
      left,
      above,
      anchorOffset: clamp((trigger.left + trigger.right) / 2 - left, POINTER_INSET, width - POINTER_INSET),
      anchorWidth: trigger.width,
    };
    // Dropping same-value writes is also what keeps the ResizeObserver below from re-entering.
    setPosition((prev) =>
      prev &&
      prev.top === next.top &&
      prev.left === next.left &&
      prev.above === next.above &&
      prev.anchorOffset === next.anchorOffset &&
      prev.anchorWidth === next.anchorWidth
        ? prev
        : next,
    );
  }, [align, gap, panelRef, triggerRef]);

  useLayoutEffect(() => {
    if (opened) measure();
  }, [opened, measure]);

  useEffect(() => {
    if (!opened) return;
    // Capture phase: the trigger may sit in a scroll container, whose scroll never reaches window by bubbling.
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    // A panel placed above is anchored by its bottom edge, so its top moves whenever it resizes.
    const panel = panelRef.current;
    const observer = panel ? new ResizeObserver(measure) : null;
    if (panel && observer) observer.observe(panel);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [opened, measure, panelRef]);

  return position;
};
