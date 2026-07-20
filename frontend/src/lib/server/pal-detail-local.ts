import palLocations from "@/data/pal-locations.json";
import palNames from "@/data/pal-names.json";
import palsJson from "@/data/pals.json";
import {
  mapRawPalToDetail,
  summarizeLocation,
  type PalDetailData,
  type PalLocationInfo,
} from "@/lib/api/pal-detail-mapper";

type PalNameRecord = { name: string; name_cn: string };

const nameCnByName = new Map(
  (palNames as PalNameRecord[]).map((pal) => [pal.name, pal.name_cn]),
);

type RawLocationMap = Record<string, PalLocationInfo>;

const locationMap = palLocations as RawLocationMap;

/** Local JSON fallback — server / Route Handler only. */
export function getLocalPalDetail(name: string): PalDetailData | null {
  const target = name.trim().toLowerCase();
  const raw = (palsJson as Array<Record<string, unknown>>).find(
    (pal) => String(pal.name).toLowerCase() === target,
  );
  if (!raw) return null;

  const mapped = mapRawPalToDetail(raw, nameCnByName);
  if (!mapped.location) {
    mapped.location = getLocalPalLocationSummary(mapped.name);
  }
  return mapped;
}

function findLocationRaw(name: string): PalLocationInfo | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const exact = locationMap[trimmed];
  if (exact) return exact;

  const target = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(locationMap)) {
    if (key.toLowerCase() === target) return value;
  }
  return null;
}

export function getLocalPalLocationSummary(name: string): PalLocationInfo | null {
  return summarizeLocation(findLocationRaw(name)) ?? null;
}
