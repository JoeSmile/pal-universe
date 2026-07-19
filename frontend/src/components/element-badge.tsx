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
import { cn } from "@/lib/utils";
import type { PalElement } from "@/lib/pal-types";

const ELEMENT_META: Record<
  string,
  { label: string; icon: LucideIcon; bg: string; text: string }
> = {
  Fire: {
    label: "火",
    icon: Flame,
    bg: "bg-[var(--color-element-fire)]",
    text: "text-[var(--color-element-fire-text)]",
  },
  Water: {
    label: "水",
    icon: Droplet,
    bg: "bg-[var(--color-element-water)]",
    text: "text-[var(--color-element-water-text)]",
  },
  Grass: {
    label: "草",
    icon: Leaf,
    bg: "bg-[var(--color-element-grass)]",
    text: "text-[var(--color-element-grass-text)]",
  },
  Electric: {
    label: "电",
    icon: Zap,
    bg: "bg-[var(--color-element-electric)]",
    text: "text-[var(--color-element-electric-text)]",
  },
  Ice: {
    label: "冰",
    icon: Snowflake,
    bg: "bg-[var(--color-element-ice)]",
    text: "text-[var(--color-element-ice-text)]",
  },
  Ground: {
    label: "地",
    icon: Mountain,
    bg: "bg-[var(--color-element-ground)]",
    text: "text-[var(--color-element-ground-text)]",
  },
  Dark: {
    label: "暗",
    icon: Moon,
    bg: "bg-[var(--color-element-dark)]",
    text: "text-[var(--color-element-dark-text)]",
  },
  Dragon: {
    label: "龙",
    icon: Gem,
    bg: "bg-[var(--color-element-dragon)]",
    text: "text-[var(--color-element-dragon-text)]",
  },
  Neutral: {
    label: "无",
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
  const meta = ELEMENT_META[element] ?? ELEMENT_META.Neutral!;
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
      {meta.label}
    </span>
  );
}
