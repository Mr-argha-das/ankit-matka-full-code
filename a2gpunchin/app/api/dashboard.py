from datetime import date, timedelta

from fastapi import APIRouter, Depends

from app.core.dependencies import require_permissions
from app.models.attendance import Attendance
from app.models.branch import Branch
from app.models.employee import Employee
from app.models.leave import Leave
from app.models.shift import Shift
from app.models.user import User
from app.services.access_control import scoped_employees_for_user
from app.services.attendance import AttendanceService

router = APIRouter()
attendance_service = AttendanceService()


def _percent(value: int, total: int) -> int:
    if total <= 0:
        return 0
    return round((value / total) * 100)


def _status_label(value: str | None) -> str:
    if not value:
        return "-"
    return value.replace("_", " ").title()


def _employee_label(employee: Employee | None) -> str:
    if not employee:
        return "Unassigned employee"
    return f"{employee.employee_code} - {employee.first_name} {employee.last_name}".strip()


def _branch_label(branch: Branch | None) -> str:
    if not branch:
        return "No branch"
    return f"{branch.branch_name} ({branch.branch_code})"


@router.get("/summary")
def dashboard_summary(user: User = Depends(require_permissions("attendance:read"))):
    attendance_service.sync_missing_face_attendance_records()
    attendance_service.auto_punch_out_overdue()
    attendance_service.recalculate_existing_attendance()
    today = date.today()

    employees = Employee.objects.visible().filter(status="active")
    scoped_employees = scoped_employees_for_user(user)
    if scoped_employees is not None:
        employees = employees.filter(id__in=[employee.id for employee in scoped_employees])
    branches = Branch.objects.visible()
    shifts = Shift.objects.visible()
    today_attendance = Attendance.objects.visible().filter(attendance_date=today)
    if scoped_employees is not None:
        today_attendance = today_attendance.filter(employee_id__in=scoped_employees)

    total_employees = employees.count()
    total_branches = branches.count()
    enrolled_faces = employees.filter(face_enrolled=True).count()
    present_today = today_attendance.filter(attendance_status="approved").count()
    rejected_today = today_attendance.filter(attendance_status="rejected").count()
    pending_today = today_attendance.filter(attendance_status="pending").count()
    late_today = today_attendance.filter(check_in_status__in=["late", "half_day", "after_half_day"]).count()
    missing_checkout = today_attendance.filter(check_in_time__ne=None, check_out_time=None).count()
    absent_today = max(total_employees - present_today, 0)
    leave_query = Leave.objects.visible().filter(status__in=["pending_manager", "pending_hr"])
    if scoped_employees is not None:
        leave_query = leave_query.filter(employee_id__in=scoped_employees)
    pending_leave = leave_query.count()

    active_branch_ids = {
        str(item.branch_id.id)
        for item in today_attendance.only("branch_id")
        if item.branch_id
    }

    trend = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        records = Attendance.objects.visible().filter(attendance_date=day)
        if scoped_employees is not None:
            records = records.filter(employee_id__in=scoped_employees)
        trend.append(
            {
                "label": day.strftime("%a"),
                "date": day.isoformat(),
                "present": records.filter(attendance_status="approved").count(),
                "late": records.filter(check_in_status__in=["late", "half_day", "after_half_day"]).count(),
                "rejected": records.filter(attendance_status="rejected").count(),
            }
        )

    branch_rows = []
    for branch in branches.order_by("branch_name")[:8]:
        records = today_attendance.filter(branch_id=branch)
        approved = records.filter(attendance_status="approved").count()
        branch_total = employees.filter(branch_id=branch).count()
        branch_rows.append(
            {
                "name": branch.branch_name,
                "code": branch.branch_code,
                "present": approved,
                "employees": branch_total,
                "coverage": _percent(approved, branch_total),
                "status": "Active" if str(branch.id) in active_branch_ids else "No punches",
            }
        )

    exceptions = []
    exception_query = (
        Attendance.objects.visible()
        .filter(
            attendance_date=today,
            __raw__={
                "$or": [
                    {"attendance_status": {"$in": ["rejected", "pending"]}},
                    {"check_in_status": {"$in": ["late", "half_day", "after_half_day"]}},
                    {"check_out_status": "early_logout"},
                    {"check_out_status": "auto_punch_out"},
                    {"check_in_time": {"$ne": None}, "check_out_time": None},
                ]
            },
        )
        .order_by("-created_at")
    )
    if scoped_employees is not None:
        exception_query = exception_query.filter(employee_id__in=scoped_employees)
    exception_query = exception_query[:6]
    for item in exception_query:
        exceptions.append(
            {
                "employee": _employee_label(item.employee_id),
                "branch": _branch_label(item.branch_id),
                "status": _status_label(item.attendance_status),
                "issue": _status_label(item.rejection_reason or item.check_out_status or item.check_in_status),
            }
        )

    setup_gaps = []
    for employee in employees.filter(face_enrolled=False).order_by("employee_code")[:4]:
        setup_gaps.append({"label": _employee_label(employee), "meta": "Face enrollment pending", "href": "/employees"})
    for employee in employees.filter(shift_id=None).order_by("employee_code")[:3]:
        setup_gaps.append({"label": _employee_label(employee), "meta": "Shift assignment missing", "href": "/employees"})
    for branch in branches.filter(kiosk_pin__in=[None, ""]).order_by("branch_name")[:3]:
        setup_gaps.append({"label": _branch_label(branch), "meta": "Kiosk PIN missing", "href": "/branches"})

    return {
        "date": today.isoformat(),
        "metrics": {
            "present_today": present_today,
            "absent_today": absent_today,
            "late_today": late_today,
            "missing_checkout": missing_checkout,
            "rejected_today": rejected_today,
            "pending_today": pending_today,
            "total_employees": total_employees,
            "total_branches": total_branches,
            "active_kiosks": len(active_branch_ids),
            "configured_shifts": shifts.count(),
            "pending_leave": pending_leave,
            "face_coverage": _percent(enrolled_faces, total_employees),
        },
        "trend": trend,
        "branch_health": branch_rows,
        "exceptions": exceptions,
        "setup_gaps": setup_gaps[:6],
        "enrollment": {
            "enrolled": enrolled_faces,
            "missing": max(total_employees - enrolled_faces, 0),
            "coverage": _percent(enrolled_faces, total_employees),
        },
    }
