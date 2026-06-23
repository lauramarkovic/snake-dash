import { describe, expect, it } from "vitest";
import {
  BASE_TICK_MS,
  COMBO_WINDOW_MS,
  MIN_TICK_MS,
  getCombo,
  getCrossedMilestone,
  getSpeedLevel,
  getSpeedProgress,
  getTickMs,
} from "@/lib/game-feel";

describe("game feel", () => {
  it("increases speed level every 70 points", () => {
    expect(getSpeedLevel(0)).toBe(1);
    expect(getSpeedLevel(69)).toBe(1);
    expect(getSpeedLevel(70)).toBe(2);
  });

  it("reduces tick duration without exceeding the speed cap", () => {
    expect(getTickMs(0)).toBe(BASE_TICK_MS);
    expect(getTickMs(70)).toBe(BASE_TICK_MS - 10);
    expect(getTickMs(10_000)).toBe(MIN_TICK_MS);
  });

  it("builds a combo inside the window and resets outside it", () => {
    expect(getCombo(null, 1_000, 0)).toBe(1);
    expect(getCombo(1_000, 1_000 + COMBO_WINDOW_MS, 2)).toBe(3);
    expect(getCombo(1_000, 1_001 + COMBO_WINDOW_MS, 4)).toBe(1);
  });

  it("caps the combo multiplier at five", () => {
    expect(getCombo(1_000, 1_100, 5)).toBe(5);
  });

  it("detects the first crossed milestone", () => {
    expect(getCrossedMilestone(90, 110)).toBe(100);
    expect(getCrossedMilestone(100, 120)).toBeNull();
    expect(getCrossedMilestone(240, 510)).toBe(250);
  });

  it("reports progress within the current speed level", () => {
    expect(getSpeedProgress(0)).toBe(0);
    expect(getSpeedProgress(35)).toBe(50);
    expect(getSpeedProgress(70)).toBe(0);
  });
});
