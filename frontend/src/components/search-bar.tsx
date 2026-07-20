"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, Sparkles, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import palsData from "@/data/pals.json";
import palNames from "@/data/pal-names.json";
import { useLocaleStore } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";
import {
  formatPalLabel,
  getMinQueryLength,
  isChatIntent,
  searchPals,
  type PalName,
  type PalSearchResult,
} from "@/lib/search-pals";

interface PalMetaRecord {
  name: string;
  elements: string[];
  rarity: number;
}

const pals = palNames as PalName[];

const metaByName = new Map(
  (palsData as PalMetaRecord[]).map((pal) => [
    pal.name,
    { elements: pal.elements, rarity: pal.rarity },
  ]),
);

const springGentle = { type: "spring" as const, stiffness: 200, damping: 30 };

function enrich(result: PalSearchResult): PalSearchResult {
  const meta = metaByName.get(result.name);
  if (!meta) {
    return result;
  }
  return { ...result, elements: meta.elements, rarity: meta.rarity };
}

function RarityStars({
  rarity,
  label,
}: {
  rarity?: number;
  label: string;
}): React.ReactElement | null {
  if (!rarity) {
    return null;
  }
  return (
    <span className="text-xs tracking-widest text-warning" aria-label={label}>
      {"★".repeat(Math.max(1, Math.min(rarity, 5)))}
    </span>
  );
}

interface SearchBarProps {
  className?: string;
  searchDelayMs?: number;
  onSelectPal?: (pal: PalSearchResult) => void;
  onAskAi?: (query: string) => void;
}

export function SearchBar({
  className,
  searchDelayMs = 80,
  onSelectPal,
  onAskAi,
}: SearchBarProps): React.ReactElement {
  const locale = useLocaleStore((state) => state.locale);
  const translate = useLocaleStore((state) => state.t);
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const skipSearchRef = useRef(false);

  const chatIntent = useMemo(() => isChatIntent(query), [query]);
  const suggestionOnly =
    results.length > 0 && results.every((result) => result.isSuggestion);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < getMinQueryLength(trimmed) || chatIntent) {
      setResults([]);
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    setIsLoading(true);
    const timer = window.setTimeout(() => {
      setResults(searchPals(pals, trimmed, 12, locale).map(enrich));
      setIsLoading(false);
      setActiveIndex(-1);
    }, searchDelayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, searchDelayMs, chatIntent, locale]);

  function handleClear(): void {
    setQuery("");
    setResults([]);
    setIsLoading(false);
    setActiveIndex(-1);
  }

  function selectPal(pal: PalSearchResult): void {
    skipSearchRef.current = true;
    const display = formatPalLabel(pal, locale);
    if (pal.isSuggestion) {
      setQuery(display);
      setResults(searchPals(pals, pal.name, 12, locale).map(enrich));
    } else {
      setQuery(display);
      setResults([]);
    }
    setActiveIndex(-1);
    setIsLoading(false);
    onSelectPal?.(pal);
  }

  function askAi(): void {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    onAskAi?.(trimmed);
  }

  function resolveActiveIndex(): number {
    if (results.length === 0) {
      return -1;
    }
    if (activeIndex >= 0 && activeIndex < results.length) {
      return activeIndex;
    }
    return 0;
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      if (results.length > 0) {
        setResults([]);
        setActiveIndex(-1);
      } else {
        handleClear();
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (chatIntent || (results.length === 0 && query.trim().length > 0)) {
        askAi();
        return;
      }
      const selected = results[resolveActiveIndex()];
      if (selected) {
        selectPal(selected);
      }
      return;
    }

    if (results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => {
        const next = index < 0 ? 0 : index + 1;
        return Math.min(next, results.length - 1);
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => {
        const next = index < 0 ? results.length - 1 : index - 1;
        return Math.max(next, 0);
      });
    }
  }

  const showResults = results.length > 0 && !chatIntent;
  const highlightedIndex = resolveActiveIndex();
  const activeOptionId =
    highlightedIndex >= 0 ? `${listId}-option-${highlightedIndex}` : undefined;
  const showEmpty =
    !chatIntent &&
    !isLoading &&
    query.trim().length >= getMinQueryLength(query) &&
    results.length === 0;

  return (
    <div className={cn("relative w-full max-w-xl", className)}>
      <label htmlFor={inputId} className="sr-only">
        {translate("home.searchLabel")}
      </label>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3",
          "shadow-lg shadow-black/20 transition-[border-color,box-shadow] duration-[var(--duration-fast)]",
          "focus-within:border-accent focus-within:shadow-[var(--shadow-glow-accent)]",
        )}
      >
        <Search className="size-5 shrink-0 text-text-tertiary" aria-hidden="true" />
        <input
          id={inputId}
          type="text"
          inputMode="search"
          enterKeyHint={chatIntent ? "go" : "search"}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={translate("home.searchPlaceholder")}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-base text-text-primary outline-none",
            "placeholder:text-text-tertiary",
          )}
        />
        {isLoading ? (
          <Loader2
            className="size-4 shrink-0 animate-spin text-accent"
            aria-label={translate("home.searching")}
          />
        ) : null}
        {query.length > 0 && !isLoading ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-primary"
            aria-label={translate("home.clearSearch")}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Reserved height so hint text does not shove ChatUsage / links. */}
      <div className="mt-2 flex min-h-5 items-center justify-center text-sm text-text-secondary">
        {showEmpty ? <p>{translate("home.noResults")}</p> : null}
        {!showEmpty && chatIntent && query.trim().length > 0 ? (
          <p>{translate("home.chatHint")}</p>
        ) : null}
      </div>

      {/* Overlay dropdown — does not push page content. */}
      <AnimatePresence>
        {showResults ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={springGentle}
            className={cn(
              "absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl",
              "border border-border bg-bg-surface shadow-xl shadow-black/30",
            )}
          >
            {suggestionOnly ? (
              <p className="border-b border-border px-4 py-2 text-sm text-text-secondary">
                {translate("home.didYouMean")}
              </p>
            ) : null}
            <ul id={listId} role="listbox" className="max-h-[min(40dvh,20rem)] overflow-y-auto">
              {results.map((pal, index) => (
                <li
                  key={`${pal.id}-${pal.name}`}
                  role="presentation"
                  className="border-b border-border last:border-b-0"
                >
                  <button
                    type="button"
                    id={`${listId}-option-${index}`}
                    role="option"
                    aria-selected={index === highlightedIndex}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors hover:bg-bg-hover",
                      index === highlightedIndex && "bg-bg-hover",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectPal(pal)}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-text-primary">
                          {pal.label}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-text-tertiary">
                          #{pal.id}
                          {pal.elements && pal.elements.length > 0
                            ? ` · ${pal.elements.join(" · ")}`
                            : ""}
                        </span>
                      </span>
                      <RarityStars
                        rarity={pal.rarity}
                        label={translate("rarity.label", { n: pal.rarity ?? 0 })}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={askAi}
              className={cn(
                "flex w-full items-center justify-center gap-2 border-t border-border px-4 py-2.5",
                "text-sm text-accent transition-colors hover:bg-bg-hover",
              )}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {translate("home.askAi")}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
