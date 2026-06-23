import type { GameState, Mode } from "@/lib/snake-engine";

export interface User {
  id: string;
  username: string;
}

export interface ScoreEntry {
  id: string;
  userId: string;
  username: string;
  mode: Mode;
  score: number;
  createdAt: number;
}

export interface ActiveGame {
  id: string;
  userId: string;
  username: string;
  mode: Mode;
  state: GameState;
  updatedAt: number;
}

export interface SnakeService {
  // auth
  getCurrentUser(): Promise<User | null>;
  login(username: string, password: string): Promise<User>;
  signup(username: string, password: string): Promise<User>;
  logout(): Promise<void>;

  // scores
  submitScore(mode: Mode, score: number): Promise<void>;
  getLeaderboard(mode: Mode, limit?: number): Promise<ScoreEntry[]>;

  // live games
  publishGame(state: GameState): Promise<string>; // returns gameId
  endGame(gameId: string): Promise<void>;
  listActiveGames(): Promise<ActiveGame[]>;
  getActiveGame(gameId: string): Promise<ActiveGame | null>;
  subscribeActiveGames(cb: (games: ActiveGame[]) => void): () => void;
  subscribeGame(gameId: string, cb: (game: ActiveGame | null) => void): () => void;
}
