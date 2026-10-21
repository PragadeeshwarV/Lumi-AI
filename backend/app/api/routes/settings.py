from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.settings import UserSettings
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.core.config import settings
from app.services.llm.registry import get_llm_provider
from app.services.search_service import search_service

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/", response_model=SettingsResponse)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)
        db.commit()
        db.refresh(user_settings)

    llm = get_llm_provider()

    return SettingsResponse(
        theme=user_settings.theme,
        default_model=user_settings.default_model,
        default_mode=user_settings.default_mode,
        assistant_instructions=user_settings.assistant_instructions or "",
        speech_voice=user_settings.speech_voice,
        speech_rate=user_settings.speech_rate,
        allowed_models=settings.ALLOWED_MODELS,
        groq_configured=llm.is_available(),
        web_search_configured=search_service.is_available(),
        embedding_provider=settings.EMBEDDING_PROVIDER,
        updated_at=user_settings.updated_at
    )

@router.patch("/", response_model=SettingsResponse)
def update_settings(
    data: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)

    if data.theme is not None:
        user_settings.theme = data.theme
    if data.default_model is not None and data.default_model in settings.ALLOWED_MODELS:
        user_settings.default_model = data.default_model
    if data.default_mode is not None:
        user_settings.default_mode = data.default_mode
    if data.assistant_instructions is not None:
        user_settings.assistant_instructions = data.assistant_instructions
    if data.speech_voice is not None:
        user_settings.speech_voice = data.speech_voice
    if data.speech_rate is not None:
        user_settings.speech_rate = data.speech_rate

    db.commit()
    db.refresh(user_settings)

    llm = get_llm_provider()

    return SettingsResponse(
        theme=user_settings.theme,
        default_model=user_settings.default_model,
        default_mode=user_settings.default_mode,
        assistant_instructions=user_settings.assistant_instructions or "",
        speech_voice=user_settings.speech_voice,
        speech_rate=user_settings.speech_rate,
        allowed_models=settings.ALLOWED_MODELS,
        groq_configured=llm.is_available(),
        web_search_configured=search_service.is_available(),
        embedding_provider=settings.EMBEDDING_PROVIDER,
        updated_at=user_settings.updated_at
    )
