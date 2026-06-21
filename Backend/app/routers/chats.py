"""Chat REST helpers — student (§6.6) + people search (used by all clients)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import gen_id, get_db
from app.deps import get_current_user
from app.errors import forbidden, not_found
from app.messaging import mark_chat_read, post_message
from app.models import (
    Chat,
    ChatParticipant,
    EmployeeProfile,
    EventRegistration,
    Message,
    StudentProfile,
    User,
)
from app.schemas import ChatSummaryOut, MessageCreateRequest, MessageOut, PersonSearchResultOut
from app.services import build_chat_summary, chat_sort_key, message_to_dict

router = APIRouter(prefix="/api/chats", tags=["chats"])


def _my_chats(db: Session, user_id: str) -> list[Chat]:
    chat_ids = set(
        db.scalars(select(ChatParticipant.chat_id).where(ChatParticipant.user_id == user_id))
    )
    return list(db.scalars(select(Chat).where(Chat.id.in_(chat_ids))))


def _is_member(db: Session, chat_id: str, user_id: str) -> bool:
    return (
        db.scalar(
            select(ChatParticipant).where(
                ChatParticipant.chat_id == chat_id, ChatParticipant.user_id == user_id
            )
        )
        is not None
    )


def _existing_dm(db: Session, a: str, b: str) -> str | None:
    for c in _my_chats(db, a):
        members = set(
            db.scalars(select(ChatParticipant.user_id).where(ChatParticipant.chat_id == c.id))
        )
        if {a, b} <= members and len(members) == 2:
            return c.id
    return None


def _allowed_contact_ids(db: Session, student_id: str) -> set[str]:
    """People a student is allowed to start a chat with (MASTER §6.6 / AGENT_STUDENT_APP):
    only those they already share a chat with, or co-attended an event with —
    not arbitrary recruiters or other students."""
    allowed: set[str] = set()
    # Members of any chat the student is already part of (DMs + event channels).
    my_chat_ids = list(
        db.scalars(select(ChatParticipant.chat_id).where(ChatParticipant.user_id == student_id))
    )
    if my_chat_ids:
        for uid in db.scalars(
            select(ChatParticipant.user_id).where(ChatParticipant.chat_id.in_(my_chat_ids))
        ):
            allowed.add(uid)
    # Co-attendees: anyone registered to an event the student is registered to.
    my_event_ids = list(
        db.scalars(select(EventRegistration.event_id).where(EventRegistration.user_id == student_id))
    )
    if my_event_ids:
        for uid in db.scalars(
            select(EventRegistration.user_id).where(EventRegistration.event_id.in_(my_event_ids))
        ):
            allowed.add(uid)
    allowed.discard(student_id)
    return allowed


@router.get("/search-people", response_model=list[PersonSearchResultOut])
def search_people(
    q: str = Query(""), db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    term = q.strip().lower()
    # Students may only discover people they already share a chat with or
    # co-attended an event with — not arbitrary recruiters or students.
    allowed = _allowed_contact_ids(db, user.id) if user.role == "student" else None
    results: list[dict] = []
    for u in db.scalars(select(User).where(User.id != user.id)):
        if allowed is not None and u.id not in allowed:
            continue
        if u.role == "student":
            prof = db.get(StudentProfile, u.id)
            context = " · ".join(filter(None, [prof.university if prof else None, prof.study_degree if prof else None]))
        elif u.role == "employee":
            prof = db.get(EmployeeProfile, u.id)
            context = f"Würth · {prof.seniority if prof else 'Employee'}"
        else:
            context = "Guest"
        results.append(
            {
                "user_id": u.id,
                "display_name": u.display_name,
                "avatar_url": u.avatar_url,
                "role": u.role,
                "context": context or u.role,
                "chat_id": _existing_dm(db, user.id, u.id),
            }
        )
    if term:
        results = [
            r for r in results
            if term in r["display_name"].lower() or term in r["context"].lower()
        ]
    return results


@router.get("", response_model=list[ChatSummaryOut])
def my_chats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    out = [build_chat_summary(db, c, user.id) for c in _my_chats(db, user.id)]
    out.sort(key=chat_sort_key, reverse=True)
    return out


@router.post("", response_model=ChatSummaryOut, status_code=201)
def create_chat(
    body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    other_id = body.get("user_id")
    if other_id:
        existing = _existing_dm(db, user.id, other_id)
        if existing:
            return build_chat_summary(db, db.get(Chat, existing), user.id)
    # Enforce the student contact restriction server-side: a student can only
    # open a new chat with an allowed contact (co-attended or already connected).
    if user.role == "student" and other_id and other_id not in _allowed_contact_ids(db, user.id):
        raise forbidden("You can only message people you've met at an event or already connected with.")
    other = db.get(User, other_id) if other_id else None
    chat = Chat(id=gen_id("dm"), type=body.get("type", "dm"), title=other.display_name if other else "Conversation")
    db.add(chat)
    db.flush()
    db.add(ChatParticipant(chat_id=chat.id, user_id=user.id))
    if other:
        db.add(ChatParticipant(chat_id=chat.id, user_id=other.id))
    db.commit()
    return build_chat_summary(db, chat, user.id)


@router.get("/{chat_id}/messages", response_model=list[MessageOut])
def chat_messages(chat_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.get(Chat, chat_id):
        raise not_found("Chat not found.")
    if not _is_member(db, chat_id, user.id):
        raise forbidden("You are not a participant in this conversation.")
    rows = list(db.scalars(select(Message).where(Message.chat_id == chat_id).order_by(Message.sent_at)))
    # Opening a chat (fetching its messages) marks them read for the viewer, so the
    # unread badge clears — students have no single-chat GET, so this is their only
    # mark-read path.
    mark_chat_read(db, rows, user.id)
    return [message_to_dict(db, m) for m in rows]


@router.post("/{chat_id}/messages", response_model=MessageOut, status_code=201)
def send_message(
    chat_id: str,
    body: MessageCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.get(Chat, chat_id):
        raise not_found("Chat not found.")
    if not _is_member(db, chat_id, user.id):
        raise forbidden("You are not a participant in this conversation.")
    return post_message(db, chat_id, user.id, body.body, client_msg_id=body.client_msg_id)
