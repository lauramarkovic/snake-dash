import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Eye, Gamepad2, Radio, Ruler, Trophy } from "lucide-react";
import { ArenaPanel } from "@/components/ArenaPanel";
import { EmptyState } from "@/components/EmptyState";
import { MiniSnakeBoard } from "@/components/MiniSnakeBoard";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { getService } from "@/services";
import type { ActiveGame } from "@/services/types";

export const Route = createFileRoute("/watch")({
  head: () => ({ meta: [{ title: "Watch — Snake Dash" }] }),
  component: WatchListPage,
});

type SortMode = "score" | "length";

function WatchListPage() {
  const { t } = useI18n();
  const [games, setGames] = useState<ActiveGame[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("score");
  useEffect(() => getService().subscribeActiveGames(setGames), []);

  const sortedGames = useMemo(
    () =>
      [...games].sort((left, right) =>
        sortMode === "score"
          ? right.state.score - left.state.score
          : right.state.snake.length - left.state.snake.length,
      ),
    [games, sortMode],
  );

  return (
    <section className="page-shell space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t.watch.liveFeed}</p>
          <h1 className="font-display mt-2 text-3xl font-black">{t.watch.activeRuns}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.watch.intro}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-neon">
          <Radio className="size-3.5" /> {t.watch.liveCount(games.length)}
        </div>
      </header>

      {games.length > 1 && (
        <div className="flex justify-end">
          <div className="flex rounded-xl border border-border bg-card/50 p-1">
            {(["score", "length"] as const).map((sort) => (
              <button
                key={sort}
                type="button"
                onClick={() => setSortMode(sort)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${
                  sortMode === sort
                    ? "bg-secondary text-neon"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sort === "score" ? t.watch.sortScore : t.watch.sortLength}
              </button>
            ))}
          </div>
        </div>
      )}

      {games.length === 0 ? (
        <ArenaPanel>
          <EmptyState
            icon={Eye}
            title={t.watch.quietTitle}
            description={t.watch.quietDescription}
            action={
              <Button asChild>
                <Link to="/play">
                  <Gamepad2 /> {t.watch.startPlaying}
                </Link>
              </Button>
            }
          />
        </ArenaPanel>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedGames.map((game) => (
            <li key={game.id}>
              <Link
                to="/watch/$gameId"
                params={{ gameId: game.id }}
                className="arena-panel group block h-full rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-electric/35"
              >
                <MiniSnakeBoard state={game.state} />
                <div className="mt-4 flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-electric/20 bg-electric/10 font-bold text-electric">
                      {game.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{game.username}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Activity className="size-3" /> {t.modes[game.mode].label} {t.common.mode}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-neon">
                    <span className="status-dot" /> {t.common.live}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-4">
                  <LiveStat icon={Trophy} label={t.common.score} value={game.state.score} />
                  <LiveStat icon={Ruler} label={t.common.length} value={game.state.snake.length} />
                </div>
                <span className="mt-4 flex items-center justify-end gap-1 text-sm font-semibold text-electric transition-transform group-hover:translate-x-1">
                  {t.watch.watchLive} <ArrowRight className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LiveStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-background/35 p-2.5">
      <p className="flex items-center gap-1 text-[0.625rem] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" /> {label}
      </p>
      <p className="font-display mt-1 font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
