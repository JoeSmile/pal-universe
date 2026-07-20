"use client";

import { useEffect, useMemo } from "react";
import { PalCardGrid } from "@/components/pal-card-grid";
import { PalFilter } from "@/components/pal-filter";
import { SiteHeader } from "@/components/site-header";
import { getPalCatalog } from "@/lib/pal-catalog";
import { filterPals, usePalFilterStore } from "@/lib/pal-filter-store";
import { useLocaleStore } from "@/lib/i18n/store";

const catalog = getPalCatalog();

export function PalsPageClient(): React.ReactElement {
  const locale = useLocaleStore((state) => state.locale);
  const translate = useLocaleStore((state) => state.t);
  const query = usePalFilterStore((state) => state.query);
  const elements = usePalFilterStore((state) => state.elements);
  const works = usePalFilterStore((state) => state.works);
  const clearFilters = usePalFilterStore((state) => state.clearFilters);

  // Don't leak list filters into the next visit.
  useEffect(() => {
    return () => {
      usePalFilterStore.getState().clearFilters();
    };
  }, []);

  const filtered = useMemo(
    () => filterPals(catalog, { query, elements, works, locale }),
    [query, elements, works, locale],
  );

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {translate("list.title")}
          </h1>
        </header>

        <PalFilter resultCount={filtered.length} />

        <PalCardGrid pals={filtered} onClearFilters={clearFilters} />
      </main>
    </div>
  );
}
