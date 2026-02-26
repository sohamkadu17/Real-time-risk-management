# Contributing to Real-Time Risk Management System

Thank you for your interest in contributing!

---

## How to Contribute

### 1. Fork & Clone

```bash
git fork <repo-url>
git clone <your-fork-url>
cd real-time-risk-management
```

### 2. Create a Branch

Use a descriptive branch name:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Set Up Development Environment

**Backend:**
```bash
cd Backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env
```

**Frontend:**
```bash
cd Frontend
npm install
```

### 4. Make Your Changes

- Follow the existing code structure and naming conventions
- Add type hints to all Python functions
- Write docstrings for all new functions and classes
- Keep functions small and focused (single responsibility)
- Do not commit secrets or API keys

### 5. Test Your Changes

```bash
# Backend tests
cd Backend
pytest

# Check the API is still healthy
python -m uvicorn app.main:app --reload --port 8000
curl http://localhost:8000/api/v1/health
```

### 6. Commit

Write clear, concise commit messages:

```
feat: add real-time portfolio risk aggregation
fix: resolve WebSocket disconnection on timeout
docs: update API reference for alerts endpoint
refactor: extract risk scoring into standalone module
```

### 7. Open a Pull Request

- Fill out the PR template
- Link any related issues
- Describe what changed and why

---

## Code Standards

### Python (Backend)
- Follow [PEP 8](https://pep8.org/)
- Use type hints everywhere
- Pydantic models for all request/response schemas
- SQLAlchemy models for all database entities

### JavaScript/TypeScript (Frontend)
- Use TypeScript types for all props and state
- Prefer functional components and hooks
- Keep components small and reusable

### Git
- Commit often with meaningful messages
- Keep PRs focused — one feature or fix per PR
- Rebase on main before opening a PR

---

## Reporting Issues

When opening an issue, please include:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Python/Node version, Docker version)

---

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/description` | `feature/kafka-integration` |
| Bug Fix | `fix/description` | `fix/websocket-timeout` |
| Docs | `docs/description` | `docs/api-reference` |
| Refactor | `refactor/description` | `refactor/risk-engine` |

---

Thank you for making this project better!
