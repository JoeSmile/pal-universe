"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PalCardGrid } from "@/components/pal-card-grid";
import { PalFilter } from "@/components/pal-filter";
import { SiteHeader } from "@/components/site-header";
import { searchPalsApi, type PalSearchResponse } from "@/lib/api/pals";
import { getPalCatalog } from "@/lib/pal-catalog";
import {
  DEFAULT_PER_PAGE,
  filterPals,
  usePalFilterStore,
} from "@/lib/pal-filter-store";
import { useLocaleStore } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";

const localCatalog = getPalCatalog();

/** Prefetch distance inside the fixed list scroller (mobile & desktop). */
const LOAD_MORE_ROOT_MARGIN = "240px 0px";

export function PalsPageClient(): React.ReactElement {
  const locale = useLocaleStore((state) => state.locale);
  const translate = useLocaleStore((state) => state.t);
  const query = usePalFilterStore((state) => state.query);
  const elements = usePalFilterStore((state) => state.elements);
  const works = usePalFilterStore((state) => state.works);
  const clearFilters = usePalFilterStore((state) => state.clearFilters);
  const perPage = DEFAULT_PER_PAGE;

  const deferredQuery = useDeferredValue(query);

  const filterKey = useMemo(
    () => ({
      q: deferredQuery,
      types: elements,
      work: works,
      perPage,
      locale,
    }),
    [deferredQuery, elements, works, perPage, locale],
  );

  const filteredLocal = useMemo(
    () =>
      filterPals(localCatalog, {
        query: filterKey.q,
        elements: filterKey.types,
        works: filterKey.work,
        locale: filterKey.locale,
      }),
    [filterKey],
  );

  const {
    data,
    error,
    isError,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "pals",
      "search",
      "infinite",
      filterKey.q,
      filterKey.types,
      filterKey.work,
      filterKey.perPage,
    ],
    queryFn: ({ pageParam, signal }) =>
      searchPalsApi(
        {
          q: filterKey.q,
          types: filterKey.types,
          work: filterKey.work,
          page: pageParam,
          perPage: filterKey.perPage,
        },
        { signal },
      ),
    initialPageParam: 1,
    getNextPageParam: (last: PalSearchResponse) =>
      last.has_next ? last.page + 1 : undefined,
  });

  const usingFallback = isError;

  const [localPages, setLocalPages] = useState(1);
  useEffect(() => {
    setLocalPages(1);
  }, [filterKey.q, filterKey.types, filterKey.work, filterKey.locale]);

  const apiPals = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const apiTotal = data?.pages[0]?.total ?? 0;

  const localVisible = filteredLocal.slice(0, localPages * perPage);
  const localHasMore = localVisible.length < filteredLocal.length;

  const pals = usingFallback ? localVisible : apiPals;
  const total = usingFallback ? filteredLocal.length : apiTotal;
  const canLoadMore = usingFallback ? localHasMore : Boolean(hasNextPage);
  const loadingMore = !usingFallback && isFetchingNextPage;
  const showInitialLoading = !usingFallback && isLoading && !data;

  const loadMoreRef = useRef(() => {});
  loadMoreRef.current = () => {
    if (usingFallback) {
      if (localHasMore) setLocalPages((n) => n + 1);
      return;
    }
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  const onLoadMore = useCallback(() => {
    loadMoreRef.current();
  }, []);

  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset list scroll when filters change.
  useEffect(() => {
    listScrollRef.current?.scrollTo({ top: 0 });
  }, [filterKey.q, filterKey.types, filterKey.work]);

  useEffect(() => {
    const root = listScrollRef.current;
    const node = sentinelRef.current;
    if (!root || !node || !canLoadMore) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreRef.current();
        }
      },
      { root, rootMargin: LOAD_MORE_ROOT_MARGIN, threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, pals.length]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg-base text-text-primary">
      <div className="shrink-0">
        <SiteHeader />
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
        {/* Title + filters stay fixed; only the list pane scrolls. */}
        <div className="shrink-0 space-y-4 border-b border-border/80 bg-bg-base px-4 pb-4 pt-5 md:px-6">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {translate("list.title")}
            </h1>
            {usingFallback ? (
              <p
                className="text-sm text-text-tertiary"
                data-testid="pal-api-fallback"
              >
                {translate("list.apiFallback")}
              </p>
            ) : null}
            {isError && error instanceof Error ? (
              <p className="sr-only">{error.message}</p>
            ) : null}
          </header>

          <div className="max-h-[min(40dvh,22rem)] overflow-y-auto overscroll-contain md:max-h-[min(36dvh,20rem)]">
            <PalFilter resultCount={total} />
          </div>
        </div>

        <div
          ref={listScrollRef}
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6",
            "[-webkit-overflow-scrolling:touch]",
          )}
          data-testid="pal-list-scroll"
        >
          <div
            className={cn(
              "transition-opacity duration-[var(--duration-normal)]",
              isFetching && !showInitialLoading && !isFetchingNextPage
                ? "opacity-70"
                : "opacity-100",
            )}
          >
            <PalCardGrid
              pals={pals}
              loading={showInitialLoading}
              onClearFilters={clearFilters}
            />
          </div>

          {pals.length > 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-6"
              data-testid="pal-infinite-footer"
            >
              {canLoadMore ? (
                <>
                  <div
                    ref={sentinelRef}
                    className="h-6 w-full"
                    data-testid="pal-infinite-sentinel"
                    aria-hidden
                  />
                  <p
                    className="text-sm text-text-tertiary"
                    aria-live="polite"
                    data-testid="pal-loading-more"
                  >
                    {loadingMore
                      ? translate("list.loadingMore")
                      : translate("list.scrollForMore")}
                  </p>
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    className={cn(
                      "min-h-11 min-w-[8.5rem] cursor-pointer rounded-lg border border-border px-4 py-2.5 text-sm",
                      "touch-manipulation transition-[border-color,background-color,transform] duration-[var(--duration-fast)]",
                      "hover:border-border-hover hover:bg-bg-hover active:scale-[0.97]",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    )}
                    data-testid="pal-load-more"
                  >
                    {translate("list.loadMore")}
                  </button>
                </>
              ) : (
                <p
                  className="text-sm text-text-tertiary"
                  data-testid="pal-end-of-list"
                >
                  {translate("list.endOfList", { n: total })}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
