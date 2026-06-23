import { describe, expect, it } from "vitest";
import { createGame, setDirection, step } from "@/lib/snake-engine";

// ── createGame ─────────────────────────────────────────────────────────────

describe("createGame", () => {
  it("sets the requested mode", () => {
    expect(createGame("walls", 20, 1).mode).toBe("walls");
    expect(createGame("passthrough", 20, 1).mode).toBe("passthrough");
  });

  it("starts with a 3-cell snake heading right at the grid centre", () => {
    const g = createGame("walls", 20, 1);
    expect(g.snake).toHaveLength(3);
    expect(g.snake[0]).toEqual({ x: 10, y: 10 });
    expect(g.snake[1]).toEqual({ x: 9, y: 10 });
    expect(g.snake[2]).toEqual({ x: 8, y: 10 });
    expect(g.dir).toBe("right");
    expect(g.pendingDir).toBe("right");
  });

  it("starts alive with score 0 and tick 0", () => {
    const g = createGame("walls", 20, 1);
    expect(g.alive).toBe(true);
    expect(g.score).toBe(0);
    expect(g.tick).toBe(0);
  });

  it("records the grid dimensions from the size argument", () => {
    const g = createGame("walls", 15, 1);
    expect(g.width).toBe(15);
    expect(g.height).toBe(15);
  });

  it("places food on a cell not occupied by the snake", () => {
    const g = createGame("walls", 20, 1);
    const snakeCells = new Set(g.snake.map((c) => `${c.x},${c.y}`));
    expect(snakeCells.has(`${g.food.x},${g.food.y}`)).toBe(false);
  });

  it("is deterministic: same seed produces the same food position", () => {
    const a = createGame("walls", 20, 42);
    const b = createGame("walls", 20, 42);
    expect(a.food).toEqual(b.food);
  });

  it("produces different food positions for different seeds", () => {
    const a = createGame("walls", 20, 1);
    const b = createGame("walls", 20, 999);
    // Not guaranteed but extremely likely with the LCG used
    expect(`${a.food.x},${a.food.y}`).not.toBe(`${b.food.x},${b.food.y}`);
  });
});

// ── setDirection ───────────────────────────────────────────────────────────

describe("setDirection", () => {
  it("queues the new direction in pendingDir without changing dir", () => {
    const g = createGame("walls", 20, 1); // dir: right
    const turned = setDirection(g, "up");
    expect(turned.pendingDir).toBe("up");
    expect(turned.dir).toBe("right");
  });

  it("allows turning 90° right→down", () => {
    const g = createGame("walls", 20, 1);
    expect(setDirection(g, "down").pendingDir).toBe("down");
  });

  it("rejects reversing right→left and returns the identical state object", () => {
    const g = createGame("walls", 20, 1);
    const result = setDirection(g, "left");
    expect(result).toBe(g);
    expect(result.pendingDir).toBe("right");
  });

  it("rejects reversing left→right", () => {
    let g = createGame("walls", 20, 1);
    g = { ...g, dir: "left", pendingDir: "left" };
    expect(setDirection(g, "right").pendingDir).toBe("left");
  });

  it("rejects reversing up→down", () => {
    let g = createGame("walls", 20, 1);
    g = { ...g, dir: "up", pendingDir: "up" };
    expect(setDirection(g, "down").pendingDir).toBe("up");
  });

  it("rejects reversing down→up", () => {
    let g = createGame("walls", 20, 1);
    g = { ...g, dir: "down", pendingDir: "down" };
    expect(setDirection(g, "up").pendingDir).toBe("down");
  });

  it("applies pendingDir to dir on the next step", () => {
    let g = createGame("walls", 20, 1);
    g = setDirection(g, "up");
    const next = step(g, () => 0.5);
    expect(next.dir).toBe("up");
    expect(next.snake[0].y).toBe(g.snake[0].y - 1);
  });
});

// ── step — movement ────────────────────────────────────────────────────────

describe("step — movement", () => {
  it("advances the head one cell rightward", () => {
    const g = createGame("walls", 20, 1); // head at (10,10)
    const next = step(g, () => 0.5);
    expect(next.snake[0]).toEqual({ x: 11, y: 10 });
  });

  it("increments the tick counter", () => {
    const g = createGame("walls", 20, 1);
    expect(step(g, () => 0.5).tick).toBe(1);
  });

  it("maintains snake length when not eating food", () => {
    const g = createGame("walls", 20, 1);
    const next = step(g, () => 0.5);
    if (next.score === 0) expect(next.snake).toHaveLength(3);
  });

  it("returns the exact same state when the snake is already dead", () => {
    let g = createGame("walls", 20, 1);
    g = { ...g, alive: false };
    const next = step(g, () => 0.5);
    expect(next).toBe(g);
  });
});

// ── step — eating ──────────────────────────────────────────────────────────

