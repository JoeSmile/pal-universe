import {
  type PalStats,
  type PalWorkOrder,
} from "@/lib/pal-types";
import { resolveWorkOrders } from "@/lib/pal-work-orders";

const RARITY_RANK: Record<string, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export interface PalPartnerSkill {
  name: string;
  effect: string;
}

export interface PalActiveSkill {
  name: string;
  element?: string;
  type?: string;
  power?: number;
  cooldown?: number;
  effect?: string;
  description?: string;
}

export interface PalDrop {
  name: string;
  chance?: number | null;
  use?: string;
}

export interface PalLocationSpot {
  x?: number;
  y?: number;
  map_x?: number;
  map_y?: number;
  region?: string;
  level_range?: [number, number] | number[];
}

export interface PalLocationInfo {
  spawn_count?: number;
  region?: string;
  center?: [number, number] | number[];
  bounds?: number[][];
  level_range?: [number, number] | number[];
  spots?: PalLocationSpot[];
}

export interface PalDetailData {
  name: string;
  name_cn: string;
  deck_id: string;
  elements: string[];
  rarity: number;
  rarity_label?: string;
  size: string;
  price: number;
  nocturnal: boolean;
  movement: { walk: number; run: number; sprint: number };
  stats: PalStats;
  work_orders: PalWorkOrder[];
  partner_skill: PalPartnerSkill | null;
  skills: PalActiveSkill[];
  drops: PalDrop[];
  breeding_rank: number | null;
  location: PalLocationInfo | null;
  image: string;
}

function parseRarity(raw: unknown): { value: number; label?: string } {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { value: Math.max(1, Math.min(5, raw)) };
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (/^\d+$/.test(trimmed)) {
      return { value: Math.max(1, Math.min(5, Number(trimmed))) };
    }
    const ranked = RARITY_RANK[trimmed.toLowerCase()];
    if (ranked) return { value: ranked, label: trimmed };
  }
  return { value: 1 };
}

function parseBreedingRank(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function normalizeDrops(raw: unknown): PalDrop[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (typeof entry === "string") {
      return { name: entry, chance: null, use: "" };
    }
    if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      const chanceRaw = obj.chance ?? obj.rate ?? obj.probability;
      const chance =
        typeof chanceRaw === "number"
          ? chanceRaw
          : typeof chanceRaw === "string" && chanceRaw.endsWith("%")
            ? Number(chanceRaw.replace("%", ""))
            : null;
      return {
        name: String(obj.name ?? obj.item ?? "Unknown"),
        chance: Number.isFinite(chance) ? Number(chance) : null,
        use: String(obj.use ?? obj.usage ?? obj.purpose ?? ""),
      };
    }
    return { name: String(entry), chance: null, use: "" };
  });
}

function normalizeSkills(raw: unknown): PalActiveSkill[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const obj = (entry ?? {}) as Record<string, unknown>;
    return {
      name: String(obj.name ?? obj.skill ?? "Unknown"),
      element: obj.element ? String(obj.element) : obj.type ? String(obj.type) : undefined,
      type: obj.type ? String(obj.type) : undefined,
      power: typeof obj.power === "number" ? obj.power : undefined,
      cooldown: typeof obj.cooldown === "number" ? obj.cooldown : undefined,
      effect: obj.effect ? String(obj.effect) : obj.description ? String(obj.description) : undefined,
      description: obj.description ? String(obj.description) : undefined,
    };
  });
}

function normalizePartner(raw: unknown): PalPartnerSkill | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const name = String(obj.name ?? "").trim();
  if (!name) return null;
  return {
    name,
    effect: String(obj.effect ?? obj.description ?? ""),
  };
}

export function normalizeLocation(raw: unknown): PalLocationInfo | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as PalLocationInfo;
}

/** Keep only fields rendered on the detail page — omit heavy spot arrays. */
export function summarizeLocation(raw: unknown): PalLocationInfo | null {
  const loc = normalizeLocation(raw);
  if (!loc) return null;
  return {
    spawn_count: loc.spawn_count,
    region: loc.region,
    center: loc.center,
    level_range: loc.level_range,
  };
}

export function mapRawPalToDetail(
  raw: Record<string, unknown>,
  nameCnByName?: Map<string, string>,
): PalDetailData {
  const name = String(raw.name ?? "");
  const rarity = parseRarity(raw.rarity);
  const statsObj =
    raw.stats && typeof raw.stats === "object"
      ? (raw.stats as Record<string, unknown>)
      : {};

  const workSource =
    (Array.isArray(raw.work_orders) && raw.work_orders) ||
    (Array.isArray(raw.role_tags) && raw.role_tags) ||
    [];

  const dropsSource = raw.drops ?? raw.notable_drops ?? [];
  const skillsSource = raw.skills ?? raw.active_skills ?? [];

  const movementRaw =
    raw.movement && typeof raw.movement === "object"
      ? (raw.movement as Record<string, unknown>)
      : {};

  const nameCn =
    (typeof raw.name_cn === "string" &&
    raw.name_cn &&
    raw.name_cn !== name
      ? raw.name_cn
      : nameCnByName?.get(name)) ?? name;

  const locationRaw = raw.location ?? null;

  return {
    name,
    name_cn: nameCn,
    deck_id: String(raw.deck_id ?? raw.paldeck_number ?? raw.id ?? ""),
    elements: Array.isArray(raw.elements)
      ? raw.elements.map(String)
      : [],
    rarity: rarity.value,
    rarity_label: rarity.label,
    size: String(raw.size ?? ""),
    price: Number(raw.price) || 0,
    nocturnal: Boolean(raw.nocturnal),
    movement: {
      walk: Number(movementRaw.walk) || 0,
      run: Number(movementRaw.run) || 0,
      sprint: Number(movementRaw.sprint) || 0,
    },
    stats: {
      hp: Number(statsObj.hp ?? raw.hp) || 0,
      melee_attack: Number(statsObj.melee_attack ?? raw.melee_attack) || 0,
      shot_attack: Number(statsObj.shot_attack ?? raw.shot_attack) || 0,
      defense: Number(statsObj.defense ?? raw.defense) || 0,
      support: Number(statsObj.support ?? raw.support) || 0,
      stamina: Number(statsObj.stamina ?? raw.stamina) || 0,
    },
    work_orders: resolveWorkOrders(
      name,
      workSource as Array<string | { skill: string; level: number }>,
    ),
    partner_skill: normalizePartner(raw.partner_skill),
    skills: normalizeSkills(skillsSource),
    drops: normalizeDrops(dropsSource),
    breeding_rank: parseBreedingRank(raw.breeding_rank),
    location: summarizeLocation(locationRaw),
    image:
      typeof raw.image === "string" && raw.image
        ? raw.image
        : `/images/pals/${encodeURIComponent(name)}.webp`,
  };
}
