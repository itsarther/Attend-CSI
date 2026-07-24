from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


class EventBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    type: str = "Workshop" # Workshop, Seminar, Guest Lecture, Hackathon, Competition, Technical Event, Cultural Event
    organized_by: str = "CSI-CATT"
    academic_year: str = "2025-2026"
    department: str = "Computer Engineering"
    allowed_semesters: str = "1,2,3,4,5,6,7,8"
    venue: str = "Auditorium"
    date: date
    start_time: str = "10:00 AM"
    end_time: str = "04:00 PM"
    attendance_duration: int = Field(default=15, ge=1, le=180)
    max_capacity: Optional[int] = None
    description: Optional[str] = None
    poster_url: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    organized_by: Optional[str] = None
    academic_year: Optional[str] = None
    department: Optional[str] = None
    allowed_semesters: Optional[str] = None
    venue: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    attendance_duration: Optional[int] = None
    max_capacity: Optional[int] = None
    description: Optional[str] = None
    poster_url: Optional[str] = None
    status: Optional[str] = None


class EventResponse(EventBase):
    id: int
    status: str
    created_at: datetime
    attendance_count: Optional[int] = 0

    class Config:
        from_attributes = True
