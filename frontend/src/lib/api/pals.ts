import { apiUrl } from "@/lib/api/config";
import { normalizeWorkOrders, type PalCardData, type PalStats } from "@/lib/pal-types";
import palNames from "@/data/pal-names.json";

type PalNameRecord = { name: string; name_cn: string };

const nameCnByName = new Map(
  (palNames as PalNameRecord[]).map((pal) => [pal.name, pal.name_cn]),
);

export interface PalSearchParams {
  q?: string;
  types?: string[];
  work?: string[];
  page?: number;
  perPage?: number;
}

export interface PalSearchResponse {
  data: PalCardData[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

type ApiPal = {
  id?: string | number;
  deck_id?: string;
  name: string;
  name_cn?: string;
  elements?: string[];
  rarity?: number | string;
  size?: string;
  stats?: Partial<PalStats> & { attack?: number };
  work_orders?: Array<string | { skill: string; level?: number }>;
  image?: string;
};

type ApiSearchPayload = {
  data?: ApiPal[];
  total?: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
  error?: { code?: string; message?: string };
};

const EMPTY_STATS: PalStats = {
  hp: 0,
  melee_attack: 0,
  shot_attack: 0,
  defense: 0,
  support: 0,
  stamina: 0,
};

export function mapApiPalToCard(pal: ApiPal): PalCardData {
  const stats = pal.stats ?? {};
  const nameCn =
    (pal.name_cn && pal.name_cn !== pal.name
      ? pal.name_cn
      : nameCnByName.get(pal.name)) ?? pal.name;

  return {
    name: pal.name,
    name_cn: nameCn,
    elements: pal.elements ?? [],
    deck_id: String(pal.deck_id ?? pal.id ?? ""),
    rarity: Number(pal.rarity) || 1,
    size: pal.size || "",
    stats: {
      hp: Number(stats.hp) || 0,
      melee_attack: Number(stats.melee_attack ?? stats.attack) || 0,
      shot_attack: Number(stats.shot_attack ?? stats.attack) || 0,
      defense: Number(stats.defense) || 0,
      support: Number(stats.support) || 0,
      stamina: Number(stats.stamina) || 0,
    },
    work_orders: normalizeWorkOrders(
      (pal.work_orders ?? []).map((entry) =>
        typeof entry === "string"
          ? entry
          : { skill: entry.skill, level: entry.level ?? 1 },
      ),
    ),
  };
}

export class PalApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "PalApiError";
  }
}

/** GET /api/v1/pals/search */
export async function searchPalsApi(
  params: PalSearchParams,
  init?: RequestInit,
): Promise<PalSearchResponse> {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.types?.length) {
    search.set("types", params.types.map((t) => t.toLowerCase()).join(","));
  }
  if (params.work?.length) {
    search.set("work", params.work.map((w) => w.toLowerCase()).join(","));
  }
  search.set("page", String(params.page ?? 1));
  search.set("per_page", String(params.perPage ?? 24));

  const res = await fetch(`${apiUrl("/api/v1/pals/search")}?${search}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  const payload = (await res.json().catch(() => ({}))) as ApiSearchPayload;

  if (!res.ok) {
    const detail =
      (payload as { detail?: { code?: string; message?: string } }).detail ??
      payload.error;
    throw new PalApiError(
      detail?.message || `Pal search failed (${res.status})`,
      res.status,
      detail?.code,
    );
  }

  const total = Number(payload.total) || 0;
  const perPage = Number(payload.per_page) || params.perPage || 24;
  const page = Number(payload.page) || params.page || 1;
  const totalPages =
    Number(payload.total_pages) ||
    (total > 0 ? Math.max(1, Math.ceil(total / perPage)) : 0);

  return {
    data: (payload.data ?? []).map(mapApiPalToCard),
    total,
    page,
    per_page: perPage,
    total_pages: totalPages,
    has_next:
      typeof payload.has_next === "boolean"
        ? payload.has_next
        : page < totalPages,
    has_prev:
      typeof payload.has_prev === "boolean" ? payload.has_prev : page > 1,
  };
}

/** Local fallback when API is unavailable. */
export function emptyPalSearch(page = 1, perPage = 24): PalSearchResponse {
  return {
    data: [],
    total: 0,
    page,
    per_page: perPage,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  };
}

export { EMPTY_STATS };
