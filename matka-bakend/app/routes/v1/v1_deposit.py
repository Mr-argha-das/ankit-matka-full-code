from bson import ObjectId
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import FileResponse


# from datetime import datetime
import datetime
import os
import uuid

from ...auth import get_current_user, require_admin
from ...models import DepositQR, Transaction, Wallet, User, Withdrawal

router = APIRouter(prefix="/user-deposit-withdrawal", tags=["Deposit Withdrawal"])

# Directory for uploaded deposit images
UPLOAD_DIR = "uploads/deposit_qr"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_IMAGE_SIZE = 10 * 1024 * 1024


# =====================================================================
# 1️⃣ USER: Upload Deposit QR
# =====================================================================

@router.post("/upload")
async def upload_qr(
    trnx: str = Form(None),
    amount: float = Form(...),
    method: str = Form(...),
    image: UploadFile = File(...),
    user=Depends(get_current_user)
):
    # Validate amount
    if amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    # Validate method
    if not method:
        raise HTTPException(400, "Method is required")

    # Android content pickers may provide a URI or filename without an
    # extension, so validate the MIME type instead of relying on the name.
    content_type = (image.content_type or "").lower()
    extension = ALLOWED_IMAGE_TYPES.get(content_type)
    if not extension:
        raise HTTPException(400, "Only PNG, JPG or WEBP images are allowed")

    image_bytes = await image.read(MAX_IMAGE_SIZE + 1)
    if not image_bytes:
        raise HTTPException(400, "Uploaded screenshot is empty")
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(413, "Screenshot size must be under 10 MB")

    # Save image
    filename = f"{uuid.uuid4()}{extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(image_bytes)

    # Create deposit request
    qr = DepositQR(
        trnx_id=trnx,
        amount=amount,
        method=method,
        user_id=str(user.id),
        image_url=f"/uploads/deposit_qr/{filename}",
        status="PENDING",
        created_at= datetime.datetime.utcnow(),
        updated_at= datetime.datetime.utcnow()
    )
    qr.save()

    return {
        "message": "QR uploaded successfully",
        "id": str(qr.id),
        "amount": amount,
        "method": method,
        "image_url": qr.image_url
    }


# =====================================================================
# 2️⃣ USER: Get Last Uploaded Image
# =====================================================================

@router.get("/image/{user_id}")
def get_qr_image(user_id: str):
    qr = DepositQR.objects(user_id=user_id).order_by("-created_at").first()
    if not qr:
        raise HTTPException(404, "Image not found")

    file_path = qr.image_url.replace("/uploads/deposit_qr/", UPLOAD_DIR + "/")
    return FileResponse(file_path)


# =====================================================================
# 3️⃣ ADMIN: Get All Deposit Requests
# =====================================================================

@router.get("/admin/deposit/pending", dependencies=[Depends(require_admin)])
def get_pending_deposit_list():
    pending = DepositQR.objects().order_by("-created_at")
    data = []

    for p in pending:
        user = User.objects(id=p.user_id).first()
        data.append({
            "id": str(p.id),
            "user_id": p.user_id,
            "username": user.username if user else "Unknown",
            "mobile":user.mobile,
            "method": p.method,
            "status": p.status,
            "image_url": p.image_url,
            "uploaded_at": p.created_at,
            "trnx_id": p.trnx_id,
            "amount": p.amount
        })

    return {"count": len(data), "pending": data}


# =====================================================================
# 4️⃣ ADMIN: Approve Deposit
# =====================================================================

@router.post("/admin/deposit/approve", dependencies=[Depends(require_admin)])
def approve_deposit(request_id: str = Form(...), amount: float = Form(...)):
    qr = DepositQR.objects(id=request_id).first()
    if not qr:
        raise HTTPException(404, "Deposit request not found")

    if qr.status != "PENDING":
        raise HTTPException(400, "Already processed")

    wallet = Wallet.objects(user_id=qr.user_id).first()
    if not wallet:
        wallet = Wallet(user_id=qr.user_id, balance=0)
        wallet.save()

    # Deposit money
    wallet.balance += amount
    wallet.updated_at = datetime.datetime.utcnow()
    wallet.save()

    # Update QR request
    qr.status = "SUCCESS"
    qr.amount = amount
    qr.updated_at = datetime.datetime.utcnow()
    qr.save()

    # Create transaction
    Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(qr.user_id),
        amount=amount,
        payment_method="Deposit",
        status="SUCCESS"
    ).save()

    return {"message": "Deposit Approved", "amount_added": amount}


# =====================================================================
# 5️⃣ ADMIN: Reject Deposit
# =====================================================================

@router.post("/admin/deposit/reject", dependencies=[Depends(require_admin)])
def reject_deposit(request_id: str = Form(...)):
    qr = DepositQR.objects(id=request_id).first()
    if not qr:
        raise HTTPException(404, "Request not found")

    if qr.status != "PENDING":
        raise HTTPException(400, "Already processed")

    qr.status = "FAILED"
    qr.updated_at = datetime.datetime.utcnow()
    qr.save()

    Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(qr.user_id),
        amount=0,
        payment_method="Deposit",
        status="FAILED"
    ).save()

    return {"message": "Deposit Rejected"}


