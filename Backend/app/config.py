"""Runtime configuration, sourced from environment / .env."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database. Default to a local SQLite file so the app runs with zero setup;
    # docker-compose overrides this with a Postgres URL.
    database_url: str = "sqlite:///./weave.db"

    # Auth
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # one week

    # CORS — comma separated, or "*"
    cors_origins: str = "*"

    # Seed demo data when the DB is empty
    seed_on_startup: bool = True

    # Optional AI provider. OpenRouter (OpenAI-style) is preferred when its key is
    # set; Anthropic is the fallback. Both are optional — the AI features degrade to
    # deterministic heuristics when neither key is configured.
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-fable-5"
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-3.5-sonnet"

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
