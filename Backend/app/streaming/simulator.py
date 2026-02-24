"""
Simulated data generator for testing
"""
import random
from datetime import datetime
from typing import Dict, Any, Optional
import time
import asyncio


class DataSimulator:
    """
    Simulates streaming financial/transactional data
    Enhanced with realistic patterns and performance optimizations
    """
    
    def __init__(self):
        self.entity_counter = 0
        self.entity_types = ["transaction", "user", "merchant", "portfolio", "order"]
        self.symbols = ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "INFY", "HDFCBANK"]
        self.market_conditions = ["normal", "volatile", "trending"]
    
    def generate_event(self) -> Dict[str, Any]:
        """
        Generate a single simulated event with realistic financial patterns
        
        Returns:
            Dictionary containing event data
        """
        self.entity_counter += 1
        
        entity_type = random.choice(self.entity_types)
        entity_id = f"{entity_type}_{self.entity_counter}"
        
        # Generate features with realistic financial patterns
        base_volatility = random.uniform(0.1, 0.5)
        market_condition = random.choice(self.market_conditions)
        
        # Adjust features based on market conditions
        volatility_multiplier = {
            "normal": 1.0,
            "volatile": 2.5,
            "trending": 1.3
        }[market_condition]
        
        features = {
            "velocity": random.randint(1, 150),  # transactions per hour
            "amount": round(random.uniform(10, 15000), 2),
            "anomaly_score": round(random.random() * volatility_multiplier, 3),
            "reputation": round(random.uniform(0.3, 1.0), 3),
            "volatility": round(base_volatility * volatility_multiplier, 4),
            "unusual_pattern": random.choice([True, False]),
            "blacklist_match": random.random() < 0.05,  # 5% chance
            "symbol": random.choice(self.symbols),
            "market_condition": market_condition,
            "delta": round(random.uniform(-1, 1), 4),
            "gamma": round(random.uniform(0, 0.1), 4),
            "theta": round(random.uniform(-1, 0), 4),
        }
        
        event = {
            "entity_id": entity_id,
            "entity_type": entity_type,
            "timestamp": datetime.utcnow().isoformat(),
            "features": features
        }
        
        return event
    
    def generate_batch(self, count: int = 10) -> list:
        """
        Generate a batch of events (optimized for bulk processing)
        
        Args:
            count: Number of events to generate
            
        Returns:
            List of events
        """
        return [self.generate_event() for _ in range(count)]
    
    def stream_events(self, interval: float = 1.0, callback=None, max_events: Optional[int] = None):
        """
        Stream events continuously with performance optimizations
        
        Args:
            interval: Seconds between events
            callback: Function to call with each event
            max_events: Maximum events to generate (None for infinite)
        """
        events_generated = 0
        
        while True:
            if max_events and events_generated >= max_events:
                break
                
            event = self.generate_event()
            
            if callback:
                try:
                    callback(event)
                except Exception as e:
                    print(f"Error in callback: {e}")
            
            events_generated += 1
            time.sleep(interval)
