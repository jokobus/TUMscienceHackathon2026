"""AI features (MASTER §6.2 search, §6.17 assistant).

If ANTHROPIC_API_KEY is set, calls the provider; otherwise falls back to
deterministic keyword/heuristic logic so every endpoint works offline.
"""
from __future__ import annotations

import json

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Event
from app.recommend import opportunities

# Defense-in-depth privacy rule appended to every assistant system prompt. The
# engagement score (MASTER §8) is backend-only and must never be revealed, even to
# employees via the assistant, and the assistant must never rank people by it.
PRIVACY_GUARDRAIL = (
    " PRIVACY: A user's engagement score and any internal ranking number are strictly "
    "confidential. Never reveal, infer, estimate, compute, or rank individuals by an "
    "engagement score or numeric relationship metric, even if asked directly. If asked "
    "for a score or ranking, decline and offer a qualitative relationship status instead "
    "(e.g. qualified lead, follow-up open)."
)


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


def _llm_rank_events(events: list[Event], q: str) -> list[Event] | None:
    """Ask the LLM to semantically rank events for the query (MASTER §6.2).

    Returns ordered events, or None if the LLM is unavailable / unparseable so
    the caller can fall back to keyword ranking.
    """
    if not events:
        return None
    catalog = [
        {
            "id": e.id,
            "title": e.title,
            "type": e.type,
            "status": e.status,
            "summary": (e.description or "")[:240],
            "city": e.city,
        }
        for e in events
    ]
    system = (
        "You are WEave's semantic event-search ranker for Würth Elektronik. Given a JSON "
        "catalog of events and a user query, return ONLY a JSON array of the relevant event "
        "ids, most relevant first. Include an event only if it genuinely matches the query's "
        "intent. Output raw JSON (e.g. [\"evt-3\",\"evt-1\"]), no prose, no code fences."
    )
    raw = _call_llm(
        f"Catalog:\n{json.dumps(catalog)}\n\nQuery: {q}\n\nReturn the ranked event ids as a JSON array.",
        system,
    )
    if not raw:
        return None
    try:
        start, end = raw.find("["), raw.rfind("]")
        if start == -1 or end == -1:
            return None
        ids = json.loads(raw[start : end + 1])
        by_id = {e.id: e for e in events}
        return [by_id[i] for i in ids if isinstance(i, str) and i in by_id]
    except Exception:
        return None


def search_events(db: Session, q: str) -> list[Event]:
    events = list(db.scalars(select(Event).where(Event.status != "draft")))
    if not q.strip():
        return events
    # AI-assisted semantic search when a key is configured; deterministic keyword
    # ranking is the offline baseline and the fallback if the LLM is unavailable.
    if settings.openrouter_api_key or settings.anthropic_api_key:
        ranked = _llm_rank_events(events, q)
        if ranked:
            return ranked
    return _keyword_rank(events, q)


def _call_llm(prompt: str, system: str) -> str | None:
    """Provider dispatcher: prefer OpenRouter when configured, else Anthropic."""
    if settings.openrouter_api_key:
        out = _call_openrouter(prompt, system)
        if out is not None:
            return out
    return _call_anthropic(prompt, system)


def _call_openrouter(prompt: str, system: str) -> str | None:
    if not settings.openrouter_api_key:
        return None
    try:
        resp = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://weave.we-online.com",
                "X-Title": "WEave",
            },
            json={
                "model": settings.openrouter_model,
                "max_tokens": 700,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception:
        return None


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
        + PRIVACY_GUARDRAIL
    )
    llm = _call_llm(
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
