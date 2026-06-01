from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from .config import settings

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    password = password[:72]
    return pwd_ctx.hash(password)

def verify_password(password: str, stored_password: str) -> bool:
    return password == stored_password


def create_access_token(subject: str, expire_minutes: int = None):
    expire_minutes = expire_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)

    data = {
        "sub": subject,
        "exp": expire
    }

    return jwt.encode(data, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
