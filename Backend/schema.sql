-- ─────────────────────────────────────────────────────────────────────────────
-- WEave database schema — raw DDL mirror of WEAVE_MASTER.md §5 / app/models.py
-- Postgres dialect. Applied automatically by docker-compose on first DB init;
-- the app also runs SQLAlchemy create_all(), so existing tables are left intact.
-- `IF NOT EXISTS` keeps this idempotent and conflict-free with the ORM.
-- ─────────────────────────────────────────────────────────────────────────────

-- Identity & profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    role          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    display_name  TEXT NOT NULL,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

CREATE TABLE IF NOT EXISTS student_profiles (
    user_id                       TEXT PRIMARY KEY REFERENCES users (id),
    university                    TEXT,
    study_degree                  TEXT,
    hometown                      TEXT,
    consent_visible_to_recruiters BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_profiles (
    user_id       TEXT PRIMARY KEY REFERENCES users (id),
    first_name    TEXT NOT NULL,
    surname       TEXT NOT NULL,
    seniority     TEXT,
    branch_office TEXT
);

CREATE TABLE IF NOT EXISTS interest_tags (
    id       SERIAL PRIMARY KEY,
    name     TEXT NOT NULL,
    category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_interests (
    user_id TEXT REFERENCES users (id),
    tag_id  INTEGER REFERENCES interest_tags (id),
    PRIMARY KEY (user_id, tag_id)
);

-- Events ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id                     TEXT PRIMARY KEY,
    title                  TEXT NOT NULL,
    type                   TEXT NOT NULL,
    description            TEXT DEFAULT '',
    city                   TEXT,
    location               TEXT,
    start_at               TIMESTAMPTZ NOT NULL,
    end_at                 TIMESTAMPTZ NOT NULL,
    target_group           TEXT,
    goal                   TEXT,
    cost                   NUMERIC(12, 2),
    human_capital          TEXT,
    partner_university     TEXT,
    owner_employee_id      TEXT REFERENCES users (id),
    status                 TEXT NOT NULL DEFAULT 'planned',
    application_required   BOOLEAN NOT NULL DEFAULT FALSE,
    application_open_at     TIMESTAMPTZ,
    application_close_at    TIMESTAMPTZ,
    files_after_event      BOOLEAN NOT NULL DEFAULT FALSE,
    source                 TEXT NOT NULL DEFAULT 'manual',
    images                 JSONB,
    live_analytics_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_responsible_employees (
    event_id    TEXT REFERENCES events (id),
    employee_id TEXT REFERENCES users (id),
    PRIMARY KEY (event_id, employee_id)
);

-- Applications ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS application_questions (
    id            TEXT PRIMARY KEY,
    event_id      TEXT REFERENCES events (id),
    question_text TEXT NOT NULL,
    position      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS applications (
    id                TEXT PRIMARY KEY,
    event_id          TEXT REFERENCES events (id),
    applicant_user_id TEXT REFERENCES users (id),
    applicant_email   TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'submitted',
    submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS application_answers (
    id             TEXT PRIMARY KEY,
    application_id TEXT REFERENCES applications (id),
    question_id    TEXT REFERENCES application_questions (id),
    answer_text    TEXT DEFAULT ''
);

-- Attendance lifecycle ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_registrations (
    id             TEXT PRIMARY KEY,
    event_id       TEXT REFERENCES events (id),
    user_id        TEXT REFERENCES users (id),
    email          TEXT,
    source         TEXT NOT NULL DEFAULT 'manual',
    registered_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    checked_in_at  TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    CONSTRAINT uq_registration_event_user UNIQUE (event_id, user_id)
);

-- Interactions (engagement spine) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interactions (
    id                  TEXT PRIMARY KEY,
    event_id            TEXT REFERENCES events (id),
    user_id             TEXT REFERENCES users (id),
    type                TEXT NOT NULL,
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT now(),
    source              TEXT NOT NULL DEFAULT 'manual',
    confidence_level    DOUBLE PRECISION DEFAULT 1.0,
    related_material_id TEXT,
    related_chat_id     TEXT,
    related_followup_id TEXT,
    metadata            JSONB
);
CREATE INDEX IF NOT EXISTS ix_interactions_event ON interactions (event_id);
CREATE INDEX IF NOT EXISTS ix_interactions_user ON interactions (user_id);

-- Content ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
    id             TEXT PRIMARY KEY,
    event_id       TEXT REFERENCES events (id),
    type           TEXT NOT NULL,
    title          TEXT NOT NULL,
    url            TEXT DEFAULT '#',
    uploaded_by    TEXT REFERENCES users (id),
    upload_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
    access_count   INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    related_topic  TEXT
);

CREATE TABLE IF NOT EXISTS memories (
    id             TEXT PRIMARY KEY,
    event_id       TEXT REFERENCES events (id),
    author_user_id TEXT REFERENCES users (id),
    parent_id      TEXT REFERENCES memories (id),
    body           TEXT DEFAULT '',
    is_public      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memory_images (
    id        TEXT PRIMARY KEY,
    memory_id TEXT REFERENCES memories (id),
    image_url TEXT NOT NULL
);

-- Suggestions / requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_suggestions (
    id               TEXT PRIMARY KEY,
    title            TEXT NOT NULL,
    description      TEXT DEFAULT '',
    proposer_user_id TEXT REFERENCES users (id),
    proposer_email   TEXT,
    source_event_id  TEXT REFERENCES events (id),
    repost_count     INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suggestion_votes (
    id            TEXT PRIMARY KEY,
    suggestion_id TEXT REFERENCES event_suggestions (id),
    user_id       TEXT REFERENCES users (id),
    value         SMALLINT NOT NULL,
    CONSTRAINT uq_vote_suggestion_user UNIQUE (suggestion_id, user_id),
    CONSTRAINT ck_vote_value CHECK (value IN (-1, 1))
);

-- Feedback / KPI source tables ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
    id                   TEXT PRIMARY KEY,
    event_id             TEXT REFERENCES events (id),
    user_id              TEXT REFERENCES users (id),
    recommendation_score INTEGER NOT NULL DEFAULT 0,
    nps_score            INTEGER,
    text                 TEXT,
    submitted_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS host_reports (
    id                         TEXT PRIMARY KEY,
    event_id                   TEXT REFERENCES events (id),
    host_user_id               TEXT REFERENCES users (id),
    organization_rating        INTEGER NOT NULL DEFAULT 0,
    audience_relevance_rating  INTEGER NOT NULL DEFAULT 0,
    interaction_quality_rating INTEGER NOT NULL DEFAULT 0,
    repeat_recommendation      TEXT NOT NULL DEFAULT 'improve',
    notes                      TEXT,
    suggested_improvements     TEXT,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Follow-ups ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follow_ups (
    id                TEXT PRIMARY KEY,
    event_id          TEXT REFERENCES events (id),
    contact_user_id   TEXT REFERENCES users (id),
    assigned_owner_id TEXT REFERENCES users (id),
    next_action       TEXT DEFAULT '',
    type              TEXT,
    due_date          TIMESTAMPTZ,
    status            TEXT NOT NULL DEFAULT 'open',
    outcome           TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ
);

-- Messaging ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chats (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    event_id   TEXT REFERENCES events (id),
    title      TEXT,
    subtitle   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id TEXT REFERENCES chats (id),
    user_id TEXT REFERENCES users (id),
    PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id             TEXT PRIMARY KEY,
    chat_id        TEXT REFERENCES chats (id),
    sender_user_id TEXT REFERENCES users (id),
    body           TEXT DEFAULT '',
    sent_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_broadcast   BOOLEAN NOT NULL DEFAULT FALSE,
    read_by        JSONB
);
CREATE INDEX IF NOT EXISTS ix_messages_chat ON messages (chat_id);

-- Employee live tools ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_notes (
    id                 TEXT PRIMARY KEY,
    event_id           TEXT REFERENCES events (id),
    author_employee_id TEXT REFERENCES users (id),
    body               TEXT DEFAULT '',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_sentiment (
    id                 TEXT PRIMARY KEY,
    event_id           TEXT REFERENCES events (id),
    author_employee_id TEXT REFERENCES users (id),
    description        TEXT DEFAULT '',
    sentiment_value    DOUBLE PRECISION,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scan tokens / prioritization / notifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qr_tokens (
    id         TEXT PRIMARY KEY,
    event_id   TEXT REFERENCES events (id),
    kind       TEXT NOT NULL,
    token      TEXT UNIQUE NOT NULL,
    created_by TEXT REFERENCES users (id),
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS engagement_scores (
    user_id     TEXT REFERENCES users (id),
    event_id    TEXT NOT NULL DEFAULT '',
    score       INTEGER NOT NULL DEFAULT 0,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT PRIMARY KEY,
    user_id    TEXT REFERENCES users (id),
    type       TEXT NOT NULL,
    payload    JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at    TIMESTAMPTZ
);