describe("step — eating food", () => {
  function gameAboutToEat() {
    let g = createGame("walls", 10, 1);
    return {
      ...g,
      snake: [{ x: 4, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 5 }],
      food: { x: 5, y: 5 },
      dir: "right" as const,
      pendingDir: "right" as const,
    };
  }

  it("grows the snake by one cell", () => {
    const next = step(gameAboutToEat(), () => 0.5);
    expect(next.snake).toHaveLength(4);
  });

  it("increases the score by 10", () => {
    const next = step(gameAboutToEat(), () => 0.5);
    expect(next.score).toBe(10);
  });

  it("accumulates score over multiple food items", () => {
    let g = gameAboutToEat();
    const s1 = step(g, () => 0.99);
    const s2 = step({ ...s1, food: { x: 6, y: 5 } }, () => 0.5);
    expect(s2.score).toBe(20);
  });

  it("places new food not on the snake after eating", () => {
    const next = step(gameAboutToEat(), () => 0.5);
    const snakeCells = new Set(next.snake.map((c) => `${c.x},${c.y}`));
    expect(snakeCells.has(`${next.food.x},${next.food.y}`)).toBe(false);
  });

  it("does not change food position when not eating", () => {
    const g = createGame("walls", 20, 1);
    const next = step(g, () => 0.5);
    if (next.score === 0) expect(next.food).toEqual(g.food);
  });
});

// ── step — walls mode ──────────────────────────────────────────────────────

describe("step — walls mode collisions", () => {
  function wallGame(head: { x: number; y: number }, dir: "up" | "down" | "left" | "right") {
    let g = createGame("walls", 5, 1);
    return { ...g, snake: [head, { x: 2, y: 2 }], dir, pendingDir: dir };
  }

  it("kills snake on right wall hit", () => {
    expect(step(wallGame({ x: 4, y: 2 }, "right"), () => 0).alive).toBe(false);
  });

  it("kills snake on left wall hit", () => {
    expect(step(wallGame({ x: 0, y: 2 }, "left"), () => 0).alive).toBe(false);
  });

  it("kills snake on top wall hit", () => {
    expect(step(wallGame({ x: 2, y: 0 }, "up"), () => 0).alive).toBe(false);
  });

  it("kills snake on bottom wall hit", () => {
    expect(step(wallGame({ x: 2, y: 4 }, "down"), () => 0).alive).toBe(false);
  });

  it("still increments tick on fatal wall hit", () => {
    const g = wallGame({ x: 4, y: 2 }, "right");
    expect(step(g, () => 0).tick).toBe(g.tick + 1);
  });
});

// ── step — passthrough mode ────────────────────────────────────────────────

describe("step — passthrough wrapping", () => {
  function ptGame(head: { x: number; y: number }, dir: "up" | "down" | "left" | "right") {
    let g = createGame("passthrough", 5, 1);
    return { ...g, snake: [head, { x: 2, y: 2 }], dir, pendingDir: dir };
  }

  it("wraps right edge → left column", () => {
    const next = step(ptGame({ x: 4, y: 2 }, "right"), () => 0.5);
    expect(next.alive).toBe(true);
    expect(next.snake[0]).toEqual({ x: 0, y: 2 });
  });

  it("wraps left edge → right column", () => {
    const next = step(ptGame({ x: 0, y: 2 }, "left"), () => 0.5);
    expect(next.alive).toBe(true);
    expect(next.snake[0]).toEqual({ x: 4, y: 2 });
  });

  it("wraps top edge → bottom row", () => {
    const next = step(ptGame({ x: 2, y: 0 }, "up"), () => 0.5);
    expect(next.alive).toBe(true);
    expect(next.snake[0]).toEqual({ x: 2, y: 4 });
  });

  it("wraps bottom edge → top row", () => {
    const next = step(ptGame({ x: 2, y: 4 }, "down"), () => 0.5);
    expect(next.alive).toBe(true);
    expect(next.snake[0]).toEqual({ x: 2, y: 0 });
  });
});

// ── step — self-collision ──────────────────────────────────────────────────

describe("step — self-collision", () => {
  it("kills the snake when the head enters an occupied cell", () => {
    let g = createGame("passthrough", 10, 1);
    g = {
      ...g,
      snake: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 },
        { x: 4, y: 4 },
        { x: 5, y: 4 },
      ],
      dir: "right",
      pendingDir: "down",
    };
    expect(step(g, () => 0).alive).toBe(false);
  });

  it("does not false-positive when the tail vacates its cell in the same step", () => {
    let g = createGame("walls", 10, 1);
    // 2-cell snake moving right; tail will move, so head position is safe
    g = { ...g, snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }], food: { x: 0, y: 0 }, dir: "right", pendingDir: "right" };
    expect(step(g, () => 0.5).alive).toBe(true);
  });
});
