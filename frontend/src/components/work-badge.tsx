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
import { useLocaleStore } from "@/lib/i18n/store";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import type { PalWorkOrder } from "@/lib/pal-types";

const WORK_ICONS: Record<string, LucideIcon> = {
  kindling: Flame,
  watering: Droplets,
  electricity: Zap,
  mining: Mountain,
  lumbering: Axe,
  cooling: Snowflake,
  medicine: HeartPulse,
  transport: Truck,
  farming: Sprout,
  base_worker: Hammer,
  fighter: Swords,
  mount: Package,
  flyer: Bird,
  swimmer: Waves,
  fishing: Fish,
};

const WORK_MESSAGE_KEYS: Record<string, MessageKey> = {
  kindling: "work.kindling",
  watering: "work.watering",
  electricity: "work.electricity",
  mining: "work.mining",
  lumbering: "work.lumbering",
  cooling: "work.cooling",
  medicine: "work.medicine",
  transport: "work.transport",
  farming: "work.farming",
  base_worker: "work.base_worker",
  fighter: "work.fighter",
  mount: "work.mount",
  flyer: "work.flyer",
  swimmer: "work.swimmer",
  fishing: "work.fishing",
};

const MAX_LEVEL = 4;

interface WorkBadgeProps {
  work: PalWorkOrder;
  className?: string;
}

export function WorkBadge({ work, className }: WorkBadgeProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const Icon = WORK_ICONS[work.skill] ?? Hammer;
  const messageKey = WORK_MESSAGE_KEYS[work.skill];
  const label = messageKey ? translate(messageKey) : work.skill;
  const level = Math.min(MAX_LEVEL, Math.max(1, work.level));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-bg-elevated px-2 py-1 text-xs text-text-secondary",
        className,
      )}
      title={`${label} Lv${level}`}
    >
      <Icon className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
      <span className="text-text-primary">{label}</span>
      <span
        className="flex items-center gap-0.5"
        aria-label={translate("work.level", { n: level })}
      >
        {Array.from({ length: MAX_LEVEL }, (_, index) => (
          <span
            key={index}
            className={cn(
              "size-1.5 rounded-full",
              index < level ? "bg-accent" : "bg-border",
            )}
          />
        ))}
      </span>
    </span>
  );
}
