import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SnakeBoard } from "@/components/SnakeBoard";
import { getService } from "@/services";
import type { ActiveGame } from "@/services/types";
import { ArrowLeft, Eye, Gauge, Radio, RouteIcon, Ruler, Trophy, Utensils } from "lucide-react";
import { ArenaPanel } from "@/components/ArenaPanel";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { getSpeedLevel, getTickMs } from "@/lib/game-feel";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/watch/$gameId")({
  head: () => ({ meta: [{ title: "Watching game — Snake Dash" }] }),
  component: WatchPage,
});

function WatchPage() {
  const { t } = useI18n();
  const { gameId } = Route.useParams();
  const [game, setGame] = useState<ActiveGame | null>(null);

  useEffect(() => getService().subscribeGame(gameId, setGame), [gameId]);

  if (!game) {
    return (
      <div className="page-shell">
        <ArenaPanel>
          <EmptyState
            icon={Eye}
            title={t.watch.unavailableTitle}
            description={t.watch.unavailableDescription}
            action={
              <Button asChild variant="outline">
                <Link to="/watch">
                  <ArrowLeft /> {t.watch.allActiveRuns}
                </Link>
              </Button>
            }
          />
        </ArenaPanel>
      </div>
    );
  }

  return (
    <section className="page-shell space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <Radio className="size-3.5" /> {t.watch.liveSpectator}
          </p>
          <h1 className="font-display mt-2 text-3xl font-black">
            {t.watch.userRun(game.username)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.modes[game.mode].label} {t.common.mode}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/watch">
            <ArrowLeft /> {t.watch.allRuns}
          </Link>
        </Button>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <ArenaPanel className="p-3 sm:p-5">
          <div className="mb-4 flex items-center justify-between px-1">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neon">
              <span className="status-dot" /> {t.watch.liveFeed}
            </span>
            <span className="text-xs text-muted-foreground">{t.watch.tick(game.state.tick)}</span>
          </div>
          <div className="flex justify-center overflow-auto rounded-xl bg-background/55 p-2 sm:p-4">
            <SnakeBoard
              state={game.state}
              className="max-w-full rounded-lg border border-electric/20"
            />
          </div>
        </ArenaPanel>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <StatCard
            label={t.common.score}
            value={game.state.score.toLocaleString()}
            icon={Trophy}
            tone="neon"
          />
          <StatCard
            label={t.common.length}
            value={game.state.snake.length}
            icon={Ruler}
            tone="electric"
          />
          <StatCard
            label={t.watch.foodEaten}
            value={Math.max(0, game.state.snake.length - 3)}
            icon={Utensils}
          />
          <StatCard
            label={t.common.speed}
            value={`${t.common.level} ${getSpeedLevel(game.state.score)}`}
            icon={Gauge}
          />
          <ArenaPanel className="col-span-2 p-5 lg:col-span-1">
            <p className="eyebrow">{t.watch.runTelemetry}</p>
            <div className="mt-4 space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RouteIcon className="size-3.5 text-electric" /> {t.watch.moves}
                </span>
                <strong className="font-display text-foreground">
                  {game.state.tick.toLocaleString()}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>{t.watch.currentInterval}</span>
                <strong className="font-display text-foreground">
                  {getTickMs(game.state.score)}ms
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>{t.watch.boardCoverage}</span>
                <strong className="font-display text-foreground">
                  {Math.round(
                    (game.state.snake.length / (game.state.width * game.state.height)) * 100,
                  )}
                  %
                </strong>
              </div>
            </div>
          </ArenaPanel>
        </div>
      </div>
    </section>
  );
}
