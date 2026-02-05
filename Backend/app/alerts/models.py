"""
Alert model for risk notifications
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from db.base import Base


class Alert(Base):
    """Alert model for high-risk notifications"""
    
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    risk_id = Column(Integer, ForeignKey("risks.id"), nullable=False)
    alert_type = Column(String, nullable=False)  # threshold, pattern, anomaly
    severity = Column(String, nullable=False)  # high, critical
    message = Column(String, nullable=False)
    details = Column(JSON)
    
    # Alert status
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    # Resolution
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Alert {self.id} {self.severity} - {self.alert_type}>"
