import palsJson from "@/data/pals.json";
import palNames from "@/data/pal-names.json";
import {
  normalizeWorkOrders,
  type PalCardData,
  type PalStats,
} from "@/lib/pal-types";

type RawPal = {
  name: string;
  elements: string[];
  deck_id: string;
  rarity: number;
  size: string;
  stats: PalStats;
  work_orders: Array<string | { skill: string; level: number }>;
};

type PalNameRecord = {
  name: string;
  name_cn: string;
};

const nameCnByName = new Map(
  (palNames as PalNameRecord[]).map((pal) => [pal.name, pal.name_cn]),
);

/** Full catalog mapped to PalCardData for list/detail UIs. */
export function getPalCatalog(): PalCardData[] {
  return (palsJson as RawPal[])
    .map((pal) => ({
      name: pal.name,
      name_cn: nameCnByName.get(pal.name) ?? pal.name,
      elements: pal.elements,
      deck_id: pal.deck_id,
      rarity: pal.rarity,
      size: pal.size,
      stats: pal.stats,
      work_orders: normalizeWorkOrders(pal.work_orders),
    }))
    .sort(
      (a, b) =>
        Number(a.deck_id) - Number(b.deck_id) || a.name.localeCompare(b.name),
    );
}
