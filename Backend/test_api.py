"""
Simple test script for the FastAPI backend
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    """Test all API endpoints"""
    
    print("=" * 60)
    print("Testing Real-Time Risk Management API")
    print("=" * 60)
    
    # Test root endpoint
    print("\n1. Testing root endpoint (GET /)...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test health endpoint
    print("\n2. Testing health endpoint (GET /health)...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test market data endpoint
    print("\n3. Testing market data (GET /api/market-data/current)...")
    try:
        response = requests.get(f"{BASE_URL}/api/market-data/current")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test Greeks endpoint
    print("\n4. Testing Greeks (GET /api/greeks)...")
    try:
        response = requests.get(f"{BASE_URL}/api/greeks")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test risk metrics endpoint
    print("\n5. Testing risk metrics (GET /api/risk-metrics)...")
    try:
        response = requests.get(f"{BASE_URL}/api/risk-metrics")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n" + "=" * 60)
    print("API Tests Complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_endpoints()
