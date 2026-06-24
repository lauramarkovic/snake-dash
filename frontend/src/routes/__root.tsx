import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { Activity, Eye, Gamepad2, LogIn, LogOut, Trophy, UserRound } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LanguageProvider, languageOptions, useI18n } from "@/lib/i18n";

function NotFoundComponent() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="arena-panel max-w-md rounded-2xl p-10 text-center">
        <p className="eyebrow">{t.root.lostSignal}</p>
        <h1 className="font-display neon-text mt-3 text-7xl font-black">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.root.notFound}</p>
        <Button asChild className="mt-6">
          <Link to="/">{t.root.returnHome}</Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const { t } = useI18n();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="arena-panel max-w-md rounded-2xl p-8 text-center space-y-4">
        <p className="eyebrow">{t.root.systemError}</p>
        <h1 className="font-display text-xl font-bold">{t.root.somethingWrong}</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          {t.root.tryAgain}
        </Button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Snake Dash" },
      {
        name: "description",
        content:
          "Play Snake with classic walls or wrap-around mode, climb the leaderboard, and watch other players live.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col text-foreground">
            <Header />
            <main className="flex-1">
              <Outlet />
            </main>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

function Header() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const navItems = [
    { to: "/play" as const, label: t.nav.play, icon: Gamepad2 },
    { to: "/leaderboard" as const, label: t.nav.ranks, icon: Trophy },
    { to: "/watch" as const, label: t.nav.watch, icon: Eye },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-neon shadow-[0_0_24px_oklch(0.86_0.24_135/0.12)]">
            <Activity className="size-5 transition-transform group-hover:scale-110" />
          </span>
          <span className="font-display text-sm font-black uppercase tracking-[0.12em] sm:text-base">
            Snake <span className="neon-text">Dash</span>
          </span>
        </Link>
        <nav className="order-3 flex w-full items-center justify-center gap-1 rounded-xl border border-border/60 bg-card/45 p-1 text-sm sm:order-2 sm:w-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:flex-none"
              activeProps={{ className: "bg-secondary text-neon" }}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="order-2 flex items-center gap-2 sm:order-3">
          <div
            className="flex rounded-lg border border-border/70 bg-card/45 p-0.5"
            aria-label={t.language}
          >
            {languageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLanguage(option.value)}
                className={`rounded-md px-2 py-1 text-xs font-bold transition-colors ${
                  language === option.value
                    ? "bg-secondary text-neon"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={language === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
          {user ? (
            <>
              <span className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
                <UserRound className="size-4 text-electric" />
                {user.username}
              </span>
              <Button size="sm" variant="ghost" onClick={logout} aria-label={t.nav.logout}>
                <LogOut />
                <span className="hidden sm:inline">{t.nav.logout}</span>
              </Button>
            </>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link to="/login">
                <LogIn /> {t.nav.login}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
