import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SnakeBoard } from "@/components/SnakeBoard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getService } from "@/services";
import { createGame, setDirection, step, type Dir, type GameState, type Mode } from "@/lib/snake-engine";

export const Route = createFileRoute("/play")({
  head: () => ({ meta: [{ title: "Play — Snake Arena" }] }),
  component: PlayPage,
});

const KEY_DIR: Record<string, Dir> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
  W: "up", S: "down", A: "left", D: "right",
};

function PlayPage() {
  const { loading, user } = useRequireAuth();
  if (loading || !user) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
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
      svc.publishGame(state).then((id) => { gameIdRef.current = id; }).catch(() => {});
    }
    if (!state.alive && !submittedRef.current && state.score > 0) {
      submittedRef.current = true;
      svc.submitScore(state.mode, state.score).catch(() => {});
      if (gameIdRef.current) svc.endGame(gameIdRef.current).catch(() => {});
      gameIdRef.current = null;
    }
  }, [state, running]);

  // end game on unmount
  useEffect(() => () => {
    if (gameIdRef.current) getService().endGame(gameIdRef.current).catch(() => {});
  }, []);

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Playing as {user?.username}</h1>
          <p className="text-sm text-muted-foreground">Arrow keys / WASD to move · Space to pause</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mode:</span>
          <Button size="sm" variant={mode === "walls" ? "default" : "outline"} onClick={() => restart("walls")}>Walls</Button>
          <Button size="sm" variant={mode === "passthrough" ? "default" : "outline"} onClick={() => restart("passthrough")}>Pass-through</Button>
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-6">
        <SnakeBoard state={state} className="rounded-md border" />
        <div className="space-y-3">
          <p className="text-3xl font-bold">Score: {state.score}</p>
          <p className="text-sm text-muted-foreground">Length: {state.snake.length}</p>
          {!state.alive && <p className="text-destructive font-medium">Game over</p>}
          <div className="flex gap-2">
            <Button onClick={() => restart(mode)}>{state.alive ? "Restart" : "Play again"}</Button>
            <Button variant="outline" onClick={() => setRunning((r) => !r)} disabled={!state.alive}>
              {running ? "Pause" : "Resume"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
