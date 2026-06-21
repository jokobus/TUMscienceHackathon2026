"""Recommendations & predictions (MASTER §6.7/§6.8/§6.14/§6.17).

Heuristic, database-grounded. Each result carries a human-readable `reason`.
"""
from __future__ import annotations

from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import gen_id
from app.enums import PredictionOutcome
from app.kpis import compute_event_kpis
from app.models import Event, FollowUp, Interaction, Material, StudentProfile, User
from app.scoring import compute_user_score, is_qualified_lead


# ── Next Best Steps for one event ────────────────────────────────────────────
def next_best_steps_for_event(db: Session, event_id: str) -> list[dict]:
    """Contextual next-best-steps. Each step carries a `kind` so the UI can render
    the right action: `contact` opens a chat to the lead; `upload_slides` opens a
    material upload (DASH-18)."""
    steps: list[dict] = []
    event = db.get(Event, event_id)
    ix = db.scalars(select(Interaction).where(Interaction.event_id == event_id))
    by_user: dict[str, list[Interaction]] = defaultdict(list)
    for i in ix:
        if i.user_id:
            by_user[i.user_id].append(i)

    followed_up = set(
        db.scalars(select(FollowUp.contact_user_id).where(FollowUp.event_id == event_id))
    )

    for uid, items in by_user.items():
        if is_qualified_lead(items) and uid not in followed_up:
            user = db.get(User, uid)
            score = compute_user_score(db, uid, event_id)
            steps.append(
                {
                    "kind": "contact",
                    "contact_user_id": uid,
                    "contact_name": user.display_name if user else uid,
                    "recommended_action": f"Message {user.display_name if user else 'this lead'} — qualified lead with no next step.",
                    "urgency": "high" if score >= 25 else "medium",
                    "confidence": min(0.95, 0.5 + score / 100),
                    "reason": f"Engagement score {score} with no follow-up assigned yet.",
                }
            )

    # Past events without slides on the File Drive: suggest uploading them so
    # attendees can review the material (a contextual, non-contact follow-up).
    if event and event.status == "past":
        has_slides = db.scalar(
            select(Material.id).where(Material.event_id == event_id, Material.type == "slides").limit(1)
        )
        if not has_slides:
            steps.append(
                {
                    "kind": "upload_slides",
                    "contact_user_id": None,
                    "contact_name": None,
                    "recommended_action": "Upload the event slides so attendees can review them.",
                    "urgency": "medium",
                    "confidence": 0.6,
                    "reason": "This past event has no slide deck on the File Drive yet.",
                }
            )

    steps.sort(key=lambda s: (s["urgency"] != "high", -s["confidence"]))
    return steps


# ── Flop detection / confidence prediction for planned events ────────────────
def predict_event(db: Session, event: Event) -> dict:
    past = list(
        db.scalars(
            select(Event).where(Event.type == event.type, Event.status == "past")
        )
    )
    if not past:
        return {
            "outcome": PredictionOutcome.insufficient_data,
            "reason": "No comparable past events of this type to learn from.",
            "confidence": 0.3,
        }

    kpi_list = [compute_event_kpis(db, e.id) for e in past]
    avg_qual = sum(k["qualified_leads"] for k in kpi_list) / len(kpi_list)
    avg_rec = sum(k["recommendation_score"] for k in kpi_list) / len(kpi_list)
    avg_checkin = sum(k["check_in_rate"] for k in kpi_list) / len(kpi_list)

    if avg_rec >= 8 and avg_qual >= 15:
        outcome = PredictionOutcome.high_confidence_success
        conf = 0.85
    elif avg_qual >= 10:
        outcome = PredictionOutcome.relationship_potential
        conf = 0.7
    elif avg_checkin < 0.6:
        outcome = PredictionOutcome.risk_low_engagement
        conf = 0.6
    elif avg_rec < 6:
        outcome = PredictionOutcome.likely_underperforming
        conf = 0.55
    else:
        outcome = PredictionOutcome.promising_uncertain
        conf = 0.5

    reason = (
        f"Based on {len(past)} past {event.type} event(s): "
        f"avg {avg_qual:.0f} qualified leads, {avg_rec:.1f}/10 recommendation, "
        f"{avg_checkin * 100:.0f}% check-in rate."
    )
    return {"outcome": outcome, "reason": reason, "confidence": round(conf, 2)}


# ── Next Best Events (gap analysis) ──────────────────────────────────────────
def next_best_events(db: Session) -> list[dict]:
    past = list(db.scalars(select(Event).where(Event.status == "past")))
    by_type_scores: dict[str, list[float]] = defaultdict(list)
    for e in past:
        k = compute_event_kpis(db, e.id)
        by_type_scores[e.type].append(k["qualified_leads"] + k["recommendation_score"])

    ranked = sorted(
        ((t, sum(v) / len(v)) for t, v in by_type_scores.items()),
        key=lambda x: x[1],
        reverse=True,
    )
    out: list[dict] = []
    for etype, score in ranked[:3]:
        out.append(
            {
                "id": gen_id("nbe"),
                "title": f"Repeat a {etype.replace('_', ' ')} format",
                "detail": f"Your best-performing past {etype.replace('_', ' ')} events drove strong leads.",
                "reason": f"Avg combined lead+recommendation score {score:.1f} across past {etype} events.",
                "category": "repeat_format",
            }
        )
    return out


# ── Opportunity Explorer (untapped universities / formats) ───────────────────
def opportunities(db: Session) -> list[dict]:
    out: list[dict] = []

    # Universities present among students vs. partner universities engaged
    student_unis = {
        p.university
        for p in db.scalars(select(StudentProfile))
        if p.university
    }
    engaged_unis = {e.partner_university for e in db.scalars(select(Event)) if e.partner_university}
    untapped = student_unis - engaged_unis
    for uni in sorted(untapped):
        out.append(
            {
                "id": gen_id("opp"),
                "title": f"Engage {uni}",
                "detail": f"Students from {uni} are in your network but you have no partner event there.",
                "reason": f"{uni} appears in student profiles but not as a partner university on any event.",
                "category": "untapped_university",
            }
        )

    out.extend(next_best_events(db))
    return out


# ── Priority queue ───────────────────────────────────────────────────────────
def priority_queue(db: Session) -> list[dict]:
    students = list(db.scalars(select(User).where(User.role == "student")))
    items: list[dict] = []
    for s in students:
        ix = list(db.scalars(select(Interaction).where(Interaction.user_id == s.id)))
        if not ix:
            continue
        score = compute_user_score(db, s.id)
        open_fu = db.scalar(
            select(FollowUp.id).where(
                FollowUp.contact_user_id == s.id, FollowUp.status.in_(("open", "in_progress"))
            ).limit(1)
        )
        if is_qualified_lead(ix) and not open_fu:
            action = "Assign a follow-up — qualified lead, none open."
            urgency = "high" if score >= 25 else "medium"
        elif open_fu:
            action = "Progress the open follow-up."
            urgency = "medium"
        else:
            action = "Nurture — keep on the radar."
            urgency = "low"
        items.append(
            {
                "user_id": s.id,
                "display_name": s.display_name,
                "engagement_score": score,
                "recommended_action": action,
                "urgency": urgency,
                "confidence": min(0.95, 0.4 + score / 100),
                "reason": f"Engagement score {score} from {len(ix)} interaction(s).",
            }
        )
    items.sort(key=lambda i: (-{"high": 2, "medium": 1, "low": 0}[i["urgency"]], -i["engagement_score"]))
    return items
