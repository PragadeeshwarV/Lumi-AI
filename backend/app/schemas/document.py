from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    content: str
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    status: str
    chunk_count: int
    created_at: datetime
    conversation_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class RAGQueryRequest(BaseModel):
    query: str
    document_ids: Optional[List[str]] = None
    top_k: Optional[int] = 4

class RAGChunkMatch(BaseModel):
    document_id: str
    filename: str
    chunk_id: str
    content: str
    score: float
