import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, status, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentResponse, RAGQueryRequest, RAGChunkMatch
from app.services.document_service import document_service
from app.services.retrieval_service import retrieval_service
from app.core.config import settings, UPLOAD_DIR
from app.core.exceptions import ResourceNotFoundException, LumiException

router = APIRouter(prefix="/documents", tags=["Documents & Knowledge"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".csv", ".json"}

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Validate file size
    file_bytes = await file.read()
    file_size = len(file_bytes)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # Save to disk
    user_upload_dir = UPLOAD_DIR / current_user.id
    user_upload_dir.mkdir(parents=True, exist_ok=True)
    safe_filename = f"{Path(file.filename).stem}_{int(os.times().elapsed)}{suffix}"
    dest_path = user_upload_dir / safe_filename

    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    # Extract text & chunk
    text = document_service.extract_text(dest_path, suffix.replace(".", ""))
    chunks = document_service.chunk_text(text)

    # Create document record
    doc = Document(
        user_id=current_user.id,
        conversation_id=conversation_id,
        filename=file.filename,
        file_type=suffix.replace(".", ""),
        file_size=file_size,
        storage_path=str(dest_path),
        status="ready",
        chunk_count=len(chunks)
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Add chunk records
    for i, chunk_text in enumerate(chunks):
        chunk = DocumentChunk(
            document_id=doc.id,
            chunk_index=i,
            content=chunk_text
        )
        db.add(chunk)

    db.commit()
    db.refresh(doc)
    return doc

@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    conversation_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Document).filter(Document.user_id == current_user.id)
    if conversation_id:
        q = q.filter(Document.conversation_id == conversation_id)
    return q.order_by(Document.created_at.desc()).all()

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise ResourceNotFoundException("Document", document_id)

    # Delete physical file
    try:
        if os.path.exists(doc.storage_path):
            os.remove(doc.storage_path)
    except Exception:
        pass

    db.delete(doc)
    db.commit()
    return None

@router.post("/query", response_model=List[RAGChunkMatch])
def query_rag(
    data: RAGQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = retrieval_service.retrieve_relevant_chunks(
        db=db,
        query=data.query,
        document_ids=data.document_ids,
        user_id=current_user.id,
        top_k=data.top_k or 4
    )
    return [
        RAGChunkMatch(
            document_id=r["document_id"],
            filename=r["filename"],
            chunk_id=r["chunk_id"],
            content=r["content"],
            score=r["score"]
        )
        for r in results
    ]
