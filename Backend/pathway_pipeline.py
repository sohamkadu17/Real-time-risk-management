"""
Pathway Streaming Pipeline for Real-Time Data Processing
Handles real-time market data streams and calculates options Greeks
"""

import pathway as pw
from pathway.stdlib.ml.classifiers import knn_classifier
import logging
from typing import Dict, Any
from datetime import datetime

from black76_model import Black76Calculator
from config import settings

logger = logging.getLogger(__name__)

class PathwayPipeline:
    """
    Pathway streaming pipeline for processing market data
    and calculating real-time risk metrics
    """
    
    def __init__(self):
        self.calculator = Black76Calculator()
        logger.info("Initializing Pathway Pipeline")
    
    def create_market_data_schema(self):
        """Define schema for incoming market data"""
        class MarketDataSchema(pw.Schema):
            timestamp: str
            symbol: str
            spot_price: float
            strike_price: float
            volatility: float
            risk_free_rate: float
            time_to_expiry: float
            option_type: str
        
        return MarketDataSchema
    
    def setup_kafka_input(self):
        """
        Setup Kafka input connector for Pathway
        Reads real-time market data from Kafka topics
        """
        MarketDataSchema = self.create_market_data_schema()
        
        # Connect to Kafka stream
        market_data = pw.io.kafka.read(
            rdkafka_settings={
                "bootstrap.servers": settings.KAFKA_BOOTSTRAP_SERVERS,
                "group.id": settings.KAFKA_CONSUMER_GROUP,
                "auto.offset.reset": "latest",
            },
            topic=settings.KAFKA_TOPIC_MARKET_DATA,
            schema=MarketDataSchema,
            format="json",
            autocommit_duration_ms=1000,
        )
        
        return market_data
    
    def calculate_greeks_stream(self, market_data):
        """
        Process market data stream and calculate Greeks in real-time
        Uses Pathway's streaming transformations
        """
        
        # Define Greeks calculation function
        @pw.udf
        def compute_greeks(
            spot: float,
            strike: float,
            volatility: float,
            rate: float,
            time_to_expiry: float,
            option_type: str
        ) -> dict:
            """Calculate all Greeks using Black-76 model"""
            try:
                greeks = self.calculator.calculate_all_greeks(
                    spot_price=spot,
                    strike_price=strike,
                    time_to_expiry=time_to_expiry,
                    volatility=volatility,
                    risk_free_rate=rate,
                    option_type=option_type
                )
                return greeks
            except Exception as e:
                logger.error(f"Error calculating Greeks: {e}")
                return {
                    "delta": 0.0,
                    "gamma": 0.0,
                    "vega": 0.0,
                    "theta": 0.0,
                    "rho": 0.0,
                    "price": 0.0,
                    "error": str(e)
                }
        
        # Apply Greeks calculation to the stream
        greeks_stream = market_data.select(
            pw.this.timestamp,
            pw.this.symbol,
            pw.this.spot_price,
            pw.this.strike_price,
            pw.this.option_type,
            greeks=compute_greeks(
                pw.this.spot_price,
                pw.this.strike_price,
                pw.this.volatility,
                pw.this.risk_free_rate,
                pw.this.time_to_expiry,
                pw.this.option_type
            )
        )
        
        return greeks_stream
    
    def aggregate_risk_metrics(self, greeks_stream):
        """
        Aggregate Greeks across portfolio for risk metrics
        Calculate portfolio-level Delta, Gamma, and other metrics
        """
        
        # Group by timestamp window and calculate aggregates
        risk_metrics = greeks_stream.groupby(pw.this.timestamp).reduce(
            pw.this.timestamp,
            total_delta=pw.reducers.sum(pw.this.greeks["delta"]),
            total_gamma=pw.reducers.sum(pw.this.greeks["gamma"]),
            avg_volatility=pw.reducers.avg(pw.this.volatility),
            position_count=pw.reducers.count()
        )
        
        return risk_metrics
    
    def setup_output_connectors(self, greeks_stream, risk_metrics):
        """
        Setup output connectors to publish results
        Can output to Kafka, CSV, or other formats
        """
        
        # Output Greeks to Kafka
        pw.io.kafka.write(
            greeks_stream,
            rdkafka_settings={
                "bootstrap.servers": settings.KAFKA_BOOTSTRAP_SERVERS,
            },
            topic=settings.KAFKA_TOPIC_GREEKS,
            format="json"
        )
        
        # Output risk metrics to Kafka
        pw.io.kafka.write(
            risk_metrics,
            rdkafka_settings={
                "bootstrap.servers": settings.KAFKA_BOOTSTRAP_SERVERS,
            },
            topic=settings.KAFKA_TOPIC_RISK_METRICS,
            format="json"
        )
        
        logger.info("Output connectors configured")
    
    def run_pipeline(self):
        """
        Main pipeline execution
        Sets up the full streaming pipeline and runs it
        """
        logger.info("Starting Pathway streaming pipeline")
        
        try:
            # Setup input from Kafka
            market_data = self.setup_kafka_input()
            
            # Calculate Greeks in real-time
            greeks_stream = self.calculate_greeks_stream(market_data)
            
            # Aggregate risk metrics
            risk_metrics = self.aggregate_risk_metrics(greeks_stream)
            
            # Setup outputs
            self.setup_output_connectors(greeks_stream, risk_metrics)
            
            # Run the pipeline
            pw.run(
                monitoring_level=pw.MonitoringLevel.ALL,
                with_http_server=True
            )
            
        except Exception as e:
            logger.error(f"Pipeline error: {e}")
            raise
    
    def create_simulated_data_stream(self):
        """
        Create a simulated data stream for testing
        Useful when Kafka is not available
        """
        MarketDataSchema = self.create_market_data_schema()
        
        # Create CSV-based simulated stream
        simulated_data = pw.io.csv.read(
            "./data/simulated_market_data.csv",
            schema=MarketDataSchema,
            mode="streaming"
        )
        
        return simulated_data

# Example usage for standalone testing
if __name__ == "__main__":
    pipeline = PathwayPipeline()
    pipeline.run_pipeline()
