"""
Audit log model for tracking all actions
"""
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from db.base import Base


class AuditLog(Base):
    """Audit trail for all system actions"""
    
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False, index=True)  # risk_assessed, alert_created, etc.
    entity_type = Column(String, nullable=True)
    entity_id = Column(String, nullable=True, index=True)
    details = Column(JSON)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    def __repr__(self):
        return f"<AuditLog {self.action} by user {self.user_id}>"
