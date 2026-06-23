import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getService } from "@/services";
import type { User } from "@/services/types";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  signup: (u: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getService().getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await getService().login(username, password);
    setUser(u);
  }, []);
  const signup = useCallback(async (username: string, password: string) => {
    const u = await getService().signup(username, password);
    setUser(u);
  }, []);
  const logout = useCallback(async () => {
    await getService().logout();
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, login, signup, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
