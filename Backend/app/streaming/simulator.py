"""
Simulated data generator for testing
"""
import random
from datetime import datetime
from typing import Dict, Any
import time


class DataSimulator:
    """
    Simulates streaming financial/transactional data
    """
    
    def __init__(self):
        self.entity_counter = 0
        self.entity_types = ["transaction", "user", "merchant"]
    
    def generate_event(self) -> Dict[str, Any]:
        """
        Generate a single simulated event
        
        Returns:
            Dictionary containing event data
        """
        self.entity_counter += 1
        
        entity_type = random.choice(self.entity_types)
        entity_id = f"{entity_type}_{self.entity_counter}"
        
        # Generate features
        features = {
            "velocity": random.randint(1, 150),  # transactions per hour
            "amount": round(random.uniform(10, 15000), 2),
            "anomaly_score": round(random.random(), 3),
            "reputation": round(random.uniform(0.3, 1.0), 3),
            "unusual_pattern": random.choice([True, False]),
            "blacklist_match": random.random() < 0.05  # 5% chance
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
        Generate a batch of events
        
        Args:
            count: Number of events to generate
            
        Returns:
            List of events
        """
        return [self.generate_event() for _ in range(count)]
    
    def stream_events(self, interval: float = 1.0, callback=None):
        """
        Stream events continuously
        
        Args:
            interval: Seconds between events
            callback: Function to call with each event
        """
        while True:
            event = self.generate_event()
            
            if callback:
                callback(event)
            
            time.sleep(interval)
