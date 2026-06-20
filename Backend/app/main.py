"""WEave backend — FastAPI app entrypoint (MASTER §6/§7).

Mounts every REST router and the WebSocket chat server, sets the consistent error
envelope, CORS, and seeds the demo DB on first boot.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import SessionLocal, init_db
from app.errors import (
    ApiError,
    api_error_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.realtime import manager
from app.routers import (
    auth,
    chats,
    comms,
    dashboard,
    employees,
    events,
    follow_ups,
    interactions,
    internal_events,
    opportunities,
    profile,
    students,
    suggestions,
    ws,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if settings.seed_on_startup:
        from app.seed import seed

        db = SessionLocal()
        try:
            seed(db)
        finally:
            db.close()
    manager.capture_loop()
    yield


app = FastAPI(
    title="WEave Backend",
    version="0.1.0",
    description="The brain of the WEave system — REST + WebSocket for all three clients.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(ApiError, api_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)


@app.get("/", tags=["health"])
def root() -> dict:
    return {"service": "weave-backend", "status": "ok", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


# ── REST routers ──────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(interactions.router)
app.include_router(profile.router)
app.include_router(suggestions.router)
app.include_router(chats.router)
# internal (employee)
app.include_router(internal_events.router)
app.include_router(employees.router)
app.include_router(dashboard.router)
app.include_router(follow_ups.router)
app.include_router(students.router)
app.include_router(comms.router)
app.include_router(opportunities.router)
# websocket
app.include_router(ws.router)
