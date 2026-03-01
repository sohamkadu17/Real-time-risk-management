"""
Enhanced market data simulator with realistic financial patterns.
Simulates live NSE/BSE market behavior for testing.

Used by PathwayPipeline: the pipeline calls generate_event() on each tick
and pushes the result into the Pathway dataflow graph.
"""
import random
from datetime import datetime, time as dt_time
from typing import Dict, Any, Optional
import time
import numpy as np

try:
    from black76_model import Black76Calculator as _Black76Calculator
    _black76 = _Black76Calculator()
except Exception:
    _black76 = None


class LiveMarketSimulator:
    """
    Advanced market data simulator with realistic NSE/BSE patterns
    Includes volatility clustering, Greeks calculation, market hours, and tick-level precision
    """
    
    def __init__(self):
        self.entity_counter = 0
        self.entity_types = ["transaction", "user", "merchant", "portfolio", "order", "option_chain", "futures"]
        # Real market symbols from NSE
        self.symbols = [
            "NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "INFY", "HDFCBANK", 
            "ICICIBANK", "SBIN", "HINDUNILVR", "ITC", "LT", "BAJFINANCE",
            "MARUTI", "ASIANPAINT", "NESTLEIND", "KOTAKBANK"
        ]
        self.market_conditions = ["normal", "volatile", "trending", "gap_up", "gap_down", "sideways"]
        
        # Market state tracking for realistic behavior
        self.current_prices = {symbol: random.uniform(100, 25000) for symbol in self.symbols}
        self.volatility_regime = "normal"
        self.market_session = self._get_market_session()
        self.last_price_change = {symbol: 0 for symbol in self.symbols}
    
    def _get_market_session(self) -> str:
        """Determine if market is open based on current time (IST)"""
        now = datetime.now().time()
        market_open = dt_time(9, 15)  # 9:15 AM IST
        market_close = dt_time(15, 30)  # 3:30 PM IST
        
        if market_open <= now <= market_close:
            return "open"
        elif dt_time(9, 0) <= now <= dt_time(9, 15):
            return "pre_open"
        else:
            return "closed"
    
    def _update_market_prices(self, symbol: str) -> Dict[str, float]:
        """Update market prices with realistic tick movements"""
        current_price = self.current_prices[symbol]
        
        # Volatility clustering - high volatility tends to be followed by high volatility
        base_vol = 0.02 if self.volatility_regime == "normal" else 0.05
        
        # Random walk with drift
        drift = random.uniform(-0.001, 0.001)
        shock = np.random.normal(0, base_vol)
        price_change = current_price * (drift + shock)
        
        # Apply tick size constraints (realistic for Indian markets)
        tick_size = 0.05 if current_price < 1000 else 0.10
        price_change = round(price_change / tick_size) * tick_size
        
        new_price = max(current_price + price_change, 0.05)  # Minimum price
        self.current_prices[symbol] = new_price
        self.last_price_change[symbol] = price_change
        
        return {
            "spot_price": new_price,
            "price_change": price_change,
            "price_change_pct": (price_change / current_price) * 100
        }
    
    def _calculate_realistic_greeks(self, symbol: str, spot_price: float) -> Dict[str, float]:
        """Calculate option Greeks using the Black-76 model (simplified fallback if unavailable)."""
        atm_strike = max(50.0, round(spot_price / 50) * 50)  # ATM strike — nearest 50 (NSE convention)
        time_to_expiry = random.uniform(0.02, 0.25)  # 1 week to 3 months in years

        base_vol = {
            "NIFTY": 0.15, "BANKNIFTY": 0.18, "RELIANCE": 0.25,
            "TCS": 0.22, "INFY": 0.28, "HDFCBANK": 0.30
        }.get(symbol, 0.25)
        vol_multiplier = {
            "normal": 1.0, "volatile": 2.0, "trending": 1.2,
            "gap_up": 1.5, "gap_down": 1.8, "sideways": 0.8
        }.get(self.volatility_regime, 1.0)
        volatility = base_vol * vol_multiplier

        option_type = random.choice(["call", "put"])
        risk_free_rate = 0.065  # RBI repo rate ~6.5%

        # ── Black-76 (primary path) ────────────────────────────────────────
        if _black76 is not None and time_to_expiry > 0 and volatility > 0:
            try:
                g = _black76.calculate_all_greeks(
                    spot_price=spot_price,
                    strike_price=atm_strike,
                    time_to_expiry=time_to_expiry,
                    volatility=volatility,
                    risk_free_rate=risk_free_rate,
                    option_type=option_type,
                )
                return {
                    "delta": round(g["delta"], 4),
                    "gamma": round(g["gamma"], 6),
                    "theta": round(g["theta"], 4),
                    "vega":  round(g["vega"],  4),
                    "rho":   round(g["rho"],   4),
                    "implied_vol": round(volatility, 4),
                    "time_to_expiry": round(time_to_expiry, 4),
                    "option_price": round(g["price"], 2),
                    "option_type": option_type,
                    "strike_price": atm_strike,
                }
            except Exception:
                pass  # fall through to simplified model

        # ── Simplified fallback ────────────────────────────────────────────
        moneyness = spot_price / atm_strike
        delta = max(-0.99, min(0.99, 2 * (moneyness - 1)))
        gamma = max(0.0001, 0.1 * np.exp(-10 * (moneyness - 1) ** 2))
        theta = -0.05 * (volatility ** 2) * (atm_strike / 365)
        vega  = 0.01 * atm_strike * np.sqrt(time_to_expiry) * np.exp(-0.5 * (moneyness - 1) ** 2)
        rho   = 0.01 * atm_strike * time_to_expiry * max(0, moneyness - 0.5)
        return {
            "delta": round(delta, 4),
            "gamma": round(gamma, 6),
            "theta": round(theta, 4),
            "vega":  round(vega,  4),
            "rho":   round(rho,   4),
            "implied_vol": round(volatility, 4),
            "time_to_expiry": round(time_to_expiry, 4),
        }
    
    def generate_event(self) -> Dict[str, Any]:
        """
        Generate realistic market event with live-like patterns
        
        Returns:
            Dictionary containing advanced market event data
        """
        self.entity_counter += 1
        
        entity_type = random.choice(self.entity_types)
        entity_id = f"{entity_type}_{self.entity_counter}"
        symbol = random.choice(self.symbols)
        
        # Update market session and volatility regime
        self.market_session = self._get_market_session()
        if random.random() < 0.05:  # 5% chance to change volatility regime
            self.volatility_regime = random.choice(["normal", "volatile", "trending"])
        
        # Get realistic market data
        price_data = self._update_market_prices(symbol)
        greeks = self._calculate_realistic_greeks(symbol, price_data["spot_price"])
        
        # Enhanced features with market microstructure
        features = {
            # Core market data
            "symbol": symbol,
            "spot_price": price_data["spot_price"],
            "price_change": price_data["price_change"],
            "price_change_pct": price_data["price_change_pct"],
            
            # Greeks and volatility
            "delta": greeks["delta"],
            "gamma": greeks["gamma"], 
            "theta": greeks["theta"],
            "vega": greeks["vega"],
            "rho": greeks["rho"],
            "implied_vol": greeks["implied_vol"],
            "time_to_expiry": greeks["time_to_expiry"],
            
            # Market microstructure
            "market_session": self.market_session,
            "volatility_regime": self.volatility_regime,
            "bid_ask_spread": round(random.uniform(0.05, 0.5), 2),
            "volume": random.randint(100, 50000),
            "open_interest": random.randint(1000, 100000) if entity_type in ["option_chain", "futures"] else None,
            
            # Transaction/Risk data
            "velocity": random.randint(1, 200),
            "amount": round(random.uniform(10, 50000), 2),
            "anomaly_score": round(random.random() * (2.0 if self.volatility_regime == "volatile" else 1.0), 3),
            "reputation": round(random.uniform(0.2, 1.0), 3),
            "unusual_pattern": random.random() < (0.3 if self.volatility_regime == "volatile" else 0.1),
            "blacklist_match": random.random() < 0.02,
            
            # Market condition indicators
            "market_condition": self.volatility_regime,
            "volatility": greeks["implied_vol"],
            "liquidity_score": round(random.uniform(0.3, 1.0), 3),
            "correlation_score": round(random.uniform(-1.0, 1.0), 3)
        }
        
        event = {
            "entity_id": entity_id,
            "entity_type": entity_type,
            "timestamp": datetime.utcnow().isoformat(),
            "features": features,
            "market_metadata": {
                "session": self.market_session,
                "volatility_regime": self.volatility_regime,
                "tick_time": datetime.utcnow().timestamp(),
                "exchange": "NSE" if symbol in ["NIFTY", "BANKNIFTY"] else random.choice(["NSE", "BSE"])
            }
        }
        
        return event
    
    def generate_realistic_batch(self, count: int = 10, time_spread: bool = True) -> list:
        """
        Generate batch of events with realistic time distribution
        
        Args:
            count: Number of events
            time_spread: Whether to spread events across realistic time intervals
            
        Returns:
            List of market events
        """
        events = []
        base_time = datetime.utcnow()
        
        for i in range(count):
            event = self.generate_event()
            
            if time_spread:
                # Add realistic microsecond intervals between events
                microsecond_offset = random.randint(0, 999999)
                event_time = base_time.replace(microsecond=microsecond_offset)
                event["timestamp"] = event_time.isoformat()
                event["market_metadata"]["tick_time"] = event_time.timestamp()
            
            events.append(event)
        
        return events
    
    def stream_live_events(
        self, 
        interval: float = 0.1, 
        callback=None, 
        max_events: Optional[int] = None,
        burst_mode: bool = False,
        stop_event: Optional["threading.Event"] = None,
    ):
        """
        Stream events with realistic market timing patterns.

        This method is provided for **manual / testing use**.
        The production Pathway pipeline calls ``generate_event()`` directly
        and pushes each result into the Pathway dataflow via
        ``_EventSubject.next()`` — it does NOT use this method.

        Args:
            interval:    Base interval between events (seconds).
            callback:    Function to call with each event dict.
            max_events:  Stop after this many events (None = unlimited).
            burst_mode:  Enable burst-trading simulation (high frequency).
            stop_event:  ``threading.Event`` — set it to stop the loop cleanly.
                         If None, the loop runs until ``max_events`` is reached
                         or the process exits.  Without this you cannot stop an
                         unlimited stream from another thread.
        """
        import threading as _threading
        if stop_event is None:
            stop_event = _threading.Event()   # local — caller cannot stop it

        events_generated = 0
        
        while not stop_event.is_set():
            if max_events and events_generated >= max_events:
                break
            
            # Adjust interval based on market session
            if self.market_session == "open":
                actual_interval = interval * random.uniform(0.5, 1.5)
            elif self.market_session == "pre_open":
                actual_interval = interval * 2.0  # Slower during pre-open
            else:
                actual_interval = interval * 5.0  # Much slower when closed
            
            # Burst mode for high-frequency simulation
            if burst_mode and random.random() < 0.2:
                burst_size = random.randint(3, 10)
                for _ in range(burst_size):
                    if stop_event.is_set():
                        break
                    event = self.generate_event()
                    if callback:
                        try:
                            callback(event)
                        except Exception as e:
                            print(f"Error in callback during burst: {e}")
                    events_generated += 1
            else:
                event = self.generate_event()
                if callback:
                    try:
                        callback(event)
                    except Exception as e:
                        print(f"Error in callback: {e}")
                events_generated += 1
            
            # Use Event.wait() so stop_event can interrupt the sleep immediately
            stop_event.wait(actual_interval)
    
    def get_market_summary(self) -> Dict[str, Any]:
        """Get current market state summary"""
        return {
            "session": self.market_session,
            "volatility_regime": self.volatility_regime,
            "active_symbols": len(self.symbols),
            "current_prices": self.current_prices.copy(),
            "events_generated": self.entity_counter,
            "timestamp": datetime.utcnow().isoformat()
        }


# Maintain backward compatibility
DataSimulator = LiveMarketSimulator

