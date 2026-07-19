import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuickLinks, QUICK_LINKS } from "@/components/quick-links";

describe("QuickLinks", () => {
  it("renders six feature entry links", () => {
    render(<QuickLinks />);

    expect(screen.getByRole("heading", { name: /功能入口/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(6);

    for (const item of QUICK_LINKS) {
      expect(screen.getByRole("link", { name: new RegExp(item.label) })).toHaveAttribute(
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
