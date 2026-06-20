/**
 * types.ts — camelCased mirrors of the backend wire contract (WEAVE_MASTER §5/§6)
 * scoped to what the Student App consumes. http.ts camelizes snake_case responses.
 */

export type UserRole = "student" | "employee" | "guest";

/** The auth payload returned by /api/auth/{login,signup,guest,me}. */
export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

/** GET /api/users/me/profile */
export interface StudentProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  university?: string | null;
  studyDegree?: string | null;
  hometown?: string | null;
  consentVisibleToRecruiters: boolean;
  interestTagIds: number[];
}

/** Event types known to the backend (event_type enum). Kept open as string. */
export type EventType = string;
export type EventStatus =
  | "planned"
  | "upcoming"
  | "ongoing"
  | "past"
  | "draft"
  | "cancelled";

/** Public event shape from /api/events and /api/events/{id}. */
export interface WeaveEvent {
  id: string;
  title: string;
  type: EventType;
  description: string;
  city?: string | null;
  location?: string | null;
  startAt: string;
  endAt: string;
  status: EventStatus;
  targetGroup?: string | null;
  goal?: string | null;
  partnerUniversity?: string | null;
  images: string[];
  applicationRequired: boolean;
  applicationOpenAt?: string | null;
  applicationCloseAt?: string | null;
  filesAfterEvent: boolean;
}

export interface Material {
  id: string;
  eventId: string;
  type: string;
  title: string;
  url: string;
  uploadDate: string;
}

export interface FilesResponse {
  items: Material[];
  hiddenReason: string | null;
}

export interface Memory {
  id: string;
  eventId: string;
  authorUserId: string;
  authorName?: string | null;
  parentId?: string | null;
  body: string;
  images: string[];
  createdAt: string;
}

export interface ApplicationQuestion {
  id: string;
  questionText: string;
  position: number;
}

export interface ApplicationInfo {
  required: boolean;
  openAt?: string | null;
  closeAt?: string | null;
  questions: ApplicationQuestion[];
}

export interface InterestTag {
  id: number;
  name: string;
}

export interface InterestTagGroup {
  category: string;
  tags: InterestTag[];
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  proposerUserId?: string | null;
  proposerEmail?: string | null;
  sourceEventId?: string | null;
  repostCount: number;
  score: number;
  upvotes: number;
  downvotes: number;
  myVote: number | null;
  createdAt: string;
}

export type ChatType = "dm" | "event_channel" | "internal" | "student_conversation";

export interface ChatSummary {
  id: string;
  type: ChatType;
  title: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  eventId?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unread: number;
  liveHighlight: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderUserId: string;
  senderName: string;
  body: string;
  sentAt: string;
  isBroadcast?: boolean;
}

export interface PersonSearchResult {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  role: UserRole;
  context: string;
  chatId?: string | null;
}

export type InteractionType =
  | "check_in"
  | "file_view"
  | "file_download"
  | "memory_post"
  | "question_asked"
  | "sample_interest"
  | "project_interest"
  | "career_interest"
  | "follow_up_request"
  | "application_submitted"
  | "recommendation_submitted"
  | "connection"
  | "repost";

/** WebSocket frame ({action, payload}) delivered to chat subscribers. */
export interface WsEvent {
  action: string;
  payload: Record<string, any>;
}
