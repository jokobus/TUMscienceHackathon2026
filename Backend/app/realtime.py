"""WebSocket connection manager + cross-thread delivery bridge (MASTER §7).

REST handlers run in a threadpool (sync); the WS server runs on the event loop.
`notify_threadsafe` lets a sync REST handler (e.g. broadcast, message send)
push a frame to connected sockets via the captured loop.
"""
from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._active: dict[str, set[WebSocket]] = defaultdict(set)
        self._loop: asyncio.AbstractEventLoop | None = None

    def capture_loop(self) -> None:
        try:
            self._loop = asyncio.get_running_loop()
        except RuntimeError:
            self._loop = None

    async def connect(self, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._active[user_id].add(ws)

    def disconnect(self, user_id: str, ws: WebSocket) -> None:
        conns = self._active.get(user_id)
        if conns:
            conns.discard(ws)
            if not conns:
                self._active.pop(user_id, None)

    def is_online(self, user_id: str) -> bool:
        return bool(self._active.get(user_id))

    async def send_to_users(self, user_ids: list[str], payload: dict[str, Any]) -> None:
        for uid in set(user_ids):
            for ws in list(self._active.get(uid, set())):
                try:
                    await ws.send_json(payload)
                except Exception:
                    self.disconnect(uid, ws)

    def notify_threadsafe(self, user_ids: list[str], payload: dict[str, Any]) -> None:
        """Schedule delivery from a sync (REST) context."""
        if not self._loop:
            return
        asyncio.run_coroutine_threadsafe(self.send_to_users(user_ids, payload), self._loop)


manager = ConnectionManager()
