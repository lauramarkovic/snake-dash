import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getService } from "@/services";
import type { ActiveGame } from "@/services/types";

export const Route = createFileRoute("/watch")({
  head: () => ({ meta: [{ title: "Watch — Snake Arena" }] }),
  component: WatchListPage,
});

function WatchListPage() {
  const [games, setGames] = useState<ActiveGame[]>([]);
  useEffect(() => getService().subscribeActiveGames(setGames), []);

  return (
    <section className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Active games</h1>
      {games.length === 0 ? (
        <p className="text-muted-foreground">No active games right now.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {games.map((g) => (
            <li key={g.id}>
              <Link
                to="/watch/$gameId"
                params={{ gameId: g.id }}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{g.username}</p>
                  <p className="text-xs text-muted-foreground">{g.mode} · score {g.state.score} · {g.state.alive ? "alive" : "ended"}</p>
                </div>
                <span className="text-sm text-muted-foreground">Watch →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
