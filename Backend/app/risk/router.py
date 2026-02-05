"""
Risk router (API endpoints)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.risk.models import Risk
from app.risk.schemas import RiskResponse
from app.core.dependencies import get_current_user, get_current_active_analyst
from db.session import get_db

router = APIRouter(prefix="/risk", tags=["Risk Management"])


@router.get("/live", response_model=List[RiskResponse])
async def get_live_risks(
    limit: int = Query(50, ge=1, le=1000),
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get recent live risk assessments
    
    - **limit**: Maximum number of records to return (1-1000)
    - **risk_level**: Filter by risk level (low, medium, high, critical)
    """
    query = db.query(Risk).order_by(Risk.created_at.desc())
    
    if risk_level:
        query = query.filter(Risk.risk_level == risk_level.lower())
    
    risks = query.limit(limit).all()
    return risks


@router.get("/{risk_id}", response_model=RiskResponse)
async def get_risk_by_id(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get specific risk assessment by ID
    
    - **risk_id**: Risk assessment ID
    """
    risk = db.query(Risk).filter(Risk.id == risk_id).first()
    
    if not risk:
        raise HTTPException(status_code=404, detail="Risk assessment not found")
    
    return risk


@router.get("/history", response_model=List[RiskResponse])
async def get_risk_history(
    entity_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_analyst)
):
    """
    Get historical risk assessments with filters
    
    - **entity_id**: Filter by entity ID
    - **entity_type**: Filter by entity type
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    query = db.query(Risk).order_by(Risk.created_at.desc())
    
    if entity_id:
        query = query.filter(Risk.entity_id == entity_id)
    
    if entity_type:
        query = query.filter(Risk.entity_type == entity_type)
    
    risks = query.offset(skip).limit(limit).all()
    return risks


@router.get("/stats", response_model=dict)
async def get_risk_statistics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_analyst)
):
    """
    Get risk statistics summary
    """
    from sqlalchemy import func
    
    # Count by risk level
    level_counts = db.query(
        Risk.risk_level,
        func.count(Risk.id).label("count")
    ).group_by(Risk.risk_level).all()
    
    # Average risk score
    avg_score = db.query(func.avg(Risk.risk_score)).scalar() or 0.0
    
    # Total assessments
    total = db.query(func.count(Risk.id)).scalar() or 0
    
    stats = {
        "total_assessments": total,
        "average_risk_score": round(avg_score, 3),
        "by_level": {level: count for level, count in level_counts}
    }
    
    return stats
