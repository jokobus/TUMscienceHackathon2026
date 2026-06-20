"""AI features (MASTER §6.2 search, §6.17 assistant).

If ANTHROPIC_API_KEY is set, calls the provider; otherwise falls back to
deterministic keyword/heuristic logic so every endpoint works offline.
"""
from __future__ import annotations

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Event
from app.recommend import opportunities


def _keyword_rank(events: list[Event], q: str) -> list[Event]:
    q = q.lower().strip()
    if not q:
        return events
    terms = [t for t in q.split() if t]

    def score(e: Event) -> int:
        hay = " ".join(
            filter(None, [e.title, e.description, e.type, e.city, e.location, e.target_group, e.goal])
        ).lower()
        return sum(hay.count(t) for t in terms)

    ranked = sorted(events, key=score, reverse=True)
    return [e for e in ranked if score(e) > 0] or []


def search_events(db: Session, q: str) -> list[Event]:
    events = list(db.scalars(select(Event).where(Event.status != "draft")))
    ranked = _keyword_rank(events, q)
    # If the LLM is available we could re-rank; keyword ranking is a solid baseline.
    return ranked


def _call_anthropic(prompt: str, system: str) -> str | None:
    if not settings.anthropic_api_key:
        return None
    try:
        resp = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 700,
                "system": system,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return "".join(block.get("text", "") for block in data.get("content", []))
    except Exception:
        return None


def opportunity_assistant(db: Session, prompt: str) -> dict:
    recs = opportunities(db)
    grounded = [r["title"] for r in recs]

    events = list(db.scalars(select(Event)))
    context = "\n".join(
        f"- {e.title} ({e.type}, {e.status}, {e.city or 'n/a'}, partner: {e.partner_university or 'none'})"
        for e in events
    )
    system = (
        "You are the Würth Elektronik Opportunity Explorer assistant. Give concise, "
        "actionable recommendations grounded ONLY in the provided event data. Always explain why."
    )
    llm = _call_anthropic(
        f"Events in our database:\n{context}\n\nQuestion: {prompt}", system
    )
    if llm:
        answer = llm
    else:
        answer = (
            "Based on your event history, the strongest opportunities are: "
            + "; ".join(f"{r['title']} ({r['reason']})" for r in recs[:3])
            + "."
            if recs
            else "Not enough event data yet to surface opportunities — run a few events first."
        )
    return {"answer": answer, "recommendations": recs[:5], "grounded_on": grounded}
