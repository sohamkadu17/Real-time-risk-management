"""
Streaming pipeline for real-time risk processing
Implements Pathway-inspired streaming concepts (Windows-compatible)

NOTE: Full Pathway framework requires Linux/WSL2. This implementation
uses streaming concepts inspired by Pathway's auto-update architecture.

For production deployment with real Pathway:
- Use WSL2 on Windows: wsl --install -d Ubuntu
- Or deploy to Linux server
- Or use Docker container
"""
import logging
from typing import Dict, Any, List, Callable, Optional
from sqlalchemy.orm import Session
import asyncio
from datetime import datetime
import threading
import time
from queue import Queue
import json

from app.risk.engine import risk_engine
from app.risk.models import Risk
from app.risk.schemas import RiskCreate
from app.alerts.service import AlertService
from app.audit.router import create_audit_log
from app.streaming.simulator import DataSimulator
from db.session import SessionLocal

logger = logging.getLogger(__name__)


class StreamingDataSource:
    """
    Streaming data source with auto-update capability
    Inspired by Pathway's pw.io.python.ConnectorSubject
    
    Key Feature: Data is automatically processed when it arrives,
    not through manual polling loops!
    """
    def __init__(self):
        self.simulator = DataSimulator()
        self.is_active = False
        self._thread = None
        self._subscribers: List[Callable] = []
        self._event_queue = Queue()
        
    def subscribe(self, callback: Callable):
        """Subscribe to automatic data updates"""
        self._subscribers.append(callback)
        logger.info(f"Subscriber added to streaming source (total: {len(self._subscribers)})")
    
    def start_feeding(self, interval: float = 2.0):
        """Start feeding data with auto-notification to subscribers"""
        self.is_active = True
        self._thread = threading.Thread(target=self._feed_loop, args=(interval,), daemon=True)
        self._thread.start()
        logger.info(f"✅ Streaming data source started (auto-update mode, interval={interval}s)")
    
    def _feed_loop(self, interval: float):
        """Feed data continuously and trigger auto-updates"""
        while self.is_active:
            try:
                # Generate market event
                event = self.simulator.generate_event()
                
                # Create streaming record (like Pathway's Row)
                record = {
                    "entity_id": str(event["entity_id"]),
                    "entity_type": event["entity_type"],
                    "timestamp": datetime.now().isoformat(),
                    "features": event["features"],
                    "spot_price": event["features"].get("spot_price", 0.0),
                    "volatility": event["features"].get("volatility", 0.0),
                    "volume": event["features"].get("volume", 0.0),
                    "symbol": event["features"].get("symbol", "UNKNOWN")
                }
                
                # AUTO-UPDATE: Notify all subscribers (like Pathway's auto-processing)
                for callback in self._subscribers:
                    try:
                        callback(record)
                    except Exception as e:
                        logger.error(f"Error in subscriber callback: {e}")
                        
            except Exception as e:
                logger.error(f"Error in streaming feed loop: {e}")
            
            time.sleep(interval)
    
    def stop_feeding(self):
        """Stop feeding data"""
        self.is_active = False
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("Streaming data source stopped")


