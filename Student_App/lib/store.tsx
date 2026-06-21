"use client";

/**
 * store.ts — client-side student state (React Context; no external state lib).
 *
 * Holds the demo's mutable student state: event applications & check-ins, posted
 * memories, the editable profile, and community event requests. Persisted to
 * localStorage so it survives reloads during the demo. Wrap the app in
 * <StudentStoreProvider>; read state/actions via useStudentStore().
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface UserProfile {
  name: string;
  email: string;
  university: string | null;
  degree: string | null;
  hometown: string | null;
  selectedInterests: string[];
}

export interface UserInteractions {
  appliedEvents: string[];
  checkedInEvents: string[];
}

export interface Memory {
  id: string;
  event_id: string;
  content: string;
  created_at: string;
  image_url: string | null;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  upvotes: number;
  downvotes: number;
  user_vote: "up" | "down" | undefined;
  proposer_id: string;
  created_at: string;
}

export type Vote = "up" | "down" | null;

interface StudentStore {
  userProfile: UserProfile;
  userInteractions: UserInteractions;
  memories: Record<string, Memory[]>;
  requests: Request[];
  checkInToEvent: (eventId: string) => void;
  toggleApplyToEvent: (eventId: string) => void;
  postMemory: (eventId: string, content: string, imageUrl?: string) => void;
  toggleInterest: (tag: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addRequest: (title: string, description: string) => void;
  voteRequest: (id: string, vote: Vote) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Thiviyan Saravanamuthu",
  email: "thiviyan.saravanamuthu@tum.de",
  university: "TU München",
  degree: "M.Sc. Robotics",
  hometown: "München",
  selectedInterests: ["embedded", "power electronics", "rf"],
};

const INITIAL_REQUESTS: Request[] = [
  {
    id: "req-1",
    title: "Hands-on PCB soldering workshop at TUM",
    description: "A beginner-friendly evening workshop to actually build a small Würth reference board.",
    upvotes: 24,
    downvotes: 1,
    user_vote: undefined,
    proposer_id: "stu-2",
    created_at: "2026-06-10T10:00:00Z",
  },
  {
    id: "req-2",
    title: "RF & antenna design deep-dive",
    description: "More advanced content after the EMC lab tour — would love a follow-up session.",
    upvotes: 17,
    downvotes: 0,
    user_vote: "up",
    proposer_id: "me",
    created_at: "2026-06-12T14:30:00Z",
  },
];

const STORAGE_KEY = "weave_student_store";

interface PersistShape {
  userProfile: UserProfile;
  userInteractions: UserInteractions;
  memories: Record<string, Memory[]>;
  requests: Request[];
}

function loadPersisted(): Partial<PersistShape> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistShape) : {};
  } catch {
    return {};
  }
}

const StudentStoreContext = createContext<StudentStore | null>(null);

export function StudentStoreProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [userInteractions, setUserInteractions] = useState<UserInteractions>({
    appliedEvents: [],
    checkedInEvents: [],
  });
  const [memories, setMemories] = useState<Record<string, Memory[]>>({});
  const [requests, setRequests] = useState<Request[]>(INITIAL_REQUESTS);

  // Hydrate from localStorage after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    const p = loadPersisted();
    if (p.userProfile) setUserProfile(p.userProfile);
    if (p.userInteractions) setUserInteractions(p.userInteractions);
    if (p.memories) setMemories(p.memories);
    if (p.requests) setRequests(p.requests);
  }, []);

  // Persist on change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ userProfile, userInteractions, memories, requests })
      );
    } catch {
      /* ignore quota errors */
    }
  }, [userProfile, userInteractions, memories, requests]);

  const checkInToEvent = useCallback((eventId: string) => {
    setUserInteractions((s) =>
      s.checkedInEvents.includes(eventId)
        ? s
        : { ...s, checkedInEvents: [...s.checkedInEvents, eventId] }
    );
  }, []);

  const toggleApplyToEvent = useCallback((eventId: string) => {
    setUserInteractions((s) => ({
      ...s,
      appliedEvents: s.appliedEvents.includes(eventId)
        ? s.appliedEvents.filter((id) => id !== eventId)
        : [...s.appliedEvents, eventId],
    }));
  }, []);

  const postMemory = useCallback((eventId: string, content: string, imageUrl?: string) => {
    const memory: Memory = {
      id: `mem-${Date.now()}`,
      event_id: eventId,
      content,
      created_at: new Date().toISOString(),
      image_url: imageUrl ?? null,
    };
    setMemories((m) => ({ ...m, [eventId]: [...(m[eventId] ?? []), memory] }));
  }, []);

  const toggleInterest = useCallback((tag: string) => {
    setUserProfile((p) => ({
      ...p,
      selectedInterests: p.selectedInterests.includes(tag)
        ? p.selectedInterests.filter((t) => t !== tag)
        : [...p.selectedInterests, tag],
    }));
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile((p) => ({ ...p, ...updates }));
  }, []);

  const addRequest = useCallback((title: string, description: string) => {
    setRequests((rs) => [
      {
        id: `req-${Date.now()}`,
        title,
        description,
        upvotes: 1,
        downvotes: 0,
        user_vote: "up",
        proposer_id: "me",
        created_at: new Date().toISOString(),
      },
      ...rs,
    ]);
  }, []);

  const voteRequest = useCallback((id: string, vote: Vote) => {
    setRequests((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        let { upvotes, downvotes } = r;
        if (r.user_vote === "up") upvotes -= 1;
        if (r.user_vote === "down") downvotes -= 1;
        const next = vote ?? undefined;
        if (next === "up") upvotes += 1;
        if (next === "down") downvotes += 1;
        return { ...r, upvotes, downvotes, user_vote: next };
      })
    );
  }, []);

  const value = useMemo<StudentStore>(
    () => ({
      userProfile,
      userInteractions,
      memories,
      requests,
      checkInToEvent,
      toggleApplyToEvent,
      postMemory,
      toggleInterest,
      updateProfile,
      addRequest,
      voteRequest,
    }),
    [
      userProfile,
      userInteractions,
      memories,
      requests,
      checkInToEvent,
      toggleApplyToEvent,
      postMemory,
      toggleInterest,
      updateProfile,
      addRequest,
      voteRequest,
    ]
  );

  return <StudentStoreContext.Provider value={value}>{children}</StudentStoreContext.Provider>;
}

export function useStudentStore(): StudentStore {
  const ctx = useContext(StudentStoreContext);
  if (!ctx) throw new Error("useStudentStore must be used within a StudentStoreProvider");
  return ctx;
}
