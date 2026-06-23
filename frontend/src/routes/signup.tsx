import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { ArenaPanel } from "@/components/ArenaPanel";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Snake Dash" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signup(username, password);
      navigate({ to: "/play" });
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
          <p className="eyebrow">New challenger</p>
          <h1 className="font-display mt-2 text-3xl font-black">Create your player</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Join the arena and start building your record.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="u" className="flex items-center gap-2">
              <UserRound className="size-3.5 text-electric" /> Username
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
              <LockKeyhole className="size-3.5 text-electric" /> Password
            </Label>
            <Input
              id="p"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? (
              "Creating…"
            ) : (
              <>
                Join the arena <ArrowRight />
              </>
            )}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-electric hover:underline">
            Log in
          </Link>
        </p>
      </ArenaPanel>
    </div>
  );
}
