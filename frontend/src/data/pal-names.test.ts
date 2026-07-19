import { describe, expect, it } from "vitest";
import palNames from "@/data/pal-names.json";
import { searchPals, type PalName } from "@/lib/search-pals";

const pals = palNames as PalName[];

describe("pal-names.json data integrity", () => {
  it("contains the expected pal count", () => {
    expect(pals.length).toBe(299);
  });

  it("gives every pal a non-empty Chinese name different from English", () => {
    const bad = pals.filter(
      (pal) => !pal.name_cn?.trim() || pal.name_cn === pal.name,
    );
    expect(bad).toEqual([]);
  });

  it("does not reuse the same Chinese name across different English pals", () => {
    const byCn = new Map<string, string[]>();
    for (const pal of pals) {
      const list = byCn.get(pal.name_cn) ?? [];
      list.push(pal.name);
      byCn.set(pal.name_cn, list);
    }

    const collisions = [...byCn.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([name_cn, names]) => ({ name_cn, names }));

    expect(collisions).toEqual([]);
  });

  it("keeps Cattiva and Ribbuny Chinese names distinct (palworld.gg)", () => {
    const cattiva = pals.find((pal) => pal.name === "Cattiva");
    const ribbuny = pals.find((pal) => pal.name === "Ribbuny");

    expect(cattiva?.name_cn).toBe("捣蛋猫");
    expect(ribbuny?.name_cn).toBe("姬小兔");
  });

  it("uses palworld.gg Chinese name for Anubis", () => {
    const anubis = pals.find((pal) => pal.name === "Anubis");
    expect(anubis?.name_cn).toBe("阿努比斯");
  });

  it("does not store literal None as paldeck id", () => {
    const badIds = pals.filter((pal) => pal.id === "None");
    expect(badIds).toEqual([]);
  });

  it("finds Cattiva via 捣蛋猫 and not Ribbuny", () => {
    const results = searchPals(pals, "捣蛋猫");
    expect(results.some((pal) => pal.name === "Cattiva")).toBe(true);
    expect(results.some((pal) => pal.name === "Ribbuny")).toBe(false);
  });
});
