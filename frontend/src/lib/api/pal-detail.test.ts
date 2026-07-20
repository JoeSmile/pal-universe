import { describe, expect, it } from "vitest";
import { mapRawPalToDetail } from "@/lib/api/pal-detail-mapper";

describe("mapRawPalToDetail", () => {
  it("maps flat API fields and notable_drops", () => {
    const pal = mapRawPalToDetail({
      name: "Anubis",
      name_cn: "阿努比斯",
      deck_id: "139",
      elements: ["Ground"],
      rarity: "Epic",
      hp: 120,
      melee_attack: 130,
      shot_attack: 130,
      defense: 100,
      support: 100,
      stamina: 100,
      size: "M",
      price: 3217,
      nocturnal: false,
      movement: { walk: 80, run: 800, sprint: 1000 },
      role_tags: ["mining", { skill: "transport", level: 2 }],
      partner_skill: { name: "Guardian", effect: "Boost" },
      notable_drops: ["Bone", { name: "Soul", chance: 100 }],
      breeding_rank: 480,
    });

    expect(pal.rarity).toBe(3);
    expect(pal.rarity_label).toBe("Epic");
    expect(pal.stats.hp).toBe(120);
    expect(pal.work_orders).toEqual([
      { skill: "base_worker", level: 6 },
      { skill: "mining", level: 6 },
      { skill: "transport", level: 4 },
    ]);
    expect(pal.drops[0]).toEqual({ name: "Bone", chance: null, use: "" });
    expect(pal.drops[1]?.chance).toBe(100);
    expect(pal.partner_skill?.name).toBe("Guardian");
    expect(pal.breeding_rank).toBe(480);
  });

  it("uses role_tags levels when no overlay exists", () => {
    const pal = mapRawPalToDetail({
      name: "NotARealPalXYZ",
      role_tags: ["mining", { skill: "transport", level: 2 }],
    });
    expect(pal.work_orders).toEqual([
      { skill: "mining", level: 1 },
      { skill: "transport", level: 2 },
    ]);
  });

  it("returns null breeding_rank for invalid values", () => {
    const pal = mapRawPalToDetail({ name: "X", breeding_rank: "n/a" });
    expect(pal.breeding_rank).toBeNull();
  });

  it("summarizes location without spot arrays", () => {
    const pal = mapRawPalToDetail({
      name: "Anubis",
      location: {
        spawn_count: 36,
        region: "palpagos",
        center: [-576.1, -30.5],
        level_range: [55, 72],
        spots: [{ x: 1, y: 2 }],
      },
    });

    expect(pal.location).toEqual({
      spawn_count: 36,
      region: "palpagos",
      center: [-576.1, -30.5],
      level_range: [55, 72],
    });
    expect(pal.location).not.toHaveProperty("spots");
  });
});
