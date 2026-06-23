import type { GameState } from "@/lib/snake-engine";
import { cn } from "@/lib/utils";

type MiniSnakeBoardProps = {
  state: GameState;
  className?: string;
};

export function MiniSnakeBoard({ state, className }: MiniSnakeBoardProps) {
  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-xl border border-electric/20 bg-background/75",
        className,
      )}
      aria-label={`Board preview. Score ${state.score}.`}
    >
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(oklch(0.72_0.08_210/0.1)_1px,transparent_1px),linear-gradient(90deg,oklch(0.72_0.08_210/0.1)_1px,transparent_1px)] [background-size:5%_5%]" />
      {state.snake.map((cell, index) => (
        <span
          key={`${cell.x}-${cell.y}-${index}`}
          className={cn(
            "absolute rounded-[2px] bg-primary",
            index === 0 ? "z-10 shadow-[0_0_8px_oklch(0.86_0.24_135/0.65)]" : "opacity-65",
          )}
          style={{
            left: `${(cell.x / state.width) * 100}%`,
            top: `${(cell.y / state.height) * 100}%`,
            width: `${100 / state.width}%`,
            height: `${100 / state.height}%`,
          }}
        />
      ))}
      <span
        className="absolute rounded-full bg-destructive shadow-[0_0_8px_oklch(0.68_0.22_25/0.75)]"
        style={{
          left: `${(state.food.x / state.width) * 100}%`,
          top: `${(state.food.y / state.height) * 100}%`,
          width: `${100 / state.width}%`,
          height: `${100 / state.height}%`,
        }}
      />
    </div>
  );
}
