"""WebSocket chat server (MASTER §7) at /ws/chat.

Envelope (both directions): { "action": str, "payload": {...} }.
Auth: ?token=<JWT> on connect, or a first `authenticate` frame.
"""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.db import SessionLocal
from app.messaging import post_message, recipients_for_chat
from app.models import Chat, ChatParticipant
from app.realtime import manager
from app.security import decode_token

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
                if chat_id and body:
                    # post_message persists + fans out to all recipients via the manager.
                    db = SessionLocal()
                    try:
                        post_message(db, str(chat_id), user_id, body)
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
                # naive: notify everyone we share a chat with is overkill; echo to self for now
                await ws.send_json(
                    {"action": "presence_update", "payload": {"userId": user_id, "status": status}}
                )

            elif action == "join_chat":
                # subscription is implicit (we deliver by participant); ack only
                await ws.send_json(
                    {"action": "joined", "payload": {"chatId": payload.get("chatId")}}
                )

    except WebSocketDisconnect:
        manager.disconnect(user_id, ws)
    except Exception:
        manager.disconnect(user_id, ws)
        try:
            await ws.close()
        except Exception:
            pass
