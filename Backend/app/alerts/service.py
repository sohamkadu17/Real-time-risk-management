"""
Alert service for managing alerts
"""
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import logging

from app.alerts.models import Alert
from app.risk.models import Risk

logger = logging.getLogger(__name__)


class AlertService:
    """Service for alert management"""
    
    @staticmethod
    def create_alert_for_risk(
        db: Session,
        risk: Risk,
        alert_type: str = "threshold"
    ) -> Alert:
        """
        Create an alert for a high-risk assessment
        
        Args:
            db: Database session
            risk: Risk model instance
            alert_type: Type of alert
            
        Returns:
            Created alert
        """
        severity = "critical" if risk.risk_score >= 0.9 else "high"
        
        message = f"High risk detected for {risk.entity_type} {risk.entity_id}"
        
        alert = Alert(
            risk_id=risk.id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            details={
                "risk_score": risk.risk_score,
                "risk_level": risk.risk_level,
                "risk_factors": risk.risk_factors
            }
        )
        
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        logger.info(f"Alert created: {alert.id} for risk {risk.id}")
        
        return alert
    
    @staticmethod
    def acknowledge_alert(
        db: Session,
        alert_id: int,
        user_id: int,
        notes: str = None
    ) -> Alert:
        """
        Acknowledge an alert
        
        Args:
            db: Database session
            alert_id: Alert ID
            user_id: User acknowledging the alert
            notes: Optional notes
            
        Returns:
            Updated alert
        """
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        
        if alert:
            alert.is_acknowledged = True
            alert.acknowledged_by = user_id
            alert.acknowledged_at = datetime.utcnow()
            
            db.commit()
            db.refresh(alert)
            
            logger.info(f"Alert {alert_id} acknowledged by user {user_id}")
        
        return alert
    
    @staticmethod
    def resolve_alert(
        db: Session,
        alert_id: int,
        user_id: int,
        resolution_notes: str
    ) -> Alert:
        """
        Resolve an alert
        
        Args:
            db: Database session
            alert_id: Alert ID
            user_id: User resolving the alert
            resolution_notes: Resolution notes
            
        Returns:
            Updated alert
        """
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        
        if alert:
            alert.is_resolved = True
            alert.resolved_by = user_id
            alert.resolved_at = datetime.utcnow()
            alert.resolution_notes = resolution_notes
            
            db.commit()
            db.refresh(alert)
            
            logger.info(f"Alert {alert_id} resolved by user {user_id}")
        
        return alert
    
    @staticmethod
    def get_active_alerts(db: Session, limit: int = 100) -> List[Alert]:
        """
        Get all unresolved alerts
        
        Args:
            db: Database session
            limit: Maximum number of alerts
            
        Returns:
            List of active alerts
        """
        return db.query(Alert).filter(
            Alert.is_resolved == False
        ).order_by(
            Alert.created_at.desc()
        ).limit(limit).all()
