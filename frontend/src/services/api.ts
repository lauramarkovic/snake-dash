import type { GameState, Mode } from "@/lib/snake-engine";
import type { ActiveGame, ScoreEntry, SnakeService, User } from "./types";

type ErrorResponse = {
  error?: string;
  message?: string;
};

type EventSourceLike = {
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void;
  close(): void;
};

type ApiServiceOptions = {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  createEventSource?: (url: string) => EventSourceLike;
};

const TOKEN_KEY = "snake-api-token";

class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function defaultBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.VITE_API_BASE_URL) {
    return `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "")}/api`;
  }
  return "http://localhost:8000/api";
}

function getStoredToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function storeToken(token: string | null): void {
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function bearerToken(response: Response): string | null {
  const authorization = response.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}

async function responseError(response: Response): Promise<ApiError> {
  let body: ErrorResponse | null = null;
  try {
    body = (await response.json()) as ErrorResponse;
  } catch {
    // Fall back to the status text when the server did not return JSON.
  }
  return new ApiError(
    response.status,
    body?.message || response.statusText || `Request failed (${response.status})`,
  );
}

export function createApiService(options: ApiServiceOptions = {}): SnakeService {
  const baseUrl = (options.baseUrl ?? defaultBaseUrl()).replace(/\/+$/, "");
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const createEventSource =
    options.createEventSource ?? ((url: string) => new EventSource(url, { withCredentials: true }));

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    const token = getStoredToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init.body != null && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });

    if (!response.ok) throw await responseError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  async function authenticate(path: string, username: string, password: string): Promise<User> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });
    if (!response.ok) throw await responseError(response);
    storeToken(bearerToken(response));
    return (await response.json()) as User;
  }

  function subscribe<T>(path: string, eventName: string, callback: (value: T) => void): () => void {
    const source = createEventSource(`${baseUrl}${path}`);
    source.addEventListener(eventName, (event) => {
      try {
        callback(JSON.parse(event.data) as T);
      } catch (error) {
        console.error(`Invalid ${eventName} event from Snake API`, error);
      }
    });
    return () => source.close();
  }

  return {
    async getCurrentUser() {
      try {
        return await request<User>("/auth/me");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          storeToken(null);
          return null;
        }
        throw error;
      }
    },

    login(username, password) {
      return authenticate("/auth/login", username, password);
    },

    signup(username, password) {
      return authenticate("/auth/signup", username, password);
    },

    async logout() {
      try {
        await request<void>("/auth/logout", { method: "POST" });
      } finally {
        storeToken(null);
      }
    },

    submitScore(mode: Mode, score: number) {
      return request<void>("/leaderboard", {
        method: "POST",
        body: JSON.stringify({ mode, score }),
      });
    },

    getLeaderboard(mode: Mode, limit = 10) {
      const params = new URLSearchParams({ mode, limit: String(limit) });
      return request<ScoreEntry[]>(`/leaderboard?${params}`);
    },

    async publishGame(state: GameState) {
      const response = await request<{ gameId: string }>("/games/current", {
        method: "PUT",
        body: JSON.stringify(state),
      });
      return response.gameId;
    },

    endGame(gameId: string) {
      return request<void>(`/games/${encodeURIComponent(gameId)}`, { method: "DELETE" });
    },

    listActiveGames() {
      return request<ActiveGame[]>("/games/active");
    },

    async getActiveGame(gameId: string) {
      try {
        return await request<ActiveGame>(`/games/${encodeURIComponent(gameId)}`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },

    subscribeActiveGames(callback) {
      return subscribe<ActiveGame[]>("/games/stream", "games", callback);
    },

    subscribeGame(gameId, callback) {
      return subscribe<ActiveGame | null>(
        `/games/${encodeURIComponent(gameId)}/stream`,
        "game",
        callback,
      );
    },
  };
}
