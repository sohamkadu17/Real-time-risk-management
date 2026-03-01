"""
Database session management

SQLite note: SQLite's default threading model rejects the same connection
being used from multiple threads.  The Pathway feeder thread, the WebSocket
broadcast coroutine, and the FastAPI request handlers all share the same
SessionLocal → we must pass ``check_same_thread=False`` when SQLite is the
backend, otherwise SQLAlchemy raises "SQLite objects created in a thread can
only be used in that same thread."

PostgreSQL / other engines: ``pool_pre_ping=True`` checks each connection
before handing it to the caller, silently reconnecting on stale sockets.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings


def _build_engine():
    url: str = settings.DATABASE_URL
    if url.startswith("sqlite"):
        # SQLite requires check_same_thread=False for multi-threaded access.
        # NullPool avoids connection re-use across threads entirely (safer for SQLite).
        from sqlalchemy.pool import StaticPool
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,       # single shared connection — fine for SQLite dev
            echo=settings.DEBUG,
        )
    # PostgreSQL / MySQL / etc.
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=settings.DEBUG,
    )


# Create database engine
engine = _build_engine()

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
