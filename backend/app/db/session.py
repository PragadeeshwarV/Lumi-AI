import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings, DATA_DIR

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    # Resolve relative sqlite paths to absolute DATA_DIR path
    if "///./data/" in db_url or "///data/" in db_url:
        db_file = DATA_DIR / "lumi.db"
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        # Use forward slashes for SQLite URI on Windows
        db_url = f"sqlite:///{db_file.as_posix()}"
    elif db_url.startswith("sqlite:////") or db_url.startswith("sqlite:///"):
        # Make sure directory exists if absolute path
        path_str = db_url.replace("sqlite:///", "")
        p = Path(path_str)
        p.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
