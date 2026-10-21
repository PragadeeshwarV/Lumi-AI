import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory for the backend/project
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
VECTOR_DIR = DATA_DIR / "vector_store"

# Ensure runtime directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VECTOR_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lumi AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = "development"

    # Security & Auth
    SECRET_KEY: str = "lumi-ai-production-super-secret-key-change-in-production-2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database (SQLite by default for local development, PostgreSQL compatible)
    DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'lumi.db'}"

    # Groq AI Configuration
    GROQ_API_KEY: str = ""
    GROQ_DEFAULT_MODEL: str = "qwen/qwen3.8-27b"
    ALLOWED_MODELS: List[str] = [
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "allam-2-7b"
    ]
    LLM_REQUEST_TIMEOUT: float = 60.0
    MAX_CONVERSATION_CONTEXT: int = 20

    # RAG & Embeddings
    EMBEDDING_PROVIDER: str = "local"  # local (scikit-learn vectorizer), or openai, or huggingface
    EMBEDDING_API_KEY: str = ""
    MAX_UPLOAD_SIZE_MB: int = 25
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    TOP_K_RETRIEVAL: int = 4

    # Web Search
    WEB_SEARCH_ENABLED: bool = True
    WEB_SEARCH_PROVIDER: str = "duckduckgo"  # duckduckgo, tavily, serpapi
    WEB_SEARCH_API_KEY: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
