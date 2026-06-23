import { beforeEach, describe, expect, it } from "vitest";
import { createMockService } from "@/services/mock";
import { createGame } from "@/lib/snake-engine";

beforeEach(() => {
  localStorage.clear();
});

describe("mock service — auth", () => {
  it("logs in the seeded demo user", async () => {
    const svc = createMockService();
    const user = await svc.login("demo", "demo");
    expect(user.username).toBe("demo");
    expect(await svc.getCurrentUser()).toEqual(user);
  });

  it("rejects bad passwords", async () => {
    const svc = createMockService();
    await expect(svc.login("demo", "nope")).rejects.toThrow();
  });

  it("signs up new users and prevents duplicates", async () => {
    const svc = createMockService();
    const user = await svc.signup("alice", "pw");
    expect(user.username).toBe("alice");
    await expect(svc.signup("alice", "pw")).rejects.toThrow(/taken/i);
  });

  it("logout clears current user", async () => {
    const svc = createMockService();
    await svc.login("demo", "demo");
    await svc.logout();
    expect(await svc.getCurrentUser()).toBeNull();
  });
});

describe("mock service — scores", () => {
  it("sorts leaderboard descending per mode", async () => {
    const svc = createMockService();
    await svc.login("demo", "demo");
    await svc.submitScore("walls", 500);
    const top = await svc.getLeaderboard("walls", 5);
    expect(top[0].score).toBe(500);
    expect(top[0].username).toBe("demo");
    // walls leaderboard should not include passthrough scores
    expect(top.every((s) => s.mode === "walls")).toBe(true);
  });

  it("requires auth to submit scores", async () => {
    const svc = createMockService();
    await expect(svc.submitScore("walls", 10)).rejects.toThrow();
  });
});

describe("mock service — active games", () => {
  it("publishes and lists the current player's game", async () => {
    const svc = createMockService();
    await svc.login("demo", "demo");
    const id = await svc.publishGame(createGame("walls", 10, 1));
    const list = await svc.listActiveGames();
    expect(list.some((g) => g.id === id && g.username === "demo")).toBe(true);
  });

  it("notifies subscribers when a game updates and ends", async () => {
    const svc = createMockService();
    await svc.login("demo", "demo");
    const id = await svc.publishGame(createGame("walls", 10, 1));

    let last: unknown = undefined;
    const unsub = svc.subscribeGame(id, (g) => { last = g; });
    expect(last).not.toBeNull();

    await svc.endGame(id);
    expect(last).toBeNull();
    unsub();
  });
});
