export interface PalName {
  id: string;
  name: string;
  name_cn: string;
  aliases?: string[];
}

export interface PalSearchResult extends PalName {
  label: string;
}

const MIN_QUERY_LENGTH = 2;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function formatPalLabel(pal: PalName): string {
  if (pal.name_cn && pal.name_cn !== pal.name) {
    return `${pal.name} · ${pal.name_cn}`;
  }
  return pal.name;
}

export function searchPals(pals: PalName[], query: string, limit = 12): PalSearchResult[] {
  const normalized = normalize(query);
  if (normalized.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const scored: Array<{ pal: PalName; score: number }> = [];

  for (const pal of pals) {
    const name = normalize(pal.name);
    const nameCn = normalize(pal.name_cn);
    const aliases = (pal.aliases ?? []).map(normalize);

    let score = 0;
    if (name === normalized || nameCn === normalized || aliases.includes(normalized)) {
      score = 100;
    } else if (
      name.startsWith(normalized) ||
      nameCn.startsWith(normalized) ||
      aliases.some((alias) => alias.startsWith(normalized))
    ) {
      score = 80;
    } else if (
      name.includes(normalized) ||
      nameCn.includes(normalized) ||
      aliases.some((alias) => alias.includes(normalized))
    ) {
      score = 60;
    }

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

export { MIN_QUERY_LENGTH };
