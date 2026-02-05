"""
Risk model for storing risk assessments
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from db.base import Base


class Risk(Base):
    """Risk assessment model"""
    
    __tablename__ = "risks"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(String, index=True, nullable=False)  # ID of the entity being assessed
    entity_type = Column(String, nullable=False)  # Type: transaction, user, etc.
    risk_score = Column(Float, nullable=False)  # 0.0 to 1.0
    risk_level = Column(String, nullable=False)  # low, medium, high, critical
    confidence = Column(Float, default=1.0)  # Confidence in assessment
    
    # Features used for risk calculation
    features = Column(JSON)
    
    # Risk factors and explanations
    risk_factors = Column(JSON)  # List of contributing factors
    
    # Metadata
    source = Column(String, default="streaming")  # streaming, manual, batch
    assessed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Risk {self.entity_id} score={self.risk_score} level={self.risk_level}>"
