import { useEffect, useRef } from "react";
import type { Cell, Dir, GameState } from "@/lib/snake-engine";
import { cn } from "@/lib/utils";

export type BoardEvent = {
  id: number;
  type: "eat" | "collision";
  cell: Cell;
  value?: number;
};

type Props = {
  state: GameState;
  stepDuration?: number;
  event?: BoardEvent | null;
  reducedMotion?: boolean;
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bornAt: number;
  color: "neon" | "food";
};

type FloatingScore = {
  x: number;
  y: number;
  value: number;
  bornAt: number;
};

const LOGICAL_SIZE = 800;

export function SnakeBoard({
  state,
  stepDuration = 120,
  event = null,
  reducedMotion = false,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  const previousStateRef = useRef(state);
  const transitionStartedAtRef = useRef(0);
  const stepDurationRef = useRef(stepDuration);
  const reducedMotionRef = useRef(reducedMotion);
  const particlesRef = useRef<Particle[]>([]);
  const floatingScoresRef = useRef<FloatingScore[]>([]);
  const collisionAtRef = useRef<number | null>(null);

  useEffect(() => {
    previousStateRef.current = state.tick === 0 ? state : stateRef.current;
    stateRef.current = state;
    transitionStartedAtRef.current = performance.now();
  }, [state]);

  useEffect(() => {
    stepDurationRef.current = stepDuration;
  }, [stepDuration]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    if (!event) return;
    const now = performance.now();
    if (event.type === "collision") {
      collisionAtRef.current = now;
      if (reducedMotion) return;
    }

    const count = reducedMotion ? 0 : event.type === "eat" ? 14 : 22;
    const color = event.type === "eat" ? "food" : "neon";
    for (let index = 0; index < count; index++) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.35;
      const speed = 1.3 + Math.random() * 2.2;
      particlesRef.current.push({
        x: event.cell.x + 0.5,
        y: event.cell.y + 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        bornAt: now,
        color,
      });
    }

    if (event.type === "eat" && event.value) {
      floatingScoresRef.current.push({
        x: event.cell.x + 0.5,
        y: event.cell.y + 0.2,
        value: event.value,
        bornAt: now,
      });
    }
  }, [event, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame = 0;
    let width = canvas.clientWidth || LOGICAL_SIZE;
    let height = canvas.clientHeight || LOGICAL_SIZE;

    function resize() {
      if (!canvas) return;
      width = canvas.clientWidth || LOGICAL_SIZE;
      height = canvas.clientHeight || width;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }

    function render(time: number) {
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;

      const ratio = canvas.width / width;
      const transition = reducedMotionRef.current
        ? 1
        : Math.min(1, (time - transitionStartedAtRef.current) / stepDurationRef.current);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawBoard(
        ctx,
        stateRef.current,
        previousStateRef.current,
        transition,
        width,
        height,
        time,
        particlesRef.current,
        floatingScoresRef.current,
        collisionAtRef.current,
      );
      particlesRef.current = particlesRef.current.filter(
        (particle) => time - particle.bornAt < 760,
      );
      floatingScoresRef.current = floatingScoresRef.current.filter(
        (score) => time - score.bornAt < 900,
      );
      frame = window.requestAnimationFrame(render);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frame = window.requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("aspect-square h-auto w-full", className)}
      aria-label={`Snake board. Score ${state.score}. Length ${state.snake.length}.`}
      role="img"
    />
  );
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  previousState: GameState,
  transition: number,
  width: number,
  height: number,
  time: number,
  particles: Particle[],
  floatingScores: FloatingScore[],
  collisionAt: number | null,
) {
  const cellWidth = width / state.width;
  const cellHeight = height / state.height;
  const cellSize = Math.min(cellWidth, cellHeight);
  const inset = Math.max(1.5, cellSize * 0.09);
  const easedTransition = 1 - Math.pow(1 - transition, 3);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = getCss("--color-background", "#080d18");
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, state, width, height, cellWidth, cellHeight);

  if (state.mode === "walls") drawWalls(ctx, width, height, cellSize);

  drawFood(ctx, state, cellWidth, cellHeight, cellSize, time);
  drawSnake(ctx, state, previousState, easedTransition, cellWidth, cellHeight, cellSize, inset);
  drawParticles(ctx, particles, cellWidth, cellHeight, cellSize, time);
  drawFloatingScores(ctx, floatingScores, cellWidth, cellHeight, cellSize, time);
  drawCollisionFlash(ctx, collisionAt, width, height, time);
}

