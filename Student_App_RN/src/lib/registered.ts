/**
 * registered.ts — client-side record of the events the student registered for or
 * checked into. The backend has no "my events" list endpoint, so we track ids
 * locally (AsyncStorage) and power the Feed's "My Events" filter from it.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "weave_registered_events";
let cache: string[] | null = null;

export async function getRegisteredIds(): Promise<string[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

export async function addRegistered(id: string): Promise<void> {
  const ids = await getRegisteredIds();
  if (ids.includes(id)) return;
  cache = [...ids, id];
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

export async function removeRegistered(id: string): Promise<void> {
  const ids = await getRegisteredIds();
  cache = ids.filter((x) => x !== id);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}
