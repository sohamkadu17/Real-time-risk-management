"""
Test script for Config API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Test credentials
TEST_USER = {
    "username": "testuser",
    "password": "testpass123"
}

TEST_ADMIN = {
    "username": "admin",
    "password": "adminpass123"
}

def print_response(title, response):
    """Pretty print response"""
    print(f"\n{'='*60}")
    print(f"✓ {title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)

def test_config_endpoints():
    """Test all config endpoints"""
    
    # 1. Get current config (authenticated)
    print("\n[1] Testing GET /config")
    try:
        response = requests.get(
            f"{BASE_URL}/config",
            headers={"Authorization": f"Bearer <YOUR_TOKEN>"}
        )
        print_response("GET /config", response)
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # 2. Validate config
    print("\n[2] Testing GET /config/validate")
    try:
        response = requests.get(
            f"{BASE_URL}/config/validate",
            headers={"Authorization": f"Bearer <YOUR_TOKEN>"}
        )
        print_response("GET /config/validate", response)
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # 3. Update config (admin only)
    print("\n[3] Testing PUT /config (Admin Auth Required)")
    update_payload = {
        "risk_thresholds": {
            "high_threshold": 0.85,
            "medium_threshold": 0.55,
            "low_threshold": 0.35
        },
        "streaming": {
            "buffer_size": 1500,
            "monitoring_enabled": True,
            "event_interval_seconds": 2.5
        }
    }
    try:
        response = requests.put(
            f"{BASE_URL}/config",
            json=update_payload,
            headers={"Authorization": f"Bearer <ADMIN_TOKEN>"}
        )
        print_response("PUT /config", response)
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    print("""
    ╔═══════════════════════════════════════════════════════╗
    ║      CONFIG API TESTING SCRIPT                        ║
    ║                                                       ║
    ║  Prerequisites:                                       ║
    ║  1. Backend server is running on http://localhost:8000
    ║  2. Database is initialized                           ║
    ║  3. Replace <YOUR_TOKEN> with valid JWT token        ║
    ║  4. Replace <ADMIN_TOKEN> with admin JWT token       ║
    ╚═══════════════════════════════════════════════════════╝
    """)
    
    print("\nTo get a token:")
    print("  1. POST to /api/v1/auth/register with credentials")
    print("  2. POST to /api/v1/auth/login to get JWT token")
    print("  3. Use token in Authorization header: 'Bearer <token>'")
    print("\nNote: Admin endpoints require 'admin' role")
    
    test_config_endpoints()
