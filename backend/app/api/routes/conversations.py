from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from fastapi.responses import PlainTextResponse, JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.message import Message
from app.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationListItem
)
from app.services.conversation_service import conversation_service

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.post("/", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = conversation_service.create_conversation(db, current_user.id, data)
    return conv

@router.get("/", response_model=List[ConversationListItem])
def list_conversations(
    q: Optional[str] = Query(None, description="Search keyword in titles or messages"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return conversation_service.list_conversations(db, current_user.id, query=q)

@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return conversation_service.get_conversation(db, conversation_id, current_user.id)

@router.patch("/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: str,
    data: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return conversation_service.update_conversation(db, conversation_id, current_user.id, data)

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation_service.delete_conversation(db, conversation_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.delete("/{conversation_id}/messages", status_code=status.HTTP_204_NO_CONTENT)
def clear_conversation_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = conversation_service.get_conversation(db, conversation_id, current_user.id)
    db.query(Message).filter(Message.conversation_id == conv.id).delete()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{conversation_id}/export/markdown")
def export_markdown(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = conversation_service.get_conversation(db, conversation_id, current_user.id)
    md_content = conversation_service.export_conversation_markdown(conv)
    return PlainTextResponse(
        content=md_content,
        headers={"Content-Disposition": f'attachment; filename="conversation_{conv.id[:8]}.md"'}
    )

@router.get("/{conversation_id}/export/json")
def export_json(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = conversation_service.get_conversation(db, conversation_id, current_user.id)
    json_data = conversation_service.export_conversation_json(conv)
    return JSONResponse(
        content=json_data,
        headers={"Content-Disposition": f'attachment; filename="conversation_{conv.id[:8]}.json"'}
    )
