"""Internal — Employee my-events, profile, notifications (MASTER §6.8/§6.18)."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_employee
from app.errors import not_found
from app.errors import not_found
from app.models import (
    EmployeeProfile,
    Event,
    EventResponsibleEmployee,
    Notification,
    User,
)
from app.schemas import (
    EmployeeProfileOut,
    EmployeeProfileUpdate,
    EventSummaryOut,
    NotificationOut,
    iso_z,
)
from app.services import build_event_summary

router = APIRouter(prefix="/internal", tags=["internal-employees"])


def _profile_payload(db: Session, user: User) -> dict:
    prof = db.get(EmployeeProfile, user.id)
    return {
        "id": user.id,
        "role": user.role,
        "email": user.email,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at,
        "first_name": prof.first_name if prof else "",
        "surname": prof.surname if prof else "",
        "seniority": prof.seniority if prof else None,
        "branch_office": prof.branch_office if prof else None,
    }


def _events_for(db: Session, employee_id: str, viewer_id: str) -> list[dict]:
    owned = select(Event.id).where(Event.owner_employee_id == employee_id)
    responsible = select(EventResponsibleEmployee.event_id).where(
        EventResponsibleEmployee.employee_id == employee_id
    )
    event_ids = set(db.scalars(owned)) | set(db.scalars(responsible))
    events = db.scalars(
        select(Event).where(Event.id.in_(event_ids)).order_by(Event.start_at)
    )
    return [build_event_summary(db, e, viewer_id) for e in events]


@router.get("/employees/{employee_id}/events", response_model=list[EventSummaryOut])
def employee_events(
    employee_id: str, db: Session = Depends(get_db), emp: User = Depends(require_employee)
):
    return _events_for(db, employee_id, emp.id)


@router.get("/employees/me", response_model=EmployeeProfileOut)
def get_me(db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    return _profile_payload(db, emp)


@router.patch("/employees/me", response_model=EmployeeProfileOut)
def update_me(
    body: EmployeeProfileUpdate, db: Session = Depends(get_db), emp: User = Depends(require_employee)
):
    prof = db.get(EmployeeProfile, emp.id)
    data = body.model_dump(exclude_unset=True)
    if "avatar_url" in data:
        emp.avatar_url = data["avatar_url"]
    if "display_name" in data:
        emp.display_name = data["display_name"]
    if prof:
        if "first_name" in data:
            prof.first_name = data["first_name"]
        if "surname" in data:
            prof.surname = data["surname"]
        if "first_name" in data or "surname" in data:
            emp.display_name = f"{prof.first_name} {prof.surname}".strip()
    db.commit()
    return _profile_payload(db, emp)


@router.get("/notifications", response_model=list[NotificationOut])
def notifications(db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    rows = db.scalars(
        select(Notification)
        .where(or_(Notification.user_id == emp.id, Notification.user_id == "ALL"))
        .order_by(Notification.created_at.desc())
    )
    out = []
    for n in rows:
        payload = n.payload or {}
        out.append(
            {
                "id": n.id,
                "type": n.type,
                "title": payload.get("title", ""),
                "body": payload.get("body", ""),
                "event_id": payload.get("event_id"),
                "created_at": n.created_at,
                "read_at": n.read_at,
            }
        )
    return out


@router.patch("/notifications/{notification_id}")
def mark_notification_read(
    notification_id: str,
    body: dict = Body(default={}),
    db: Session = Depends(get_db),
    emp: User = Depends(require_employee),
):
    n = db.get(Notification, notification_id)
    if not n:
        raise not_found("Notification not found.")
    if not n.read_at:
        n.read_at = datetime.now(timezone.utc)
        db.commit()
    return {"id": n.id, "read_at": iso_z(n.read_at)}