# =====================================================================
# 6️⃣ USER: Deposit History
# =====================================================================

@router.get("/history")
def get_deposit_history(status: str | None = None, user=Depends(get_current_user)):
    query = {"user_id": str(user.id)}
    if status:
        query["status"] = status.upper()

    history = DepositQR.objects(**query).order_by("-created_at")

    return [
        {
            "id": str(h.id),
            "image_url": h.image_url,
            "status": h.status,
            "amount": h.amount,
            "uploaded_at": h.created_at,
            "updated_at": h.updated_at
        }
        for h in history
    ]


# =====================================================================
# COMMON: Get or create wallet
# =====================================================================

def get_or_create_wallet(user_id: str):
    wallet = Wallet.objects(user_id=user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=0)
        wallet.save()
    return wallet


# =====================================================================
# 7️⃣ USER: Request Withdrawal
# =====================================================================


@router.post("/withdraw/request")
def request_withdraw(
    amount: float = Form(...),
    method: str = Form(...),

    number: str | None = Form(None),                 # OPTIONAL
    account_holder_name: str | None = Form(None),    # OPTIONAL
    account_no: str | None = Form(None),             # OPTIONAL
    ifc_code: str | None = Form(None),               # OPTIONAL

    user=Depends(get_current_user)
):

    wallet = get_or_create_wallet(str(user.id))

    # Basic validations
    if amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    if wallet.balance < amount:
        raise HTTPException(400, "Insufficient balance")

    pending_total = sum(
        pending.amount
        for pending in Withdrawal.objects(user_id=str(user.id), status="pending")
    )
    available_balance = wallet.balance - pending_total

    if available_balance < amount:
        raise HTTPException(400, "Insufficient available balance")

    # Create withdrawal request
    wd = Withdrawal(
        user_id=str(user.id),
        amount=amount,
        method=method,
        number=number,
        account_holder_name=account_holder_name,
        account_no=account_no,
        ifc_code=ifc_code
    ).save()

    return {
        "message": "Withdrawal request submitted",
        "withdrawal_id": wd.wd_id,
        "status": wd.status,
        "available_balance": available_balance - amount
    }



# =====================================================================
# 8️⃣ USER: My Withdrawal List
# =====================================================================

@router.get("/withdraw/my")
def my_withdrawals(user=Depends(get_current_user)):
    data = Withdrawal.objects(user_id=str(user.id)).order_by("-created_at")
    return [
        {
            "wd_id": w.wd_id,
            "amount": w.amount,
            "method": w.method,
            "number": w.number,
            "status": w.status,
            "created_at": w.created_at,
            "account_holder_name":w.account_holder_name,
            "account_no":w.account_no,
            "ifc_code": w.ifc_code
        }
        for w in data
    ]


# =====================================================================
# 9️⃣ ADMIN: View Withdrawal Requests
# =====================================================================

@router.get("/admin/withdraw", dependencies=[Depends(require_admin)])
def admin_withdrawals():
    pending = Withdrawal.objects().order_by("-created_at")
    data = []

    for w in pending:
        user = User.objects(id=str(w.user_id)).first()
        data.append({
            "wd_id": w.wd_id,
            "username": user.username if user else "Unknown",
            "mobileNumber": user.mobile if user else "",
            "amount": w.amount,
            "method": w.method,
            "number": w.number,
            "status": w.status,
            "created_at": w.created_at,
            "account_holder_name": w.account_holder_name,
            "account_no": w.account_no,
            "ifc_code": w.ifc_code
        })

    return data

@router.post("/admin/withdraw/approve", dependencies=[Depends(require_admin)])
def approve_withdrawal(wd_id: str = Form(...)):
    wd = Withdrawal.objects(wd_id=wd_id).first()
    if not wd:
        raise HTTPException(404, "Withdrawal not found")

    if wd.status != "pending":
        raise HTTPException(400, "Already processed")
    
    wallet = get_or_create_wallet(wd.user_id)

    if wallet.balance < wd.amount:
        raise HTTPException(400, "User balance insufficient")

    wallet.balance -= wd.amount
    wallet.updated_at = datetime.datetime.utcnow()
    wallet.save()

    wd.status = "success"
    wd.confirmed_at = datetime.datetime.utcnow()
    wd.save()

    Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(wd.user_id),
        amount=-wd.amount,
        payment_method="Withdrawal",
        status="SUCCESS"
    ).save()

    return {"message": "Withdrawal Approved", "new_balance": wallet.balance}





@router.post("/admin/withdraw/reject", dependencies=[Depends(require_admin)])
def reject_withdrawal(wd_id: str = Form(...)):
    wd = Withdrawal.objects(wd_id=wd_id).first()
    if not wd:
        raise HTTPException(404, "Withdrawal not found")

    if wd.status != "pending":
        raise HTTPException(400, "Already processed")

    wd.status = "rejected"
    wd.confirmed_at = datetime.datetime.utcnow()
    wd.save()

    Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(wd.user_id),
        amount=0,
        payment_method="Withdrawal",
        status="FAILED"
    ).save()

    return {"message": "Withdrawal rejected"}
