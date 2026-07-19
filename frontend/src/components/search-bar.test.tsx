import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeSearchSection } from "@/components/home-search-section";
import { SearchBar } from "@/components/search-bar";
import { useLocaleStore } from "@/lib/i18n/store";
import {
  formatPalLabel,
  getMinQueryLength,
  searchPals,
  type PalName,
} from "@/lib/search-pals";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useLocaleStore.setState({ locale: "en", hydrated: true });
});

const samplePals: PalName[] = [
  { id: "139", name: "Anubis", name_cn: "阿努比斯", aliases: ["冥王犬"] },
  { id: "2", name: "Cattiva", name_cn: "捣蛋猫" },
  { id: "44", name: "Ribbuny", name_cn: "姬小兔" },
  { id: "27", name: "Mau", name_cn: "喵丝特" },
];

describe("getMinQueryLength", () => {
  it("allows single-character queries for local search", () => {
    expect(getMinQueryLength("猫")).toBe(1);
    expect(getMinQueryLength("A")).toBe(1);
  });
});

describe("searchPals", () => {
  it("does not search until minimum length is met", () => {
    expect(searchPals(samplePals, "")).toEqual([]);
  });

  it("matches fuzzy Chinese substring with one character", () => {
    const results = searchPals(samplePals, "猫", 12, "zh");
    expect(results.some((p) => p.name === "Cattiva")).toBe(true);
    expect(results.some((p) => p.name === "Ribbuny")).toBe(false);
  });

  it("matches English and Chinese names with locale-specific labels", () => {
    const byEn = searchPals(samplePals, "An", 12, "en");
    expect(byEn.some((p) => p.name === "Anubis")).toBe(true);
    expect(byEn[0]?.label).toBe("Anubis");

    const byZh = searchPals(samplePals, "阿努", 12, "zh");
    expect(byZh.some((p) => p.name === "Anubis")).toBe(true);
    expect(byZh[0]?.label).toBe("阿努比斯");
  });

  it("keeps distinct Chinese names for Cattiva and Ribbuny", () => {
    const cattiva = samplePals.find((p) => p.name === "Cattiva");
    const ribbuny = samplePals.find((p) => p.name === "Ribbuny");
    expect(cattiva?.name_cn).toBe("捣蛋猫");
    expect(ribbuny?.name_cn).toBe("姬小兔");
  });

  it("matches aliases like 冥王犬", () => {
    const results = searchPals(samplePals, "冥王", 12, "zh");
    expect(results[0]?.name).toBe("Anubis");
  });
});

describe("formatPalLabel", () => {
  it("shows only one language at a time", () => {
    expect(formatPalLabel(samplePals[0]!, "en")).toBe("Anubis");
    expect(formatPalLabel(samplePals[0]!, "zh")).toBe("阿努比斯");
  });
});

describe("HomeSearchSection", () => {
  it("renders a single search combobox on the page", () => {
    render(<HomeSearchSection />);
    expect(screen.getAllByRole("combobox", { name: /search pals|搜索帕鲁/i })).toHaveLength(1);
    expect(screen.getByTestId("home-search-anchor")).toBeInTheDocument();
  });
});

describe("SearchBar", () => {
  it("shows clear button, loading state, and locale-only results", async () => {
    const user = userEvent.setup();
    render(<SearchBar searchDelayMs={120} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "An");

    expect(await screen.findByLabelText(/searching|搜索中/i)).toBeInTheDocument();

    await screen.findByText("Anubis");
    expect(screen.queryByText("Anubis · 阿努比斯")).not.toBeInTheDocument();

    const clear = screen.getByRole("button", { name: /clear search|清除搜索/i });
    await user.click(clear);

    expect(input).toHaveValue("");
  });

  it("shows results for single Chinese character queries", async () => {
    useLocaleStore.setState({ locale: "zh", hydrated: true });
    const user = userEvent.setup();
    render(<SearchBar searchDelayMs={20} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "猫");

    expect(await screen.findByRole("option", { name: /捣蛋猫/i })).toBeInTheDocument();
  });

  it("selects a result on click and notifies callback", async () => {
    const user = userEvent.setup();
    const onSelectPal = vi.fn();
    render(<SearchBar searchDelayMs={20} onSelectPal={onSelectPal} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "An");

    const option = await screen.findByRole("option", { name: /^Anubis/i });
    await user.click(option);

    expect(onSelectPal).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Anubis", name_cn: "阿努比斯" }),
    );
    expect(input).toHaveValue("Anubis");
  });

  it("supports keyboard navigation and Enter to select first result", async () => {
    const user = userEvent.setup();
    const onSelectPal = vi.fn();
    render(<SearchBar searchDelayMs={20} onSelectPal={onSelectPal} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "An");
    await screen.findByRole("option", { name: /^Anubis/i });

    await user.keyboard("{Enter}");

    expect(onSelectPal).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Anubis" }),
    );
    expect(input).toHaveValue("Anubis");
  });
});
