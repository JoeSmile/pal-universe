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
import { cn } from "@/lib/utils";
import type { PalWorkOrder } from "@/lib/pal-types";

const WORK_META: Record<string, { label: string; icon: LucideIcon }> = {
  kindling: { label: "引火", icon: Flame },
  watering: { label: "浇水", icon: Droplets },
  electricity: { label: "发电", icon: Zap },
  mining: { label: "挖矿", icon: Mountain },
  lumbering: { label: "伐木", icon: Axe },
  cooling: { label: "冷却", icon: Snowflake },
  medicine: { label: "制药", icon: HeartPulse },
  transport: { label: "运输", icon: Truck },
  farming: { label: "耕作", icon: Sprout },
  base_worker: { label: "手工", icon: Hammer },
  fighter: { label: "战斗", icon: Swords },
  mount: { label: "骑乘", icon: Package },
  flyer: { label: "飞行", icon: Bird },
  swimmer: { label: "游泳", icon: Waves },
  fishing: { label: "钓鱼", icon: Fish },
};

const MAX_LEVEL = 4;

interface WorkBadgeProps {
  work: PalWorkOrder;
  className?: string;
}

export function WorkBadge({ work, className }: WorkBadgeProps): React.ReactElement {
  const meta = WORK_META[work.skill] ?? {
    label: work.skill,
    icon: Hammer,
  };
  const Icon = meta.icon;
  const level = Math.min(MAX_LEVEL, Math.max(1, work.level));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-bg-elevated px-2 py-1 text-xs text-text-secondary",
        className,
      )}
      title={`${meta.label} Lv${level}`}
    >
      <Icon className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
      <span className="text-text-primary">{meta.label}</span>
      <span className="flex items-center gap-0.5" aria-label={`等级 ${level}`}>
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
