import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { ArenaPanel } from "@/components/ArenaPanel";
import { useI18n } from "@/lib/i18n";

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Log in — Snake Dash" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      navigate({ to: redirect || "/play" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell flex justify-center py-12 sm:py-20">
      <ArenaPanel className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-7">
          <div className="mb-5 grid size-12 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-neon">
            <Activity />
          </div>
          <p className="eyebrow">{t.auth.playerAccess}</p>
          <h1 className="font-display mt-2 text-3xl font-black">{t.auth.welcomeBack}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.auth.loginIntro}</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="u" className="flex items-center gap-2">
              <UserRound className="size-3.5 text-electric" /> {t.auth.username}
            </Label>
            <Input
              id="u"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p" className="flex items-center gap-2">
              <LockKeyhole className="size-3.5 text-electric" /> {t.auth.password}
            </Label>
            <Input
              id="p"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? (
              t.auth.loggingIn
            ) : (
              <>
                {t.auth.enterArena} <ArrowRight />
              </>
            )}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {t.auth.noAccount}{" "}
          <Link to="/signup" className="font-semibold text-electric hover:underline">
            {t.auth.createOne}
          </Link>
        </p>
      </ArenaPanel>
    </div>
  );
}
