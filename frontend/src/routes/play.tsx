import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SnakeBoard } from "@/components/SnakeBoard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getService } from "@/services";
import {
  createGame,
  setDirection,
  step,
  type Dir,
  type GameState,
  type Mode,
} from "@/lib/snake-engine";
import { Gauge, Pause, Play, RotateCcw, Ruler, Trophy } from "lucide-react";
import { ArenaPanel } from "@/components/ArenaPanel";
import { StatCard } from "@/components/StatCard";
import { ModeSelector } from "@/components/ModeSelector";

export const Route = createFileRoute("/play")({
  head: () => ({ meta: [{ title: "Play — Snake Dash" }] }),
  component: PlayPage,
});

const KEY_DIR: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

function PlayPage() {
  const { loading, user } = useRequireAuth();
  if (loading || !user)
    return <div className="page-shell text-center text-muted-foreground">Loading arena…</div>;
  return <Game />;
}

function Game() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("walls");
  const [state, setState] = useState<GameState>(() => createGame("walls"));
  const [running, setRunning] = useState(false);
  const submittedRef = useRef(false);
  const gameIdRef = useRef<string | null>(null);

  const restart = useCallback((m: Mode) => {
    setMode(m);
    setState(createGame(m));
    setRunning(true);
    submittedRef.current = false;
  }, []);

  // tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setState((s) => step(s));
    }, 120);
    return () => clearInterval(id);
  }, [running]);

  // keys
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const d = KEY_DIR[e.key];
      if (d) {
        e.preventDefault();
        setState((s) => setDirection(s, d));
      } else if (e.key === " ") {
        setRunning((r) => !r);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // publish live game + submit score on death
  useEffect(() => {
    const svc = getService();
    if (state.alive && running) {
      svc
        .publishGame(state)
        .then((id) => {
          gameIdRef.current = id;
        })
        .catch(() => {});
    }
    if (!state.alive && !submittedRef.current && state.score > 0) {
      submittedRef.current = true;
      svc.submitScore(state.mode, state.score).catch(() => {});
      if (gameIdRef.current) svc.endGame(gameIdRef.current).catch(() => {});
      gameIdRef.current = null;
    }
  }, [state, running]);

  // end game on unmount
  useEffect(
    () => () => {
      if (gameIdRef.current)
        getService()
          .endGame(gameIdRef.current)
          .catch(() => {});
    },
    [],
  );

  return (
    <section className="page-shell space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Player: {user?.username}</p>
          <h1 className="font-display mt-2 text-3xl font-black">Enter the arena</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use arrow keys or WASD to move · Space to pause
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <ModeSelector value={mode} onChange={restart} compact />
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <ArenaPanel className="p-3 sm:p-5">
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              <span
                className={
                  running && state.alive ? "status-dot" : "size-2 rounded-full bg-muted-foreground"
                }
              />
              {state.alive ? (running ? "Run active" : "Run paused") : "Run ended"}
            </div>
            <span className="font-display text-xs font-bold text-electric">
              {mode === "walls" ? "CLASSIC" : "WRAP"}
            </span>
          </div>
          <div className="flex justify-center overflow-auto rounded-xl bg-background/55 p-2 sm:p-4">
            <SnakeBoard
              state={state}
              className="max-w-full rounded-lg border border-electric/20 shadow-[0_0_40px_oklch(0.04_0.02_260/0.5)]"
            />
          </div>
        </ArenaPanel>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <StatCard
              label="Score"
              value={state.score.toLocaleString()}
              icon={Trophy}
              tone="neon"
            />
            <StatCard label="Length" value={state.snake.length} icon={Ruler} tone="electric" />
          </div>

          <ArenaPanel className="p-5">
            <p className="eyebrow">Run controls</p>
            {!state.alive && (
              <p className="font-display mt-3 text-lg font-bold text-destructive">Game over</p>
            )}
            <div className="mt-4 grid gap-2">
              <Button onClick={() => restart(mode)}>
                <RotateCcw /> {state.alive ? "Restart run" : "Play again"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setRunning((r) => !r)}
                disabled={!state.alive}
              >
                {running ? (
                  <>
                    <Pause /> Pause
                  </>
                ) : (
                  <>
                    <Play /> Resume
                  </>
                )}
              </Button>
            </div>
          </ArenaPanel>

          <ArenaPanel className="p-5">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-electric" />
              <p className="text-sm font-bold">Controls</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>
                <kbd className="mr-1 rounded border border-border bg-background/60 px-1.5 py-1 text-foreground">
                  WASD
                </kbd>{" "}
                move
              </span>
              <span>
                <kbd className="mr-1 rounded border border-border bg-background/60 px-1.5 py-1 text-foreground">
                  SPACE
                </kbd>{" "}
                pause
              </span>
            </div>
          </ArenaPanel>
        </div>
      </div>
    </section>
  );
}
