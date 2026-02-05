"""
Alerts router (API endpoints)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.alerts.models import Alert
from app.alerts.schemas import AlertResponse, AlertAcknowledge, AlertResolve
from app.alerts.service import AlertService
from app.core.dependencies import get_current_user, get_current_active_analyst
from db.session import get_db

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertResponse])
async def get_alerts(
    active_only: bool = Query(True, description="Return only unresolved alerts"),
    severity: str = Query(None, description="Filter by severity (high, critical)"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get alerts with optional filters
    
    - **active_only**: Return only unresolved alerts
    - **severity**: Filter by severity level
    - **limit**: Maximum number of alerts to return
    """
    query = db.query(Alert).order_by(Alert.created_at.desc())
    
    if active_only:
        query = query.filter(Alert.is_resolved == False)
    
    if severity:
        query = query.filter(Alert.severity == severity.lower())
    
    alerts = query.limit(limit).all()
    return alerts


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: int,
    payload: AlertAcknowledge = AlertAcknowledge(),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_analyst)
):
    """
    Acknowledge an alert
    
    - **alert_id**: ID of the alert to acknowledge
    - **notes**: Optional acknowledgment notes
    """
    alert = AlertService.acknowledge_alert(
        db=db,
        alert_id=alert_id,
        user_id=current_user.id,
        notes=payload.notes
    )
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return alert


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: int,
    payload: AlertResolve,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_analyst)
):
    """
    Resolve an alert
    
    - **alert_id**: ID of the alert to resolve
    - **resolution_notes**: Notes explaining the resolution
    """
    alert = AlertService.resolve_alert(
        db=db,
        alert_id=alert_id,
        user_id=current_user.id,
        resolution_notes=payload.resolution_notes
    )
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return alert


@router.get("/stats", response_model=dict)
async def get_alert_statistics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get alert statistics"""
    from sqlalchemy import func
    
    total = db.query(func.count(Alert.id)).scalar() or 0
    active = db.query(func.count(Alert.id)).filter(Alert.is_resolved == False).scalar() or 0
    acknowledged = db.query(func.count(Alert.id)).filter(Alert.is_acknowledged == True).scalar() or 0
    
    return {
        "total_alerts": total,
        "active_alerts": active,
        "acknowledged_alerts": acknowledged,
        "resolved_alerts": total - active
    }
