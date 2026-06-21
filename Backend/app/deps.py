"""Auth dependencies + role guards (MASTER §4 roles; /internal/** requires employee)."""
from __future__ import annotations

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.db import get_db
from app.errors import forbidden, unauthorized
from app.models import User
from app.security import decode_token


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Any authenticated user (student, employee, or guest)."""
    token = _extract_token(authorization)
    if not token:
        raise unauthorized("Missing bearer token.")
    payload = decode_token(token)
    if not payload:
        raise unauthorized("Invalid or expired token.")
    user = db.get(User, payload.get("sub"))
    if not user:
        raise unauthorized("User no longer exists.")
    return user


def get_optional_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    """For `public` endpoints that personalise when a token is present."""
    token = _extract_token(authorization)
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    return db.get(User, payload.get("sub"))


def require_employee(user: User = Depends(get_current_user)) -> User:
    """Guard for all /internal/** endpoints."""
    if user.role != "employee":
        raise forbidden("This area is restricted to Würth employees.")
    return user


def require_student(user: User = Depends(get_current_user)) -> User:
    """Guard for student-only endpoints (§6.2 memories/repost, §6.3 employee
    scan, §6.4 profile, §6.5 suggestions). Guests are authenticated but role-
    limited — they can browse and check in, but cannot use these student
    surfaces (matching the contract and the app's stated guest limits)."""
    if user.role != "student":
        raise forbidden("This action requires a student account.")
    return user
