# ==============================================================================
# LUMI AI - UNIFIED SINGLE-SERVICE DOCKERFILE FOR RENDER
# ==============================================================================

# Stage 1: Build the React 19 + TypeScript Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend + Static SPA Serving
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Copy built frontend production bundle
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Ensure persistent data directory exists
RUN mkdir -p /app/data

# Default production environment variables
ENV PYTHONUNBUFFERED=1
ENV APP_ENV=production
ENV PORT=8000
ENV DATABASE_URL=sqlite:////app/data/lumi.db

EXPOSE 8000

# Launch Uvicorn binding to Render's dynamic $PORT
WORKDIR /app/backend
CMD python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
