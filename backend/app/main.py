import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings, PROJECT_ROOT
from app.core.logging import setup_logging, logger
from app.core.exceptions import LumiException
from app.db.session import engine, Base
import app.models

from app.api.routes import (
    auth,
    conversations,
    chat,
    documents,
    analysis,
    memory,
    settings as settings_route,
    voice,
    health
)

setup_logging()

# Determine Frontend Build Directory
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Lumi AI Database Schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Lumi AI Backend Initialized Successfully.")
    yield
    logger.info("Shutting down Lumi AI Backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Advanced AI conversation, voice, and knowledge assistant platform.",
    lifespan=lifespan
)

# CORS Middleware (supports multi-origin or same-origin deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Global Custom Exception Handler
@app.exception_handler(LumiException)
async def lumi_exception_handler(request: Request, exc: LumiException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Register API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(memory.router, prefix=settings.API_V1_STR)
app.include_router(settings_route.router, prefix=settings.API_V1_STR)
app.include_router(voice.router, prefix=settings.API_V1_STR)

# Mount Frontend Static Assets
if FRONTEND_DIST.exists() and (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

# Single-Service SPA Routing: Serve index.html for all non-API routes
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Exclude API, Swagger docs, and openapi schema
    if full_path.startswith("api/") or full_path in ["docs", "redoc", "openapi.json"]:
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    if FRONTEND_DIST.exists():
        file_path = FRONTEND_DIST / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)

        index_file = FRONTEND_DIST / "index.html"
        if index_file.is_file():
            return FileResponse(index_file)

    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }
