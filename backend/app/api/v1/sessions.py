import uuid
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.event import Event
from app.models.session import AttendanceSession
from app.models.user import User
from app.schemas.session import SessionStartRequest, SessionResponse, TokenCheckRequest, TokenCheckResponse
from app.api.v1.auth import get_current_user
from app.core.config import settings
from app.core.security import generate_presence_token, verify_presence_token
from app.services.audit_service import log_action

router = APIRouter(prefix="/sessions", tags=["Attendance Sessions"])


def _construct_qr_url(request: Request, session_uuid: str) -> str:
    if settings.FRONTEND_URL and settings.FRONTEND_URL.strip():
        base_url = settings.FRONTEND_URL.rstrip("/")
        return f"{base_url}/attendance/session/{session_uuid}"

    origin = request.headers.get("origin") or request.headers.get("referer")
    if origin:
        base_url = origin.rstrip("/").split("/attendance")[0].split("/api")[0]
        return f"{base_url}/attendance/session/{session_uuid}"

    scheme = request.headers.get("x-forwarded-proto", "http")
    host = request.headers.get("host", "localhost:5173")
    return f"{scheme}://{host}/attendance/session/{session_uuid}"


@router.post("/start", response_model=SessionResponse)
def start_attendance(
    body: SessionStartRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event_obj = db.query(Event).filter(Event.id == body.event_id).first()
    if not event_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Close any existing active sessions for this event
    existing_sessions = db.query(AttendanceSession).filter(
        AttendanceSession.event_id == body.event_id,
        AttendanceSession.is_active == True
    ).all()
    for s in existing_sessions:
        s.is_active = False
        s.status = "CLOSED"

    duration = body.duration_minutes or event_obj.attendance_duration or 15
    session_uuid = str(uuid.uuid4())
    secret_key = secrets.token_hex(16)
    start_time = datetime.utcnow()
    expiry_time = start_time + timedelta(minutes=duration)

    new_session = AttendanceSession(
        event_id=body.event_id,
        session_uuid=session_uuid,
        secret_key=secret_key,
        start_time=start_time,
        expiry_time=expiry_time,
        is_active=True,
        status="ACTIVE"
    )
    db.add(new_session)

    # Update Event status to ATTENDANCE_ACTIVE
    event_obj.status = "ATTENDANCE_ACTIVE"

    db.commit()
    db.refresh(new_session)

    token, remaining = generate_presence_token(session_uuid)
    qr_url = _construct_qr_url(request, session_uuid)

    log_action(
        db,
        action="ATTENDANCE_STARTED",
        performed_by=current_user.username,
        ip_address=request.client.host,
        details=f"Started attendance session for event '{event_obj.name}' (UUID: {session_uuid})"
    )

    return SessionResponse(
        id=new_session.id,
        event_id=new_session.event_id,
        session_uuid=new_session.session_uuid,
        start_time=new_session.start_time,
        expiry_time=new_session.expiry_time,
        is_active=new_session.is_active,
        status=new_session.status,
        current_token=token,
        remaining_seconds=remaining,
        qr_url=qr_url
    )


@router.post("/pause/{session_id}")
def pause_attendance(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sess = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    sess.is_active = False
    sess.status = "PAUSED"
    db.commit()

    log_action(db, action="ATTENDANCE_PAUSED", performed_by=current_user.username, ip_address=request.client.host, details=f"Paused session {session_id}")
    return {"message": "Attendance session paused", "status": "PAUSED"}


@router.post("/resume/{session_id}")
def resume_attendance(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sess = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if datetime.utcnow() > sess.expiry_time:
        sess.expiry_time = datetime.utcnow() + timedelta(minutes=10) # Grant extra 10 mins on resume if expired

    sess.is_active = True
    sess.status = "ACTIVE"
    db.commit()

    log_action(db, action="ATTENDANCE_RESUMED", performed_by=current_user.username, ip_address=request.client.host, details=f"Resumed session {session_id}")
    return {"message": "Attendance session resumed", "status": "ACTIVE"}


@router.post("/stop/{session_id}")
def stop_attendance(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sess = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    sess.is_active = False
    sess.status = "CLOSED"
    
    # Update event status
    event_obj = db.query(Event).filter(Event.id == sess.event_id).first()
    if event_obj:
        event_obj.status = "CLOSED"

    db.commit()

    log_action(db, action="ATTENDANCE_STOPPED", performed_by=current_user.username, ip_address=request.client.host, details=f"Closed attendance session {session_id}")
    return {"message": "Attendance session closed", "status": "CLOSED"}


@router.post("/stop-by-event/{event_id}")
def stop_attendance_by_event(
    event_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(AttendanceSession).filter(
        AttendanceSession.event_id == event_id
    ).all()

    for s in sessions:
        s.is_active = False
        s.status = "CLOSED"

    event_obj = db.query(Event).filter(Event.id == event_id).first()
    if event_obj:
        event_obj.status = "CLOSED"

    db.commit()

    log_action(db, action="ATTENDANCE_STOPPED_BY_EVENT", performed_by=current_user.username, ip_address=request.client.host, details=f"Closed attendance for event {event_id}")
    return {"message": f"Attendance closed for event {event_id}", "status": "CLOSED"}


@router.get("/active-by-event/{event_id}")
def get_active_session_by_event(event_id: int, request: Request, db: Session = Depends(get_db)):
    sess = db.query(AttendanceSession).filter(
        AttendanceSession.event_id == event_id,
        AttendanceSession.is_active == True
    ).first()

    if not sess:
        return {"has_active_session": False, "session": None}

    token, remaining = generate_presence_token(sess.session_uuid)
    qr_url = _construct_qr_url(request, sess.session_uuid)

    return {
        "has_active_session": True,
        "session": {
            "id": sess.id,
            "event_id": sess.event_id,
            "session_uuid": sess.session_uuid,
            "start_time": sess.start_time.isoformat(),
            "expiry_time": sess.expiry_time.isoformat(),
            "is_active": sess.is_active,
            "status": sess.status,
            "current_token": token,
            "remaining_seconds": remaining,
            "qr_url": qr_url
        }
    }


@router.get("/public/session/{session_uuid}")
def get_public_session_info(session_uuid: str, db: Session = Depends(get_db)):
    """
    Public endpoint used by student scan page to get event details and rotating venue token.
    """
    sess = db.query(AttendanceSession).filter(AttendanceSession.session_uuid == session_uuid).first()
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance session not found or invalid QR code")

    now = datetime.utcnow()
    if not sess.is_active or sess.status != "ACTIVE":
        return {
            "is_active": False,
            "status": sess.status,
            "message": "Attendance session is currently paused or closed by administrator."
        }

    if now > sess.expiry_time:
        return {
            "is_active": False,
            "status": "EXPIRED",
            "message": "This attendance QR code session has expired."
        }

    event_obj = db.query(Event).filter(Event.id == sess.event_id).first()
    token, remaining = generate_presence_token(session_uuid)

    return {
        "is_active": True,
        "session_uuid": sess.session_uuid,
        "event_id": event_obj.id,
        "event_name": event_obj.name,
        "event_type": event_obj.type,
        "organized_by": event_obj.organized_by,
        "department": event_obj.department,
        "allowed_semesters": event_obj.allowed_semesters,
        "venue": event_obj.venue,
        "date": str(event_obj.date),
        "current_token": token,
        "remaining_seconds": remaining,
        "expiry_time": sess.expiry_time.isoformat()
    }


@router.post("/public/verify-token", response_model=TokenCheckResponse)
def verify_token_endpoint(body: TokenCheckRequest):
    is_valid = verify_presence_token(body.session_uuid, body.token)
    if is_valid:
        return TokenCheckResponse(valid=True, message="Presence verified successfully")
    return TokenCheckResponse(valid=False, message="Invalid or expired presence token")
