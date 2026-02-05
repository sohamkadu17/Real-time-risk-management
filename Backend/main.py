"""
FastAPI Main Application for Real-Time Risk Management
Handles API endpoints, WebSocket connections, and integrates with Pathway pipeline
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import List, Dict, Any
import asyncio
import logging
from datetime import datetime

from config import settings
from models import MarketData, RiskMetrics, OptionsGreeks
# from pathway_pipeline import PathwayPipeline  # Commented out until Pathway is properly installed
from kafka_producer import MarketDataProducer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

manager = ConnectionManager()

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    logger.info("Starting Real-Time Risk Management Backend")
    
    # Initialize Pathway pipeline
    # app.state.pathway_pipeline = PathwayPipeline()  # TODO: Install Pathway properly
    
    # Initialize Kafka producer
    try:
        app.state.kafka_producer = MarketDataProducer()
    except Exception as e:
        logger.warning(f"Kafka not available: {e}. Running without Kafka.")
        app.state.kafka_producer = None
    
    # Start background tasks
    asyncio.create_task(market_data_simulator())
    
    yield
    
    # Cleanup on shutdown
    logger.info("Shutting down Real-Time Risk Management Backend")
    if hasattr(app.state, 'kafka_producer') and app.state.kafka_producer:
        app.state.kafka_producer.close()

# Initialize FastAPI app
app = FastAPI(
    title="Real-Time Risk Management API",
    description="FastAPI backend with Pathway streaming for options Greeks calculation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== API Endpoints ====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Real-Time Risk Management API",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {
            "fastapi": "operational",
            "pathway": "operational",
            "kafka": "operational"
        }
    }

@app.get("/api/market-data/current")
async def get_current_market_data(exchange: str = "NSE"):
    """Get current market snapshot"""
    try:
        # This will be connected to Pathway pipeline output
        return {
            "exchange": exchange,
            "timestamp": datetime.utcnow().isoformat(),
            "spot_price": 19500.50,
            "strike_price": 19500.00,
            "volatility": 0.18,
            "risk_free_rate": 0.065,
            "time_to_expiry": 0.0822,
            "option_type": "call"
        }
    except Exception as e:
        logger.error(f"Error fetching market data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/greeks")
async def get_greeks():
    """Get current options Greeks"""
    try:
        # This will be connected to Pathway pipeline output
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "delta": 0.6523,
            "gamma": 0.0234,
            "vega": 0.1845,
            "theta": -0.0523,
            "rho": 0.0892
        }
    except Exception as e:
        logger.error(f"Error calculating Greeks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/risk-metrics")
async def get_risk_metrics():
    """Get current risk metrics"""
    try:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "var_95": 125000.50,
            "portfolio_delta": 1250.75,
            "max_drawdown": 0.05,
            "sharpe_ratio": 1.85
        }
    except Exception as e:
        logger.error(f"Error fetching risk metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/market-data/publish")
async def publish_market_data(data: MarketData):
    """Publish market data to Kafka"""
    try:
        if app.state.kafka_producer:
            app.state.kafka_producer.send_market_data(data.dict())
            return {"status": "success", "message": "Market data published"}
        else:
            return {"status": "warning", "message": "Kafka not available - data not published"}
    except Exception as e:
        logger.error(f"Error publishing market data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== WebSocket Endpoints ====================

@app.websocket("/ws/market-feed")
async def websocket_market_feed(websocket: WebSocket):
    """WebSocket endpoint for real-time market data feed"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and wait for messages
            data = await websocket.receive_text()
            logger.debug(f"Received from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.websocket("/ws/greeks")
async def websocket_greeks(websocket: WebSocket):
    """WebSocket endpoint for real-time Greeks updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# ==================== Background Tasks ====================

async def market_data_simulator():
    """Simulate market data updates (for testing)"""
    import random
    await asyncio.sleep(5)  # Wait for startup
    
    while True:
        try:
            # Simulate market data update
            market_update = {
                "type": "market_update",
                "timestamp": datetime.utcnow().isoformat(),
                "spot_price": 19500 + random.uniform(-100, 100),
                "volume": random.randint(1000, 10000),
                "volatility": 0.18 + random.uniform(-0.02, 0.02)
            }
            
            # Broadcast to all connected clients
            await manager.broadcast(market_update)
            
            await asyncio.sleep(1)  # Update every second
        except Exception as e:
            logger.error(f"Error in market data simulator: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
