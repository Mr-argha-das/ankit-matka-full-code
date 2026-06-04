from datetime import date

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import require_permissions
from app.services.reports import ReportService

router = APIRouter()
service = ReportService()


@router.get("/attendance")
def attendance_report(
    fmt: str = Query("csv", pattern="^(csv|xlsx|pdf)$"),
    start_date: date | None = None,
    end_date: date | None = None,
    _=Depends(require_permissions("reports:read")),
):
    return service.export_attendance(fmt, start_date, end_date)
