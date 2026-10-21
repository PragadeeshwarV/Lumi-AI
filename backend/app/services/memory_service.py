from typing import List
from sqlalchemy.orm import Session
from app.models.memory import UserMemory

class MemoryService:
    @staticmethod
    def get_user_memories(db: Session, user_id: str, active_only: bool = True) -> List[UserMemory]:
        q = db.query(UserMemory).filter(UserMemory.user_id == user_id)
        if active_only:
            q = q.filter(UserMemory.is_active == True)
        return q.order_by(UserMemory.created_at.desc()).all()

    @staticmethod
    def format_memories_for_prompt(db: Session, user_id: str) -> str:
        memories = MemoryService.get_user_memories(db, user_id, active_only=True)
        if not memories:
            return ""

        lines = ["User Preferences & Saved Memories:"]
        for m in memories:
            lines.append(f"- {m.key}: {m.value}")
        return "\n".join(lines)

memory_service = MemoryService()
