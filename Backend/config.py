"""
Configuration settings for the Real-Time Risk Management Backend
"""

from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path

class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Real-Time Risk Management"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS - using string and splitting it
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # Kafka Configuration
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_MARKET_DATA: str = "market-data"
    KAFKA_TOPIC_GREEKS: str = "options-greeks"
    KAFKA_TOPIC_RISK_METRICS: str = "risk-metrics"
    KAFKA_CONSUMER_GROUP: str = "risk-management-group"
    
    # Pathway Configuration
    PATHWAY_THREADS: int = 4
    PATHWAY_MONITORING_LEVEL: str = "ALL"
    
    # Market Data
    DEFAULT_EXCHANGE: str = "NSE"
    SIMULATION_MODE: bool = True
    UPDATE_INTERVAL_MS: int = 1000
    
    # Options Pricing Parameters
    RISK_FREE_RATE: float = 0.065  # 6.5% annual
    DEFAULT_VOLATILITY: float = 0.18  # 18%
    
    # Database (MongoDB - optional)
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "risk_management"
    
    # Redis (for caching - optional)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()