function drawWalls(ctx: CanvasRenderingContext2D, width: number, height: number, cellSize: number) {
  const borderWidth = Math.max(2, cellSize * 0.08);
  ctx.strokeStyle = colorWithAlpha(getCss("--color-electric", "#67e8f9"), 0.55);
  ctx.lineWidth = borderWidth;
  ctx.shadowColor = colorWithAlpha(getCss("--color-electric", "#67e8f9"), 0.3);
  ctx.shadowBlur = cellSize * 0.35;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
  ctx.shadowBlur = 0;
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  cellWidth: number,
  cellHeight: number,
) {
  const border = getCss("--color-border", "#234052");
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = colorWithAlpha(border, 0.055);
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
      }
    }
  }

  ctx.strokeStyle = colorWithAlpha(border, 0.16);
  ctx.lineWidth = 1;
  for (let x = 1; x < state.width; x++) {
    const px = Math.round(x * cellWidth) + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
  }
  for (let y = 1; y < state.height; y++) {
    const py = Math.round(y * cellHeight) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
    ctx.stroke();
  }
}

function drawFood(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cellWidth: number,
  cellHeight: number,
  cellSize: number,
  time: number,
) {
  const x = state.food.x * cellWidth + cellWidth / 2;
  const y = state.food.y * cellHeight + cellHeight / 2;
  const pulse = 0.9 + Math.sin(time / 220) * 0.08;
  const radius = cellSize * 0.29 * pulse;
  const food = getCss("--color-destructive", "#fb5b5b");

  ctx.save();
  ctx.shadowColor = food;
  ctx.shadowBlur = cellSize * (0.45 + pulse * 0.18);
  const gradient = ctx.createRadialGradient(
    x - radius * 0.3,
    y - radius * 0.35,
    radius * 0.08,
    x,
    y,
    radius,
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.24, food);
  gradient.addColorStop(1, colorWithAlpha(food, 0.72));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSnake(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  previousState: GameState,
  transition: number,
  cellWidth: number,
  cellHeight: number,
  cellSize: number,
  inset: number,
) {
  const neon = getCss("--color-neon", "#a3ff4f");
  const cells = state.snake.map((cell, index) =>
    interpolateCell(
      previousState.snake[index] ?? previousState.snake.at(-1) ?? cell,
      cell,
      transition,
    ),
  );

  cells
    .slice()
    .reverse()
    .forEach((cell, reverseIndex) => {
      const index = cells.length - 1 - reverseIndex;
      const isHead = index === 0;
      const progress = 1 - index / Math.max(cells.length, 1);
      const x = cell.x * cellWidth + inset;
      const y = cell.y * cellHeight + inset;
      const w = cellWidth - inset * 2;
      const h = cellHeight - inset * 2;

      ctx.save();
      ctx.fillStyle = colorWithAlpha(neon, isHead ? 1 : 0.48 + progress * 0.4);
      ctx.shadowColor = neon;
      ctx.shadowBlur = isHead ? cellSize * 0.48 : cellSize * 0.16 * progress;
      roundedRect(ctx, x, y, w, h, cellSize * (isHead ? 0.24 : 0.18));
      ctx.fill();
      ctx.restore();
    });

  drawEyes(ctx, cells[0], state.dir, cellWidth, cellHeight, cellSize);
}

function interpolateCell(from: Cell, to: Cell, transition: number): Cell {
  if (Math.abs(to.x - from.x) > 1 || Math.abs(to.y - from.y) > 1) return to;
  return {
    x: from.x + (to.x - from.x) * transition,
    y: from.y + (to.y - from.y) * transition,
  };
}

function drawEyes(
  head: CanvasRenderingContext2D,
  cell: Cell | undefined,
  dir: Dir,
  cellWidth: number,
  cellHeight: number,
  cellSize: number,
) {
  if (!cell) return;
  const centerX = cell.x * cellWidth + cellWidth / 2;
  const centerY = cell.y * cellHeight + cellHeight / 2;
  const positions = eyePositions(dir, cellSize);

  head.fillStyle = getCss("--color-primary-foreground", "#10220e");
  positions.forEach(({ x, y }) => {
    head.beginPath();
    head.arc(centerX + x, centerY + y, Math.max(1.4, cellSize * 0.075), 0, Math.PI * 2);
    head.fill();
  });
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  cellWidth: number,
  cellHeight: number,
  cellSize: number,
  time: number,
) {
  particles.forEach((particle) => {
    const age = (time - particle.bornAt) / 1000;
    const alpha = Math.max(0, 1 - age / 0.76);
    const x = (particle.x + particle.vx * age) * cellWidth;
    const y = (particle.y + particle.vy * age + age * age * 1.4) * cellHeight;
    const color =
      particle.color === "food"
        ? getCss("--color-destructive", "#fb5b5b")
        : getCss("--color-neon", "#a3ff4f");
    ctx.fillStyle = colorWithAlpha(color, alpha);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.5, cellSize * 0.07 * alpha), 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFloatingScores(
  ctx: CanvasRenderingContext2D,
  scores: FloatingScore[],
  cellWidth: number,
  cellHeight: number,
  cellSize: number,
  time: number,
) {
  scores.forEach((score) => {
    const age = (time - score.bornAt) / 1000;
    const alpha = Math.max(0, 1 - age / 0.9);
    ctx.save();
    ctx.fillStyle = colorWithAlpha(getCss("--color-neon", "#a3ff4f"), alpha);
    ctx.font = `800 ${Math.max(12, cellSize * 0.48)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.shadowColor = getCss("--color-neon", "#a3ff4f");
    ctx.shadowBlur = cellSize * 0.3;
    ctx.fillText(`+${score.value}`, score.x * cellWidth, (score.y - age * 1.2) * cellHeight);
    ctx.restore();
  });
}

function drawCollisionFlash(
  ctx: CanvasRenderingContext2D,
  collisionAt: number | null,
  width: number,
  height: number,
  time: number,
) {
  if (collisionAt === null) return;
  const age = time - collisionAt;
  if (age > 520) return;
  const alpha = Math.max(0, 0.42 * (1 - age / 520));
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.18,
    width / 2,
    height / 2,
    width * 0.72,
  );
  gradient.addColorStop(0, "transparent");
  gradient.addColorStop(1, colorWithAlpha(getCss("--color-destructive", "#fb5b5b"), alpha));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function eyePositions(dir: Dir, size: number) {
  const forward = size * 0.18;
  const spread = size * 0.15;
  const positions: Record<Dir, { x: number; y: number }[]> = {
    right: [
      { x: forward, y: -spread },
      { x: forward, y: spread },
    ],
    left: [
      { x: -forward, y: -spread },
      { x: -forward, y: spread },
    ],
    up: [
      { x: -spread, y: -forward },
      { x: spread, y: -forward },
    ],
    down: [
      { x: -spread, y: forward },
      { x: spread, y: forward },
    ],
  };
  return positions[dir];
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function getCss(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function colorWithAlpha(color: string, alpha: number) {
  if (color.startsWith("oklch(")) {
    if (color.includes("/")) return color.replace(/\s*\/\s*[^)]+(?=\))/, ` / ${alpha}`);
    return color.replace(/\)$/, ` / ${alpha})`);
  }
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => char + char)
            .join("")
        : hex;
    const value = Number.parseInt(normalized, 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
  }
  return color;
}
