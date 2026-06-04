from fastapi import Depends

from app.api.crud import crud_router
from app.core.dependencies import require_permissions
from app.models.employee import Employee
from app.repositories.base import BaseRepository
from app.schemas.employee import EmployeeFaceEnroll
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.services.catalog import EmployeeService
from app.utils.serializers import document_to_dict

service = EmployeeService()


def _employee_row(employee: Employee) -> dict:
    branch = employee.branch_id
    shift = employee.shift_id
    department = employee.department_id
    branch_label = f"{branch.branch_name} ({branch.branch_code})" if branch else "-"
    shift_label = f"{shift.shift_name} ({shift.start_time}-{shift.end_time})" if shift else "-"
    department_label = f"{department.department_name} ({department.department_code})" if department else "-"
    return {
        "id": str(employee.id),
        "employee_code": employee.employee_code,
        "prefix": employee.prefix or "-",
        "staff_role": (employee.staff_role or "-").replace("_", " ").title(),
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "father_name": employee.father_name or "-",
        "mother_name": employee.mother_name or "-",
        "email": employee.email,
        "office_email": employee.office_email or "-",
        "phone": employee.phone or "-",
        "emergency_contact_number": employee.emergency_contact_number or "-",
        "gender": (employee.gender or "-").replace("_", " ").title(),
        "date_of_birth": employee.date_of_birth.strftime("%d %b %Y") if employee.date_of_birth else "-",
        "joining_date": employee.joining_date.strftime("%d %b %Y") if employee.joining_date else "-",
        "marital_status": (employee.marital_status or "-").title(),
        "designation": employee.designation or "-",
        "department": department_label,
        "branch": branch_label,
        "shift": shift_label,
        "current_address": employee.current_address or "-",
        "permanent_address": employee.permanent_address or "-",
        "qualification": employee.qualification or "-",
        "work_experience": employee.work_experience or "-",
        "note": employee.note or "-",
        "aadhar_number": employee.aadhar_number or "-",
        "pan_number": employee.pan_number or "-",
        "face": "Enrolled" if employee.face_enrolled else "Not Enrolled",
        "status": employee.status.title() if employee.status else "-",
    }


router = crud_router(service, EmployeeCreate, EmployeeUpdate, "employees", list_serializer=_employee_row)


@router.post("/{employee_id}/face")
def enroll_face(employee_id: str, payload: EmployeeFaceEnroll, _=Depends(require_permissions("employees:update"))):
    employee = BaseRepository(Employee).get(employee_id)
    employee.face_embedding = payload.face_embedding
    employee.face_enrolled = True
    employee.save()
    return document_to_dict(employee)
