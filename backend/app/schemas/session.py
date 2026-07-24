from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SessionStartRequest(BaseModel):
    event_id: int
    duration_minutes: Optional[int] = None


class SessionResponse(BaseModel):
    id: int
    event_id: int
    session_uuid: str
    start_time: datetime
    expiry_time: datetime
    is_active: bool
    status: str
    current_token: str
    remaining_seconds: int
    qr_url: str

    class Config:
        from_attributes = True


class TokenCheckRequest(BaseModel):
    session_uuid: str
    token: str


class TokenCheckResponse(BaseModel):
    valid: bool
    message: str
