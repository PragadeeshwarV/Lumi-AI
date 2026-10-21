from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import ChatMessageCreate, RegenerateRequest, EditMessageRequest
from app.services.chat_service import chat_service
from app.core.exceptions import ResourceNotFoundException

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/stream")
async def stream_chat(
    data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure conversation exists or create new one
    conversation_id = data.conversation_id
    if not conversation_id:
        conv = Conversation(
            user_id=current_user.id,
            title=data.content.strip()[:35] + ("..." if len(data.content.strip()) > 35 else ""),
            assistant_mode=data.assistant_mode or "general",
            model_name=data.model_name or "llama-3.3-70b-versatile"
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        conversation_id = conv.id

    generator = chat_service.stream_chat_response(
        db=db,
        user_id=current_user.id,
        conversation_id=conversation_id,
        chat_req=data
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Conversation-Id": conversation_id
        }
    )

@router.post("/conversations/{conversation_id}/regenerate")
async def regenerate_last_response(
    conversation_id: str,
    data: RegenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find last user message in the conversation
    last_assistant_msg = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.role == "assistant"
    ).order_by(Message.created_at.desc()).first()

    if last_assistant_msg:
        # Delete previous assistant response
        db.delete(last_assistant_msg)
        db.commit()

    last_user_msg = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.role == "user"
    ).order_by(Message.created_at.desc()).first()

    if not last_user_msg:
        raise ResourceNotFoundException("No previous user message to regenerate.")

    chat_req = ChatMessageCreate(
        conversation_id=conversation_id,
        content=last_user_msg.content,
        model_name=data.model_name,
        temperature=data.temperature
    )

    generator = chat_service.stream_chat_response(
        db=db,
        user_id=current_user.id,
        conversation_id=conversation_id,
        chat_req=chat_req
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
