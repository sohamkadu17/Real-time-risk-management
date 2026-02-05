"""
Kafka Consumer for Receiving Processed Data
"""

from kafka import KafkaConsumer
from kafka.errors import KafkaError
import json
import logging
from typing import Callable, Dict, Any
from datetime import datetime

from config import settings

logger = logging.getLogger(__name__)

class MarketDataConsumer:
    """
    Kafka consumer for receiving processed Greeks and risk metrics
    """
    
    def __init__(self, topics: list[str], group_id: str = None):
        """
        Initialize Kafka consumer
        
        Args:
            topics: List of topics to subscribe to
            group_id: Consumer group ID
        """
        try:
            self.consumer = KafkaConsumer(
                *topics,
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                group_id=group_id or settings.KAFKA_CONSUMER_GROUP,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                key_deserializer=lambda k: k.decode('utf-8') if k else None,
                auto_offset_reset='latest',
                enable_auto_commit=True,
                max_poll_records=100
            )
            logger.info(f"Kafka consumer subscribed to topics: {topics}")
        except Exception as e:
            logger.error(f"Failed to initialize Kafka consumer: {e}")
            raise
    
    def consume_messages(self, callback: Callable[[Dict[str, Any]], None]):
        """
        Consume messages from subscribed topics
        
        Args:
            callback: Function to call for each message
        """
        try:
            for message in self.consumer:
                try:
                    data = {
                        'topic': message.topic,
                        'partition': message.partition,
                        'offset': message.offset,
                        'key': message.key,
                        'value': message.value,
                        'timestamp': datetime.fromtimestamp(message.timestamp / 1000.0)
                    }
                    
                    # Call the callback function
                    callback(data)
                    
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    continue
                    
        except KeyboardInterrupt:
            logger.info("Consumer interrupted by user")
        except Exception as e:
            logger.error(f"Consumer error: {e}")
        finally:
            self.close()
    
    def close(self):
        """Close the consumer"""
        try:
            self.consumer.close()
            logger.info("Kafka consumer closed")
        except Exception as e:
            logger.error(f"Error closing Kafka consumer: {e}")

class GreeksConsumer(MarketDataConsumer):
    """Consumer specifically for Greeks data"""
    
    def __init__(self):
        super().__init__(
            topics=[settings.KAFKA_TOPIC_GREEKS],
            group_id=f"{settings.KAFKA_CONSUMER_GROUP}-greeks"
        )

class RiskMetricsConsumer(MarketDataConsumer):
    """Consumer specifically for risk metrics data"""
    
    def __init__(self):
        super().__init__(
            topics=[settings.KAFKA_TOPIC_RISK_METRICS],
            group_id=f"{settings.KAFKA_CONSUMER_GROUP}-risk"
        )

# Example usage
if __name__ == "__main__":
    def process_greeks(data: Dict[str, Any]):
        """Example callback for processing Greeks"""
        print(f"Received Greeks from {data['topic']}:")
        print(f"  Key: {data['key']}")
        print(f"  Value: {data['value']}")
        print(f"  Timestamp: {data['timestamp']}")
    
    # Create and run consumer
    consumer = GreeksConsumer()
    consumer.consume_messages(process_greeks)
