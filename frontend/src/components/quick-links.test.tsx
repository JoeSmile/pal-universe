import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QuickLinks, QUICK_LINKS } from "@/components/quick-links";
import { useLocaleStore } from "@/lib/i18n/store";

afterEach(() => {
  cleanup();
});

describe("QuickLinks", () => {
  it("renders six feature entry links", () => {
    useLocaleStore.setState({ locale: "zh", hydrated: true });
    render(<QuickLinks />);

    expect(screen.getByRole("heading", { name: /功能入口/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(6);

    for (const item of QUICK_LINKS) {
      expect(screen.getByRole("link", { name: new RegExp(useLocaleStore.getState().t(item.labelKey)) })).toHaveAttribute(
        "href",
        item.href,
      );
    }
  });

  it("uses a responsive grid class for desktop and mobile", () => {
    const { container } = render(<QuickLinks />);
    const grid = container.querySelector("ul");
    expect(grid?.className).toContain("grid-cols-2");
    expect(grid?.className).toContain("md:grid-cols-3");
  });
});
