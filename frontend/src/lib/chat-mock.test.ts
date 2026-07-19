import { describe, expect, it } from "vitest";
import { resolveMockAnswer, streamMockChat } from "@/lib/chat-mock";

describe("chat-mock", () => {
  it("resolves guide answers for common questions", () => {
    expect(resolveMockAnswer("怎么打暗系BOSS")).toMatch(/暗系/);
    expect(resolveMockAnswer("前期抓什么好")).toMatch(/棉悠悠|捣蛋猫/);
  });

  it("streams characters like SSE tokens", async () => {
    const chunks: string[] = [];
    for await (const chunk of streamMockChat("怎么打暗系BOSS", { delayMs: 0 })) {
      chunks.push(chunk);
    }
    expect(chunks.join("")).toBe(resolveMockAnswer("怎么打暗系BOSS"));
    expect(chunks.length).toBeGreaterThan(10);
  });
});
