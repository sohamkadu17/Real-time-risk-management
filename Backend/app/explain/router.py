"""
Explainability router for risk explanations
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.risk.models import Risk
from app.explain.rag import rag_explainability
from app.core.dependencies import get_current_user
from db.session import get_db

router = APIRouter(prefix="/explain", tags=["Explainability"])


class ExplainRiskRequest(BaseModel):
    """Request schema for risk explanation"""
    risk_id: int


class ExplainRiskResponse(BaseModel):
    """Response schema for risk explanation"""
    risk_id: int
    explanation: str
    similar_cases: List[Dict[str, Any]]


@router.post("/risk", response_model=ExplainRiskResponse)
async def explain_risk(
    request: ExplainRiskRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get natural language explanation for a risk assessment
    
    Uses RAG to provide detailed, contextual explanations
    
    - **risk_id**: ID of the risk assessment to explain
    """
    # Get risk from database
    risk = db.query(Risk).filter(Risk.id == request.risk_id).first()
    
    if not risk:
        raise HTTPException(status_code=404, detail="Risk assessment not found")
    
    # Generate explanation using RAG
    explanation = rag_explainability.explain_risk(
        risk_score=risk.risk_score,
        risk_level=risk.risk_level,
        risk_factors=risk.risk_factors or [],
        features=risk.features or {}
    )
    
    # Query similar cases
    similar_cases = rag_explainability.query_similar_cases(
        risk_score=risk.risk_score,
        features=risk.features or {}
    )
    
    return {
        "risk_id": risk.id,
        "explanation": explanation,
        "similar_cases": similar_cases
    }
