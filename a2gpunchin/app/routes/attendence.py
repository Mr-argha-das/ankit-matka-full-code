from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile

from app.services.attendence_service import AttendanceService

router = APIRouter(prefix="/api/v1/attendance", tags=["Face Attendance"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 10 * 1024 * 1024

attendance_service: AttendanceService | None = None


def set_attendance_service(service: AttendanceService) -> None:
    global attendance_service
    attendance_service = service


def get_attendance_service() -> AttendanceService:
    if attendance_service is None:
        raise RuntimeError("Attendance service initialize nahi hua.")
    return attendance_service


async def read_image(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Sirf JPG, PNG, WEBP image allowed hai.")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Image 10MB se badi hai.")
    return data


@router.post("/employees")
async def register_employee_image(
    employee_id: Annotated[str, Form(...)],
    name: Annotated[str, Form(...)],
    image: Annotated[UploadFile, File(...)],
    department: Annotated[str | None, Form()] = None,
):
    image_bytes = await read_image(image)
    return get_attendance_service().register_employee(
        employee_id=employee_id,
        name=name,
        department=department,
        image_bytes=image_bytes,
        image_content_type=image.content_type or "image/jpeg",
    )


@router.post("/punch")
async def punch_by_face(image: Annotated[UploadFile, File(...)]):
    image_bytes = await read_image(image)
    return get_attendance_service().recognize_and_punch(image_bytes)


@router.get("/employees/{employee_id}/image")
async def employee_image(employee_id: str):
    image_bytes, content_type = get_attendance_service().get_employee_image(employee_id)
    return Response(content=image_bytes, media_type=content_type)


@router.get("/employees/{employee_id}/records")
async def employee_attendance_records(employee_id: str, limit: int = 20):
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit 1 se 100 ke beech hona chahiye.")
    return get_attendance_service().get_employee_records(employee_id, limit)

