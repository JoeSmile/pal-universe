"use client";

import {
  Circle,
  Droplet,
  Flame,
  Gem,
  Leaf,
  Moon,
  Mountain,
  Snowflake,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useLocaleStore } from "@/lib/i18n/store";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import type { PalElement } from "@/lib/pal-types";

const ELEMENT_META: Record<
  string,
  { messageKey: MessageKey; icon: LucideIcon; bg: string; text: string }
> = {
  Fire: {
    messageKey: "element.Fire",
    icon: Flame,
    bg: "bg-[var(--color-element-fire)]",
    text: "text-[var(--color-element-fire-text)]",
  },
  Water: {
    messageKey: "element.Water",
    icon: Droplet,
    bg: "bg-[var(--color-element-water)]",
    text: "text-[var(--color-element-water-text)]",
  },
  Grass: {
    messageKey: "element.Grass",
    icon: Leaf,
    bg: "bg-[var(--color-element-grass)]",
    text: "text-[var(--color-element-grass-text)]",
  },
  Electric: {
    messageKey: "element.Electric",
    icon: Zap,
    bg: "bg-[var(--color-element-electric)]",
    text: "text-[var(--color-element-electric-text)]",
  },
  Ice: {
    messageKey: "element.Ice",
    icon: Snowflake,
    bg: "bg-[var(--color-element-ice)]",
    text: "text-[var(--color-element-ice-text)]",
  },
  Ground: {
    messageKey: "element.Ground",
    icon: Mountain,
    bg: "bg-[var(--color-element-ground)]",
    text: "text-[var(--color-element-ground-text)]",
  },
  Dark: {
    messageKey: "element.Dark",
    icon: Moon,
    bg: "bg-[var(--color-element-dark)]",
    text: "text-[var(--color-element-dark-text)]",
  },
  Dragon: {
    messageKey: "element.Dragon",
    icon: Gem,
    bg: "bg-[var(--color-element-dragon)]",
    text: "text-[var(--color-element-dragon-text)]",
  },
  Neutral: {
    messageKey: "element.Neutral",
    icon: Circle,
    bg: "bg-[var(--color-element-neutral)]",
    text: "text-[var(--color-element-neutral-text)]",
  },
};

interface ElementBadgeProps {
  element: string;
  className?: string;
}

export function ElementBadge({ element, className }: ElementBadgeProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const key = element in ELEMENT_META ? element : "Neutral";
  const meta = ELEMENT_META[key]!;
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        meta.bg,
        meta.text,
        className,
      )}
      data-element={element as PalElement}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {translate(meta.messageKey)}
    </span>
  );
}
