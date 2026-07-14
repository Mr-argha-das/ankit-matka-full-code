from fastapi import FastAPI, APIRouter
from mongoengine import connect
from pydantic import BaseModel
from ...models import DevloperAccess
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/devops", tags=["Developer Routes"])

class AccessSchema(BaseModel):
    value: bool
@router.post("/developer-access")
def create_or_update_access(data: AccessSchema):
    # Check if any DevloperAccess document exists
    record = DevloperAccess.objects.first()

    if record:
        # update existing
        record.value = data.value
        record.save()
        return {"message": "Updated", "value": record.value}

    else:
        # create new
        new_record = DevloperAccess(value=data.value)
        new_record.save()
        return {"message": "Created", "value": new_record.value}


# ----------------------------------------------------
# GET API
# ----------------------------------------------------
@router.get("/developer-access")
def get_access():
    record = DevloperAccess.objects.first()
    if record:
        return {"value": record.value}
    return {"error": "No record found"}
