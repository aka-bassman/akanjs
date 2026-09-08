"use client";
import { useEffect, useRef, useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";

export interface InfiniteScrollProps {
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  children: React.ReactNode;
  /**
   * Load earlier rows above the ones in hand, preserving the reading position across the prepend. Assumes
   * normal column flow. It does not scroll anywhere at mount, so a list meant to open at its newest row scrolls
   * itself — and until it does, the sentinel is on screen and loads one window unasked.
   */
  reverse?: boolean;
}

let warnedColumnReverse = false;

/**
 * The sentinel is positioned by DOM order alone — first child to load earlier, last child to load more — so a
 * `column-reverse` parent paints it at the opposite end from the rows it controls, and `scrollTop: 0` is then
 * that same end, so it also fires at mount. `flex-col-reverse` is the usual no-JS way to pin a chat to the
 * bottom, so a caller reaching for `reverse` may well already have it; the result reads as a control placed
 * wrongly rather than as an error, which is why it is worth saying out loud once.
 */
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
