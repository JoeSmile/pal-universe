import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPalDetail } from "@/lib/api/pal-detail";

const sampleDetail = {
  name: "Anubis",
  name_cn: "Anubis",
  deck_id: "139",
  elements: ["Ground"],
  rarity: 4,
  size: "M",
  price: 3217,
  nocturnal: false,
  movement: { walk: 80, run: 800, sprint: 1000 },
  stats: {
    hp: 120,
    melee_attack: 130,
    shot_attack: 130,
    defense: 100,
    support: 100,
    stamina: 100,
  },
  work_orders: [],
  partner_skill: null,
  skills: [],
  drops: [],
  breeding_rank: 480,
  location: null,
  image: "/images/pals/Anubis.webp",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPalDetail", () => {
  it("falls back to same-origin route when backend is unavailable", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("localhost:8000")) {
        throw new TypeError("Failed to fetch");
      }
      if (url === "/api/pals/Anubis") {
        return new Response(JSON.stringify({ data: sampleDetail }), { status: 200 });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const pal = await fetchPalDetail("Anubis");
    expect(pal.name).toBe("Anubis");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/pals/Anubis"),
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/pals/Anubis", expect.any(Object));
  });
});
