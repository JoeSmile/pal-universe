"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ElementBadge } from "@/components/element-badge";
import { SiteHeader } from "@/components/site-header";
import { WorkBadge } from "@/components/work-badge";
import {
  fetchPalDetail,
  type PalDetailData,
  type PalDrop,
  type PalLocationInfo,
} from "@/lib/api/pal-detail";
import { PalApiError } from "@/lib/api/pals";
import { useLocaleStore } from "@/lib/i18n/store";
import type { MessageKey } from "@/lib/i18n/messages";
import { getPalImageUrl, type PalStats } from "@/lib/pal-types";
import { formatPalLabel } from "@/lib/search-pals";
import { cn } from "@/lib/utils";

const STAT_MAX = 200;

const STAT_ROWS: Array<{ key: keyof PalStats; labelKey: MessageKey }> = [
  { key: "hp", labelKey: "detail.stat.hp" },
  { key: "melee_attack", labelKey: "detail.stat.melee" },
  { key: "shot_attack", labelKey: "detail.stat.shot" },
  { key: "defense", labelKey: "detail.stat.defense" },
  { key: "support", labelKey: "detail.stat.support" },
  { key: "stamina", labelKey: "detail.stat.stamina" },
];

const heroSpring = { type: "spring" as const, stiffness: 100, damping: 20 };

function rarityStars(rarity: number): string {
  return "★".repeat(Math.max(1, Math.min(5, rarity)));
}

/** Low → red, mid → yellow, high → green */
export function statBarColor(ratio: number): string {
  const t = Math.max(0, Math.min(1, ratio));
  if (t < 0.5) {
    const p = t / 0.5;
    return `oklch(${55 + p * 10}% ${0.18 - p * 0.04} ${30 + p * 70})`;
  }
  const p = (t - 0.5) / 0.5;
  return `oklch(${65 + p * 5}% ${0.14 + p * 0.04} ${100 + p * 50})`;
}

function breedingRankMeta(
  rank: number | null,
  translate: (key: MessageKey) => string,
): { label: string; className: string } | null {
  if (rank == null || !Number.isFinite(rank)) return null;
  if (rank < 500) {
    return {
      label: translate("detail.breedingRare"),
      className: "text-[var(--color-danger)]",
    };
  }
  if (rank > 2000) {
    return {
      label: translate("detail.breedingCommon"),
      className: "text-[var(--color-element-ice)]",
    };
  }
  return {
    label: translate("detail.breedingMid"),
    className: "text-text-secondary",
  };
}

function formatLevelRange(range?: number[] | null): string {
  if (!range || range.length < 2) return "—";
  return `${range[0]}–${range[1]}`;
}

function formatCenter(center?: number[] | null): string {
  if (!center || center.length < 2) return "—";
  return `(${center[0]}, ${center[1]})`;
}

function formatChance(chance: number | null | undefined, unknown: string): string {
  if (chance == null || !Number.isFinite(chance)) return unknown;
  return `${chance}%`;
}

function sortedDrops(drops: PalDrop[]): PalDrop[] {
  return [...drops].sort((a, b) => {
    const ac = a.chance == null ? -1 : a.chance;
    const bc = b.chance == null ? -1 : b.chance;
    return bc - ac;
  });
}

function RarityStars({ rarity }: { rarity: number }): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const stars = Math.max(1, Math.min(5, rarity));
  return (
    <span
      className="bg-gradient-to-r from-[var(--color-rarity-5)] to-[var(--color-warning)] bg-clip-text text-sm tracking-widest text-transparent"
      aria-label={translate("rarity.label", { n: stars })}
      style={{ WebkitBackgroundClip: "text" }}
    >
      {rarityStars(stars)}
    </span>
  );
}

