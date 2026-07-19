"use client";

import { useEffect } from "react";
import { useLocaleStore } from "@/lib/i18n/store";

export function LocaleProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const hydrate = useLocaleStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
