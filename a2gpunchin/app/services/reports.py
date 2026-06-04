from datetime import date

from fastapi import Response

from app.models.attendance import Attendance
from app.utils.reports import rows_to_csv, rows_to_excel, rows_to_pdf


class ReportService:
    def attendance_rows(self, start_date: date | None = None, end_date: date | None = None):
        query = Attendance.objects.visible()
        if start_date:
            query = query.filter(attendance_date__gte=start_date)
        if end_date:
            query = query.filter(attendance_date__lte=end_date)
        headers = ["Employee", "Branch", "Date", "Status", "Distance", "Check In", "Check Out"]
        rows = []
        for item in query.order_by("-attendance_date"):
            rows.append(
                [
                    getattr(item.employee_id, "employee_code", ""),
                    getattr(item.branch_id, "branch_code", ""),
                    item.attendance_date.isoformat(),
                    item.attendance_status,
                    item.distance_from_office,
                    item.check_in_time.isoformat() if item.check_in_time else "",
                    item.check_out_time.isoformat() if item.check_out_time else "",
                ]
            )
        return headers, rows

    def export_attendance(self, fmt: str, start_date: date | None = None, end_date: date | None = None) -> Response:
        headers, rows = self.attendance_rows(start_date, end_date)
        if fmt == "xlsx":
            return Response(rows_to_excel(headers, rows), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        if fmt == "pdf":
            return Response(rows_to_pdf("Attendance Report", headers, rows), media_type="application/pdf")
        return Response(rows_to_csv(headers, rows), media_type="text/csv")
