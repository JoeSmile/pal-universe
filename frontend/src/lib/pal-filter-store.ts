"use client";

import { create } from "zustand";
import type { Locale } from "@/lib/i18n/locale";
import type { PalCardData } from "@/lib/pal-types";
import { formatPalLabel } from "@/lib/search-pals";

/** Nine combat elements (PRD-001). */
export const FILTER_ELEMENTS = [
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Ice",
  "Ground",
  "Dark",
  "Dragon",
  "Neutral",
] as const;

/**
 * Twelve work filters (AC). Maps to keys present in pals.json work_orders.
 * Official production suits + fighter / fishing for coverage.
 */
export const FILTER_WORKS = [
  "kindling",
  "watering",
  "electricity",
  "mining",
  "lumbering",
  "cooling",
  "medicine",
  "transport",
  "farming",
  "base_worker",
  "fishing",
  "fighter",
] as const;

export type FilterElement = (typeof FILTER_ELEMENTS)[number];
export type FilterWork = (typeof FILTER_WORKS)[number];

interface PalFilterState {
  query: string;
  elements: FilterElement[];
  works: FilterWork[];
  setQuery: (query: string) => void;
  toggleElement: (element: FilterElement) => void;
  toggleWork: (work: FilterWork) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

export const usePalFilterStore = create<PalFilterState>((set, get) => ({
  query: "",
  elements: [],
  works: [],
  setQuery: (query) => set({ query }),
  toggleElement: (element) =>
    set((state) => ({
      elements: state.elements.includes(element)
        ? state.elements.filter((e) => e !== element)
        : [...state.elements, element],
    })),
  toggleWork: (work) =>
    set((state) => ({
      works: state.works.includes(work)
        ? state.works.filter((w) => w !== work)
        : [...state.works, work],
    })),
  clearFilters: () => set({ query: "", elements: [], works: [] }),
  hasActiveFilters: () => {
    const { query, elements, works } = get();
    return query.trim().length > 0 || elements.length > 0 || works.length > 0;
  },
}));

export function filterPals(
  pals: PalCardData[],
  opts: {
    query: string;
    elements: FilterElement[];
    works: FilterWork[];
    locale: Locale;
  },
): PalCardData[] {
  const q = opts.query.trim().toLowerCase();

  return pals.filter((pal) => {
    if (q) {
      const label = formatPalLabel(pal, opts.locale).toLowerCase();
      const hay = `${pal.name} ${pal.nameZh} ${label}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (opts.elements.length > 0) {
      const ok = opts.elements.some((el) => pal.elements.includes(el));
      if (!ok) return false;
    }

    if (opts.works.length > 0) {
      const skills = new Set(pal.workOrders.map((w) => w.skill));
      const ok = opts.works.some((work) => skills.has(work));
      if (!ok) return false;
    }

    return true;
  });
}
