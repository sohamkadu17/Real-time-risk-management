"""
Main FastAPI application for Real-Time Risk Management System
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import threading

from app.core.config import settings
from app.core.middleware import ErrorHandlerMiddleware, RequestLoggingMiddleware
from app.auth.router import router as auth_router
from app.risk.router import router as risk_router
from app.alerts.router import router as alerts_router
from app.explain.router import router as explain_router
from app.audit.router import router as audit_router
from app.config.router import router as config_router
from app.market.router import router as market_router
from app.websocket.manager import websocket_manager
from app.streaming.pathway_pipeline import pathway_pipeline
from db.session import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    """
    # Startup
    logger.info("="*60)
    logger.info(f"Starting {settings.APP_NAME}")
    logger.info("="*60)
    
    # Initialize database
    logger.info("Initializing database...")
    try:
        init_db()
        logger.info("✓ Database initialized")
    except Exception as e:
        logger.error(f"✗ Database initialization failed: {e}")
    
    # Connect WebSocket manager to pipeline for real-time broadcasting
    pathway_pipeline.set_websocket_manager(websocket_manager)
    
    # Hand the *running* asyncio event loop to the pipeline so its daemon
    # threads can schedule WebSocket coroutines via run_coroutine_threadsafe().
    # asyncio.get_running_loop() is the only safe, reliable way to obtain the
    # current event loop from an async context (works in Python 3.7–3.13+).
    import asyncio as _aio
    _loop = _aio.get_running_loop()
    pathway_pipeline.set_event_loop(_loop)
    
    # Start streaming pipeline in background thread
    logger.info("Starting streaming pipeline...")
    try:
        pipeline_thread = threading.Thread(
            target=pathway_pipeline.start_simulation,
            args=(3.0,),  # Generate event every 3 seconds
            daemon=True,
            name="pathway-pipeline",
        )
        pipeline_thread.start()
        logger.info("✓ Streaming pipeline started")
    except Exception as e:
        logger.error(f"✗ Pipeline start failed: {e}")
    
    logger.info(f"✓ {settings.APP_NAME} ready")
    logger.info(f"✓ API docs: http://{settings.HOST}:{settings.PORT}{settings.API_PREFIX}/docs")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    pathway_pipeline.stop()
    logger.info("✓ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Add custom middleware
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(risk_router, prefix=settings.API_PREFIX)
app.include_router(alerts_router, prefix=settings.API_PREFIX)
app.include_router(explain_router, prefix=settings.API_PREFIX)
app.include_router(audit_router, prefix=settings.API_PREFIX)
app.include_router(config_router, prefix=settings.API_PREFIX)
app.include_router(market_router, prefix=f"{settings.API_PREFIX}/market", tags=["market"])


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "websocket_connections": websocket_manager.get_connection_count()
    }


# Health check
@app.get(f"{settings.API_PREFIX}/health")
async def health_check():
    """Health check endpoint"""
    stats = pathway_pipeline.get_stats()
    return {
        "status": "healthy",
        "database": "connected",
        "streaming": {
            "status": "active" if pathway_pipeline.is_running else "inactive",
            "engine": stats.get("engine", "unknown"),
            "events_processed": stats.get("events_processed", 0),
            "errors": stats.get("errors_count", 0),
        },
        "websocket_connections": websocket_manager.get_connection_count(),
    }


# Configuration is now handled by the config router (app/config/router.py)
# GET  {settings.API_PREFIX}/config - Get current configuration
# PUT  {settings.API_PREFIX}/config - Update configuration (admin only)


# WebSocket endpoint
@app.websocket("/ws/risk-stream")
async def websocket_risk_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time risk updates.

    Clients connect here to receive live risk assessments and alerts.
    The handler keeps the connection alive by responding to "ping"
    with "pong" (used by the frontend heartbeat).
    """
    await websocket_manager.connect(websocket)

    try:
        while True:
            data = await websocket.receive_text()

            # Respond to heartbeat pings from the frontend
            if data.strip().lower() == "ping":
                await websocket.send_text("pong")
                continue

            # Echo other messages back (useful for debugging)
            await websocket.send_text(f"Received: {data}")

    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        websocket_manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
