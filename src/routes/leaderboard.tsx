import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getService } from "@/services";
import type { ScoreEntry } from "@/services/types";
import type { Mode } from "@/lib/snake-engine";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Snake Arena" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [mode, setMode] = useState<Mode>("walls");
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    getService().getLeaderboard(mode, 20).then((s) => { if (!cancelled) setScores(s); });
    return () => { cancelled = true; };
  }, [mode]);

  return (
    <section className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <div className="flex gap-2">
          <Button size="sm" variant={mode === "walls" ? "default" : "outline"} onClick={() => setMode("walls")}>Walls</Button>
          <Button size="sm" variant={mode === "passthrough" ? "default" : "outline"} onClick={() => setMode("passthrough")}>Pass-through</Button>
        </div>
      </header>
      <div className="rounded-md border divide-y">
        {scores.length === 0 && <p className="p-6 text-center text-muted-foreground">No scores yet.</p>}
        {scores.map((s, i) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="font-mono text-muted-foreground w-6">{i + 1}</span>
              <span className="font-medium">{s.username}</span>
            </div>
            <span className="font-mono">{s.score}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
