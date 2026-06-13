from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import HTTPException
from mongoengine import (
    BinaryField,
    DateTimeField,
    Document,
    FloatField,
    IntField,
    StringField,
)

from app.models.face_engine import FaceEngine


class EmployeeFace(Document):
    employee_id = StringField(required=True, unique=True)
    name = StringField(required=True)
    department = StringField()
    image = BinaryField(required=True)
    image_content_type = StringField(default="image/jpeg")
    faiss_id = IntField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "employee_faces",
        "indexes": ["employee_id", "faiss_id"],
    }


class AttendanceRecord(Document):
    employee_id = StringField(required=True)
    employee_name = StringField(required=True)
    department = StringField()
    punch_in = DateTimeField(required=True)
    punch_out = DateTimeField()
    duration_seconds = IntField()
    status = StringField(required=True, choices=("PUNCHED_IN", "PUNCHED_OUT"))
    punch_in_confidence = FloatField()
    punch_out_confidence = FloatField()
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "attendance_records",
        "indexes": ["employee_id", "status", "-punch_in"],
    }


class AttendanceService:
    def __init__(self, face_engine: FaceEngine) -> None:
        self.face_engine = face_engine

    def register_employee(
        self,
        employee_id: str,
        name: str,
        image_bytes: bytes,
        image_content_type: str,
        department: str | None = None,
    ) -> dict[str, Any]:
        employee_id = employee_id.strip()
        if EmployeeFace.objects(employee_id=employee_id).first():
            raise HTTPException(status_code=409, detail="Employee already registered hai.")

        face_result = self.face_engine.add_employee_face(employee_id, image_bytes)
        if not face_result["success"]:
            raise HTTPException(status_code=400, detail=face_result["message"])

        employee = EmployeeFace(
            employee_id=employee_id,
            name=name.strip(),
            department=department.strip() if department else None,
            image=image_bytes,
            image_content_type=image_content_type,
            faiss_id=face_result["faiss_id"],
            updated_at=datetime.utcnow(),
        )
        employee.save()

        return {
            "success": True,
            "message": "Employee image MongoDB me saved aur face FAISS me indexed.",
            "employee_id": employee.employee_id,
            "name": employee.name,
            "department": employee.department,
            "image_saved": True,
            "faiss_id": employee.faiss_id,
        }

    def recognize_and_punch(self, image_bytes: bytes) -> dict[str, Any]:
        match = self.face_engine.search_employee(image_bytes)
        if not match["found"]:
            return {
                "success": False,
                "recognized": False,
                "message": match["message"],
                "confidence": match.get("confidence"),
            }

        employee = EmployeeFace.objects(employee_id=match["employee_id"]).first()
        if employee is None:
            raise HTTPException(status_code=404, detail="Employee MongoDB me nahi mila.")

        now = datetime.utcnow()
        open_record = (
            AttendanceRecord.objects(employee_id=employee.employee_id, status="PUNCHED_IN")
            .order_by("-punch_in")
            .first()
        )

        if open_record is None:
            record = AttendanceRecord(
                employee_id=employee.employee_id,
                employee_name=employee.name,
                department=employee.department,
                punch_in=now,
                punch_out=None,
                duration_seconds=None,
                status="PUNCHED_IN",
                punch_in_confidence=match["confidence"],
                updated_at=now,
            )
            record.save()

            return {
                "success": True,
                "recognized": True,
                "action": "PUNCH_IN",
                "message": "Punch-in successful.",
                "attendance_id": str(record.id),
                "employee_id": employee.employee_id,
                "employee_name": employee.name,
                "department": employee.department,
                "employee_image_url": f"/api/v1/attendance/employees/{employee.employee_id}/image",
                "confidence": match["confidence"],
                "punch_in": now.isoformat(),
                "punch_out": None,
                "duration_seconds": None,
                "duration_human": None,
            }

        duration_seconds = int((now - open_record.punch_in).total_seconds())
        open_record.punch_out = now
        open_record.duration_seconds = duration_seconds
        open_record.status = "PUNCHED_OUT"
        open_record.punch_out_confidence = match["confidence"]
        open_record.updated_at = now
        open_record.save()

        return {
            "success": True,
            "recognized": True,
            "action": "PUNCH_OUT",
            "message": "Punch-out successful.",
            "attendance_id": str(open_record.id),
            "employee_id": employee.employee_id,
            "employee_name": employee.name,
            "department": employee.department,
            "employee_image_url": f"/api/v1/attendance/employees/{employee.employee_id}/image",
            "confidence": match["confidence"],
            "punch_in": open_record.punch_in.isoformat(),
            "punch_out": now.isoformat(),
            "duration_seconds": duration_seconds,
            "duration_human": self._format_duration(duration_seconds),
        }

    def get_employee_image(self, employee_id: str) -> tuple[bytes, str]:
        employee = EmployeeFace.objects(employee_id=employee_id).only("image", "image_content_type").first()
        if employee is None or not employee.image:
            raise HTTPException(status_code=404, detail="Employee image nahi mili.")
        return bytes(employee.image), employee.image_content_type or "image/jpeg"

    def get_employee_records(self, employee_id: str, limit: int = 20) -> list[dict[str, Any]]:
        records = AttendanceRecord.objects(employee_id=employee_id).order_by("-punch_in").limit(limit)
        return [
            {
                "attendance_id": str(record.id),
                "employee_id": record.employee_id,
                "employee_name": record.employee_name,
                "department": record.department,
                "status": record.status,
                "punch_in": record.punch_in.isoformat() if record.punch_in else None,
                "punch_out": record.punch_out.isoformat() if record.punch_out else None,
                "duration_seconds": record.duration_seconds,
                "duration_human": self._format_duration(record.duration_seconds)
                if record.duration_seconds is not None
                else None,
            }
            for record in records
        ]

    def _format_duration(self, total_seconds: int) -> str:
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

