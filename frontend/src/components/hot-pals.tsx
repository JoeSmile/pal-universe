"use client";

import palsData from "@/data/pals.json";
import palNames from "@/data/pal-names.json";
import { formatPalLabel } from "@/lib/search-pals";
import { useLocaleStore } from "@/lib/i18n/store";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

interface HotPal {
  name: string;
  name_cn: string;
  elements: string[];
  rarity: number;
  deck_id: string;
}

interface PalRecord {
  name: string;
  elements: string[];
  deck_id: string;
  rarity: number;
}

interface PalNameRecord {
  name: string;
  name_cn: string;
}

const ELEMENT_CLASS: Record<string, string> = {
  Fire: "text-[var(--color-element-fire)]",
  Water: "text-[var(--color-element-water)]",
  Grass: "text-[var(--color-element-grass)]",
  Electric: "text-[var(--color-element-electric)]",
  Ice: "text-[var(--color-element-ice)]",
  Ground: "text-[var(--color-element-ground)]",
  Dark: "text-[var(--color-element-dark)]",
  Dragon: "text-[var(--color-element-dragon)]",
  Neutral: "text-[var(--color-element-neutral)]",
};

function buildHotPals(limit = 8): HotPal[] {
  const nameCnByName = new Map(
    (palNames as PalNameRecord[]).map((pal) => [pal.name, pal.name_cn]),
  );

  return [...(palsData as PalRecord[])]
    .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((pal) => ({
      name: pal.name,
      name_cn: nameCnByName.get(pal.name) ?? pal.name,
      elements: pal.elements,
      rarity: pal.rarity,
      deck_id: pal.deck_id,
    }));
}

function RarityStars({ rarity, label }: { rarity: number; label: string }): React.ReactElement {
  return (
    <span className="text-xs tracking-widest text-warning" aria-label={label}>
      {"★".repeat(Math.max(1, Math.min(rarity, 5)))}
    </span>
  );
}

interface HotPalsProps {
  className?: string;
  limit?: number;
}

export function HotPals({ className, limit = 8 }: HotPalsProps): React.ReactElement {
  const locale = useLocaleStore((state) => state.locale);
  const translate = useLocaleStore((state) => state.t);
  const pals = buildHotPals(limit);

  return (
    <section aria-label={translate("home.hotPals")} className={cn("w-full", className)}>
      <h2 className="mb-4 text-sm font-medium tracking-wide text-text-secondary uppercase">
        {translate("home.hotPals")}
      </h2>
      <ul
        className={cn(
          "flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide",
          "md:grid md:grid-cols-4 md:overflow-visible md:pb-0 lg:grid-cols-4",
        )}
      >
        {pals.map((pal) => (
          <li
            key={pal.deck_id || pal.name}
            className="w-[9.5rem] shrink-0 snap-start md:w-auto"
          >
            <article
              className={cn(
                "flex h-full flex-col gap-2 rounded-xl border border-border bg-bg-surface p-3",
                "transition-colors hover:border-border-hover hover:bg-bg-hover",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-text-primary">
                  {formatPalLabel(
                    { id: pal.deck_id, name: pal.name, name_cn: pal.name_cn },
                    locale,
                  )}
                </h3>
                <RarityStars
                  rarity={pal.rarity}
                  label={translate("rarity.label", { n: pal.rarity })}
                />
              </div>
              <p className="flex flex-wrap gap-1.5 text-xs">
                {pal.elements.map((element) => (
                  <span
                    key={element}
                    className={cn(
                      "rounded-md bg-bg-elevated px-1.5 py-0.5",
                      ELEMENT_CLASS[element] ?? "text-text-secondary",
                    )}
                  >
                    {translate(`element.${element}` as MessageKey)}
                  </span>
                ))}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
