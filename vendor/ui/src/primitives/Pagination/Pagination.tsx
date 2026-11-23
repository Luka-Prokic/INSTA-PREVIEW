"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Button } from "../Button";
import styles from "./Pagination.module.css";

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  prevLabel?: string;
  nextLabel?: string;
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    page,
    pageCount,
    onPageChange,
    prevLabel = "Previous",
    nextLabel = "Next",
    className,
    ...rest
  },
  ref,
) {
  const safeCount = Math.max(1, pageCount);
  const safePage = Math.min(safeCount, Math.max(1, page));

  return (
    <nav ref={ref} className={cn(styles.nav, className)} aria-label="Pagination" {...rest}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={safePage <= 1}
        onClick={() => onPageChange(safePage - 1)}
      >
        {prevLabel}
      </Button>
      <span className={styles.status} aria-live="polite">
        {safePage} / {safeCount}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={safePage >= safeCount}
        onClick={() => onPageChange(safePage + 1)}
      >
        {nextLabel}
      </Button>
    </nav>
  );
});
