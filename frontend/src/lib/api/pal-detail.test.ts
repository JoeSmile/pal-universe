import { describe, expect, it } from "vitest";
import {
  getLocalPalDetail,
  getLocalPalLocation,
  mapRawPalToDetail,
} from "@/lib/api/pal-detail";

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
      { skill: "mining", level: 1 },
      { skill: "transport", level: 2 },
    ]);
    expect(pal.drops[0]).toEqual({ name: "Bone", chance: null, use: "" });
    expect(pal.drops[1]?.chance).toBe(100);
    expect(pal.partner_skill?.name).toBe("Guardian");
    expect(pal.breeding_rank).toBe(480);
  });
});

describe("local fallbacks", () => {
  it("loads Anubis from pals.json", () => {
    const pal = getLocalPalDetail("Anubis");
    expect(pal?.name).toBe("Anubis");
    expect(pal?.deck_id).toBe("139");
    expect(pal?.stats.hp).toBeGreaterThan(0);
  });

  it("loads Anubis location from pal-locations.json", () => {
    const loc = getLocalPalLocation("Anubis");
    expect(loc?.spawn_count).toBe(36);
    expect(loc?.region).toBe("palpagos");
  });
});
