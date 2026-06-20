"""Database engine + session management (SQLite for local, Postgres in Docker)."""
from __future__ import annotations

import uuid
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# SQLite needs check_same_thread=False to be usable from FastAPI's threadpool.
connect_args = {"check_same_thread": False} if settings.is_sqlite else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def gen_id(prefix: str = "id") -> str:
    """Stable, readable, collision-safe identifier."""
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a transactional session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Idempotent — safe to call on every boot."""
    from app import models  # noqa: F401  (register mappers)

    Base.metadata.create_all(bind=engine)
