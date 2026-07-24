from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Time
from sqlalchemy.orm import relationship
from app.database.base import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False, index=True)
    type = Column(String(50), nullable=False, default="Workshop") # Workshop, Seminar, Hackathon, etc.
    organized_by = Column(String(100), nullable=False, default="CSI-CATT")
    academic_year = Column(String(20), nullable=False, default="2025-2026") # FE, SE, TE, BE or 2025-2026
    department = Column(String(100), nullable=False, default="Computer Engineering")
    allowed_semesters = Column(String(100), nullable=False, default="1,2,3,4,5,6,7,8")
    venue = Column(String(100), nullable=False, default="Auditorium")
    date = Column(Date, nullable=False)
    start_time = Column(String(20), nullable=False) # e.g. "10:00 AM"
    end_time = Column(String(20), nullable=False)   # e.g. "04:00 PM"
    attendance_duration = Column(Integer, nullable=False, default=15) # minutes
    max_capacity = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    poster_url = Column(String(255), nullable=True)
    status = Column(String(30), nullable=False, default="UPCOMING") # UPCOMING, LIVE, ATTENDANCE_ACTIVE, CLOSED
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("AttendanceSession", back_populates="event", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="event", cascade="all, delete-orphan")
