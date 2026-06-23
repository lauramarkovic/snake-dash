import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
import {
  Clock3,
  Gauge,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Ruler,
  Sparkles,
  Trophy,
} from "lucide-react";
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

const TICK_MS = 120;

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
  const [hasStarted, setHasStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const submittedRef = useRef(false);
  const gameIdRef = useRef<string | null>(null);
  const sessionRef = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement | null>(null);

  const endPublishedGame = useCallback(() => {
    sessionRef.current += 1;
    if (!gameIdRef.current) return;
    getService()
      .endGame(gameIdRef.current)
      .catch(() => {});
    gameIdRef.current = null;
  }, []);

  const startRun = useCallback(
    (m: Mode) => {
      endPublishedGame();
      setMode(m);
      setState(createGame(m));
      setRunning(false);
      setHasStarted(true);
      setCountdown(3);
      setNewBest(false);
      submittedRef.current = false;
    },
    [endPublishedGame],
  );

  const selectMode = useCallback(
    (m: Mode) => {
      endPublishedGame();
      setMode(m);
      setState(createGame(m));
      setRunning(false);
      setHasStarted(false);
      setCountdown(null);
      setNewBest(false);
      submittedRef.current = false;
    },
    [endPublishedGame],
  );

  useEffect(() => {
    setBestScore(readBestScore(mode));
  }, [mode]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setRunning(true);
      return;
    }
    const id = window.setTimeout(() => setCountdown((value) => (value ?? 1) - 1), 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  // tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setState((s) => step(s));
    }, TICK_MS);
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
        e.preventDefault();
        if (countdown !== null || !state.alive) return;
        if (!hasStarted) startRun(mode);
        else setRunning((r) => !r);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [countdown, hasStarted, mode, startRun, state.alive]);

  useEffect(() => {
    if (state.alive) return;
    setRunning(false);
    const nextBest = Math.max(bestScore, state.score);
    if (nextBest !== bestScore) {
      setBestScore(nextBest);
      setNewBest(true);
      window.localStorage.setItem(bestScoreKey(mode), String(nextBest));
    }
  }, [bestScore, mode, state.alive, state.score]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === gameAreaRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!gameAreaRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await gameAreaRef.current.requestFullscreen();
    } catch {
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    function pauseWhenHidden() {
      if (document.hidden) setRunning(false);
    }
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  // publish live game + submit score on death
  useEffect(() => {
    const svc = getService();
    if (state.alive && running) {
      const session = sessionRef.current;
      svc
        .publishGame(state)
        .then((id) => {
          if (sessionRef.current === session) gameIdRef.current = id;
          else svc.endGame(id).catch(() => {});
        })
        .catch(() => {});
    }
    if (!state.alive && !submittedRef.current) {
      submittedRef.current = true;
      if (state.score > 0) svc.submitScore(state.mode, state.score).catch(() => {});
      endPublishedGame();
    }
  }, [endPublishedGame, state, running]);

  // end game on unmount
  useEffect(
    () => () => {
      endPublishedGame();
    },
    [endPublishedGame],
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
          <ModeSelector value={mode} onChange={selectMode} compact />
        </div>
      </header>

      <div
        ref={gameAreaRef}
        className="game-focus grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
      >
        <ArenaPanel className="p-3 sm:p-5">
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <HudItem label="Score" value={state.score.toLocaleString()} accent />
            <HudItem label="Best" value={bestScore.toLocaleString()} />
            <HudItem label="Length" value={state.snake.length.toString()} />
            <HudItem label="Time" value={formatTime(state.tick * TICK_MS)} />
          </div>
          <div className="relative mx-auto w-full max-w-[50rem] overflow-hidden rounded-xl border border-electric/20 bg-background/55 shadow-[0_0_40px_oklch(0.04_0.02_260/0.5)]">
            <SnakeBoard state={state} />

            {!hasStarted && state.alive && (
              <BoardOverlay
                eyebrow={mode === "walls" ? "Classic mode" : "Wrap mode"}
                title="Ready?"
                description="Choose your opening move, then start the run."
              >
                <Button size="lg" onClick={() => startRun(mode)}>
                  <Play /> Start run
                </Button>
              </BoardOverlay>
            )}

            {countdown !== null && (
              <BoardOverlay
                eyebrow="Get ready"
                title={String(countdown)}
                description="The run is about to begin."
              />
            )}

            {hasStarted && !running && countdown === null && state.alive && (
              <BoardOverlay
                eyebrow="Run paused"
                title="Paused"
                description="Take a breath. The grid will wait."
              >
                <Button size="lg" onClick={() => setRunning(true)}>
                  <Play /> Resume run
                </Button>
              </BoardOverlay>
            )}

            {!state.alive && (
              <BoardOverlay
                eyebrow={newBest ? "New personal best" : "Run complete"}
                title="Game over"
                description={`Final score ${state.score.toLocaleString()} · Length ${state.snake.length}`}
              >
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="lg" onClick={() => startRun(mode)}>
                    <RotateCcw /> Play again
                  </Button>
                  <Button variant="outline" size="lg" onClick={selectMode.bind(null, mode)}>
                    Back to ready
                  </Button>
                </div>
              </BoardOverlay>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              <span
                className={
                  running && state.alive ? "status-dot" : "size-2 rounded-full bg-muted-foreground"
                }
              />
              {runStatus({ state, running, countdown, hasStarted })}
            </div>
            <Button size="sm" variant="ghost" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 /> : <Maximize2 />}
              {isFullscreen ? "Exit focus" : "Focus mode"}
            </Button>
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
            <StatCard label="Best score" value={bestScore.toLocaleString()} icon={Sparkles} />
            <StatCard label="Pace" value={`${(1000 / TICK_MS).toFixed(1)}/s`} icon={Gauge} />
          </div>

          <ArenaPanel className="p-5">
            <p className="eyebrow">Run controls</p>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => startRun(mode)}>
                <RotateCcw /> {hasStarted ? "Restart run" : "Start run"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setRunning((r) => !r)}
                disabled={!state.alive || !hasStarted || countdown !== null}
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
              <Clock3 className="size-4 text-electric" />
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

function HudItem({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/45 px-3 py-2">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className={`font-display mt-1 text-base font-black ${accent ? "neon-text" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function BoardOverlay({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-background/72 p-6 text-center backdrop-blur-[3px]">
      <div className="max-w-sm">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="font-display neon-text mt-3 text-4xl font-black sm:text-6xl">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}

function runStatus({
  state,
  running,
  countdown,
  hasStarted,
}: {
  state: GameState;
  running: boolean;
  countdown: number | null;
  hasStarted: boolean;
}) {
  if (!state.alive) return "Run ended";
  if (countdown !== null) return "Starting";
  if (!hasStarted) return "Ready";
  return running ? "Run active" : "Run paused";
}

function formatTime(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function bestScoreKey(mode: Mode) {
  return `snake-dash-best-${mode}`;
}

function readBestScore(mode: Mode) {
  if (typeof window === "undefined") return 0;
  const value = Number.parseInt(window.localStorage.getItem(bestScoreKey(mode)) ?? "0", 10);
  return Number.isFinite(value) ? value : 0;
}
