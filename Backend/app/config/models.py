"""
Configuration database models
"""
from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from db.base import Base


class SystemConfiguration(Base):
    """Store system configuration in database"""
    __tablename__ = "system_configurations"

    id = Column(Integer, primary_key=True, index=True)
    
    # Risk thresholds
    risk_high_threshold = Column(Integer, default=80)  # Stored as percentage (0-100)
    risk_medium_threshold = Column(Integer, default=50)
    risk_low_threshold = Column(Integer, default=30)
    
    # Streaming settings
    stream_buffer_size = Column(Integer, default=1000)
    pathway_monitoring_enabled = Column(Boolean, default=True)
    stream_event_interval = Column(Integer, default=3)  # seconds
    
    # Alert settings
    auto_acknowledge_minutes = Column(Integer, default=60)
    alert_retention_days = Column(Integer, default=30)
    max_alerts_per_user = Column(Integer, default=500)
    
    # General
    debug_mode = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    created_by = Column(String(255), default="system")
    updated_by = Column(String(255), default="system")
    
    # Full config as JSON backup
    config_snapshot = Column(JSON, nullable=True, doc="Complete config snapshot for audit")

    def __repr__(self):
        return f"<SystemConfiguration id={self.id} updated_at={self.updated_at}>"
