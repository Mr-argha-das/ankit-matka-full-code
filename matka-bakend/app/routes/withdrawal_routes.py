import uuid
from fastapi import APIRouter, Depends, HTTPException, Form
from datetime import datetime
from ..models import Transaction, Wallet
from ..models import Withdrawal
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/withdraw")


def get_or_create_wallet(user_id: str):
    wallet = Wallet.objects(user_id=user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=0)
        wallet.save()
    return wallet

@router.post("/request")
def request_withdraw(
    amount: float = Form(...),
    method: str = Form(...),
    number: str = Form(...),
    user=Depends(get_current_user)
):
    wallet = get_or_create_wallet(str(user.id))

    if amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    if wallet.balance < amount:
        raise HTTPException(400, "Insufficient balance")

    wd = Withdrawal(
        user_id=str(user.id),
        amount=amount,
        method=method,
        number=number
    ).save()

    return {
        "message": "Withdrawal request submitted",
        "withdrawal_id": wd.wd_id,
        "status": wd.status
    }


@router.get("/my")
def my_withdrawals(user=Depends(get_current_user)):
    data = Withdrawal.objects(user_id=str(user.id)).order_by("-created_at")
    return [
        {
            "wd_id": w.wd_id,
            "amount": w.amount,
            "method": w.method,
            "number": w.number,
            "status": w.status,
            "created_at": w.created_at
        }
        for w in data
    ]




@router.get("/admin/pending", dependencies=[Depends(require_admin)])
def admin_pending():
    pending = Withdrawal.objects.order_by("-created_at")
    return [
        {
            "wd_id": w.wd_id,
            "user_id": w.user_id,
            "amount": w.amount,
            "method": w.method,
            "number": w.number,
            "created_at": w.created_at
        }
        for w in pending
    ]




@router.post("/admin/approve", dependencies=[Depends(require_admin)])
def approve_withdraw(wd_id: str = Form(...)):
    wd = Withdrawal.objects(wd_id=wd_id).first()

    if not wd:
        raise HTTPException(404, "Withdrawal request not found")

    if wd.status != "PENDING":
        return {"message": "Already processed"}

    wallet = get_or_create_wallet(wd.user_id)

    if wallet.balance < wd.amount:
        raise HTTPException(400, "User wallet balance insufficient")

    # Deduct Money
    wallet.balance -= wd.amount
    wallet.updated_at = datetime.utcnow()
    wallet.save()

    wd.status = "SUCCESS"
    wd.confirmed_at = datetime.utcnow()
    wd.save()
    tx = Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(wd.user_id),
        amount=-wd.amount,
        payment_method="Withdrawal",
        status="Approved"
    ).save()

    return {"message": "Withdrawal Approved", "new_balance": wallet.balance}




@router.post("/admin/reject", dependencies=[Depends(require_admin)])
def reject_withdraw(wd_id: str = Form(...)):
    wd = Withdrawal.objects(wd_id=wd_id).first()

    if not wd:
        raise HTTPException(404, "Withdrawal not found")

    wd.status = "FAILED"
    wd.confirmed_at = datetime.utcnow()
    wd.save()
    tx = Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(wd.user_id),
        amount=-wd.amount,
        payment_method="Withdrawal",
        status="Rejected"
    ).save()

    return {"message": "Withdrawal Rejected"}
