"use client";
import { cn } from "akanjs/client";
import type { ReactNode } from "react";
import { BiChevronLeft, BiChevronRight, BiDotsHorizontalRounded } from "react-icons/bi";

import { buttonRecipe } from "./Button";
import { createOverridable, useUiRecipe } from "./UiOverride";

export interface PaginationProps {
  /** Current 1-based page number. */
  currentPage: number;
  /** Total number of items. */
  total: number;
  /** Called with the selected 1-based page number. */
  onPageSelect: (page: number) => void;
  /** Number of items per page. Used to calculate total pages. */
  itemsPerPage: number;
  /** Placeholder for a pager with no pages. */
  empty?: ReactNode;
  /** @deprecated Renamed to `empty` — it is a node, not a render function. */
  renderEmpty?: ReactNode;
  /** The mark inside the step-back control. The button, its disabled state and its label stay the framework's. */
  prev?: ReactNode;
  /** The mark inside the step-forward control. */
  next?: ReactNode;
  /** The mark standing in for the pages a long pager skips. */
  ellipsis?: ReactNode;
  /** Class overrides for wrapper and page buttons. */
  classNames?: {
    className?: string;
    activePageNumClassName?: string;
    pageNumClassName?: string;
  };
}

export const DefaultPagination = ({
  currentPage,
  total,
  onPageSelect,
  itemsPerPage,
  empty,
  renderEmpty,
  prev,
  next,
  ellipsis,
  classNames,
}: PaginationProps) => {
  const recipe = useUiRecipe("button") ?? buttonRecipe;
  const totalPages = Math.ceil(total / (itemsPerPage || 1));
  const pageNumbers = new Array(totalPages).fill("").map((_, i) => String(i + 1));
  let displayNumbers = pageNumbers;
  if (totalPages > 10) {
    if (currentPage < 5) {
      displayNumbers = pageNumbers.slice(0, 5).concat(["...", String(totalPages)]);
    } else if (currentPage >= 5 && currentPage <= totalPages - 4) {
      displayNumbers = [
        "1",
        "...",
        ...pageNumbers.slice(Number(currentPage) - 3, Number(currentPage) + 2),
        "...",
        String(totalPages),
      ];
    } else {
      displayNumbers = ["1", "...", ...pageNumbers.slice(-5)];
    }
  }

  const emptyNode = empty ?? renderEmpty;
  if (total <= 0) return emptyNode ? <>{emptyNode}</> : null;
  return (
    <div className={cn("flex items-center justify-center gap-1", classNames?.className)}>
      <button
        aria-label="Previous page"
        className={recipe({ variant: "ghost", size: "icon" })}
        disabled={currentPage <= 1}
        onClick={() => {
          onPageSelect(currentPage - 1);
        }}
        type="button"
      >
        {prev ?? <BiChevronLeft />}
      </button>
      {displayNumbers.map((pageNum, index) => {
        if (pageNum === "...")
          return (
            <span className="flex size-9 items-center justify-center text-foreground/30" key={index}>
              {ellipsis ?? <BiDotsHorizontalRounded />}
            </span>
          );
        const isCurrent = Number(pageNum) === currentPage;
        return (
          <button
            aria-current={isCurrent ? "page" : undefined}
            className={
              isCurrent
                ? recipe({ variant: "primary", size: "icon" }, classNames?.activePageNumClassName)
                : recipe({ variant: "ghost", size: "icon" }, ["text-foreground/60", classNames?.pageNumClassName])
            }
            key={index}
            onClick={() => {
              onPageSelect(Number(pageNum));
            }}
            type="button"
          >
            {pageNum}
          </button>
        );
      })}
      <button
        aria-label="Next page"
        className={recipe({ variant: "ghost", size: "icon" })}
        disabled={currentPage >= totalPages}
        onClick={() => {
          onPageSelect(currentPage + 1);
        }}
        type="button"
      >
        {next ?? <BiChevronRight />}
      </button>
    </div>
  );
};

/**
 * Pager. Resolves to a route-scoped override when a `page/**\/_overrides.tsx` in
 * the route's ancestry declares one, otherwise renders {@link DefaultPagination}.
 */
export const Pagination = createOverridable("Pagination", DefaultPagination);
