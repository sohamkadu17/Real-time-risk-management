"""
Database session management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency
    
    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database - create all tables"""
    from db.base import Base
    
    # Import all models here to ensure they are registered
    from app.auth.models import User
    from app.risk.models import Risk
    from app.alerts.models import Alert
    from app.audit.models import AuditLog
    from app.config.models import SystemConfiguration
    
    Base.metadata.create_all(bind=engine)
