from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    default_model: Optional[str] = None
    default_mode: Optional[str] = None
    assistant_instructions: Optional[str] = None
    speech_voice: Optional[str] = None
    speech_rate: Optional[float] = None

class SettingsResponse(BaseModel):
    theme: str
    default_model: str
    default_mode: str
    assistant_instructions: str
    speech_voice: str
    speech_rate: float
    allowed_models: List[str]
    groq_configured: bool
    web_search_configured: bool
    embedding_provider: str
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
