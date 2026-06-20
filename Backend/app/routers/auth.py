"""Auth — shared by all clients (MASTER §6.1)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import gen_id, get_db
from app.deps import get_current_user
from app.errors import conflict, unauthorized
from app.models import EmployeeProfile, StudentProfile, User
from app.schemas import AuthResponse, GuestRequest, LoginRequest, SignupRequest
from app.security import create_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_payload(db: Session, user: User) -> dict:
    base = {
        "id": user.id,
        "role": user.role,
        "email": user.email,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
    }
    if user.role == "employee":
        prof = db.get(EmployeeProfile, user.id)
        if prof:
            base.update(
                {
                    "first_name": prof.first_name,
                    "surname": prof.surname,
                    "seniority": prof.seniority,
                    "branch_office": prof.branch_office,
                }
            )
    return base


@router.post("/signup", response_model=AuthResponse)
def signup(body: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = body.email.strip().lower()
    if db.scalar(select(User).where(User.email == email)):
        raise conflict("An account with that email already exists.")
    user = User(
        id=gen_id(body.role[:3]),
        role=body.role,
        email=email,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
    )
    db.add(user)
    db.flush()  # ensure the user row exists before its profile (FK on Postgres)
    if body.role == "student":
        db.add(StudentProfile(user_id=user.id))
    else:
        names = body.display_name.split(" ", 1)
        db.add(
            EmployeeProfile(
                user_id=user.id,
                first_name=names[0],
                surname=names[1] if len(names) > 1 else "",
            )
        )
    db.commit()
    return AuthResponse(token=create_token(user.id, user.role), user=_user_payload(db, user))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = body.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(body.password, user.password_hash):
        raise unauthorized("Invalid email or password.")
    return AuthResponse(token=create_token(user.id, user.role), user=_user_payload(db, user))


@router.post("/guest", response_model=AuthResponse)
def guest(body: GuestRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = body.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(
            id=gen_id("gst"),
            role="guest",
            email=email,
            display_name=body.display_name or email.split("@")[0],
        )
        db.add(user)
        db.commit()
    return AuthResponse(token=create_token(user.id, user.role), user=_user_payload(db, user))


@router.get("/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return _user_payload(db, user)


@router.post("/logout")
def logout(user: User = Depends(get_current_user)) -> dict:
    # Stateless JWT: client discards the token. Endpoint kept for contract parity.
    return {"ok": True}
