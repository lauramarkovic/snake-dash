import type { Mode } from "@/lib/snake-engine";

export type RunSummary = {
  score: number;
  length: number;
  mode: Mode;
  maxCombo: number;
  speedLevel: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export type DailyChallenge = {
  id: string;
  mode: Mode;
  target: number;
  title: string;
  description: string;
};

const ACHIEVEMENTS_KEY = "snake-dash-achievements";
const DAILY_KEY = "snake-dash-daily-completions";

export function getDailyChallenge(date = new Date()): DailyChallenge {
  const id = date.toISOString().slice(0, 10);
  const seed = Number(id.replaceAll("-", ""));
  const mode: Mode = seed % 2 === 0 ? "walls" : "passthrough";
  const target = 100 + (seed % 5) * 50;
  return {
    id,
    mode,
    target,
    title: `${target} point ${mode === "walls" ? "classic" : "wrap"} run`,
    description: `Score ${target} points in ${mode === "walls" ? "Classic" : "Wrap"} mode today.`,
  };
}

export function achievementCatalog(unlockedIds: Set<string>): Achievement[] {
  return [
    {
      id: "first-bite",
      title: "First bite",
      description: "Finished a run with at least 10 points.",
      unlocked: unlockedIds.has("first-bite"),
    },
    {
      id: "century",
      title: "Century",
      description: "Scored 100 points in one run.",
      unlocked: unlockedIds.has("century"),
    },
    {
      id: "combo-artist",
      title: "Combo artist",
      description: "Reached a ×3 combo.",
      unlocked: unlockedIds.has("combo-artist"),
    },
    {
      id: "speed-runner",
      title: "Speed runner",
      description: "Reached speed level 4.",
      unlocked: unlockedIds.has("speed-runner"),
    },
    {
      id: "long-game",
      title: "Long game",
      description: "Grew to length 15.",
      unlocked: unlockedIds.has("long-game"),
    },
    {
      id: "mode-master",
      title: "Mode master",
      description: "Completed the daily challenge.",
      unlocked: unlockedIds.has("mode-master"),
    },
  ];
}

export function achievementIdsForRun(summary: RunSummary, dailyCompleted: boolean) {
  const ids: string[] = [];
  if (summary.score >= 10) ids.push("first-bite");
  if (summary.score >= 100) ids.push("century");
  if (summary.maxCombo >= 3) ids.push("combo-artist");
  if (summary.speedLevel >= 4) ids.push("speed-runner");
  if (summary.length >= 15) ids.push("long-game");
  if (dailyCompleted) ids.push("mode-master");
  return ids;
}

export function readAchievementIds() {
  if (typeof window === "undefined") return new Set<string>();
  return readStringSet(ACHIEVEMENTS_KEY);
}

export function saveAchievementIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...ids]));
}

export function readDailyCompletions() {
  if (typeof window === "undefined") return new Set<string>();
  return readStringSet(DAILY_KEY);
}

export function saveDailyCompletions(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAILY_KEY, JSON.stringify([...ids]));
}

function readStringSet(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    return new Set(
      Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [],
    );
  } catch {
    return new Set<string>();
  }
}
