from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.events import router as events_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.audit import router as audit_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(events_router)
api_router.include_router(sessions_router)
api_router.include_router(attendance_router)
api_router.include_router(dashboard_router)
api_router.include_router(audit_router)
