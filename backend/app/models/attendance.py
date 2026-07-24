from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    student_name = Column(String(100), nullable=False)
    gr_number = Column(String(30), nullable=False, index=True)
    roll_number = Column(String(30), nullable=False, index=True)
    department = Column(String(100), nullable=False)
    year = Column(String(10), nullable=False) # FE, SE, TE, BE
    semester = Column(Integer, nullable=False) # 1 to 8
    class_name = Column(String(50), nullable=False)
    division = Column(String(10), nullable=False)
    mobile = Column(String(20), nullable=True)
    submission_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    verification_status = Column(String(20), default="VERIFIED", nullable=False) # VERIFIED, MANUAL, FAILED
    submission_method = Column(String(30), default="QR_DYNAMIC", nullable=False) # QR_DYNAMIC, MANUAL_ADMIN
    ip_address = Column(String(50), nullable=True)
    device_fingerprint = Column(String(128), nullable=True)
    manual_entry = Column(Boolean, default=False, nullable=False)
    marked_by = Column(String(100), default="Student", nullable=False)

    event = relationship("Event", back_populates="attendances")

    __table_args__ = (
        UniqueConstraint("event_id", "gr_number", name="uq_event_gr_number"),
    )
