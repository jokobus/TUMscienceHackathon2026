"""Central enums — verbatim from WEAVE_MASTER.md §5.1. Do not invent values."""
from __future__ import annotations

from enum import Enum


class StrEnum(str, Enum):
    """str-backed enum: serializes as its value, compares to plain strings."""

    def __str__(self) -> str:  # pragma: no cover
        return self.value


class UserRole(StrEnum):
    student = "student"
    employee = "employee"
    guest = "guest"


class EventType(StrEnum):
    hackathon = "hackathon"
    guest_lecture = "guest_lecture"
    career_fair_booth = "career_fair_booth"
    excursion = "excursion"
    student_team = "student_team"
    technical_talk = "technical_talk"
    one_on_one = "one_on_one"
    seminar = "seminar"
    webinar = "webinar"
    conference = "conference"
    trade_fair = "trade_fair"
    other = "other"


class EventStatus(StrEnum):
    draft = "draft"
    planned = "planned"
    upcoming = "upcoming"
    ongoing = "ongoing"
    past = "past"
    cancelled = "cancelled"


class EventSource(StrEnum):
    manual = "manual"
    scraped = "scraped"


class RegistrationSource(StrEnum):
    applied = "applied"
    scanned = "scanned"
    imported = "imported"
    manual = "manual"


class InteractionType(StrEnum):
    check_in = "check_in"
    check_out = "check_out"
    full_session = "full_session"
    file_view = "file_view"
    file_download = "file_download"
    memory_post = "memory_post"
    question_asked = "question_asked"
    chat_activity = "chat_activity"
    application_submitted = "application_submitted"
    sample_interest = "sample_interest"
    project_interest = "project_interest"
    career_interest = "career_interest"
    follow_up_request = "follow_up_request"
    recommendation_submitted = "recommendation_submitted"
    connection = "connection"
    re_engagement = "re_engagement"
    repost = "repost"


class InteractionSource(StrEnum):
    student_app = "student_app"
    employee_app = "employee_app"
    dashboard = "dashboard"
    external_scan = "external_scan"
    registration_import = "registration_import"
    manual = "manual"


class MaterialType(StrEnum):
    slides = "slides"
    pdf = "pdf"
    image = "image"
    link = "link"
    qa_summary = "qa_summary"
    product_info = "product_info"
    project_doc = "project_doc"
    follow_up_resource = "follow_up_resource"


class ApplicationStatus(StrEnum):
    submitted = "submitted"
    under_review = "under_review"
    accepted = "accepted"
    rejected = "rejected"


class FollowUpStatus(StrEnum):
    open = "open"
    in_progress = "in_progress"
    done = "done"
    closed = "closed"


class HostRecommendation(StrEnum):
    repeat = "repeat"
    improve = "improve"
    stop = "stop"


class ChatType(StrEnum):
    dm = "dm"
    event_channel = "event_channel"
    internal = "internal"
    student_conversation = "student_conversation"


class QrKind(StrEnum):
    check_in = "check_in"
    check_out = "check_out"
    connection = "connection"


class EventHealth(StrEnum):
    high_relationship_roi = "high_relationship_roi"
    strong_brand_retention = "strong_brand_retention"
    high_engagement_needs_followup = "high_engagement_needs_followup"
    good_awareness = "good_awareness"
    low_continuity = "low_continuity"
    weak_followup = "weak_followup"
    likely_underperforming = "likely_underperforming"
    needs_review = "needs_review"
    insufficient_data = "insufficient_data"


class PredictionOutcome(StrEnum):
    high_confidence_success = "high_confidence_success"
    promising_uncertain = "promising_uncertain"
    relationship_potential = "relationship_potential"
    risk_low_engagement = "risk_low_engagement"
    likely_underperforming = "likely_underperforming"
    insufficient_data = "insufficient_data"


# Strong signals that, combined with a check_in, qualify a relationship lead (§8.2).
QUALIFYING_SIGNALS: set[str] = {
    InteractionType.file_view,
    InteractionType.file_download,
    InteractionType.question_asked,
    InteractionType.sample_interest,
    InteractionType.project_interest,
    InteractionType.career_interest,
    InteractionType.follow_up_request,
    InteractionType.application_submitted,
    InteractionType.re_engagement,
}

# Per-interaction engagement weights (§8.1).
ENGAGEMENT_WEIGHTS: dict[str, int] = {
    InteractionType.check_in: 1,
    InteractionType.full_session: 2,
    InteractionType.check_out: 2,
    InteractionType.file_view: 3,
    InteractionType.file_download: 3,
    InteractionType.memory_post: 3,
    InteractionType.recommendation_submitted: 5,
    InteractionType.question_asked: 5,
    InteractionType.sample_interest: 10,
    InteractionType.re_engagement: 10,
    InteractionType.project_interest: 15,
    InteractionType.follow_up_request: 15,
    InteractionType.career_interest: 20,
    InteractionType.application_submitted: 25,
}
