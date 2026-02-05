"""
Black-76 Model Implementation for Options Pricing and Greeks Calculation
Used for pricing futures options commonly in commodity and index markets
"""

import numpy as np
from scipy.stats import norm
from typing import Dict, Literal
import logging

logger = logging.getLogger(__name__)

class Black76Calculator:
    """
    Black-76 model for pricing options and calculating Greeks
    
    The Black-76 model is used for pricing options on futures contracts.
    It's commonly used for commodity options and index options.
    
    Formula:
    Call: C = e^(-r*T) * [F*N(d1) - K*N(d2)]
    Put:  P = e^(-r*T) * [K*N(-d2) - F*N(-d1)]
    
    where:
    d1 = [ln(F/K) + (σ²/2)*T] / (σ*√T)
    d2 = d1 - σ*√T
    """
    
    def __init__(self):
        logger.info("Black-76 Calculator initialized")
    
    def _calculate_d1_d2(
        self,
        spot_price: float,
        strike_price: float,
        time_to_expiry: float,
        volatility: float
    ) -> tuple[float, float]:
        """
        Calculate d1 and d2 parameters for Black-76 formula
        
        Args:
            spot_price: Current futures/spot price (F)
            strike_price: Strike price (K)
            time_to_expiry: Time to expiration in years (T)
            volatility: Implied volatility (σ)
        
        Returns:
            Tuple of (d1, d2)
        """
        # Handle edge cases
        if time_to_expiry <= 0:
            raise ValueError("Time to expiry must be positive")
        if volatility <= 0:
            raise ValueError("Volatility must be positive")
        
        # Calculate d1
        d1 = (np.log(spot_price / strike_price) + 
              (volatility ** 2 / 2) * time_to_expiry) / \
             (volatility * np.sqrt(time_to_expiry))
        
        # Calculate d2
        d2 = d1 - volatility * np.sqrt(time_to_expiry)
        
        return d1, d2
    
    def calculate_option_price(
        self,
        spot_price: float,
        strike_price: float,
        time_to_expiry: float,
        volatility: float,
        risk_free_rate: float,
        option_type: Literal["call", "put"]
    ) -> float:
        """
        Calculate option price using Black-76 model
        
        Args:
            spot_price: Current futures/spot price
            strike_price: Strike price
            time_to_expiry: Time to expiration in years
            volatility: Implied volatility
            risk_free_rate: Risk-free interest rate
            option_type: "call" or "put"
        
        Returns:
            Option price
        """
        d1, d2 = self._calculate_d1_d2(spot_price, strike_price, time_to_expiry, volatility)
        
        # Discount factor
        discount = np.exp(-risk_free_rate * time_to_expiry)
        
        if option_type.lower() == "call":
            price = discount * (
                spot_price * norm.cdf(d1) - 
                strike_price * norm.cdf(d2)
            )
        elif option_type.lower() == "put":
            price = discount * (
                strike_price * norm.cdf(-d2) - 
                spot_price * norm.cdf(-d1)
            )
        else:
            raise ValueError(f"Invalid option_type: {option_type}. Must be 'call' or 'put'")
        
        return float(price)
    
    def calculate_delta(
        self,
        spot_price: float,
        strike_price: float,
        time_to_expiry: float,
        volatility: float,
        risk_free_rate: float,
        option_type: Literal["call", "put"]
    ) -> float:
        """
        Calculate Delta: ∂V/∂S (rate of change of option price w.r.t. spot price)
        
        Delta ranges:
        - Call: 0 to 1
        - Put: -1 to 0
        """
        d1, _ = self._calculate_d1_d2(spot_price, strike_price, time_to_expiry, volatility)
        discount = np.exp(-risk_free_rate * time_to_expiry)
        
        if option_type.lower() == "call":
            delta = discount * norm.cdf(d1)
        else:  # put
            delta = -discount * norm.cdf(-d1)
        
        return float(delta)
    
    def calculate_gamma(
        self,
        spot_price: float,
        strike_price: float,
        time_to_expiry: float,
        volatility: float,
        risk_free_rate: float
    ) -> float:
        """
        Calculate Gamma: ∂²V/∂S² (rate of change of Delta)
        
        Gamma is always positive for both calls and puts
        """
        d1, _ = self._calculate_d1_d2(spot_price, strike_price, time_to_expiry, volatility)
        discount = np.exp(-risk_free_rate * time_to_expiry)
        
        gamma = (discount * norm.pdf(d1)) / \
                (spot_price * volatility * np.sqrt(time_to_expiry))
        
        return float(gamma)
    
    def calculate_vega(
        self,
        spot_price: float,
        strike_price: float,
        time_to_expiry: float,
        volatility: float,
        risk_free_rate: float
    ) -> float:
        """
        Calculate Vega: ∂V/∂σ (sensitivity to volatility changes)
        
        Vega is always positive for both calls and puts
        Typically expressed as change per 1% change in volatility
        """
        d1, _ = self._calculate_d1_d2(spot_price, strike_price, time_to_expiry, volatility)
        discount = np.exp(-risk_free_rate * time_to_expiry)
        
        vega = discount * spot_price * norm.pdf(d1) * np.sqrt(time_to_expiry)
        
        # Divide by 100 to express as change per 1% volatility change
        return float(vega / 100)
    
    def calculate_theta(
        self,
        spot_price: float,
        strike_price: float,
        time_to_expiry: float,
        volatility: float,
        risk_free_rate: float,
        option_type: Literal["call", "put"]
    ) -> float:
        """
        Calculate Theta: -∂V/∂T (time decay of option value)
        
        Theta is typically negative for long options (time decay)
        Expressed as change per day (divide by 365)
        """
        d1, d2 = self._calculate_d1_d2(spot_price, strike_price, time_to_expiry, volatility)
        discount = np.exp(-risk_free_rate * time_to_expiry)
        
        term1 = -(discount * spot_price * norm.pdf(d1) * volatility) / \
                (2 * np.sqrt(time_to_expiry))
        
        if option_type.lower() == "call":
            term2 = risk_free_rate * discount * strike_price * norm.cdf(d2)
            theta = term1 - term2
        else:  # put
            term2 = risk_free_rate * discount * strike_price * norm.cdf(-d2)
            theta = term1 + term2
        
        # Divide by 365 to express as daily theta
        return float(theta / 365)
    
    def calculate_rho(
        self,
        spot_price: float,
        strike_price: float,
        time_to_expiry: float,
        volatility: float,
        risk_free_rate: float,
        option_type: Literal["call", "put"]
    ) -> float:
        """
        Calculate Rho: ∂V/∂r (sensitivity to interest rate changes)
        
        Rho is typically positive for calls and negative for puts
        Expressed as change per 1% change in interest rate
        """
        _, d2 = self._calculate_d1_d2(spot_price, strike_price, time_to_expiry, volatility)
        discount = np.exp(-risk_free_rate * time_to_expiry)
        
        if option_type.lower() == "call":
            rho = time_to_expiry * discount * strike_price * norm.cdf(d2)
        else:  # put
            rho = -time_to_expiry * discount * strike_price * norm.cdf(-d2)
        
        # Divide by 100 to express as change per 1% rate change
        return float(rho / 100)
    
    def calculate_all_greeks(
        self,
        spot_price: float,
        strike_price: float,
        time_to_expiry: float,
        volatility: float,
        risk_free_rate: float,
        option_type: Literal["call", "put"]
    ) -> Dict[str, float]:
        """
        Calculate option price and all Greeks at once
        
        Returns:
            Dictionary containing price and all Greeks
        """
        try:
            price = self.calculate_option_price(
                spot_price, strike_price, time_to_expiry,
                volatility, risk_free_rate, option_type
            )
            
            delta = self.calculate_delta(
                spot_price, strike_price, time_to_expiry,
                volatility, risk_free_rate, option_type
            )
            
            gamma = self.calculate_gamma(
                spot_price, strike_price, time_to_expiry,
                volatility, risk_free_rate
            )
            
            vega = self.calculate_vega(
                spot_price, strike_price, time_to_expiry,
                volatility, risk_free_rate
            )
            
            theta = self.calculate_theta(
                spot_price, strike_price, time_to_expiry,
                volatility, risk_free_rate, option_type
            )
            
            rho = self.calculate_rho(
                spot_price, strike_price, time_to_expiry,
                volatility, risk_free_rate, option_type
            )
            
            return {
                "price": price,
                "delta": delta,
                "gamma": gamma,
                "vega": vega,
                "theta": theta,
                "rho": rho
            }
        
        except Exception as e:
            logger.error(f"Error calculating Greeks: {e}")
            raise

# Example usage and testing
if __name__ == "__main__":
    calculator = Black76Calculator()
    
    # Example: NSE Nifty options
    result = calculator.calculate_all_greeks(
        spot_price=19500.0,      # Current Nifty futures price
        strike_price=19500.0,    # At-the-money strike
        time_to_expiry=0.0822,   # ~30 days (30/365)
        volatility=0.18,         # 18% implied volatility
        risk_free_rate=0.065,    # 6.5% risk-free rate
        option_type="call"
    )
    
    print("Black-76 Model Results:")
    print(f"Option Price: ₹{result['price']:.2f}")
    print(f"Delta: {result['delta']:.4f}")
    print(f"Gamma: {result['gamma']:.4f}")
    print(f"Vega: {result['vega']:.4f}")
    print(f"Theta: {result['theta']:.4f}")
    print(f"Rho: {result['rho']:.4f}")
