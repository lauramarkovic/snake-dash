import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "neon" | "electric" | "neutral";
  className?: string;
};

export function StatCard({ label, value, icon: Icon, tone = "neutral", className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border/80 bg-background/35 p-4", className)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {Icon && (
          <Icon
            className={cn(
              "size-4",
              tone === "neon" && "text-neon",
              tone === "electric" && "text-electric",
            )}
          />
        )}
        {label}
      </div>
      <p
        className={cn(
          "font-display mt-2 text-2xl font-bold tracking-tight",
          tone === "neon" && "neon-text",
          tone === "electric" && "electric-text",
        )}
      >
        {value}
      </p>
    </div>
  );
}
