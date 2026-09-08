"use client";
import { useEffect, useRef, useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";

export interface InfiniteScrollProps {
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  children: React.ReactNode;
  reverse?: boolean;
}

export const InfiniteScroll = ({ hasMore, onLoadMore, children, reverse }: InfiniteScrollProps) => {
  const [isFetching, setIsFetching] = useState(false);
  const isFetchingRef = useRef(false);
  const target = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) void fetchMoreItems();
    });
    if (target.current) observer.observe(target.current);
    return () => {
      observer.disconnect();
    };
  }, [hasMore]);

  const fetchMoreItems = async () => {
    if (isFetchingRef.current) return;

    // Prepending rows above the viewport pushes everything down by however tall they turn out to be, so the
    // offset from the bottom is what has to survive the load — the reading position, in a chat or a log tail.
    const scroller = reverse ? document.scrollingElement : null;
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
