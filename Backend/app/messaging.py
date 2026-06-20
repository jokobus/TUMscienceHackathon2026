"""Message persistence + WS fan-out (MASTER §7). Used by REST and the WS server."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import gen_id
from app.models import Chat, ChatParticipant, Event, EventRegistration, EventResponsibleEmployee, Message
from app.realtime import manager
from app.services import message_to_dict


def get_or_create_event_channel(db: Session, event_id: str) -> Chat:
    chat = db.scalar(
        select(Chat).where(Chat.event_id == event_id, Chat.type == "event_channel")
    )
    if chat:
        return chat
    event = db.get(Event, event_id)
    chat = Chat(
        id=gen_id("chan"),
        type="event_channel",
        event_id=event_id,
        title=event.title if event else "Event channel",
        subtitle="Event channel",
    )
    db.add(chat)
    db.flush()
    return chat


def recipients_for_chat(db: Session, chat: Chat) -> list[str]:
    ids = set(
        db.scalars(select(ChatParticipant.user_id).where(ChatParticipant.chat_id == chat.id))
    )
    if chat.type == "event_channel" and chat.event_id:
        ids |= {
            r.user_id
            for r in db.scalars(
                select(EventRegistration).where(EventRegistration.event_id == chat.event_id)
            )
            if r.user_id
        }
        ids |= set(
            db.scalars(
                select(EventResponsibleEmployee.employee_id).where(
                    EventResponsibleEmployee.event_id == chat.event_id
                )
            )
        )
    return list(ids)


def post_message(
    db: Session, chat_id: str, sender_id: str, body: str, is_broadcast: bool = False
) -> dict:
    msg = Message(
        id=gen_id("msg"),
        chat_id=chat_id,
        sender_user_id=sender_id,
        body=body,
        is_broadcast=is_broadcast,
        read_by=[sender_id],
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    payload = message_to_dict(db, msg)
    chat = db.get(Chat, chat_id)
    recipients = recipients_for_chat(db, chat) if chat else [sender_id]

    action = "broadcast" if is_broadcast else "new_message"
    frame = {
        "action": action,
        "payload": {
            "chatId": chat_id,
            "from": sender_id,
            "message": body,
            "sentAt": payload["sent_at"].isoformat() if hasattr(payload["sent_at"], "isoformat") else payload["sent_at"],
            "messageId": msg.id,
            "senderName": payload["sender_name"],
            "isBroadcast": is_broadcast,
            **({"eventId": chat.event_id} if chat and chat.event_id else {}),
        },
    }
    manager.notify_threadsafe(recipients, frame)
    return payload
