import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AudioLines,
  CheckCircle2,
  Clock3,
  Gauge,
  LockKeyhole,
  Maximize2,
  Medal,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Ruler,
  Share2,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { SnakeBoard, type BoardEvent } from "@/components/SnakeBoard";
import { ArenaPanel } from "@/components/ArenaPanel";
import { ModeSelector } from "@/components/ModeSelector";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { GameAudio, type GameSound } from "@/lib/game-audio";
import {
  COMBO_WINDOW_MS,
  getCombo,
  getCrossedMilestone,
  getSpeedLevel,
  getSpeedProgress,
  getTickMs,
} from "@/lib/game-feel";
import {
  createGame,
  setDirection,
  step,
  type Dir,
  type GameState,
  type Mode,
} from "@/lib/snake-engine";
import { useRequireAuth } from "@/lib/use-require-auth";
import {
  achievementCatalog,
  achievementIdsForRun,
  getDailyChallenge,
  readAchievementIds,
  readDailyCompletions,
  saveAchievementIds,
  saveDailyCompletions,
} from "@/lib/social-progress";
import { getService } from "@/services";

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

type GamePreferences = {
  sound: boolean;
  volume: number;
  reducedMotion: boolean;
};

const DEFAULT_PREFERENCES: GamePreferences = {
  sound: true,
  volume: 0.65,
  reducedMotion: false,
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
  const [hasStarted, setHasStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [comboExpiresAt, setComboExpiresAt] = useState(0);
  const [boardEvent, setBoardEvent] = useState<BoardEvent | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [preferences, setPreferences] = useState<GamePreferences>(readPreferences);
  const [achievementIds, setAchievementIds] = useState(readAchievementIds);
  const [dailyCompletions, setDailyCompletions] = useState(readDailyCompletions);
  const [shareStatus, setShareStatus] = useState("");
  const submittedRef = useRef(false);
  const gameIdRef = useRef<string | null>(null);
  const sessionRef = useRef(0);
  const stateRef = useRef(state);
  const lastEatAtRef = useRef<number | null>(null);
  const eventIdRef = useRef(0);
  const audioRef = useRef(new GameAudio());
  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const tickMs = getTickMs(state.score);
  const speedLevel = getSpeedLevel(state.score);
  const comboRemaining = combo > 1 ? Math.max(0, comboExpiresAt - Date.now()) : 0;
  const dailyChallenge = getDailyChallenge();
  const dailyCompleted = dailyCompletions.has(dailyChallenge.id);
  const achievements = achievementCatalog(achievementIds);

  const playSound = useCallback(
    (sound: GameSound) => {
      if (preferences.sound) audioRef.current.play(sound, preferences.volume);
    },
    [preferences.sound, preferences.volume],
  );

  const replaceState = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const endPublishedGame = useCallback(() => {
    sessionRef.current += 1;
    if (!gameIdRef.current) return;
    getService()
      .endGame(gameIdRef.current)
      .catch(() => {});
    gameIdRef.current = null;
  }, []);

  const resetFeel = useCallback(() => {
    setCombo(0);
    setMaxCombo(0);
    setComboExpiresAt(0);
    setBoardEvent(null);
    setMilestone(null);
    setElapsedMs(0);
    setShareStatus("");
    lastEatAtRef.current = null;
  }, []);

  const startRun = useCallback(
    (nextMode: Mode) => {
      endPublishedGame();
      const next = createGame(nextMode);
      setMode(nextMode);
      replaceState(next);
      setRunning(false);
      setHasStarted(true);
      setCountdown(3);
      setNewBest(false);
      resetFeel();
      submittedRef.current = false;
      playSound("start");
    },
    [endPublishedGame, playSound, replaceState, resetFeel],
  );

  const selectMode = useCallback(
    (nextMode: Mode) => {
      endPublishedGame();
      const next = createGame(nextMode);
      setMode(nextMode);
      replaceState(next);
      setRunning(false);
      setHasStarted(false);
      setCountdown(null);
      setNewBest(false);
      resetFeel();
      submittedRef.current = false;
    },
    [endPublishedGame, replaceState, resetFeel],
  );

  const toggleRunning = useCallback(() => {
    setRunning((current) => {
      playSound(current ? "pause" : "start");
      return !current;
    });
  }, [playSound]);

  useEffect(() => {
    setBestScore(readBestScore(mode));
  }, [mode]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setRunning(true);
      playSound("start");
      return;
    }
    playSound("countdown");
    const id = window.setTimeout(() => setCountdown((value) => (value ?? 1) - 1), 1_000);
    return () => window.clearTimeout(id);
  }, [countdown, playSound]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const current = stateRef.current;
      let next = step(current);
      const now = Date.now();

      if (next.score > current.score) {
        const nextCombo = getCombo(lastEatAtRef.current, now, combo);
        const points = 10 * nextCombo;
        const nextScore = current.score + points;
        const crossedMilestone = getCrossedMilestone(current.score, nextScore);
        next = { ...next, score: nextScore };
        lastEatAtRef.current = now;
        setCombo(nextCombo);
        setMaxCombo((value) => Math.max(value, nextCombo));
        setComboExpiresAt(now + COMBO_WINDOW_MS);
        setBoardEvent({
          id: ++eventIdRef.current,
          type: "eat",
          cell: current.food,
          value: points,
        });
        playSound("eat");
        if (crossedMilestone) {
          setMilestone(crossedMilestone);
          playSound("milestone");
        }
      } else if (combo > 0 && now > comboExpiresAt) {
        setCombo(0);
      }

      if (current.alive && !next.alive) {
        setBoardEvent({
          id: ++eventIdRef.current,
          type: "collision",
          cell: current.snake[0],
        });
        playSound("collision");
      }

      setElapsedMs((value) => value + tickMs);
      replaceState(next);
    }, tickMs);
    return () => window.clearInterval(id);
  }, [combo, comboExpiresAt, playSound, replaceState, running, tickMs]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const direction = KEY_DIR[event.key];
      if (direction) {
        event.preventDefault();
        replaceState(setDirection(stateRef.current, direction));
      } else if (event.key === " ") {
        event.preventDefault();
        if (countdown !== null || !state.alive) return;
        if (!hasStarted) startRun(mode);
        else toggleRunning();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [countdown, hasStarted, mode, replaceState, startRun, state.alive, toggleRunning]);

  useEffect(() => {
    if (state.alive) return;
    setRunning(false);
    const nextBest = Math.max(bestScore, state.score);
    if (nextBest !== bestScore) {
      setBestScore(nextBest);
      setNewBest(true);
      window.localStorage.setItem(bestScoreKey(mode), String(nextBest));
    }

    const completedDaily = mode === dailyChallenge.mode && state.score >= dailyChallenge.target;
    if (completedDaily && !dailyCompleted) {
      const nextDailyCompletions = new Set(dailyCompletions);
      nextDailyCompletions.add(dailyChallenge.id);
      setDailyCompletions(nextDailyCompletions);
      saveDailyCompletions(nextDailyCompletions);
    }

    const nextAchievementIds = new Set(achievementIds);
    achievementIdsForRun(
      {
        score: state.score,
        length: state.snake.length,
        mode,
        maxCombo,
        speedLevel,
      },
      completedDaily || dailyCompleted,
    ).forEach((id) => nextAchievementIds.add(id));
    if (nextAchievementIds.size !== achievementIds.size) {
      setAchievementIds(nextAchievementIds);
      saveAchievementIds(nextAchievementIds);
    }
  }, [
    achievementIds,
    bestScore,
    dailyChallenge.id,
    dailyChallenge.mode,
    dailyChallenge.target,
    dailyCompleted,
    dailyCompletions,
    maxCombo,
    mode,
    speedLevel,
    state.alive,
    state.score,
    state.snake.length,
  ]);

  useEffect(() => {
    window.localStorage.setItem("snake-dash-preferences", JSON.stringify(preferences));
    document.documentElement.classList.toggle("reduce-game-motion", preferences.reducedMotion);
  }, [preferences]);

  useEffect(() => {
    if (milestone === null) return;
    const id = window.setTimeout(() => setMilestone(null), 1_800);
    return () => window.clearTimeout(id);
  }, [milestone]);

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

  useEffect(() => {
    const service = getService();
    if (state.alive && running) {
      const session = sessionRef.current;
      service
        .publishGame(state)
        .then((id) => {
          if (sessionRef.current === session) gameIdRef.current = id;
          else service.endGame(id).catch(() => {});
        })
        .catch(() => {});
    }
    if (!state.alive && !submittedRef.current) {
      submittedRef.current = true;
      if (state.score > 0) service.submitScore(state.mode, state.score).catch(() => {});
      endPublishedGame();
    }
  }, [endPublishedGame, running, state]);

  useEffect(
    () => () => {
      endPublishedGame();
    },
    [endPublishedGame],
  );

  const shareResult = useCallback(async () => {
    const text = `I scored ${state.score.toLocaleString()} in ${mode === "walls" ? "Classic" : "Wrap"} mode on Snake Dash. Can you beat it?`;
    const shareData = { title: "Snake Dash result", text, url: window.location.origin };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus("Shared");
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
        setShareStatus("Copied");
      }
    } catch {
      setShareStatus("");
    }
  }, [mode, state.score]);

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
            <HudItem label="Combo" value={combo > 1 ? `×${combo}` : "—"} />
            <HudItem label="Speed" value={`Lv ${speedLevel}`} />
            <HudItem label="Time" value={formatTime(elapsedMs)} />
          </div>

          <div className="relative mx-auto w-full max-w-[50rem] overflow-hidden rounded-xl border border-electric/20 bg-background/55 shadow-[0_0_40px_oklch(0.04_0.02_260/0.5)]">
            <SnakeBoard
              state={state}
              stepDuration={tickMs}
              event={boardEvent}
              reducedMotion={preferences.reducedMotion}
            />

            {combo > 1 && state.alive && (
              <div className="absolute left-3 top-3 z-[5] w-32 rounded-xl border border-warning/30 bg-background/80 p-3 backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-[0.625rem] font-bold uppercase tracking-wider text-muted-foreground">
                    Combo
                  </span>
                  <strong className="font-display text-warning">×{combo}</strong>
                </div>
                <Progress
                  value={(comboRemaining / COMBO_WINDOW_MS) * 100}
                  className="mt-2 h-1.5 bg-warning/15 [&>div]:bg-warning"
                />
              </div>
            )}

            {milestone !== null && (
              <div className="milestone-pop pointer-events-none absolute inset-x-4 top-1/4 z-20 text-center">
                <p className="eyebrow">Score milestone</p>
                <p className="font-display neon-text mt-2 text-4xl font-black">
                  {milestone.toLocaleString()}
                </p>
              </div>
            )}

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
                <Button size="lg" onClick={toggleRunning}>
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
                  <Button variant="outline" size="lg" onClick={() => selectMode(mode)}>
                    Back to ready
                  </Button>
                  <Button variant="outline" size="lg" onClick={shareResult}>
                    <Share2 /> {shareStatus || "Share result"}
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
            <StatCard label="Speed" value={`Level ${speedLevel}`} icon={Gauge} />
          </div>

          <ArenaPanel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Daily challenge</p>
                <p className="mt-2 text-sm font-bold">{dailyChallenge.title}</p>
              </div>
              {dailyCompleted ? (
                <CheckCircle2 className="size-6 text-neon" />
              ) : (
                <Target className="size-6 text-warning" />
              )}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {dailyChallenge.description}
            </p>
            <Progress
              value={
                mode === dailyChallenge.mode
                  ? Math.min(100, (state.score / dailyChallenge.target) * 100)
                  : dailyCompleted
                    ? 100
                    : 0
              }
              className="mt-4"
            />
            {!dailyCompleted && mode !== dailyChallenge.mode && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => selectMode(dailyChallenge.mode)}
              >
                Switch to {dailyChallenge.mode === "walls" ? "Classic" : "Wrap"}
              </Button>
            )}
          </ArenaPanel>

          <ArenaPanel className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Medal className="size-4 text-electric" />
                <p className="text-sm font-bold">Achievements</p>
              </div>
              <span className="font-display text-xs text-neon">
                {achievements.filter((achievement) => achievement.unlocked).length}/
                {achievements.length}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    achievement.unlocked
                      ? "border-primary/25 bg-primary/8"
                      : "border-border/60 bg-background/25"
                  }`}
                >
                  {achievement.unlocked ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-neon" />
                  ) : (
                    <LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-xs font-bold">{achievement.title}</p>
                    <p className="mt-1 text-[0.6875rem] leading-4 text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ArenaPanel>

          <ArenaPanel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Speed level {speedLevel}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tickMs}ms per move · faster every 70 points
                </p>
              </div>
              <Waves className="size-5 text-electric" />
            </div>
            <Progress value={getSpeedProgress(state.score)} className="mt-4" />
          </ArenaPanel>

          <ArenaPanel className="p-5">
            <p className="eyebrow">Run controls</p>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => startRun(mode)}>
                <RotateCcw /> {hasStarted ? "Restart run" : "Start run"}
              </Button>
              <Button
                variant="outline"
                onClick={toggleRunning}
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
              <AudioLines className="size-4 text-electric" />
              <p className="text-sm font-bold">Game feel</p>
            </div>
            <div className="mt-4 space-y-4">
              <PreferenceRow
                icon={preferences.sound ? Volume2 : VolumeX}
                label="Sound effects"
                checked={preferences.sound}
                onCheckedChange={(sound) => setPreferences((current) => ({ ...current, sound }))}
              />
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Volume</span>
                  <span>{Math.round(preferences.volume * 100)}%</span>
                </div>
                <Slider
                  value={[preferences.volume * 100]}
                  max={100}
                  step={5}
                  disabled={!preferences.sound}
                  onValueChange={([volume]) =>
                    setPreferences((current) => ({ ...current, volume: volume / 100 }))
                  }
                />
              </div>
              <PreferenceRow
                icon={Sparkles}
                label="Reduced motion"
                checked={preferences.reducedMotion}
                onCheckedChange={(reducedMotion) =>
                  setPreferences((current) => ({ ...current, reducedMotion }))
                }
              />
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

function PreferenceRow({
  icon: Icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-4 text-electric" /> {label}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
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
  const totalSeconds = Math.floor(milliseconds / 1_000);
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

function readPreferences(): GamePreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const stored = JSON.parse(
      window.localStorage.getItem("snake-dash-preferences") ?? "{}",
    ) as Partial<GamePreferences>;
    return {
      sound: stored.sound ?? DEFAULT_PREFERENCES.sound,
      volume: stored.volume ?? DEFAULT_PREFERENCES.volume,
      reducedMotion: stored.reducedMotion ?? DEFAULT_PREFERENCES.reducedMotion,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}
