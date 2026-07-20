"use client";

import { Search, X } from "lucide-react";
import {
  FILTER_ELEMENTS,
  FILTER_WORKS,
  usePalFilterStore,
  type FilterElement,
  type FilterWork,
} from "@/lib/pal-filter-store";
import { useLocaleStore } from "@/lib/i18n/store";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
        "touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-border bg-bg-surface text-text-secondary hover:border-border-hover hover:text-text-primary",
        className,
      )}
    >
      {children}
    </button>
  );
}

interface PalFilterProps {
  resultCount: number;
  className?: string;
}

export function PalFilter({
  resultCount,
  className,
}: PalFilterProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const query = usePalFilterStore((state) => state.query);
  const elements = usePalFilterStore((state) => state.elements);
  const works = usePalFilterStore((state) => state.works);
  const setQuery = usePalFilterStore((state) => state.setQuery);
  const toggleElement = usePalFilterStore((state) => state.toggleElement);
  const toggleWork = usePalFilterStore((state) => state.toggleWork);
  const clearFilters = usePalFilterStore((state) => state.clearFilters);
  const hasActive = usePalFilterStore(
    (state) =>
      state.query.trim().length > 0 ||
      state.elements.length > 0 ||
      state.works.length > 0,
  );

  return (
    <section
      className={cn("flex flex-col gap-4", className)}
      aria-label={translate("list.searchLabel")}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={translate("list.searchPlaceholder")}
          aria-label={translate("list.searchLabel")}
          className={cn(
            "w-full rounded-xl border border-border bg-bg-surface py-2.5 pl-10 pr-10",
            "text-sm text-text-primary placeholder:text-text-tertiary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          )}
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            aria-label={translate("home.clearSearch")}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {translate("list.elements")}
        </p>
        <div className="flex flex-wrap gap-2">
          {FILTER_ELEMENTS.map((element) => (
            <Chip
              key={element}
              active={elements.includes(element)}
              onClick={() => toggleElement(element as FilterElement)}
            >
              {translate(`element.${element}` as MessageKey)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {translate("list.works")}
        </p>
        <div className="flex flex-wrap gap-2">
          {FILTER_WORKS.map((work) => (
            <Chip
              key={work}
              active={works.includes(work)}
              onClick={() => toggleWork(work as FilterWork)}
            >
              {translate(`work.${work}` as MessageKey)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className="text-sm text-text-secondary tabular-nums"
          data-testid="pal-result-count"
        >
          {translate("list.resultCount", { n: resultCount })}
        </p>
        {hasActive ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-accent hover:text-accent-hover"
            data-testid="pal-clear-filters"
          >
            {translate("list.clearFilters")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
