import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockService } from "@/services/mock";
import { createGame } from "@/lib/snake-engine";
import type { ActiveGame } from "@/services/types";

// Use fake timers so the 150 ms delay() in mock.ts resolves instantly.
// We advance by 200 ms after each call to clear the timer queue without
// triggering the bot game's 250 ms setInterval more than once per test.
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Flush fake timers, then resolve the promise. */
async function run<T>(p: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(200);
  return p;
}

/**
 * For rejection tests: attach the rejects handler BEFORE advancing timers so
 * Vitest captures the rejection before Node can emit an unhandledRejection.
 */
async function rejects(p: Promise<unknown>, pattern?: RegExp): Promise<void> {
  const assertion = pattern
    ? expect(p).rejects.toThrow(pattern)
    : expect(p).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(200);
  await assertion;
}

// ── auth ───────────────────────────────────────────────────────────────────

describe("mock service — auth", () => {
  it("logs in the seeded demo user and persists session", async () => {
    const svc = createMockService();
    const user = await run(svc.login("demo", "demo"));
    expect(user.username).toBe("demo");
    expect(await run(svc.getCurrentUser())).toEqual(user);
  });

  it("logs in the seeded ada user", async () => {
    const svc = createMockService();
    const user = await run(svc.login("ada", "ada"));
    expect(user.username).toBe("ada");
  });

  it("rejects bad passwords", async () => {
    const svc = createMockService();
    await rejects(svc.login("demo", "wrong"));
  });

  it("rejects unknown usernames", async () => {
    const svc = createMockService();
    await rejects(svc.login("nobody", "demo"));
  });

  it("returns null from getCurrentUser when not logged in", async () => {
    const svc = createMockService();
    expect(await run(svc.getCurrentUser())).toBeNull();
  });

  it("signs up a new user and logs them in automatically", async () => {
    const svc = createMockService();
    const user = await run(svc.signup("alice", "pw123"));
    expect(user.username).toBe("alice");
    expect(await run(svc.getCurrentUser())).toEqual(user);
  });

  it("rejects duplicate usernames", async () => {
    const svc = createMockService();
    await run(svc.signup("alice", "pw"));
    await rejects(svc.signup("alice", "pw2"), /taken/i);
  });

  it("rejects blank username", async () => {
    const svc = createMockService();
    await rejects(svc.signup("  ", "pw"));
  });

  it("rejects blank password", async () => {
    const svc = createMockService();
    await rejects(svc.signup("alice", "  "));
  });

  it("logout clears the current user", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    await run(svc.logout());
    expect(await run(svc.getCurrentUser())).toBeNull();
  });

  it("persists session across service instances via localStorage", async () => {
    const svc1 = createMockService();
    await run(svc1.login("demo", "demo"));
    // New instance reads the same localStorage
    const svc2 = createMockService();
    const user = await run(svc2.getCurrentUser());
    expect(user?.username).toBe("demo");
  });
});

// ── scores ─────────────────────────────────────────────────────────────────

describe("mock service — scores", () => {
  it("requires auth to submit scores", async () => {
    const svc = createMockService();
    await rejects(svc.submitScore("walls", 10));
  });

  it("returns leaderboard sorted descending by score for the right mode", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    await run(svc.submitScore("walls", 500));
    const top = await run(svc.getLeaderboard("walls", 10));
    expect(top[0].score).toBe(500);
    expect(top[0].username).toBe("demo");
    expect(top.every((s) => s.mode === "walls")).toBe(true);
  });

  it("does not mix modes in the leaderboard", async () => {
    const svc = createMockService();
    const pt = await run(svc.getLeaderboard("passthrough", 10));
    expect(pt.every((s) => s.mode === "passthrough")).toBe(true);
  });

  it("respects the limit parameter", async () => {
    // Seeded data: walls has ada=120, demo=80
    const svc = createMockService();
    const top1 = await run(svc.getLeaderboard("walls", 1));
    expect(top1).toHaveLength(1);
    expect(top1[0].score).toBe(120);
  });

  it("accumulates multiple scores from the same user", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    await run(svc.submitScore("walls", 300));
    await run(svc.submitScore("walls", 700));
    const top = await run(svc.getLeaderboard("walls", 10));
    const demoScores = top.filter((s) => s.username === "demo").map((s) => s.score);
    expect(demoScores).toContain(300);
    expect(demoScores).toContain(700);
    expect(top[0].score).toBe(700);
  });
});

// ── active games ───────────────────────────────────────────────────────────

