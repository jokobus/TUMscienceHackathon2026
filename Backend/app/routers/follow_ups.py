"""Internal — Follow-ups (MASTER §6.13). Role employee."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import gen_id, get_db
from app.deps import require_employee
from app.errors import not_found
from app.models import FollowUp, User
from app.schemas import FollowUpCreateRequest, FollowUpOut, FollowUpUpdateRequest

router = APIRouter(prefix="/internal", tags=["internal-follow-ups"])


def _to_out(db: Session, fu: FollowUp) -> dict:
    contact = db.get(User, fu.contact_user_id) if fu.contact_user_id else None
    return {
        "id": fu.id,
        "event_id": fu.event_id,
        "contact_user_id": fu.contact_user_id,
        "contact_name": contact.display_name if contact else None,
        "assigned_owner_id": fu.assigned_owner_id,
        "next_action": fu.next_action,
        "type": fu.type,
        "due_date": fu.due_date,
        "status": fu.status,
        "outcome": fu.outcome,
        "created_at": fu.created_at,
        "completed_at": fu.completed_at,
    }


@router.get("/follow-ups", response_model=list[FollowUpOut])
def list_follow_ups(
    event_id: str | None = Query(None),
    owner_id: str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    stmt = select(FollowUp)
    if event_id:
        stmt = stmt.where(FollowUp.event_id == event_id)
    if owner_id:
        stmt = stmt.where(FollowUp.assigned_owner_id == owner_id)
    if status:
        stmt = stmt.where(FollowUp.status == status)
    return [_to_out(db, fu) for fu in db.scalars(stmt.order_by(FollowUp.created_at.desc()))]


@router.post("/follow-ups", response_model=FollowUpOut, status_code=201)
def create_follow_up(
    body: FollowUpCreateRequest, db: Session = Depends(get_db), emp: User = Depends(require_employee)
):
    fu = FollowUp(
        id=gen_id("fu"),
        event_id=body.event_id,
        contact_user_id=body.contact_user_id,
        assigned_owner_id=body.assigned_owner_id or emp.id,
        next_action=body.next_action,
        type=body.type,
        due_date=body.due_date,
        status="open",
    )
    db.add(fu)
    db.commit()
    db.refresh(fu)
    return _to_out(db, fu)


@router.patch("/follow-ups/{follow_up_id}", response_model=FollowUpOut)
def update_follow_up(
    follow_up_id: str,
    body: FollowUpUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    fu = db.get(FollowUp, follow_up_id)
    if not fu:
        raise not_found("Follow-up not found.")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(fu, k, v)
    if data.get("status") in ("done", "closed") and not fu.completed_at:
        fu.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(fu)
    return _to_out(db, fu)


@router.get("/events/{event_id}/follow-ups", response_model=list[FollowUpOut])
def event_follow_ups(event_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    rows = db.scalars(select(FollowUp).where(FollowUp.event_id == event_id))
    return [_to_out(db, fu) for fu in rows]
