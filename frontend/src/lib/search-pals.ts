import type { Locale } from "@/lib/i18n/locale";

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

/** Latin pal names / variants: Anubis, Cattiva Noct, Bellanoir Libero */
const LATIN_PAL_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9]*(?:[ '-][A-Za-z0-9]+)*$/;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Strip # / No. prefixes so "101", "#101", "no.101" share one form. */
function normalizeIdQuery(value: string): string {
  return normalize(value).replace(/^(?:no\.?|#)\s*/i, "");
}

function containsCjk(value: string): boolean {
  return CJK_PATTERN.test(value);
}

function isNumericIdQuery(value: string): boolean {
  return /^\d+[a-z]?$/i.test(normalizeIdQuery(value));
}

export function getMinQueryLength(query?: string): number {
  void query;
  return MIN_QUERY_LENGTH;
}

export function isChatIntent(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return false;
  }

  if (QUESTION_PATTERN.test(trimmed)) {
    return true;
  }

  // Deck ids stay on local search ("101", "#96B")
  if (isNumericIdQuery(trimmed)) {
    return false;
  }

  // Long English pal names must stay on local search (Bellanoir, Frostallion, …)
  if (LATIN_PAL_NAME_PATTERN.test(trimmed)) {
    return false;
  }

  // Long Chinese / mixed prose without question words still goes to chat
  return trimmed.length > 8;
}

/** Display exactly one language for a pal name — never bilingual. */
export function formatPalLabel(pal: PalName, locale: Locale = "en"): string {
  if (locale === "zh") {
    return pal.name_cn || pal.name;
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

  return matrix[a.length]![cols - 1]!;
}

function scoreField(value: string, normalized: string): number {
  if (!value || !normalized) {
    return 0;
  }
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

/** Score deck id matches — exact > prefix > contains. */
function scoreId(id: string, query: string): number {
  const needle = normalizeIdQuery(query);
  const hay = normalize(id);
  if (!needle || !hay) {
    return 0;
  }
  if (hay === needle) {
    return 110;
  }
  if (hay.startsWith(needle)) {
    return 90;
  }
  if (hay.includes(needle)) {
    return 70;
  }
  return 0;
}

function scoreSubsequence(value: string, normalized: string): number {
  // Allow single CJK char (e.g. "疾" → 疾旋鼬)
  if (!normalized || !containsCjk(normalized)) {
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
  return normalized.length === 1 ? 55 : 40;
}

/** Extra CJK fuzzy: every query char appears somewhere (order-free), soft score. */
function scoreCjkChars(value: string, normalized: string): number {
  if (!containsCjk(normalized) || normalized.length < 2) {
    return 0;
  }
  let hit = 0;
  for (const char of normalized) {
    if (value.includes(char)) {
      hit += 1;
    }
  }
  if (hit === 0) {
    return 0;
  }
  if (hit === normalized.length) {
    return 35;
  }
  // Partial char overlap for 2+ char queries (typo / missing char)
  if (hit / normalized.length >= 0.5) {
    return 20;
  }
  return 0;
}

function scorePal(pal: PalName, normalized: string, rawQuery: string): number {
  const fields = [
    normalize(pal.name),
    normalize(pal.name_cn),
    ...(pal.aliases ?? []).map(normalize),
  ];

  let best = scoreId(pal.id, rawQuery);
  for (const field of fields) {
    best = Math.max(
      best,
      scoreField(field, normalized),
      scoreSubsequence(field, normalized),
      scoreCjkChars(field, normalized),
    );
  }
  return best;
}

function suggestByEditDistance(
  pals: PalName[],
  normalized: string,
  locale: Locale,
): PalSearchResult[] {
  let best: PalName | null = null;
  let bestDist = Infinity;

  for (const pal of pals) {
    const candidates = [
      normalize(pal.name),
      normalize(pal.name_cn),
      normalize(pal.id),
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
      label: formatPalLabel(best, locale),
      isSuggestion: true,
    },
  ];
}

export function searchPals(
  pals: PalName[],
  query: string,
  limit = 12,
  locale: Locale = "en",
): PalSearchResult[] {
  const normalized = normalize(query);
  if (normalized.length < getMinQueryLength(query)) {
    return [];
  }

  const scored: Array<{ pal: PalName; score: number }> = [];

  for (const pal of pals) {
    const score = scorePal(pal, normalized, query);
    if (score > 0) {
      scored.push({ pal, score });
    }
  }

  if (scored.length > 0) {
    return scored
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.pal.id.localeCompare(b.pal.id, undefined, { numeric: true }) ||
          a.pal.name.localeCompare(b.pal.name),
      )
      .slice(0, limit)
      .map(({ pal }) => ({
        ...pal,
        label: formatPalLabel(pal, locale),
      }));
  }

  return suggestByEditDistance(pals, normalizeIdQuery(normalized), locale);
}
