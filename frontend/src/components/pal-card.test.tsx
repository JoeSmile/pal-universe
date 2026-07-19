import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ElementBadge } from "@/components/element-badge";
import { PalCard } from "@/components/pal-card";
import { WorkBadge } from "@/components/work-badge";
import { useLocaleStore } from "@/lib/i18n/store";
import type { PalCardData } from "@/lib/pal-types";

afterEach(() => {
  cleanup();
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
  it("renders element label with token-backed fire styling", () => {
    const { container } = render(<ElementBadge element="Fire" />);
    expect(screen.getByText("火")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-[var(--color-element-fire)]");
  });
});

describe("WorkBadge", () => {
  it("shows work icon label and level dots", () => {
    render(<WorkBadge work={{ skill: "mining", level: 3 }} />);
    expect(screen.getByText("挖矿")).toBeInTheDocument();
    expect(screen.getByLabelText("等级 3")).toBeInTheDocument();
    const dots = screen.getByLabelText("等级 3").querySelectorAll("span");
    expect(dots).toHaveLength(4);
  });
});

describe("PalCard", () => {
  it("renders localized pal name, elements, and work suitability", () => {
    useLocaleStore.setState({ locale: "en", hydrated: true });
    render(<PalCard pal={samplePal} />);

    expect(screen.getByRole("heading", { name: "Anubis" })).toBeInTheDocument();
    expect(screen.queryByText("阿努比斯")).not.toBeInTheDocument();
    expect(screen.getByText("地")).toBeInTheDocument();
    expect(screen.getByText("挖矿")).toBeInTheDocument();
    expect(screen.getByText("运输")).toBeInTheDocument();
    expect(screen.getByLabelText("rarity 4")).toBeInTheDocument();
  });

  it("reveals stat bars on hover", async () => {
    const user = userEvent.setup();
    render(<PalCard pal={samplePal} />);

    expect(screen.queryByTestId("pal-card-stats")).not.toBeInTheDocument();

    await user.hover(screen.getByTestId("pal-card"));

    expect(await screen.findByTestId("pal-card-stats")).toBeInTheDocument();
    expect(screen.getByText(/基础属性|Base stats/i)).toBeInTheDocument();
    expect(screen.getByText("HP")).toBeInTheDocument();
  });
});
