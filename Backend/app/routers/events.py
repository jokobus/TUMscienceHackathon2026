"""Public / student — Events & feed (MASTER §6.2). Also applications + feedback."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai import search_events
from app.db import gen_id, get_db
from app.deps import get_current_user, get_optional_user, require_student
from app.errors import bad_request, not_found
from app.models import (
    Application,
    ApplicationAnswer,
    ApplicationQuestion,
    Event,
    EventRegistration,
    EventSuggestion,
    Feedback,
    Material,
    Memory,
    MemoryImage,
    SuggestionVote,
    User,
)
from app.scoring import recompute_and_cache

router = APIRouter(prefix="/api/events", tags=["events"])


def _public_event(event: Event) -> dict:
    return {
        "id": event.id,
        "title": event.title,
        "type": event.type,
        "description": event.description,
        "city": event.city,
        "location": event.location,
        "start_at": event.start_at.isoformat(),
        "end_at": event.end_at.isoformat(),
        "status": event.status,
        "target_group": event.target_group,
        "goal": event.goal,
        "partner_university": event.partner_university,
        "images": event.images or [],
        "application_required": event.application_required,
        "application_open_at": event.application_open_at.isoformat() if event.application_open_at else None,
        "application_close_at": event.application_close_at.isoformat() if event.application_close_at else None,
        "files_after_event": event.files_after_event,
    }


@router.get("")
def feed(
    type: str | None = Query(None),
    city: str | None = Query(None),
    timeframe: str | None = Query(None),
    sort: str = Query("date"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _: User | None = Depends(get_optional_user),
):
    stmt = select(Event).where(Event.status != "draft")
    if type:
        stmt = stmt.where(Event.type == type)
    if city:
        stmt = stmt.where(Event.city == city)
    now = datetime.now(timezone.utc)
    events = list(db.scalars(stmt))
    if timeframe == "future":
        events = [e for e in events if _aware(e.end_at) >= now]
    elif timeframe == "past":
        events = [e for e in events if _aware(e.end_at) < now]
    events.sort(key=lambda e: e.start_at, reverse=(sort == "recency"))
    return {"items": [_public_event(e) for e in events[:limit]], "next_cursor": None}


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


@router.get("/search")
def search(q: str = Query(""), db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    return {"items": [_public_event(e) for e in search_events(db, q)], "next_cursor": None}


@router.get("/current")
def current_event(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    regs = db.scalars(select(EventRegistration).where(EventRegistration.user_id == user.id))
    for r in regs:
        event = db.get(Event, r.event_id)
        if not event:
            continue
        start = _aware(event.start_at) - timedelta(hours=2)
        end = _aware(event.end_at) + timedelta(hours=2)
        if start <= now <= end:
            return _public_event(event)
    return None


@router.get("/{event_id}")
def event_detail(event_id: str, db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    event = db.get(Event, event_id)
    if not event:
        raise not_found("Event not found.")
    return _public_event(event)


@router.get("/{event_id}/files")
def event_files(event_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    event = db.get(Event, event_id)
    if not event:
        raise not_found("Event not found.")
    if event.files_after_event and _aware(event.end_at) > datetime.now(timezone.utc):
        return {"items": [], "hidden_reason": "Files will be provided after the event."}
    mats = db.scalars(select(Material).where(Material.event_id == event_id))
    return {
        "items": [
            {
                "id": m.id,
                "event_id": m.event_id,
                "type": m.type,
                "title": m.title,
                "url": m.url,
                "upload_date": m.upload_date.isoformat(),
            }
            for m in mats
        ],
        "hidden_reason": None,
    }


# ── Memories ──────────────────────────────────────────────────────────────────
@router.get("/{event_id}/memories")
def list_memories(event_id: str, db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    mems = db.scalars(select(Memory).where(Memory.event_id == event_id).order_by(Memory.created_at))
    out = []
    for m in mems:
        author = db.get(User, m.author_user_id)
        images = list(db.scalars(select(MemoryImage.image_url).where(MemoryImage.memory_id == m.id)))
        out.append(
            {
                "id": m.id,
                "event_id": m.event_id,
                "author_user_id": m.author_user_id,
                "author_name": author.display_name if author else None,
                "parent_id": m.parent_id,
                "body": m.body,
                "images": images,
                "created_at": m.created_at.isoformat(),
            }
        )
    return {"items": out, "next_cursor": None}


@router.post("/{event_id}/memories", status_code=201)
def post_memory(
    event_id: str,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    if not db.get(Event, event_id):
        raise not_found("Event not found.")
    mem = Memory(
        id=gen_id("mem"),
        event_id=event_id,
        author_user_id=user.id,
        parent_id=body.get("parent_id"),
        body=body.get("body", ""),
    )
    db.add(mem)
    db.flush()
    for url in body.get("images", []) or []:
        db.add(MemoryImage(id=gen_id("img"), memory_id=mem.id, image_url=url))
    db.add(_interaction(event_id, user.id, "memory_post"))
    db.commit()
    recompute_and_cache(db, user.id, event_id)
    db.commit()
    return {"id": mem.id}


@router.post("/{event_id}/repost", status_code=201)
def repost(event_id: str, db: Session = Depends(get_db), user: User = Depends(require_student)):
    event = db.get(Event, event_id)
    if not event:
        raise not_found("Event not found.")
    suggestion = db.scalar(select(EventSuggestion).where(EventSuggestion.source_event_id == event_id))
    if suggestion:
        suggestion.repost_count += 1
    else:
        suggestion = EventSuggestion(
            id=gen_id("sug"),
            title=f"Repeat: {event.title}",
            description=event.description or "",
            proposer_user_id=user.id,
            proposer_email=user.email,
            source_event_id=event_id,
            repost_count=1,
        )
        db.add(suggestion)
        db.flush()
    # add an upvote from the reposter (upsert)
    existing = db.scalar(
        select(SuggestionVote).where(
            SuggestionVote.suggestion_id == suggestion.id, SuggestionVote.user_id == user.id
        )
    )
    if not existing:
        db.add(SuggestionVote(id=gen_id("v"), suggestion_id=suggestion.id, user_id=user.id, value=1))
    db.add(_interaction(event_id, user.id, "repost"))
    db.commit()
    return {"suggestion_id": suggestion.id, "repost_count": suggestion.repost_count}


# ── Applications ──────────────────────────────────────────────────────────────
@router.get("/{event_id}/application")
def get_application(event_id: str, db: Session = Depends(get_db), _: User | None = Depends(get_optional_user)):
    event = db.get(Event, event_id)
    if not event:
        raise not_found("Event not found.")
    questions = db.scalars(
        select(ApplicationQuestion)
        .where(ApplicationQuestion.event_id == event_id)
        .order_by(ApplicationQuestion.position)
    )
    return {
        "required": event.application_required,
        "open_at": event.application_open_at.isoformat() if event.application_open_at else None,
        "close_at": event.application_close_at.isoformat() if event.application_close_at else None,
        "questions": [{"id": q.id, "question_text": q.question_text, "position": q.position} for q in questions],
    }


@router.post("/{event_id}/application", status_code=201)
def submit_application(
    event_id: str,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.get(Event, event_id):
        raise not_found("Event not found.")
    app_row = Application(
        id=gen_id("app"),
        event_id=event_id,
        applicant_user_id=user.id,
        applicant_email=body.get("email", user.email),
        status="submitted",
    )
    db.add(app_row)
    db.flush()
    for ans in body.get("answers", []) or []:
        db.add(
            ApplicationAnswer(
                id=gen_id("ans"),
                application_id=app_row.id,
                question_id=ans.get("question_id"),
                answer_text=ans.get("answer_text", ""),
            )
        )
    db.add(_interaction(event_id, user.id, "application_submitted"))
    db.commit()
    recompute_and_cache(db, user.id, event_id)
    db.commit()
    return {"id": app_row.id, "status": app_row.status}


@router.post("/{event_id}/feedback", status_code=201)
def submit_feedback(
    event_id: str,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.get(Event, event_id):
        raise not_found("Event not found.")
    fb = Feedback(
        id=gen_id("fb"),
        event_id=event_id,
        user_id=user.id,
        recommendation_score=int(body.get("recommendation_score", 0)),
        nps_score=body.get("nps_score"),
        text=body.get("text"),
    )
    db.add(fb)
    db.add(_interaction(event_id, user.id, "recommendation_submitted"))
    db.commit()
    recompute_and_cache(db, user.id, event_id)
    db.commit()
    return {"id": fb.id}


def _interaction(event_id: str, user_id: str, itype: str):
    from app.models import Interaction

    return Interaction(
        id=gen_id("i"), event_id=event_id, user_id=user_id, type=itype, source="student_app"
    )
