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
  it("renders localized element label with token styling", () => {
    const { container } = render(<ElementBadge element="Fire" />);
    expect(screen.getByText("火")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-[var(--color-element-fire)]");
  });

  it("switches element label with locale", () => {
    useLocaleStore.setState({ locale: "en", hydrated: true });
    render(<ElementBadge element="Fire" />);
    expect(screen.getByText("Fire")).toBeInTheDocument();
  });
});

describe("WorkBadge", () => {
  it("shows localized work label and level dots", () => {
    render(<WorkBadge work={{ skill: "mining", level: 3 }} />);
    expect(screen.getByText("挖矿")).toBeInTheDocument();
    expect(screen.getByLabelText("等级 3")).toBeInTheDocument();
    const dots = screen.getByLabelText("等级 3").querySelectorAll("span");
    expect(dots).toHaveLength(4);
  });

  it("switches work label with locale", () => {
    useLocaleStore.setState({ locale: "en", hydrated: true });
    render(<WorkBadge work={{ skill: "mining", level: 3 }} />);
    expect(screen.getByText("Mining")).toBeInTheDocument();
    expect(screen.getByLabelText("Level 3")).toBeInTheDocument();
  });
});

describe("PalCard", () => {
  it("renders English name and English badges in en locale", () => {
    useLocaleStore.setState({ locale: "en", hydrated: true });
    render(<PalCard pal={samplePal} />);

    expect(screen.getByRole("heading", { name: "Anubis" })).toBeInTheDocument();
    expect(screen.queryByText("阿努比斯")).not.toBeInTheDocument();
    expect(screen.getByText("Ground")).toBeInTheDocument();
    expect(screen.getByText("Mining")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByLabelText("Rarity 4")).toBeInTheDocument();
  });

  it("does not reveal base stats on hover", () => {
    render(<PalCard pal={samplePal} />);
    expect(screen.queryByTestId("pal-card-stats")).not.toBeInTheDocument();
  });
});
