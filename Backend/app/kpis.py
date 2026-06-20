"""KPI computation derived from source tables (MASTER §5/§8). Derive, don't double-store."""
from __future__ import annotations

from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.enums import EventHealth, InteractionType
from app.models import EventRegistration, Feedback, FollowUp, Interaction
from app.scoring import is_qualified_lead


def _interactions_by_user(db: Session, event_id: str) -> dict[str, list[Interaction]]:
    rows = db.scalars(select(Interaction).where(Interaction.event_id == event_id))
    grouped: dict[str, list[Interaction]] = defaultdict(list)
    for i in rows:
        if i.user_id:
            grouped[i.user_id].append(i)
    return grouped


def compute_event_kpis(db: Session, event_id: str) -> dict:
    regs = list(db.scalars(select(EventRegistration).where(EventRegistration.event_id == event_id)))
    registered = len(regs)
    checked_in = sum(1 for r in regs if r.checked_in_at is not None)
    full_sessions = sum(1 for r in regs if r.checked_out_at is not None)

    by_user = _interactions_by_user(db, event_id)
    qualified_leads = sum(1 for ix in by_user.values() if is_qualified_lead(ix))

    # Engagement index 0–100: average per-attendee weighted engagement, normalised.
    from app.scoring import score_for_interactions

    scores = [score_for_interactions(ix) for ix in by_user.values()]
    avg_score = (sum(scores) / len(scores)) if scores else 0
    engagement_index = max(0, min(100, int(round(avg_score * 2))))  # ~50 weighted pts → 100

    fb = list(db.scalars(select(Feedback).where(Feedback.event_id == event_id)))
    rec_scores = [f.recommendation_score for f in fb if f.recommendation_score is not None]
    recommendation_score = round(sum(rec_scores) / len(rec_scores), 1) if rec_scores else 0.0
    nps_scores = [f.nps_score for f in fb if f.nps_score is not None]
    nps_score = int(round(sum(nps_scores) / len(nps_scores))) if nps_scores else None

    follow_ups_open = len(
        list(
            db.scalars(
                select(FollowUp.id).where(
                    FollowUp.event_id == event_id,
                    FollowUp.status.in_(("open", "in_progress")),
                )
            )
        )
    )

    return {
        "registered": registered,
        "checked_in": checked_in,
        "full_sessions": full_sessions,
        "check_in_rate": round(checked_in / registered, 2) if registered else 0.0,
        "full_session_rate": round(full_sessions / checked_in, 2) if checked_in else 0.0,
        "qualified_leads": qualified_leads,
        "engagement_index": engagement_index,
        "recommendation_score": recommendation_score,
        "nps_score": nps_score,
        "follow_ups_open": follow_ups_open,
    }


def compute_health(kpis: dict, status: str) -> str:
    """Derive an event_health label from KPIs (MASTER §5.1 enum)."""
    if status in ("draft", "planned", "upcoming", "cancelled"):
        return EventHealth.insufficient_data
    if kpis["registered"] == 0 and kpis["checked_in"] == 0:
        return EventHealth.insufficient_data

    qlr = kpis["qualified_leads"] / kpis["checked_in"] if kpis["checked_in"] else 0
    rec = kpis["recommendation_score"]
    fsr = kpis["full_session_rate"]
    follow_open = kpis["follow_ups_open"]

    if qlr >= 0.3 and rec >= 8:
        return EventHealth.high_relationship_roi
    if fsr >= 0.8 and rec >= 8:
        return EventHealth.strong_brand_retention
    if kpis["engagement_index"] >= 70 and follow_open > 0:
        return EventHealth.high_engagement_needs_followup
    if kpis["check_in_rate"] >= 0.8 and qlr < 0.2:
        return EventHealth.good_awareness
    if follow_open > 0 and qlr >= 0.2:
        return EventHealth.weak_followup
    if kpis["engagement_index"] < 30:
        return EventHealth.likely_underperforming
    if fsr < 0.4:
        return EventHealth.low_continuity
    return EventHealth.needs_review


def returning_user_count(db: Session, event_id: str) -> int:
    """Attendees who interacted with an earlier event too (re-engagement / continuity)."""
    by_user = _interactions_by_user(db, event_id)
    count = 0
    for uid in by_user:
        earlier = db.scalar(
            select(Interaction.id)
            .where(Interaction.user_id == uid, Interaction.event_id != event_id)
            .limit(1)
        )
        if earlier:
            count += 1
    return count
