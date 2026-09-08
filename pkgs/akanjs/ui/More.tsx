"use client";
import { cn, isMobileDevice } from "akanjs/client";
import { useEffect, useState } from "react";
import { InfiniteScroll } from "./InfiniteScroll";
import { Pagination } from "./Pagination";

interface MoreProps {
  total: number;
  itemsPerPage: number;
  currentPage: number;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onPageSelect: (page: number, option?: { scrollToTop?: boolean }) => void;
  children?: React.ReactNode;
  className?: string;
  reverse?: boolean;
}

export const More = ({
  total,
  itemsPerPage,
  currentPage,
  hasMore,
  onLoadMore,
  onPageSelect,
  children,
  className,
  reverse,
}: MoreProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // The two modes are not two looks on one list: infinite scroll accumulates pages `1..N` while the pager swaps
  // one window, so they read different state and drive different actions.
  if (isMobile)
    return (
      <InfiniteScroll hasMore={hasMore} onLoadMore={onLoadMore} reverse={reverse}>
        {children}
      </InfiniteScroll>
    );

  if (total <= itemsPerPage) return <>{children}</>;

  return (
    <>
      {children}
      <div className={cn("mt-4 flex w-full flex-wrap justify-center", className)}>
        <Pagination currentPage={currentPage} total={total} itemsPerPage={itemsPerPage} onPageSelect={onPageSelect} />
      </div>
    </>
  );
};
