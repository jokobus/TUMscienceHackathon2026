"""Internal — Dashboard (global) (MASTER §6.7). Role employee."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_employee
from app.kpis import compute_event_kpis
from app.models import Event, FollowUp, User
from app.recommend import next_best_events
from app.schemas import DashboardSummaryOut
from app.services import build_event_summary

router = APIRouter(prefix="/internal/dashboard", tags=["internal-dashboard"])


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
    agg = {"registered": 0, "checked_in": 0, "full_sessions": 0, "qualified_leads": 0}
    per_event = []
    for e in events:
        k = compute_event_kpis(db, e.id)
        for key in agg:
            agg[key] += k[key]
        per_event.append({"event_id": e.id, "title": e.title, **k})
    return {"aggregate": agg, "per_event": per_event}


@router.get("/performance")
def performance(
    dimension: str = Query("engagement"),
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    events = list(db.scalars(select(Event).where(Event.status.in_(("ongoing", "past")))))
    points = []
    for e in events:
        k = compute_event_kpis(db, e.id)
        value = {
            "relationship_roi": k["qualified_leads"],
            "engagement": k["engagement_index"],
            "recommendation": k["recommendation_score"],
            "full_session": k["full_session_rate"],
            "returning_rate": k["check_in_rate"],
            "follow_ups": k["follow_ups_open"],
        }.get(dimension, k["engagement_index"])
        points.append({"event_id": e.id, "title": e.title, "value": value})
    points.sort(key=lambda p: p["value"], reverse=True)
    return {"dimension": dimension, "points": points}


@router.get("/next-best-events")
def next_best(db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return next_best_events(db)


@router.get("/timeline")
def timeline(db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    events = db.scalars(select(Event).order_by(Event.start_at))
    return [build_event_summary(db, e, emp.id) for e in events]
