import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PalDetail, statBarColor } from "@/components/pal-detail";
import type { PalDetailData } from "@/lib/api/pal-detail";
import { useLocaleStore } from "@/lib/i18n/store";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

afterEach(() => {
  cleanup();
  push.mockClear();
});

beforeEach(() => {
  useLocaleStore.setState({ locale: "en", hydrated: true });
});

const samplePal: PalDetailData = {
  name: "Anubis",
  name_cn: "阿努比斯",
  deck_id: "139",
  elements: ["Ground"],
  rarity: 4,
  size: "M",
  price: 3217,
  nocturnal: false,
  movement: { walk: 80, run: 800, sprint: 1000 },
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
  partner_skill: {
    name: "Guardian of the Desert",
    effect: "While fighting together, Ground Pals get attack boost.",
  },
  skills: [
    { name: "Sand Blast", element: "Ground", power: 120, cooldown: 12, effect: "Damage" },
    { name: "Rock Lance", element: "Ground", power: 100, cooldown: 10, effect: "Knockback" },
    { name: "Stone Wall", element: "Ground", power: 0, cooldown: 30, effect: "+Def" },
    { name: "Quake", element: "Ground", power: 140, cooldown: 18, effect: "AoE" },
    { name: "Crush", element: "Ground", power: 90, cooldown: 8, effect: "Melee" },
  ],
  drops: [
    { name: "Bone", chance: 100, use: "Material" },
    { name: "Large Pal Soul", chance: 30, use: "Upgrade" },
    { name: "Ground Radiant Gem", chance: null, use: "" },
  ],
  breeding_rank: 480,
  location: {
    spawn_count: 36,
    region: "palpagos",
    center: [-576.1, -30.5],
    level_range: [55, 72],
  },
  image: "/images/pals/Anubis.webp",
};

describe("statBarColor", () => {
  it("returns warmer (redder) hue for low ratio and greener for high", () => {
    const low = statBarColor(0.1);
    const high = statBarColor(0.9);
    expect(low).toContain("oklch");
    expect(high).toContain("oklch");
    expect(low).not.toBe(high);
  });
});

describe("PalDetail", () => {
  it("renders hero basics: name, element, rarity, deck id, size, partner skill", () => {
    render(<PalDetail pal={samplePal} />);

    expect(screen.getByRole("heading", { level: 1, name: "Anubis" })).toBeInTheDocument();
    expect(screen.getAllByText("Ground").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Rarity 4")).toBeInTheDocument();
    expect(screen.getByText("#139")).toBeInTheDocument();
    expect(screen.getByText(/Size:\s*M/)).toBeInTheDocument();
    expect(screen.getByTestId("detail-partner-skill")).toHaveTextContent(
      "Guardian of the Desert",
    );
  });

  it("shows six animated stat bars with value/max", () => {
    render(<PalDetail pal={samplePal} />);
    const stats = screen.getByTestId("detail-stats");
    expect(within(stats).getByText("120/200")).toBeInTheDocument();
    expect(within(stats).getAllByText("130/200")).toHaveLength(2);
    expect(screen.getByTestId("stat-bar-hp")).toBeInTheDocument();
    expect(screen.getByTestId("stat-bar-stamina")).toBeInTheDocument();
  });

  it("collapses skills past 3 and expands on toggle", () => {
    render(<PalDetail pal={samplePal} />);
    expect(screen.getByText("Sand Blast")).toBeInTheDocument();
    expect(screen.getByText("Stone Wall")).toBeInTheDocument();
    expect(screen.queryByText("Quake")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Show all 5 skills/i }));
    expect(screen.getByText("Quake")).toBeInTheDocument();
    expect(screen.getByText("Crush")).toBeInTheDocument();
  });

  it("links breeding routes with target query and colors rare rank", () => {
    render(<PalDetail pal={samplePal} />);
    const link = screen.getByTestId("breeding-link");
    expect(link).toHaveAttribute("href", "/breeding?target=Anubis");
    expect(screen.getByTestId("breeding-rank")).toHaveTextContent("480");
    expect(screen.getByTestId("breeding-rank")).toHaveTextContent("Rare");
  });

  it("highlights 100% drops and shows location fields", () => {
    render(<PalDetail pal={samplePal} />);
    const drops = screen.getByTestId("detail-drops");
    const guaranteed = within(drops).getByText("Bone").closest("tr");
    expect(guaranteed).toHaveAttribute("data-guaranteed");

    const locations = screen.getByTestId("detail-locations");
    expect(locations).toHaveTextContent("palpagos");
    expect(locations).toHaveTextContent("55–72");
    expect(locations).toHaveTextContent("36");
  });

  it("prefills AI input and navigates to chat on submit", () => {
    render(<PalDetail pal={samplePal} />);
    const input = screen.getByLabelText(/Ask a guide question/i) as HTMLInputElement;
    expect(input.value).toBe("About Anubis: ");

    fireEvent.change(input, {
      target: { value: "About Anubis: best skills?" },
    });
    fireEvent.submit(input.closest("form")!);

    expect(push).toHaveBeenCalledWith(
      "/chat?q=About+Anubis%3A+best+skills%3F&pal=Anubis",
    );
  });

  it("uses Chinese AI prefix in zh locale", () => {
    useLocaleStore.setState({ locale: "zh", hydrated: true });
    render(<PalDetail pal={samplePal} />);
    const input = screen.getByLabelText(/输入攻略问题/i) as HTMLInputElement;
    expect(input.value).toBe("关于 Anubis: ");
  });
});
