"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
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

function RarityStars({ rarity }: { rarity: number }): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const stars = Math.max(1, Math.min(5, rarity));
  return (
    <span
      className="bg-gradient-to-r from-[var(--color-rarity-5)] to-[var(--color-warning)] bg-clip-text text-sm tracking-widest text-transparent"
      aria-label={translate("rarity.label", { n: stars })}
      style={{
        WebkitBackgroundClip: "text",
      }}
    >
      {"★".repeat(stars)}
    </span>
  );
}

interface PalCardProps {
  pal: PalCardData;
  className?: string;
}

export function PalCard({ pal, className }: PalCardProps): React.ReactElement {
  const locale = useLocaleStore((state) => state.locale);
  const [hovered, setHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState(getPalImageUrl(pal.name, "webp"));
  const works: PalWorkOrder[] = normalizeWorkOrders(pal.work_orders);
  const displayName = formatPalLabel(
    { id: pal.deck_id, name: pal.name, name_cn: pal.name_cn },
    locale,
  );

  return (
    <Link
      href={`/pals/${encodeURIComponent(pal.name)}`}
      className={cn("block w-full max-w-[280px] outline-none", className)}
      aria-label={displayName}
    >
    <motion.article
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-bg-surface",
        "shadow-md shadow-black/20",
        "transition-[border-color] duration-[var(--duration-fast)] hover:border-border-hover",
        "focus-visible:ring-2 focus-visible:ring-accent",
      )}
      initial={false}
      animate={
        hovered
          ? { y: -4, boxShadow: "0 12px 20px oklch(0% 0 0 / 28%)" }
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
          alt={displayName}
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
      </div>
    </motion.article>
    </Link>
  );
}
