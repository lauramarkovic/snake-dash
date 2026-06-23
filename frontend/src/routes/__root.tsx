import { createRootRouteWithContext, HeadContent, Link, Outlet, Scripts, useRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found.</p>
        <Link to="/" className="mt-6 inline-block underline">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={() => { router.invalidate(); reset(); }}>Try again</Button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Snake Arena" },
      { name: "description", content: "Play Snake with classic walls or wrap-around mode, climb the leaderboard, and watch other players live." },
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
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Header />
          <main className="flex-1"><Outlet /></main>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold tracking-tight">🐍 Snake Arena</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/play" className="hover:underline" activeProps={{ className: "font-semibold underline" }}>Play</Link>
          <Link to="/leaderboard" className="hover:underline" activeProps={{ className: "font-semibold underline" }}>Leaderboard</Link>
          <Link to="/watch" className="hover:underline" activeProps={{ className: "font-semibold underline" }}>Watch</Link>
          {user ? (
            <>
              <span className="text-muted-foreground">{user.username}</span>
              <Button size="sm" variant="outline" onClick={logout}>Log out</Button>
            </>
          ) : (
            <Link to="/login" className="hover:underline">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
