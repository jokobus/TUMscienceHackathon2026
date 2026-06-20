"""Serialization helpers shared by routers — turn ORM rows into contract shapes."""
from __future__ import annotations

from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from datetime import datetime, timedelta, timezone

from app.kpis import compute_event_kpis, compute_health, returning_user_count
from app.models import (
    Chat,
    ChatParticipant,
    Event,
    EventRegistration,
    EventResponsibleEmployee,
    Interaction,
    Message,
    StudentProfile,
    User,
)
from app.scoring import lead_status


def user_display(db: Session, user_id: str | None) -> str | None:
    if not user_id:
        return None
    u = db.get(User, user_id)
    return u.display_name if u else None


def responsible_ids(db: Session, event_id: str) -> list[str]:
    return list(
        db.scalars(
            select(EventResponsibleEmployee.employee_id).where(
                EventResponsibleEmployee.event_id == event_id
            )
        )
    )


def build_event_summary(db: Session, event: Event, viewer_id: str | None, kpis: dict | None = None) -> dict:
    kpis = kpis or compute_event_kpis(db, event.id)
    is_owner = bool(viewer_id) and (
        event.owner_employee_id == viewer_id or viewer_id in responsible_ids(db, event.id)
    )
    health = None
    if event.status in ("ongoing", "past"):
        health = compute_health(kpis, event.status)
    return {
        "id": event.id,
        "title": event.title,
        "type": event.type,
        "city": event.city,
        "location": event.location,
        "start_at": event.start_at,
        "end_at": event.end_at,
        "status": event.status,
        "attendee_count": kpis["checked_in"] or kpis["registered"],
        "health": health,
        "is_owner": is_owner,
        "images": event.images or [],
    }


def build_event_detail(db: Session, event: Event, viewer_id: str | None) -> dict:
    kpis = compute_event_kpis(db, event.id)
    summary = build_event_summary(db, event, viewer_id, kpis=kpis)
    analysis = None
    if event.status in ("ongoing", "past"):
        returning = returning_user_count(db, event.id)
        analysis = {
            "health": summary["health"],
            "returning_users": returning,
            "qualified_leads": kpis["qualified_leads"],
            "engagement_index": kpis["engagement_index"],
            "summary": _analysis_text(event, kpis, returning),
        }
    return {
        **summary,
        "description": event.description or "",
        "target_group": event.target_group,
        "goal": event.goal,
        "partner_university": event.partner_university,
        "owner_employee_id": event.owner_employee_id,
        "responsible_employee_ids": responsible_ids(db, event.id),
        "live_analytics_enabled": event.live_analytics_enabled,
        "kpis": kpis,
        "analysis": analysis,
    }


def _analysis_text(event: Event, kpis: dict, returning: int) -> str:
    parts = [
        f"{kpis['checked_in']} of {kpis['registered']} registered attended "
        f"({int(kpis['check_in_rate'] * 100)}% check-in).",
        f"{kpis['qualified_leads']} qualified leads.",
    ]
    if returning:
        parts.append(f"{returning} returning contact(s).")
    if kpis["recommendation_score"]:
        parts.append(f"Avg recommendation {kpis['recommendation_score']}/10.")
    if kpis["follow_ups_open"]:
        parts.append(f"{kpis['follow_ups_open']} follow-up(s) still open.")
    return " ".join(parts)


def build_attendees(db: Session, event_id: str) -> list[dict]:
    regs = list(db.scalars(select(EventRegistration).where(EventRegistration.event_id == event_id)))
    # interactions grouped per user for this event
    ix = db.scalars(select(Interaction).where(Interaction.event_id == event_id))
    by_user: dict[str, list[Interaction]] = defaultdict(list)
    for i in ix:
        if i.user_id:
            by_user[i.user_id].append(i)

    out: list[dict] = []
    for r in regs:
        if not r.user_id:
            continue
        u = db.get(User, r.user_id)
        if not u:
            continue
        prof = db.get(StudentProfile, r.user_id)
        out.append(
            {
                "user_id": u.id,
                "display_name": u.display_name,
                "avatar_url": u.avatar_url,
                "university": prof.university if prof else None,
                "study_degree": prof.study_degree if prof else None,
                "checked_in_at": r.checked_in_at,
                "full_session": r.checked_out_at is not None,
                "lead_status": lead_status(by_user.get(r.user_id, [])),
            }
        )
    # qualified first, then checked_in, then registered
    order = {"qualified": 0, "checked_in": 1, "registered": 2}
    out.sort(key=lambda a: order.get(a["lead_status"], 3))
    return out


# ── Chat / messaging helpers ─────────────────────────────────────────────────
def chat_sort_key(summary: dict):
    """Sort chats by recency, putting message-less chats last (handles None/tz mix)."""
    v = summary.get("last_message_at")
    return (v is not None, v if v is not None else 0)


def chat_participant_ids(db: Session, chat_id: str) -> list[str]:
    return list(
        db.scalars(select(ChatParticipant.user_id).where(ChatParticipant.chat_id == chat_id))
    )


def message_to_dict(db: Session, msg: Message) -> dict:
    return {
        "id": msg.id,
        "chat_id": msg.chat_id,
        "sender_user_id": msg.sender_user_id,
        "sender_name": user_display(db, msg.sender_user_id) or "Unknown",
        "body": msg.body,
        "sent_at": msg.sent_at,
        "is_broadcast": msg.is_broadcast,
    }


def _last_message(db: Session, chat_id: str) -> Message | None:
    return db.scalars(
        select(Message).where(Message.chat_id == chat_id).order_by(Message.sent_at.desc()).limit(1)
    ).first()


def chat_live_highlight(event: Event | None) -> bool:
    if not event:
        return False
    now = datetime.now(timezone.utc)
    start = event.start_at
    end = event.end_at
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    return (start - timedelta(hours=2)) <= now <= (end + timedelta(hours=2))


def build_chat_summary(db: Session, chat: Chat, viewer_id: str) -> dict:
    last = _last_message(db, chat.id)
    event = db.get(Event, chat.event_id) if chat.event_id else None
    # unread = messages not authored by viewer without viewer in read_by
    unread = 0
    for m in db.scalars(select(Message).where(Message.chat_id == chat.id)):
        if m.sender_user_id != viewer_id and (not m.read_by or viewer_id not in m.read_by):
            unread += 1
    return {
        "id": chat.id,
        "type": chat.type,
        "title": chat.title or "Conversation",
        "subtitle": chat.subtitle,
        "event_id": chat.event_id,
        "last_message": last.body if last else None,
        "last_message_at": last.sent_at if last else None,
        "unread": unread,
        "live_highlight": chat.type == "event_channel" and chat_live_highlight(event),
    }
