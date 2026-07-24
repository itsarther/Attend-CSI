from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse
from app.api.v1.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])


@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    search: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if search:
        p = f"%{search.strip()}%"
        query = query.filter(
            AuditLog.performed_by.ilike(p) |
            AuditLog.details.ilike(p) |
            AuditLog.action.ilike(p)
        )

    query = query.order_by(AuditLog.timestamp.desc()).limit(limit)
    return query.all()
