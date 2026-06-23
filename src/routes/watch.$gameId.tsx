import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SnakeBoard } from "@/components/SnakeBoard";
import { getService } from "@/services";
import type { ActiveGame } from "@/services/types";

export const Route = createFileRoute("/watch/$gameId")({
  head: () => ({ meta: [{ title: "Watching game — Snake Arena" }] }),
  component: WatchPage,
});

function WatchPage() {
  const { gameId } = Route.useParams();
  const [game, setGame] = useState<ActiveGame | null>(null);

  useEffect(() => getService().subscribeGame(gameId, setGame), [gameId]);

  if (!game) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-muted-foreground">This game has ended or doesn't exist.</p>
        <Link to="/watch" className="underline">Back to active games</Link>
      </div>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{game.username}</h1>
          <p className="text-sm text-muted-foreground">{game.mode} · score {game.state.score}</p>
        </div>
        <Link to="/watch" className="text-sm underline">All games</Link>
      </header>
      <SnakeBoard state={game.state} className="rounded-md border" />
    </section>
  );
}
