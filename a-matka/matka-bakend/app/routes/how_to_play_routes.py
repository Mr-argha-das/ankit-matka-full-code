from app.models import HowToPlay
from app.schemas import HowToPlaySchema
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/howtoplay", tags=["How To Play"])


# --------------------------------------
# Add / Update (Upsert)
# --------------------------------------
@router.post("/update")
def update_how_to_play(payload: HowToPlaySchema):

    doc = HowToPlay.objects.first()

    if not doc:
        doc = HowToPlay(
            content=payload.content,
            video_id=payload.video_id
        )
    else:
        # Update existing
        doc.content = payload.content
        doc.video_id = payload.video_id

    doc.save()

    return {"status": "success", "message": "How To Play updated"}


# --------------------------------------
# Get (for frontend)
# --------------------------------------
@router.get("/get")
def get_how_to_play():

    doc = HowToPlay.objects.first()

    if not doc:
        return {"content": "", "video_id": ""}

    return {
        "content": doc.content,
        "video_id": doc.video_id
    }


# --------------------------------------
# Delete (Reset)
# --------------------------------------
@router.delete("/delete")
def delete_how_to_play():

    doc = HowToPlay.objects.first()

    if not doc:
        raise HTTPException(status_code=404, detail="Nothing to delete")

    doc.delete()

    return {"status": "deleted"}
