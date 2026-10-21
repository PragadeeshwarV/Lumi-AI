from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MemoryCreate(BaseModel):
    key: str
    value: str

class MemoryUpdate(BaseModel):
    value: Optional[str] = None
    is_active: Optional[bool] = None

class MemoryResponse(BaseModel):
    id: str
    key: str
    value: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
