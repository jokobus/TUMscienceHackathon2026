"""Internal — Events, applications, materials, QR/scan, host/live/notes/broadcast.

MASTER §6.8–§6.12. All endpoints require role `employee`.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Body, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import gen_id, get_db
from app.deps import require_employee
from app.enums import ApplicationStatus
from app.errors import bad_request, not_found, unprocessable
from app.kpis import compute_event_kpis
from app.messaging import get_or_create_event_channel, post_message
from app.models import (
    Application,
    ApplicationAnswer,
    ApplicationQuestion,
    Chat,
    ChatParticipant,
    Event,
    EventNote,
    EventRegistration,
    EventResponsibleEmployee,
    EventSentiment,
    HostReport,
    Interaction,
    Material,
    QrToken,
    User,
)
from app.recommend import next_best_steps_for_event, predict_event
from app.schemas import (
    AttendeeOut,
    EventCreateRequest,
    EventDetailOut,
    EventKpisOut,
    EventNoteOut,
    EventSentimentOut,
    EventSummaryOut,
    EventUpdateRequest,
    HostReportCreateRequest,
    HostReportOut,
    InteractionOut,
    LiveAnalyticsOut,
    MaterialCreateRequest,
    MaterialOut,
    NoteCreateRequest,
    QrTokenOut,
    ScanStudentResponse,
    SentimentCreateRequest,
)
from app.schemas import iso_z
from app.scoring import recompute_and_cache
from app.services import build_attendees, build_event_detail, build_event_summary

router = APIRouter(prefix="/internal", tags=["internal-events"])


def _get_event(db: Session, event_id: str) -> Event:
    event = db.get(Event, event_id)
    if not event:
        raise not_found("Event not found.")
    return event


# ── Events overview / CRUD (§6.8) ─────────────────────────────────────────────
@router.get("/events", response_model=list[EventSummaryOut])
def list_events(db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    events = db.scalars(select(Event).order_by(Event.start_at.desc()))
    return [build_event_summary(db, e, emp.id) for e in events]


@router.post("/events", response_model=EventDetailOut, status_code=201)
def create_event(
    body: EventCreateRequest, db: Session = Depends(get_db), emp: User = Depends(require_employee)
):
    event = Event(
        id=gen_id("evt"),
        title=body.title,
        type=body.type,
        description=body.description,
        city=body.city,
        location=body.location,
        start_at=body.start_at,
        end_at=body.end_at,
        target_group=body.target_group,
        goal=body.goal,
        cost=body.cost,
        human_capital=body.human_capital,
        partner_university=body.partner_university,
        owner_employee_id=emp.id,
        status=body.status,
        application_required=body.application_required,
        files_after_event=body.files_after_event,
        images=body.images,
        live_analytics_enabled=body.live_analytics_enabled,
        source="manual",
    )
    db.add(event)
    db.flush()
    resp_ids = set(body.responsible_employee_ids) | {emp.id}
    for eid in resp_ids:
        db.add(EventResponsibleEmployee(event_id=event.id, employee_id=eid))
    db.commit()
    return build_event_detail(db, event, emp.id)


@router.get("/events/{event_id}", response_model=EventDetailOut)
def get_event(event_id: str, db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    return build_event_detail(db, _get_event(db, event_id), emp.id)


@router.patch("/events/{event_id}", response_model=EventDetailOut)
def update_event(
    event_id: str,
    body: EventUpdateRequest,
    db: Session = Depends(get_db),
    emp: User = Depends(require_employee),
):
    event = _get_event(db, event_id)
    data = body.model_dump(exclude_unset=True)
    resp = data.pop("responsible_employee_ids", None)
    for k, v in data.items():
        setattr(event, k, v)
    if resp is not None:
        db.query(EventResponsibleEmployee).filter(
            EventResponsibleEmployee.event_id == event_id
        ).delete()
        for eid in set(resp):
            db.add(EventResponsibleEmployee(event_id=event_id, employee_id=eid))
    db.commit()
    return build_event_detail(db, event, emp.id)


@router.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: str, db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    event = _get_event(db, event_id)
    db.delete(event)
    db.commit()


@router.get("/events/{event_id}/kpis", response_model=EventKpisOut)
def event_kpis(event_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    _get_event(db, event_id)
    return compute_event_kpis(db, event_id)


@router.get("/events/{event_id}/attendees", response_model=list[AttendeeOut])
def event_attendees(event_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    _get_event(db, event_id)
    return build_attendees(db, event_id)


@router.get("/events/{event_id}/interactions", response_model=list[InteractionOut])
def event_interactions(event_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    _get_event(db, event_id)
    rows = db.scalars(
        select(Interaction).where(Interaction.event_id == event_id).order_by(Interaction.timestamp.desc())
    )
    out = []
    for i in rows:
        u = db.get(User, i.user_id) if i.user_id else None
        out.append(
            {
                "id": i.id,
                "event_id": i.event_id,
                "user_id": i.user_id,
                "user_name": u.display_name if u else None,
                "type": i.type,
                "timestamp": i.timestamp,
            }
        )
    return out


@router.get("/events/{event_id}/next-best-steps")
def next_best_steps(event_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    _get_event(db, event_id)
    return next_best_steps_for_event(db, event_id)


@router.get("/events/{event_id}/prediction")
def prediction(event_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return predict_event(db, _get_event(db, event_id))


# ── Applications config (§6.9) ────────────────────────────────────────────────
@router.put("/events/{event_id}/application-questions")
def set_application_questions(
    event_id: str,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    event = _get_event(db, event_id)
    db.query(ApplicationQuestion).filter(ApplicationQuestion.event_id == event_id).delete()
    for pos, q in enumerate(body.get("questions", [])):
        text = q if isinstance(q, str) else q.get("question_text", "")
        db.add(ApplicationQuestion(id=gen_id("aq"), event_id=event_id, question_text=text, position=pos))
    event.application_required = True
    if body.get("application_open_at"):
        event.application_open_at = datetime.fromisoformat(body["application_open_at"].replace("Z", "+00:00"))
    if body.get("application_close_at"):
        event.application_close_at = datetime.fromisoformat(body["application_close_at"].replace("Z", "+00:00"))
    db.commit()
    return {"ok": True}


@router.get("/events/{event_id}/applications")
def list_applications(event_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    _get_event(db, event_id)
    apps = db.scalars(select(Application).where(Application.event_id == event_id))
    out = []
    for a in apps:
        answers = db.scalars(select(ApplicationAnswer).where(ApplicationAnswer.application_id == a.id))
        out.append(
            {
                "id": a.id,
                "event_id": a.event_id,
                "applicant_user_id": a.applicant_user_id,
                "applicant_email": a.applicant_email,
                "status": a.status,
                "submitted_at": iso_z(a.submitted_at),
                "answers": [{"question_id": an.question_id, "answer_text": an.answer_text} for an in answers],
            }
        )
    return out


@router.patch("/applications/{application_id}")
def update_application(
    application_id: str,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    app_row = db.get(Application, application_id)
    if not app_row:
        raise not_found("Application not found.")
    if "status" in body:
        valid = {s.value for s in ApplicationStatus}
        if body["status"] not in valid:
            raise unprocessable(
                f"Invalid application_status '{body['status']}'. Allowed: {sorted(valid)}."
            )
        app_row.status = body["status"]
        # Accepting an applicant must make them a real attendee: register them and
        # add them to the event channel, so they appear in attendee lists/KPIs and
        # — crucially — receive broadcasts (recipients_for_chat keys off these).
        if body["status"] == ApplicationStatus.accepted:
            _admit_applicant(db, app_row)
    db.commit()
    return {"id": app_row.id, "status": app_row.status}


def _admit_applicant(db: Session, app_row: Application) -> None:
    """Idempotently register an accepted applicant + add them to the event channel."""
    if not app_row.applicant_user_id:
        # Guest applicant — register by email only; no channel participant possible.
        existing = db.scalar(
            select(EventRegistration).where(
                EventRegistration.event_id == app_row.event_id,
                EventRegistration.email == app_row.applicant_email,
                EventRegistration.user_id.is_(None),
            )
        )
        if not existing:
            db.add(EventRegistration(
                id=gen_id("reg"), event_id=app_row.event_id, user_id=None,
                email=app_row.applicant_email, source="applied",
            ))
        return

    existing = db.scalar(
        select(EventRegistration).where(
            EventRegistration.event_id == app_row.event_id,
            EventRegistration.user_id == app_row.applicant_user_id,
        )
    )
    if not existing:
        db.add(EventRegistration(
            id=gen_id("reg"), event_id=app_row.event_id, user_id=app_row.applicant_user_id,
            email=app_row.applicant_email, source="applied",
        ))
    channel = get_or_create_event_channel(db, app_row.event_id)
    db.flush()
    member = db.scalar(
        select(ChatParticipant).where(
            ChatParticipant.chat_id == channel.id,
            ChatParticipant.user_id == app_row.applicant_user_id,
        )
    )
    if not member:
        db.add(ChatParticipant(chat_id=channel.id, user_id=app_row.applicant_user_id))
    recompute_and_cache(db, app_row.applicant_user_id, app_row.event_id)


# ── Materials (§6.10) ─────────────────────────────────────────────────────────
@router.get("/events/{event_id}/materials", response_model=list[MaterialOut])
def list_materials(event_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    _get_event(db, event_id)
    return list(db.scalars(select(Material).where(Material.event_id == event_id)))


# Map a filename extension to a §5.1 material_type for uploaded files.
_EXT_TO_MATERIAL_TYPE = {
    "pdf": "pdf",
    "ppt": "slides", "pptx": "slides", "key": "slides",
    "png": "image", "jpg": "image", "jpeg": "image", "gif": "image", "webp": "image", "svg": "image",
    "doc": "project_doc", "docx": "project_doc",
}


def _guess_material_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return _EXT_TO_MATERIAL_TYPE.get(ext, "follow_up_resource")


@router.post("/events/{event_id}/materials", response_model=MaterialOut, status_code=201)
async def add_material(
    event_id: str,
    request: Request,
    db: Session = Depends(get_db),
    emp: User = Depends(require_employee),
):
    """Upload a material (§6.10). Accepts `multipart/form-data` with an optional
    `file` (plus `title`/`type`/`url` form fields) **or** a JSON `{title, type, url}`
    link reference — so both real file upload and link-only references work."""
    _get_event(db, event_id)
    content_type = request.headers.get("content-type", "")
    title = mtype = url = None

    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        title = (form.get("title") or "").strip() or None
        mtype = (form.get("type") or "").strip() or None
        url = (form.get("url") or "").strip() or None
        upload = form.get("file")
        filename = getattr(upload, "filename", None)
        if filename:
            # Demo backend has no object storage — persist a reference URL, not bytes.
            url = url or f"upload://{filename}"
            title = title or filename
            mtype = mtype or _guess_material_type(filename)
    else:
        data = await request.json()
        title = data.get("title")
        mtype = data.get("type")
        url = data.get("url")

    if not title or not mtype:
        raise bad_request("Material requires a title and a type (or an uploaded file).")

    mat = Material(
        id=gen_id("m"),
        event_id=event_id,
        type=mtype,
        title=title,
        url=url or "#",
        uploaded_by=emp.id,
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat


@router.delete("/materials/{material_id}", status_code=204)
def delete_material(material_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    mat = db.get(Material, material_id)
    if not mat:
        raise not_found("Material not found.")
    db.delete(mat)
    db.commit()


# ── QR & scan (§6.11) ─────────────────────────────────────────────────────────
def _make_qr(db: Session, event_id: str, kind: str, emp_id: str) -> QrToken:
    token_value = f"weave://e/{event_id}/{kind}/{gen_id('t')}"
    qr = QrToken(
        id=gen_id("qr"),
        event_id=event_id,
        kind=kind,
        token=token_value,
        created_by=emp_id,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=4),
    )
    db.add(qr)
    db.commit()
    db.refresh(qr)
    return qr


@router.post("/events/{event_id}/qr/check-in", response_model=QrTokenOut)
def qr_check_in(event_id: str, db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    _get_event(db, event_id)
    return _make_qr(db, event_id, "check_in", emp.id)


@router.post("/events/{event_id}/qr/check-out", response_model=QrTokenOut)
def qr_check_out(event_id: str, db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    _get_event(db, event_id)
    return _make_qr(db, event_id, "check_out", emp.id)


@router.post("/scan/student/{student_user_id}", response_model=ScanStudentResponse)
def scan_student(
    student_user_id: str, db: Session = Depends(get_db), emp: User = Depends(require_employee)
):
    student = db.get(User, student_user_id)
    if not student or student.role not in ("student", "guest"):
        raise not_found("Student not found.")

    # connection interaction + score recompute
    db.add(
        Interaction(
            id=gen_id("i"),
            user_id=student.id,
            type="connection",
            source="employee_app",
        )
    )
    db.flush()
    recompute_and_cache(db, student.id)

    # find/create a DM between employee and student
    existing = None
    for chat in db.scalars(select(Chat).where(Chat.type == "dm")):
        members = set(
            db.scalars(select(ChatParticipant.user_id).where(ChatParticipant.chat_id == chat.id))
        )
        if {emp.id, student.id} <= members:
            existing = chat
            break
    if existing:
        db.commit()
        return ScanStudentResponse(chat_id=existing.id, student_name=student.display_name)

    chat = Chat(id=gen_id("dm"), type="dm", title=student.display_name)
    db.add(chat)
    db.flush()
    db.add(ChatParticipant(chat_id=chat.id, user_id=emp.id))
    db.add(ChatParticipant(chat_id=chat.id, user_id=student.id))
    db.commit()
    return ScanStudentResponse(chat_id=chat.id, student_name=student.display_name)


# ── Host report / live / notes / broadcast (§6.12) ────────────────────────────
@router.get("/events/{event_id}/host-report", response_model=HostReportOut | None)
def get_host_report(event_id: str, db: Session = Depends(get_db), emp: User = Depends(require_employee)):
    _get_event(db, event_id)
    return db.scalar(
        select(HostReport).where(HostReport.event_id == event_id, HostReport.host_user_id == emp.id)
    )


@router.post("/events/{event_id}/host-report", response_model=HostReportOut, status_code=201)
def submit_host_report(
    event_id: str,
    body: HostReportCreateRequest,
    db: Session = Depends(get_db),
    emp: User = Depends(require_employee),
):
    _get_event(db, event_id)
    db.query(HostReport).filter(
        HostReport.event_id == event_id, HostReport.host_user_id == emp.id
    ).delete()
    report = HostReport(
        id=gen_id("h"),
        event_id=event_id,
        host_user_id=emp.id,
        organization_rating=body.organization_rating,
        audience_relevance_rating=body.audience_relevance_rating,
        interaction_quality_rating=body.interaction_quality_rating,
        repeat_recommendation=body.repeat_recommendation,
        notes=body.notes,
        suggested_improvements=body.suggested_improvements,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/events/{event_id}/notes", response_model=list[EventNoteOut])
def list_notes(event_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    _get_event(db, event_id)
    return list(
        db.scalars(
            select(EventNote).where(EventNote.event_id == event_id).order_by(EventNote.created_at.desc())
        )
    )


@router.post("/events/{event_id}/notes", response_model=EventNoteOut, status_code=201)
def add_note(
    event_id: str,
    body: NoteCreateRequest,
    db: Session = Depends(get_db),
    emp: User = Depends(require_employee),
):
    _get_event(db, event_id)
    note = EventNote(id=gen_id("n"), event_id=event_id, author_employee_id=emp.id, body=body.body)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/events/{event_id}/sentiment", response_model=list[EventSentimentOut])
def list_sentiment(event_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    _get_event(db, event_id)
    return list(
        db.scalars(
            select(EventSentiment)
            .where(EventSentiment.event_id == event_id)
            .order_by(EventSentiment.created_at.desc())
        )
    )


@router.post("/events/{event_id}/sentiment", response_model=EventSentimentOut, status_code=201)
def add_sentiment(
    event_id: str,
    body: SentimentCreateRequest,
    db: Session = Depends(get_db),
    emp: User = Depends(require_employee),
):
    _get_event(db, event_id)
    entry = EventSentiment(
        id=gen_id("s"),
        event_id=event_id,
        author_employee_id=emp.id,
        description=body.description,
        sentiment_value=body.sentiment_value,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/events/{event_id}/live-analytics", response_model=LiveAnalyticsOut)
def live_analytics(event_id: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    event = _get_event(db, event_id)
    recent = list(
        db.scalars(
            select(EventSentiment)
            .where(EventSentiment.event_id == event_id)
            .order_by(EventSentiment.created_at.desc())
        )
    )
    values = [s.sentiment_value or 0 for s in recent]
    avg = sum(values) / len(values) if values else 0.0
    mood = (
        "energised" if avg > 0.6 else
        "engaged" if avg > 0.3 else
        "neutral" if avg > -0.1 else
        "flat" if avg > -0.4 else
        "tense"
    )
    return LiveAnalyticsOut(
        enabled=event.live_analytics_enabled,
        average_sentiment=round(avg, 2),
        sample_count=len(recent),
        recent=[EventSentimentOut.model_validate(s) for s in recent[:5]],
        mood=mood,
    )


@router.post("/events/{event_id}/broadcast")
def broadcast(
    event_id: str,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    emp: User = Depends(require_employee),
):
    _get_event(db, event_id)
    text = (body.get("body") or "").strip()
    if not text:
        raise bad_request("Broadcast message cannot be empty.")
    channel = get_or_create_event_channel(db, event_id)
    db.flush()
    # Ensure every attendee (registered users + responsible employees + sender) is a
    # participant of the channel, so the broadcast reaches everyone and the channel
    # appears in their chat list — even if they haven't opened it before.
    existing = set(
        db.scalars(select(ChatParticipant.user_id).where(ChatParticipant.chat_id == channel.id))
    )
    member_ids = set(
        uid for uid in db.scalars(
            select(EventRegistration.user_id).where(EventRegistration.event_id == event_id)
        ) if uid
    )
    member_ids |= set(
        db.scalars(
            select(EventResponsibleEmployee.employee_id).where(
                EventResponsibleEmployee.event_id == event_id
            )
        )
    )
    member_ids.add(emp.id)
    for uid in member_ids - existing:
        db.add(ChatParticipant(chat_id=channel.id, user_id=uid))
    db.commit()
    message = post_message(
        db, channel.id, emp.id, text, is_broadcast=True, client_msg_id=body.get("clientMsgId")
    )
    return message
