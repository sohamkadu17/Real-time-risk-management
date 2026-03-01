FROM python:3.11-slim

WORKDIR /app

# System dependencies
# ─────────────────────────────────────────────────────────────
# gcc / g++ / build-essential : compile any C-extension deps
# libssl-dev / pkg-config     : required by Pathway's Rust wheel
#                               (even the pre-built wheel links to libssl)
# postgresql-client           : pg_isready health check + psql utilities
# ─────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    build-essential \
    libssl-dev \
    pkg-config \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]







# docker run --env-file .env -p 8000:8000 risk-backend
