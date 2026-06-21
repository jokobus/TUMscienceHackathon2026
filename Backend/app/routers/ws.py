"""WebSocket chat server (MASTER §7) at /ws/chat.

Envelope (both directions): { "action": str, "payload": {...} }.
Auth: ?token=<JWT> on connect, or a first `authenticate` frame.
"""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.db import SessionLocal
from app.messaging import post_message, recipients_for_chat
from app.models import Chat, ChatParticipant, Event
from app.realtime import manager
from app.security import decode_token
from app.services import chat_live_highlight

router = APIRouter()


def _user_from_token(token: str | None) -> str | None:
    if not token:
        return None
    payload = decode_token(token)
    return payload.get("sub") if payload else None


def _chat_recipients(chat_id: str, exclude: str | None = None) -> list[str]:
    db = SessionLocal()
    try:
        chat = db.get(Chat, chat_id)
        ids = recipients_for_chat(db, chat) if chat else []
    finally:
        db.close()
    return [i for i in ids if i != exclude]


def _contacts_of(user_id: str) -> list[str]:
    """Everyone who shares at least one chat with this user (for presence fan-out)."""
    db = SessionLocal()
    try:
        chat_ids = list(
            db.scalars(select(ChatParticipant.chat_id).where(ChatParticipant.user_id == user_id))
        )
        contacts = (
            set(
                db.scalars(
                    select(ChatParticipant.user_id).where(ChatParticipant.chat_id.in_(chat_ids))
                )
            )
            if chat_ids
            else set()
        )
    finally:
        db.close()
    contacts.discard(user_id)
    return list(contacts)


def _channel_highlight_frame(chat_id: str) -> dict | None:
    """A `channel_highlight` frame (§7) if `chat_id` is an event channel; else None."""
    db = SessionLocal()
    try:
        chat = db.get(Chat, str(chat_id))
        if not chat or chat.type != "event_channel" or not chat.event_id:
            return None
        event = db.get(Event, chat.event_id)
        active = chat_live_highlight(event)
        return {
            "action": "channel_highlight",
            "payload": {"chatId": chat.id, "eventId": chat.event_id, "active": active},
        }
    finally:
        db.close()


@router.websocket("/ws/chat")
async def chat_socket(ws: WebSocket, token: str | None = None):
    user_id = _user_from_token(token)

    if not user_id:
        # Allow a first `authenticate` frame to carry the token.
        await ws.accept()
        try:
            first = await ws.receive_json()
        except (WebSocketDisconnect, ValueError):
            await ws.close()
            return
        if first.get("action") == "authenticate":
            user_id = _user_from_token(first.get("payload", {}).get("token"))
        if not user_id:
            await ws.send_json({"action": "error", "payload": {"code": "unauthorized", "message": "Invalid token."}})
            await ws.close()
            return
        manager._active[user_id].add(ws)  # already accepted
    else:
        await manager.connect(user_id, ws)

    await ws.send_json({"action": "presence_update", "payload": {"userId": user_id, "status": "online"}})

    try:
        while True:
            frame = await ws.receive_json()
            action = frame.get("action")
            payload = frame.get("payload", {}) or {}

            if action == "send_message":
                chat_id = payload.get("chatId")
                body = payload.get("message", "")
                client_msg_id = payload.get("clientMsgId")
                if chat_id and body:
                    # post_message persists + fans out to all recipients via the manager.
                    db = SessionLocal()
                    try:
                        post_message(db, str(chat_id), user_id, body, client_msg_id=client_msg_id)
                    finally:
                        db.close()

            elif action == "typing":
                chat_id = payload.get("chatId")
                if chat_id:
                    await manager.send_to_users(
                        _chat_recipients(str(chat_id), exclude=user_id),
                        {"action": "typing", "payload": {"chatId": chat_id, "from": user_id}},
                    )

            elif action == "read_receipt":
                chat_id = payload.get("chatId")
                if chat_id:
                    await manager.send_to_users(
                        _chat_recipients(str(chat_id), exclude=user_id),
                        {
                            "action": "read_receipt",
                            "payload": {
                                "chatId": chat_id,
                                "from": user_id,
                                "messageId": payload.get("messageId"),
                            },
                        },
                    )

            elif action == "presence":
                status = payload.get("status", "online")
                frame = {"action": "presence_update", "payload": {"userId": user_id, "status": status}}
                # Fan out to everyone we share a chat with (§7), plus echo to self.
                await manager.send_to_users(_contacts_of(user_id), frame)
                await ws.send_json(frame)

            elif action == "join_chat":
                # subscription is implicit (we deliver by participant); ack…
                chat_id = payload.get("chatId")
                await ws.send_json({"action": "joined", "payload": {"chatId": chat_id}})
                # …then surface the §7 channel_highlight for live event channels.
                if chat_id:
                    highlight = _channel_highlight_frame(str(chat_id))
                    if highlight:
                        await ws.send_json(highlight)

    except WebSocketDisconnect:
        manager.disconnect(user_id, ws)
    except Exception:
        manager.disconnect(user_id, ws)
        try:
            await ws.close()
        except Exception:
            pass
