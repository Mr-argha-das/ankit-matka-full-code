from pydantic import BaseModel, Field


class AttendanceCheckIn(BaseModel):
    employee_id: str
    branch_id: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    device_info: str | None = None
    browser_fingerprint: str | None = None
    selfie_base64: str | None = None


class AttendanceCheckOut(BaseModel):
    attendance_id: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    device_info: str | None = None
    browser_fingerprint: str | None = None


class PunchLocation(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    device_info: str | None = None
    browser_fingerprint: str | None = None
    selfie_base64: str | None = None
