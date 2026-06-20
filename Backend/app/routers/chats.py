"""Chat REST helpers — student (§6.6) + people search (used by all clients)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import gen_id, get_db
from app.deps import get_current_user
from app.errors import not_found
from app.messaging import post_message
from app.models import (
    Chat,
    ChatParticipant,
    EmployeeProfile,
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


def _existing_dm(db: Session, a: str, b: str) -> str | None:
    for c in _my_chats(db, a):
        members = set(
            db.scalars(select(ChatParticipant.user_id).where(ChatParticipant.chat_id == c.id))
        )
        if {a, b} <= members and len(members) == 2:
            return c.id
    return None


@router.get("/search-people", response_model=list[PersonSearchResultOut])
def search_people(
    q: str = Query(""), db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    term = q.strip().lower()
    results: list[dict] = []
    for u in db.scalars(select(User).where(User.id != user.id)):
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
    rows = db.scalars(select(Message).where(Message.chat_id == chat_id).order_by(Message.sent_at))
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
    return post_message(db, chat_id, user.id, body.body)
