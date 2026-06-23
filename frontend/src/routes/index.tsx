import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, Gamepad2, Orbit, Shield, Trophy, Zap } from "lucide-react";
import { ArenaPanel } from "@/components/ArenaPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Snake Dash — Play, compete, watch" },
      {
        name: "description",
        content:
          "A modern multiplayer-ready Snake game with walls and pass-through modes, leaderboards, and live spectating.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <section className="page-shell">
      <div className="grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-electric/20 bg-electric/10 px-3 py-1.5 text-xs font-semibold text-electric">
            <span className="status-dot" />
            The arena is online
          </div>
          <p className="eyebrow">Classic game. Sharper edge.</p>
          <h1 className="font-display mt-4 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Chase the score.
            <span className="neon-text block">Own the grid.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            A fast, competitive Snake arena with two game modes, global rankings, and live runs you
            can watch in real time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/play">
                <Gamepad2 /> Enter arena <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/leaderboard">
                <Trophy /> View rankings
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Demo access:{" "}
            <code className="rounded-md border border-border bg-card px-2 py-1 text-foreground">
              demo / demo
            </code>
          </p>
        </div>

        <ArenaPanel className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow">Arena preview</p>
              <p className="font-display mt-1 font-bold">Live grid</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="status-dot" /> Online
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-xl border border-electric/20 bg-[oklch(0.09_0.025_263)]">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(oklch(0.72_0.08_210/0.12)_1px,transparent_1px),linear-gradient(90deg,oklch(0.72_0.08_210/0.12)_1px,transparent_1px)] [background-size:8.333%_8.333%]" />
            <div className="absolute left-[25%] top-[50%] flex">
              {[0, 1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className="size-5 rounded-[0.35rem] border border-primary/40 bg-primary shadow-[0_0_18px_oklch(0.86_0.24_135/0.35)] sm:size-7"
                />
              ))}
              <span className="size-5 rounded-[0.45rem] border border-primary/60 bg-neon sm:size-7" />
            </div>
            <div className="absolute right-[22%] top-[30%] size-4 rounded-full bg-destructive shadow-[0_0_22px_oklch(0.68_0.22_25/0.65)] sm:size-5" />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2 backdrop-blur">
              <span className="text-xs text-muted-foreground">
                SCORE <strong className="ml-1 text-foreground">1,240</strong>
              </span>
              <span className="text-xs text-muted-foreground">
                LENGTH <strong className="ml-1 text-neon">18</strong>
              </span>
            </div>
          </div>
        </ArenaPanel>
      </div>

      <div className="grid gap-4 border-t border-border/70 pt-8 md:grid-cols-3">
        {[
          {
            icon: Shield,
            title: "Classic walls",
            text: "Precision matters. One wrong turn ends the run.",
          },
          {
            icon: Orbit,
            title: "Wrap mode",
            text: "Cross an edge and continue from the opposite side.",
          },
          {
            icon: Eye,
            title: "Live arena",
            text: "Follow active players and watch high-score runs unfold.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-2xl border border-border/70 bg-card/40 p-5 transition-colors hover:border-electric/30"
          >
            <Icon className="size-5 text-electric" />
            <h2 className="font-display mt-4 font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <Zap className="size-3.5 text-neon" /> Built for quick runs and serious scores
      </div>
    </section>
  );
}
