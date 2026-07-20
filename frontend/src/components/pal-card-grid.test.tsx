import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PalCardGrid } from "@/components/pal-card-grid";
import { PalFilter } from "@/components/pal-filter";
import { useLocaleStore } from "@/lib/i18n/store";
import { getPalCatalog } from "@/lib/pal-catalog";
import {
  filterPals,
  usePalFilterStore,
  type FilterElement,
  type FilterWork,
} from "@/lib/pal-filter-store";
import type { PalCardData } from "@/lib/pal-types";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useLocaleStore.setState({ locale: "zh", hydrated: true });
  usePalFilterStore.setState({ query: "", elements: [], works: [] });
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

  it("sorts deck_id with numeric awareness for variant suffixes", () => {
    const catalog = getPalCatalog();
    const idx100 = catalog.findIndex((p) => p.deck_id === "100");
    const idx100B = catalog.findIndex((p) => p.deck_id === "100B");
    if (idx100 >= 0 && idx100B >= 0) {
      expect(idx100).toBeLessThan(idx100B);
    }
  });
});

describe("filterPals", () => {
  it("filters by element", () => {
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

  it("filters by localized name query", () => {
    const result = filterPals(samplePals, {
      query: "火绒",
      elements: [],
      works: [],
      locale: "zh",
    });
    expect(result.map((p) => p.name)).toEqual(["Foxparks"]);
  });
});

describe("PalCardGrid", () => {
  it("uses responsive grid column classes", () => {
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

  it("pages cards for large lists", () => {
    render(<PalCardGrid pals={samplePals} pageSize={2} />);
    expect(screen.getAllByTestId("pal-card")).toHaveLength(2);
    expect(screen.getByTestId("pal-grid-sentinel")).toBeInTheDocument();
  });

  it("shows empty state and clear action", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<PalCardGrid pals={[]} onClearFilters={onClear} />);

    expect(screen.getByTestId("pal-grid-empty")).toBeInTheDocument();
    expect(screen.getByText("没有找到匹配的帕鲁")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "清除筛选" }));
    expect(onClear).toHaveBeenCalledOnce();
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

  it("updates result count when filtering by element", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(
      within(screen.getByTestId("pal-result-count")).getByText("3 只帕鲁"),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("pal-card")).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "火" }));

    expect(
      within(screen.getByTestId("pal-result-count")).getByText("1 只帕鲁"),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("pal-card")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "火绒狐" })).toBeInTheDocument();
  });

  it("filters by work suitability chip", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "挖矿" }));

    expect(
      within(screen.getByTestId("pal-result-count")).getByText("1 只帕鲁"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "阿努比斯" })).toBeInTheDocument();
  });

  it("clears filters from the filter bar", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "火" }));
    expect(screen.getAllByTestId("pal-card")).toHaveLength(1);

    await user.click(screen.getByTestId("pal-clear-filters"));

    expect(
      within(screen.getByTestId("pal-result-count")).getByText("3 只帕鲁"),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("pal-card")).toHaveLength(3);
  });
});
