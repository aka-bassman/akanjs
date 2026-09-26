"use client";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";

const pullDownThreshold = 67;
const maxPullDownDistance = 95;

const isScrolledDown = (element: Element | null) => {
  for (let node = element; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    const scrollable =
      overflowY === "auto" || overflowY === "scroll" || (node === document.scrollingElement && overflowY === "visible");
    if (scrollable && node.scrollTop > 0) return true;
  }
  return false;
};

interface RefreshProps {
  children: ReactElement;
  onRefresh: () => Promise<void>;
}

export const Refresh = ({ children, onRefresh }: RefreshProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    let startY: number | null = null;
    let distance = 0;
    const onStart = (event: TouchEvent) => {
      const blocked = isScrolledDown(event.target as Element) || content.getBoundingClientRect().top < 0;
      startY = blocked ? null : (event.touches[0]?.pageY ?? null);
      distance = 0;
    };
    const onMove = (event: TouchEvent) => {
      if (startY === null) return;
      const y = event.touches[0]?.pageY ?? startY;
      if (y < startY) {
        startY = null;
        setPull(0);
        return;
      }
      if (event.cancelable) event.preventDefault();
      distance = Math.min(y - startY, maxPullDownDistance);
      setPull(distance);
    };
    const onEnd = () => {
      const breached = startY !== null && distance >= pullDownThreshold;
      startY = null;
      distance = 0;
      setPull(0);
      if (!breached) return;
      setRefreshing(true);
      void onRefreshRef.current().finally(() => setRefreshing(false));
    };
    //? touchmove must be non-passive: React registers its touch handlers as passive, so preventDefault there cannot stop the page scroll.
    content.addEventListener("touchstart", onStart, { passive: true });
    content.addEventListener("touchmove", onMove, { passive: false });
    content.addEventListener("touchend", onEnd);
    content.addEventListener("touchcancel", onEnd);
    return () => {
      content.removeEventListener("touchstart", onStart);
      content.removeEventListener("touchmove", onMove);
      content.removeEventListener("touchend", onEnd);
      content.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const offset = refreshing ? pullDownThreshold : pull;
  return (
    <div className="relative size-full overflow-hidden">
      {offset > 0 ? (
        <div
          className="fixed left-1/2 flex size-10 -translate-x-1/2 items-center justify-center rounded-full bg-background shadow-sm"
          style={{ opacity: refreshing ? 1 : Math.min(pull / pullDownThreshold, 1) }}
        >
          <BiLoaderAlt className={refreshing ? "animate-spin text-2xl" : "text-2xl"} />
        </div>
      ) : null}
      <div
        ref={contentRef}
        className="size-full overflow-y-auto overflow-x-hidden transition-transform duration-200 ease-out"
        style={offset ? { transform: `translateY(${offset}px)` } : undefined}
      >
        {children}
      </div>
    </div>
  );
};
