from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.event import Event
from app.models.attendance import Attendance
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.api.v1.auth import get_current_user
from app.services.audit_service import log_action

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=List[EventResponse])
def list_events(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    department: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db)
):
    query = db.query(
        Event,
        func.count(Attendance.id).label("attendance_count")
    ).outerjoin(Attendance, Attendance.event_id == Event.id).group_by(Event.id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(Event.name.ilike(search_pattern) | Event.venue.ilike(search_pattern))
    
    if status_filter:
        query = query.filter(Event.status == status_filter.upper())
    
    if department:
        query = query.filter(Event.department == department)
        
    if event_type:
        query = query.filter(Event.type == event_type)

    query = query.order_by(Event.date.desc(), Event.id.desc())
    results = query.all()

    response_list = []
    for event_obj, count in results:
        res = EventResponse.model_validate(event_obj)
        res.attendance_count = count
        response_list.append(res)

    return response_list


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_event = Event(**event_in.model_dump())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    log_action(
        db,
        action="EVENT_CREATED",
        performed_by=current_user.username,
        ip_address=request.client.host,
        details=f"Created event '{new_event.name}' (ID: {new_event.id})"
    )

    res = EventResponse.model_validate(new_event)
    res.attendance_count = 0
    return res


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event_obj = db.query(Event).filter(Event.id == event_id).first()
    if not event_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    count = db.query(Attendance).filter(Attendance.event_id == event_id).count()
    res = EventResponse.model_validate(event_obj)
    res.attendance_count = count
    return res


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_in: EventUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event_obj = db.query(Event).filter(Event.id == event_id).first()
    if not event_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    update_data = event_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(event_obj, field, val)

    db.commit()
    db.refresh(event_obj)

    log_action(
        db,
        action="EVENT_UPDATED",
        performed_by=current_user.username,
        ip_address=request.client.host,
        details=f"Updated event '{event_obj.name}' (ID: {event_id})"
    )

    count = db.query(Attendance).filter(Attendance.event_id == event_id).count()
    res = EventResponse.model_validate(event_obj)
    res.attendance_count = count
    return res


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event_obj = db.query(Event).filter(Event.id == event_id).first()
    if not event_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    name = event_obj.name

    # Explicitly clear child records
    from app.models.session import AttendanceSession
    db.query(AttendanceSession).filter(AttendanceSession.event_id == event_id).delete()
    db.query(Attendance).filter(Attendance.event_id == event_id).delete()
    
    db.delete(event_obj)
    db.commit()

    log_action(
        db,
        action="EVENT_DELETED",
        performed_by=current_user.username,
        ip_address=request.client.host,
        details=f"Deleted event '{name}' (ID: {event_id})"
    )
    return {"message": f"Deleted event '{name}'", "status": "success"}


@router.post("/{event_id}/duplicate", response_model=EventResponse)
def duplicate_event(
    event_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event_obj = db.query(Event).filter(Event.id == event_id).first()
    if not event_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    dup_event = Event(
        name=f"{event_obj.name} (Copy)",
        type=event_obj.type,
        organized_by=event_obj.organized_by,
        academic_year=event_obj.academic_year,
        department=event_obj.department,
        allowed_semesters=event_obj.allowed_semesters,
        venue=event_obj.venue,
        date=event_obj.date,
        start_time=event_obj.start_time,
        end_time=event_obj.end_time,
        attendance_duration=event_obj.attendance_duration,
        max_capacity=event_obj.max_capacity,
        description=event_obj.description,
        poster_url=event_obj.poster_url,
        status="UPCOMING"
    )
    db.add(dup_event)
    db.commit()
    db.refresh(dup_event)

    log_action(
        db,
        action="EVENT_DUPLICATED",
        performed_by=current_user.username,
        ip_address=request.client.host,
        details=f"Duplicated event '{event_obj.name}' to '{dup_event.name}'"
    )

    res = EventResponse.model_validate(dup_event)
    res.attendance_count = 0
    return res
