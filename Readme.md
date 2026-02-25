# Real-Time Risk Management System

A production-ready, streaming-first platform for monitoring, assessing, and responding to financial risk in real time. It combines a **FastAPI** backend with a **Pathway** streaming pipeline, a **React + TypeScript** frontend, and WebSocket-driven live updates — all containerised with Docker.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Option 1 — Docker Compose (Recommended)](#option-1--docker-compose-recommended)
  - [Option 2 — Local Development](#option-2--local-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [WebSocket Stream](#websocket-stream)
- [Role-Based Access Control](#role-based-access-control)
- [Frontend Screens](#frontend-screens)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The Real-Time Risk Management System ingests live or simulated streaming market data, computes risk scores continuously using a Black-76 option pricing model and rolling-window feature engineering, generates threshold-based alerts, and pushes every update to connected clients via WebSockets — all while maintaining a full audit trail and offering AI-powered explanations for each risk decision.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│   Dashboard · Market Feed · Risk Metrics · Data Source       │
│   WebSocket client ──────────────────────────────────────►  │
└─────────────────────────────┬────────────────────────────────┘
                              │  REST + WebSocket
┌─────────────────────────────▼────────────────────────────────┐
│                    FastAPI Backend                           │
│  Auth · Risk · Alerts · Explain · Config · Audit · Health    │
│                              │                               │
│         ┌────────────────────▼─────────────────────┐        │
│         │         Pathway Streaming Pipeline         │        │
│         │  Simulator → Feature Eng → Risk Scoring   │        │
│         └────────────────────┬─────────────────────┘        │
│                              │                               │
│   ┌──────────────┐   ┌───────▼──────────┐                   │
│   │  PostgreSQL  │   │      Redis        │                   │
│   │  (primary)   │   │  (cache/pub-sub)  │                   │
│   └──────────────┘   └──────────────────┘                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.115 |
| Streaming | Pathway |
| Database | PostgreSQL 15 + SQLAlchemy 2.0 |
| Cache | Redis 7 (optional) |
| Auth | JWT (`python-jose`) + bcrypt (`passlib`) |
| Risk Model | Black-76, rolling windows, NumPy, SciPy |
| AI / RAG | Pathway Document Store (pluggable LLM) |
| Server | Uvicorn |
| Tests | pytest + pytest-asyncio |
| Deployment | Docker & Docker Compose |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| Charts | Recharts 2.15 |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React, MUI Icons |
| Forms | React Hook Form |
| Notifications | Sonner |

---

## Features

### Backend

- **JWT Authentication** — register, login, and token-based session management
- **Role-Based Access Control** — Admin · Analyst · Viewer permission tiers
- **Streaming Risk Engine** — Pathway pipeline with rolling-window feature engineering and Black-76 pricing
- **Alert System** — automatic threshold alerts, acknowledge & resolve workflows
- **AI Explainability** — RAG-based "Why is this risky?" endpoint
- **Configuration API** — update risk thresholds at runtime without restarts
- **Audit Logging** — every user action and risk decision persisted to the database
- **WebSocket Push** — real-time risk and alert broadcasts to all connected clients
- **Middleware** — request/response logging, global error handling, CORS
- **Health Check** — `GET /health` with dependency status
- **Interactive API Docs** — Swagger UI at `/docs`, ReDoc at `/redoc`

### Frontend

- **Live Dashboard** — real-time risk score cards and KPI metrics
- **Market Feed** — streaming events with severity colour indicators
- **Risk Metrics** — Recharts line charts (24 h trends), pie charts (severity distribution), bar charts (alert counts)
- **Data Source Screen** — toggle Live / Demo mode; select up to 20 NSE / BSE symbols
- **Market Hours** — live IST clock tracking the 9:15 AM – 3:30 PM trading session
- **About & Settings** — platform documentation and user preferences
- **Dark Mode** — full dark-mode support across all screens
- **Loading & Error States** — skeletons, spinners, error boundaries, toast notifications
- **Responsive Design** — optimised for desktop and tablet viewports

---

## Project Structure

```
Real-time-risk-management/
├── Backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point + middleware
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic settings
│   │   │   ├── security.py          # Password hashing & JWT
│   │   │   ├── dependencies.py      # Shared FastAPI dependencies
│   │   │   └── middleware.py        # Request logging & error handling
│   │   ├── auth/                    # Registration, login, user model
│   │   ├── risk/                    # Risk scoring engine & endpoints
│   │   ├── alerts/                  # Alert CRUD & acknowledgement
│   │   ├── explain/                 # RAG-based AI explanations
│   │   ├── audit/                   # Audit log model & router
│   │   ├── config/                  # Dynamic configuration endpoints
│   │   ├── streaming/               # Pathway pipeline & event simulator
│   │   └── websocket/               # WebSocket connection manager
│   ├── db/
│   │   ├── session.py               # SQLAlchemy engine & session factory
│   │   └── base.py                  # Declarative base
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   ├── .env.example
│   ├── requirements.txt
│   ├── test_api.py
│   └── test_comprehensive.py
│
├── Frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── components/          # All screen and UI components
│   │   │   ├── contexts/            # React context providers
│   │   │   ├── services/            # REST & WebSocket API clients
│   │   │   └── hooks/               # Custom React hooks
│   │   └── styles/                  # theme.css · animations.css · index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── ACTION_PLAN.md
├── BACKEND_SPEC.md
├── PROJECT_STATUS.md
└── Readme.md
```

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) *(Option 1)*
- **or** Python 3.11+, PostgreSQL 15+, Node.js 18+, npm *(Option 2)*

---

### Option 1 — Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/sohamkadu17/Real-time-risk-management.git
cd Real-time-risk-management/Backend

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env — set SECRET_KEY, database credentials, etc.

# 3. Start all services (backend + PostgreSQL + Redis)
docker compose -f docker/docker-compose.yml up -d

# 4. Follow application logs
docker compose -f docker/docker-compose.yml logs -f app

# 5. Stop all services
docker compose -f docker/docker-compose.yml down
```

Backend: **http://localhost:8000**  
Swagger UI: **http://localhost:8000/docs**

---

### Option 2 — Local Development

#### Backend

```bash
cd Backend

# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Linux / macOS
# venv\Scripts\activate         # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env
# Edit .env — DATABASE_URL, SECRET_KEY, etc.

# 4. Initialise the database
python -c "from db.session import init_db; init_db()"

# 5. Start the development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd Frontend

# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Frontend: **http://localhost:5173**

---

## Environment Variables

Create `Backend/.env` from the provided template:

```env
# Application
APP_NAME=Real-Time Risk Management System
DEBUG=True
SECRET_KEY=change-this-to-a-random-secret-key-in-production
API_VERSION=v1

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/risk_management

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Risk Thresholds
RISK_HIGH_THRESHOLD=0.8
RISK_MEDIUM_THRESHOLD=0.5
RISK_LOW_THRESHOLD=0.3

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI / RAG (optional)
OPENAI_API_KEY=your-openai-api-key-here
RAG_ENABLED=False

# Logging
LOG_LEVEL=INFO
```

---

## API Reference

All REST endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Login and receive JWT | No |
| `GET` | `/auth/me` | Get current user profile | Yes |

### Risk Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/risk/live` | Latest real-time risk assessments |
| `GET` | `/risk/{risk_id}` | Specific risk record by ID |
| `GET` | `/risk/history` | Historical risk data with filters |
| `GET` | `/risk/stats` | Aggregated risk statistics |

### Alerts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/alerts` | List all alerts (filterable by severity) |
| `POST` | `/alerts/{id}/acknowledge` | Acknowledge an alert |
| `POST` | `/alerts/{id}/resolve` | Resolve an alert |
| `GET` | `/alerts/stats` | Alert statistics |

### AI Explainability

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/explain/risk` | Natural-language explanation for a risk event |
| `GET` | `/explain/platform` | Platform-level documentation via RAG |

### Configuration *(Admin only)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/config` | Read current risk thresholds and settings |
| `PUT` | `/config` | Update thresholds at runtime |
| `GET` | `/config/validate` | Validate current configuration |

### Audit *(Admin only)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/audit/logs` | Query the full audit trail |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health and dependency status |

---

## WebSocket Stream

Connect to receive real-time risk and alert events:

```
ws://localhost:8000/ws/risk-stream
```

### JavaScript Example

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/risk-stream');

ws.onopen = () => console.log('Connected to risk stream');

ws.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  // payload.type: "risk_update" | "alert" | "heartbeat"
  console.log(payload);
};

ws.onclose = () => console.log('Disconnected');
```

### Example Payload

```json
{
  "type": "risk_update",
  "data": {
    "id": 42,
    "symbol": "RELIANCE",
    "risk_score": 0.83,
    "severity": "HIGH",
    "timestamp": "2026-02-25T12:00:00Z"
  }
}
```

---

## Role-Based Access Control

| Role | Permissions |
|---|---|
| **Admin** | Full access — config management, audit logs, user administration, all CRUD |
| **Analyst** | View risks, manage alerts, request AI explanations |
| **Viewer** | Read-only access to risks and alerts |

Assign a role at registration:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@example.com",
    "username": "analyst",
    "password": "securepass123",
    "role": "analyst"
  }'
```

Use the returned token in subsequent requests:

```bash
curl http://localhost:8000/api/v1/risk/live \
  -H "Authorization: Bearer <your_token>"
```

---

## Frontend Screens

| Screen | Description |
|---|---|
| **Dashboard** | Real-time KPI cards, live risk feed, WebSocket connection status |
| **Market Feed** | Streaming market events with severity colour-coding |
| **Risk Metrics** | 24-hour trend lines, severity pie charts, alert bar charts (Recharts) |
| **Data Source** | Toggle Live / Demo mode; select NSE / BSE symbols; configure data providers |
| **About** | Platform documentation and live market-hours status (IST clock) |
| **Settings** | User preferences, dark-mode toggle, notification settings |

---

## Testing

### Backend Test Suite

```bash
cd Backend

# Run all tests
pytest test_comprehensive.py -v

# Run individual test files
pytest test_api.py -v
pytest test_config_api.py -v
```

### Interactive API Testing

Open **http://localhost:8000/docs** — every endpoint can be exercised directly in the browser via Swagger UI.

### Health Check

```bash
curl http://localhost:8000/health
```

---

## Deployment

### Production Checklist

- [ ] Generate a strong random `SECRET_KEY`
- [ ] Set `DEBUG=False`
- [ ] Use strong database and Redis passwords
- [ ] Restrict `CORS_ORIGINS` to your actual frontend domain(s)
- [ ] Place behind a reverse proxy (Nginx / Caddy) with TLS/HTTPS
- [ ] Configure structured log aggregation (ELK, Loki, etc.)
- [ ] Enable automated database backups
- [ ] Set up uptime monitoring (Prometheus + Grafana recommended)

### Docker Production Build

```bash
cd Backend

# Build the image
docker build -f docker/Dockerfile -t risk-management:latest .

# Run with production settings
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/risk_management \
  -e SECRET_KEY=<strong-random-key> \
  -e DEBUG=False \
  risk-management:latest
```

---

## Contributing

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Follow the existing code style — type hints everywhere, docstrings for non-trivial logic.
3. Add or update tests for any changed behaviour.
4. Open a Pull Request with a clear description of your changes.

---

## License
