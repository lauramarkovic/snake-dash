import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Crown,
  Medal,
  Swords,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { ArenaPanel } from "@/components/ArenaPanel";
import { EmptyState } from "@/components/EmptyState";
import { ModeSelector } from "@/components/ModeSelector";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type { Mode } from "@/lib/snake-engine";
import { getService } from "@/services";
import type { ScoreEntry } from "@/services/types";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Snake Dash" }] }),
  component: LeaderboardPage,
});

type TimeFilter = "all" | "day" | "week";

function LeaderboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("walls");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    getService()
      .getLeaderboard(mode, 100)
      .then((entries) => {
        if (!cancelled) setScores(entries);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const filteredScores = useMemo(() => {
    const cutoff =
      timeFilter === "day"
        ? Date.now() - 86_400_000
        : timeFilter === "week"
          ? Date.now() - 604_800_000
          : 0;
    return scores.filter((score) => score.createdAt >= cutoff).slice(0, 20);
  }, [scores, timeFilter]);

  const currentUserRank = filteredScores.findIndex((score) => score.userId === user?.id);

  return (
    <section className="page-shell space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t.leaderboard.globalStandings}</p>
          <h1 className="font-display mt-2 text-3xl font-black">{t.leaderboard.arenaRankings}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.leaderboard.intro}</p>
        </div>
        <div className="w-full sm:w-auto">
          <ModeSelector value={mode} onChange={setMode} compact />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-border bg-card/50 p-1">
          {(["all", "week", "day"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setTimeFilter(filter)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                timeFilter === filter
                  ? "bg-secondary text-neon"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter === "all"
                ? t.leaderboard.allTime
                : filter === "week"
                  ? t.leaderboard.thisWeek
                  : t.leaderboard.today}
            </button>
          ))}
        </div>
        {currentUserRank >= 0 && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserRound className="size-4 text-electric" />{" "}
            <strong className="text-neon">{t.leaderboard.yourRank(currentUserRank + 1)}</strong>
          </span>
        )}
      </div>

      {filteredScores.length >= 3 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[filteredScores[1], filteredScores[0], filteredScores[2]].map((score, visualIndex) => {
            const rank = visualIndex === 0 ? 2 : visualIndex === 1 ? 1 : 3;
            const Icon = rank === 1 ? Crown : rank === 2 ? Medal : Award;
            return (
              <ArenaPanel
                key={score.id}
                className={rank === 1 ? "border-primary/40 p-5 sm:-translate-y-2" : "p-5"}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-muted-foreground">
                    #{rank}
                  </span>
                  <Icon className={rank === 1 ? "size-5 text-neon" : "size-5 text-electric"} />
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <PlayerAvatar username={score.username} />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{score.username}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {relativeTime(score.createdAt, t)}
                    </p>
                  </div>
                </div>
                <p
                  className={
                    rank === 1
                      ? "font-display neon-text mt-4 text-2xl font-black"
                      : "font-display mt-4 text-2xl font-black"
                  }
                >
                  {score.score.toLocaleString()}
                </p>
              </ArenaPanel>
            );
          })}
        </div>
      )}

      <ArenaPanel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-neon" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">
              {t.leaderboard.topPlayers}
            </h2>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" /> {t.leaderboard.ranked(filteredScores.length)}
          </span>
        </div>
        {filteredScores.length === 0 && (
          <EmptyState
            icon={CalendarDays}
            title={t.leaderboard.noScores}
            description={t.leaderboard.noScoresDescription}
            action={
              <Button asChild>
                <Link to="/play">
                  <Swords /> {t.leaderboard.startChallenge}
                </Link>
              </Button>
            }
          />
        )}
        {filteredScores.map((score, index) => {
          const isCurrentUser = score.userId === user?.id;
          return (
            <div
              key={score.id}
              className={`flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-5 py-4 last:border-0 ${
                isCurrentUser ? "bg-primary/8" : "hover:bg-secondary/30"
              }`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className={
                    index < 3
                      ? "font-display w-8 text-sm font-bold text-neon"
                      : "font-display w-8 text-sm font-bold text-muted-foreground"
                  }
                >
                  #{index + 1}
                </span>
                <PlayerAvatar username={score.username} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {score.username}
                    {isCurrentUser && (
                      <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[0.625rem] uppercase tracking-wider text-neon">
                        {t.common.you}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {relativeTime(score.createdAt, t)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display font-bold">{score.score.toLocaleString()}</span>
                {!isCurrentUser && (
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/play" title={t.leaderboard.challengeTitle(score.username)}>
                      {t.leaderboard.challenge} <ArrowRight />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </ArenaPanel>
    </section>
  );
}

function PlayerAvatar({ username }: { username: string }) {
  return (
    <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-electric/20 bg-electric/10 text-sm font-bold text-electric">
      {username.slice(0, 1).toUpperCase()}
    </div>
  );
}

function relativeTime(timestamp: number, t: ReturnType<typeof useI18n>["t"]) {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1_000));
  if (seconds < 60) return t.leaderboard.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t.leaderboard.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.leaderboard.hoursAgo(hours);
  const days = Math.floor(hours / 24);
  return t.leaderboard.daysAgo(days);
}
