/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Mode } from "@/lib/snake-engine";

export type Language = "en" | "hu" | "sk";

type AchievementCopy = {
  title: string;
  description: string;
};

type Translations = {
  language: string;
  nav: {
    play: string;
    ranks: string;
    watch: string;
    login: string;
    logout: string;
  };
  common: {
    score: string;
    combo: string;
    speed: string;
    time: string;
    length: string;
    bestScore: string;
    classic: string;
    wrap: string;
    mode: string;
    live: string;
    online: string;
    you: string;
    loadingArena: string;
    level: string;
    lv: string;
  };
  modes: Record<Mode, { label: string; description: string; modeLabel: string }>;
  root: {
    lostSignal: string;
    notFound: string;
    returnHome: string;
    systemError: string;
    somethingWrong: string;
    tryAgain: string;
  };
  home: {
    metaTitle: string;
    metaDescription: string;
    onlineBadge: string;
    eyebrow: string;
    headlineOne: string;
    headlineTwo: string;
    intro: string;
    enterArena: string;
    viewRankings: string;
    demoAccess: string;
    arenaPreview: string;
    liveGrid: string;
    scoreShort: string;
    lengthShort: string;
    cards: Array<{ title: string; text: string }>;
    footer: string;
  };
  auth: {
    loginTitle: string;
    signupTitle: string;
    playerAccess: string;
    welcomeBack: string;
    loginIntro: string;
    username: string;
    password: string;
    loggingIn: string;
    enterArena: string;
    noAccount: string;
    createOne: string;
    newChallenger: string;
    createPlayer: string;
    signupIntro: string;
    creating: string;
    joinArena: string;
    alreadyRegistered: string;
  };
  play: {
    title: string;
    player: string;
    enterArena: string;
    controlsHint: string;
    scoreMilestone: string;
    readyTitle: string;
    readyDescription: string;
    startRun: string;
    getReady: string;
    countdownDescription: string;
    runPaused: string;
    paused: string;
    pausedDescription: string;
    resumeRun: string;
    newPersonalBest: string;
    runComplete: string;
    gameOver: string;
    finalScore: (score: string, length: number) => string;
    playAgain: string;
    backToReady: string;
    shareResult: string;
    shared: string;
    copied: string;
    zoomOut: string;
    arenaSize: string;
    zoomIn: string;
    fitWindow: string;
    exitFocus: string;
    focusMode: string;
    dailyChallenge: string;
    switchTo: (mode: string) => string;
    achievements: string;
    speedLevel: (level: number) => string;
    speedProgress: (ms: number) => string;
    runControls: string;
    restartRun: string;
    pause: string;
    resume: string;
    gameFeel: string;
    soundEffects: string;
    volume: string;
    reducedMotion: string;
    controls: string;
    move: string;
    shareText: (score: string, mode: string) => string;
    shareTitle: string;
    status: {
      ended: string;
      starting: string;
      ready: string;
      active: string;
      paused: string;
    };
  };
  progress: {
    dailyTitle: (target: number, mode: string) => string;
    dailyDescription: (target: number, mode: string) => string;
    achievements: Record<string, AchievementCopy>;
  };
  leaderboard: {
    title: string;
    globalStandings: string;
    arenaRankings: string;
    intro: string;
    allTime: string;
    thisWeek: string;
    today: string;
    yourRank: (rank: number) => string;
    topPlayers: string;
    ranked: (count: number) => string;
    noScores: string;
    noScoresDescription: string;
    startChallenge: string;
    challenge: string;
    challengeTitle: (username: string) => string;
    justNow: string;
    minutesAgo: (count: number) => string;
    hoursAgo: (count: number) => string;
    daysAgo: (count: number) => string;
  };
  watch: {
    title: string;
    liveFeed: string;
    activeRuns: string;
    intro: string;
    liveCount: (count: number) => string;
    sortScore: string;
    sortLength: string;
    quietTitle: string;
    quietDescription: string;
    startPlaying: string;
    watchLive: string;
    detailTitle: string;
    unavailableTitle: string;
    unavailableDescription: string;
    allActiveRuns: string;
    liveSpectator: string;
    userRun: (username: string) => string;
    allRuns: string;
    tick: (tick: number) => string;
    foodEaten: string;
    runTelemetry: string;
    moves: string;
    currentInterval: string;
    boardCoverage: string;
  };
};

