import { createApiService } from "./api";
import type { SnakeService } from "./types";

// Single source of truth for every backend call. Tests can replace this with
// setService without changing application code.
let service: SnakeService = createApiService();

export function getService(): SnakeService {
  return service;
}

export function setService(s: SnakeService) {
  service = s;
}

export type { SnakeService } from "./types";
export type { User, ScoreEntry, ActiveGame } from "./types";
