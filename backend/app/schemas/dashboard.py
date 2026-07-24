from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class MetricItem(BaseModel):
    label: str
    value: Any
    change: Optional[str] = None


class ChartDataItem(BaseModel):
    name: str
    value: int


class DashboardSummary(BaseModel):
    total_events: int
    active_events: int
    total_attendance_today: int
    total_attendance_all_time: int
    attendance_rate: float
    live_session: Optional[Dict[str, Any]] = None


class AnalyticsResponse(BaseModel):
    summary: DashboardSummary
    by_department: List[ChartDataItem]
    by_year: List[ChartDataItem]
    by_semester: List[ChartDataItem]
    by_verification_method: List[ChartDataItem]
    attendance_trend: List[Dict[str, Any]]
