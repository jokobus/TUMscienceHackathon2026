"""SQLAlchemy ORM models — the WEAVE_MASTER.md §5 schema.

IDs are readable strings (`emp-1`, `evt-3`, or `<prefix>-<uuid>`) so the demo seed
lines up across all clients. Timestamps are timezone-aware UTC. JSON columns work
on both SQLite and Postgres.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# Reusable column helpers
def _pk() -> Mapped[str]:
    return mapped_column(String(64), primary_key=True)


# ── Identity & profiles ──────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    university: Mapped[str | None] = mapped_column(String(255), nullable=True)
    study_degree: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hometown: Mapped[str | None] = mapped_column(String(255), nullable=True)
    consent_visible_to_recruiters: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    first_name: Mapped[str] = mapped_column(String(255), nullable=False)
    surname: Mapped[str] = mapped_column(String(255), nullable=False)
    seniority: Mapped[str | None] = mapped_column(String(255), nullable=True)
    branch_office: Mapped[str | None] = mapped_column(String(255), nullable=True)


class InterestTag(Base):
    __tablename__ = "interest_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(255), nullable=False)


class UserInterest(Base):
    __tablename__ = "user_interests"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("interest_tags.id"), primary_key=True)


# ── Events ───────────────────────────────────────────────────────────────────
class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    city: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(512), nullable=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    target_group: Mapped[str | None] = mapped_column(String(512), nullable=True)
    goal: Mapped[str | None] = mapped_column(String(512), nullable=True)
    cost: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    human_capital: Mapped[str | None] = mapped_column(Text, nullable=True)
    partner_university: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_employee_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="planned")
    application_required: Mapped[bool] = mapped_column(Boolean, default=False)
    application_open_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    application_close_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    files_after_event: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(16), default="manual")
    # Non-contract convenience fields used by the apps (image gallery, live toggle).
    images: Mapped[list | None] = mapped_column(JSON, nullable=True)
    live_analytics_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class EventResponsibleEmployee(Base):
    __tablename__ = "event_responsible_employees"

    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"), primary_key=True)
    employee_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)


# ── Applications ─────────────────────────────────────────────────────────────
class ApplicationQuestion(Base):
    __tablename__ = "application_questions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"))
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0)


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"))
    applicant_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    applicant_email: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="submitted")
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ApplicationAnswer(Base):
    __tablename__ = "application_answers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    application_id: Mapped[str] = mapped_column(ForeignKey("applications.id"))
    question_id: Mapped[str] = mapped_column(ForeignKey("application_questions.id"))
    answer_text: Mapped[str] = mapped_column(Text, default="")


# ── Attendance lifecycle ─────────────────────────────────────────────────────
class EventRegistration(Base):
    __tablename__ = "event_registrations"
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_registration_event_user"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"))
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(String(16), default="manual")
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    checked_out_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ── Interactions (engagement spine) ──────────────────────────────────────────
class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str | None] = mapped_column(ForeignKey("events.id"), nullable=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    source: Mapped[str] = mapped_column(String(32), default="manual")
    confidence_level: Mapped[float | None] = mapped_column(Float, default=1.0)
    related_material_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    related_chat_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    related_followup_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    meta: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)


# ── Content ──────────────────────────────────────────────────────────────────
class Material(Base):
    __tablename__ = "materials"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"))
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    url: Mapped[str] = mapped_column(Text, default="#")
    uploaded_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    upload_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    access_count: Mapped[int] = mapped_column(Integer, default=0)
    download_count: Mapped[int] = mapped_column(Integer, default=0)
    related_topic: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Memory(Base):
    __tablename__ = "memories"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"))
    author_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    parent_id: Mapped[str | None] = mapped_column(ForeignKey("memories.id"), nullable=True)
    body: Mapped[str] = mapped_column(Text, default="")
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class MemoryImage(Base):
    __tablename__ = "memory_images"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    memory_id: Mapped[str] = mapped_column(ForeignKey("memories.id"))
    image_url: Mapped[str] = mapped_column(Text, nullable=False)


# ── Suggestions / requests ───────────────────────────────────────────────────
class EventSuggestion(Base):
    __tablename__ = "event_suggestions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    proposer_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    proposer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_event_id: Mapped[str | None] = mapped_column(ForeignKey("events.id"), nullable=True)
    repost_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SuggestionVote(Base):
    __tablename__ = "suggestion_votes"
    __table_args__ = (
        UniqueConstraint("suggestion_id", "user_id", name="uq_vote_suggestion_user"),
        CheckConstraint("value in (-1, 1)", name="ck_vote_value"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    suggestion_id: Mapped[str] = mapped_column(ForeignKey("event_suggestions.id"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    value: Mapped[int] = mapped_column(Integer, nullable=False)


# ── Feedback / KPI source tables ─────────────────────────────────────────────
class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"))
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    recommendation_score: Mapped[int] = mapped_column(Integer, default=0)
    nps_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class HostReport(Base):
    __tablename__ = "host_reports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"))
    host_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    organization_rating: Mapped[int] = mapped_column(Integer, default=0)
    audience_relevance_rating: Mapped[int] = mapped_column(Integer, default=0)
    interaction_quality_rating: Mapped[int] = mapped_column(Integer, default=0)
    repeat_recommendation: Mapped[str] = mapped_column(String(16), default="improve")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_improvements: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# ── Follow-ups ───────────────────────────────────────────────────────────────
class FollowUp(Base):
    __tablename__ = "follow_ups"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str | None] = mapped_column(ForeignKey("events.id"), nullable=True)
    contact_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    assigned_owner_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    next_action: Mapped[str] = mapped_column(Text, default="")
    type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="open")
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ── Messaging ────────────────────────────────────────────────────────────────
class Chat(Base):
    __tablename__ = "chats"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    event_id: Mapped[str | None] = mapped_column(ForeignKey("events.id"), nullable=True)
    # Convenience display fields (denormalised for the chat list).
    title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    subtitle: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    chat_id: Mapped[str] = mapped_column(ForeignKey("chats.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    chat_id: Mapped[str] = mapped_column(ForeignKey("chats.id"))
    sender_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    body: Mapped[str] = mapped_column(Text, default="")
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    is_broadcast: Mapped[bool] = mapped_column(Boolean, default=False)
    read_by: Mapped[list | None] = mapped_column(JSON, nullable=True)


# ── Employee live tools ──────────────────────────────────────────────────────
class EventNote(Base):
    __tablename__ = "event_notes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"))
    author_employee_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    body: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class EventSentiment(Base):
    __tablename__ = "event_sentiment"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"))
    author_employee_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    description: Mapped[str] = mapped_column(Text, default="")
    sentiment_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# ── Scan tokens / prioritization / notifications ─────────────────────────────
class QrToken(Base):
    __tablename__ = "qr_tokens"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str | None] = mapped_column(ForeignKey("events.id"), nullable=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    token: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class EngagementScore(Base):
    __tablename__ = "engagement_scores"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    # SQLite/Postgres-portable: empty string means "global" (NULL not allowed in PK).
    event_id: Mapped[str] = mapped_column(String(64), primary_key=True, default="")
    score: Mapped[int] = mapped_column(Integer, default=0)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
