"use client";

import { SearchBar } from "@/components/search-bar";

export function HomeSearchSection(): React.ReactElement {
  return (
    <main className="relative min-h-screen bg-bg-base text-text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 pb-[calc(33dvh+1rem)] pt-16 md:pb-16 md:pt-[12vh]">
        <header className="mb-8 text-center md:mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
            Pal Universe
          </h1>
          <p className="mt-3 text-base text-text-secondary md:text-lg">
            搜索帕鲁，开启超级百科
          </p>
        </header>

        <div className="hidden flex-1 md:block" aria-hidden="true" />
      </div>

      <div
        data-testid="home-search-anchor"
        className={[
          "fixed inset-x-0 bottom-0 z-20 flex min-h-[33dvh] items-end justify-center",
          "bg-gradient-to-t from-bg-base via-bg-base/95 to-transparent",
          "px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8",
          "md:absolute md:inset-x-auto md:bottom-auto md:left-1/2 md:top-[38vh] md:z-10",
          "md:min-h-0 md:w-full md:max-w-xl md:-translate-x-1/2 md:bg-transparent md:px-6 md:pt-0 md:pb-0",
        ].join(" ")}
      >
        <SearchBar className="w-full" />
      </div>
    </main>
  );
}
