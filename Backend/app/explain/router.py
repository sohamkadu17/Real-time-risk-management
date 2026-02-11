"""
Explainability router for risk explanations
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.risk.models import Risk
from app.explain.rag import rag_explainability
from app.core.dependencies import get_current_user
from db.session import get_db

router = APIRouter(prefix="/explain", tags=["Explainability"])


class ExplainRiskRequest(BaseModel):
    """Request schema for risk explanation"""
    risk_id: int


class ExplainRiskResponse(BaseModel):
    """Response schema for risk explanation"""
    risk_id: int
    explanation: str
    similar_cases: List[Dict[str, Any]]


@router.post("/risk", response_model=ExplainRiskResponse)
async def explain_risk(
    request: ExplainRiskRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get natural language explanation for a risk assessment
    
    Uses RAG to provide detailed, contextual explanations
    
    - **risk_id**: ID of the risk assessment to explain
    """
    # Get risk from database
    risk = db.query(Risk).filter(Risk.id == request.risk_id).first()
    
    if not risk:
        raise HTTPException(status_code=404, detail="Risk assessment not found")
    
    # Generate explanation using RAG
    explanation = rag_explainability.explain_risk(
        risk_score=risk.risk_score,
        risk_level=risk.risk_level,
        risk_factors=risk.risk_factors or [],
        features=risk.features or {}
    )
    
    # Query similar cases
    similar_cases = rag_explainability.query_similar_cases(
        risk_score=risk.risk_score,
        features=risk.features or {}
    )
    
    return {
        "risk_id": risk.id,
        "explanation": explanation,
        "similar_cases": similar_cases
    }


class PlatformExplainResponse(BaseModel):
    """Response schema for platform explainability"""
    overview: str
    key_features: List[Dict[str, str]]
    risk_models: List[Dict[str, Any]]
    data_sources: List[str]
    technical_specs: Dict[str, Any]


@router.get("/platform", response_model=PlatformExplainResponse)
async def explain_platform():
    """
    Get comprehensive explanation of the Real-Time Risk Management Platform
    
    Provides detailed technical and business explanations of the system capabilities,
    models used, and data processing pipeline.
    """
    return {
        "overview": """
        This Real-Time Risk Management Platform is a professional-grade financial technology system 
        designed for institutional trading environments. It processes live market data streams from 
        NSE and BSE exchanges, applies sophisticated risk models including the Black-76 options 
        pricing model, and provides real-time risk assessments with microsecond precision.
        
        The platform uses a streaming-first architecture powered by the Pathway framework, enabling 
        continuous processing of market events without batch delays. Risk calculations are performed 
        in real-time as new market data arrives, providing traders and risk managers with immediate 
        insights into portfolio exposures and market movements.
        """,
        "key_features": [
            {
                "name": "Real-Time Market Analytics",
                "description": "Live streaming analytics for NSE/BSE with millisecond precision market data processing and comprehensive risk assessment capabilities"
            },
            {
                "name": "Black-76 Options Pricing Engine", 
                "description": "Advanced implementation of the Black-76 model for real-time options pricing, calculating delta, gamma, theta, vega, and risk sensitivities"
            },
            {
                "name": "Portfolio Risk Monitoring",
                "description": "Comprehensive risk oversight with portfolio-level exposure tracking, volatility analysis, correlation monitoring, and automated alert systems"
            },
            {
                "name": "Professional Analytics Suite",
                "description": "Enterprise-grade analytics with customizable dashboards, backtesting capabilities, performance attribution, and regulatory reporting"
            }
        ],
        "risk_models": [
            {
                "name": "Black-76 Model",
                "description": "Industry-standard options pricing model for futures options",
                "inputs": ["Underlying Price", "Strike Price", "Time to Expiration", "Risk-free Rate", "Volatility"],
                "outputs": ["Option Price", "Delta", "Gamma", "Theta", "Vega", "Rho"],
                "use_cases": ["Options Market Making", "Hedge Ratio Calculation", "Portfolio Risk Assessment"]
            },
            {
                "name": "Value at Risk (VaR)",
                "description": "Statistical measure of potential portfolio losses over a specific time frame",
                "methods": ["Historical Simulation", "Parametric VaR", "Monte Carlo Simulation"],
                "confidence_levels": ["95%", "99%", "99.9%"]
            },
            {
                "name": "Volatility Surface Modeling",
                "description": "Multi-dimensional volatility surface construction and interpolation",
                "techniques": ["Cubic Spline", "Stochastic Volatility Models", "Local Volatility Models"]
            }
        ],
        "data_sources": [
            "NSE Live Market Feed - Equity derivatives, index options, currency futures",
            "BSE Real-time Data - Equity markets, debt securities, mutual funds",
            "Risk-free Rate Data - Government bond yields and repo rates",
            "Volatility Surface Data - Implied and historical volatility measures",
            "Corporate Actions - Dividends, splits, mergers affecting option pricing"
        ],
        "technical_specs": {
            "latency": "Sub-100 millisecond end-to-end processing",
            "throughput": "1M+ market events per second processing capacity",
            "uptime": "99.9% SLA with automatic failover and recovery",
            "scalability": "Horizontally scalable microservices architecture",
            "data_storage": "Time-series optimized PostgreSQL with Redis caching",
            "streaming_engine": "Pathway framework with Rust-core performance",
            "api_architecture": "RESTful APIs with WebSocket streaming for real-time updates",
            "security": "JWT-based authentication with role-based access control",
            "monitoring": "Comprehensive observability with metrics, logs, and distributed tracing"
        }
    }
