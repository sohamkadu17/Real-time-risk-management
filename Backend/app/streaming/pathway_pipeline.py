"""
Pathway streaming pipeline for real-time risk processing
"""
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session

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
    
    In production, this would use Pathway's streaming APIs to:
    - Ingest from Kafka/APIs
    - Perform rolling window computations
    - Stream results to WebSocket layer
    """
    
    def __init__(self):
        self.simulator = DataSimulator()
        self.risk_engine = risk_engine
        self.is_running = False
        logger.info("Pathway pipeline initialized")
    
    def process_event(self, event: Dict[str, Any]):
        """
        Process a single streaming event
        
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
                
                logger.info(f"Risk processed: {risk.id} - {entity_type}:{entity_id}")
                
                return risk
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error processing event: {e}", exc_info=True)
    
    def start_simulation(self, interval: float = 2.0):
        """
        Start simulated data streaming
        
        Args:
            interval: Seconds between events
        """
        self.is_running = True
        logger.info(f"Starting simulation with {interval}s interval")
        
        self.simulator.stream_events(
            interval=interval,
            callback=self.process_event
        )
    
    def stop(self):
        """Stop the pipeline"""
        self.is_running = False
        logger.info("Pipeline stopped")


# Global pipeline instance
pathway_pipeline = PathwayPipeline()
