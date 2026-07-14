from app.models import Notification
from app.schemas import NotificationSchema
from fastapi import APIRouter, HTTPException

from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# CREATE
@router.post("/add")
def add_notification(payload: NotificationSchema):
    n = Notification(title=payload.title, created_at=datetime.utcnow())
    n.save()
    return {"status": "success", "message": "Notification added"}

# GET ALL
@router.get("/all")
def get_all_notifications():
    data = []
    for n in Notification.objects:
        data.append({
            "id": str(n.id),
            "title": n.title,
            "created_at": n.created_at
        })
    return data

# DELETE
@router.delete("/delete/{id}")
def delete_notification(id: str):
    n = Notification.objects(id=id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    n.delete()
    return {"status": "deleted"}
