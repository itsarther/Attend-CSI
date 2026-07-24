from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def log_action(
    db: Session,
    action: str,
    performed_by: str = "System",
    ip_address: Optional[str] = None,
    details: Optional[str] = None
):
    try:
        audit_entry = AuditLog(
            action=action,
            performed_by=performed_by,
            ip_address=ip_address,
            details=details
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to log audit event: {e}")
