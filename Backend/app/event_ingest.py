"""Ingest the scraped Würth events catalogue (mock_data/events.json) into the DB.

This is the single source of truth for the public event catalogue: once ingested,
all three clients (Student / Employee / Dashboard) read identical titles, details
and images from the backend. Past/ongoing events also get synthesised KPI source
rows (registrations, interactions, feedback, host reports) so the dashboard shows
live numbers instead of zeros (MASTER §9).

Field translation (events.json -> events table):
    id          -> "evt-j{id}"          (prefixed so it never collides with the curated seed events)
    title       -> title
    startDate   -> start_at
    endDate     -> end_at
    location    -> location (+ city = first comma-separated segment)
    department  -> target_group  (+ used to infer type)
    description -> description
    isUpcoming + dates -> status (derived from the dates relative to "now")

Type and topical image are inferred deterministically (see app.event_images), so
the same event always renders the same type/image on every platform.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.event_images import image_for, infer_type
from app.models import (
    Event,
    EventRegistration,
    EventResponsibleEmployee,
    Feedback,
    HostReport,
    Interaction,
)

_EMPLOYEE_IDS = ["emp-1", "emp-2", "emp-3"]
_STUDENT_IDS = ["stu-1", "stu-2", "stu-3", "stu-4", "stu-5"]

# Qualifying signals rotated through synthetic attendees so a realistic fraction
# become "qualified leads" (MASTER §8.2) and engagement/health vary per event.
_SIGNAL_CYCLE = [
    "file_download",
    "question_asked",
    "sample_interest",
    "project_interest",
    "career_interest",
    "file_view",
]


def _events_json_path() -> Path | None:
    """Locate mock_data/events.json from the repo root (Backend/app/.. -> repo)."""
    candidates = [
        Path(__file__).resolve().parents[2] / "mock_data" / "events.json",
        Path.cwd() / "mock_data" / "events.json",
        Path.cwd().parent / "mock_data" / "events.json",
    ]
    for p in candidates:
        if p.is_file():
            return p
    return None


def _dt(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def _status_for(start: datetime, end: datetime, now: datetime) -> str:
    if now < start:
        return "upcoming"
    if now > end:
        return "past"
    return "ongoing"


def _city_of(location: str | None) -> str | None:
    if not location:
        return None
    return location.split(",")[0].strip() or None


def _cost_for(event_type: str) -> int:
    """A plausible, type-dependent budget so cost-per-lead varies across events."""
    return {
        "hackathon": 18000,
        "trade_fair": 22000,
        "conference": 16000,
        "career_fair_booth": 9000,
        "excursion": 6000,
        "seminar": 7000,
        "webinar": 2500,
        "technical_talk": 5000,
    }.get(event_type, 8000)


def _synthesize_kpis(db: Session, event: Event, now: datetime, seed_n: int) -> None:
    """Create registrations/interactions/feedback/host-report rows for a past or
    ongoing ingested event so its KPIs are non-zero. Deterministic per event id."""
    is_past = event.status == "past"
    # 3–5 attendees, derived from a stable per-event offset.
    n_attendees = 3 + (seed_n % 3)
    attendees = [_STUDENT_IDS[(seed_n + i) % len(_STUDENT_IDS)] for i in range(n_attendees)]
    # de-dup while preserving order
    attendees = list(dict.fromkeys(attendees))

    base_ts = event.start_at if event.start_at.tzinfo else event.start_at.replace(tzinfo=timezone.utc)

    for i, uid in enumerate(attendees):
        full_session = is_past and (i % 2 == 0)
        reg_id = f"reg-{event.id}-{uid}"
        db.add(
            EventRegistration(
                id=reg_id,
                event_id=event.id,
                user_id=uid,
                email=f"{uid}@tum.de",
                source="applied",
                registered_at=base_ts,
                checked_in_at=base_ts,
                checked_out_at=base_ts if full_session else None,
            )
        )
        # check_in for everyone
        db.add(
            Interaction(
                id=f"i-{event.id}-{uid}-ci",
                event_id=event.id,
                user_id=uid,
                type="check_in",
                timestamp=base_ts,
                source="external_scan",
            )
        )
        if full_session:
            db.add(
                Interaction(
                    id=f"i-{event.id}-{uid}-fs",
                    event_id=event.id,
                    user_id=uid,
                    type="full_session",
                    timestamp=base_ts,
                    source="external_scan",
                )
            )
        # Give ~2/3 of attendees a qualifying signal so some become qualified leads.
        if i % 3 != 2:
            signal = _SIGNAL_CYCLE[(seed_n + i) % len(_SIGNAL_CYCLE)]
            db.add(
                Interaction(
                    id=f"i-{event.id}-{uid}-sig",
                    event_id=event.id,
                    user_id=uid,
                    type=signal,
                    timestamp=base_ts,
                    source="student_app",
                )
            )
        # Past events also collect recommendation feedback.
        if is_past and i < 2:
            db.add(
                Feedback(
                    id=f"fb-{event.id}-{uid}",
                    event_id=event.id,
                    user_id=uid,
                    recommendation_score=8 + (i % 2),
                    nps_score=50 + 10 * (i % 3),
                    submitted_at=base_ts,
                )
            )

    if is_past:
        # One host experience report per past event (MASTER §9).
        owner = event.owner_employee_id or _EMPLOYEE_IDS[seed_n % len(_EMPLOYEE_IDS)]
        db.add(
            HostReport(
                id=f"h-{event.id}",
                event_id=event.id,
                host_user_id=owner,
                organization_rating=4 + (seed_n % 2),
                audience_relevance_rating=4,
                interaction_quality_rating=3 + (seed_n % 3) % 2 + 1,
                repeat_recommendation="repeat" if seed_n % 3 != 0 else "improve",
                notes="Solid turnout and engaged audience. Good lead quality from the booth.",
                suggested_improvements="More hands-on demo stations next time.",
                created_at=base_ts,
            )
        )


def ingest_events_json(db: Session, *, now: datetime | None = None) -> int:
    """Insert every event from mock_data/events.json. Returns the count ingested.

    Skips entries whose target id already exists (idempotent alongside re-runs).
    Past/ongoing events get synthesised KPI rows so the dashboard is alive.
    """
    path = _events_json_path()
    if not path:
        return 0
    now = now or datetime.now(timezone.utc)
    raw = json.loads(path.read_text(encoding="utf-8"))

    count = 0
    for idx, e in enumerate(raw):
        eid = f"evt-j{e['id']}"
        if db.get(Event, eid):
            continue
        start = _dt(e["startDate"])
        end = _dt(e["endDate"])
        status = _status_for(start, end, now)
        department = (e.get("department") or "").strip() or None
        etype = infer_type(e.get("title", ""), department, e.get("location"))
        owner = _EMPLOYEE_IDS[idx % len(_EMPLOYEE_IDS)]
        cost = _cost_for(etype) if status in ("past", "ongoing") else None

        event = Event(
            id=eid,
            title=e.get("title", "Untitled event").strip(),
            type=etype,
            description=(e.get("description") or "").strip(),
            city=_city_of(e.get("location")),
            location=e.get("location"),
            start_at=start,
            end_at=end,
            target_group=department,
            goal=None,
            cost=cost,
            partner_university=None,
            owner_employee_id=owner,
            status=status,
            source="scraped",
            images=image_for(etype, department, e.get("title", "")),
            live_analytics_enabled=(status == "ongoing"),
        )
        db.add(event)
        db.flush()
        db.add(EventResponsibleEmployee(event_id=eid, employee_id=owner))

        if status in ("past", "ongoing"):
            _synthesize_kpis(db, event, now, idx)
        count += 1

    db.flush()
    return count
