"""Internal — Opportunity Explorer + LLM assistant (MASTER §6.17). Role employee."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai import opportunity_assistant
from app.db import get_db
from app.deps import require_employee
from app.models import User
from app.recommend import opportunities
from app.schemas import AssistantRequest, AssistantResponse, OpportunityOut

router = APIRouter(prefix="/internal/opportunities", tags=["internal-opportunities"])


@router.get("", response_model=list[OpportunityOut])
def list_opportunities(db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return opportunities(db)


@router.post("/assistant", response_model=AssistantResponse)
def assistant(
    body: AssistantRequest, db: Session = Depends(get_db), _: User = Depends(require_employee)
):
    return opportunity_assistant(db, body.prompt)
