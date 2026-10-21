from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class Citation(BaseModel):
    source: str
    content: str
    relevance_score: Optional[float] = None
    chunk_id: Optional[str] = None

class ChatMessageCreate(BaseModel):
    conversation_id: Optional[str] = None
    content: str
    model_name: Optional[str] = None
    assistant_mode: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048
    enable_web_search: Optional[bool] = False
    document_ids: Optional[List[str]] = None

class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    latency_ms: Optional[float] = None
    citations: Optional[List[Citation]] = None
    created_at: datetime

class RegenerateRequest(BaseModel):
    message_id: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = 0.7

class EditMessageRequest(BaseModel):
    content: str
    model_name: Optional[str] = None
    temperature: Optional[float] = 0.7
