"""Internal — Student explorer / detail / priority (MASTER §6.14). Role employee."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_employee
from app.errors import not_found
from app.models import (
    Event,
    FollowUp,
    Interaction,
    InterestTag,
    StudentProfile,
    User,
    UserInterest,
)
from app.recommend import priority_queue
from app.schemas import (
    PriorityItemOut,
    StudentDetailOut,
    StudentRowOut,
    TimelineEntryOut,
)
from app.scoring import compute_user_score, is_qualified_lead, lead_status

router = APIRouter(prefix="/internal", tags=["internal-students"])


def _student_row(db: Session, user: User) -> dict:
    prof = db.get(StudentProfile, user.id)
    ix = list(db.scalars(select(Interaction).where(Interaction.user_id == user.id)))
    events_attended = len({i.event_id for i in ix if i.event_id})
    last = max((i.timestamp for i in ix), default=None)
    open_fu = len(
        list(
            db.scalars(
                select(FollowUp.id).where(
                    FollowUp.contact_user_id == user.id,
                    FollowUp.status.in_(("open", "in_progress")),
                )
            )
        )
    )
    return {
        "user_id": user.id,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "university": prof.university if prof else None,
        "study_degree": prof.study_degree if prof else None,
        "engagement_score": compute_user_score(db, user.id),
        "lead_status": lead_status(ix),
        "events_attended": events_attended,
        "last_interaction_at": last,
        "open_follow_ups": open_fu,
    }


@router.get("/students", response_model=list[StudentRowOut])
def list_students(
    sort: str = Query("priority"),
    university: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    users = list(db.scalars(select(User).where(User.role == "student")))
    rows = [_student_row(db, u) for u in users]
    if university:
        rows = [r for r in rows if r["university"] == university]
    if sort == "engagement" or sort == "priority":
        rows.sort(key=lambda r: r["engagement_score"], reverse=True)
    elif sort == "recency":
        # None-safe, timezone-safe: sort by ISO string (datetime→iso, None→"")
        rows.sort(
            key=lambda r: r["last_interaction_at"].isoformat() if r["last_interaction_at"] else "",
            reverse=True,
        )
    return rows


@router.get("/students/{student_user_id}", response_model=StudentDetailOut)
def student_detail(
    student_user_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)
):
    user = db.get(User, student_user_id)
    if not user or user.role != "student":
        raise not_found("Student not found.")
    row = _student_row(db, user)
    prof = db.get(StudentProfile, user.id)

    tag_ids = list(db.scalars(select(UserInterest.tag_id).where(UserInterest.user_id == user.id)))
    interests = [
        t.name for t in db.scalars(select(InterestTag).where(InterestTag.id.in_(tag_ids)))
    ]

    follow_ups = list(db.scalars(select(FollowUp).where(FollowUp.contact_user_id == user.id)))
    ix = list(db.scalars(select(Interaction).where(Interaction.user_id == user.id)))
    rec = (
        "Assign a personal follow-up — qualified lead."
        if is_qualified_lead(ix)
        else "Keep nurturing; share relevant materials."
    )

    return {
        **row,
        "hometown": prof.hometown if prof else None,
        "interests": interests,
        "recommended_next_action": rec,
        "follow_ups": [
            {
                "id": fu.id,
                "event_id": fu.event_id,
                "contact_user_id": fu.contact_user_id,
                "contact_name": user.display_name,
                "assigned_owner_id": fu.assigned_owner_id,
                "next_action": fu.next_action,
                "type": fu.type,
                "due_date": fu.due_date,
                "status": fu.status,
                "outcome": fu.outcome,
                "created_at": fu.created_at,
                "completed_at": fu.completed_at,
            }
            for fu in follow_ups
        ],
    }


@router.get("/students/{student_user_id}/timeline", response_model=list[TimelineEntryOut])
def student_timeline(
    student_user_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)
):
    if not db.get(User, student_user_id):
        raise not_found("Student not found.")
    rows = db.scalars(
        select(Interaction)
        .where(Interaction.user_id == student_user_id)
        .order_by(Interaction.timestamp.desc())
    )
    out = []
    for i in rows:
        ev = db.get(Event, i.event_id) if i.event_id else None
        out.append(
            {
                "id": i.id,
                "event_id": i.event_id,
                "event_title": ev.title if ev else None,
                "type": i.type,
                "timestamp": i.timestamp,
            }
        )
    return out


@router.get("/priority-queue", response_model=list[PriorityItemOut])
def priority(db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return priority_queue(db)
