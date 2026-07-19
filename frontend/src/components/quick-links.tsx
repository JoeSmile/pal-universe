import Link from "next/link";
import { Flame, LayoutGrid, Map, Package, Split, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickLinkItem {
  href: string;
  label: string;
  description: string;
  icon: typeof Split;
}

export const QUICK_LINKS: QuickLinkItem[] = [
  {
    href: "/breeding",
    label: "繁殖计算器",
    description: "查父母组合与后代",
    icon: Split,
  },
  {
    href: "/types",
    label: "属性克制",
    description: "元素相克速查",
    icon: Flame,
  },
  {
    href: "/map",
    label: "地图",
    description: "刷新点与区域",
    icon: Map,
  },
  {
    href: "/pals",
    label: "帕鲁列表",
    description: "浏览全部帕鲁",
    icon: LayoutGrid,
  },
  {
    href: "/tier",
    label: "Tier 排行",
    description: "强度与劳作榜",
    icon: Star,
  },
  {
    href: "/items",
    label: "物品图鉴",
    description: "掉落与材料",
    icon: Package,
  },
];

interface QuickLinksProps {
  className?: string;
}

export function QuickLinks({ className }: QuickLinksProps): React.ReactElement {
  return (
    <section aria-label="快捷功能入口" className={cn("w-full", className)}>
      <h2 className="mb-4 text-sm font-medium tracking-wide text-text-secondary uppercase">
        功能入口
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col gap-2 rounded-xl border border-border bg-bg-surface p-4",
                  "transition-[border-color,background-color,transform] duration-[var(--duration-fast)]",
                  "hover:border-border-hover hover:bg-bg-hover active:scale-[0.98]",
                )}
              >
                <Icon className="size-5 text-accent" aria-hidden="true" />
                <span className="text-sm font-medium text-text-primary">{item.label}</span>
                <span className="text-xs text-text-tertiary">{item.description}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
