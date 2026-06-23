import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Snake Arena — Play, compete, watch" },
      { name: "description", content: "A modern multiplayer-ready Snake game with walls and pass-through modes, leaderboards, and live spectating." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
      <h1 className="text-5xl font-bold tracking-tight">Snake Arena</h1>
      <p className="text-lg text-muted-foreground">
        Classic Snake with two modes — hit walls or wrap around. Compete on the
        leaderboard, then watch other players' games live.
      </p>
      <div className="flex justify-center gap-3 pt-4">
        <Button asChild size="lg"><Link to="/play">Play now</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/leaderboard">Leaderboard</Link></Button>
        <Button asChild size="lg" variant="ghost"><Link to="/watch">Watch live</Link></Button>
      </div>
      <p className="text-sm text-muted-foreground pt-8">
        Demo account: <code className="px-1 rounded bg-muted">demo</code> / <code className="px-1 rounded bg-muted">demo</code>
      </p>
    </section>
  );
}
