/**
 * http.ts — fetch wrapper, env flags, and demo auth for the dashboard.
 *
 * The dashboard is an employee client: every /internal/** call needs an employee
 * JWT. There's no login screen in the demo, so we auto-authenticate once with a
 * demo employee account (overridable via env) and cache the token. api.ts calls
 * ensureAuth() before any authenticated request.
 *
 * Data source: with NEXT_PUBLIC_USE_MOCKS=false (recommended for atomic, DB-backed
 * data) calls hit the FastAPI backend; api.ts falls back to bundled mocks per-call
 * if a request fails, so the demo never hard-breaks. With it "true", everything is
 * served from mocks offline.
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

/** Mocks only when explicitly requested; default is the live backend. */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? `${API_BASE_URL.replace(/^http/, "ws")}/ws/chat`;

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "simon.haeckner@we-online.de";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "weave";

const TOKEN_KEY = "weave_token";
const USER_KEY = "weave_user_id";

let memToken: string | null = null;
let memUserId: string | null = null;

export function getToken(): string | null {
  if (memToken) return memToken;
  if (typeof window === "undefined") return null;
  try {
    memToken = window.localStorage.getItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  return memToken;
}

export function getCurrentUserId(): string | null {
  if (memUserId) return memUserId;
  if (typeof window === "undefined") return null;
  try {
    memUserId = window.localStorage.getItem(USER_KEY);
  } catch {
    /* ignore */
  }
  return memUserId;
}

function persistSession(token: string, userId: string | null) {
  memToken = token;
  memUserId = userId;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    if (userId) window.localStorage.setItem(USER_KEY, userId);
  } catch {
    /* ignore */
  }
}

let authPromise: Promise<void> | null = null;

/** Ensure a valid employee token exists (auto-login once, deduped). */
export async function ensureAuth(): Promise<void> {
  if (getToken()) return;
  if (!authPromise) {
    authPromise = (async () => {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
      });
      if (!res.ok) throw new Error(`auth failed: ${res.status}`);
      const data = await res.json();
      persistSession(data.token, data?.user?.id ?? null);
    })().catch((e) => {
      authPromise = null; // allow retry on next call
      throw e;
    });
  }
  return authPromise;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.error?.message ?? body?.detail ?? detail;
    } catch {
      /* non-JSON */
    }
    throw new Error(`${res.status} ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  await ensureAuth();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  return handle<T>(res);
}

export async function apiSend<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  await ensureAuth();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  return handle<T>(res);
}
