"""
Comprehensive Test Suite for Real-Time Risk Management System
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from app.main import app
from db.base import Base
from db.session import get_db
from app.auth.models import User
from app.core.security import get_password_hash

# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


class TestAuthentication:
    """Test authentication endpoints"""
    
    def setup_method(self):
        """Setup test database"""
        Base.metadata.create_all(bind=engine)
    
    def teardown_method(self):
        """Cleanup test database"""
        Base.metadata.drop_all(bind=engine)
    
    def test_register_user(self):
        """Test user registration"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "testpass123",
                "role": "viewer"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["username"] == "testuser"
        assert "id" in data
    
    def test_login_success(self):
        """Test successful login"""
        # Register user first
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "testpass123",
                "role": "viewer"
            }
        )
        
        # Login
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpass123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "nonexistent",
                "password": "wrongpass"
            }
        )
        assert response.status_code == 401


class TestConfigAPI:
    """Test configuration endpoints"""
    
    def setup_method(self):
        Base.metadata.create_all(bind=engine)
        # Create test user
        db = TestingSessionLocal()
        user = User(
            email="admin@example.com",
            username="admin",
            hashed_password=get_password_hash("adminpass"),
            role="admin",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.close()
        
        # Get token
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "admin", "password": "adminpass"}
        )
        self.token = response.json()["access_token"]
    
    def teardown_method(self):
        Base.metadata.drop_all(bind=engine)
    
    def test_get_config(self):
        """Test getting configuration"""
        response = client.get(
            "/api/v1/config",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "config" in data
        assert "risk_thresholds" in data["config"]
    
    def test_update_config(self):
        """Test updating configuration"""
        response = client.put(
            "/api/v1/config",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "risk_thresholds": {
                    "high_threshold": 0.85,
                    "medium_threshold": 0.55,
                    "low_threshold": 0.35
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["config"]["risk_thresholds"]["high_threshold"] == 0.85
    
    def test_validate_config(self):
        """Test configuration validation"""
        response = client.get(
            "/api/v1/config/validate",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "valid" in data


class TestRiskAPI:
    """Test risk assessment endpoints"""
    
    def setup_method(self):
        Base.metadata.create_all(bind=engine)
        db = TestingSessionLocal()
        user = User(
            email="analyst@example.com",
            username="analyst",
            hashed_password=get_password_hash("analystpass"),
            role="analyst",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.close()
        
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "analyst", "password": "analystpass"}
        )
        self.token = response.json()["access_token"]
    
    def teardown_method(self):
        Base.metadata.drop_all(bind=engine)
    
    def test_get_live_risks(self):
        """Test getting live risk assessments"""
        response = client.get(
            "/api/v1/risk/live",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestHealthCheck:
    """Test system health endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "database" in data
        assert "streaming" in data


# Run tests with: pytest test_comprehensive.py -v
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
