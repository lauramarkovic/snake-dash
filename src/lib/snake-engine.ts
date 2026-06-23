// Pure Snake game engine — no React, fully testable.

export type Mode = "walls" | "passthrough";
export type Dir = "up" | "down" | "left" | "right";
export type Cell = { x: number; y: number };

export interface GameState {
  mode: Mode;
  width: number;
  height: number;
  snake: Cell[]; // head is snake[0]
  dir: Dir;
  pendingDir: Dir;
  food: Cell;
  score: number;
  alive: boolean;
  tick: number;
}

export const DEFAULT_SIZE = 20;

const DIRS: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 0x100000000;
    return s / 0x100000000;
  };
}

export function createGame(mode: Mode, size = DEFAULT_SIZE, seed = Date.now()): GameState {
  const rand = rng(seed);
  const start: Cell = { x: Math.floor(size / 2), y: Math.floor(size / 2) };
  const snake = [start, { x: start.x - 1, y: start.y }, { x: start.x - 2, y: start.y }];
  return {
    mode,
    width: size,
    height: size,
    snake,
    dir: "right",
    pendingDir: "right",
    food: placeFood(snake, size, size, rand),
    score: 0,
    alive: true,
    tick: 0,
  };
}

function placeFood(snake: Cell[], w: number, h: number, rand: () => number): Cell {
  const taken = new Set(snake.map((c) => `${c.x},${c.y}`));
  const free: Cell[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (!free.length) return snake[0];
  return free[Math.floor(rand() * free.length)];
}

export function setDirection(state: GameState, dir: Dir): GameState {
  if (OPPOSITE[state.dir] === dir) return state;
  return { ...state, pendingDir: dir };
}

export function step(state: GameState, rand: () => number = Math.random): GameState {
  if (!state.alive) return state;
  const dir = state.pendingDir;
  const delta = DIRS[dir];
  const head = state.snake[0];
  let nx = head.x + delta.x;
  let ny = head.y + delta.y;

  if (state.mode === "passthrough") {
    nx = (nx + state.width) % state.width;
    ny = (ny + state.height) % state.height;
  } else if (nx < 0 || ny < 0 || nx >= state.width || ny >= state.height) {
    return { ...state, alive: false, tick: state.tick + 1, dir };
  }

  const newHead: Cell = { x: nx, y: ny };
  const ate = nx === state.food.x && ny === state.food.y;
  const newSnake = [newHead, ...state.snake];
  if (!ate) newSnake.pop();

  // self-collision (skip the tail cell we just removed)
  for (let i = 1; i < newSnake.length; i++) {
    if (newSnake[i].x === nx && newSnake[i].y === ny) {
      return { ...state, alive: false, tick: state.tick + 1, dir };
    }
  }

  return {
    ...state,
    snake: newSnake,
    food: ate ? placeFood(newSnake, state.width, state.height, rand) : state.food,
    score: ate ? state.score + 10 : state.score,
    alive: true,
    dir,
    tick: state.tick + 1,
  };
}
