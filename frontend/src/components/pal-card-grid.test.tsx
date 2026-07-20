import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PalCardGrid } from "@/components/pal-card-grid";
import { PalFilter } from "@/components/pal-filter";
import { useLocaleStore } from "@/lib/i18n/store";
import { getPalCatalog } from "@/lib/pal-catalog";
import {
  filterPals,
  paginatePals,
  usePalFilterStore,
  type FilterElement,
  type FilterWork,
} from "@/lib/pal-filter-store";
import type { PalCardData } from "@/lib/pal-types";
import { useState } from "react";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useLocaleStore.setState({ locale: "zh", hydrated: true });
  usePalFilterStore.setState({
    query: "",
    elements: [],
    works: [],
    page: 1,
    perPage: 24,
  });
});

const samplePals: PalCardData[] = [
  {
    name: "Anubis",
    name_cn: "阿努比斯",
    elements: ["Ground"],
    deck_id: "139",
    rarity: 4,
    size: "M",
    stats: {
      hp: 120,
      melee_attack: 130,
      shot_attack: 130,
      defense: 100,
      support: 100,
      stamina: 100,
    },
    work_orders: [
      { skill: "mining", level: 3 },
      { skill: "transport", level: 2 },
    ],
  },
  {
    name: "Foxparks",
    name_cn: "火绒狐",
    elements: ["Fire"],
    deck_id: "5",
    rarity: 1,
    size: "XS",
    stats: {
      hp: 65,
      melee_attack: 70,
      shot_attack: 75,
      defense: 70,
      support: 100,
      stamina: 100,
    },
    work_orders: [
      { skill: "kindling", level: 1 },
      { skill: "transport", level: 1 },
    ],
  },
  {
    name: "Pengullet",
    name_cn: "企丸丸",
    elements: ["Water", "Ice"],
    deck_id: "10",
    rarity: 1,
    size: "XS",
    stats: {
      hp: 70,
      melee_attack: 70,
      shot_attack: 75,
      defense: 70,
      support: 100,
      stamina: 100,
    },
    work_orders: [
      { skill: "watering", level: 1 },
      { skill: "cooling", level: 1 },
    ],
  },
];

describe("getPalCatalog", () => {
  it("uses unique names suitable as React keys", () => {
    const catalog = getPalCatalog();
    const names = catalog.map((pal) => pal.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("filterPals", () => {
  it("filters by element case-insensitively", () => {
    const result = filterPals(samplePals, {
      query: "",
      elements: ["Fire"] as FilterElement[],
      works: [],
      locale: "zh",
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Foxparks");
  });

  it("filters by work suitability", () => {
    const result = filterPals(samplePals, {
      query: "",
      elements: [],
      works: ["mining"] as FilterWork[],
      locale: "zh",
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Anubis");
  });

  it("paginates filtered results for infinite windows", () => {
    const page1 = paginatePals(samplePals, 1, 2);
    expect(page1.data).toHaveLength(2);
    expect(page1.has_next).toBe(true);
    const page2 = paginatePals(samplePals, 2, 2);
    expect(page2.data).toHaveLength(1);
    expect(page2.has_next).toBe(false);
  });
});

describe("PalCardGrid", () => {
  it("uses responsive grid column classes aligned on mobile", () => {
    render(<PalCardGrid pals={samplePals} />);
    const grid = screen.getByTestId("pal-card-grid");
    expect(grid).toHaveClass("grid-cols-2");
    expect(grid).toHaveClass("sm:grid-cols-3");
    expect(grid).toHaveClass("md:grid-cols-4");
    expect(grid).toHaveClass("lg:grid-cols-5");
    expect(grid).toHaveClass("xl:grid-cols-6");
  });

  it("renders a card per pal", () => {
    render(<PalCardGrid pals={samplePals} />);
    expect(screen.getAllByTestId("pal-card")).toHaveLength(3);
  });

  it("shows empty state and clear action", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<PalCardGrid pals={[]} onClearFilters={onClear} />);

    expect(screen.getByTestId("pal-grid-empty")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "清除筛选" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe("infinite load window", () => {
  function InfiniteHarness(): React.ReactElement {
    const query = usePalFilterStore((s) => s.query);
    const elements = usePalFilterStore((s) => s.elements);
    const works = usePalFilterStore((s) => s.works);
    const locale = useLocaleStore((s) => s.locale);
    const clearFilters = usePalFilterStore((s) => s.clearFilters);
    const [pages, setPages] = useState(1);
    const perPage = 2;
    const filtered = filterPals(samplePals, {
      query,
      elements,
      works,
      locale,
    });
    const visible = filtered.slice(0, pages * perPage);
    const hasMore = visible.length < filtered.length;

    return (
      <div>
        <PalFilter resultCount={filtered.length} />
        <PalCardGrid pals={visible} onClearFilters={clearFilters} />
        {hasMore ? (
          <button
            type="button"
            data-testid="pal-load-more"
            onClick={() => setPages((n) => n + 1)}
          >
            加载更多
          </button>
        ) : (
          <p data-testid="pal-end-of-list">已显示全部 {filtered.length} 只帕鲁</p>
        )}
      </div>
    );
  }

  it("appends the next window when load more is pressed", async () => {
    const user = userEvent.setup();
    render(<InfiniteHarness />);

    expect(screen.getAllByTestId("pal-card")).toHaveLength(2);
    await user.click(screen.getByTestId("pal-load-more"));
    expect(screen.getAllByTestId("pal-card")).toHaveLength(3);
    expect(screen.getByTestId("pal-end-of-list")).toBeInTheDocument();
  });
});

describe("PalFilter + grid integration", () => {
  function Harness(): React.ReactElement {
    const query = usePalFilterStore((s) => s.query);
    const elements = usePalFilterStore((s) => s.elements);
    const works = usePalFilterStore((s) => s.works);
    const locale = useLocaleStore((s) => s.locale);
    const clearFilters = usePalFilterStore((s) => s.clearFilters);
    const filtered = filterPals(samplePals, {
      query,
      elements,
      works,
      locale,
    });

    return (
      <div>
        <PalFilter resultCount={filtered.length} />
        <PalCardGrid pals={filtered} onClearFilters={clearFilters} />
      </div>
    );
  }

  it("updates result count when filtering by element chip", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const elementGroup = screen.getByTestId("pal-filter-elements");
    await user.click(within(elementGroup).getByRole("button", { name: "火" }));

    expect(
      within(screen.getByTestId("pal-result-count")).getByText("1 只帕鲁"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "火绒狐" })).toBeInTheDocument();
  });

  it("filters by work suitability chip", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const workGroup = screen.getByTestId("pal-filter-works");
    await user.click(within(workGroup).getByRole("button", { name: "挖矿" }));

    expect(
      within(screen.getByTestId("pal-result-count")).getByText("1 只帕鲁"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "阿努比斯" })).toBeInTheDocument();
  });

  it("clears filters from the filter bar", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const elementGroup = screen.getByTestId("pal-filter-elements");
    await user.click(within(elementGroup).getByRole("button", { name: "火" }));
    expect(screen.getAllByTestId("pal-card")).toHaveLength(1);

    await user.click(screen.getByTestId("pal-clear-filters"));
    expect(screen.getAllByTestId("pal-card")).toHaveLength(3);
  });
});
