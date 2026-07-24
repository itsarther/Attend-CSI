from datetime import datetime, date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date as SQLDate
from app.database.session import get_db
from app.models.event import Event
from app.models.session import AttendanceSession
from app.models.attendance import Attendance
from app.schemas.dashboard import DashboardSummary, AnalyticsResponse, ChartDataItem
from app.api.v1.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_events = db.query(Event).count()
    active_events = db.query(Event).filter(Event.status.in_(["LIVE", "ATTENDANCE_ACTIVE"])).count()
    
    today_date = datetime.utcnow().date()
    all_att_times = db.query(Attendance.submission_time).all()
    total_today = sum(1 for (st,) in all_att_times if st and st.date() == today_date)

    total_all_time = db.query(Attendance).count()
    
    # Active live session snippet if any
    active_sess = db.query(AttendanceSession).filter(AttendanceSession.is_active == True).first()
    live_info = None
    if active_sess:
        event_obj = db.query(Event).filter(Event.id == active_sess.event_id).first()
        sess_count = db.query(Attendance).filter(Attendance.event_id == active_sess.event_id).count()
        live_info = {
            "session_id": active_sess.id,
            "session_uuid": active_sess.session_uuid,
            "event_id": active_sess.event_id,
            "event_name": event_obj.name if event_obj else "Event",
            "attendance_count": sess_count,
            "status": active_sess.status,
            "expiry_time": active_sess.expiry_time.isoformat()
        }

    attendance_rate = round((total_all_time / (total_events * 50)) * 100, 1) if total_events > 0 else 0.0

    return DashboardSummary(
        total_events=total_events,
        active_events=active_events,
        total_attendance_today=total_today,
        total_attendance_all_time=total_all_time,
        attendance_rate=min(attendance_rate, 100.0),
        live_session=live_info
    )


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    summary = get_dashboard_summary(db)

    # Breakdown by Department
    dept_raw = db.query(
        Attendance.department,
        func.count(Attendance.id)
    ).group_by(Attendance.department).all()
    by_department = [ChartDataItem(name=d or "Unknown", value=c) for d, c in dept_raw]

    # Breakdown by Year
    year_raw = db.query(
        Attendance.year,
        func.count(Attendance.id)
    ).group_by(Attendance.year).all()
    by_year = [ChartDataItem(name=y or "Unknown", value=c) for y, c in year_raw]

    # Breakdown by Semester
    sem_raw = db.query(
        Attendance.semester,
        func.count(Attendance.id)
    ).group_by(Attendance.semester).all()
    by_semester = [ChartDataItem(name=f"Sem {s}", value=c) for s, c in sem_raw]

    # Breakdown by Verification Method
    method_raw = db.query(
        Attendance.submission_method,
        func.count(Attendance.id)
    ).group_by(Attendance.submission_method).all()
    by_verification_method = [
        ChartDataItem(name="Dynamic QR Scan" if m == "QR_DYNAMIC" else "Manual Entry", value=c)
        for m, c in method_raw
    ]

    # Attendance Trend (Grouped by date)
    all_records = db.query(Attendance.submission_time).all()
    trend_dict = {}
    for (st,) in all_records:
        if st:
            d_str = st.strftime("%Y-%m-%d")
            trend_dict[d_str] = trend_dict.get(d_str, 0) + 1

    attendance_trend = [
        {"date": d, "count": c}
        for d, c in sorted(trend_dict.items())[-14:]
    ]

    return AnalyticsResponse(
        summary=summary,
        by_department=by_department,
        by_year=by_year,
        by_semester=by_semester,
        by_verification_method=by_verification_method,
        attendance_trend=attendance_trend
    )
