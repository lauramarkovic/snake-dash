import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getService } from "@/services";
import type { ActiveGame } from "@/services/types";
import { Activity, ArrowRight, Eye, Gamepad2, Radio, Trophy } from "lucide-react";
import { ArenaPanel } from "@/components/ArenaPanel";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/watch")({
  head: () => ({ meta: [{ title: "Watch — Snake Dash" }] }),
  component: WatchListPage,
});

function WatchListPage() {
  const [games, setGames] = useState<ActiveGame[]>([]);
  useEffect(() => getService().subscribeActiveGames(setGames), []);

  return (
    <section className="page-shell space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Live feed</p>
          <h1 className="font-display mt-2 text-3xl font-black">Active runs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Watch players chase their next high score in real time.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-neon">
          <Radio className="size-3.5" /> {games.length} live
        </div>
      </header>
      {games.length === 0 ? (
        <ArenaPanel>
          <EmptyState
            icon={Eye}
            title="The arena is quiet"
            description="There are no active runs right now. Start a game and become the one everyone watches."
            action={
              <Button asChild>
                <Link to="/play">
                  <Gamepad2 /> Start playing
                </Link>
              </Button>
            }
          />
        </ArenaPanel>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {games.map((g) => (
            <li key={g.id}>
              <Link
                to="/watch/$gameId"
                params={{ gameId: g.id }}
                className="arena-panel group block rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-electric/35"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-xl border border-electric/20 bg-electric/10 font-bold text-electric">
                      {g.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{g.username}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Activity className="size-3" /> {g.mode === "walls" ? "Classic" : "Wrap"}{" "}
                        mode
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-neon">
                    <span className="status-dot" /> Live
                  </span>
                </div>
                <div className="mt-5 flex items-end justify-between border-t border-border/60 pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Current score
                    </p>
                    <p className="font-display neon-text mt-1 text-2xl font-black">
                      {g.state.score.toLocaleString()}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-electric transition-transform group-hover:translate-x-1">
                    Watch <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
