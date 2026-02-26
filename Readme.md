# Real-Time Risk Management System

> A production-ready, streaming-first platform for real-time risk assessment, alerting, and AI-powered explainability.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This system provides **continuous, real-time risk scoring** of financial or operational events using a streaming data pipeline. It combines a FastAPI REST/WebSocket backend with a Pathway-powered streaming engine, a React dashboard for live visualization, and a RAG-based AI layer for human-readable risk explanations.

Designed for hackathon demonstrations and extendable to production scenarios such as fraud detection, portfolio risk, or operational risk management.

---

## Features

| Feature | Description |
|---|---|
| **Real-Time Streaming** | Pathway pipeline continuously ingests and scores events |
| **Risk Scoring Engine** | Classifies events as LOW / MEDIUM / HIGH / CRITICAL |
| **Automated Alerts** | Triggers alerts when risk exceeds configured thresholds |
| **AI Explainability** | RAG pipeline generates natural-language risk explanations |
| **WebSocket Push** | Live dashboard updates without polling |
| **JWT Auth + RBAC** | Role-based access: Admin, Analyst, Viewer |
| **Audit Logging** | Complete tamper-evident action trail |
| **REST API** | Full OpenAPI-documented endpoint suite |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│            Frontend — React + Vite           │
│              http://localhost:5173            │
└──────────┬───────────────────────┬───────────┘
           │ REST API              │ WebSocket
           ▼                       ▼
┌──────────────────────────────────────────────┐
│          Backend — FastAPI + Uvicorn         │
│  Auth · Risk · Alerts · Explain · Audit      │
│           WebSocket Manager                  │
└──────┬───────────┬──────────────┬────────────┘
       │           │              │
       ▼           ▼              ▼
┌───────────┐ ┌─────────┐ ┌──────────────────┐
│PostgreSQL │ │  Redis  │ │ Pathway Streaming │
│ (storage) │ │ (cache) │ │   Pipeline       │
└───────────┘ └─────────┘ └──────────────────┘
```

### Data Flow

```
Event Source (Simulator / Kafka / API)
        ↓
Pathway Streaming Pipeline
        ↓ (feature engineering)
Risk Scoring Engine
        ↓
PostgreSQL  →  Redis Cache
        ↓
REST API + WebSocket broadcast
        ↓
React Dashboard (live updates)
```

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Language | Python 3.11 |
| API Framework | FastAPI |
| ASGI Server | Uvicorn |
| Streaming | Pathway |
| ORM | SQLAlchemy |
| Validation | Pydantic v2 |
| Auth | python-jose (JWT) + passlib (bcrypt) |
| AI/LLM | OpenAI API + RAG |

### Data
| Layer | Technology |
|---|---|
| Database | PostgreSQL 15 |
| Cache | Redis 7 |

### Frontend
| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS + MUI |
| Real-Time | Native WebSocket |

### DevOps
| Tool | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Multi-service orchestration |

---

## Project Structure

```
real-time-risk-management/
├── Backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py             # App entry point
│   │   ├── auth/               # JWT authentication & RBAC
│   │   ├── risk/               # Risk scoring engine & API
│   │   ├── alerts/             # Alert management
│   │   ├── explain/            # RAG-based AI explainability
│   │   ├── audit/              # Audit logging
│   │   ├── streaming/          # Pathway pipeline & simulator
│   │   ├── websocket/          # WebSocket manager
│   │   ├── config/             # Runtime configuration
│   │   └── core/               # Security, middleware, deps
│   ├── db/                     # Database session & base models
│   ├── docker/                 # Docker Compose config
│   ├── Dockerfile
│   └── requirements.txt
├── Frontend/                   # React + Vite dashboard
│   ├── src/
│   │   ├── app/                # App shell & screen components
│   │   ├── services/           # API & WebSocket clients
│   │   ├── hooks/              # Custom React hooks
│   │   └── styles/             # Global styles & themes
│   ├── package.json
│   └── vite.config.ts
├── docs/                       # Project documentation
│   ├── BACKEND_SPEC.md
│   ├── ACTION_PLAN.md
│   └── PROJECT_STATUS.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- **OR** Python 3.11+, PostgreSQL 15+, Redis 7+ for local setup
- Node.js 18+ (for frontend)

---

### Option 1 — Docker Compose (Recommended)

Starts the backend, PostgreSQL, and Redis in one command.

```bash
cd Backend
docker compose -f docker/docker-compose.yml up -d

# View logs
docker compose -f docker/docker-compose.yml logs -f app

# Stop
docker compose -f docker/docker-compose.yml down
```

---

### Option 2 — Local Development

```bash
# Backend
cd Backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
# Frontend (new terminal)
cd Frontend
npm install
npm run dev
```

---

### Verify

```bash
curl http://localhost:8000/api/v1/health
# {"status":"healthy","database":"connected","streaming":"active"}
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login, get JWT token |
| `GET` | `/api/v1/auth/me` | Get current user info |

### Risk
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/risk/live` | Latest risk assessments |
| `GET` | `/api/v1/risk/{id}` | Single risk assessment |
| `GET` | `/api/v1/risk/history` | Historical data with filters |
| `GET` | `/api/v1/risk/stats` | Aggregate statistics |

### Alerts
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/alerts` | List alerts |
| `POST` | `/api/v1/alerts/{id}/acknowledge` | Acknowledge alert |
| `POST` | `/api/v1/alerts/{id}/resolve` | Resolve alert |
| `GET` | `/api/v1/alerts/stats` | Alert statistics |

### Other
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/explain/risk` | AI explanation for a risk event |
| `GET` | `/api/v1/audit/logs` | Query audit logs (Admin only) |
| `WS` | `/ws/risk-stream` | Real-time risk update stream |

Full interactive docs: **http://localhost:8000/docs**

---

## Configuration

Copy `.env.example` to `.env` in the `Backend/` directory and configure:

```env
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
```

---

## Role-Based Access Control

| Role | Permissions |
|---|---|
| **Admin** | Full access — config, audit logs, all endpoints |
| **Analyst** | Risk data, alert management, AI explanations |
| **Viewer** | Read-only access to risk and alert data |

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
