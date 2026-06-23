import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getService } from "@/services";
import type { ScoreEntry } from "@/services/types";
import type { Mode } from "@/lib/snake-engine";
import { Button } from "@/components/ui/button";
import { Award, Crown, Medal, Trophy, Users } from "lucide-react";
import { ArenaPanel } from "@/components/ArenaPanel";
import { EmptyState } from "@/components/EmptyState";
import { ModeSelector } from "@/components/ModeSelector";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Snake Dash" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [mode, setMode] = useState<Mode>("walls");
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    getService()
      .getLeaderboard(mode, 20)
      .then((s) => {
        if (!cancelled) setScores(s);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
    <section className="page-shell space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Global standings</p>
          <h1 className="font-display mt-2 text-3xl font-black">Arena rankings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The highest verified scores from every player.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <ModeSelector value={mode} onChange={setMode} compact />
        </div>
      </header>

      {scores.length >= 3 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[scores[1], scores[0], scores[2]].map((score, visualIndex) => {
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
                <p className="mt-5 truncate font-bold">{score.username}</p>
                <p
                  className={
                    rank === 1
                      ? "font-display neon-text mt-1 text-2xl font-black"
                      : "font-display mt-1 text-2xl font-black"
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
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-neon" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">Top players</h2>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" /> {scores.length} ranked
          </span>
        </div>
        {scores.length === 0 && (
          <EmptyState
            icon={Trophy}
            title="No scores yet"
            description="Be the first player to put a score on this board."
          />
        )}
        {scores.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center justify-between border-b border-border/50 px-5 py-4 last:border-0 hover:bg-secondary/30"
          >
            <div className="flex items-center gap-4">
              <span
                className={
                  i < 3
                    ? "font-display w-8 text-sm font-bold text-neon"
                    : "font-display w-8 text-sm font-bold text-muted-foreground"
                }
              >
                #{i + 1}
              </span>
              <div className="grid size-9 place-items-center rounded-lg border border-border bg-secondary text-sm font-bold text-electric">
                {s.username.slice(0, 1).toUpperCase()}
              </div>
              <span className="font-semibold">{s.username}</span>
            </div>
            <span className="font-display font-bold">{s.score.toLocaleString()}</span>
          </div>
        ))}
      </ArenaPanel>
    </section>
  );
}
