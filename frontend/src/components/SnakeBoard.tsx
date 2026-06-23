import { useEffect, useMemo, useRef } from "react";
import type { GameState } from "@/lib/snake-engine";

type Props = {
  state: GameState;
  cellSize?: number;
  className?: string;
};

export function SnakeBoard({ state, cellSize = 20, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const size = useMemo(() => ({ w: state.width * cellSize, h: state.height * cellSize }), [state.width, state.height, cellSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // background grid
    ctx.fillStyle = getCss("--color-card");
    ctx.fillRect(0, 0, size.w, size.h);

    ctx.strokeStyle = getCss("--color-border");
    ctx.lineWidth = 1;
    for (let x = 0; x <= state.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize + 0.5, 0);
      ctx.lineTo(x * cellSize + 0.5, size.h);
      ctx.stroke();
    }
    for (let y = 0; y <= state.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize + 0.5);
      ctx.lineTo(size.w, y * cellSize + 0.5);
      ctx.stroke();
    }

    // food
    ctx.fillStyle = getCss("--color-destructive");
    ctx.beginPath();
    ctx.arc(
      state.food.x * cellSize + cellSize / 2,
      state.food.y * cellSize + cellSize / 2,
      cellSize / 2.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // snake
    state.snake.forEach((c, i) => {
      ctx.fillStyle = i === 0 ? getCss("--color-primary") : getCss("--color-primary");
      ctx.globalAlpha = i === 0 ? 1 : 0.7;
      ctx.fillRect(c.x * cellSize + 1, c.y * cellSize + 1, cellSize - 2, cellSize - 2);
    });
    ctx.globalAlpha = 1;

    if (!state.alive) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, size.w, size.h);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", size.w / 2, size.h / 2);
    }
  }, [state, cellSize, size.w, size.h]);

  return <canvas ref={canvasRef} width={size.w} height={size.h} className={className} aria-label="Snake board" />;
}

function getCss(name: string): string {
  if (typeof window === "undefined") return "#000";
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || "#000";
}
