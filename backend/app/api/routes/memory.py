from typing import List
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.memory import UserMemory
from app.schemas.memory import MemoryCreate, MemoryUpdate, MemoryResponse
from app.core.exceptions import ResourceNotFoundException

router = APIRouter(prefix="/memory", tags=["Memory & Preferences"])

@router.get("/", response_model=List[MemoryResponse])
def list_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(UserMemory).filter(UserMemory.user_id == current_user.id).order_by(UserMemory.created_at.desc()).all()

@router.post("/", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
def create_memory(
    data: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mem = UserMemory(
        user_id=current_user.id,
        key=data.key.strip(),
        value=data.value.strip()
    )
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return mem

@router.patch("/{memory_id}", response_model=MemoryResponse)
def update_memory(
    memory_id: str,
    data: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mem = db.query(UserMemory).filter(
        UserMemory.id == memory_id,
        UserMemory.user_id == current_user.id
    ).first()
    if not mem:
        raise ResourceNotFoundException("Memory item", memory_id)

    if data.value is not None:
        mem.value = data.value.strip()
    if data.is_active is not None:
        mem.is_active = data.is_active

    db.commit()
    db.refresh(mem)
    return mem

@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mem = db.query(UserMemory).filter(
        UserMemory.id == memory_id,
        UserMemory.user_id == current_user.id
    ).first()
    if not mem:
        raise ResourceNotFoundException("Memory item", memory_id)

    db.delete(mem)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
