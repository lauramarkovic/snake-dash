import { Orbit, Shield } from "lucide-react";
import type { Mode } from "@/lib/snake-engine";
import { cn } from "@/lib/utils";

type ModeSelectorProps = {
  value: Mode;
  onChange: (mode: Mode) => void;
  compact?: boolean;
};

const MODES = [
  { value: "walls" as const, label: "Classic", description: "Walls end the run", icon: Shield },
  { value: "passthrough" as const, label: "Wrap", description: "Edges loop around", icon: Orbit },
];

export function ModeSelector({ value, onChange, compact = false }: ModeSelectorProps) {
  return (
    <div
      className={cn("grid gap-2", compact ? "grid-cols-2" : "sm:grid-cols-2")}
      role="radiogroup"
      aria-label="Game mode"
    >
      {MODES.map((mode) => {
        const selected = mode.value === value;
        const Icon = mode.icon;
        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mode.value)}
            className={cn(
              "group flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
              selected
                ? "border-primary/60 bg-primary/10 shadow-[inset_0_0_22px_oklch(0.86_0.24_135/0.06)]"
                : "border-border bg-background/25 hover:border-electric/40 hover:bg-secondary/60",
            )}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg bg-secondary",
                selected && "bg-primary/15 text-neon",
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className={cn("block text-sm font-bold", selected && "text-neon")}>
                {mode.label}
              </span>
              {!compact && (
                <span className="block truncate text-xs text-muted-foreground">
                  {mode.description}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
