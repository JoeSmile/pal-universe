import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeSearchSection } from "@/components/home-search-section";
import { SearchBar } from "@/components/search-bar";
import { formatPalLabel, searchPals, type PalName } from "@/lib/search-pals";

afterEach(() => {
  cleanup();
});

const samplePals: PalName[] = [
  { id: "139", name: "Anubis", name_cn: "冥王犬", aliases: ["阿努比斯"] },
  { id: "1", name: "Lamball", name_cn: "棉悠悠" },
  { id: "2", name: "Cattiva", name_cn: "捣蛋猫" },
];

describe("searchPals", () => {
  it("does not search until 2 characters", () => {
    expect(searchPals(samplePals, "A")).toEqual([]);
  });

  it("matches English and Chinese names", () => {
    const byEn = searchPals(samplePals, "An");
    expect(byEn.some((p) => p.name === "Anubis")).toBe(true);
    expect(byEn[0]?.label).toBe("Anubis · 冥王犬");

    const byCn = searchPals(samplePals, "冥王");
    expect(byCn.some((p) => p.name === "Anubis")).toBe(true);
  });

  it("matches aliases like 阿努比斯", () => {
    const results = searchPals(samplePals, "阿努");
    expect(results[0]?.name).toBe("Anubis");
  });
});

describe("formatPalLabel", () => {
  it("joins English and Chinese with a middle dot", () => {
    expect(formatPalLabel(samplePals[0]!)).toBe("Anubis · 冥王犬");
  });
});

describe("HomeSearchSection", () => {
  it("renders a single search combobox on the page", () => {
    render(<HomeSearchSection />);
    expect(screen.getAllByRole("combobox", { name: /搜索帕鲁/i })).toHaveLength(1);
    expect(screen.getByTestId("home-search-anchor")).toBeInTheDocument();
  });
});

describe("SearchBar", () => {
  it("shows clear button, loading state, and bilingual results", async () => {
    const user = userEvent.setup();
    render(<SearchBar searchDelayMs={120} />);

    const input = screen.getByRole("combobox", { name: /搜索帕鲁/i });
    await user.type(input, "An");

    expect(await screen.findByLabelText("搜索中")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Anubis · 冥王犬")).toBeInTheDocument();
    });

    const clear = screen.getByRole("button", { name: /清除搜索/i });
    await user.click(clear);

    expect(input).toHaveValue("");
    await waitFor(() => {
      expect(screen.queryByText("Anubis · 冥王犬")).not.toBeInTheDocument();
    });
  });

  it("selects a result on click and notifies callback", async () => {
    const user = userEvent.setup();
    const onSelectPal = vi.fn();
    render(<SearchBar searchDelayMs={20} onSelectPal={onSelectPal} />);

    const input = screen.getByRole("combobox", { name: /搜索帕鲁/i });
    await user.type(input, "An");

    const option = await screen.findByRole("option", { name: /Anubis · 冥王犬/i });
    await user.click(option);

    expect(onSelectPal).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Anubis", name_cn: "冥王犬" }),
    );
    expect(input).toHaveValue("Anubis · 冥王犬");
    await waitFor(() => {
      expect(screen.queryAllByRole("option")).toHaveLength(0);
    });
  });

  it("supports keyboard navigation and Enter to select first result", async () => {
    const user = userEvent.setup();
    const onSelectPal = vi.fn();
    render(<SearchBar searchDelayMs={20} onSelectPal={onSelectPal} />);

    const input = screen.getByRole("combobox", { name: /搜索帕鲁/i });
    await user.type(input, "An");
    await screen.findByRole("option", { name: /Anubis · 冥王犬/i });

    await user.keyboard("{Enter}");

    expect(onSelectPal).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Anubis" }),
    );
    expect(input).toHaveValue("Anubis · 冥王犬");
  });
});
