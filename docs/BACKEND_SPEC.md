You are a senior backend architect and Python engineer.

Your task is to generate a COMPLETE, PRODUCTION-READY backend for a 
Real-Time Risk Management System using a streaming-first architecture.

⚠️ IMPORTANT RULES:
- Do NOT skip any layer
- Do NOT assume files exist unless you create them
- Use clean architecture and modular structure
- Code must be runnable
- Add comments where logic is non-trivial
- Use Python only
- Follow industry best practices
- Generate ALL files

====================================================
1️⃣ SYSTEM OVERVIEW
====================================================

We are building a Real-Time Risk Management System that:
- Ingests live or simulated streaming data
- Computes risk scores continuously
- Generates alerts in real time
- Stores audit logs
- Provides explainability using AI (RAG-ready)
- Streams updates to frontend via WebSockets

The system must be scalable, auditable, and real-time.

====================================================
2️⃣ TECH STACK (MANDATORY)
====================================================

Backend Framework:
- FastAPI (REST + WebSocket)

Streaming Engine:
- Pathway (for real-time ingestion and processing)

Database:
- PostgreSQL (via SQLAlchemy)
- Redis (for caching + pub/sub, optional)

AI / Explainability:
- Pathway Document Store (RAG-ready)
- Pluggable LLM interface (OpenAI/Gemini-compatible abstraction)

Auth:
- JWT-based authentication
- Role-based access control (Admin, Analyst, Viewer)

Deployment:
- Docker & Docker Compose

====================================================
3️⃣ REQUIRED BACKEND FEATURES
====================================================

AUTHENTICATION
- User registration & login
- Password hashing
- JWT access token
- Role-based permissions

DATA INGESTION
- Simulated streaming data source using Pathway
- Connector abstraction for future Kafka / API ingestion

RISK ENGINE
- Streaming feature engineering
- Rolling windows
- Rule-based + probabilistic risk scoring
- Risk severity classification

ALERT SYSTEM
- Threshold-based alerts
- Alert persistence
- Acknowledge / resolve alerts

REAL-TIME UPDATES
- WebSocket server
- Push risk updates & alerts to clients

AUDIT LOGGING
- Store all risk decisions
- Store user actions
- Queryable audit trail

AI EXPLAINABILITY
- RAG-ready document ingestion
- “Why is this risky?” endpoint
- Explain risk using latest data + stored documents

CONFIGURATION
- Dynamic risk thresholds
- Config reload without restart

====================================================
4️⃣ REQUIRED API ENDPOINTS
====================================================

Auth:
- POST /auth/register
- POST /auth/login

Risk:
- GET /risk/live
- GET /risk/{risk_id}
- GET /risk/history

Alerts:
- GET /alerts
- POST /alerts/{id}/acknowledge

Explainability:
- POST /explain/risk

Config:
- GET /config
- PUT /config

Audit:
- GET /audit/logs

WebSocket:
- /ws/risk-stream

====================================================
5️⃣ REQUIRED FOLDER STRUCTURE
====================================================

backend/
│
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── dependencies.py
│   ├── auth/
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── service.py
│   ├── risk/
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── engine.py
│   ├── alerts/
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── service.py
│   ├── explain/
│   │   ├── router.py
│   │   ├── rag.py
│   ├── audit/
│   │   ├── models.py
│   │   ├── router.py
│   ├── streaming/
│   │   ├── pathway_pipeline.py
│   │   ├── simulator.py
│   ├── websocket/
│   │   ├── manager.py
│
├── db/
│   ├── session.py
│   ├── base.py
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│
├── requirements.txt
└── README.md

====================================================
6️⃣ STREAMING REQUIREMENTS
====================================================

- Use Pathway streaming APIs
- Support rolling window computations
- Simulate live events if real data unavailable
- Risk updates must propagate to WebSocket layer

====================================================
7️⃣ QUALITY REQUIREMENTS
====================================================

- Clear separation of concerns
- Type hints everywhere
- Error handling
- Logging
- Security best practices
- Easily extensible

====================================================
8️⃣ OUTPUT FORMAT
====================================================

Generate:
- All files
- Full code for each file
- No placeholders like "TODO"
- README with run instructions
- Dockerized setup

====================================================
START NOW
====================================================
