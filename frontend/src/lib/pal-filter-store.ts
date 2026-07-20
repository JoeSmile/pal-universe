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
 * Twelve work filters (AC). Keys present in pals.json work_orders.
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

export const DEFAULT_PER_PAGE = 24;

export type FilterElement = (typeof FILTER_ELEMENTS)[number];
export type FilterWork = (typeof FILTER_WORKS)[number];

interface PalFilterState {
  query: string;
  elements: FilterElement[];
  works: FilterWork[];
  page: number;
  perPage: number;
  setQuery: (query: string) => void;
  toggleElement: (element: FilterElement) => void;
  toggleWork: (work: FilterWork) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

export const usePalFilterStore = create<PalFilterState>((set, get) => ({
  query: "",
  elements: [],
  works: [],
  page: 1,
  perPage: DEFAULT_PER_PAGE,
  setQuery: (query) => set({ query, page: 1 }),
  toggleElement: (element) =>
    set((state) => ({
      page: 1,
      elements: state.elements.includes(element)
        ? state.elements.filter((e) => e !== element)
        : [...state.elements, element],
    })),
  toggleWork: (work) =>
    set((state) => ({
      page: 1,
      works: state.works.includes(work)
        ? state.works.filter((w) => w !== work)
        : [...state.works, work],
    })),
  setPage: (page) => set({ page: Math.max(1, page) }),
  clearFilters: () =>
    set({ query: "", elements: [], works: [], page: 1 }),
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
      const label = formatPalLabel(
        { id: pal.deck_id, name: pal.name, name_cn: pal.name_cn },
        opts.locale,
      ).toLowerCase();
      const hay = `${pal.name} ${pal.name_cn} ${label}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (opts.elements.length > 0) {
      const ok = opts.elements.some((el) =>
        pal.elements.some((pe) => pe.toLowerCase() === el.toLowerCase()),
      );
      if (!ok) return false;
    }

    if (opts.works.length > 0) {
      const skills = new Set(
        pal.work_orders.map((w) => w.skill.toLowerCase()),
      );
      const ok = opts.works.some((work) => skills.has(work.toLowerCase()));
      if (!ok) return false;
    }

    return true;
  });
}

/** Client-side paginate — used as offline fallback. */
export function paginatePals<T>(
  items: T[],
  page: number,
  perPage: number,
): {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
} {
  const total = items.length;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / perPage)) : 0;
  const safePage = totalPages > 0 ? Math.min(Math.max(1, page), totalPages) : 1;
  const start = (safePage - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    total,
    page: safePage,
    per_page: perPage,
    total_pages: totalPages,
    has_next: safePage < totalPages,
    has_prev: safePage > 1,
  };
}
