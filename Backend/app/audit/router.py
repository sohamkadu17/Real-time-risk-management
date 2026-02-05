"""
Audit router for querying audit logs
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.audit.models import AuditLog
from app.core.dependencies import get_current_active_admin
from db.session import get_db

router = APIRouter(prefix="/audit", tags=["Audit"])


class AuditLogResponse(BaseModel):
    """Audit log response schema"""
    id: int
    user_id: Optional[int]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[str]
    details: Optional[dict]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    entity_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin)
):
    """
    Get audit logs (Admin only)
    
    - **action**: Filter by action type
    - **user_id**: Filter by user
    - **entity_id**: Filter by entity
    - **skip**: Number of records to skip
    - **limit**: Maximum records to return
    """
    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    
    logs = query.offset(skip).limit(limit).all()
    return logs


def create_audit_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    details: Optional[dict] = None
):
    """Helper function to create audit log entries"""
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    db.add(log)
    db.commit()
