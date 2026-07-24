from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    session_uuid = Column(String(64), unique=True, index=True, nullable=False)
    secret_key = Column(String(100), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    expiry_time = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False) # ACTIVE, PAUSED, CLOSED, EXPIRED

    event = relationship("Event", back_populates="sessions")