class PathwayPipeline:
    """
    Streaming pipeline for real-time risk assessment
    Uses Pathway-inspired auto-update architecture for real-time processing
    
    KEY HACKATHON FEATURE: Automatic processing when new data arrives!
    
    Architecture:
    - StreamingDataSource generates events
    - Pipeline subscribes to auto-updates (like Pathway's pw.io.write callbacks)
    - Risk processing happens automatically on data arrival
    - No manual polling loops!
    
    Note: For full Pathway framework, deploy on Linux/WSL2:
    - pip install pathway (on Linux/WSL)
    - Use pw.io.python.read() and pw.run()
    """
    
    def __init__(self):
        self.risk_engine = risk_engine
        self.is_running = False
        self.events_processed = 0
        self.errors_count = 0
        self.websocket_manager = None
        self.data_source = StreamingDataSource()
        logger.info("🚀 Streaming pipeline initialized (Pathway-inspired auto-update architecture)")
    
    def set_websocket_manager(self, manager):
        """Set websocket manager for broadcasting"""
        self.websocket_manager = manager
        logger.info("WebSocket manager connected to Pathway pipeline")
    
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
    
    def _process_streaming_record(self, record: Dict[str, Any]):
        """
        Process a streaming record automatically when it arrives
        THIS IS CALLED AUTOMATICALLY - THE KEY HACKATHON FEATURE!
        
        Similar to Pathway's pw.io.python.write() callback that fires
        automatically on new data arrival.
        
        Args:
            record: Streaming data record with market event
        """
        try:
            # Extract data from streaming record
            entity_id = str(record["entity_id"])
            entity_type = str(record["entity_type"])
            features = record.get("features", {})
            
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
                    source="streaming_auto_update"  # Mark as auto-update sourced!
                )
                
                db.add(risk)
                db.commit()
                db.refresh(risk)
                
                # Create audit log
                create_audit_log(
                    db=db,
                    user_id=None,
                    action="risk_assessed_streaming",
                    entity_type=entity_type,
                    entity_id=entity_id,
                    details={"risk_id": risk.id, "risk_score": risk_score, "source": "streaming_auto"}
                )
                
                # Create alert if high risk
                if risk_level in ["high", "critical"]:
                    alert = AlertService.create_alert_for_risk(db, risk)
                    logger.warning(f"🚨 Auto-alert created: {alert.id} for risk {risk.id}")
                
                # Broadcast to WebSocket clients
                if self.websocket_manager:
                    asyncio.create_task(self.broadcast_risk(risk))
                
                self.events_processed += 1
                logger.info(f"✅ Auto-processed ({self.events_processed}): {risk.id} - {entity_type}:{entity_id} [streaming-auto-update]")
                
                return risk
                
            finally:
                db.close()
                
        except Exception as e:
            self.errors_count += 1
            logger.error(f"Error processing streaming record (total errors: {self.errors_count}): {e}", exc_info=True)
    
    def start_simulation(self, interval: float = 2.0):
        """
        Start streaming pipeline with automatic processing
        Data is processed automatically when it arrives - no manual polling!
        
        KEY FEATURE: Subscribes to data source updates (like Pathway's pw.io.write callbacks)
        Processing happens automatically when new data arrives.
        
        Args:
            interval: Seconds between data generation
        """
        if self.is_running:
            logger.warning("⚠️  Streaming pipeline already running")
            return
            
        self.is_running = True
        self.events_processed = 0
        self.errors_count = 0
        
        logger.info(f"🚀 Starting streaming pipeline with AUTO-UPDATE (interval={interval}s)")
        logger.info("📊 Using Pathway-inspired architecture: data processed automatically on arrival")
        
        # Subscribe to data source (like Pathway's pw.io.python.write())
        # THIS IS THE KEY: _process_streaming_record is called AUTOMATICALLY!
        self.data_source.subscribe(self._process_streaming_record)
        
        # Start data source feeding
        self.data_source.start_feeding(interval=interval)
        
        logger.info("✅ Streaming pipeline ACTIVE - data will be processed automatically!")
        logger.info("💡 System updates automatically when new data arrives (no manual polling)")

    
    def stop(self):
        """Stop the streaming pipeline and log statistics"""
        self.is_running = False
        self.data_source.stop_feeding()
        logger.info(f"✋ Streaming pipeline stopped. Stats: Events={self.events_processed}, Errors={self.errors_count}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get streaming pipeline performance statistics"""
        return {
            "is_running": self.is_running,
            "events_processed": self.events_processed,
            "errors_count": self.errors_count,
            "error_rate": self.errors_count / max(self.events_processed, 1),
            "framework": "Streaming (Pathway-inspired)",
            "auto_update": True,  # THE KEY: data processed automatically on arrival!
            "architecture": "Event-driven with auto-callbacks",
            "platform": "Windows-compatible",
            "note": "For full Pathway, deploy on Linux/WSL2"
        }


# Global pipeline instance
pathway_pipeline = PathwayPipeline()
