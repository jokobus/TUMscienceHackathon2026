import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { EmployeeProfile } from "@/lib/types";
import * as api from "@/lib/api";
import { connectChatSocket, disconnectChatSocket } from "@/lib/ws";

interface AuthContextValue {
  employee: EmployeeProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setEmployee: (e: EmployeeProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const me = await api.me();
    setEmployee(me);
    if (me) connectChatSocket();
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api.login(email, password);
    setEmployee(user);
    connectChatSocket();
  }, []);

  const logout = useCallback(async () => {
    disconnectChatSocket();
    await api.logout();
    setEmployee(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ employee, loading, login, logout, refresh, setEmployee }),
    [employee, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
