"use client";

import { LayoutGroup, motion } from "framer-motion";
import { PalCard } from "@/components/pal-card";
import type { PalCardData } from "@/lib/pal-types";
import { useLocaleStore } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";

interface PalCardGridProps {
  pals: PalCardData[];
  className?: string;
  onClearFilters?: () => void;
  loading?: boolean;
}

export function PalCardGrid({
  pals,
  className,
  onClearFilters,
  loading = false,
}: PalCardGridProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);

  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
          className,
        )}
        data-testid="pal-card-grid-loading"
        aria-busy
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-2xl bg-bg-elevated"
          />
        ))}
      </div>
    );
  }

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
            className={cn(
              "cursor-pointer text-sm text-accent underline-offset-4",
              "transition-[color,opacity,transform] duration-[var(--duration-fast)]",
              "hover:text-accent-hover hover:underline active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:rounded-sm",
            )}
          >
            {translate("list.clearFilters")}
          </button>
        ) : null}
      </div>
    );
  }

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
        {pals.map((pal) => (
          <motion.li
            key={pal.name}
            layout
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="min-w-0"
          >
            <PalCard pal={pal} className="max-w-none" />
          </motion.li>
        ))}
      </motion.ul>
    </LayoutGroup>
  );
}
