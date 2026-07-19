import palsJson from "@/data/pals.json";
import palNames from "@/data/pal-names.json";
import {
  normalizeWorkOrders,
  type PalCardData,
  type PalRarity,
} from "@/lib/pal-types";

type RawPal = {
  id: number;
  name: string;
  elements: string[];
  rarity: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
  };
  work_orders: string[];
};

const names = palNames as Record<string, string>;

/** Full catalog mapped to PalCardData for list/detail UIs. */
export function getPalCatalog(): PalCardData[] {
  return (palsJson as RawPal[]).map((pal) => ({
    id: String(pal.id),
    name: pal.name,
    nameZh: names[pal.name] ?? pal.name,
    elements: pal.elements,
    rarity: pal.rarity as PalRarity,
    stats: {
      hp: Number(pal.stats.hp),
      attack: Number(pal.stats.attack),
      defense: Number(pal.stats.defense),
    },
    workOrders: normalizeWorkOrders(pal.work_orders),
  }));
}
