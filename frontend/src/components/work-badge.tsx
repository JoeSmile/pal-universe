"use client";

import {
  Axe,
  Bird,
  Droplets,
  Fish,
  Flame,
  Hammer,
  HeartPulse,
  Mountain,
  Package,
  Snowflake,
  Sprout,
  Swords,
  Truck,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useLocaleStore } from "@/lib/i18n/store";
import type { MessageKey } from "@/lib/i18n/messages";
import { workIconSrc } from "@/lib/ui-icons";
import { cn } from "@/lib/utils";
import type { PalWorkOrder } from "@/lib/pal-types";

export const WORK_META: Record<
  string,
  { messageKey: MessageKey; icon: LucideIcon; colorVar: string }
> = {
  kindling: {
    messageKey: "work.kindling",
    icon: Flame,
    colorVar: "--color-work-kindling",
  },
  watering: {
    messageKey: "work.watering",
    icon: Droplets,
    colorVar: "--color-work-watering",
  },
  electricity: {
    messageKey: "work.electricity",
    icon: Zap,
    colorVar: "--color-work-electricity",
  },
  mining: {
    messageKey: "work.mining",
    icon: Mountain,
    colorVar: "--color-work-mining",
  },
  lumbering: {
    messageKey: "work.lumbering",
    icon: Axe,
    colorVar: "--color-work-lumbering",
  },
  cooling: {
    messageKey: "work.cooling",
    icon: Snowflake,
    colorVar: "--color-work-cooling",
  },
  medicine: {
    messageKey: "work.medicine",
    icon: HeartPulse,
    colorVar: "--color-work-medicine",
  },
  transport: {
    messageKey: "work.transport",
    icon: Truck,
    colorVar: "--color-work-transport",
  },
  farming: {
    messageKey: "work.farming",
    icon: Sprout,
    colorVar: "--color-work-farming",
  },
  planting: {
    messageKey: "work.planting",
    icon: Sprout,
    colorVar: "--color-work-farming",
  },
  gathering: {
    messageKey: "work.gathering",
    icon: Package,
    colorVar: "--color-work-transport",
  },
  base_worker: {
    messageKey: "work.base_worker",
    icon: Hammer,
    colorVar: "--color-work-base_worker",
  },
  fighter: {
    messageKey: "work.fighter",
    icon: Swords,
    colorVar: "--color-work-fighter",
  },
  mount: {
    messageKey: "work.mount",
    icon: Package,
    colorVar: "--color-work-mount",
  },
  flyer: {
    messageKey: "work.flyer",
    icon: Bird,
    colorVar: "--color-work-flyer",
  },
  swimmer: {
    messageKey: "work.swimmer",
    icon: Waves,
    colorVar: "--color-work-swimmer",
  },
  fishing: {
    messageKey: "work.fishing",
    icon: Fish,
    colorVar: "--color-work-fishing",
  },
};

const FALLBACK_META = {
  messageKey: null as MessageKey | null,
  icon: Hammer,
  colorVar: "--color-work-base_worker",
};

const MAX_LEVEL = 10;

interface WorkBadgeProps {
  work: PalWorkOrder;
  className?: string;
  /** Icon + level only (cards / dense lists). */
  compact?: boolean;
}

function WorkIcon({
  skill,
  size,
  className,
  Fallback,
}: {
  skill: string;
  size: number;
  className?: string;
  Fallback: LucideIcon;
}): React.ReactElement {
  const src = workIconSrc(skill);
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 object-contain", className)}
        aria-hidden="true"
      />
    );
  }
  return <Fallback className={cn("shrink-0", className)} aria-hidden="true" />;
}

export function WorkBadge({
  work,
  className,
  compact = false,
}: WorkBadgeProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const meta = WORK_META[work.skill] ?? FALLBACK_META;
  const Icon = meta.icon;
  const label = meta.messageKey ? translate(meta.messageKey) : work.skill;
  const level = Math.min(MAX_LEVEL, Math.max(1, work.level));
  const color = `var(${meta.colorVar})`;
  const levelLabel = translate("work.level", { n: level });

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex flex-col items-center gap-0.5",
          className,
        )}
        title={`${label} Lv${level}`}
        aria-label={`${label}, ${levelLabel}`}
        data-work={work.skill}
      >
        <WorkIcon
          skill={work.skill}
          size={22}
          className="size-[22px]"
          Fallback={Icon}
        />
        <span className="text-[11px] font-bold leading-none tabular-nums text-text-primary">
          {level}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-lg bg-bg-elevated px-2.5 py-1.5 text-xs",
        className,
      )}
      title={`${label} Lv${level}`}
      data-work={work.skill}
    >
      <WorkIcon
        skill={work.skill}
        size={24}
        className="size-6"
        Fallback={Icon}
      />
      <span className="min-w-0 flex-1 truncate font-medium text-text-secondary">
        {label}
      </span>
      <span
        className="tabular-nums text-sm font-bold"
        style={{ color }}
        aria-label={levelLabel}
      >
        {level}
      </span>
    </span>
  );
}
