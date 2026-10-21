from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.base_helpers import generate_uuid, utc_now

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user', 'assistant', 'system', 'tool'
    content = Column(Text, nullable=False)
    
    # Metadata & Metrics
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    latency_ms = Column(Float, nullable=True)
    citations_json = Column(Text, nullable=True)  # JSON-encoded citations list
    tool_calls_json = Column(Text, nullable=True) # JSON-encoded tool calls
    
    created_at = Column(DateTime, default=utc_now, index=True)

    conversation = relationship("Conversation", back_populates="messages")
