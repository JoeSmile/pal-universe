import { apiUrl } from "@/lib/api/config";
import { PalApiError } from "@/lib/api/pals";
import {
  mapRawPalToDetail,
  summarizeLocation,
  type PalDetailData,
  type PalLocationInfo,
} from "@/lib/api/pal-detail-mapper";

export type {
  PalActiveSkill,
  PalDetailData,
  PalDrop,
  PalLocationInfo,
  PalLocationSpot,
  PalPartnerSkill,
} from "@/lib/api/pal-detail-mapper";

export { mapRawPalToDetail, summarizeLocation } from "@/lib/api/pal-detail-mapper";

function localDetailUrl(name: string): string {
  return `/api/pals/${encodeURIComponent(name)}`;
}

function localLocationsUrl(name: string): string {
  return `/api/pals/${encodeURIComponent(name)}/locations`;
}

async function readJsonPayload<T>(res: Response): Promise<T> {
  return (await res.json().catch(() => ({}))) as T;
}

/** GET backend, then same-origin Route Handler fallback. */
export async function fetchPalDetail(
  name: string,
  init?: RequestInit,
): Promise<PalDetailData> {
  const headers = { Accept: "application/json", ...init?.headers };

  try {
    const res = await fetch(apiUrl(`/api/v1/pals/${encodeURIComponent(name)}`), {
      ...init,
      headers,
    });
    const payload = await readJsonPayload<{
      data?: Record<string, unknown>;
      detail?: { code?: string; message?: string };
      error?: { code?: string; message?: string };
    }>(res);

    if (res.ok) {
      const mapped = mapRawPalToDetail(payload.data ?? {});
      if (!mapped.location) {
        mapped.location = await fetchPalLocations(name, init);
      }
      return mapped;
    }

    if (res.status !== 404 && res.status < 500) {
      const detail = payload.detail ?? payload.error;
      throw new PalApiError(
        detail?.message || `Pal detail failed (${res.status})`,
        res.status,
        detail?.code,
      );
    }
  } catch (err) {
    if (err instanceof PalApiError && err.status !== 404 && err.status < 500) {
      throw err;
    }
  }

  const localRes = await fetch(localDetailUrl(name), { ...init, headers });
  const localPayload = await readJsonPayload<{
    data?: PalDetailData;
    detail?: { code?: string; message?: string };
    error?: { code?: string; message?: string };
  }>(localRes);

  if (!localRes.ok) {
    const detail = localPayload.detail ?? localPayload.error;
    throw new PalApiError(
      detail?.message || `Pal detail failed (${localRes.status})`,
      localRes.status,
      detail?.code,
    );
  }

  return localPayload.data as PalDetailData;
}

/** GET backend locations, then same-origin Route Handler fallback. */
export async function fetchPalLocations(
  name: string,
  init?: RequestInit,
): Promise<PalLocationInfo | null> {
  const headers = { Accept: "application/json", ...init?.headers };

  try {
    const res = await fetch(
      apiUrl(`/api/v1/pals/${encodeURIComponent(name)}/locations`),
      { ...init, headers },
    );

    if (res.ok) {
      const payload = await readJsonPayload<{ data?: PalLocationInfo }>(res);
      return summarizeLocation(payload.data) ?? null;
    }
  } catch {
    // fall through to local route
  }

  const localRes = await fetch(localLocationsUrl(name), { ...init, headers });
  if (!localRes.ok) return null;

  const payload = await readJsonPayload<{ data?: PalLocationInfo }>(localRes);
  return summarizeLocation(payload.data) ?? null;
}
