import type { GameState, Mode } from "@/lib/snake-engine";
import type { ActiveGame, ScoreEntry, SnakeService, User } from "./types";

// In-memory store with optional localStorage persistence for users/scores.

type Stored = {
  users: Array<User & { password: string }>;
  scores: ScoreEntry[];
  currentUserId: string | null;
};

const KEY = "snake-mock-v1";

function load(): Stored {
  if (typeof localStorage === "undefined") {
    return { users: seedUsers(), scores: seedScores(), currentUserId: null };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const init: Stored = { users: seedUsers(), scores: seedScores(), currentUserId: null };
      localStorage.setItem(KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw);
  } catch {
    return { users: seedUsers(), scores: seedScores(), currentUserId: null };
  }
}

function save(s: Stored) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(s));
  }
}

function seedUsers(): Array<User & { password: string }> {
  return [
    { id: "u-demo", username: "demo", password: "demo" },
    { id: "u-ada", username: "ada", password: "ada" },
  ];
}

function seedScores(): ScoreEntry[] {
  const now = Date.now();
  return [
    { id: "s1", userId: "u-ada", username: "ada", mode: "walls", score: 120, createdAt: now - 60000 },
    { id: "s2", userId: "u-demo", username: "demo", mode: "walls", score: 80, createdAt: now - 50000 },
    { id: "s3", userId: "u-ada", username: "ada", mode: "passthrough", score: 200, createdAt: now - 40000 },
    { id: "s4", userId: "u-demo", username: "demo", mode: "passthrough", score: 90, createdAt: now - 30000 },
  ];
}

export function createMockService(): SnakeService {
  let store = load();

  // Live games are in-memory only.
  const activeGames = new Map<string, ActiveGame>();
  const listListeners = new Set<(g: ActiveGame[]) => void>();
  const gameListeners = new Map<string, Set<(g: ActiveGame | null) => void>>();

  function notifyList() {
    const list = Array.from(activeGames.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    listListeners.forEach((cb) => cb(list));
  }
  function notifyGame(id: string) {
    const set = gameListeners.get(id);
    if (!set) return;
    const g = activeGames.get(id) ?? null;
    set.forEach((cb) => cb(g));
  }

  // Seed a fake "other player" game that ticks on its own so /watch has something to show.
  seedDemoGame(activeGames, notifyList, notifyGame);

  const requireUser = (): User => {
    const u = store.users.find((x) => x.id === store.currentUserId);
    if (!u) throw new Error("Not authenticated");
    return { id: u.id, username: u.username };
  };

  return {
    async getCurrentUser() {
      const u = store.users.find((x) => x.id === store.currentUserId);
      return u ? { id: u.id, username: u.username } : null;
    },
    async login(username, password) {
      await delay();
      const u = store.users.find((x) => x.username === username && x.password === password);
      if (!u) throw new Error("Invalid username or password");
      store.currentUserId = u.id;
      save(store);
      return { id: u.id, username: u.username };
    },
    async signup(username, password) {
      await delay();
      if (!username.trim() || !password.trim()) throw new Error("Username and password required");
      if (store.users.some((x) => x.username === username)) throw new Error("Username taken");
      const user = { id: `u-${Date.now()}`, username, password };
      store.users.push(user);
      store.currentUserId = user.id;
      save(store);
      return { id: user.id, username: user.username };
    },
    async logout() {
      store.currentUserId = null;
      save(store);
    },
    async submitScore(mode, score) {
      const user = requireUser();
      const entry: ScoreEntry = {
        id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        username: user.username,
        mode,
        score,
        createdAt: Date.now(),
      };
      store.scores.push(entry);
      save(store);
    },
    async getLeaderboard(mode, limit = 10) {
      return store.scores
        .filter((s) => s.mode === mode)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },
    async publishGame(state: GameState) {
      const user = requireUser();
      const existing = Array.from(activeGames.values()).find((g) => g.userId === user.id);
      const id = existing?.id ?? `g-${user.id}-${Date.now()}`;
      const game: ActiveGame = {
        id,
        userId: user.id,
        username: user.username,
        mode: state.mode,
        state,
        updatedAt: Date.now(),
      };
      activeGames.set(id, game);
      notifyList();
      notifyGame(id);
      return id;
    },
    async endGame(gameId) {
      if (activeGames.delete(gameId)) {
        notifyList();
        notifyGame(gameId);
      }
    },
    async listActiveGames() {
      return Array.from(activeGames.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    },
    async getActiveGame(id) {
      return activeGames.get(id) ?? null;
    },
    subscribeActiveGames(cb) {
      listListeners.add(cb);
      cb(Array.from(activeGames.values()).sort((a, b) => b.updatedAt - a.updatedAt));
      return () => listListeners.delete(cb);
    },
    subscribeGame(id, cb) {
      let set = gameListeners.get(id);
      if (!set) {
        set = new Set();
        gameListeners.set(id, set);
      }
      set.add(cb);
      cb(activeGames.get(id) ?? null);
      return () => {
        set!.delete(cb);
        if (!set!.size) gameListeners.delete(id);
      };
    },
  };
}

function delay(ms = 150) {
  return new Promise((r) => setTimeout(r, ms));
}

function seedDemoGame(
  map: Map<string, ActiveGame>,
  notifyList: () => void,
  notifyGame: (id: string) => void,
) {
  if (typeof window === "undefined") return;
  // Lazy import to avoid SSR loop on the engine
  import("@/lib/snake-engine").then(({ createGame, step, setDirection }) => {
    let state = createGame("passthrough", 20, 42);
    const id = "g-bot-ada";
    const game: ActiveGame = {
      id,
      userId: "u-ada",
      username: "ada (bot)",
      mode: "passthrough",
      state,
      updatedAt: Date.now(),
    };
    map.set(id, game);
    notifyList();

    const dirs = ["right", "down", "left", "up"] as const;
    let i = 0;
    setInterval(() => {
      if (!state.alive) {
        state = createGame("passthrough", 20, Date.now());
      } else if (Math.random() < 0.2) {
        i = (i + 1) % dirs.length;
        state = setDirection(state, dirs[i]);
      }
      state = step(state);
      const updated: ActiveGame = { ...game, state, updatedAt: Date.now() };
      map.set(id, updated);
      notifyList();
      notifyGame(id);
    }, 250);
  });
}
