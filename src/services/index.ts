import { createMockService } from "./mock";
import type { SnakeService } from "./types";

// Single source of truth for every backend call. Swap this to a real impl later;
// nothing in the app should import from "./mock" directly.
let service: SnakeService = createMockService();

export function getService(): SnakeService {
  return service;
}

export function setService(s: SnakeService) {
  service = s;
}

export type { SnakeService } from "./types";
export type { User, ScoreEntry, ActiveGame } from "./types";
