# WEave - Master Specification & Shared Contract

> **TUM Science Hackathon 2026 - Würth Elektronik Challenge**

## The Core Problem It Solves

Würth Elektronik frequently engages high-potential student communities through technical talks, hackathons, guest lectures, career fairs, and 1:1 interactions. However, the operational relationship context is often lost immediately after an event concludes. Organizations typically know an event occurred, but lack structured data on:  

- Which specific students were truly engaged.  

- Which event formats successfully established long-term brand retention.  

- What concrete follow-up actions need to be prioritized to convert casual visitors into qualified leads.  

---

## Our solution
WEave is a multi-faceted, event-based networking and relationship intelligence platform engineered to bridge the gap between academic talent and industry operations. Rather than treating corporate university events as isolated occurrences, WEave structures student touchpoints into a continuous, data-driven relationship loop.  

WEave divides responsibility across three interconnected faces, utilizing a centralized backend brain to transform primary interaction data into actionable executive insights:  

    The Student App (Mobile Web & Native Layer): Actively creates student-facing value. It serves as a friction-free public feed for locating events, downloading technical file assets, applying for specialized sessions, and capturing interactive "Memories" (threaded feedback and community discussions).  

    The Employee App (Exclusive Internal Mobile Client): A lightweight on-site utility for Würth staff. It allows coordinators to instantly generate check-in/check-out QR tokens, capture real-time crowd sentiment descriptions, log on-site notes, and broadcast urgent live announcements to all attendees via automated push channels.  

    The HR Dashboard (Internal Control Center): A strategic intelligence desktop interface. It aggregates all structural data from the ecosystem, presenting graphical performance charts, tracking Gantt-style preparation timelines, evaluating "Event Health" classifications, detecting potential formatting flops before they launch, and leveraging an LLM planning assistant to scan untapped regional opportunities.

--- 

## System Architecture
### Graphical Overview

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Student App    │   │  Würth Dashboard │   │   Employee App   │
│  Next.js / React │   │  Next.js / React │   │  Next.js / React │
│  mobile + web    │   │  desktop web     │   │  mobile          │
│  PUBLIC-facing   │   │  INTERNAL        │   │  INTERNAL        │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         │   REST (HTTP/JSON)   │      WebSocket (chat)│
         └──────────────┬───────┴──────────────────────┘
                        │
              ┌─────────▼───────────┐
              │  Backend — Python   │
              │  FastAPI            │
              │  • REST endpoints   │
              │  • WebSocket server │
              │  • Engagement/KPI   │
              │  • AI (search/LLM)  │
              │  • Scraper + Seed   │
              └─────────┬───────────┘
                        │
              ┌─────────▼───────────┐
              │  Database (SQLite   │
              │  for hackathon;     │
              │  Postgres-ready)    │
              └─────────────────────┘
```

## Stack Description
- **Frontend (all 3 clients):** Next.js (App Router) + React + Tailwind. Deployed on **Vercel**.
- **Backend:** Python + **FastAPI** (REST) and an ASGI **WebSocket** endpoint for chat. Hosted separately (Railway/Render) or run locally for the demo.
- **DB:** **SQLite** for the hackathon (single file, zero-setup) — schema is Postgres-compatible. Optionally Supabase.
- **AI:** one LLM provider (Anthropic or Gemini) for AI event search + Opportunity-Explorer assistant.

**Golden rule:** Frontends hold **no business logic**. They fetch from / report to the backend. The **backend is the brain**, the clients are the faces. The API contract (§6) is what lets all four parts be built in parallel.

---