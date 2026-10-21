import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)
