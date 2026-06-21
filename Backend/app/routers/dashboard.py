"""Internal — Dashboard (global) (MASTER §6.7). Role employee."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_employee
from app.errors import unprocessable
from app.kpis import compute_event_kpis, compute_health, returning_user_count
from app.models import Event, FollowUp, HostReport, User
from app.recommend import next_best_events
from app.schemas import DashboardSummaryOut, EventSummaryOut
from app.services import build_event_summary

router = APIRouter(prefix="/internal/dashboard", tags=["internal-dashboard"])

# Map the categorical health label to a 0–100 score so `dimension=health`
# renders a meaningful bar chart instead of silently echoing engagement.
_HEALTH_SCORE = {
    "high_relationship_roi": 100,
    "strong_brand_retention": 90,
    "high_engagement_needs_followup": 70,
    "good_awareness": 60,
    "weak_followup": 45,
    "low_continuity": 40,
    "needs_review": 35,
    "likely_underperforming": 20,
    "insufficient_data": 0,
}

# Dimensions the chart supports (§6.7). Unsupported values → 422, not silent fallback.
_SUPPORTED_DIMENSIONS = {
    "relationship_roi", "brand_retention", "engagement", "returning_rate",
    "recommendation", "full_session", "follow_ups", "cost_per_lead",
    "host_experience", "health",
}


def _dimension_value(db: Session, event: Event, k: dict, dimension: str) -> float:
    if dimension == "relationship_roi":
        return k["qualified_leads"]
    if dimension == "engagement":
        return k["engagement_index"]
    if dimension == "recommendation":
        return k["recommendation_score"]
    if dimension == "full_session":
        return k["full_session_rate"]
    if dimension == "returning_rate":
        returning = returning_user_count(db, event.id)
        return round(returning / k["checked_in"], 2) if k["checked_in"] else 0.0
    if dimension == "follow_ups":
        return k["follow_ups_open"]
    if dimension == "brand_retention":
        returning = returning_user_count(db, event.id)
        return round(returning / k["checked_in"], 2) if k["checked_in"] else 0.0
    if dimension == "cost_per_lead":
        if event.cost and k["qualified_leads"]:
            return round(float(event.cost) / k["qualified_leads"], 2)
        return 0.0
    if dimension == "host_experience":
        reports = list(db.scalars(select(HostReport).where(HostReport.event_id == event.id)))
        if not reports:
            return 0.0
        per_report = [
            (r.organization_rating + r.audience_relevance_rating + r.interaction_quality_rating) / 3
            for r in reports
        ]
        return round(sum(per_report) / len(per_report), 2)
    if dimension == "health":
        return _HEALTH_SCORE.get(compute_health(k, event.status), 0)
    return k["engagement_index"]


@router.get("/summary", response_model=DashboardSummaryOut)
def summary(db: Session = Depends(get_db), _: User = Depends(require_employee)):
    events = list(db.scalars(select(Event)))
    total_att = qual = 0
    rec_scores: list[float] = []
    for e in events:
        if e.status in ("ongoing", "past"):
            k = compute_event_kpis(db, e.id)
            total_att += k["checked_in"]
            qual += k["qualified_leads"]
            if k["recommendation_score"]:
                rec_scores.append(k["recommendation_score"])
    open_fu = len(
        list(db.scalars(select(FollowUp.id).where(FollowUp.status.in_(("open", "in_progress")))))
    )
    return DashboardSummaryOut(
        total_events=len(events),
        upcoming_events=sum(1 for e in events if e.status in ("planned", "upcoming")),
        ongoing_events=sum(1 for e in events if e.status == "ongoing"),
        past_events=sum(1 for e in events if e.status == "past"),
        total_attendees=total_att,
        qualified_leads=qual,
        avg_recommendation_score=round(sum(rec_scores) / len(rec_scores), 1) if rec_scores else 0.0,
        open_follow_ups=open_fu,
    )


@router.get("/kpis")
def global_kpis(db: Session = Depends(get_db), _: User = Depends(require_employee)):
    events = list(db.scalars(select(Event).where(Event.status.in_(("ongoing", "past")))))
    agg = {"registered": 0, "checked_in": 0, "full_sessions": 0, "qualified_leads": 0, "returning_users": 0}
    total_cost = 0.0
    per_event = []
    for e in events:
        k = compute_event_kpis(db, e.id)
        for key in agg:
            agg[key] += k[key]
        if e.cost:
            total_cost += float(e.cost)
        per_event.append({"event_id": e.id, "title": e.title, **k})
    agg["cost_per_lead"] = round(total_cost / agg["qualified_leads"], 2) if agg["qualified_leads"] else None
    return {"aggregate": agg, "per_event": per_event}


@router.get("/performance")
def performance(
    dimension: str = Query("engagement"),
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    if dimension not in _SUPPORTED_DIMENSIONS:
        raise unprocessable(
            f"Unsupported dimension '{dimension}'. Allowed: {sorted(_SUPPORTED_DIMENSIONS)}."
        )
    events = list(db.scalars(select(Event).where(Event.status.in_(("ongoing", "past")))))
    points = []
    for e in events:
        k = compute_event_kpis(db, e.id)
        value = _dimension_value(db, e, k, dimension)
        points.append({"event_id": e.id, "title": e.title, "value": value})
    points.sort(key=lambda p: p["value"], reverse=True)
    return {"dimension": dimension, "points": points}


@router.get("/next-best-events")
def next_best(db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return next_best_events(db)


@router.get("/timeline", response_model=list[EventSummaryOut])
def timeline(db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    events = db.scalars(select(Event).order_by(Event.start_at))
    return [build_event_summary(db, e, emp.id) for e in events]
