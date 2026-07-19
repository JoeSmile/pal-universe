import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HotPals } from "@/components/hot-pals";
import { useLocaleStore } from "@/lib/i18n/store";

afterEach(() => {
  cleanup();
});

describe("HotPals", () => {
  it("renders up to eight pals sorted by rarity", () => {
    useLocaleStore.setState({ locale: "en", hydrated: true });
    render(<HotPals />);
    expect(screen.getByRole("heading", { name: /popular pals/i })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(screen.getByText("Bellanoir")).toBeInTheDocument();
  });

  it("enables horizontal snap scrolling on mobile layout classes", () => {
    const { container } = render(<HotPals />);
    const list = container.querySelector("ul");
    expect(list?.className).toContain("overflow-x-auto");
    expect(list?.className).toContain("snap-x");
    expect(list?.className).toContain("md:grid");
  });
});
