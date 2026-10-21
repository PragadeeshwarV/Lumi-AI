from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings
from app.services.llm.registry import get_llm_provider
from app.services.search_service import search_service

router = APIRouter(tags=["Health & Diagnostics"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    # Verify DB connectivity
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    llm = get_llm_provider()

    return {
        "status": "healthy" if db_ok else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_connected": db_ok,
        "groq_configured": llm.is_available(),
        "web_search_available": search_service.is_available(),
        "default_model": settings.GROQ_DEFAULT_MODEL
    }

@router.get("/readiness")
def readiness_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"ready": True}
    except Exception as e:
        return {"ready": False, "error": str(e)}
