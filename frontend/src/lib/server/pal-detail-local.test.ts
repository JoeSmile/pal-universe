import { describe, expect, it } from "vitest";
import {
  getLocalPalDetail,
  getLocalPalLocationSummary,
} from "@/lib/server/pal-detail-local";

describe("local pal detail (server)", () => {
  it("loads Anubis from pals.json", () => {
    const pal = getLocalPalDetail("Anubis");
    expect(pal?.name).toBe("Anubis");
    expect(pal?.deck_id).toBe("139");
    expect(pal?.stats.hp).toBeGreaterThan(0);
  });

  it("loads summarized Anubis location from pal-locations.json", () => {
    const loc = getLocalPalLocationSummary("Anubis");
    expect(loc?.spawn_count).toBe(36);
    expect(loc?.region).toBe("palpagos");
    expect(loc).not.toHaveProperty("spots");
  });

  it("resolves location with case-insensitive name", () => {
    const loc = getLocalPalLocationSummary("anubis");
    expect(loc?.spawn_count).toBe(36);
    expect(loc?.region).toBe("palpagos");
  });
});
