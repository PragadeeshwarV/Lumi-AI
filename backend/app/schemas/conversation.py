from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Chat"
    assistant_mode: Optional[str] = "general"
    model_name: Optional[str] = "qwen/qwen3.8-27b"
    system_prompt: Optional[str] = None

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    assistant_mode: Optional[str] = None
    model_name: Optional[str] = None
    system_prompt: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_favourite: Optional[bool] = None

class MessageInConversation(BaseModel):
    id: str
    role: str
    content: str
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    latency_ms: Optional[float] = None
    citations_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationResponse(BaseModel):
    id: str
    title: str
    assistant_mode: str
    model_name: str
    system_prompt: Optional[str] = None
    is_pinned: bool
    is_favourite: bool
    created_at: datetime
    updated_at: datetime
    messages: List[MessageInConversation] = []

    model_config = ConfigDict(from_attributes=True)

class ConversationListItem(BaseModel):
    id: str
    title: str
    assistant_mode: str
    model_name: str
    is_pinned: bool
    is_favourite: bool
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message_preview: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
