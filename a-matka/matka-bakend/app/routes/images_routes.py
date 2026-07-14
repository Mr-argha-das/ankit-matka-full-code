from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import shutil

router = APIRouter(prefix="/image", tags=["Qr image management"])

UPLOAD_DIR = "static/uploads"
FILE_NAME = "app_image.jpg"   # Always same image

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # Check file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(400, "Only JPG or PNG allowed")

    file_path = os.path.join(UPLOAD_DIR, FILE_NAME)

    # If file already exists → delete
    if os.path.exists(file_path):
        os.remove(file_path)

    # Save new file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "success": True,
        "message": "Image uploaded & replaced successfully",
        "image_url": f"/static/uploads/{FILE_NAME}"
    }




@router.get("/get")
def get_image():

    file_path = os.path.join(UPLOAD_DIR, FILE_NAME)

    if not os.path.exists(file_path):
        raise HTTPException(404, "No image uploaded yet")

    return {
        "success": True,
        "image_url": f"/static/uploads/{FILE_NAME}"
    }
