import { describe, expect, it } from "vitest";
import { createGame, setDirection, step } from "@/lib/snake-engine";

describe("snake engine", () => {
  it("creates a game with the correct mode and a 3-cell snake", () => {
    const g = createGame("walls", 20, 1);
    expect(g.mode).toBe("walls");
    expect(g.snake).toHaveLength(3);
    expect(g.alive).toBe(true);
    expect(g.score).toBe(0);
  });

  it("moves the snake one cell per step", () => {
    const g = createGame("walls", 20, 1);
    const head = g.snake[0];
    const next = step(g, () => 0.5);
    expect(next.snake[0]).toEqual({ x: head.x + 1, y: head.y });
    expect(next.snake).toHaveLength(3);
  });

  it("ignores reversing into the opposite direction", () => {
    const g = createGame("walls", 20, 1);
    const turned = setDirection(g, "left");
    expect(turned.pendingDir).toBe("right");
  });

  it("kills the snake when it hits a wall in walls mode", () => {
    let g = createGame("walls", 5, 1);
    // Force position near right edge
    g = { ...g, snake: [{ x: 4, y: 2 }, { x: 3, y: 2 }], dir: "right", pendingDir: "right" };
    const next = step(g, () => 0);
    expect(next.alive).toBe(false);
  });

  it("wraps around in passthrough mode", () => {
    let g = createGame("passthrough", 5, 1);
    g = { ...g, snake: [{ x: 4, y: 2 }, { x: 3, y: 2 }], dir: "right", pendingDir: "right" };
    const next = step(g, () => 0);
    expect(next.alive).toBe(true);
    expect(next.snake[0]).toEqual({ x: 0, y: 2 });
  });

  it("grows and scores when eating food", () => {
    let g = createGame("walls", 10, 1);
    g = { ...g, snake: [{ x: 4, y: 5 }, { x: 3, y: 5 }], food: { x: 5, y: 5 }, dir: "right", pendingDir: "right" };
    const next = step(g, () => 0);
    expect(next.score).toBe(10);
    expect(next.snake).toHaveLength(3);
  });

  it("detects self-collision", () => {
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
    const next = step(g, () => 0);
    expect(next.alive).toBe(false);
  });
});
