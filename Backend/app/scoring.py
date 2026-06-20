"""Engagement scoring + qualified-lead logic (MASTER §8).

Backend-only. The raw number is NEVER sent to students — student-facing responses
map it to neutral statuses (§8.4).
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.enums import ENGAGEMENT_WEIGHTS, QUALIFYING_SIGNALS, InteractionType
from app.models import EngagementScore, Interaction


def score_for_interactions(interactions: list[Interaction]) -> int:
    """Weighted sum of interaction types (× confidence)."""
    total = 0.0
    for i in interactions:
        weight = ENGAGEMENT_WEIGHTS.get(i.type, 0)
        total += weight * (i.confidence_level if i.confidence_level is not None else 1.0)
    return int(round(total))


def is_qualified_lead(interactions: list[Interaction]) -> bool:
    """check_in + ≥1 stronger signal (§8.2). A bare check-in is not qualified."""
    types = {i.type for i in interactions}
    has_check_in = InteractionType.check_in in types or InteractionType.full_session in types
    return has_check_in and bool(types & QUALIFYING_SIGNALS)


def lead_status(interactions: list[Interaction], registered: bool = True) -> str:
    """Neutral relationship hint used by the attendee list."""
    types = {i.type for i in interactions}
    if is_qualified_lead(interactions):
        return "qualified"
    if InteractionType.check_in in types or InteractionType.full_session in types:
        return "checked_in"
    return "registered"


def compute_user_score(db: Session, user_id: str, event_id: str | None = None) -> int:
    stmt = select(Interaction).where(Interaction.user_id == user_id)
    if event_id:
        stmt = stmt.where(Interaction.event_id == event_id)
    return score_for_interactions(list(db.scalars(stmt)))


def recompute_and_cache(db: Session, user_id: str, event_id: str | None = None) -> int:
    """Recompute a contact's score and upsert the cache (call on new interactions)."""
    score = compute_user_score(db, user_id, event_id)
    key_event = event_id or ""
    row = db.get(EngagementScore, {"user_id": user_id, "event_id": key_event})
    if row:
        row.score = score
        row.computed_at = datetime.now(timezone.utc)
    else:
        db.add(EngagementScore(user_id=user_id, event_id=key_event, score=score))
    return score


# Neutral statuses students may see (§8.4) — never the number.
def student_facing_statuses(interactions: list[Interaction]) -> list[str]:
    types = {i.type for i in interactions}
    out: list[str] = []
    if InteractionType.connection in types:
        out.append("connected")
    if InteractionType.file_view in types or InteractionType.file_download in types:
        out.append("material_available")
    if InteractionType.follow_up_request in types:
        out.append("follow_up_open")
    if InteractionType.project_interest in types:
        out.append("project_support_requested")
    if InteractionType.career_interest in types:
        out.append("career_interest_submitted")
    if InteractionType.application_submitted in types:
        out.append("application_context_available")
    return out
