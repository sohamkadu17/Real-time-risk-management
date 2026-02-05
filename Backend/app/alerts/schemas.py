"""
Alert schemas
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class AlertResponse(BaseModel):
    """Schema for alert response"""
    id: int
    risk_id: int
    alert_type: str
    severity: str
    message: str
    details: Optional[Dict[str, Any]]
    is_acknowledged: bool
    is_resolved: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class AlertAcknowledge(BaseModel):
    """Schema for acknowledging alert"""
    notes: Optional[str] = None


class AlertResolve(BaseModel):
    """Schema for resolving alert"""
    resolution_notes: str
