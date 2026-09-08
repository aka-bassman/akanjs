"use client";
import { useEffect, useRef, useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";

export interface InfiniteScrollProps {
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  children: React.ReactNode;
  reverse?: boolean;
}

const scrollableOverflows = new Set(["auto", "scroll", "overlay"]);

/**
 * The element that actually scrolls the sentinel — the document only once no ancestor has taken the job.
 *
 * A chat timeline or a log tail scrolls inside its own `overflow-y-auto` box, and there the document does not
 * move at all, so anchoring `document.scrollingElement` restores a position nothing changed. Resolved per load
 * rather than once, because the box that scrolls is a layout outcome and a caller cannot be asked to name it.
 */
const scrollerOf = (sentinel: Element | null) => {
  if (typeof document === "undefined") return null;
  let el = sentinel?.parentElement ?? null;
  while (el && el !== document.body && el !== document.documentElement) {
    // Overflow alone is not enough: an `auto` box that fits its content scrolls nothing, and the page is what
    // moves instead.
    if (el.scrollHeight > el.clientHeight && scrollableOverflows.has(getComputedStyle(el).overflowY)) return el;
    el = el.parentElement;
  }
  return document.scrollingElement;
};

export const InfiniteScroll = ({ hasMore, onLoadMore, children, reverse }: InfiniteScrollProps) => {
  const [isFetching, setIsFetching] = useState(false);
  const isFetchingRef = useRef(false);
  const target = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scope the trigger to the box that scrolls. Against the implicit viewport root, a sentinel sitting at the
    // top of its own scroll box can be off the page entirely, so whether it ever fires depends on where the
    // container happens to be laid out. Left implicit when the document is the scroller: the viewport root and
    // `document.scrollingElement`'s own box are not quite the same rect, and that case already works.
    //
    // Resolved at install rather than per render, which `scrollerOf` needs an overflowing container for: the
    // sentinel renders only while `hasMore`, and that holds only when a full window came back, so by the time
    // there is anything to observe the container is overflowing. A container tall enough to fit a whole window
    // is the exception and keeps the viewport root for the session, since `hasMore` staying true never re-runs
    // this — the behaviour it had before, and only the trigger; anchoring re-resolves on every load.
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

    // Prepending rows above the viewport pushes everything down by however tall they turn out to be, so the
    // offset from the bottom is what has to survive the load — the reading position, in a chat or a log tail.
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
          {isFetching ? <BiLoaderAlt className="h-10 animate-spin pb-4 text-2xl" /> : null}
        </div>
      ) : null}
      {children}
      {!reverse && hasMore ? (
        <div ref={target} className="flex h-32 w-full justify-center pt-4">
          {isFetching ? <BiLoaderAlt className="animate-spin text-2xl" /> : null}
        </div>
      ) : null}
    </>
  );
};
