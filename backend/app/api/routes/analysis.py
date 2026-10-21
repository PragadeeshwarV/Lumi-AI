from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.analysis import DatasetProfileResponse, AnalysisOperationRequest
from app.services.analysis_service import analysis_service
from app.core.exceptions import ResourceNotFoundException

router = APIRouter(prefix="/analysis", tags=["Data Analysis Workspace"])

@router.get("/{document_id}/profile", response_model=DatasetProfileResponse)
def get_dataset_profile(
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

    if doc.file_type != "csv":
        raise HTTPException(status_code=400, detail="Data analysis is currently supported for CSV files.")

    file_path = Path(doc.storage_path)
    return analysis_service.profile_csv(file_path)

@router.post("/{document_id}/aggregate")
def aggregate_dataset(
    document_id: str,
    req: AnalysisOperationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise ResourceNotFoundException("Document", document_id)

    file_path = Path(doc.storage_path)
    if not req.group_column or not req.agg_column:
        raise HTTPException(status_code=400, detail="group_column and agg_column are required.")

    return analysis_service.execute_aggregation(
        file_path=file_path,
        group_col=req.group_column,
        agg_col=req.agg_column,
        agg_func=req.agg_func or "mean"
    )
