from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
import enum
from app.database.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    COMMITTEE_MEMBER = "COMMITTEE_MEMBER"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    role = Column(String(20), default="ADMIN", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
