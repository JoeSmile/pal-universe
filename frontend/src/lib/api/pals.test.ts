import { describe, expect, it } from "vitest";
import { mapApiPalToCard } from "@/lib/api/pals";

describe("mapApiPalToCard", () => {
  it("normalizes string work_orders and missing stats", () => {
    const pal = mapApiPalToCard({
      name: "Anubis",
      name_cn: "阿努比斯",
      deck_id: "139",
      elements: ["Ground"],
      rarity: "4",
      work_orders: ["mining", { skill: "transport", level: 2 }],
    });

    expect(pal.rarity).toBe(4);
    expect(pal.work_orders).toEqual([
      { skill: "mining", level: 1 },
      { skill: "transport", level: 2 },
    ]);
    expect(pal.stats.hp).toBe(0);
  });
});
