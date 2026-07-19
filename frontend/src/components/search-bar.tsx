"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import palNames from "@/data/pal-names.json";
import { cn } from "@/lib/utils";
import {
  getMinQueryLength,
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
  onSelectPal?: (pal: PalSearchResult) => void;
}

export function SearchBar({
  className,
  searchDelayMs = 80,
  onSelectPal,
}: SearchBarProps): React.ReactElement {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < getMinQueryLength(trimmed)) {
      setResults([]);
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    setIsLoading(true);
    const timer = window.setTimeout(() => {
      setResults(searchPals(pals, trimmed));
      setIsLoading(false);
      setActiveIndex(-1);
    }, searchDelayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, searchDelayMs]);

  function handleClear(): void {
    setQuery("");
    setResults([]);
    setIsLoading(false);
    setActiveIndex(-1);
  }

  function selectPal(pal: PalSearchResult): void {
    skipSearchRef.current = true;
    setQuery(pal.label);
    setResults([]);
    setActiveIndex(-1);
    setIsLoading(false);
    onSelectPal?.(pal);
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
    if (results.length === 0) {
      if (event.key === "Escape") {
        handleClear();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => {
          const next = index < 0 ? 0 : index + 1;
          return Math.min(next, results.length - 1);
        });
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => {
          const next = index < 0 ? results.length - 1 : index - 1;
          return Math.max(next, 0);
        });
        break;
      case "Enter": {
        event.preventDefault();
        const selected = results[resolveActiveIndex()];
        if (selected) {
          selectPal(selected);
        }
        break;
      }
      case "Escape":
        event.preventDefault();
        setResults([]);
        setActiveIndex(-1);
        break;
    }
  }

  const showResults = results.length > 0;
  const highlightedIndex = resolveActiveIndex();
  const activeOptionId =
    highlightedIndex >= 0 ? `${listId}-option-${highlightedIndex}` : undefined;

  return (
    <div className={cn("flex w-full max-w-xl flex-col-reverse md:flex-col", className)}>
      <div>
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
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="搜索帕鲁（中/英文）…"
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

        {query.trim().length >= getMinQueryLength(query) && !isLoading && results.length === 0 ? (
          <p className="mt-3 text-center text-sm text-text-secondary md:mt-3">
            未找到匹配的帕鲁
          </p>
        ) : null}
      </div>

      <AnimatePresence>
        {showResults ? (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={springGentle}
            className={cn(
              "mb-3 max-h-[min(40dvh,20rem)] overflow-y-auto rounded-xl border border-border bg-bg-surface shadow-lg",
              "md:mb-0 md:mt-3",
            )}
          >
            {results.map((pal, index) => (
              <motion.li
                key={`${pal.id}-${pal.name}`}
                role="presentation"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springGentle, delay: index * 0.03 }}
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
                  <span className="block text-sm font-medium text-text-primary">
                    {pal.label}
                  </span>
                  {pal.id ? (
                    <span className="mt-0.5 block text-xs text-text-secondary">
                      #{pal.id}
                    </span>
                  ) : null}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
