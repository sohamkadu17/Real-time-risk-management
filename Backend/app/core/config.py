"""
Core configuration for the Real-Time Risk Management System
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow"   # 🔥 THIS FIXES EVERYTHING
    )

    # Application
    APP_NAME: str = "Real-Time Risk Management System"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/risk_management"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: str = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self):
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # Risk Engine Configuration
    RISK_HIGH_THRESHOLD: float = 0.8
    RISK_MEDIUM_THRESHOLD: float = 0.5
    RISK_LOW_THRESHOLD: float = 0.3

    # Streaming
    PATHWAY_MONITORING: bool = True
    STREAM_BUFFER_SIZE: int = 1000

    # AI/RAG
    OPENAI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-3.5-turbo"
    RAG_ENABLED: bool = False

    # Logging
    LOG_LEVEL: str = "INFO"

    # 🔥 THIS IS THE CRITICAL PART (Pydantic v2)
   


settings = Settings()
