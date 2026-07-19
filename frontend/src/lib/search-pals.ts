export interface PalName {
  id: string;
  name: string;
  name_cn: string;
  aliases?: string[];
}

export interface PalSearchResult extends PalName {
  label: string;
  isSuggestion?: boolean;
  elements?: string[];
  rarity?: number;
}

const MIN_QUERY_LENGTH = 1;
const MAX_EDIT_DISTANCE = 2;

const CJK_PATTERN = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
const QUESTION_PATTERN =
  /怎么|如何|什么|哪些|哪|吗|呢|？|\?|\bhow\b|\bwhat\b|\bwhy\b|\bwhich\b/i;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function containsCjk(value: string): boolean {
  return CJK_PATTERN.test(value);
}

export function getMinQueryLength(_query?: string): number {
  return MIN_QUERY_LENGTH;
}

export function isChatIntent(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (trimmed.length > 8) {
    return true;
  }
  return QUESTION_PATTERN.test(trimmed);
}

export function formatPalLabel(pal: PalName): string {
  if (pal.name_cn && pal.name_cn !== pal.name) {
    return `${pal.name} · ${pal.name_cn}`;
  }
  return pal.name;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }

  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0),
  );

  for (let i = 0; i < rows; i += 1) {
    matrix[i]![0] = i;
  }
  for (let j = 0; j < cols; j += 1) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      );
    }
  }

  return matrix[a.length]![b.length]!;
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

function hasPrefixMatch(pal: PalName, normalized: string): boolean {
  const fields = [
    normalize(pal.name),
    normalize(pal.name_cn),
    ...(pal.aliases ?? []).map(normalize),
  ];
  return fields.some((field) => field.startsWith(normalized));
}

function suggestByEditDistance(
  pals: PalName[],
  normalized: string,
): PalSearchResult[] {
  let best: PalName | null = null;
  let bestDist = Infinity;

  for (const pal of pals) {
    const candidates = [
      normalize(pal.name),
      normalize(pal.name_cn),
      ...(pal.aliases ?? []).map(normalize),
    ];
    for (const candidate of candidates) {
      if (Math.abs(candidate.length - normalized.length) > MAX_EDIT_DISTANCE) {
        continue;
      }
      const dist = levenshtein(normalized, candidate);
      if (dist < bestDist && dist <= MAX_EDIT_DISTANCE) {
        bestDist = dist;
        best = pal;
      }
    }
  }

  if (!best) {
    return [];
  }

  return [
    {
      ...best,
      label: formatPalLabel(best),
      isSuggestion: true,
    },
  ];
}

export function searchPals(pals: PalName[], query: string, limit = 12): PalSearchResult[] {
  const normalized = normalize(query);
  if (normalized.length < getMinQueryLength(query)) {
    return [];
  }

  const prefixHits: Array<{ pal: PalName; score: number }> = [];
  const otherHits: Array<{ pal: PalName; score: number }> = [];

  for (const pal of pals) {
    const score = scorePal(pal, normalized);
    if (score <= 0) {
      continue;
    }
    if (hasPrefixMatch(pal, normalized)) {
      prefixHits.push({ pal, score });
    } else {
      otherHits.push({ pal, score });
    }
  }

  const ranked = (prefixHits.length > 0 ? prefixHits : otherHits)
    .sort((a, b) => b.score - a.score || a.pal.name.localeCompare(b.pal.name))
    .slice(0, limit)
    .map(({ pal }) => ({
      ...pal,
      label: formatPalLabel(pal),
    }));

  if (ranked.length > 0) {
    return ranked;
  }

  return suggestByEditDistance(pals, normalized);
}
