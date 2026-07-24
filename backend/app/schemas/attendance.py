from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class StudentAttendanceSubmit(BaseModel):
    session_uuid: str
    student_name: str = Field(..., min_length=2, max_length=100)
    gr_number: str = Field(..., min_length=2, max_length=30)
    roll_number: str = Field(..., min_length=1, max_length=30)
    department: str
    year: str # FE, SE, TE, BE
    semester: int = Field(..., ge=1, le=8)
    class_name: str
    division: str
    mobile: Optional[str] = None
    presence_token: str = Field(..., min_length=4, max_length=10)
    device_fingerprint: Optional[str] = None


class ManualAttendanceCreate(BaseModel):
    event_id: int
    student_name: str = Field(..., min_length=2, max_length=100)
    gr_number: str = Field(..., min_length=2, max_length=30)
    roll_number: str = Field(..., min_length=1, max_length=30)
    department: str
    year: str
    semester: int = Field(..., ge=1, le=8)
    class_name: str
    division: str
    mobile: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: int
    event_id: int
    event_name: Optional[str] = None
    student_name: str
    gr_number: str
    roll_number: str
    department: str
    year: str
    semester: int
    class_name: str
    division: str
    mobile: Optional[str] = None
    submission_time: datetime
    verification_status: str
    submission_method: str
    ip_address: Optional[str] = None
    device_fingerprint: Optional[str] = None
    manual_entry: bool
    marked_by: str

    class Config:
        from_attributes = True
