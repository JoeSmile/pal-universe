import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ElementBadge } from "@/components/element-badge";
import { PalCard } from "@/components/pal-card";
import { WorkBadge } from "@/components/work-badge";
import { useLocaleStore } from "@/lib/i18n/store";
import type { PalCardData } from "@/lib/pal-types";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useLocaleStore.setState({ locale: "zh", hydrated: true });
});

const samplePal: PalCardData = {
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
};

describe("ElementBadge", () => {
  it("renders localized element label with UI icon", () => {
    const { container } = render(<ElementBadge element="Fire" />);
    expect(screen.getByText("火")).toBeInTheDocument();
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute("data-element", "Fire");
    expect(root.querySelector("img")?.getAttribute("src")).toContain(
      "images%2Fui%2Ffire.png",
    );
  });

  it("switches element label with locale", () => {
    useLocaleStore.setState({ locale: "en", hydrated: true });
    render(<ElementBadge element="Fire" />);
    expect(screen.getByText("Fire")).toBeInTheDocument();
  });

  it("hides label in compact mode", () => {
    render(<ElementBadge element="Fire" compact />);
    expect(screen.queryByText("火")).not.toBeInTheDocument();
    expect(screen.getByLabelText("火")).toBeInTheDocument();
  });
});

describe("WorkBadge", () => {
  it("shows localized work label and level number", () => {
    const { container } = render(<WorkBadge work={{ skill: "mining", level: 3 }} />);
    expect(screen.getByText("挖矿")).toBeInTheDocument();
    expect(screen.getByLabelText("等级 3")).toHaveTextContent("3");
    expect(container.firstChild).toHaveAttribute("data-work", "mining");
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "images%2Fui%2Fmining.png",
    );
  });

  it("switches work label with locale", () => {
    useLocaleStore.setState({ locale: "en", hydrated: true });
    render(<WorkBadge work={{ skill: "mining", level: 3 }} />);
    expect(screen.getByText("Mining")).toBeInTheDocument();
    expect(screen.getByLabelText("Level 3")).toHaveTextContent("3");
  });

  it("shows icon and level only in compact mode", () => {
    render(<WorkBadge work={{ skill: "mining", level: 3 }} compact />);
    expect(screen.queryByText("挖矿")).not.toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

describe("PalCard", () => {
  it("places element icons before deck id on the image", () => {
    useLocaleStore.setState({ locale: "en", hydrated: true });
    const { container } = render(<PalCard pal={samplePal} />);

    expect(screen.getByRole("heading", { name: "Anubis" })).toBeInTheDocument();
    expect(screen.queryByText("Ground")).not.toBeInTheDocument();
    const badge = container.querySelector('[data-element="Ground"]');
    const deck = screen.getByText("#139");
    expect(badge).toBeTruthy();
    expect(deck).toBeInTheDocument();
    const row = badge?.parentElement;
    expect(row?.contains(deck)).toBe(true);
    expect(
      Array.from(row?.children ?? []).indexOf(badge as Element),
    ).toBeLessThan(Array.from(row?.children ?? []).indexOf(deck));
  });

  it("renders name with icon-only element and work badges", () => {
    useLocaleStore.setState({ locale: "en", hydrated: true });
    const { container } = render(<PalCard pal={samplePal} />);

    expect(screen.getByRole("heading", { name: "Anubis" })).toBeInTheDocument();
    expect(screen.queryByText("阿努比斯")).not.toBeInTheDocument();
    expect(screen.queryByText("Mining")).not.toBeInTheDocument();
    expect(screen.queryByText("Transport")).not.toBeInTheDocument();
    expect(container.querySelector('[data-element="Ground"]')).toBeTruthy();
    expect(container.querySelector('[data-work="mining"]')).toBeTruthy();
    expect(screen.getByLabelText("Rarity 4")).toBeInTheDocument();
  });

  it("does not reveal base stats on hover", () => {
    render(<PalCard pal={samplePal} />);
    expect(screen.queryByTestId("pal-card-stats")).not.toBeInTheDocument();
  });
});
