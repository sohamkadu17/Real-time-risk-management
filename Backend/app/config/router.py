"""
Configuration router (API endpoints)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.config.schemas import ConfigResponse, ConfigUpdateRequest, SystemConfig, RiskThresholds, StreamingConfig, AlertConfig
from app.config.models import SystemConfiguration
from app.core.dependencies import get_current_user, get_current_active_admin
from db.session import get_db
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/config", tags=["Configuration"])


def _get_current_config(db: Session) -> SystemConfiguration:
    """Get the latest configuration from database"""
    config = db.query(SystemConfiguration).order_by(SystemConfiguration.id.desc()).first()
    if not config:
        # Create default config
        config = SystemConfiguration()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def _config_to_response(db_config: SystemConfiguration) -> ConfigResponse:
    """Convert database model to API response"""
    system_config = SystemConfig(
        risk_thresholds=RiskThresholds(
            high_threshold=db_config.risk_high_threshold / 100.0,
            medium_threshold=db_config.risk_medium_threshold / 100.0,
            low_threshold=db_config.risk_low_threshold / 100.0,
        ),
        streaming=StreamingConfig(
            buffer_size=db_config.stream_buffer_size,
            monitoring_enabled=db_config.pathway_monitoring_enabled,
            event_interval_seconds=float(db_config.stream_event_interval),
        ),
        alerts=AlertConfig(
            auto_acknowledge_duration_minutes=db_config.auto_acknowledge_minutes,
            alert_retention_days=db_config.alert_retention_days,
            max_alerts_per_user=db_config.max_alerts_per_user,
        ),
        debug_mode=db_config.debug_mode,
    )
    
    return ConfigResponse(
        id=db_config.id,
        config=system_config,
        created_at=db_config.created_at,
        updated_at=db_config.updated_at,
        created_by=db_config.created_by,
        updated_by=db_config.updated_by,
    )


@router.get("", response_model=ConfigResponse, summary="Get current system configuration")
async def get_config(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get the current system configuration.
    
    **Available to**: All authenticated users (read-only)
    """
    try:
        config = _get_current_config(db)
        return _config_to_response(config)
    except Exception as e:
        logger.error(f"Error fetching config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch configuration"
        )


@router.put("", response_model=ConfigResponse, summary="Update system configuration", status_code=status.HTTP_200_OK)
async def update_config(
    config_update: ConfigUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin)
):
    """
    Update system configuration (ADMIN ONLY).
    
    **Available to**: Admin users only
    
    **Parameters:**
    - `risk_thresholds`: Update risk assessment thresholds (0.0-1.0)
    - `streaming`: Update streaming pipeline settings
    - `alerts`: Update alert system settings
    - `debug_mode`: Enable/disable debug logging
    
    **Note**: All fields are optional. Only provided fields will be updated.
    """
    try:
        current_config = _get_current_config(db)
        
        # Update risk thresholds
        if config_update.risk_thresholds:
            current_config.risk_high_threshold = int(config_update.risk_thresholds.high_threshold * 100)
            current_config.risk_medium_threshold = int(config_update.risk_thresholds.medium_threshold * 100)
            current_config.risk_low_threshold = int(config_update.risk_thresholds.low_threshold * 100)
            logger.info(f"Updated risk thresholds: high={current_config.risk_high_threshold}% medium={current_config.risk_medium_threshold}% low={current_config.risk_low_threshold}%")
        
        # Update streaming settings
        if config_update.streaming:
            current_config.stream_buffer_size = config_update.streaming.buffer_size
            current_config.pathway_monitoring_enabled = config_update.streaming.monitoring_enabled
            current_config.stream_event_interval = int(config_update.streaming.event_interval_seconds)
            logger.info(f"Updated streaming: buffer={current_config.stream_buffer_size} interval={current_config.stream_event_interval}s")
        
        # Update alert settings
        if config_update.alerts:
            current_config.auto_acknowledge_minutes = config_update.alerts.auto_acknowledge_duration_minutes
            current_config.alert_retention_days = config_update.alerts.alert_retention_days
            current_config.max_alerts_per_user = config_update.alerts.max_alerts_per_user
            logger.info(f"Updated alerts: auto_ack={current_config.auto_acknowledge_minutes}min retention={current_config.alert_retention_days}d")
        
        # Update debug mode
        if config_update.debug_mode is not None:
            current_config.debug_mode = config_update.debug_mode
            logger.info(f"Updated debug_mode: {current_config.debug_mode}")
        
        # Update metadata
        current_config.updated_by = current_user.username
        
        # Commit changes
        db.commit()
        db.refresh(current_config)
        
        logger.info(f"Configuration updated by user: {current_user.username}")
        return _config_to_response(current_config)
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update configuration"
        )


@router.get("/validate", summary="Validate configuration")
async def validate_config(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Validate that current configuration is sensible.
    
    Checks:
    - Risk thresholds are in ascending order: low < medium < high
    - All thresholds are between 0.0 and 1.0
    - Streaming buffer size is reasonable (100-10000)
    - Alert retention is positive (1-365 days)
    """
    try:
        config = _get_current_config(db)
        errors = []
        
        # Validate thresholds
        high = config.risk_high_threshold / 100.0
        medium = config.risk_medium_threshold / 100.0
        low = config.risk_low_threshold / 100.0
        
        if not (low < medium < high):
            errors.append(f"Risk thresholds must be ascending: low({low}) < medium({medium}) < high({high})")
        
        if not all(0.0 <= t <= 1.0 for t in [low, medium, high]):
            errors.append("All risk thresholds must be between 0.0 and 1.0")
        
        if config.stream_buffer_size < 100 or config.stream_buffer_size > 10000:
            errors.append(f"Stream buffer size must be 100-10000, got {config.stream_buffer_size}")
        
        if config.alert_retention_days < 1 or config.alert_retention_days > 365:
            errors.append(f"Alert retention must be 1-365 days, got {config.alert_retention_days}")
        
        if errors:
            return {
                "valid": False,
                "errors": errors
            }
        
        return {
            "valid": True,
            "message": "Configuration is valid",
            "config": _config_to_response(config)
        }
        
    except Exception as e:
        logger.error(f"Error validating config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate configuration"
        )
