import { describe, expect, it } from "vitest";
import {
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

  it("routes long text and questions to chat", () => {
    expect(isChatIntent("怎么打暗系BOSS")).toBe(true);
    expect(isChatIntent("前期抓什么好")).toBe(true);
    expect(isChatIntent("how to beat dark boss")).toBe(true);
    expect(isChatIntent("abcdefghij")).toBe(true);
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
});
