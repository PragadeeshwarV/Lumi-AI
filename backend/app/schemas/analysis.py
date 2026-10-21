from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ColumnProfile(BaseModel):
    name: str
    dtype: str
    null_count: int
    null_percentage: float
    unique_count: int
    sample_values: List[Any]
    stats: Optional[Dict[str, Any]] = None

class DatasetProfileResponse(BaseModel):
    filename: str
    total_rows: int
    total_columns: int
    duplicate_rows: int
    columns: List[ColumnProfile]
    head_rows: List[Dict[str, Any]]

class AnalysisOperationRequest(BaseModel):
    operation: str # e.g. "correlation", "distribution", "group_by", "filter"
    column: Optional[str] = None
    group_column: Optional[str] = None
    agg_column: Optional[str] = None
    agg_func: Optional[str] = "mean" # mean, sum, count, min, max
