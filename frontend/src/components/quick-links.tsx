"use client";

import Link from "next/link";
import { Flame, LayoutGrid, Map, Package, Split, Star } from "lucide-react";
import { useLocaleStore } from "@/lib/i18n/store";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

interface QuickLinkItem {
  href: string;
  labelKey: MessageKey;
  descKey: MessageKey;
  icon: typeof Split;
}

const QUICK_LINKS: QuickLinkItem[] = [
  {
    href: "/breeding",
    labelKey: "link.breeding",
    descKey: "link.breedingDesc",
    icon: Split,
  },
  {
    href: "/types",
    labelKey: "link.types",
    descKey: "link.typesDesc",
    icon: Flame,
  },
  {
    href: "/map",
    labelKey: "link.map",
    descKey: "link.mapDesc",
    icon: Map,
  },
  {
    href: "/pals",
    labelKey: "link.pals",
    descKey: "link.palsDesc",
    icon: LayoutGrid,
  },
  {
    href: "/tier",
    labelKey: "link.tier",
    descKey: "link.tierDesc",
    icon: Star,
  },
  {
    href: "/items",
    labelKey: "link.items",
    descKey: "link.itemsDesc",
    icon: Package,
  },
];

interface QuickLinksProps {
  className?: string;
}

export function QuickLinks({ className }: QuickLinksProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);

  return (
    <section aria-label={translate("home.features")} className={cn("w-full", className)}>
      <h2 className="mb-4 text-sm font-medium tracking-wide text-text-secondary uppercase">
        {translate("home.features")}
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
                <span className="text-sm font-medium text-text-primary">
                  {translate(item.labelKey)}
                </span>
                <span className="text-xs text-text-tertiary">{translate(item.descKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export { QUICK_LINKS };
