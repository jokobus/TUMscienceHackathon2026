/**
 * http.ts — the single network boundary for the real backend (WEAVE_MASTER §6/§7).
 *
 * The app runs in two modes:
 *   • mock mode (default): EXPO_PUBLIC_API_BASE_URL is empty → lib/api.ts serves seed data.
 *   • backend mode: set EXPO_PUBLIC_API_BASE_URL (e.g. https://api.weave.de) → lib/api.ts routes
 *     every call through request() below.
 *
 * The wire format is snake_case; local TS types are camelCase, so we convert keys at this boundary.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
export const USE_BACKEND = API_BASE_URL.length > 0;

const TOKEN_KEY = "weave.employee.token";
const EMPLOYEE_KEY = "weave.employee.id";

let cachedToken: string | null = null;

export async function setSession(token: string, employeeId: string) {
  cachedToken = token;
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [EMPLOYEE_KEY, employeeId],
  ]);
}

export async function clearSession() {
  cachedToken = null;
  await AsyncStorage.multiRemove([TOKEN_KEY, EMPLOYEE_KEY]);
}

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

// ── snake_case ⇄ camelCase key conversion ────────────────────────────────────
const toSnake = (s: string) => s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

function convertKeys(value: unknown, fn: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => convertKeys(v, fn));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [fn(k), convertKeys(v, fn)])
    );
  }
  return value;
}

export const camelize = <T>(v: unknown): T => convertKeys(v, toCamel) as T;
export const snakeize = (v: unknown): unknown => convertKeys(v, toSnake);

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/** Issue an authenticated request and return the camelCased JSON body. */
export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(snakeize(body)) : undefined,
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    if (res.status === 401) {
      // Token rejected (stale/expired) → drop the session so the app can re-auth.
      cachedToken = null;
      await AsyncStorage.multiRemove([TOKEN_KEY, EMPLOYEE_KEY]);
    }
    const message =
      json?.error?.message ?? json?.message ?? `Request failed (${res.status})`;
    throw new Error(message);
  }

  return camelize<T>(json);
}
