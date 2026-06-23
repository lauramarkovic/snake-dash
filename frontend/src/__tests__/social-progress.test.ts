import { describe, expect, it } from "vitest";
import { achievementCatalog, achievementIdsForRun, getDailyChallenge } from "@/lib/social-progress";

describe("social progress", () => {
  it("generates a stable daily challenge for a date", () => {
    const date = new Date("2026-06-23T12:00:00Z");
    expect(getDailyChallenge(date)).toEqual(getDailyChallenge(date));
    expect(getDailyChallenge(date).id).toBe("2026-06-23");
  });

  it("unlocks achievements from a qualifying run", () => {
    const ids = achievementIdsForRun(
      { score: 120, length: 16, mode: "walls", maxCombo: 3, speedLevel: 4 },
      true,
    );
    expect(ids).toEqual([
      "first-bite",
      "century",
      "combo-artist",
      "speed-runner",
      "long-game",
      "mode-master",
    ]);
  });

  it("marks catalog entries using stored ids", () => {
    const catalog = achievementCatalog(new Set(["century"]));
    expect(catalog.find((item) => item.id === "century")?.unlocked).toBe(true);
    expect(catalog.find((item) => item.id === "first-bite")?.unlocked).toBe(false);
  });
});
