export const BASE_TICK_MS = 140;
export const MIN_TICK_MS = 68;
export const COMBO_WINDOW_MS = 3_200;
export const MILESTONES = [100, 250, 500, 1_000, 2_000];

export function getSpeedLevel(score: number) {
  return Math.min(9, Math.floor(score / 70) + 1);
}

export function getTickMs(score: number) {
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - (getSpeedLevel(score) - 1) * 10);
}

export function getCombo(previousEatAt: number | null, now: number, currentCombo: number) {
  if (previousEatAt === null || now - previousEatAt > COMBO_WINDOW_MS) return 1;
  return Math.min(5, currentCombo + 1);
}

export function getCrossedMilestone(previousScore: number, nextScore: number) {
  return (
    MILESTONES.find((milestone) => previousScore < milestone && nextScore >= milestone) ?? null
  );
}

export function getSpeedProgress(score: number) {
  const levelStart = (getSpeedLevel(score) - 1) * 70;
  return Math.min(100, ((score - levelStart) / 70) * 100);
}
