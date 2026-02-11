"""
Config schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RiskThresholds(BaseModel):
    """Risk threshold configuration"""
    high_threshold: float = Field(default=0.8, ge=0.0, le=1.0, description="High risk threshold (0-1)")
    medium_threshold: float = Field(default=0.5, ge=0.0, le=1.0, description="Medium risk threshold (0-1)")
    low_threshold: float = Field(default=0.3, ge=0.0, le=1.0, description="Low risk threshold (0-1)")

    class Config:
        description = "Risk assessment thresholds"


class StreamingConfig(BaseModel):
    """Streaming configuration"""
    buffer_size: int = Field(default=1000, ge=100, le=10000, description="Streaming buffer size")
    monitoring_enabled: bool = Field(default=True, description="Enable Pathway monitoring")
    event_interval_seconds: float = Field(default=3.0, ge=0.1, le=60.0, description="Event generation interval")

    class Config:
        description = "Streaming pipeline configuration"


class AlertConfig(BaseModel):
    """Alert configuration"""
    auto_acknowledge_duration_minutes: int = Field(default=60, ge=1, le=1440, description="Auto-acknowledge after N minutes")
    alert_retention_days: int = Field(default=30, ge=1, le=365, description="Keep alerts for N days")
    max_alerts_per_user: int = Field(default=500, ge=10, le=10000, description="Max alerts per user")

    class Config:
        description = "Alert system configuration"


class SystemConfig(BaseModel):
    """Complete system configuration"""
    risk_thresholds: RiskThresholds = Field(default_factory=RiskThresholds)
    streaming: StreamingConfig = Field(default_factory=StreamingConfig)
    alerts: AlertConfig = Field(default_factory=AlertConfig)
    debug_mode: bool = Field(default=False, description="Enable debug logging")

    class Config:
        description = "Complete system configuration"


class ConfigResponse(BaseModel):
    """Config response model"""
    id: int
    config: SystemConfig
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str

    class Config:
        from_attributes = True


class ConfigUpdateRequest(BaseModel):
    """Request to update configuration"""
    risk_thresholds: Optional[RiskThresholds] = None
    streaming: Optional[StreamingConfig] = None
    alerts: Optional[AlertConfig] = None
    debug_mode: Optional[bool] = None

    class Config:
        description = "Partial or full configuration update"
