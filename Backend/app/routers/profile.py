"""Student — Profile & settings + interest taxonomy (MASTER §6.4)."""
from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, Body, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_optional_user, require_student
from app.errors import bad_request
from app.models import InterestTag, Memory, StudentProfile, User, UserInterest
from app.security import hash_password, verify_password

router = APIRouter(prefix="/api", tags=["profile"])


@router.get("/interest-tags")
def interest_tags(db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    grouped: dict[str, list] = defaultdict(list)
    for t in db.scalars(select(InterestTag).order_by(InterestTag.category, InterestTag.name)):
        grouped[t.category].append({"id": t.id, "name": t.name})
    return [{"category": c, "tags": tags} for c, tags in grouped.items()]


@router.get("/users/me/profile")
def get_profile(db: Session = Depends(get_db), user: User = Depends(require_student)):
    prof = db.get(StudentProfile, user.id)
    tag_ids = list(db.scalars(select(UserInterest.tag_id).where(UserInterest.user_id == user.id)))
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "university": prof.university if prof else None,
        "study_degree": prof.study_degree if prof else None,
        "hometown": prof.hometown if prof else None,
        "consent_visible_to_recruiters": prof.consent_visible_to_recruiters if prof else False,
        "interest_tag_ids": tag_ids,
    }


@router.patch("/users/me/profile")
def update_profile(
    body: dict = Body(...), db: Session = Depends(get_db), user: User = Depends(require_student)
):
    prof = db.get(StudentProfile, user.id)
    if not prof:
        prof = StudentProfile(user_id=user.id)
        db.add(prof)
    for field in ("university", "study_degree", "hometown", "consent_visible_to_recruiters"):
        if field in body:
            setattr(prof, field, body[field])
    if "avatar_url" in body:
        user.avatar_url = body["avatar_url"]
    if "display_name" in body:
        user.display_name = body["display_name"]
    db.commit()
    return get_profile(db, user)


@router.put("/users/me/password")
def change_password(
    body: dict = Body(...), db: Session = Depends(get_db), user: User = Depends(require_student)
):
    if not verify_password(body.get("current_password", ""), user.password_hash):
        raise bad_request("Current password is incorrect.")
    user.password_hash = hash_password(body["new_password"])
    db.commit()
    return {"ok": True}


@router.put("/users/me/interests")
def set_interests(
    body: dict = Body(...), db: Session = Depends(get_db), user: User = Depends(require_student)
):
    db.query(UserInterest).filter(UserInterest.user_id == user.id).delete()
    for tag_id in body.get("tag_ids", []):
        db.add(UserInterest(user_id=user.id, tag_id=tag_id))
    db.commit()
    return {"ok": True, "tag_ids": body.get("tag_ids", [])}


@router.get("/users/me/memories")
def my_memories(db: Session = Depends(get_db), user: User = Depends(require_student)):
    mems = db.scalars(
        select(Memory).where(Memory.author_user_id == user.id, Memory.is_public.is_(True))
    )
    return {
        "items": [
            {"id": m.id, "event_id": m.event_id, "body": m.body, "created_at": m.created_at.isoformat()}
            for m in mems
        ]
    }