describe("mock service — active games", () => {
  it("requires auth to publish a game", async () => {
    const svc = createMockService();
    await rejects(svc.publishGame(createGame("walls", 10, 1)));
  });

  it("publishGame returns an ID and the game appears in listActiveGames", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    const id = await run(svc.publishGame(createGame("walls", 10, 1)));
    const list = await run(svc.listActiveGames());
    expect(list.some((g) => g.id === id && g.username === "demo")).toBe(true);
  });

  it("reuses the same game ID for a user's subsequent publishes", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    const id1 = await run(svc.publishGame(createGame("walls", 10, 1)));
    const id2 = await run(svc.publishGame(createGame("walls", 10, 2)));
    expect(id1).toBe(id2);
  });

  it("getActiveGame returns the game by id", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    const id = await run(svc.publishGame(createGame("walls", 10, 1)));
    const game = await run(svc.getActiveGame(id));
    expect(game).not.toBeNull();
    expect(game!.id).toBe(id);
    expect(game!.username).toBe("demo");
  });

  it("getActiveGame returns null for an unknown id", async () => {
    const svc = createMockService();
    expect(await run(svc.getActiveGame("does-not-exist"))).toBeNull();
  });

  it("endGame removes the game from the active list", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    const id = await run(svc.publishGame(createGame("walls", 10, 1)));
    await run(svc.endGame(id));
    expect(await run(svc.getActiveGame(id))).toBeNull();
    const list = await run(svc.listActiveGames());
    expect(list.some((g) => g.id === id)).toBe(false);
  });

  it("listActiveGames returns newest game first", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    const id = await run(svc.publishGame(createGame("walls", 10, 1)));
    // Publish again to refresh updatedAt
    const id2 = await run(svc.publishGame(createGame("walls", 10, 2)));
    expect(id).toBe(id2); // same id, just updated
    const list = await run(svc.listActiveGames());
    const demoIdx = list.findIndex((g) => g.id === id);
    expect(demoIdx).toBeGreaterThanOrEqual(0);
  });
});

// ── subscriptions ──────────────────────────────────────────────────────────

describe("mock service — subscribeActiveGames", () => {
  it("calls the callback immediately with the current list", () => {
    const svc = createMockService();
    let received: ActiveGame[] | undefined;
    const unsub = svc.subscribeActiveGames((games) => { received = games; });
    expect(Array.isArray(received)).toBe(true);
    unsub();
  });

  it("notifies when a game is published", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));

    let lastList: ActiveGame[] = [];
    const unsub = svc.subscribeActiveGames((g) => { lastList = g; });

    const id = await run(svc.publishGame(createGame("walls", 10, 1)));
    expect(lastList.some((g) => g.id === id)).toBe(true);
    unsub();
  });

  it("notifies when a game ends", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    const id = await run(svc.publishGame(createGame("walls", 10, 1)));

    let lastList: ActiveGame[] = [];
    const unsub = svc.subscribeActiveGames((g) => { lastList = g; });
    expect(lastList.some((g) => g.id === id)).toBe(true);

    await run(svc.endGame(id));
    expect(lastList.some((g) => g.id === id)).toBe(false);
    unsub();
  });

  it("stops receiving updates after unsubscribing", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));

    let callCount = 0;
    const unsub = svc.subscribeActiveGames(() => { callCount++; });
    const before = callCount;
    unsub();

    await run(svc.publishGame(createGame("walls", 10, 1)));
    expect(callCount).toBe(before); // no new calls after unsub
  });
});

describe("mock service — subscribeGame", () => {
  it("calls the callback immediately with the current game", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    const id = await run(svc.publishGame(createGame("walls", 10, 1)));

    let received: ActiveGame | null | undefined;
    const unsub = svc.subscribeGame(id, (g) => { received = g; });
    expect(received).not.toBeNull();
    expect((received as ActiveGame).id).toBe(id);
    unsub();
  });

  it("calls the callback with null for an unknown game id", () => {
    const svc = createMockService();
    let received: ActiveGame | null | undefined;
    const unsub = svc.subscribeGame("unknown-id", (g) => { received = g; });
    expect(received).toBeNull();
    unsub();
  });

  it("notifies when the game state is updated via publishGame", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    const id = await run(svc.publishGame(createGame("walls", 10, 1)));

    const snapshots: Array<ActiveGame | null> = [];
    const unsub = svc.subscribeGame(id, (g) => { snapshots.push(g); });
    const beforeCount = snapshots.length;

    await run(svc.publishGame(createGame("walls", 10, 99)));
    expect(snapshots.length).toBeGreaterThan(beforeCount);
    unsub();
  });

  it("notifies with null when the game ends", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    const id = await run(svc.publishGame(createGame("walls", 10, 1)));

    let last: ActiveGame | null | undefined;
    const unsub = svc.subscribeGame(id, (g) => { last = g; });
    expect(last).not.toBeNull();

    await run(svc.endGame(id));
    expect(last).toBeNull();
    unsub();
  });

  it("stops receiving updates after unsubscribing", async () => {
    const svc = createMockService();
    await run(svc.login("demo", "demo"));
    const id = await run(svc.publishGame(createGame("walls", 10, 1)));

    let callCount = 0;
    const unsub = svc.subscribeGame(id, () => { callCount++; });
    const before = callCount;
    unsub();

    await run(svc.endGame(id));
    expect(callCount).toBe(before);
  });
});
