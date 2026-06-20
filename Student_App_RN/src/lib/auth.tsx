import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthUser } from "@/lib/types";
import * as api from "@/lib/api";
import { connectChatSocket, disconnectChatSocket } from "@/lib/ws";

interface AuthContextValue {
  /** null = anonymous (Feed is still browsable). */
  user: AuthUser | null;
  loading: boolean;
  isGuest: boolean;
  /** Logged in with full student rights (not a guest). */
  isStudent: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  guest: (email: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const me = await api.me();
    setUser(me);
    if (me && me.role !== "guest") connectChatSocket();
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api.login(email, password);
    setUser(user);
    connectChatSocket();
  }, []);

  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { user } = await api.signup(email, password, displayName);
      setUser(user);
      connectChatSocket();
    },
    []
  );

  const guest = useCallback(async (email: string, displayName?: string) => {
    const { user } = await api.guest(email, displayName);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    disconnectChatSocket();
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isGuest: user?.role === "guest",
      isStudent: user?.role === "student",
      login,
      signup,
      guest,
      logout,
      refresh,
    }),
    [user, loading, login, signup, guest, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
