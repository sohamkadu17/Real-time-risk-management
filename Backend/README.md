# Real-Time Risk Management System - Backend

A production-ready backend for real-time risk assessment and management using streaming-first architecture.

##  Features

### Core Capabilities
- **Authentication & Authorization**: JWT-based auth with role-based access control (Admin, Analyst, Viewer)
- **Real-Time Risk Assessment**: Streaming risk scoring using Pathway
- **Alert System**: Automated alerts for high-risk events
- **Audit Logging**: Complete audit trail of all actions
- **AI Explainability**: RAG-based natural language risk explanations
- **WebSocket Updates**: Real-time push notifications to clients
- **RESTful API**: Comprehensive REST API with FastAPI

### Architecture
- **Clean Architecture**: Modular, testable, and maintainable
- **Streaming-First**: Real-time processing with Pathway
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Caching**: Redis for performance optimization
- **Docker**: Containerized deployment

##  Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+ (optional)
- Docker & Docker Compose (for containerized deployment)

##  Installation

### Option 1: Docker Compose (Recommended)

\\\ash
# Clone the repository
cd Backend

# Start all services
docker compose -f docker/docker-compose.yml up -d

# Check logs
docker compose -f docker/docker-compose.yml logs -f app

# Stop services
docker compose -f docker/docker-compose.yml down
\\\

The application will be available at http://localhost:8000

### Option 2: Local Development

\\\ash
# 1. Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on Linux/Mac
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment variables
# Copy .env.example and edit
cp .env.example .env

# 4. Start PostgreSQL (if not using Docker)
# Make sure PostgreSQL is running on localhost:5432

# 5. Initialize database
python -c "from db.session import init_db; init_db()"

# 6. Run the application
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
\\\

##  Project Structure

\\\
Backend/
 app/
    main.py              # FastAPI application entry point
    core/                # Core configuration & security
       config.py
       security.py
       dependencies.py
    auth/                # Authentication module
       router.py
       models.py
       schemas.py
       service.py
    risk/                # Risk assessment module
       router.py
       models.py
       schemas.py
       engine.py
    alerts/              # Alert management
       router.py
       models.py
       service.py
    explain/             # AI explainability
       router.py
       rag.py
    audit/               # Audit logging
       models.py
       router.py
    streaming/           # Pathway streaming
       pathway_pipeline.py
       simulator.py
    websocket/           # WebSocket management
        manager.py
 db/                      # Database layer
    session.py
    base.py
 docker/                  # Docker configuration
    Dockerfile
    docker-compose.yml
 requirements.txt
 README.md
\\\

##  API Endpoints

### Authentication
- \POST /api/v1/auth/register\ - Register new user
- \POST /api/v1/auth/login\ - Login and get JWT token
- \GET /api/v1/auth/me\ - Get current user info

### Risk Management
- \GET /api/v1/risk/live\ - Get recent risk assessments
- \GET /api/v1/risk/{risk_id}\ - Get specific risk assessment
- \GET /api/v1/risk/history\ - Get risk history with filters
- \GET /api/v1/risk/stats\ - Get risk statistics

### Alerts
- \GET /api/v1/alerts\ - Get alerts (with filters)
- \POST /api/v1/alerts/{id}/acknowledge\ - Acknowledge alert
- \POST /api/v1/alerts/{id}/resolve\ - Resolve alert
- \GET /api/v1/alerts/stats\ - Get alert statistics

### Explainability
- \POST /api/v1/explain/risk\ - Get AI explanation for risk

### Configuration
- \GET /api/v1/config\ - Get current configuration
- \PUT /api/v1/config\ - Update configuration

### Audit
- \GET /api/v1/audit/logs\ - Query audit logs (Admin only)

### WebSocket
- \WS /ws/risk-stream\ - Real-time risk updates stream

##  Authentication

### Register User

\\\ash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@example.com",
    "username": "analyst",
    "password": "securepass123",
    "role": "analyst"
  }'
\\\

### Login

\\\ash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "analyst",
    "password": "securepass123"
  }'
\\\

Response:
\\\json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
\\\

### Use Token

\\\ash
curl -X GET http://localhost:8000/api/v1/risk/live \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
\\\

##  Role-Based Access Control

### Roles
- **Admin**: Full access to all endpoints including audit logs and configuration
- **Analyst**: Can view risks, manage alerts, and get explanations
- **Viewer**: Read-only access to risks and alerts

##  Real-Time Streaming

The system uses **Pathway** for streaming data processing:

1. **Data Ingestion**: Simulated streaming events (can connect to Kafka/APIs)
2. **Feature Engineering**: Real-time feature computation
3. **Risk Scoring**: Continuous risk assessment
4. **Alert Generation**: Automatic alerts for high-risk events
5. **WebSocket Push**: Real-time updates to connected clients

### WebSocket Example (JavaScript)

\\\javascript
const ws = new WebSocket('ws://localhost:8000/ws/risk-stream');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Risk Update:', data);
};

ws.onopen = () => {
  console.log('Connected to risk stream');
};
\\\

##  Testing

### Interactive API Documentation

Visit http://localhost:8000/docs for the automatically generated interactive API documentation (Swagger UI).

### Health Check

\\\ash
curl http://localhost:8000/api/v1/health
\\\

##  Configuration

### Environment Variables

Create a \.env\ file in the Backend directory:

\\\env
# Application
APP_NAME=Real-Time Risk Management System
DEBUG=True
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/risk_management

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Risk Thresholds
RISK_HIGH_THRESHOLD=0.8
RISK_MEDIUM_THRESHOLD=0.5
RISK_LOW_THRESHOLD=0.3

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# AI (Optional)
OPENAI_API_KEY=your-openai-key
RAG_ENABLED=False
\\\

##  Monitoring & Logging

- **Application Logs**: Structured JSON logging
- **Audit Trail**: All actions logged to database
- **Health Endpoint**: \/api/v1/health\ for service health
- **Metrics**: WebSocket connection count, risk statistics

##  Deployment

### Production Checklist

- [ ] Change \SECRET_KEY\ to a strong random value
- [ ] Set \DEBUG=False\
- [ ] Use strong database passwords
- [ ] Configure proper CORS origins
- [ ] Set up reverse proxy (Nginx)
- [ ] Enable HTTPS
- [ ] Configure monitoring and alerts
- [ ] Set up database backups
- [ ] Review and harden security settings

### Docker Production

\\\ash
# Build
docker build -f docker/Dockerfile -t risk-management:latest .

# Run
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/risk_management \
  -e SECRET_KEY=production-secret-key \
  -e DEBUG=False \
  risk-management:latest
\\\

##  Troubleshooting

### Database Connection Issues

\\\ash
# Check PostgreSQL is running
docker ps | grep postgres

# Connect to database
psql -h localhost -U postgres -d risk_management
\\\

### Reset Database

\\\ash
# Drop and recreate
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
\\\

##  Additional Documentation

- [API Documentation](http://localhost:8000/docs) - Interactive Swagger UI
- [ReDoc](http://localhost:8000/redoc) - Alternative API docs

##  Contributing

1. Follow the existing code structure
2. Add type hints
3. Write docstrings for functions
4. Test your changes
5. Update documentation

##  License

This project is part of the Real-Time Risk Management System.

##  Support

For issues or questions, please refer to the project documentation or contact the development team.

---

**Built with  using FastAPI, Pathway, and PostgreSQL**
