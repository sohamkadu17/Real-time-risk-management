"""
WebSocket connection manager for real-time updates
"""
from fastapi import WebSocket
from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Manages WebSocket connections for real-time risk updates
    """
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        logger.info("WebSocket manager initialized")
    
    async def connect(self, websocket: WebSocket):
        """
        Accept and register a new WebSocket connection
        
        Args:
            websocket: FastAPI WebSocket instance
        """
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection
        
        Args:
            websocket: WebSocket to remove
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """
        Send a message to a specific WebSocket
        
        Args:
            message: Message to send
            websocket: Target WebSocket
        """
        await websocket.send_text(message)
    
    async def broadcast(self, message: Dict[str, Any]):
        """
        Broadcast a message to all connected WebSockets
        
        Args:
            message: Message dictionary to broadcast
        """
        message_json = json.dumps(message)
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.error(f"Error sending to WebSocket: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_risk_update(self, risk_data: Dict[str, Any]):
        """
        Broadcast a risk assessment update
        
        Args:
            risk_data: Risk data dictionary
        """
        message = {
            "type": "risk_update",
            "data": risk_data
        }
        await self.broadcast(message)
        logger.debug(f"Risk update broadcasted to {len(self.active_connections)} connections")
    
    async def broadcast_alert(self, alert_data: Dict[str, Any]):
        """
        Broadcast an alert
        
        Args:
            alert_data: Alert data dictionary
        """
        message = {
            "type": "alert",
            "data": alert_data
        }
        await self.broadcast(message)
        logger.info(f"Alert broadcasted to {len(self.active_connections)} connections")
    
    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.active_connections)


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
