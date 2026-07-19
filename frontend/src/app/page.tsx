import { SearchBar } from "@/components/search-bar";

export default function HomePage(): React.ReactElement {
  return (
    <main className="relative min-h-screen bg-bg-base text-text-primary">
      {/* Desktop: brand + search in upper third */}
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 pb-28 pt-16 md:pb-16 md:pt-[12vh]">
        <header className="mb-8 text-center md:mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
            Pal Universe
          </h1>
          <p className="mt-3 text-base text-text-secondary md:text-lg">
            搜索帕鲁，开启超级百科
          </p>
        </header>

        <div className="hidden w-full justify-center md:flex">
          <SearchBar />
        </div>

        {/* Spacer so mobile content isn't hidden behind the thumb-zone search */}
        <div className="flex-1 md:hidden" aria-hidden="true" />
      </div>

      {/* Mobile: search fixed in bottom thumb zone (~1/3) */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 flex min-h-[33dvh] items-end justify-center bg-gradient-to-t from-bg-base via-bg-base/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 md:hidden"
        data-testid="mobile-search-zone"
      >
        <SearchBar />
      </div>
    </main>
  );
}
