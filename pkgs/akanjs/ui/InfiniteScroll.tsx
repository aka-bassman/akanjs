"use client";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";

export interface InfiniteScrollProps {
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  children: React.ReactNode;
  /** Loads earlier rows above, keeping the reading position. It never scrolls at mount, so until the list scrolls
   *  itself to its newest row the sentinel is on screen and loads one window unasked. */
  reverse?: boolean;
  loading?: ReactNode;
}

let warnedColumnReverse = false;

const warnColumnReverse = (sentinel: Element | null) => {
  if (warnedColumnReverse || process.env.AKAN_PUBLIC_ENV !== "local") return;
  const parent = sentinel?.parentElement;
  if (!parent || getComputedStyle(parent).flexDirection !== "column-reverse") return;
  warnedColumnReverse = true;
  console.warn(
    "<InfiniteScroll> sits in a `flex-col-reverse` parent, which paints its load sentinel at the end opposite the rows it loads, and fires it at mount. Drop `flex-col-reverse` and let `reverse` hold the reading position instead.",
  );
};

const scrollableOverflows = new Set(["auto", "scroll", "overlay"]);

// Resolved per call, not once: which box scrolls is a layout outcome the caller cannot name.
const scrollerOf = (sentinel: Element | null) => {
  if (typeof document === "undefined") return null;
  let el = sentinel?.parentElement ?? null;
  while (el && el !== document.body && el !== document.documentElement) {
    // Overflow alone is not enough: an `auto` box that fits its content scrolls nothing.
    if (el.scrollHeight > el.clientHeight && scrollableOverflows.has(getComputedStyle(el).overflowY)) return el;
    el = el.parentElement;
  }
  return document.scrollingElement;
};

export const InfiniteScroll = ({ hasMore, onLoadMore, children, reverse, loading }: InfiniteScrollProps) => {
  const [isFetching, setIsFetching] = useState(false);
  const isFetchingRef = useRef(false);
  const target = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Rooted at the box that scrolls, or a sentinel atop its own scroll box may sit off the page and never fire.
    // Resolved at install: the sentinel renders only while `hasMore`, when the container already overflows.
    warnColumnReverse(target.current);
    const scroller = scrollerOf(target.current);
    const root = scroller && scroller !== document.scrollingElement ? scroller : null;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) void fetchMoreItems();
      },
      { root },
    );
    if (target.current) observer.observe(target.current);
    return () => {
      observer.disconnect();
    };
  }, [hasMore]);

  const fetchMoreItems = async () => {
    if (isFetchingRef.current) return;

    // A prepend pushes everything down, so the offset from the bottom is what has to survive the load.
    const scroller = reverse ? scrollerOf(target.current) : null;
    const prevScrollHeight = scroller?.scrollHeight ?? 0;
    const prevScrollTop = scroller?.scrollTop ?? 0;

    isFetchingRef.current = true;
    setIsFetching(true);
    try {
      await onLoadMore();

      const restoreScroll = () => {
        if (scroller) {
          scroller.scrollTop = prevScrollTop + (scroller.scrollHeight - prevScrollHeight);
        }
        isFetchingRef.current = false;
        setIsFetching(false);
      };

      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(restoreScroll);
      } else {
        restoreScroll();
      }
    } catch (error) {
      isFetchingRef.current = false;
      setIsFetching(false);
      throw error;
    }
  };

  return (
    <>
      {reverse && hasMore ? (
        <div ref={target} className="flex w-full items-end justify-center">
          {isFetching ? (loading ?? <BiLoaderAlt className="h-10 animate-spin pb-4 text-2xl" />) : null}
        </div>
      ) : null}
      {children}
      {!reverse && hasMore ? (
        <div ref={target} className="flex h-32 w-full justify-center pt-4">
          {isFetching ? (loading ?? <BiLoaderAlt className="animate-spin text-2xl" />) : null}
        </div>
      ) : null}
    </>
  );
};
