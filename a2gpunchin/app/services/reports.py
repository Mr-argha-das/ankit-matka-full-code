from datetime import date, datetime, time, timedelta
from typing import Any

from fastapi import Response

from app.models.attendance import Attendance
from app.services.attendance import AttendanceService
from app.utils.reports import rows_to_csv, rows_to_excel, rows_to_pdf


class ReportService:
    attendance_service = AttendanceService()

    def _local_time(self, value: datetime | None) -> time | None:
        local_value = self.attendance_service.to_local(value)
        return local_value.time().replace(microsecond=0) if local_value else None

    def _work_time(self, item: Attendance) -> time | None:
        minutes = item.total_work_minutes
        if not minutes and item.check_in_time and item.check_out_time:
            start = self.attendance_service._aware(item.check_in_time)
            end = self.attendance_service._aware(item.check_out_time)
            minutes = max(0, int((end - start).total_seconds() // 60))
        if not minutes:
            return None
        hours, mins = divmod(minutes, 60)
        return (datetime.min + timedelta(hours=hours, minutes=mins)).time()

    def _present_status(self, item: Attendance) -> str:
        if item.attendance_status == "approved":
            return "P"
        if item.attendance_status == "rejected":
            return "A"
        return "Pending"

    def _sub_status(self, item: Attendance) -> str:
        if item.attendance_status == "rejected":
            return "Rejected"
        if item.attendance_status == "pending":
            return "Pending"
        if item.check_out_status == "auto_punch_out":
            return "Auto Punch Out"
        if item.check_in_status == "half_day":
            return "Half Day"
        if item.check_in_status == "late":
            return "Late"
        if item.check_out_status == "early_logout":
            return "Early Logout"
        if item.check_in_status == "on_time":
            return "On Time"
        return ""

    def attendance_rows(self, start_date: date | None = None, end_date: date | None = None):
        query = Attendance.objects.visible()
        if start_date:
            query = query.filter(attendance_date__gte=start_date)
        if end_date:
            query = query.filter(attendance_date__lte=end_date)
        headers = ["Employee ID", "Employee Name", "Date", "Punch In", "Punch Out", "Work Time (H:M)", "Status", "Sub Status"]
        rows: list[list[Any]] = []
        for item in query.order_by("-attendance_date"):
            employee = item.employee_id
            employee_name = ""
            if employee:
                employee_name = f"{employee.first_name} {employee.last_name}".strip()
            rows.append(
                [
                    getattr(employee, "employee_code", ""),
                    employee_name,
                    datetime.combine(item.attendance_date, time.min) if item.attendance_date else "",
                    self._local_time(item.check_in_time) or "",
                    self._local_time(item.check_out_time) or "",
                    self._work_time(item) or "",
                    self._present_status(item),
                    self._sub_status(item),
                ]
            )
        return headers, rows

    def export_attendance(self, fmt: str, start_date: date | None = None, end_date: date | None = None) -> Response:
        self.attendance_service.auto_punch_out_overdue()
        headers, rows = self.attendance_rows(start_date, end_date)
        if fmt == "xlsx":
            return Response(rows_to_excel(headers, rows), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        if fmt == "pdf":
            return Response(rows_to_pdf("Attendance Report", headers, rows), media_type="application/pdf")
        return Response(rows_to_csv(headers, rows), media_type="text/csv")
