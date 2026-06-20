"""Suggestions / requests — student (§6.5) + employee view (§6.15)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import gen_id, get_db
from app.deps import get_current_user, get_optional_user, require_employee, require_student
from app.errors import forbidden, not_found
from app.models import EventSuggestion, SuggestionVote, User
from app.schemas import SuggestionCreateRequest, SuggestionOut, SuggestionUpdateRequest, VoteRequest

router = APIRouter(tags=["suggestions"])


def _to_out(db: Session, s: EventSuggestion, viewer: User | None, include_email: bool = False) -> dict:
    votes = list(db.scalars(select(SuggestionVote).where(SuggestionVote.suggestion_id == s.id)))
    up = sum(1 for v in votes if v.value == 1)
    down = sum(1 for v in votes if v.value == -1)
    my = next((v.value for v in votes if viewer and v.user_id == viewer.id), None)
    return {
        "id": s.id,
        "title": s.title,
        "description": s.description,
        "proposer_user_id": s.proposer_user_id,
        "proposer_email": s.proposer_email if include_email else None,
        "source_event_id": s.source_event_id,
        "repost_count": s.repost_count,
        "score": up - down,
        "upvotes": up,
        "downvotes": down,
        "my_vote": my,
        "created_at": s.created_at,
    }


# ── Public / student (§6.5) ──────────────────────────────────────────────────
@router.get("/api/suggestions", response_model=list[SuggestionOut])
def list_suggestions(
    sort: str = Query("popularity"),
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    suggestions = list(db.scalars(select(EventSuggestion)))
    out = [_to_out(db, s, viewer) for s in suggestions]
    if sort == "recency":
        out.sort(key=lambda x: x["created_at"], reverse=True)
    else:
        out.sort(key=lambda x: x["score"], reverse=True)
    return out


@router.post("/api/suggestions", response_model=SuggestionOut, status_code=201)
def create_suggestion(
    body: SuggestionCreateRequest, db: Session = Depends(get_db), user: User = Depends(require_student)
):
    s = EventSuggestion(
        id=gen_id("sug"),
        title=body.title,
        description=body.description,
        proposer_user_id=user.id,
        proposer_email=user.email,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return _to_out(db, s, user)


@router.patch("/api/suggestions/{suggestion_id}", response_model=SuggestionOut)
def edit_suggestion(
    suggestion_id: str,
    body: SuggestionUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    s = db.get(EventSuggestion, suggestion_id)
    if not s:
        raise not_found("Suggestion not found.")
    if s.proposer_user_id != user.id:
        raise forbidden("Only the proposer can edit this suggestion.")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return _to_out(db, s, user)


@router.delete("/api/suggestions/{suggestion_id}", status_code=204)
def delete_suggestion(
    suggestion_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    s = db.get(EventSuggestion, suggestion_id)
    if not s:
        raise not_found("Suggestion not found.")
    if user.role != "employee" and s.proposer_user_id != user.id:
        raise forbidden("Only the proposer or an employee can delete this.")
    db.delete(s)
    db.commit()


@router.post("/api/suggestions/{suggestion_id}/vote", response_model=SuggestionOut)
def vote(
    suggestion_id: str,
    body: VoteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    s = db.get(EventSuggestion, suggestion_id)
    if not s:
        raise not_found("Suggestion not found.")
    existing = db.scalar(
        select(SuggestionVote).where(
            SuggestionVote.suggestion_id == suggestion_id, SuggestionVote.user_id == user.id
        )
    )
    if existing:
        existing.value = body.value
    else:
        db.add(
            SuggestionVote(id=gen_id("v"), suggestion_id=suggestion_id, user_id=user.id, value=body.value)
        )
    db.commit()
    return _to_out(db, s, user)


# ── Employee view (§6.15) — proposer email visible ───────────────────────────
@router.get("/internal/suggestions", response_model=list[SuggestionOut])
def internal_list(db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    suggestions = list(db.scalars(select(EventSuggestion)))
    out = [_to_out(db, s, emp, include_email=True) for s in suggestions]
    out.sort(key=lambda x: x["score"], reverse=True)
    return out


@router.delete("/internal/suggestions/{suggestion_id}", status_code=204)
def internal_delete(suggestion_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    s = db.get(EventSuggestion, suggestion_id)
    if not s:
        raise not_found("Suggestion not found.")
    db.delete(s)
    db.commit()
