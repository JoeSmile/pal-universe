"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import palNames from "@/data/pal-names.json";
import { cn } from "@/lib/utils";
import {
  MIN_QUERY_LENGTH,
  searchPals,
  type PalName,
  type PalSearchResult,
} from "@/lib/search-pals";

const pals = palNames as PalName[];

const springGentle = { type: "spring" as const, stiffness: 200, damping: 30 };

interface SearchBarProps {
  className?: string;
  /** Simulated delay to exercise loading state in tests / UX */
  searchDelayMs?: number;
}

export function SearchBar({ className, searchDelayMs = 80 }: SearchBarProps): React.ReactElement {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = window.setTimeout(() => {
      setResults(searchPals(pals, trimmed));
      setIsLoading(false);
    }, searchDelayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, searchDelayMs]);

  function handleClear(): void {
    setQuery("");
    setResults([]);
    setIsLoading(false);
  }

  return (
    <div className={cn("w-full max-w-xl", className)}>
      <label htmlFor={inputId} className="sr-only">
        搜索帕鲁
      </label>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3",
          "shadow-lg shadow-black/20 transition-[border-color,box-shadow] duration-[var(--duration-fast)]",
          "focus-within:border-accent focus-within:shadow-[var(--shadow-glow-accent)]",
        )}
      >
        <Search
          className="size-5 shrink-0 text-text-tertiary"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索帕鲁（中/英文）…"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-base text-text-primary outline-none",
            "placeholder:text-text-tertiary",
          )}
        />
        {isLoading ? (
          <Loader2
            className="size-4 shrink-0 animate-spin text-accent"
            aria-label="搜索中"
          />
        ) : null}
        {query.length > 0 && !isLoading ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-primary"
            aria-label="清除搜索"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {results.length > 0 ? (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={springGentle}
            className="mt-3 overflow-hidden rounded-xl border border-border bg-bg-surface shadow-lg"
          >
            {results.map((pal, index) => (
              <motion.li
                key={`${pal.id}-${pal.name}`}
                role="option"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springGentle, delay: index * 0.03 }}
                className={cn(
                  "border-b border-border px-4 py-3 last:border-b-0",
                  "cursor-pointer transition-colors hover:bg-bg-hover",
                )}
              >
                <span className="block text-sm font-medium text-text-primary">
                  {pal.label}
                </span>
                {pal.id ? (
                  <span className="mt-0.5 block text-xs text-text-secondary">
                    #{pal.id}
                  </span>
                ) : null}
              </motion.li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>

      {query.trim().length >= MIN_QUERY_LENGTH && !isLoading && results.length === 0 ? (
        <p className="mt-3 text-center text-sm text-text-secondary">
          未找到匹配的帕鲁
        </p>
      ) : null}
    </div>
  );
}
