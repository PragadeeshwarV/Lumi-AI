from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.settings import UserSettings
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import UserRegister, UserLogin
from app.core.exceptions import UnauthorizedException, LumiException

DEV_USER_EMAIL = "dev@lumiai.local"

class AuthService:
    @staticmethod
    def get_or_create_dev_user(db: Session) -> User:
        user = db.query(User).filter(User.email == DEV_USER_EMAIL).first()
        if not user:
            user = User(
                email=DEV_USER_EMAIL,
                hashed_password=hash_password("lumi-dev-password"),
                full_name="Lumi Developer"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            settings = UserSettings(user_id=user.id)
            db.add(settings)
            db.commit()
        return user

    @staticmethod
    def get_or_create_session_user(db: Session, session_id: str) -> User:
        """
        Retrieves or initializes a private, isolated guest account for a browser session.
        Guarantees that distinct visitors never share chat histories or documents.
        """
        import re
        clean_id = re.sub(r'[^a-zA-Z0-9_-]', '', session_id)[:36]
        if not clean_id:
            clean_id = "default"

        guest_email = f"guest_{clean_id}@lumi.guest"
        user = db.query(User).filter(User.email == guest_email).first()
        if not user:
            user = User(
                email=guest_email,
                hashed_password=hash_password(f"guest-secret-{clean_id}"),
                full_name="Guest User"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            settings = UserSettings(user_id=user.id)
            db.add(settings)
            db.commit()
        return user

    @staticmethod
    def register(db: Session, data: UserRegister) -> Tuple[User, str]:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise LumiException(status_code=400, detail="An account with this email already exists.")

        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Initialize default user settings
        settings = UserSettings(user_id=user.id)
        db.add(settings)
        db.commit()

        token = create_access_token(user.id)
        return user, token

    @staticmethod
    def login(db: Session, data: UserLogin) -> Tuple[User, str]:
        user = db.query(User).filter(User.email == data.email).first()
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Incorrect email or password.")

        token = create_access_token(user.id)
        return user, token

auth_service = AuthService()
