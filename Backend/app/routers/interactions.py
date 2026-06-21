"""Student — Check-in / scan / generic interactions (MASTER §6.3)."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import gen_id, get_db
from app.deps import get_current_user, require_student
from app.errors import not_found
from app.models import Chat, ChatParticipant, Event, EventRegistration, Interaction, User
from app.schemas import InteractionCreateRequest, iso_z
from app.scoring import recompute_and_cache

router = APIRouter(prefix="/api", tags=["interactions"])


@router.post("/events/{event_id}/check-in")
def check_in(event_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    event = db.get(Event, event_id)
    if not event:
        raise not_found("Event not found.")
    now = datetime.now(timezone.utc)
    reg = db.scalar(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id, EventRegistration.user_id == user.id
        )
    )
    # Idempotent: a repeat scan must not log a second check_in or move the time.
    already_checked_in = bool(reg and reg.checked_in_at)
    if not reg:
        reg = EventRegistration(
            id=gen_id("reg"),
            event_id=event_id,
            user_id=user.id,
            email=user.email,
            source="scanned",
            checked_in_at=now,
        )
        db.add(reg)
    elif not reg.checked_in_at:
        reg.checked_in_at = now

    if not already_checked_in:
        # re_engagement if they interacted with an earlier event before
        prior = db.scalar(
            select(Interaction.id).where(
                Interaction.user_id == user.id, Interaction.event_id != event_id
            ).limit(1)
        )
        db.add(_ix(event_id, user.id, "check_in"))
        if prior:
            db.add(_ix(event_id, user.id, "re_engagement"))
        db.commit()
        recompute_and_cache(db, user.id, event_id)
        db.commit()

    return {
        "ok": True,
        "event_id": event_id,
        "checked_in_at": iso_z(reg.checked_in_at),
        "already_checked_in": already_checked_in,
    }


@router.post("/scan/employee/{employee_id}")
def scan_employee(
    employee_id: str, db: Session = Depends(get_db), user: User = Depends(require_student)
):
    emp = db.get(User, employee_id)
    if not emp or emp.role != "employee":
        raise not_found("Employee not found.")
    db.add(_ix(None, user.id, "connection"))
    # find/create DM
    chat = None
    for c in db.scalars(select(Chat).where(Chat.type == "dm")):
        members = set(
            db.scalars(select(ChatParticipant.user_id).where(ChatParticipant.chat_id == c.id))
        )
        if {user.id, emp.id} <= members:
            chat = c
            break
    if not chat:
        chat = Chat(id=gen_id("dm"), type="dm", title=emp.display_name)
        db.add(chat)
        db.flush()
        db.add(ChatParticipant(chat_id=chat.id, user_id=user.id))
        db.add(ChatParticipant(chat_id=chat.id, user_id=emp.id))
    db.commit()
    recompute_and_cache(db, user.id)
    db.commit()
    return {"chat_id": chat.id, "employee_name": emp.display_name}


@router.post("/interactions")
def log_interaction(
    body: InteractionCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    ix = Interaction(
        id=gen_id("i"),
        event_id=body.event_id,
        user_id=user.id,
        type=body.type,
        source="student_app",
        meta=body.metadata,
    )
    db.add(ix)
    db.commit()
    recompute_and_cache(db, user.id, body.event_id)
    db.commit()
    return {"id": ix.id}


def _ix(event_id: str | None, user_id: str, itype: str) -> Interaction:
    return Interaction(
        id=gen_id("i"), event_id=event_id, user_id=user_id, type=itype, source="student_app"
    )
