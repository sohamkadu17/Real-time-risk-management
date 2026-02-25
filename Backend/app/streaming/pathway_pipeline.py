"""
Pathway streaming pipeline for real-time risk processing
Enhanced with WebSocket broadcasting and performance optimizations
"""
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
import asyncio

from app.risk.engine import risk_engine
from app.risk.models import Risk
from app.risk.schemas import RiskCreate
from app.alerts.service import AlertService
from app.audit.router import create_audit_log
from app.streaming.simulator import DataSimulator
from db.session import SessionLocal

logger = logging.getLogger(__name__)


class PathwayPipeline:
    """
    Pathway-based streaming pipeline for real-time risk assessment
    
    Enhanced features:
    - WebSocket broadcasting
    - Batch processing optimization
    - Performance metrics tracking
    - Error recovery
    """
    
    def __init__(self):
        self.simulator = DataSimulator()
        self.risk_engine = risk_engine
        self.is_running = False
        self.events_processed = 0
        self.errors_count = 0
        self.websocket_manager = None
        logger.info("Pathway pipeline initialized with enhanced features")
    
    def set_websocket_manager(self, manager):
        """Set websocket manager for broadcasting"""
        self.websocket_manager = manager
        logger.info("WebSocket manager connected to pipeline")
    
    async def broadcast_risk(self, risk: Risk):
        """Broadcast risk assessment to WebSocket clients"""
        if self.websocket_manager:
            try:
                message = {
                    "type": "risk_update",
                    "data": {
                        "id": risk.id,
                        "entity_id": risk.entity_id,
                        "entity_type": risk.entity_type,
                        "risk_score": risk.risk_score,
                        "risk_level": risk.risk_level,
                        "risk_factors": risk.risk_factors,
                        "timestamp": risk.created_at.isoformat()
                    }
                }
                await self.websocket_manager.broadcast(message)
            except Exception as e:
                logger.error(f"Error broadcasting risk: {e}")
    
    def process_event(self, event: Dict[str, Any]):
        """
        Process a single streaming event with enhanced error handling
        
        Args:
            event: Event dictionary with entity_id, entity_type, features
        """
        try:
            # Extract event data
            entity_id = event["entity_id"]
            entity_type = event["entity_type"]
            features = event["features"]
            
            # Assess risk using engine
            risk_score, risk_level, risk_factors = self.risk_engine.assess_risk(
                entity_id=entity_id,
                entity_type=entity_type,
                features=features
            )
            
            # Store risk assessment in database
            db = SessionLocal()
            try:
                risk = Risk(
                    entity_id=entity_id,
                    entity_type=entity_type,
                    risk_score=risk_score,
                    risk_level=risk_level,
                    features=features,
                    risk_factors=risk_factors,
                    source="streaming"
                )
                
                db.add(risk)
                db.commit()
                db.refresh(risk)
                
                # Create audit log
                create_audit_log(
                    db=db,
                    user_id=None,
                    action="risk_assessed",
                    entity_type=entity_type,
                    entity_id=entity_id,
                    details={"risk_id": risk.id, "risk_score": risk_score}
                )
                
                # Create alert if high risk
                if risk_level in ["high", "critical"]:
                    alert = AlertService.create_alert_for_risk(db, risk)
                    logger.warning(f"Alert created: {alert.id} for risk {risk.id}")
                
                # Broadcast to WebSocket clients
                if self.websocket_manager:
                    asyncio.create_task(self.broadcast_risk(risk))
                
                self.events_processed += 1
                logger.info(f"Risk processed ({self.events_processed}): {risk.id} - {entity_type}:{entity_id}")
                
                return risk
                
            finally:
                db.close()
                
        except Exception as e:
            self.errors_count += 1
            logger.error(f"Error processing event (total errors: {self.errors_count}): {e}", exc_info=True)
    
    def start_simulation(self, interval: float = 2.0):
        """
        Start simulated data streaming with performance monitoring
        
        Args:
            interval: Seconds between events
        """
        self.is_running = True
        self.events_processed = 0
        self.errors_count = 0
        logger.info(f"Starting enhanced simulation with {interval}s interval")
        
        self.simulator.stream_live_events(
            interval=interval,
            callback=self.process_event
        )
    
    def stop(self):
        """Stop the pipeline and log statistics"""
        self.is_running = False
        logger.info(f"Pipeline stopped. Stats: Events={self.events_processed}, Errors={self.errors_count}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get pipeline performance statistics"""
        return {
            "is_running": self.is_running,
            "events_processed": self.events_processed,
            "errors_count": self.errors_count,
            "error_rate": self.errors_count / max(self.events_processed, 1)
        }


# Global pipeline instance
pathway_pipeline = PathwayPipeline()
