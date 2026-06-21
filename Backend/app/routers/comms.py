"""Internal — Communication Hub (MASTER §6.16). Role employee."""
from __future__ import annotations

from fastapi import APIRouter, Body, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import gen_id, get_db
from app.deps import require_employee
from app.errors import not_found
from app.messaging import mark_chat_read, post_message
from app.models import Chat, ChatParticipant, Message, User
from app.schemas import ChatSummaryOut, MessageCreateRequest, MessageOut
from app.scoring import compute_user_score
from app.services import build_chat_summary, chat_sort_key, message_to_dict

router = APIRouter(prefix="/internal", tags=["internal-comms"])


def _my_chats(db: Session, user_id: str) -> list[Chat]:
    chat_ids = set(
        db.scalars(select(ChatParticipant.chat_id).where(ChatParticipant.user_id == user_id))
    )
    return list(db.scalars(select(Chat).where(Chat.id.in_(chat_ids))))


@router.get("/chats", response_model=list[ChatSummaryOut])
def internal_chats(db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    chats = _my_chats(db, emp.id)
    out = [build_chat_summary(db, c, emp.id) for c in chats]
    out.sort(key=chat_sort_key, reverse=True)
    return out


@router.get("/chats/{chat_id}", response_model=ChatSummaryOut)
def internal_chat(chat_id: str, db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    chat = db.get(Chat, chat_id)
    if not chat:
        raise not_found("Chat not found.")
    # opening a chat marks its messages read for the viewer
    rows = list(db.scalars(select(Message).where(Message.chat_id == chat_id)))
    mark_chat_read(db, rows, emp.id)
    return build_chat_summary(db, chat, emp.id)


@router.get("/chats/{chat_id}/messages", response_model=list[MessageOut])
def internal_chat_messages(
    chat_id: str, db: Session = Depends(get_db), emp: User = Depends(require_employee)
):
    if not db.get(Chat, chat_id):
        raise not_found("Chat not found.")
    rows = list(db.scalars(select(Message).where(Message.chat_id == chat_id).order_by(Message.sent_at)))
    # The Dashboard opens chats via this endpoint (no single-chat GET), so mark
    # read here too — otherwise its unread badges never clear.
    mark_chat_read(db, rows, emp.id)
    return [message_to_dict(db, m) for m in rows]


@router.post("/chats/{chat_id}/messages", response_model=MessageOut, status_code=201)
def internal_send_message(
    chat_id: str,
    body: MessageCreateRequest,
    db: Session = Depends(get_db),
    emp: User = Depends(require_employee),
):
    if not db.get(Chat, chat_id):
        raise not_found("Chat not found.")
    return post_message(db, chat_id, emp.id, body.body, client_msg_id=body.client_msg_id)


@router.post("/chats", response_model=ChatSummaryOut, status_code=201)
def internal_create_chat(
    body: dict = Body(...), db: Session = Depends(get_db), emp: User = Depends(require_employee)
):
    other_id = body.get("user_id")
    chat_type = body.get("type", "internal")
    # reuse an existing 1:1 chat if present
    if other_id:
        for c in _my_chats(db, emp.id):
            members = set(
                db.scalars(select(ChatParticipant.user_id).where(ChatParticipant.chat_id == c.id))
            )
            if {emp.id, other_id} <= members and len(members) == 2:
                return build_chat_summary(db, c, emp.id)
    other = db.get(User, other_id) if other_id else None
    chat = Chat(
        id=gen_id("chat"),
        type=chat_type,
        title=other.display_name if other else "Conversation",
    )
    db.add(chat)
    db.flush()
    db.add(ChatParticipant(chat_id=chat.id, user_id=emp.id))
    if other:
        db.add(ChatParticipant(chat_id=chat.id, user_id=other.id))
    db.commit()
    return build_chat_summary(db, chat, emp.id)


@router.get("/student-conversations", response_model=list[ChatSummaryOut])
def student_conversations(db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    """DMs with students, sorted by the student's engagement score (follow-up signal)."""
    chats = [c for c in _my_chats(db, emp.id) if c.type in ("dm", "student_conversation")]
    scored = []
    for c in chats:
        members = list(
            db.scalars(select(ChatParticipant.user_id).where(ChatParticipant.chat_id == c.id))
        )
        student_id = next(
            (m for m in members if (u := db.get(User, m)) and u.role in ("student", "guest")), None
        )
        score = compute_user_score(db, student_id) if student_id else 0
        scored.append((score, build_chat_summary(db, c, emp.id)))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [s[1] for s in scored]
