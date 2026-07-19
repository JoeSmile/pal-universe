export interface PalStats {
  hp: number;
  melee_attack: number;
  shot_attack: number;
  defense: number;
  support: number;
  stamina: number;
}

export interface PalWorkOrder {
  skill: string;
  level: number;
}

export interface PalCardData {
  name: string;
  name_cn: string;
  elements: string[];
  deck_id: string;
  rarity: number;
  size: string;
  stats: PalStats;
  work_orders: PalWorkOrder[];
}

export type PalElement =
  | "Fire"
  | "Water"
  | "Grass"
  | "Electric"
  | "Ice"
  | "Ground"
  | "Dark"
  | "Dragon"
  | "Neutral";

export function getPalImageUrl(name: string, ext: "webp" | "svg" = "webp"): string {
  return `/images/pals/${encodeURIComponent(name)}.${ext}`;
}

/** Normalize mock JSON work_orders (string[]) into leveled work entries. */
export function normalizeWorkOrders(
  workOrders: Array<string | PalWorkOrder>,
): PalWorkOrder[] {
  return workOrders.map((entry) => {
    if (typeof entry === "string") {
      return { skill: entry, level: 1 };
    }
    return {
      skill: entry.skill,
      level: Math.min(4, Math.max(1, entry.level || 1)),
    };
  });
}
