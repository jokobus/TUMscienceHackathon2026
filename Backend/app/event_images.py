"""Deterministic event type inference + topical image assignment.

Single source of truth for "which image does this event get". Because the backend
stores the result in Event.images and every client reads images from the API, all
three platforms show the SAME topical image for the SAME event (MASTER: consistent
images + titles across platforms). The mapping is pure + deterministic: same
(type, title) always yields the same image, so it is also safe to mirror in a
client's offline fallback.
"""
from __future__ import annotations

_IMG = "https://images.unsplash.com/photo-{}?auto=format&fit=crop&w=1000&q=70"

# Curated, topical Unsplash photo ids per event type. Picking by a stable hash of
# the title gives variety while staying deterministic.
_IMAGE_SETS: dict[str, list[str]] = {
    "hackathon": ["1518770660439-4636190af475", "1531482615713-2afd69097998", "1504384308090-c894fdcc538d"],
    "trade_fair": ["1540575467063-178a50c2df87", "1511578314322-379afb476865", "1492684223066-81342ee5ff30"],
    "conference": ["1505373877841-8d25f7d46678", "1540575467063-178a50c2df87", "1517048676732-d65bc937f952"],
    "career_fair_booth": ["1559136555-9303baea8ebd", "1521737604893-d14cc237f11d", "1556761175-5973dc0f32e7"],
    "excursion": ["1565514020179-026b92b84bb6", "1581091226825-a6a2a5aee158", "1581094794329-c8112a89af12"],
    "seminar": ["1524178232363-1fb2b075b655", "1505373877841-8d25f7d46678", "1488190211105-8b0e65b80b4e"],
    "webinar": ["1587825140708-dfaf72ae4b04", "1593642632823-8f785ba67e45", "1610563166150-b34df4f3bcd6"],
    "technical_talk": ["1517077304055-6e89abbf09b0", "1591405351990-4726e331f141", "1581092160562-40aa08e78837"],
    "guest_lecture": ["1524178232363-1fb2b075b655", "1523240795612-9a054b0db644", "1503676260728-1c00da094a0b"],
    "student_team": ["1492144534655-ae79c964c9d7", "1581092160562-40aa08e78837", "1531482615713-2afd69097998"],
    "one_on_one": ["1521737604893-d14cc237f11d", "1556761175-5973dc0f32e7", "1517048676732-d65bc937f952"],
    "other": ["1518770660439-4636190af475", "1517077304055-6e89abbf09b0"],
}

# Department accent set — used as a secondary signal so e.g. Leiterplatten (PCB)
# events lean toward circuit imagery regardless of inferred type.
_DEPARTMENT_HINT: dict[str, list[str]] = {
    "Leiterplatten": ["1517077304055-6e89abbf09b0", "1591405351990-4726e331f141"],
    "Bauelemente": ["1518770660439-4636190af475", "1581092160562-40aa08e78837"],
    "Intelligente Systeme": ["1485827404703-89b55fcc595e", "1531297484001-80022131f5a1"],
    "Karriere": ["1559136555-9303baea8ebd", "1521737604893-d14cc237f11d"],
}


def _stable_hash(s: str) -> int:
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h


def infer_type(title: str, department: str | None, location: str | None = None) -> str:
    """Infer an EventType enum value from the title/department/location."""
    t = (title or "").lower()
    loc = (location or "").lower()
    dept = (department or "").lower()

    if "hackathon" in t:
        return "hackathon"
    if any(k in t for k in ("messe", "expo", "fair", "show", "conexpo", "bauma", "electronica", "wots", "sido", "fiaa", "evertiq")):
        return "trade_fair"
    if any(k in t for k in ("kongress", "congress", "conference", "forum", "symposium", "eumw", "ieee")):
        return "conference"
    if "jobmesse" in t or "fachkräftetage" in t or "fachkraeftetage" in t or (("karriere" in dept) and ("messe" in t or "tag" in t or "students" in t or "ikom" in t)):
        return "career_fair_booth"
    if any(k in t for k in ("webinar",)) or loc == "online":
        return "webinar"
    if any(k in t for k in ("seminar", "seminartag")):
        return "seminar"
    if any(k in t for k in ("workshop",)):
        return "technical_talk"
    if any(k in t for k in ("labor", "lab", "plant", "tour", "exkursion", "excursion", "werk")):
        return "excursion"
    if "karriere" in dept:
        return "career_fair_booth"
    return "technical_talk"


def image_for(event_type: str, department: str | None, title: str) -> list[str]:
    """Return a deterministic topical image list (1 primary) for an event."""
    pool = list(_IMAGE_SETS.get(event_type, _IMAGE_SETS["other"]))
    # Blend in a department hint so the catalogue feels varied + on-topic.
    if department:
        for key, ids in _DEPARTMENT_HINT.items():
            if key.lower() in department.lower():
                pool = pool + ids
                break
    h = _stable_hash(f"{event_type}|{title}")
    primary = pool[h % len(pool)]
    return [_IMG.format(primary)]
