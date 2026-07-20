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
import Image from "next/image";
import { useLocaleStore } from "@/lib/i18n/store";
import type { MessageKey } from "@/lib/i18n/messages";
import { elementIconSrc } from "@/lib/ui-icons";
import { cn } from "@/lib/utils";
import type { PalElement } from "@/lib/pal-types";

export const ELEMENT_META: Record<
  string,
  { messageKey: MessageKey; icon: LucideIcon; colorVar: string; textVar: string }
> = {
  Fire: {
    messageKey: "element.Fire",
    icon: Flame,
    colorVar: "--color-element-fire",
    textVar: "--color-element-fire-text",
  },
  Water: {
    messageKey: "element.Water",
    icon: Droplet,
    colorVar: "--color-element-water",
    textVar: "--color-element-water-text",
  },
  Grass: {
    messageKey: "element.Grass",
    icon: Leaf,
    colorVar: "--color-element-grass",
    textVar: "--color-element-grass-text",
  },
  Electric: {
    messageKey: "element.Electric",
    icon: Zap,
    colorVar: "--color-element-electric",
    textVar: "--color-element-electric-text",
  },
  Ice: {
    messageKey: "element.Ice",
    icon: Snowflake,
    colorVar: "--color-element-ice",
    textVar: "--color-element-ice-text",
  },
  Ground: {
    messageKey: "element.Ground",
    icon: Mountain,
    colorVar: "--color-element-ground",
    textVar: "--color-element-ground-text",
  },
  Dark: {
    messageKey: "element.Dark",
    icon: Moon,
    colorVar: "--color-element-dark",
    textVar: "--color-element-dark-text",
  },
  Dragon: {
    messageKey: "element.Dragon",
    icon: Gem,
    colorVar: "--color-element-dragon",
    textVar: "--color-element-dragon-text",
  },
  Neutral: {
    messageKey: "element.Neutral",
    icon: Circle,
    colorVar: "--color-element-neutral",
    textVar: "--color-element-neutral-text",
  },
};

interface ElementBadgeProps {
  element: string;
  className?: string;
  /** Icon only (cards / dense rows). */
  compact?: boolean;
}

function ElementIcon({
  element,
  size,
  className,
}: {
  element: string;
  size: number;
  className?: string;
}): React.ReactElement {
  return (
    <Image
      src={elementIconSrc(element)}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      aria-hidden="true"
    />
  );
}

export function ElementBadge({
  element,
  className,
  compact = false,
}: ElementBadgeProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const key = element in ELEMENT_META ? element : "Neutral";
  const meta = ELEMENT_META[key]!;
  const label = translate(meta.messageKey);

  if (compact) {
    return (
      <span
        className={cn("inline-flex size-7 items-center justify-center", className)}
        title={label}
        aria-label={label}
        data-element={element as PalElement}
      >
        <ElementIcon element={key} size={28} className="size-7" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-bg-elevated py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-text-secondary",
        className,
      )}
      title={label}
      data-element={element as PalElement}
    >
      <ElementIcon element={key} size={22} className="size-[22px]" />
      {label}
    </span>
  );
}
