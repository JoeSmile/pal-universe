import { describe, expect, it } from "vitest";
import {
  formatPalLabel,
  getMinQueryLength,
  isChatIntent,
  levenshtein,
  searchPals,
  type PalName,
} from "@/lib/search-pals";

const samplePals: PalName[] = [
  { id: "139", name: "Anubis", name_cn: "阿努比斯", aliases: ["冥王犬"] },
  { id: "2", name: "Cattiva", name_cn: "捣蛋猫" },
  { id: "44", name: "Ribbuny", name_cn: "姬小兔" },
  { id: "1", name: "Lamball", name_cn: "棉悠悠" },
];

describe("getMinQueryLength", () => {
  it("starts local search after 1 character", () => {
    expect(getMinQueryLength("A")).toBe(1);
    expect(getMinQueryLength("猫")).toBe(1);
    expect(getMinQueryLength("")).toBe(1);
  });
});

describe("isChatIntent", () => {
  it("routes short pal names to search", () => {
    expect(isChatIntent("Anubis")).toBe(false);
    expect(isChatIntent("猫")).toBe(false);
  });

  it("keeps long Latin pal names on search, not chat", () => {
    expect(isChatIntent("Bellanoir")).toBe(false);
    expect(isChatIntent("Frostallion")).toBe(false);
    expect(isChatIntent("Cattiva Noct")).toBe(false);
    expect(isChatIntent("Bellanoir Libero")).toBe(false);
  });

  it("routes questions and long non-name prose to chat", () => {
    expect(isChatIntent("怎么打暗系BOSS")).toBe(true);
    expect(isChatIntent("前期抓什么好")).toBe(true);
    expect(isChatIntent("how to beat dark boss")).toBe(true);
    expect(isChatIntent("给我一套火队配法建议")).toBe(true);
    // Pure Latin tokens stay on search path (long pal names); empty hits can still Enter→AI
    expect(isChatIntent("abcdefghij")).toBe(false);
  });
});

describe("levenshtein", () => {
  it("computes edit distance", () => {
    expect(levenshtein("anubis", "anubis")).toBe(0);
    expect(levenshtein("anubis", "anubus")).toBe(1);
    expect(levenshtein("cattiva", "cativa")).toBe(1);
  });
});

describe("searchPals spell correction", () => {
  it("returns prefix matches without marking suggestion", () => {
    const results = searchPals(samplePals, "Anu");
    expect(results[0]?.name).toBe("Anubis");
    expect(results[0]?.isSuggestion).toBeFalsy();
  });

  it("suggests closest pal when no prefix match and distance <= 2", () => {
    const results = searchPals(samplePals, "Anubus");
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Anubis");
    expect(results[0]?.isSuggestion).toBe(true);
  });

  it("returns empty when distance is greater than 2", () => {
    expect(searchPals(samplePals, "zzzzz")).toEqual([]);
  });

  it("matches deck id exactly and by prefix", () => {
    expect(searchPals(samplePals, "139")[0]?.name).toBe("Anubis");
    expect(searchPals(samplePals, "#139")[0]?.name).toBe("Anubis");
    expect(searchPals(samplePals, "13").some((p) => p.name === "Anubis")).toBe(
      true,
    );
  });

  it("matches single CJK character in Chinese names", () => {
    const withJi: PalName[] = [
      ...samplePals,
      { id: "103", name: "Chillet", name_cn: "疾旋鼬" },
      { id: "101", name: "Reindrix", name_cn: "严冬鹿" },
    ];
    const results = searchPals(withJi, "疾", 12, "zh");
    expect(results.map((p) => p.name)).toContain("Chillet");
    expect(results.map((p) => p.name)).not.toContain("Reindrix");
  });
});

describe("formatPalLabel", () => {
  it("shows exactly one language", () => {
    expect(formatPalLabel(samplePals[0]!, "en")).toBe("Anubis");
    expect(formatPalLabel(samplePals[0]!, "zh")).toBe("阿努比斯");
  });
});
