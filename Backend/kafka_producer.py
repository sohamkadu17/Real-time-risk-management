"""
Kafka Producer for Publishing Market Data
"""

try:
    from kafka import KafkaProducer
    from kafka.errors import KafkaError
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False
    KafkaError = Exception

import json
import logging
from typing import Dict, Any
from datetime import datetime

from config import settings

logger = logging.getLogger(__name__)

class MarketDataProducer:
    """
    Kafka producer for publishing market data to topics
    """
    
    def __init__(self):
        """Initialize Kafka producer"""
        if not KAFKA_AVAILABLE:
            raise Exception("kafka-python not installed. Run: pip install kafka-python")
        
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                acks='all',  # Wait for all replicas
                retries=3,
                compression_type='gzip'
            )
            logger.info(f"Kafka producer connected to {settings.KAFKA_BOOTSTRAP_SERVERS}")
        except Exception as e:
            logger.error(f"Failed to initialize Kafka producer: {e}")
            raise
    
    def send_market_data(self, data: Dict[str, Any]) -> bool:
        """
        Send market data to Kafka topic
        
        Args:
            data: Dictionary containing market data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Add timestamp if not present
            if 'timestamp' not in data:
                data['timestamp'] = datetime.utcnow().isoformat()
            
            # Send to Kafka
            future = self.producer.send(
                settings.KAFKA_TOPIC_MARKET_DATA,
                key=data.get('symbol', 'default'),
                value=data
            )
            
            # Wait for send to complete
            record_metadata = future.get(timeout=10)
            
            logger.debug(
                f"Sent to topic {record_metadata.topic} "
                f"partition {record_metadata.partition} "
                f"offset {record_metadata.offset}"
            )
            
            return True
            
        except KafkaError as e:
            logger.error(f"Kafka error sending market data: {e}")
            return False
        except Exception as e:
            logger.error(f"Error sending market data: {e}")
            return False
    
    def send_greeks(self, data: Dict[str, Any]) -> bool:
        """
        Send calculated Greeks to Kafka topic
        
        Args:
            data: Dictionary containing Greeks data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if 'timestamp' not in data:
                data['timestamp'] = datetime.utcnow().isoformat()
            
            future = self.producer.send(
                settings.KAFKA_TOPIC_GREEKS,
                key=data.get('symbol', 'default'),
                value=data
            )
            
            future.get(timeout=10)
            return True
            
        except Exception as e:
            logger.error(f"Error sending Greeks: {e}")
            return False
    
    def send_risk_metrics(self, data: Dict[str, Any]) -> bool:
        """
        Send risk metrics to Kafka topic
        
        Args:
            data: Dictionary containing risk metrics
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if 'timestamp' not in data:
                data['timestamp'] = datetime.utcnow().isoformat()
            
            future = self.producer.send(
                settings.KAFKA_TOPIC_RISK_METRICS,
                value=data
            )
            
            future.get(timeout=10)
            return True
            
        except Exception as e:
            logger.error(f"Error sending risk metrics: {e}")
            return False
    
    def flush(self):
        """Flush any pending messages"""
        self.producer.flush()
    
    def close(self):
        """Close the producer and cleanup"""
        try:
            self.producer.flush()
            self.producer.close()
            logger.info("Kafka producer closed")
        except Exception as e:
            logger.error(f"Error closing Kafka producer: {e}")

# Example usage
if __name__ == "__main__":
    producer = MarketDataProducer()
    
    # Example market data
    sample_data = {
        "symbol": "NIFTY50",
        "spot_price": 19500.75,
        "strike_price": 19500.0,
        "volatility": 0.18,
        "risk_free_rate": 0.065,
        "time_to_expiry": 0.0822,
        "option_type": "call"
    }
    
    success = producer.send_market_data(sample_data)
    print(f"Sent market data: {success}")
    
    producer.close()
