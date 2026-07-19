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
}

export function PalCardGrid({
  pals,
  className,
  onClearFilters,
}: PalCardGridProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);

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
            key={pal.deck_id}
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
