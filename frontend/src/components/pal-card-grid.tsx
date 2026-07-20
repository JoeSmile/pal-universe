"use client";

import { LayoutGroup, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PalCard } from "@/components/pal-card";
import type { PalCardData } from "@/lib/pal-types";
import { useLocaleStore } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";

/** Initial viewport batch — keeps mobile paint cheap for ~300 pals. */
export const PAL_GRID_PAGE_SIZE = 36;

interface PalCardGridProps {
  pals: PalCardData[];
  className?: string;
  onClearFilters?: () => void;
  /** Override page size (tests). */
  pageSize?: number;
}

export function PalCardGrid({
  pals,
  className,
  onClearFilters,
  pageSize = PAL_GRID_PAGE_SIZE,
}: PalCardGridProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLLIElement | null>(null);

  // Reset window when the filtered set changes.
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pals, pageSize]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || visibleCount >= pals.length) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((n) => Math.min(n + pageSize, pals.length));
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, pals.length, pageSize]);

  if (pals.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-bg-surface/50 px-6 py-16 text-center",
          className,
        )}
        data-testid="pal-grid-empty"
      >
        <p className="text-text-secondary">{translate("list.empty")}</p>
        {onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-sm text-accent hover:text-accent-hover"
          >
            {translate("list.clearFilters")}
          </button>
        ) : null}
      </div>
    );
  }

  const visible = pals.slice(0, visibleCount);
  const hasMore = visibleCount < pals.length;

  return (
    <LayoutGroup>
      <motion.ul
        layout
        className={cn(
          "grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
          className,
        )}
        data-testid="pal-card-grid"
      >
        {visible.map((pal) => (
          <motion.li
            key={pal.name}
            layout
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="min-w-0 [content-visibility:auto] [contain-intrinsic-size:auto_320px]"
          >
            <PalCard pal={pal} className="max-w-none" />
          </motion.li>
        ))}
        {hasMore ? (
          <li
            ref={sentinelRef}
            className="col-span-full h-4 list-none"
            data-testid="pal-grid-sentinel"
            aria-hidden
          />
        ) : null}
      </motion.ul>
    </LayoutGroup>
  );
}
