"""Demo seed (MASTER §9). Mirrors the Employee App's bundled seed so the same
IDs/names line up across clients. Idempotent: skips if users already exist.

Logins: every demo account (employees + students) uses the password `weave`.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Application,
    ApplicationAnswer,
    ApplicationQuestion,
    Chat,
    ChatParticipant,
    EmployeeProfile,
    Event,
    EventNote,
    EventRegistration,
    EventResponsibleEmployee,
    EventSentiment,
    EventSuggestion,
    Feedback,
    HostReport,
    Interaction,
    InterestTag,
    Material,
    Memory,
    Message,
    Notification,
    StudentProfile,
    SuggestionVote,
    User,
    UserInterest,
)
from app.event_ingest import ingest_events_json
from app.scoring import recompute_and_cache
from app.security import hash_password


def dt(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


EMPLOYEES = [
    ("emp-1", "simon.haeckner@we-online.de", "Simon Häckner", "Simon", "Häckner", "Senior Field Application Engineer", "Waldenburg (HQ)", "2021-03-01T08:00:00Z"),
    ("emp-2", "jana.donges@we-online.com", "Jana Donges", "Jana", "Donges", "Technical Sales Manager", "München", "2020-09-15T08:00:00Z"),
    ("emp-3", "christian.kapusta@we-online.com", "Christian Kapusta", "Christian", "Kapusta", "Product Manager", "Berlin", "2019-06-20T08:00:00Z"),
]

STUDENTS = [
    ("stu-1", "nakulan.sundarraju@tum.de", "Nakulan Sundarraju", "TU München", "M.Sc. Electrical Engineering"),
    ("stu-2", "michael.brandt@tum.de", "Michael Brandt", "TU München", "M.Sc. Mechatronics"),
    ("stu-3", "lenni.frank@tu-berlin.de", "Lenni Frank", "TU Berlin", "B.Sc. Computer Engineering"),
    ("stu-4", "thiviyan.saravanamuthu@tum.de", "Thiviyan Saravanamuthu", "TU München", "M.Sc. Robotics"),
    ("stu-5", "jakob.weber@lmu.de", "Jakob Weber", "LMU München", "M.Sc. Data Science"),
]

IMG = "https://images.unsplash.com/photo-{}?auto=format&fit=crop&w=900&q=70"

EVENTS = [
    dict(id="evt-3", title="Würth Hardware Hackathon 2026", type="hackathon", city="Waldenburg",
         location="Würth Elektronik Campus, Innovation Hub", start="2026-06-19T08:00:00Z", end="2026-06-21T18:00:00Z",
         status="ongoing", owner="emp-1", responsible=["emp-1", "emp-3"], live=True, partner="TU München",
         description="48h hardware hackathon around power management & RF. Teams prototype with Würth Elektronik components, mentored by our FAEs.",
         target="EE / CE Master students", goal="Talent pipeline + product feedback",
         images=[IMG.format("1518770660439-4636190af475"), IMG.format("1531482615713-2afd69097998")]),
    dict(id="evt-1", title="Würth Elektronik @ embedded world 2026", type="trade_fair", city="Nürnberg",
         location="Messe Nürnberg · Hall 1 · Booth 1-360", start="2026-03-11T08:00:00Z", end="2026-03-13T17:00:00Z",
         status="past", owner="emp-1", responsible=["emp-1", "emp-2", "emp-3"], live=False, partner=None,
         description="Würth Elektronik's flagship booth at embedded world — live demos of the latest passives, RedExpert tooling and design-in support.",
         target="Engineers, students, partners", goal="Brand awareness + qualified leads",
         images=[IMG.format("1540575467063-178a50c2df87"), IMG.format("1511578314322-379afb476865")]),
    dict(id="evt-8", title="WE Student Team Kickoff — eMobility", type="student_team", city="Stuttgart",
         location="Uni Stuttgart · Formula Student Garage", start="2026-02-20T15:00:00Z", end="2026-02-20T18:00:00Z",
         status="past", owner="emp-1", responsible=["emp-1"], live=False, partner=None,
         description="Kickoff sponsoring session with the Formula Student eMobility team — component support, design-in workshop and Q&A.",
         target="Formula Student team members", goal="Long-term sponsoring relationship",
         images=[IMG.format("1492144534655-ae79c964c9d7")]),
    dict(id="evt-4", title="Career Fair Booth — TUM Industry Day", type="career_fair_booth", city="München",
         location="TU München · Galileo Forum", start="2026-07-02T09:00:00Z", end="2026-07-02T16:00:00Z",
         status="upcoming", owner="emp-2", responsible=["emp-2", "emp-1"], live=False, partner="TU München",
         description="Recruiting booth at TUM Industry Day. Focus on working-student & thesis opportunities in hardware and FAE roles.",
         target="TUM students (all levels)", goal="Recruiting pipeline",
         images=[IMG.format("1559136555-9303baea8ebd")]),
    dict(id="evt-6", title="Excursion: Würth Elektronik Plant Tour", type="excursion", city="Niedernhall",
         location="Würth Elektronik eiSos · Production Niedernhall", start="2026-09-10T09:00:00Z", end="2026-09-10T15:00:00Z",
         status="upcoming", owner="emp-1", responsible=["emp-1"], live=False, partner="TU München",
         description="Guided plant tour for partner-university students: SMT lines, magnetics production and a sustainability deep-dive.",
         target="Partner-university students", goal="Employer branding",
         images=[IMG.format("1565514020179-026b92b84bb6")]),
]

# §9: events ingested from the WE events page carry source=scraped; the rest are
# created manually in the dashboard. A mix lets the scrape-ingestion path be demoed.
SCRAPED_EVENT_IDS = {"evt-1", "evt-8", "evt-6"}

# attendees: (event, user, checked_in, full_session)
ATTENDEES = [
    ("evt-3", "stu-1", "2026-06-19T08:12:00Z", False),
    ("evt-3", "stu-2", "2026-06-19T08:20:00Z", False),
    ("evt-3", "stu-4", "2026-06-19T08:31:00Z", False),
    ("evt-3", "stu-3", "2026-06-19T09:05:00Z", False),
    ("evt-1", "stu-1", "2026-03-11T10:02:00Z", True),
    ("evt-1", "stu-4", "2026-03-11T11:20:00Z", True),
    ("evt-1", "stu-5", "2026-03-12T14:10:00Z", False),
    ("evt-1", "stu-2", "2026-03-12T09:45:00Z", True),
    ("evt-8", "stu-2", "2026-02-20T15:05:00Z", True),
    ("evt-8", "stu-3", "2026-02-20T15:08:00Z", True),
    ("evt-6", "stu-1", None, False),  # registered, not yet checked in
]

INTERACTIONS = [
    ("i-301", "evt-3", "stu-1", "check_in", "2026-06-19T08:12:00Z"),
    ("i-302", "evt-3", "stu-1", "project_interest", "2026-06-19T13:40:00Z"),
    ("i-303", "evt-3", "stu-2", "check_in", "2026-06-19T08:20:00Z"),
    ("i-304", "evt-3", "stu-2", "sample_interest", "2026-06-19T16:05:00Z"),
    ("i-305", "evt-3", "stu-4", "check_in", "2026-06-19T08:31:00Z"),
    ("i-306", "evt-3", "stu-4", "question_asked", "2026-06-20T10:15:00Z"),
    ("i-307", "evt-3", "stu-3", "check_in", "2026-06-19T09:05:00Z"),
    ("i-308", "evt-3", "stu-1", "memory_post", "2026-06-20T12:02:00Z"),
    ("i-101", "evt-1", "stu-1", "check_in", "2026-03-11T10:02:00Z"),
    ("i-102", "evt-1", "stu-1", "career_interest", "2026-03-11T10:40:00Z"),
    ("i-103", "evt-1", "stu-4", "full_session", "2026-03-11T16:50:00Z"),
    ("i-104", "evt-1", "stu-4", "application_submitted", "2026-03-13T09:10:00Z"),
    ("i-105", "evt-1", "stu-2", "sample_interest", "2026-03-12T11:00:00Z"),
    ("i-106", "evt-1", "stu-5", "file_download", "2026-03-12T14:30:00Z"),
    ("i-107", "evt-1", "stu-1", "recommendation_submitted", "2026-03-13T16:00:00Z"),
    ("i-801", "evt-8", "stu-2", "check_in", "2026-02-20T15:05:00Z"),
    ("i-802", "evt-8", "stu-2", "project_interest", "2026-02-20T16:20:00Z"),
    ("i-803", "evt-8", "stu-3", "check_in", "2026-02-20T15:08:00Z"),
    ("i-804", "evt-8", "stu-2", "re_engagement", "2026-06-19T08:20:00Z"),
]

MATERIALS = [
    ("m-301", "evt-3", "slides", "Hackathon Briefing Deck", "#", "emp-1", "2026-06-19T07:30:00Z", 41),
    ("m-302", "evt-3", "product_info", "WE Power Modules — Cheat Sheet", "#", "emp-3", "2026-06-19T07:35:00Z", 33),
    ("m-101", "evt-1", "pdf", "embedded world Demo Catalogue", "#", "emp-1", "2026-03-11T07:00:00Z", 188),
    ("m-102", "evt-1", "link", "RedExpert Online Tool", "https://redexpert.we-online.com", "emp-3", "2026-03-11T07:05:00Z", 96),
    ("m-103", "evt-1", "qa_summary", "Booth Q&A Summary", "#", "emp-2", "2026-03-14T09:00:00Z", 54),
    ("m-801", "evt-8", "project_doc", "eMobility Design-in Guide", "#", "emp-1", "2026-02-20T14:00:00Z", 29),
]

NOTES = [
    ("n-301", "evt-3", "emp-1", "Team 4 (Nakulan) building a GaN power stage — strong design-in candidate, follow up after demo.", "2026-06-19T14:00:00Z"),
    ("n-302", "evt-3", "emp-1", "Need more dev boards for day 2 — Christian bringing extras.", "2026-06-19T18:30:00Z"),
    ("n-101", "evt-1", "emp-1", "Thiviyan asked about FAE working-student role — sent application link, applied same day.", "2026-03-11T11:00:00Z"),
]

SENTIMENT = [
    ("s-301", "evt-3", "emp-1", "Room is buzzing — teams deep in soldering, lots of questions at the WE booth.", 0.7, "2026-06-19T11:30:00Z"),
    ("s-302", "evt-3", "emp-3", "Slight energy dip after lunch but picking back up, mentors well utilised.", 0.4, "2026-06-19T14:15:00Z"),
    ("s-303", "evt-3", "emp-1", "Day 2 morning: high focus, several teams near working prototypes.", 0.8, "2026-06-20T09:30:00Z"),
]

# feedback (event, user, recommendation, nps) — drives recommendation/NPS KPIs
FEEDBACK = [
    ("evt-1", "stu-1", 9, 60), ("evt-1", "stu-2", 8, 50), ("evt-1", "stu-4", 9, 55), ("evt-1", "stu-5", 8, 50),
    ("evt-8", "stu-2", 9, 70), ("evt-8", "stu-3", 9, 64),
]

HOST_REPORTS = [
    ("h-101", "evt-1", "emp-1", 5, 5, 4, "repeat", "Booth traffic excellent, RedExpert demo was the magnet.", "More seating for design-in conversations.", "2026-03-13T18:00:00Z"),
    ("h-801", "evt-8", "emp-1", 4, 5, 5, "repeat", "Tight-knit, very engaged team. Clear long-term sponsoring value.", None, "2026-02-20T19:00:00Z"),
]

# chats: (id, type, event_id, title, subtitle, participants)
CHATS = [
    ("chat-evt3", "event_channel", "evt-3", "Hardware Hackathon 2026", "Event channel · 48 attendees", ["emp-1", "emp-3", "stu-1", "stu-2", "stu-3", "stu-4"]),
    ("dm-naku", "dm", None, "Nakulan Sundarraju", "TU München · M.Sc. EE", ["emp-1", "stu-1"]),
    ("dm-thivi", "dm", None, "Thiviyan Saravanamuthu", "TU München · M.Sc. Robotics", ["emp-1", "stu-4"]),
    ("int-jana", "internal", None, "Jana Donges", "Würth · Technical Sales", ["emp-1", "emp-2"]),
    ("int-christian", "internal", None, "Christian Kapusta", "Würth · Product Management", ["emp-1", "emp-3"]),
    ("chat-evt1", "event_channel", "evt-1", "embedded world 2026", "Event channel · archived", ["emp-1", "emp-2", "stu-1", "stu-4"]),
]

MESSAGES = [
    ("msg-e3-1", "chat-evt3", "emp-1", "Welcome to the Würth Hardware Hackathon! Mentors are at the WE booth all day.", "2026-06-19T08:00:00Z", False),
    ("msg-e3-2", "chat-evt3", "stu-1", "Where can we grab extra dev boards?", "2026-06-19T10:20:00Z", False),
    ("msg-e3-3", "chat-evt3", "emp-3", "Front desk — ask for the eval kits box.", "2026-06-19T10:24:00Z", False),
    ("msg-e3-4", "chat-evt3", "emp-1", "Reminder: final demos at 16:00 in the Innovation Hub.", "2026-06-20T10:30:00Z", True),
    ("msg-n-1", "dm-naku", "stu-1", "Hi Simon, quick question on the GaN half-bridge layout.", "2026-06-20T09:40:00Z", False),
    ("msg-n-2", "dm-naku", "emp-1", "Sure — keep the gate loop tight and use our WE-MPSB bead on the supply.", "2026-06-20T09:46:00Z", False),
    ("msg-n-3", "dm-naku", "stu-1", "Thanks! I'll send the schematic over.", "2026-06-20T09:50:00Z", False),
    ("msg-t-1", "dm-thivi", "stu-4", "Great talking at embedded world!", "2026-03-13T17:30:00Z", False),
    ("msg-t-2", "dm-thivi", "emp-1", "Likewise — good luck with the FAE application 🙌", "2026-03-13T17:35:00Z", False),
    ("msg-j-1", "int-jana", "emp-1", "Can you cover the 14:00 booth shift at TUM Industry Day?", "2026-06-19T20:05:00Z", False),
    ("msg-j-2", "int-jana", "emp-2", "Booth shift swap works for me 👍", "2026-06-19T20:10:00Z", False),
    ("msg-c-1", "int-christian", "emp-3", "Bringing 10 more dev boards tomorrow.", "2026-06-19T19:00:00Z", False),
    ("msg-e1-1", "chat-evt1", "emp-1", "Thanks everyone — see the Q&A summary in Files.", "2026-03-13T18:05:00Z", False),
]

NOTIFICATIONS = [
    ("no-1", "emp-1", "attention", "4 follow-ups open · Hackathon 2026", "Several qualified leads from the ongoing hackathon have no assigned next step yet.", "evt-3", "2026-06-20T08:00:00Z", None),
    ("no-2", "emp-1", "engagement", "embedded world: 73 qualified leads", "Engagement index 84/100 — your strongest brand event this year. Full report on the Web Dashboard.", "evt-1", "2026-06-18T09:00:00Z", "2026-06-18T10:00:00Z"),
    ("no-3", "emp-1", "retention", "Michael Brandt re-engaged", "Attended the eMobility kickoff and returned for the hackathon — good moment for a personal follow-up.", "evt-3", "2026-06-19T12:00:00Z", None),
    ("no-4", "emp-1", "improvement", "Tip · Plant Tour registrations", "Only 12 of 30 slots filled for the Sept plant tour. Consider a reminder broadcast to past attendees.", "evt-6", "2026-06-17T15:00:00Z", "2026-06-17T16:00:00Z"),
]

# Capture-a-Memory threads (mem-301 backs interaction i-308). (id, event, author, parent, body, created_at)
MEMORIES = [
    ("mem-301", "evt-3", "stu-1", None, "Day 2 and our GaN power stage is finally switching clean 🎉 huge thanks to the WE FAEs at the booth.", "2026-06-20T12:02:00Z"),
    ("mem-302", "evt-3", "stu-2", "mem-301", "Congrats! Which gate driver did you end up using?", "2026-06-20T12:18:00Z"),
    ("mem-303", "evt-3", "stu-4", None, "Soldering the RF front-end was tricky but the mentors helped us debug the matching network.", "2026-06-20T13:05:00Z"),
    ("mem-101", "evt-1", "stu-4", None, "Met the FAE team at embedded world — the RedExpert demo sold me on applying. Great booth!", "2026-03-13T15:10:00Z"),
]

# Requests board (Reddit-style). (id, title, description, proposer, source_event_id, repost_count, created_at)
SUGGESTIONS = [
    ("sug-1", "RISC-V & Embedded Linux Bootcamp", "A hands-on weekend on RISC-V SoCs and embedded Linux using Würth Elektronik dev boards.", "stu-3", None, 0, "2026-05-02T09:00:00Z"),
    ("sug-2", "More power-magnetics design workshops", "Loved the magnetics content at the tech talk — please run a dedicated design-in workshop.", "stu-2", None, 0, "2026-05-10T14:00:00Z"),
    ("sug-8", "Repeat: WE Student Team Kickoff — eMobility", "Bring back the Formula Student eMobility kickoff — the design-in support was invaluable.", "stu-2", "evt-8", 2, "2026-05-15T10:00:00Z"),
]

# (id, suggestion_id, user_id, value)
SUGGESTION_VOTES = [
    ("sv-1", "sug-1", "stu-1", 1), ("sv-2", "sug-1", "stu-2", 1), ("sv-3", "sug-1", "stu-4", 1), ("sv-4", "sug-1", "stu-5", -1),
    ("sv-5", "sug-2", "stu-1", 1), ("sv-6", "sug-2", "stu-4", 1),
    ("sv-7", "sug-8", "stu-2", 1), ("sv-8", "sug-8", "stu-3", 1), ("sv-9", "sug-8", "stu-1", 1),
]

# Apply flow. evt-4 (TUM Industry Day booth) requires an application. (id, event, question_text, position)
APPLICATION_QUESTIONS = [
    ("aq-401", "evt-4", "Why do you want to join Würth Elektronik?", 0),
    ("aq-402", "evt-4", "Which area interests you most (Hardware, FAE, Sales, Data)?", 1),
]

# (id, event, applicant, status, submitted_at, [(question_id, answer_text), ...])  (app-101 backs interaction i-104)
APPLICATIONS = [
    ("app-401", "evt-4", "stu-1", "under_review", "2026-06-15T10:00:00Z",
     [("aq-401", "Würth components are everywhere in our hackathon projects — I want hands-on power-electronics experience."),
      ("aq-402", "Hardware & Field Application Engineering.")]),
    ("app-402", "evt-4", "stu-5", "submitted", "2026-06-16T11:30:00Z",
     [("aq-401", "Strong interest in data-driven product engineering at a hardware company."),
      ("aq-402", "Data.")]),
    ("app-101", "evt-1", "stu-4", "accepted", "2026-03-13T09:10:00Z", []),
]

INTEREST_TAGS = {
    "Hardware & Core Engineering": ["Power Electronics", "RF & Wireless", "PCB Design", "Embedded Systems"],
    "Industrial & Manufacturing Tech": ["Automation", "eMobility", "Robotics", "Production"],
    "Technical Business & Customer Support": ["Field Application Engineering", "Technical Sales", "Product Management"],
    "Operations, Supply Chain & Digital": ["Data Science", "Supply Chain", "Digital Tools"],
}


def seed(db: Session) -> None:
    if db.scalar(select(User).limit(1)):
        return  # already seeded

    # One simple shared password for the whole demo team + jurors.
    emp_pw = hash_password("weave")
    stu_pw = hash_password("weave")

    # Insert parent rows (users) before any FK children. Postgres enforces FKs;
    # explicit flushes keep insert order correct regardless of UoW heuristics.
    for eid, email, name, first, sur, sen, branch, created in EMPLOYEES:
        db.add(User(id=eid, role="employee", email=email, password_hash=emp_pw, display_name=name, created_at=dt(created)))
    for sid, email, name, uni, degree in STUDENTS:
        db.add(User(id=sid, role="student", email=email, password_hash=stu_pw, display_name=name, created_at=dt("2025-10-01T08:00:00Z")))
    db.flush()

    for eid, email, name, first, sur, sen, branch, created in EMPLOYEES:
        db.add(EmployeeProfile(user_id=eid, first_name=first, surname=sur, seniority=sen, branch_office=branch))
    for sid, email, name, uni, degree in STUDENTS:
        db.add(StudentProfile(user_id=sid, university=uni, study_degree=degree))
    db.flush()

    # interest tags + a couple of assignments
    tag_id_map: dict[str, int] = {}
    tid = 1
    for category, names in INTEREST_TAGS.items():
        for n in names:
            db.add(InterestTag(id=tid, name=n, category=category))
            tag_id_map[n] = tid
            tid += 1
    db.flush()
    for sid, tags in {"stu-1": ["Power Electronics", "RF & Wireless"], "stu-2": ["eMobility", "Automation"],
                      "stu-4": ["Robotics", "Field Application Engineering"], "stu-5": ["Data Science"]}.items():
        for t in tags:
            db.add(UserInterest(user_id=sid, tag_id=tag_id_map[t]))

    for e in EVENTS:
        db.add(Event(
            id=e["id"], title=e["title"], type=e["type"], description=e["description"], city=e["city"],
            location=e["location"], start_at=dt(e["start"]), end_at=dt(e["end"]), target_group=e["target"],
            goal=e["goal"], partner_university=e["partner"], owner_employee_id=e["owner"], status=e["status"],
            images=e["images"], live_analytics_enabled=e["live"],
            source="scraped" if e["id"] in SCRAPED_EVENT_IDS else "manual",
            cost=12000 if e["status"] == "past" else None,
        ))
    db.flush()
    for e in EVENTS:
        for emp_id in e["responsible"]:
            db.add(EventResponsibleEmployee(event_id=e["id"], employee_id=emp_id))

    reg_n = 0
    for ev, user, checked_in, full in ATTENDEES:
        reg_n += 1
        db.add(EventRegistration(
            id=f"reg-{reg_n}", event_id=ev, user_id=user,
            email=next(s[1] for s in STUDENTS if s[0] == user),
            source="applied", registered_at=dt("2026-01-15T08:00:00Z"),
            checked_in_at=dt(checked_in) if checked_in else None,
            checked_out_at=dt(checked_in) if full else None,
        ))

    for iid, ev, user, itype, ts in INTERACTIONS:
        db.add(Interaction(id=iid, event_id=ev, user_id=user, type=itype, timestamp=dt(ts), source="student_app"))

    for mid, ev, mtype, title, url, by, ts, count in MATERIALS:
        db.add(Material(id=mid, event_id=ev, type=mtype, title=title, url=url, uploaded_by=by, upload_date=dt(ts), access_count=count))

    for nid, ev, by, body, ts in NOTES:
        db.add(EventNote(id=nid, event_id=ev, author_employee_id=by, body=body, created_at=dt(ts)))

    for sid, ev, by, desc, val, ts in SENTIMENT:
        db.add(EventSentiment(id=sid, event_id=ev, author_employee_id=by, description=desc, sentiment_value=val, created_at=dt(ts)))

    fb_n = 0
    for ev, user, rec, nps in FEEDBACK:
        fb_n += 1
        db.add(Feedback(id=f"fb-{fb_n}", event_id=ev, user_id=user, recommendation_score=rec, nps_score=nps, submitted_at=dt("2026-03-14T08:00:00Z")))

    for hid, ev, host, org, aud, inter, rep, notes, impr, ts in HOST_REPORTS:
        db.add(HostReport(id=hid, event_id=ev, host_user_id=host, organization_rating=org,
                          audience_relevance_rating=aud, interaction_quality_rating=inter,
                          repeat_recommendation=rep, notes=notes, suggested_improvements=impr, created_at=dt(ts)))

    for cid, ctype, ev, title, subtitle, members in CHATS:
        db.add(Chat(id=cid, type=ctype, event_id=ev, title=title, subtitle=subtitle, created_at=dt("2026-02-01T08:00:00Z")))
    db.flush()
    for cid, ctype, ev, title, subtitle, members in CHATS:
        for m in members:
            db.add(ChatParticipant(chat_id=cid, user_id=m))

    for mid, cid, sender, body, ts, is_b in MESSAGES:
        db.add(Message(id=mid, chat_id=cid, sender_user_id=sender, body=body, sent_at=dt(ts), is_broadcast=is_b, read_by=[sender]))

    for nid, uid, ntype, title, body, ev, created, read in NOTIFICATIONS:
        db.add(Notification(id=nid, user_id=uid, type=ntype,
                            payload={"title": title, "body": body, "event_id": ev},
                            created_at=dt(created), read_at=dt(read) if read else None))

    student_email = {s[0]: s[1] for s in STUDENTS}

    # Memories (Capture a Memory) — mem-301 backs the seeded memory_post interaction.
    for mid, ev, author, parent, body, ts in MEMORIES:
        db.add(Memory(id=mid, event_id=ev, author_user_id=author, parent_id=parent,
                      body=body, is_public=True, created_at=dt(ts)))

    # Suggestions / Requests board + votes.
    for sid_, title, desc, proposer, src, reposts, ts in SUGGESTIONS:
        db.add(EventSuggestion(id=sid_, title=title, description=desc, proposer_user_id=proposer,
                               proposer_email=student_email.get(proposer), source_event_id=src,
                               repost_count=reposts, created_at=dt(ts)))
    db.flush()
    for vid, sug, uid, val in SUGGESTION_VOTES:
        db.add(SuggestionVote(id=vid, suggestion_id=sug, user_id=uid, value=val))

    # Applications (Apply flow). Mark the application-gated event required + seed questions.
    app_event = db.get(Event, "evt-4")
    if app_event:
        app_event.application_required = True
    for qid, ev, text, pos in APPLICATION_QUESTIONS:
        db.add(ApplicationQuestion(id=qid, event_id=ev, question_text=text, position=pos))
    db.flush()
    for aid, ev, applicant, status, ts, answers in APPLICATIONS:
        db.add(Application(id=aid, event_id=ev, applicant_user_id=applicant,
                           applicant_email=student_email.get(applicant), status=status,
                           submitted_at=dt(ts)))
        db.flush()
        for qid, atext in answers:
            db.add(ApplicationAnswer(id=f"ans-{aid}-{qid}", application_id=aid,
                                     question_id=qid, answer_text=atext))

    # Ingest the full scraped Würth events catalogue (mock_data/events.json) so the
    # DB — not any client-side mock — is the single source of truth for all events.
    # Past/ongoing entries also get synthesised KPI rows so the dashboard is alive.
    ingest_events_json(db)

    # Seed a few follow-ups on past events so the dashboard's contextual follow-up
    # feature has real data to act on (DASH-18). Created after events exist.
    _seed_follow_ups(db)

    db.commit()

    # cache engagement scores (now includes ingested-event interactions)
    for sid, *_ in STUDENTS:
        recompute_and_cache(db, sid)
    db.commit()


# (id, event, contact_user, owner, next_action, kind, status)
FOLLOW_UPS = [
    ("fu-1", "evt-1", "stu-1", "emp-1", "Send the FAE working-student role details to Nakulan and book a call.", "contact", "open"),
    ("fu-2", "evt-1", "stu-4", "emp-1", "Share the post-event slide deck with Thiviyan.", "upload_slides", "open"),
    ("fu-3", "evt-8", "stu-2", "emp-1", "Follow up with Michael on the eMobility design-in support.", "contact", "open"),
]


def _seed_follow_ups(db: Session) -> None:
    from app.models import FollowUp

    for fid, ev, contact, owner, action, kind, status in FOLLOW_UPS:
        if db.get(FollowUp, fid):
            continue
        if not db.get(Event, ev):
            continue
        db.add(FollowUp(id=fid, event_id=ev, contact_user_id=contact, assigned_owner_id=owner,
                        next_action=action, type=kind, status=status))