function StatBars({ stats }: { stats: PalStats }): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);

  return (
    <section aria-labelledby="detail-stats-heading" data-testid="detail-stats">
      <h2 id="detail-stats-heading" className="mb-4 text-lg font-semibold text-text-primary">
        {translate("stats.title")}
      </h2>
      <ul className="flex flex-col gap-3">
        {STAT_ROWS.map(({ key, labelKey }) => {
          const value = stats[key] ?? 0;
          const ratio = value / STAT_MAX;
          const pct = Math.max(0, Math.min(100, ratio * 100));
          return (
            <li key={key} className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-3 sm:grid-cols-[7rem_1fr_5rem]">
              <span className="text-sm text-text-secondary">{translate(labelKey)}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-bg-elevated">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 24, delay: 0.05 }}
                  style={{ backgroundColor: statBarColor(ratio) }}
                  data-testid={`stat-bar-${key}`}
                />
              </div>
              <span className="text-right font-mono text-sm text-text-primary">
                {value}/{STAT_MAX}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SkillsTable({
  skills,
}: {
  skills: PalDetailData["skills"];
}): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? skills : skills.slice(0, 3);
  const hiddenCount = Math.max(0, skills.length - 3);

  return (
    <section aria-labelledby="detail-skills-heading" data-testid="detail-skills">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="detail-skills-heading" className="text-lg font-semibold text-text-primary">
          {translate("detail.activeSkills")}
        </h2>
        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="cursor-pointer text-sm text-accent underline-offset-4 hover:underline"
          >
            {expanded
              ? translate("detail.hideSkills")
              : translate("detail.showAllSkills", { n: skills.length })}
          </button>
        ) : null}
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-text-secondary">{translate("detail.noSkills")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead className="bg-bg-elevated text-text-secondary">
              <tr>
                <th className="px-3 py-2 font-medium">{translate("detail.skillName")}</th>
                <th className="px-3 py-2 font-medium">{translate("detail.skillElement")}</th>
                <th className="px-3 py-2 font-medium">{translate("detail.skillPower")}</th>
                <th className="px-3 py-2 font-medium">{translate("detail.skillCooldown")}</th>
                <th className="px-3 py-2 font-medium">{translate("detail.skillEffect")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((skill) => (
                <tr key={skill.name} className="border-t border-border">
                  <td className="px-3 py-2 text-text-primary">{skill.name}</td>
                  <td className="px-3 py-2 text-text-secondary">
                    {skill.element ?? skill.type ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-text-secondary">
                    {skill.power ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-text-secondary">
                    {skill.cooldown != null ? `${skill.cooldown}s` : "—"}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {skill.effect ?? skill.description ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function LocationBlock({
  location,
}: {
  location: PalLocationInfo | null;
}): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);

  if (!location) {
    return (
      <section aria-labelledby="detail-locations-heading" data-testid="detail-locations">
        <h2 id="detail-locations-heading" className="mb-3 text-lg font-semibold">
          {translate("detail.locations")}
        </h2>
        <p className="text-sm text-text-secondary">{translate("detail.noLocations")}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="detail-locations-heading" data-testid="detail-locations">
      <h2 id="detail-locations-heading" className="mb-3 text-lg font-semibold">
        {translate("detail.locations")}
      </h2>
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-text-secondary">{translate("detail.region")}</dt>
          <dd className="text-text-primary">{location.region ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">{translate("detail.coordinates")}</dt>
          <dd className="font-mono text-text-primary">{formatCenter(location.center)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">{translate("detail.levelRange")}</dt>
          <dd className="text-text-primary">{formatLevelRange(location.level_range)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">{translate("detail.spawnCount")}</dt>
          <dd className="text-text-primary">{location.spawn_count ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}

function AiAskBox({ palName }: { palName: string }): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const locale = useLocaleStore((state) => state.locale);
  const router = useRouter();
  const prefix =
    locale === "zh" ? `关于 ${palName}: ` : `About ${palName}: `;
  const [text, setText] = useState(prefix);

  useEffect(() => {
    setText((current) => {
      const stripped = current.replace(/^(About .+: |关于 .+: )/, "");
      return prefix + stripped;
    });
  }, [prefix]);

  function onSubmit(event: React.FormEvent): void {
    event.preventDefault();
    const q = text.trim();
    if (!q) return;
    const params = new URLSearchParams({
      q,
      pal: palName,
    });
    router.push(`/chat?${params.toString()}`);
  }

  return (
    <section
      aria-labelledby="detail-ai-heading"
      className="rounded-2xl border border-border bg-bg-surface p-4 sm:p-5"
      data-testid="detail-ai"
    >
      <h2 id="detail-ai-heading" className="mb-3 text-lg font-semibold text-text-primary">
        {translate("detail.aiTitle")}
      </h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="detail-ai-input">
          {translate("detail.aiPlaceholder")}
        </label>
        <input
          id="detail-ai-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={translate("detail.aiPlaceholder")}
          className={cn(
            "min-w-0 flex-1 rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary",
            "placeholder:text-text-secondary/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          )}
        />
        <button
          type="submit"
          className={cn(
            "shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-bg-base",
            "transition-opacity hover:opacity-90 active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          )}
        >
          {translate("detail.aiSend")}
        </button>
      </form>
    </section>
  );
}

export interface PalDetailProps {
  pal: PalDetailData;
  className?: string;
}

export function PalDetail({ pal, className }: PalDetailProps): React.ReactElement {
  const locale = useLocaleStore((state) => state.locale);
  const translate = useLocaleStore((state) => state.t);
  const [imgSrc, setImgSrc] = useState(
    pal.image || getPalImageUrl(pal.name, "webp"),
  );
  const displayName = formatPalLabel(
    { id: pal.deck_id, name: pal.name, name_cn: pal.name_cn },
    locale,
  );
  const secondaryName =
    locale === "zh"
      ? pal.name !== pal.name_cn
        ? pal.name
        : null
      : pal.name_cn !== pal.name
        ? pal.name_cn
        : null;

  const breeding = breedingRankMeta(pal.breeding_rank, translate);
  const drops = sortedDrops(pal.drops);

  return (
    <article
      className={cn("mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 md:px-6", className)}
      data-testid="pal-detail"
    >
      <Link
        href="/pals"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {translate("detail.backToList")}
      </Link>

      {/* Hero */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <motion.div
          className="relative mx-auto size-[150px] shrink-0 overflow-hidden rounded-2xl bg-bg-elevated sm:mx-0 sm:size-[300px]"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={heroSpring}
          whileHover={{ scale: 1.05 }}
          data-testid="detail-hero-image"
        >
          <Image
            src={imgSrc}
            alt={displayName}
            fill
            sizes="(max-width: 640px) 150px, 300px"
            className="object-contain p-4"
            priority
            onError={() => {
              if (imgSrc.endsWith(".webp")) {
                setImgSrc(getPalImageUrl(pal.name, "svg"));
              }
            }}
          />
        </motion.div>

        <div className="min-w-0 flex-1 space-y-3">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              {displayName}
            </h1>
            {secondaryName ? (
              <p className="text-text-secondary">{secondaryName}</p>
            ) : null}
          </header>

          <div className="flex flex-wrap items-center gap-2">
            {pal.elements.map((el) => (
              <ElementBadge key={el} element={el} />
            ))}
            <RarityStars rarity={pal.rarity} />
            {pal.rarity_label ? (
              <span className="text-sm text-text-secondary">{pal.rarity_label}</span>
            ) : null}
            {pal.deck_id ? (
              <span className="rounded-md bg-bg-elevated px-2 py-0.5 font-mono text-xs text-text-secondary">
                #{pal.deck_id}
              </span>
            ) : null}
            {pal.size ? (
              <span className="text-sm text-text-secondary">
                {translate("detail.size")}: {pal.size}
              </span>
            ) : null}
          </div>

          {pal.partner_skill ? (
            <div
              className="rounded-xl border border-border bg-bg-surface p-3"
              data-testid="detail-partner-skill"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                {translate("detail.partnerSkill")}
              </p>
              <p className="mt-1 font-semibold text-text-primary">
                {pal.partner_skill.name}
              </p>
              {pal.partner_skill.effect ? (
                <p className="mt-1 text-sm text-text-secondary">
                  {pal.partner_skill.effect}
                </p>
              ) : null}
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div className="flex items-start gap-2">
              {pal.nocturnal ? (
                <Moon className="mt-0.5 size-4 text-accent" aria-hidden />
              ) : (
                <Sun className="mt-0.5 size-4 text-accent" aria-hidden />
              )}
              <div>
                <dt className="text-text-secondary">
                  {pal.nocturnal
                    ? translate("detail.nocturnal")
                    : translate("detail.diurnal")}
                </dt>
              </div>
            </div>
            <div>
              <dt className="text-text-secondary">{translate("detail.price")}</dt>
              <dd className="font-mono text-text-primary">{pal.price || "—"}</dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-text-secondary">{translate("detail.movement")}</dt>
              <dd className="text-text-primary">
                {translate("detail.walk")} {pal.movement.walk} ·{" "}
                {translate("detail.run")} {pal.movement.run} ·{" "}
                {translate("detail.sprint")} {pal.movement.sprint}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <StatBars stats={pal.stats} />
      <SkillsTable skills={pal.skills} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <section aria-labelledby="detail-work-heading" data-testid="detail-work">
          <h2 id="detail-work-heading" className="mb-3 text-lg font-semibold">
            {translate("detail.work")}
          </h2>
          {pal.work_orders.length === 0 ? (
            <p className="text-sm text-text-secondary">—</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pal.work_orders.map((work) => (
                <li key={work.skill}>
                  <WorkBadge work={work} className="w-full justify-start" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="detail-breeding-heading" data-testid="detail-breeding">
          <h2 id="detail-breeding-heading" className="mb-3 text-lg font-semibold">
            {translate("detail.breeding")}
          </h2>
          <p className="text-sm text-text-secondary">
            {translate("detail.breedingRank")}:{" "}
            {pal.breeding_rank != null ? (
              <span
                className={cn("font-mono font-semibold", breeding?.className)}
                data-testid="breeding-rank"
              >
                {pal.breeding_rank}
                {breeding ? ` (${breeding.label})` : ""}
              </span>
            ) : (
              "—"
            )}
          </p>
          <Link
            href={`/breeding?target=${encodeURIComponent(pal.name)}`}
            className="mt-3 inline-flex text-sm text-accent underline-offset-4 hover:underline"
            data-testid="breeding-link"
          >
            {translate("detail.viewBreeding")}
          </Link>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <section aria-labelledby="detail-drops-heading" data-testid="detail-drops">
          <h2 id="detail-drops-heading" className="mb-3 text-lg font-semibold">
            {translate("detail.drops")}
          </h2>
          {drops.length === 0 ? (
            <p className="text-sm text-text-secondary">—</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
                <thead className="bg-bg-elevated text-text-secondary">
                  <tr>
                    <th className="px-3 py-2 font-medium">{translate("detail.dropName")}</th>
                    <th className="px-3 py-2 font-medium">{translate("detail.dropChance")}</th>
                    <th className="px-3 py-2 font-medium">{translate("detail.dropUse")}</th>
                  </tr>
                </thead>
                <tbody>
                  {drops.map((drop) => {
                    const guaranteed = drop.chance === 100;
                    return (
                      <tr
                        key={drop.name}
                        className={cn(
                          "border-t border-border",
                          guaranteed && "bg-[var(--color-success)]/10",
                        )}
                        data-guaranteed={guaranteed || undefined}
                      >
                        <td className="px-3 py-2 text-text-primary">{drop.name}</td>
                        <td className="px-3 py-2 font-mono text-text-secondary">
                          {formatChance(drop.chance, translate("detail.dropUnknown"))}
                        </td>
                        <td className="px-3 py-2 text-text-secondary">
                          {drop.use || translate("detail.dropUnknown")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <LocationBlock location={pal.location} />
      </div>

      <AiAskBox palName={pal.name} />
    </article>
  );
}

interface PalDetailPageClientProps {
  name: string;
}

export function PalDetailPageClient({
  name,
}: PalDetailPageClientProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const decoded = decodeURIComponent(name);

  const detailQuery = useQuery({
    queryKey: ["pal", "detail", decoded],
    queryFn: ({ signal }) => fetchPalDetail(decoded, { signal }),
  });

  const pal = detailQuery.data ?? null;

  return (
    <div className="min-h-dvh bg-bg-base text-text-primary">
      <SiteHeader />
      {detailQuery.isLoading ? (
        <p className="px-4 py-16 text-center text-text-secondary">
          {translate("detail.loading")}
        </p>
      ) : null}
      {detailQuery.isError && !pal ? (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-text-secondary">{translate("detail.notFound")}</p>
          <Link href="/pals" className="mt-4 inline-block text-sm text-accent hover:underline">
            {translate("detail.backToList")}
          </Link>
          {detailQuery.error instanceof PalApiError ? (
            <p className="mt-2 text-xs text-text-secondary/70">
              {detailQuery.error.message}
            </p>
          ) : null}
        </div>
      ) : null}
      {pal ? <PalDetail pal={pal} /> : null}
    </div>
  );
}
