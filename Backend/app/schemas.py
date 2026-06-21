"""Pydantic request/response models — the wire contract (MASTER §6).

JSON is snake_case (clients camelize at their boundary). All datetimes serialize
as UTC `...Z` strings so naive SQLite values and aware Postgres values agree.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, PlainSerializer


def iso_z(dt: datetime | None) -> str | None:
    """Single source of truth for datetime → UTC `...Z` strings (MASTER §4).

    Hand-built dicts (routers that don't go through a Pydantic response_model)
    import this so every datetime on the wire carries the trailing `Z`.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# Backwards-compatible alias used by the Pydantic serializers below.
_iso = iso_z


Dt = Annotated[datetime, PlainSerializer(_iso, return_type=str, when_used="json")]
OptDt = Annotated[Optional[datetime], PlainSerializer(_iso, return_type=Optional[str], when_used="json")]


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ── Auth ─────────────────────────────────────────────────────────────────────
class LoginRequest(Schema):
    email: str
    password: str


class SignupRequest(Schema):
    email: str
    password: str
    display_name: str
    role: Literal["student", "employee"] = "student"


class GuestRequest(Schema):
    email: str
    display_name: str | None = None


class UserOut(Schema):
    id: str
    role: str
    email: str
    display_name: str
    avatar_url: str | None = None
    created_at: Dt


class EmployeeProfileOut(UserOut):
    first_name: str
    surname: str
    seniority: str | None = None
    branch_office: str | None = None


class AuthResponse(Schema):
    token: str
    user: dict[str, Any]


# ── Events ───────────────────────────────────────────────────────────────────
class EventKpisOut(Schema):
    registered: int
    checked_in: int
    full_sessions: int
    check_in_rate: float
    full_session_rate: float
    qualified_leads: int
    engagement_index: int
    recommendation_score: float
    nps_score: int | None = None
    follow_ups_open: int
    returning_users: int = 0
    cost_per_lead: float | None = None


class EventSummaryOut(Schema):
    id: str
    title: str
    type: str
    city: str | None = None
    location: str | None = None
    start_at: Dt
    end_at: Dt
    status: str
    attendee_count: int
    health: str | None = None
    is_owner: bool = False
    relationship_roi: int = 0
    image_url: str | None = None
    images: list[str] = []


class EventDetailOut(EventSummaryOut):
    description: str
    target_group: str | None = None
    goal: str | None = None
    partner_university: str | None = None
    owner_employee_id: str | None = None
    owner_name: str | None = None
    cost: float | None = None
    human_capital: str | None = None
    responsible_employee_ids: list[str] = []
    live_analytics_enabled: bool = False
    kpis: EventKpisOut
    analysis: dict[str, Any] | None = None


class EventCreateRequest(Schema):
    title: str
    type: str
    description: str = ""
    city: str | None = None
    location: str | None = None
    start_at: datetime
    end_at: datetime
    target_group: str | None = None
    goal: str | None = None
    cost: float | None = None
    human_capital: str | None = None
    partner_university: str | None = None
    status: str = "planned"
    application_required: bool = False
    files_after_event: bool = False
    images: list[str] | None = None
    live_analytics_enabled: bool = False
    responsible_employee_ids: list[str] = []


class EventUpdateRequest(Schema):
    title: str | None = None
    type: str | None = None
    description: str | None = None
    city: str | None = None
    location: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    target_group: str | None = None
    goal: str | None = None
    cost: float | None = None
    human_capital: str | None = None
    partner_university: str | None = None
    status: str | None = None
    application_required: bool | None = None
    files_after_event: bool | None = None
    images: list[str] | None = None
    live_analytics_enabled: bool | None = None
    responsible_employee_ids: list[str] | None = None


class AttendeeOut(Schema):
    user_id: str
    display_name: str
    avatar_url: str | None = None
    university: str | None = None
    study_degree: str | None = None
    checked_in_at: OptDt = None
    full_session: bool = False
    returning: bool = False
    lead_status: Literal["qualified", "checked_in", "registered"]


class InteractionOut(Schema):
    id: str
    event_id: str | None = None
    user_id: str | None = None
    user_name: str | None = None
    type: str
    timestamp: Dt


class InteractionCreateRequest(Schema):
    event_id: str | None = None
    type: str
    metadata: dict[str, Any] | None = None


# ── Notes / sentiment / analytics ────────────────────────────────────────────
class EventNoteOut(Schema):
    id: str
    event_id: str
    author_employee_id: str
    body: str
    created_at: Dt


class NoteCreateRequest(Schema):
    body: str


class EventSentimentOut(Schema):
    id: str
    event_id: str
    author_employee_id: str
    description: str
    sentiment_value: float | None = None
    created_at: Dt


class SentimentCreateRequest(Schema):
    description: str
    sentiment_value: float | None = None


class LiveAnalyticsOut(Schema):
    enabled: bool
    average_sentiment: float
    sample_count: int
    recent: list[EventSentimentOut]
    mood: Literal["energised", "engaged", "neutral", "flat", "tense"]


# ── Materials ────────────────────────────────────────────────────────────────
class MaterialOut(Schema):
    id: str
    event_id: str
    type: str
    title: str
    url: str
    uploaded_by: str
    upload_date: Dt
    access_count: int


class MaterialCreateRequest(Schema):
    title: str
    type: str
    url: str = "#"


# ── Host report ──────────────────────────────────────────────────────────────
class HostReportOut(Schema):
    id: str
    event_id: str
    host_user_id: str
    organization_rating: int
    audience_relevance_rating: int
    interaction_quality_rating: int
    repeat_recommendation: str
    notes: str | None = None
    suggested_improvements: str | None = None
    created_at: Dt


class HostReportCreateRequest(Schema):
    organization_rating: int
    audience_relevance_rating: int
    interaction_quality_rating: int
    repeat_recommendation: Literal["repeat", "improve", "stop"]
    notes: str | None = None
    suggested_improvements: str | None = None


# ── QR / scan ────────────────────────────────────────────────────────────────
class QrTokenOut(Schema):
    token: str
    kind: str
    event_id: str | None = None
    expires_at: OptDt = None


class ScanStudentResponse(Schema):
    chat_id: str
    student_name: str


# ── Messaging ────────────────────────────────────────────────────────────────
class ChatSummaryOut(Schema):
    id: str
    type: str
    title: str
    subtitle: str | None = None
    avatar_url: str | None = None
    event_id: str | None = None
    last_message: str | None = None
    last_message_at: OptDt = None
    unread: int = 0
    live_highlight: bool = False


class MessageOut(Schema):
    id: str
    chat_id: str
    sender_user_id: str
    sender_name: str
    body: str
    sent_at: Dt
    is_broadcast: bool = False
    client_msg_id: str | None = None


class MessageCreateRequest(Schema):
    body: str
    # Optional client-generated correlation id. Echoed back on the WS frame so a
    # client can reconcile its optimistic bubble with the authoritative server row
    # (prevents the "double-paste then disappears" duplicate).
    client_msg_id: str | None = None


class ChatCreateRequest(Schema):
    user_id: str | None = None
    type: str = "dm"
    event_id: str | None = None


class BroadcastRequest(Schema):
    body: str


class PersonSearchResultOut(Schema):
    user_id: str
    display_name: str
    avatar_url: str | None = None
    role: str
    context: str
    chat_id: str | None = None


# ── Notifications ────────────────────────────────────────────────────────────
class NotificationOut(Schema):
    id: str
    type: str
    title: str
    body: str
    event_id: str | None = None
    created_at: Dt
    read_at: OptDt = None


# ── Profile ──────────────────────────────────────────────────────────────────
class EmployeeProfileUpdate(Schema):
    display_name: str | None = None
    first_name: str | None = None
    surname: str | None = None
    avatar_url: str | None = None


# ── Follow-ups ───────────────────────────────────────────────────────────────
class FollowUpOut(Schema):
    id: str
    event_id: str | None = None
    contact_user_id: str | None = None
    contact_name: str | None = None
    assigned_owner_id: str | None = None
    next_action: str
    type: str | None = None
    due_date: OptDt = None
    status: str
    outcome: str | None = None
    created_at: Dt
    completed_at: OptDt = None


class FollowUpCreateRequest(Schema):
    event_id: str | None = None
    contact_user_id: str | None = None
    assigned_owner_id: str | None = None
    next_action: str
    type: str | None = None
    due_date: datetime | None = None


class FollowUpUpdateRequest(Schema):
    status: str | None = None
    outcome: str | None = None
    next_action: str | None = None
    assigned_owner_id: str | None = None


# ── Students explorer ────────────────────────────────────────────────────────
class StudentRowOut(Schema):
    user_id: str
    display_name: str
    avatar_url: str | None = None
    university: str | None = None
    study_degree: str | None = None
    engagement_score: int
    lead_status: str
    events_attended: int
    last_interaction_at: OptDt = None
    open_follow_ups: int


class StudentDetailOut(StudentRowOut):
    hometown: str | None = None
    interests: list[str] = []
    recommended_next_action: str | None = None
    follow_ups: list[FollowUpOut] = []


class TimelineEntryOut(Schema):
    id: str
    event_id: str | None = None
    event_title: str | None = None
    type: str
    timestamp: Dt


class PriorityItemOut(Schema):
    user_id: str
    display_name: str
    engagement_score: int
    recommended_action: str
    urgency: Literal["high", "medium", "low"]
    confidence: float
    reason: str


# ── Suggestions ──────────────────────────────────────────────────────────────
class SuggestionOut(Schema):
    id: str
    title: str
    description: str
    proposer_user_id: str | None = None
    proposer_email: str | None = None
    source_event_id: str | None = None
    repost_count: int
    score: int
    upvotes: int
    downvotes: int
    my_vote: int | None = None
    created_at: Dt


class SuggestionCreateRequest(Schema):
    title: str
    description: str = ""


class SuggestionUpdateRequest(Schema):
    title: str | None = None
    description: str | None = None


class VoteRequest(Schema):
    value: Literal[-1, 1]


# ── Dashboard ────────────────────────────────────────────────────────────────
class DashboardSummaryOut(Schema):
    total_events: int
    upcoming_events: int
    ongoing_events: int
    past_events: int
    total_attendees: int
    qualified_leads: int
    avg_recommendation_score: float
    open_follow_ups: int


# ── Opportunities / AI ───────────────────────────────────────────────────────
class OpportunityOut(Schema):
    id: str
    title: str
    detail: str
    reason: str
    category: str


class AssistantRequest(Schema):
    prompt: str


class AssistantResponse(Schema):
    answer: str
    recommendations: list[OpportunityOut] = []
    grounded_on: list[str] = []
