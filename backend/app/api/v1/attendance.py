from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.event import Event
from app.models.session import AttendanceSession
from app.models.attendance import Attendance
from app.models.user import User
from app.schemas.attendance import (
    StudentAttendanceSubmit,
    ManualAttendanceCreate,
    AttendanceResponse
)
from app.api.v1.auth import get_current_user
from app.core.security import verify_presence_token
from app.services.audit_service import log_action
from app.services.export_service import export_to_csv, export_to_excel, export_to_pdf

router = APIRouter(prefix="/attendance", tags=["Attendance Records"])


@router.post("/public/submit", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def submit_student_attendance(
    body: StudentAttendanceSubmit,
    request: Request,
    db: Session = Depends(get_db)
):
    # 1. Verify session validity
    sess = db.query(AttendanceSession).filter(
        AttendanceSession.session_uuid == body.session_uuid
    ).first()

    if not sess or not sess.is_active or sess.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance session is not active or has been closed."
        )

    if datetime.utcnow() > sess.expiry_time:
        sess.is_active = False
        sess.status = "EXPIRED"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This attendance session has expired."
        )

    # 2. PHYSICAL PRESENCE VERIFICATION (Strict rotating token check)
    is_token_valid = verify_presence_token(body.session_uuid, body.presence_token)
    if not is_token_valid:
        log_action(
            db,
            action="ATTENDANCE_FAILED_LOCATION",
            performed_by=body.student_name,
            ip_address=request.client.host,
            details=f"Invalid presence token '{body.presence_token}' submitted for GR {body.gr_number}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not within the allowed attendance area or token has expired. Please stay near the event venue and try again."
        )

    # 3. Duplicate Attendance Check per Event + GR Number or Roll Number
    existing = db.query(Attendance).filter(
        Attendance.event_id == sess.event_id,
        (Attendance.gr_number == body.gr_number.strip().upper()) |
        (Attendance.roll_number == body.roll_number.strip().upper())
    ).first()

    if existing:
        log_action(
            db,
            action="ATTENDANCE_DUPLICATE_ATTEMPT",
            performed_by=body.student_name,
            ip_address=request.client.host,
            details=f"Duplicate attendance attempt for GR: {body.gr_number}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Attendance already recorded for GR Number {body.gr_number} or Roll Number {body.roll_number}."
        )

    client_ip = request.client.host or "Unknown"

    # 4. Save attendance
    new_record = Attendance(
        event_id=sess.event_id,
        student_name=body.student_name.strip(),
        gr_number=body.gr_number.strip().upper(),
        roll_number=body.roll_number.strip().upper(),
        department=body.department,
        year=body.year,
        semester=body.semester,
        class_name=body.class_name,
        division=body.division.upper(),
        mobile=body.mobile,
        submission_time=datetime.utcnow(),
        verification_status="VERIFIED",
        submission_method="QR_DYNAMIC",
        ip_address=client_ip,
        device_fingerprint=body.device_fingerprint,
        manual_entry=False,
        marked_by="Self (QR Scan)"
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    log_action(
        db,
        action="ATTENDANCE_SUBMITTED",
        performed_by=new_record.student_name,
        ip_address=client_ip,
        details=f"Successfully submitted attendance for event ID {sess.event_id} (GR: {new_record.gr_number})"
    )

    event_obj = db.query(Event).filter(Event.id == sess.event_id).first()
    res = AttendanceResponse.model_validate(new_record)
    res.event_name = event_obj.name if event_obj else ""
    return res


@router.post("/manual", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def manual_attendance_entry(
    body: ManualAttendanceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event_obj = db.query(Event).filter(Event.id == body.event_id).first()
    if not event_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    existing = db.query(Attendance).filter(
        Attendance.event_id == body.event_id,
        (Attendance.gr_number == body.gr_number.strip().upper()) |
        (Attendance.roll_number == body.roll_number.strip().upper())
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Attendance already recorded for GR Number {body.gr_number} or Roll Number {body.roll_number}."
        )

    new_record = Attendance(
        event_id=body.event_id,
        student_name=body.student_name.strip(),
        gr_number=body.gr_number.strip().upper(),
        roll_number=body.roll_number.strip().upper(),
        department=body.department,
        year=body.year,
        semester=body.semester,
        class_name=body.class_name,
        division=body.division.upper(),
        mobile=body.mobile,
        submission_time=datetime.utcnow(),
        verification_status="MANUAL",
        submission_method="MANUAL_ADMIN",
        ip_address=request.client.host,
        device_fingerprint="Admin Override",
        manual_entry=True,
        marked_by=f"Admin ({current_user.username})"
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    log_action(
        db,
        action="ATTENDANCE_MANUAL_ADDED",
        performed_by=current_user.username,
        ip_address=request.client.host,
        details=f"Manually added attendance for {new_record.student_name} (GR: {new_record.gr_number}) in event '{event_obj.name}'"
    )

    res = AttendanceResponse.model_validate(new_record)
    res.event_name = event_obj.name
    return res


@router.get("/event/{event_id}", response_model=List[AttendanceResponse])
def get_event_attendance(
    event_id: int,
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    division: Optional[str] = Query(None),
    method: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(Attendance).filter(Attendance.event_id == event_id)

    if search:
        p = f"%{search.strip()}%"
        query = query.filter(
            Attendance.student_name.ilike(p) |
            Attendance.gr_number.ilike(p) |
            Attendance.roll_number.ilike(p)
        )
    if department:
        query = query.filter(Attendance.department == department)
    if year:
        query = query.filter(Attendance.year == year)
    if semester:
        query = query.filter(Attendance.semester == semester)
    if division:
        query = query.filter(Attendance.division == division.upper())
    if method:
        query = query.filter(Attendance.submission_method == method)
    if status_filter:
        query = query.filter(Attendance.verification_status == status_filter)

    query = query.order_by(Attendance.submission_time.desc())
    records = query.all()

    event_obj = db.query(Event).filter(Event.id == event_id).first()
    event_name = event_obj.name if event_obj else ""

    result = []
    for r in records:
        item = AttendanceResponse.model_validate(r)
        item.event_name = event_name
        result.append(item)

    return result


@router.get("/live/{event_id}")
def get_live_attendance(event_id: int, db: Session = Depends(get_db)):
    """
    Returns real-time summary counter and latest 10 attendance records for venue display screens.
    """
    total_count = db.query(Attendance).filter(Attendance.event_id == event_id).count()
    recent = db.query(Attendance).filter(Attendance.event_id == event_id).order_by(Attendance.submission_time.desc()).limit(10).all()
    
    event_obj = db.query(Event).filter(Event.id == event_id).first()
    active_sess = db.query(AttendanceSession).filter(
        AttendanceSession.event_id == event_id,
        AttendanceSession.is_active == True
    ).first()

    return {
        "event_id": event_id,
        "event_name": event_obj.name if event_obj else "",
        "status": event_obj.status if event_obj else "CLOSED",
        "is_session_active": bool(active_sess and active_sess.is_active),
        "total_attendance": total_count,
        "recent_entries": [
            {
                "id": r.id,
                "student_name": r.student_name,
                "gr_number": r.gr_number,
                "department": r.department,
                "year": r.year,
                "time": r.submission_time.strftime("%H:%M:%S")
            }
            for r in recent
        ]
    }


@router.get("/export/{event_id}")
def export_attendance_file(
    event_id: int,
    format: str = Query("excel", description="excel, csv, pdf"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event_obj = db.query(Event).filter(Event.id == event_id).first()
    if not event_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    records = db.query(Attendance).filter(
        Attendance.event_id == event_id
    ).order_by(Attendance.gr_number.asc()).all()

    filename_safe = "".join([c if c.isalnum() else "_" for c in event_obj.name])

    log_action(
        db,
        action="ATTENDANCE_EXPORT",
        performed_by=current_user.username,
        details=f"Exported {len(records)} attendance records for '{event_obj.name}' in {format.upper()} format"
    )

    if format.lower() == "csv":
        buf = export_to_csv(event_obj, records)
        return StreamingResponse(
            buf,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=attendance_{filename_safe}.csv"}
        )
    elif format.lower() == "pdf":
        buf = export_to_pdf(event_obj, records)
        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=attendance_{filename_safe}.pdf"}
        )
    else:  # Excel default
        buf = export_to_excel(event_obj, records)
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=attendance_{filename_safe}.xlsx"}
        )


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(
    attendance_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")

    name = record.student_name
    gr = record.gr_number
    db.delete(record)
    db.commit()

    log_action(
        db,
        action="ATTENDANCE_DELETED",
        performed_by=current_user.username,
        ip_address=request.client.host,
        details=f"Deleted attendance record for {name} (GR: {gr})"
    )
    return None
