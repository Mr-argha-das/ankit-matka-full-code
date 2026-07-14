from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import FileResponse
from datetime import datetime
import os
import uuid

from ..auth import get_current_user, require_admin
from ..models import DepositQR, Transaction, Wallet, User

router = APIRouter(prefix="/deposit-qr", tags=["Deposit With QR"])

UPLOAD_DIR = "uploads/deposit_qr"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_qr(image: UploadFile = File(...), user=Depends(get_current_user)):

    # only img allowed
    if not image.filename.lower().endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(400, "Only PNG/JPG images allowed")

    # Create new filename
    filename = f"{uuid.uuid4()}.jpg"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(await image.read())

    # 🔥 Always create a NEW QR request entry
    qr = DepositQR(
        user_id=str(user.id),
        image_url=file_path,
        status="PENDING",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    ).save()

    return {
        "message": "QR uploaded successfully",
        "image_url": file_path,
        "id": str(qr.id)
    }


@router.get("/image/{user_id}")
def get_qr_image(user_id: str):

    qr = DepositQR.objects(user_id=user_id).first()
    if not qr:
        raise HTTPException(404, "Image not found")

    return FileResponse(qr.image_url)


# -------------------------------------------------------
# 3️⃣ ADMIN: Get ALL Pending Requests (with username)
# -------------------------------------------------------
@router.get("/pending", dependencies=[Depends(require_admin)])
def get_pending_list():

    pending = DepositQR.objects(status="PENDING").order_by("-created_at")
    data = []

    for p in pending:
        user = User.objects(id=p.user_id).first()
        data.append({
            "id": str(p.id),
            "user_id": p.user_id,
            "username": user.username if user else "Unknown",
            "image_url": p.image_url,
            "uploaded_at": p.created_at
        })

    return {"count": len(data), "pending": data}


@router.post("/approve", dependencies=[Depends(require_admin)])
def approve_deposit(
    request_id: str = Form(...),
    amount: float = Form(...)
):

    qr = DepositQR.objects(id=request_id).first()
    if not qr:
        raise HTTPException(404, "Request not found")

    if qr.status != "PENDING":
        raise HTTPException(400, "Already processed")

    # Update wallet
    wallet = Wallet.objects(user_id=qr.user_id).first()
    wallet.update(inc__balance=amount)

    qr.status = "SUCCESS"
    qr.amount = amount
    qr.updated_at = datetime.utcnow()
    qr.save()
    tx = Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(qr.user_id),
        amount=amount,
        payment_method="Deposit",
        status="Approved"
    ).save()

    return {"message": "Deposit Approved", "amount_added": amount}

# -------------------------------------------------------
# 5️⃣ ADMIN: Reject Deposit
# -------------------------------------------------------
@router.post("/reject", dependencies=[Depends(require_admin)])
def reject_deposit(request_id: str = Form(...)):

    qr = DepositQR.objects(id=request_id).first()
    if not qr:
        raise HTTPException(404, "Request not found")

    qr.status = "FAILED"
    qr.updated_at = datetime.utcnow()
    qr.save()
    tx = Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(qr.user_id),
        amount=0,
        payment_method="Deposit",
        status="Rejected"
    ).save()

    return {"message": "Deposit request rejected"}


@router.get("/history")
def get_deposit_history(
    status: str | None = None,
    user=Depends(get_current_user)
):

    query = {"user_id": str(user.id)}
    if status:
        query["status"] = status.upper()

    history = DepositQR.objects(**query).order_by("-created_at")

    data = []
    for h in history:
        data.append({
            "id": str(h.id),
            "image_url": h.image_url,
            "status": h.status,
            "amount": getattr(h, "amount", None),
            "uploaded_at": h.created_at,
            "updated_at": h.updated_at
        })

    return {
        "count": len(data),
        "history": data
    }