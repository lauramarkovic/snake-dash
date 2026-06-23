import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ArenaPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function ArenaPanel({ children, className, ...props }: ArenaPanelProps) {
  return (
    <div className={cn("arena-panel rounded-2xl", className)} {...props}>
      {children}
    </div>
  );
}
