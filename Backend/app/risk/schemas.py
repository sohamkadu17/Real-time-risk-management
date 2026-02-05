"""
Pydantic schemas for risk assessments
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime


class RiskBase(BaseModel):
    """Base risk schema"""
    entity_id: str
    entity_type: str
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str  # low, medium, high, critical


class RiskCreate(RiskBase):
    """Schema for creating risk assessment"""
    confidence: Optional[float] = 1.0
    features: Optional[Dict[str, Any]] = None
    risk_factors: Optional[List[str]] = None
    source: Optional[str] = "streaming"


class RiskResponse(RiskBase):
    """Schema for risk response"""
    id: int
    confidence: float
    features: Optional[Dict[str, Any]]
    risk_factors: Optional[List[str]]
    source: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class RiskUpdate(BaseModel):
    """Stream update for real-time risk"""
    entity_id: str
    entity_type: str
    risk_score: float
    risk_level: str
    timestamp: datetime
    features: Optional[Dict[str, Any]] = None
