import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import ConversationCreate, ConversationUpdate, ConversationListItem
from app.core.exceptions import ResourceNotFoundException

class ConversationService:
    @staticmethod
    def create_conversation(db: Session, user_id: str, data: ConversationCreate) -> Conversation:
        conv = Conversation(
            user_id=user_id,
            title=data.title or "New Chat",
            assistant_mode=data.assistant_mode or "general",
            model_name=data.model_name or "llama-3.3-70b-versatile",
            system_prompt=data.system_prompt
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    @staticmethod
    def get_conversation(db: Session, conversation_id: str, user_id: str) -> Conversation:
        conv = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        ).first()
        if not conv:
            raise ResourceNotFoundException("Conversation", conversation_id)
        return conv

    @staticmethod
    def list_conversations(
        db: Session,
        user_id: str,
        query: Optional[str] = None
    ) -> List[ConversationListItem]:
        q = db.query(Conversation).filter(Conversation.user_id == user_id)

        if query and query.strip():
            search_term = f"%{query.strip()}%"
            # Search both title and message contents
            matching_conv_ids = db.query(Message.conversation_id).filter(
                Message.content.ilike(search_term)
            ).distinct()
            q = q.filter(
                or_(
                    Conversation.title.ilike(search_term),
                    Conversation.id.in_(matching_conv_ids)
                )
            )

        # Pinned first, then updated_at desc
        conversations = q.order_by(desc(Conversation.is_pinned), desc(Conversation.updated_at)).all()

        items = []
        for conv in conversations:
            msg_count = len(conv.messages)
            last_preview = None
            if conv.messages:
                last_preview = conv.messages[-1].content[:80] + ("..." if len(conv.messages[-1].content) > 80 else "")

            items.append(ConversationListItem(
                id=conv.id,
                title=conv.title,
                assistant_mode=conv.assistant_mode,
                model_name=conv.model_name,
                is_pinned=conv.is_pinned,
                is_favourite=conv.is_favourite,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=msg_count,
                last_message_preview=last_preview
            ))
        return items

    @staticmethod
    def update_conversation(db: Session, conversation_id: str, user_id: str, data: ConversationUpdate) -> Conversation:
        conv = ConversationService.get_conversation(db, conversation_id, user_id)
        if data.title is not None:
            conv.title = data.title.strip()
        if data.assistant_mode is not None:
            conv.assistant_mode = data.assistant_mode
        if data.model_name is not None:
            conv.model_name = data.model_name
        if data.system_prompt is not None:
            conv.system_prompt = data.system_prompt
        if data.is_pinned is not None:
            conv.is_pinned = data.is_pinned
        if data.is_favourite is not None:
            conv.is_favourite = data.is_favourite

        db.commit()
        db.refresh(conv)
        return conv

    @staticmethod
    def delete_conversation(db: Session, conversation_id: str, user_id: str):
        conv = ConversationService.get_conversation(db, conversation_id, user_id)
        db.delete(conv)
        db.commit()

    @staticmethod
    def export_conversation_markdown(conv: Conversation) -> str:
        lines = [
            f"# {conv.title}",
            f"*Exported from Lumi AI on {conv.updated_at.strftime('%Y-%m-%d %H:%M:%S')}*",
            f"**Model:** {conv.model_name} | **Assistant Mode:** {conv.assistant_mode.capitalize()}",
            "\n---\n"
        ]
        for msg in conv.messages:
            role_name = "👤 You" if msg.role == "user" else "✨ Lumi AI"
            lines.append(f"### {role_name} ({msg.created_at.strftime('%H:%M:%S')})\n")
            lines.append(msg.content)
            if msg.citations_json:
                try:
                    cits = json.loads(msg.citations_json)
                    if cits:
                        lines.append("\n**Sources Cited:**")
                        for c in cits:
                            lines.append(f"- {c.get('source')}: {c.get('content')}")
                except Exception:
                    pass
            lines.append("\n---\n")
        return "\n".join(lines)

    @staticmethod
    def export_conversation_json(conv: Conversation) -> Dict[str, Any]:
        return {
            "id": conv.id,
            "title": conv.title,
            "assistant_mode": conv.assistant_mode,
            "model_name": conv.model_name,
            "created_at": conv.created_at.isoformat(),
            "updated_at": conv.updated_at.isoformat(),
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "prompt_tokens": m.prompt_tokens,
                    "completion_tokens": m.completion_tokens,
                    "latency_ms": m.latency_ms,
                    "citations": json.loads(m.citations_json) if m.citations_json else None,
                    "created_at": m.created_at.isoformat()
                }
                for m in conv.messages
            ]
        }

conversation_service = ConversationService()
