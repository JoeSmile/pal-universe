"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { ElementBadge } from "@/components/element-badge";
import { WorkBadge } from "@/components/work-badge";
import { useLocaleStore } from "@/lib/i18n/store";
import {
  getPalImageUrl,
  normalizeWorkOrders,
  type PalCardData,
  type PalWorkOrder,
} from "@/lib/pal-types";
import { formatPalLabel } from "@/lib/search-pals";
import { cn } from "@/lib/utils";

const springStiff = { type: "spring" as const, stiffness: 300, damping: 25 };

const STAT_LABELS: Array<{ key: keyof PalCardData["stats"]; label: string }> = [
  { key: "hp", label: "HP" },
  { key: "melee_attack", label: "近战" },
  { key: "shot_attack", label: "远程" },
  { key: "defense", label: "防御" },
  { key: "support", label: "支援" },
  { key: "stamina", label: "耐力" },
];

const STAT_MAX = 200;

function RarityStars({ rarity }: { rarity: number }): React.ReactElement {
  const stars = Math.max(1, Math.min(5, rarity));
  return (
    <span
      className="bg-gradient-to-r from-[var(--color-rarity-5)] to-[var(--color-warning)] bg-clip-text text-sm tracking-widest text-transparent"
      aria-label={`rarity ${stars}`}
      style={{
        WebkitBackgroundClip: "text",
      }}
    >
      {"★".repeat(stars)}
    </span>
  );
}

function StatBar({ label, value }: { label: string; value: number }): React.ReactElement {
  const pct = Math.min(100, Math.round((value / STAT_MAX) * 100));
  return (
    <div className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-2 text-xs">
      <span className="text-text-tertiary">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-inset">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={springStiff}
        />
      </div>
      <span className="text-right text-text-secondary tabular-nums">{value}</span>
    </div>
  );
}

interface PalCardProps {
  pal: PalCardData;
  className?: string;
}

export function PalCard({ pal, className }: PalCardProps): React.ReactElement {
  const locale = useLocaleStore((state) => state.locale);
  const translate = useLocaleStore((state) => state.t);
  const [hovered, setHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState(getPalImageUrl(pal.name, "webp"));
  const works: PalWorkOrder[] = normalizeWorkOrders(pal.work_orders);
  const displayName = formatPalLabel(
    { id: pal.deck_id, name: pal.name, name_cn: pal.name_cn },
    locale,
  );

  return (
    <motion.article
      className={cn(
        "group relative flex w-full max-w-[280px] flex-col overflow-hidden rounded-2xl border border-border bg-bg-surface",
        "shadow-md shadow-black/20",
        className,
      )}
      initial={false}
      animate={
        hovered
          ? { y: -8, boxShadow: "0 20px 25px oklch(0% 0 0 / 35%)" }
          : { y: 0, boxShadow: "0 4px 6px oklch(0% 0 0 / 15%)" }
      }
      transition={springStiff}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid="pal-card"
    >
      <div className="relative aspect-square bg-bg-elevated">
        <Image
          src={imgSrc}
          alt={pal.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="object-contain p-4 transition-transform duration-[var(--duration-normal)] group-hover:scale-105"
          onError={() => {
            if (imgSrc.endsWith(".webp")) {
              setImgSrc(getPalImageUrl(pal.name, "svg"));
            }
          }}
        />
        {pal.deck_id ? (
          <span className="absolute left-3 top-3 rounded-md bg-bg-base/80 px-2 py-0.5 text-xs text-text-secondary">
            #{pal.deck_id}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-text-primary">
              {displayName}
            </h3>
          </div>
          <RarityStars rarity={pal.rarity} />
        </header>

        <div className="flex flex-wrap gap-1.5">
          {pal.elements.map((element) => (
            <ElementBadge key={element} element={element} />
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {works.map((work) => (
            <WorkBadge key={work.skill} work={work} />
          ))}
        </div>

        <AnimatePresence initial={false}>
          {hovered ? (
            <motion.div
              key="stats"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={springStiff}
              className="overflow-hidden border-t border-border pt-3"
              data-testid="pal-card-stats"
            >
              <p className="mb-2 text-xs font-medium text-text-tertiary">
                {translate("stats.title")}
              </p>
              <div className="flex flex-col gap-1.5">
                {STAT_LABELS.map(({ key, label }) => (
                  <StatBar key={key} label={label} value={pal.stats[key]} />
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
