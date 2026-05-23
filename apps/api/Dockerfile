# --- Armstrong Arikat Research Terminal — backend image -------------------
# Python 3.11 slim, layered for fast rebuilds. Listens on $PORT (Railway sets it).
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System deps for kaleido (PNG export) + httpx TLS.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        libexpat1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first (better cache).
# Paths are repo-root-relative so this Dockerfile can be built either from
# `apps/api/` (legacy local docker build) OR from repo root (Railway default
# without setting Root Directory in the UI). The root-level `railway.json`
# tells Railway to use this file with the repo root as build context.
COPY apps/api/requirements.txt ./
RUN pip install -r requirements.txt

# App code.
COPY apps/api/app ./app

# Railway injects PORT; default to 8000 for local docker run.
ENV PORT=8000
EXPOSE 8000

# uvicorn binds to 0.0.0.0:$PORT. Workers=1 because the in-process APScheduler
# and WebSocket subscription state must live in ONE worker.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
