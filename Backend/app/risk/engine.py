"""
Risk engine for scoring and classification
"""
import numpy as np
from typing import Dict, List, Tuple, Any
from datetime import datetime
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class RiskEngine:
    """
    Real-time risk scoring engine
    
    Combines rule-based and probabilistic methods for risk assessment
    """
    
    def __init__(self):
        self.high_threshold = settings.RISK_HIGH_THRESHOLD
        self.medium_threshold = settings.RISK_MEDIUM_THRESHOLD
        self.low_threshold = settings.RISK_LOW_THRESHOLD
        
        # Feature weights for scoring
        self.feature_weights = {
            "velocity": 0.3,
            "amount": 0.25,
            "anomaly_score": 0.25,
            "reputation": 0.2
        }
    
    def calculate_risk_score(self, features: Dict[str, Any]) -> float:
        """
        Calculate risk score from features
        
        Args:
            features: Dictionary of feature values
            
        Returns:
            Risk score between 0.0 and 1.0
        """
        score = 0.0
        
        # Velocity score (transactions per time window)
        velocity = features.get("velocity", 0)
        velocity_score = min(velocity / 100.0, 1.0)  # Normalize
        score += velocity_score * self.feature_weights["velocity"]
        
        # Amount score (transaction amount)
        amount = features.get("amount", 0)
        amount_score = min(amount / 10000.0, 1.0)  # Normalize
        score += amount_score * self.feature_weights["amount"]
        
        # Anomaly score (statistical anomaly detection)
        anomaly_score = features.get("anomaly_score", 0.0)
        score += anomaly_score * self.feature_weights["anomaly_score"]
        
        # Reputation score (entity reputation)
        reputation = features.get("reputation", 1.0)
        reputation_score = 1 - reputation  # Lower reputation = higher risk
        score += reputation_score * self.feature_weights["reputation"]
        
        return min(score, 1.0)
    
    def classify_risk_level(self, risk_score: float) -> str:
        """
        Classify risk into categories
        
        Args:
            risk_score: Risk score between 0.0 and 1.0
            
        Returns:
            Risk level: critical, high, medium, or low
        """
        if risk_score >= self.high_threshold:
            return "critical" if risk_score >= 0.9 else "high"
        elif risk_score >= self.medium_threshold:
            return "medium"
        else:
            return "low"
    
    def identify_risk_factors(self, features: Dict[str, Any], risk_score: float) -> List[str]:
        """
        Identify specific risk factors contributing to the score
        
        Args:
            features: Feature dictionary
            risk_score: Calculated risk score
            
        Returns:
            List of risk factor descriptions
        """
        factors = []
        
        if features.get("velocity", 0) > 50:
            factors.append("High transaction velocity detected")
        
        if features.get("amount", 0) > 5000:
            factors.append("Large transaction amount")
        
        if features.get("anomaly_score", 0) > 0.7:
            factors.append("Statistical anomaly detected")
        
        if features.get("reputation", 1.0) < 0.5:
            factors.append("Low entity reputation")
        
        if features.get("unusual_pattern"):
            factors.append("Unusual behavioral pattern")
        
        if features.get("blacklist_match"):
            factors.append("Blacklist match found")
        
        return factors
    
    def assess_risk(
        self,
        entity_id: str,
        entity_type: str,
        features: Dict[str, Any]
    ) -> Tuple[float, str, List[str]]:
        """
        Perform complete risk assessment
        
        Args:
            entity_id: ID of entity being assessed
            entity_type: Type of entity
            features: Feature dictionary
            
        Returns:
            Tuple of (risk_score, risk_level, risk_factors)
        """
        # Calculate risk score
        risk_score = self.calculate_risk_score(features)
        
        # Classify risk level
        risk_level = self.classify_risk_level(risk_score)
        
        # Identify risk factors
        risk_factors = self.identify_risk_factors(features, risk_score)
        
        logger.info(
            f"Risk assessed for {entity_type}:{entity_id} - "
            f"Score: {risk_score:.3f}, Level: {risk_level}"
        )
        
        return risk_score, risk_level, risk_factors
    
    def update_thresholds(
        self,
        high: float = None,
        medium: float = None,
        low: float = None
    ):
        """
        Update risk classification thresholds
        
        Args:
            high: High risk threshold
            medium: Medium risk threshold
            low: Low risk threshold
        """
        if high is not None:
            self.high_threshold = high
        if medium is not None:
            self.medium_threshold = medium
        if low is not None:
            self.low_threshold = low
        
        logger.info(f"Risk thresholds updated: high={self.high_threshold}, "
                   f"medium={self.medium_threshold}, low={self.low_threshold}")


# Global risk engine instance
risk_engine = RiskEngine()
