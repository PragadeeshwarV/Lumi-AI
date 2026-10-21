from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.services.auth_service import auth_service, DEV_USER_EMAIL
from app.core.config import settings

def get_current_user(
    authorization: Optional[str] = Header(None),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    db: Session = Depends(get_db)
) -> User:
    """
    Retrieves the current user.
    1. If a valid JWT Bearer token is provided, returns that authenticated user.
    2. If an X-Session-ID header is provided, returns the private user account for that browser guest session.
    3. Otherwise, gracefully falls back to the default user session.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
        if token:
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                user = db.query(User).filter(User.id == payload["sub"], User.is_active == True).first()
                if user:
                    return user

    if x_session_id and len(x_session_id.strip()) >= 8:
        return auth_service.get_or_create_session_user(db, x_session_id.strip())

    # Graceful fallback to default personal assistant user session
    return auth_service.get_or_create_dev_user(db)


def get_required_authenticated_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Strict authentication dependency for administrative, user-management,
    and sensitive account endpoints. Requires a valid JWT Bearer token.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
        if token:
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                user = db.query(User).filter(User.id == payload["sub"], User.is_active == True).first()
                if user:
                    return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required for this operation",
        headers={"WWW-Authenticate": "Bearer"},
    )
