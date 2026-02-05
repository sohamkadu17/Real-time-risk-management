"""
Pydantic models for data validation
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from enum import Enum

class ExchangeType(str, Enum):
    NSE = "NSE"
    BSE = "BSE"

class OptionType(str, Enum):
    CALL = "call"
    PUT = "put"

class MarketData(BaseModel):
    """Market data model"""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    exchange: ExchangeType = ExchangeType.NSE
    symbol: str
    spot_price: float = Field(gt=0)
    volume: int = Field(ge=0)
    bid: Optional[float] = None
    ask: Optional[float] = None
    volatility: Optional[float] = None

class OptionsData(BaseModel):
    """Options contract data"""
    symbol: str
    strike_price: float = Field(gt=0)
    spot_price: float = Field(gt=0)
    expiry_date: datetime
    option_type: OptionType
    volatility: float = Field(gt=0, le=5.0)
    risk_free_rate: float = Field(ge=0, le=1.0)
    time_to_expiry: float = Field(gt=0)  # in years
    
class OptionsGreeks(BaseModel):
    """Options Greeks calculated using Black-76 model"""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    symbol: str
    delta: float = Field(description="Rate of change of option price w.r.t underlying")
    gamma: float = Field(description="Rate of change of delta")
    vega: float = Field(description="Sensitivity to volatility")
    theta: float = Field(description="Time decay")
    rho: float = Field(description="Sensitivity to interest rate")
    option_price: float = Field(gt=0)

class RiskMetrics(BaseModel):
    """Portfolio risk metrics"""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    portfolio_value: float
    portfolio_delta: float
    portfolio_gamma: float
    var_95: float = Field(description="Value at Risk at 95% confidence")
    var_99: float = Field(description="Value at Risk at 99% confidence")
    expected_shortfall: float
    max_drawdown: float
    sharpe_ratio: float

class StreamEvent(BaseModel):
    """Generic streaming event"""
    event_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: dict