const translations: Record<Language, Translations> = {
  en: {
    language: "Language",
    nav: { play: "Play", ranks: "Ranks", watch: "Watch", login: "Log in", logout: "Log out" },
    common: {
      score: "Score",
      combo: "Combo",
      speed: "Speed",
      time: "Time",
      length: "Length",
      bestScore: "Best score",
      classic: "Classic",
      wrap: "Wrap",
      mode: "mode",
      live: "Live",
      online: "Online",
      you: "You",
      loadingArena: "Loading arena...",
      level: "Level",
      lv: "Lv",
    },
    modes: {
      walls: { label: "Classic", description: "Walls end the run", modeLabel: "Classic mode" },
      passthrough: { label: "Wrap", description: "Edges loop around", modeLabel: "Wrap mode" },
    },
    root: {
      lostSignal: "Lost signal",
      notFound: "This arena could not be found.",
      returnHome: "Return home",
      systemError: "System error",
      somethingWrong: "Something went wrong",
      tryAgain: "Try again",
    },
    home: {
      metaTitle: "Snake Dash - Play, compete, watch",
      metaDescription:
        "A modern multiplayer-ready Snake game with walls and pass-through modes, leaderboards, and live spectating.",
      onlineBadge: "The arena is online",
      eyebrow: "Classic game. Sharper edge.",
      headlineOne: "Chase the score.",
      headlineTwo: "Own the grid.",
      intro:
        "A fast, competitive Snake arena with two game modes, global rankings, and live runs you can watch in real time.",
      enterArena: "Enter arena",
      viewRankings: "View rankings",
      demoAccess: "Demo access:",
      arenaPreview: "Arena preview",
      liveGrid: "Live grid",
      scoreShort: "SCORE",
      lengthShort: "LENGTH",
      cards: [
        { title: "Classic walls", text: "Precision matters. One wrong turn ends the run." },
        { title: "Wrap mode", text: "Cross an edge and continue from the opposite side." },
        { title: "Live arena", text: "Follow active players and watch high-score runs unfold." },
      ],
      footer: "Built for quick runs and serious scores",
    },
    auth: {
      loginTitle: "Log in - Snake Dash",
      signupTitle: "Sign up - Snake Dash",
      playerAccess: "Player access",
      welcomeBack: "Welcome back",
      loginIntro: "Log in to continue your run up the rankings.",
      username: "Username",
      password: "Password",
      loggingIn: "Logging in...",
      enterArena: "Enter arena",
      noAccount: "No account?",
      createOne: "Create one",
      newChallenger: "New challenger",
      createPlayer: "Create your player",
      signupIntro: "Join the arena and start building your record.",
      creating: "Creating...",
      joinArena: "Join the arena",
      alreadyRegistered: "Already registered?",
    },
    play: {
      title: "Play - Snake Dash",
      player: "Player:",
      enterArena: "Enter the arena",
      controlsHint: "Use arrow keys or WASD to move - Space to pause",
      scoreMilestone: "Score milestone",
      readyTitle: "Ready?",
      readyDescription: "Choose your opening move, then start the run.",
      startRun: "Start run",
      getReady: "Get ready",
      countdownDescription: "The run is about to begin.",
      runPaused: "Run paused",
      paused: "Paused",
      pausedDescription: "Take a breath. The grid will wait.",
      resumeRun: "Resume run",
      newPersonalBest: "New personal best",
      runComplete: "Run complete",
      gameOver: "Game over",
      finalScore: (score, length) => `Final score ${score} - Length ${length}`,
      playAgain: "Play again",
      backToReady: "Back to ready",
      shareResult: "Share result",
      shared: "Shared",
      copied: "Copied",
      zoomOut: "Zoom arena out",
      arenaSize: "Arena size",
      zoomIn: "Zoom arena in",
      fitWindow: "Fit window",
      exitFocus: "Exit focus",
      focusMode: "Focus mode",
      dailyChallenge: "Daily challenge",
      switchTo: (mode) => `Switch to ${mode}`,
      achievements: "Achievements",
      speedLevel: (level) => `Speed level ${level}`,
      speedProgress: (ms) => `${ms}ms per move - faster every 70 points`,
      runControls: "Run controls",
      restartRun: "Restart run",
      pause: "Pause",
      resume: "Resume",
      gameFeel: "Game feel",
      soundEffects: "Sound effects",
      volume: "Volume",
      reducedMotion: "Reduced motion",
      controls: "Controls",
      move: "move",
      shareText: (score, mode) =>
        `I scored ${score} in ${mode} mode on Snake Dash. Can you beat it?`,
      shareTitle: "Snake Dash result",
      status: {
        ended: "Run ended",
        starting: "Starting",
        ready: "Ready",
        active: "Run active",
        paused: "Run paused",
      },
    },
    progress: {
      dailyTitle: (target, mode) => `${target} point ${mode.toLowerCase()} run`,
      dailyDescription: (target, mode) => `Score ${target} points in ${mode} mode today.`,
      achievements: {
        "first-bite": {
          title: "First bite",
          description: "Finished a run with at least 10 points.",
        },
        century: { title: "Century", description: "Scored 100 points in one run." },
        "combo-artist": { title: "Combo artist", description: "Reached a x3 combo." },
        "speed-runner": { title: "Speed runner", description: "Reached speed level 4." },
        "long-game": { title: "Long game", description: "Grew to length 15." },
        "mode-master": { title: "Mode master", description: "Completed the daily challenge." },
      },
    },
    leaderboard: {
      title: "Leaderboard - Snake Dash",
      globalStandings: "Global standings",
      arenaRankings: "Arena rankings",
      intro: "Compare runs, find your position, and chase the next score.",
      allTime: "All time",
      thisWeek: "This week",
      today: "Today",
      yourRank: (rank) => `Your rank is #${rank}`,
      topPlayers: "Top players",
      ranked: (count) => `${count} ranked`,
      noScores: "No scores in this period",
      noScoresDescription: "Change the time filter or become the first player on this board.",
      startChallenge: "Start a challenge",
      challenge: "Challenge",
      challengeTitle: (username) => `Challenge ${username}'s score`,
      justNow: "just now",
      minutesAgo: (count) => `${count}m ago`,
      hoursAgo: (count) => `${count}h ago`,
      daysAgo: (count) => `${count}d ago`,
    },
    watch: {
      title: "Watch - Snake Dash",
      liveFeed: "Live feed",
      activeRuns: "Active runs",
      intro: "Preview the grid, compare live stats, and jump into any active run.",
      liveCount: (count) => `${count} live`,
      sortScore: "Score",
      sortLength: "Length",
      quietTitle: "The arena is quiet",
      quietDescription:
        "There are no active runs right now. Start a game and become the one everyone watches.",
      startPlaying: "Start playing",
      watchLive: "Watch live",
      detailTitle: "Watching game - Snake Dash",
      unavailableTitle: "Run unavailable",
      unavailableDescription: "This game has ended or the live feed no longer exists.",
      allActiveRuns: "All active runs",
      liveSpectator: "Live spectator",
      userRun: (username) => `${username}'s run`,
      allRuns: "All runs",
      tick: (tick) => `Tick ${tick}`,
      foodEaten: "Food eaten",
      runTelemetry: "Run telemetry",
      moves: "Moves",
      currentInterval: "Current interval",
      boardCoverage: "Board coverage",
    },
  },
  hu: {
    language: "Nyelv",
    nav: {
      play: "Játék",
      ranks: "Rangsor",
      watch: "Nézés",
      login: "Bejelentkezés",
      logout: "Kijelentkezés",
    },
    common: {
      score: "Pontszám",
      combo: "Kombó",
      speed: "Sebesség",
      time: "Idő",
      length: "Hossz",
      bestScore: "Legjobb pontszám",
      classic: "Klasszikus",
      wrap: "Átjárható",
      mode: "mód",
      live: "Élő",
      online: "Online",
      you: "Te",
      loadingArena: "Aréna betöltése...",
      level: "Szint",
      lv: "Sz.",
    },
    modes: {
      walls: {
        label: "Klasszikus",
        description: "A fal véget vet a futamnak",
        modeLabel: "Klasszikus mód",
      },
      passthrough: {
        label: "Átjárható",
        description: "A szélek átvezetnek a túloldalra",
        modeLabel: "Átjárható mód",
      },
    },
    root: {
      lostSignal: "Elveszett jel",
      notFound: "Ez az aréna nem található.",
      returnHome: "Vissza a főoldalra",
      systemError: "Rendszerhiba",
      somethingWrong: "Valami hiba történt",
      tryAgain: "Újra",
    },
    home: {
      metaTitle: "Snake Dash - Játék, verseny, nézés",
      metaDescription:
        "Modern, többjátékosra kész Snake játék falas és átjárható módokkal, ranglistával és élő nézéssel.",
      onlineBadge: "Az aréna online",
      eyebrow: "Klasszikus játék. Élesebb kihívás.",
      headlineOne: "Űzd a pontokat.",
      headlineTwo: "Uralkodj a pályán.",
      intro:
        "Gyors, versenyalapú Snake aréna két játékmóddal, globális ranglistával és valós időben nézhető futamokkal.",
      enterArena: "Belépés az arénába",
      viewRankings: "Rangsor megnézése",
      demoAccess: "Demo hozzáférés:",
      arenaPreview: "Aréna előnézet",
      liveGrid: "Élő pálya",
      scoreShort: "PONTSZÁM",
      lengthShort: "HOSSZ",
      cards: [
        {
          title: "Klasszikus falak",
          text: "A pontosság számít. Egy rossz fordulás véget vet a futamnak.",
        },
        { title: "Átjárható mód", text: "Lépj át a szélen, és folytasd a túloldalon." },
        { title: "Élő aréna", text: "Kövesd az aktív játékosokat és a rekordfutamokat." },
      ],
      footer: "Gyors futamokra és komoly pontokra tervezve",
    },
    auth: {
      loginTitle: "Bejelentkezés - Snake Dash",
      signupTitle: "Regisztráció - Snake Dash",
      playerAccess: "Játékos belépés",
      welcomeBack: "Üdvözlünk újra",
      loginIntro: "Jelentkezz be, és folytasd az utad felfelé a rangsorban.",
      username: "Felhasználónév",
      password: "Jelszó",
      loggingIn: "Bejelentkezés...",
      enterArena: "Belépés az arénába",
      noAccount: "Nincs fiókod?",
      createOne: "Hozz létre egyet",
      newChallenger: "Új kihívó",
      createPlayer: "Játékos létrehozása",
      signupIntro: "Csatlakozz az arénához, és kezdd el építeni a rekordodat.",
      creating: "Létrehozás...",
      joinArena: "Csatlakozás az arénához",
      alreadyRegistered: "Már regisztráltál?",
    },
    play: {
      title: "Játék - Snake Dash",
      player: "Játékos:",
      enterArena: "Belépés az arénába",
      controlsHint: "Nyilak vagy WASD a mozgásra - Szóköz a szünethez",
      scoreMilestone: "Pontszám mérföldkő",
      readyTitle: "Kész?",
      readyDescription: "Válaszd ki az első lépést, majd indítsd a futamot.",
      startRun: "Futam indítása",
      getReady: "Készülj",
      countdownDescription: "A futam mindjárt indul.",
      runPaused: "Futam szüneteltetve",
      paused: "Szünet",
      pausedDescription: "Vegyél egy levegőt. A pálya megvár.",
      resumeRun: "Futam folytatása",
      newPersonalBest: "Új egyéni rekord",
      runComplete: "Futam vége",
      gameOver: "Játék vége",
      finalScore: (score, length) => `Végső pontszám ${score} - Hossz ${length}`,
      playAgain: "Újra játszom",
      backToReady: "Vissza kész állapotba",
      shareResult: "Eredmény megosztása",
      shared: "Megosztva",
      copied: "Másolva",
      zoomOut: "Aréna kicsinyítése",
      arenaSize: "Aréna mérete",
      zoomIn: "Aréna nagyítása",
      fitWindow: "Ablakhoz igazít",
      exitFocus: "Fókusz kilépés",
      focusMode: "Fókusz mód",
      dailyChallenge: "Napi kihívás",
      switchTo: (mode) => `Váltás erre: ${mode}`,
      achievements: "Eredmények",
      speedLevel: (level) => `Sebességi szint ${level}`,
      speedProgress: (ms) => `${ms} ms lépésenként - 70 pontonként gyorsul`,
      runControls: "Futam vezérlés",
      restartRun: "Futam újraindítása",
      pause: "Szünet",
      resume: "Folytatás",
      gameFeel: "Játékélmény",
      soundEffects: "Hangeffektek",
      volume: "Hangerő",
      reducedMotion: "Kevesebb animáció",
      controls: "Irányítás",
      move: "mozgás",
      shareText: (score, mode) =>
        `${score} pontot szereztem ${mode} módban a Snake Dash-ben. Le tudsz győzni?`,
      shareTitle: "Snake Dash eredmény",
      status: {
        ended: "Futam vége",
        starting: "Indulás",
        ready: "Kész",
        active: "Futam aktív",
        paused: "Futam szünet",
      },
    },
    progress: {
      dailyTitle: (target, mode) => `${target} pontos ${mode.toLowerCase()} futam`,
      dailyDescription: (target, mode) => `Szerezz ma ${target} pontot ${mode} módban.`,
      achievements: {
        "first-bite": {
          title: "Első falat",
          description: "Fejezz be egy futamot legalább 10 ponttal.",
        },
        century: { title: "Százas", description: "Szerezz 100 pontot egy futamban." },
        "combo-artist": { title: "Kombó művész", description: "Érj el x3 kombót." },
        "speed-runner": { title: "Sebességi futó", description: "Érj el 4-es sebességi szintet." },
        "long-game": { title: "Hosszú játék", description: "Növekedj 15-ös hosszra." },
        "mode-master": { title: "Módmester", description: "Teljesítsd a napi kihívást." },
      },
    },
    leaderboard: {
      title: "Ranglista - Snake Dash",
      globalStandings: "Globális állás",
      arenaRankings: "Aréna rangsor",
      intro: "Hasonlítsd össze a futamokat, találd meg a helyed, és célozd a következő pontszámot.",
      allTime: "Összes idő",
      thisWeek: "Ezen a héten",
      today: "Ma",
      yourRank: (rank) => `A helyezésed #${rank}`,
      topPlayers: "Legjobb játékosok",
      ranked: (count) => `${count} rangsorolt`,
      noScores: "Nincs pontszám ebben az időszakban",
      noScoresDescription: "Válts időszűrőt, vagy légy az első játékos ezen a táblán.",
      startChallenge: "Kihívás indítása",
      challenge: "Kihívás",
      challengeTitle: (username) => `${username} pontszámának kihívása`,
      justNow: "épp most",
      minutesAgo: (count) => `${count} perce`,
      hoursAgo: (count) => `${count} órája`,
      daysAgo: (count) => `${count} napja`,
    },
    watch: {
      title: "Nézés - Snake Dash",
      liveFeed: "Élő közvetítés",
      activeRuns: "Aktív futamok",
      intro:
        "Nézd meg a pályát, hasonlítsd össze az élő adatokat, és ugorj be bármelyik aktív futamba.",
      liveCount: (count) => `${count} élő`,
      sortScore: "Pontszám",
      sortLength: "Hossz",
      quietTitle: "Csendes az aréna",
      quietDescription: "Most nincs aktív futam. Indíts játékot, és legyél te, akit mindenki néz.",
      startPlaying: "Játék indítása",
      watchLive: "Élő nézés",
      detailTitle: "Játék nézése - Snake Dash",
      unavailableTitle: "Futam nem elérhető",
      unavailableDescription: "Ez a játék véget ért, vagy az élő közvetítés már nem létezik.",
      allActiveRuns: "Minden aktív futam",
      liveSpectator: "Élő néző",
      userRun: (username) => `${username} futama`,
      allRuns: "Összes futam",
      tick: (tick) => `Lépés ${tick}`,
      foodEaten: "Elfogyasztott étel",
      runTelemetry: "Futam telemetria",
      moves: "Lépések",
      currentInterval: "Aktuális időköz",
      boardCoverage: "Pálya lefedettség",
    },
  },
  sk: {
    language: "Jazyk",
    nav: {
      play: "Hrať",
      ranks: "Poradie",
      watch: "Sledovať",
      login: "Prihlásiť",
      logout: "Odhlásiť",
    },
    common: {
      score: "Skore",
      combo: "Kombó",
      speed: "Rýchlosť",
      time: "Čas",
      length: "Dĺžka",
      bestScore: "Najlepšie skóre",
      classic: "Klasika",
      wrap: "Prechod",
      mode: "režim",
      live: "Naživo",
      online: "Online",
      you: "Ty",
      loadingArena: "Načítava sa aréna...",
      level: "Úroveň",
      lv: "Ur.",
    },
    modes: {
      walls: { label: "Klasika", description: "Steny ukončia hru", modeLabel: "Klasický režim" },
      passthrough: {
        label: "Prechod",
        description: "Okraje vedú na opačnú stranu",
        modeLabel: "Prechodový režim",
      },
    },
    root: {
      lostSignal: "Stratený signál",
      notFound: "Táto aréna sa nenašla.",
      returnHome: "Späť domov",
      systemError: "Systémová chyba",
      somethingWrong: "Niečo sa pokazilo",
      tryAgain: "Skúsiť znova",
    },
    home: {
      metaTitle: "Snake Dash - Hraj, súťaž, sleduj",
      metaDescription:
        "Moderný Snake pripravený na multiplayer so stenami a prechodovým režimom, rebríčkami a živým sledovaním.",
      onlineBadge: "Aréna je online",
      eyebrow: "Klasická hra. Ostrejšia výzva.",
      headlineOne: "Naháňaj skóre.",
      headlineTwo: "Ovládni mriežku.",
      intro:
        "Rýchla súťažná Snake aréna s dvoma režimami, globálnym poradím a behmi, ktoré môžeš sledovať naživo.",
      enterArena: "Vstúpiť do arény",
      viewRankings: "Zobraziť poradie",
      demoAccess: "Demo prístup:",
      arenaPreview: "Náhľad arény",
      liveGrid: "Živá mriežka",
      scoreShort: "SKÓRE",
      lengthShort: "DĹŽKA",
      cards: [
        { title: "Klasické steny", text: "Presnosť rozhoduje. Jeden zlý ťah ukončí hru." },
        { title: "Prechodový režim", text: "Prejdi cez okraj a pokračuj na opačnej strane." },
        { title: "Živá aréna", text: "Sleduj aktívnych hráčov a rekordné behy." },
      ],
      footer: "Postavené na rýchle behy a vážne skóre",
    },
    auth: {
      loginTitle: "Prihlásenie - Snake Dash",
      signupTitle: "Registrácia - Snake Dash",
      playerAccess: "Prístup hráča",
      welcomeBack: "Vitaj späť",
      loginIntro: "Prihlás sa a pokračuj v stúpaní poradím.",
      username: "Používateľské meno",
      password: "Heslo",
      loggingIn: "Prihlasovanie...",
      enterArena: "Vstúpiť do arény",
      noAccount: "Nemáš účet?",
      createOne: "Vytvoriť účet",
      newChallenger: "Nový vyzývateľ",
      createPlayer: "Vytvor hráča",
      signupIntro: "Pridaj sa do arény a začni budovať svoj rekord.",
      creating: "Vytváranie...",
      joinArena: "Pridať sa do arény",
      alreadyRegistered: "Už si registrovaný?",
    },
    play: {
      title: "Hra - Snake Dash",
      player: "Hráč:",
      enterArena: "Vstúpiť do arény",
      controlsHint: "Šípky alebo WASD na pohyb - medzerník na pauzu",
      scoreMilestone: "Míľnik skóre",
      readyTitle: "Pripravený?",
      readyDescription: "Vyber prvý pohyb a spusti beh.",
      startRun: "Spustiť beh",
      getReady: "Priprav sa",
      countdownDescription: "Beh sa čoskoro začne.",
      runPaused: "Beh pozastavený",
      paused: "Pauza",
      pausedDescription: "Nadýchni sa. Mriežka počká.",
      resumeRun: "Pokračovať v behu",
      newPersonalBest: "Nový osobný rekord",
      runComplete: "Beh dokončený",
      gameOver: "Koniec hry",
      finalScore: (score, length) => `Konečné skóre ${score} - Dĺžka ${length}`,
      playAgain: "Hrať znova",
      backToReady: "Späť na prípravu",
      shareResult: "Zdieľať výsledok",
      shared: "Zdieľané",
      copied: "Skopírované",
      zoomOut: "Oddialiť arénu",
      arenaSize: "Veľkosť arény",
      zoomIn: "Priblížiť arénu",
      fitWindow: "Prispôsobiť oknu",
      exitFocus: "Ukončiť fokus",
      focusMode: "Fokus režim",
      dailyChallenge: "Denná výzva",
      switchTo: (mode) => `Prepnúť na ${mode}`,
      achievements: "Úspechy",
      speedLevel: (level) => `Úroveň rýchlosti ${level}`,
      speedProgress: (ms) => `${ms} ms na pohyb - rýchlejšie každých 70 bodov`,
      runControls: "Ovládanie behu",
      restartRun: "Reštartovať beh",
      pause: "Pauza",
      resume: "Pokračovať",
      gameFeel: "Pocit z hry",
      soundEffects: "Zvukové efekty",
      volume: "Hlasitosť",
      reducedMotion: "Menej animácií",
      controls: "Ovládanie",
      move: "pohyb",
      shareText: (score, mode) =>
        `V Snake Dash som získal ${score} bodov v režime ${mode}. Prekonáš ma?`,
      shareTitle: "Výsledok Snake Dash",
      status: {
        ended: "Beh skončil",
        starting: "Startuje",
        ready: "Pripravený",
        active: "Beh aktívny",
        paused: "Beh pozastavený",
      },
    },
    progress: {
      dailyTitle: (target, mode) => `${target}-bodový beh v režime ${mode.toLowerCase()}`,
      dailyDescription: (target, mode) => `Dnes získaj ${target} bodov v režime ${mode}.`,
      achievements: {
        "first-bite": { title: "Prvé sústo", description: "Dokonči beh aspoň s 10 bodmi." },
        century: { title: "Stovka", description: "Ziskaj 100 bodov v jednom behu." },
        "combo-artist": { title: "Kombó umelec", description: "Dosiahni x3 kombo." },
        "speed-runner": { title: "Rýchly bežec", description: "Dosiahni rýchlostnú úroveň 4." },
        "long-game": { title: "Dlhý beh", description: "Narasť na dĺžku 15." },
        "mode-master": { title: "Majster režimu", description: "Splň dennú výzvu." },
      },
    },
    leaderboard: {
      title: "Poradie - Snake Dash",
      globalStandings: "Globálne poradie",
      arenaRankings: "Poradie arény",
      intro: "Porovnaj behy, nájdi svoju pozíciu a naháňaj ďalšie skóre.",
      allTime: "Celkovo",
      thisWeek: "Tento týždeň",
      today: "Dnes",
      yourRank: (rank) => `Tvoje poradie je #${rank}`,
      topPlayers: "Najlepší hráči",
      ranked: (count) => `${count} v poradi`,
      noScores: "V tomto období nie sú skóre",
      noScoresDescription: "Zmeň časový filter alebo buď prvý hráč na tejto tabuli.",
      startChallenge: "Spustiť výzvu",
      challenge: "Výzva",
      challengeTitle: (username) => `Vyzvať skóre hráča ${username}`,
      justNow: "práve teraz",
      minutesAgo: (count) => `pred ${count} min`,
      hoursAgo: (count) => `pred ${count} h`,
      daysAgo: (count) => `pred ${count} d`,
    },
    watch: {
      title: "Sledovať - Snake Dash",
      liveFeed: "Živý prenos",
      activeRuns: "Aktívne behy",
      intro: "Pozri si mriežku, porovnaj živé štatistiky a vstúp do ľubovoľného aktívneho behu.",
      liveCount: (count) => `${count} naživo`,
      sortScore: "Skóre",
      sortLength: "Dĺžka",
      quietTitle: "Aréna je tichá",
      quietDescription:
        "Práve teraz nie sú aktívne behy. Spusti hru a buď tým, koho budú sledovať.",
      startPlaying: "Začať hrať",
      watchLive: "Sledovať naživo",
      detailTitle: "Sledovanie hry - Snake Dash",
      unavailableTitle: "Beh nie je dostupny",
      unavailableDescription: "Táto hra sa skončila alebo živý prenos už neexistuje.",
      allActiveRuns: "Všetky aktívne behy",
      liveSpectator: "Živý divák",
      userRun: (username) => `Beh hráča ${username}`,
      allRuns: "Všetky behy",
      tick: (tick) => `Tik ${tick}`,
      foodEaten: "Zjedené jedlo",
      runTelemetry: "Telemetria behu",
      moves: "Pohyby",
      currentInterval: "Aktuálny interval",
      boardCoverage: "Pokrytie plochy",
    },
  },
};

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const languageOptions: Array<{ value: Language; label: string }> = [
  { value: "en", label: "EN" },
  { value: "hu", label: "HU" },
  { value: "sk", label: "SK" },
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("snake-dash-language", nextLanguage);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const storedLanguage = readLanguage();
    if (storedLanguage !== "en") setLanguageState(storedLanguage);
  }, []);

  const value = useMemo(() => ({ language, setLanguage, t: translations[language] }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be inside LanguageProvider");
  return value;
}

function readLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("snake-dash-language");
  return stored === "hu" || stored === "sk" ? stored : "en";
}
