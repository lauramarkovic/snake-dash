import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiService } from "@/services/api";
import { createGame } from "@/lib/snake-engine";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

beforeEach(() => {
  localStorage.clear();
});

describe("API service", () => {
  it("authenticates, stores the bearer token, and sends it on protected calls", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          { id: "u-demo", username: "demo" },
          { headers: { Authorization: "Bearer test-token" } },
        ),
      )
      .mockResolvedValueOnce(jsonResponse(null, { status: 201 }));
    const service = createApiService({
      baseUrl: "http://backend.test/api",
      fetch: fetchMock,
    });

    await service.login("demo", "demo");
    await service.submitScore("walls", 100);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://backend.test/api/leaderboard",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.any(Headers),
      }),
    );
    const init = fetchMock.mock.calls[1][1] as RequestInit;
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer test-token");
  });

  it("maps unauthenticated current-user and missing-game responses to null", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ error: "not_authenticated", message: "Not authenticated" }, { status: 401 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: "game_not_found", message: "Game not found" }, { status: 404 }),
      );
    const service = createApiService({ baseUrl: "/api", fetch: fetchMock });

    await expect(service.getCurrentUser()).resolves.toBeNull();
    await expect(service.getActiveGame("missing/id")).resolves.toBeNull();
    expect(fetchMock.mock.calls[1][0]).toBe("/api/games/missing%2Fid");
  });

  it("uses the backend game and leaderboard routes", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ gameId: "g-1" }))
      .mockResolvedValueOnce(jsonResponse([]));
    const service = createApiService({ baseUrl: "/api/", fetch: fetchMock });

    await expect(service.publishGame(createGame("walls", 10, 1))).resolves.toBe("g-1");
    await expect(service.getLeaderboard("passthrough", 20)).resolves.toEqual([]);

    expect(fetchMock.mock.calls[0][0]).toBe("/api/games/current");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/leaderboard?mode=passthrough&limit=20");
  });

  it("subscribes to named SSE events and closes the connection", () => {
    const listeners = new Map<string, (event: MessageEvent<string>) => void>();
    const close = vi.fn();
    const createEventSource = vi.fn(() => ({
      addEventListener: (type: string, listener: (event: MessageEvent<string>) => void) =>
        listeners.set(type, listener),
      close,
    }));
    const callback = vi.fn();
    const service = createApiService({
      baseUrl: "/api",
      fetch: vi.fn<typeof fetch>(),
      createEventSource,
    });

    const unsubscribe = service.subscribeActiveGames(callback);
    listeners.get("games")?.(new MessageEvent("games", { data: JSON.stringify([{ id: "g-1" }]) }));

    expect(createEventSource).toHaveBeenCalledWith("/api/games/stream");
    expect(callback).toHaveBeenCalledWith([{ id: "g-1" }]);
    unsubscribe();
    expect(close).toHaveBeenCalledOnce();
  });
});
