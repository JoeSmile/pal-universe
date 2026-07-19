export interface PalName {
  id: string;
  name: string;
  name_cn: string;
  aliases?: string[];
}

export interface PalSearchResult extends PalName {
  label: string;
}

const MIN_QUERY_LENGTH_ASCII = 2;
const MIN_QUERY_LENGTH_CJK = 1;

const CJK_PATTERN = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function containsCjk(value: string): boolean {
  return CJK_PATTERN.test(value);
}

export function getMinQueryLength(query: string): number {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return MIN_QUERY_LENGTH_ASCII;
  }
  return containsCjk(trimmed) ? MIN_QUERY_LENGTH_CJK : MIN_QUERY_LENGTH_ASCII;
}

export function formatPalLabel(pal: PalName): string {
  if (pal.name_cn && pal.name_cn !== pal.name) {
    return `${pal.name} · ${pal.name_cn}`;
  }
  return pal.name;
}

function scoreField(value: string, normalized: string): number {
  if (value === normalized) {
    return 100;
  }
  if (value.startsWith(normalized)) {
    return 80;
  }
  if (value.includes(normalized)) {
    return 60;
  }
  return 0;
}

function scoreSubsequence(value: string, normalized: string): number {
  if (normalized.length < 2 || !containsCjk(normalized)) {
    return 0;
  }

  let cursor = 0;
  for (const char of normalized) {
    const next = value.indexOf(char, cursor);
    if (next === -1) {
      return 0;
    }
    cursor = next + 1;
  }
  return 40;
}

function scorePal(pal: PalName, normalized: string): number {
  const fields = [
    normalize(pal.name),
    normalize(pal.name_cn),
    ...(pal.aliases ?? []).map(normalize),
  ];

  let best = 0;
  for (const field of fields) {
    best = Math.max(best, scoreField(field, normalized), scoreSubsequence(field, normalized));
  }
  return best;
}

export function searchPals(pals: PalName[], query: string, limit = 12): PalSearchResult[] {
  const normalized = normalize(query);
  if (normalized.length < getMinQueryLength(query)) {
    return [];
  }

  const scored: Array<{ pal: PalName; score: number }> = [];

  for (const pal of pals) {
    const score = scorePal(pal, normalized);
    if (score > 0) {
      scored.push({ pal, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.pal.name.localeCompare(b.pal.name))
    .slice(0, limit)
    .map(({ pal }) => ({
      ...pal,
      label: formatPalLabel(pal),
    }));
}
