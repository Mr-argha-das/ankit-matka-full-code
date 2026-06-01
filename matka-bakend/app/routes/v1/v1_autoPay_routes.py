


import random
import string
from ...models import Wallet, Transaction
from pydantic import BaseModel
from datetime import datetime, timedelta
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi_utils.tasks import repeat_every
router = APIRouter(prefix="/user-deposit-deeplink", tags=["Auto Pay UPI"])

class CreatePaymentRequest(BaseModel):
    user_id: str
    amount: float


class SMSWebhookRequest(BaseModel):
    userId: str
    status: str

def generate_txn_id():
    return "TXN" + ''.join(random.choices(string.digits, k=8))


def get_or_create_wallet(user_id):
    wallet = Wallet.objects(user_id=user_id).first()
    if wallet:
        return wallet
    return Wallet(user_id=user_id, balance=0).save()

@router.post("/payment/create")
def create_payment(req: CreatePaymentRequest):
    try:
        txn_id = generate_txn_id()

        expires = datetime.utcnow() + timedelta(minutes=3)  # 3 min timeout

        Transaction(
        tx_id=txn_id,
        user_id=req.user_id,
        amount=req.amount,
        status="pending",
        expires_at=expires,
        payment_method="UPI AutoPay"
        ).save()

        upi_link = (
        f"upi://pay?pa=2977654a@bandhan&pn=Kalyan Ratan 777"
        f"&am=1&cu=INR&tn=Paying to Kalyan Ratan 777&tr={txn_id}"
        )

        return {
        "status": "pending",
        "txn_id": txn_id,
        "upi_link": upi_link
        }
    except Exception as e:
        print("Error in create_payment:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payment/sms-webhook")
def sms_webhook(req: SMSWebhookRequest):


    # Find user pending transaction
    txn = Transaction.objects(
        status="pending", 
        user_id=str(req.userId)
    ).order_by("-created_at").first()

    if not txn:
        return {"error": "Transaction not found"}

    # Normalize incoming status
    status = req.status.lower().strip()

    # Map status
    if status == "success":
        txn.status = "SUCCESS"
    elif status in ["submitted", "processing", "pending"]:
        txn.status = "PENDING"
    else:
        txn.status = "FAILED"

    txn.save()

    # Only SUCCESS should credit wallet
    if txn.status == "SUCCESS":
        wallet = get_or_create_wallet(txn.user_id)
        wallet.balance += txn.amount
        wallet.updated_at = datetime.utcnow()
        wallet.save()

        return {
            "status": "success",
            "message": "Wallet credited",
            "new_balance": wallet.balance
        }

    return {
        "status": txn.status,
        "message": "Transaction updated but wallet NOT credited",
    }



@router.get("/wallet/{user_id}")
def get_wallet(user_id: str):
    wallet = get_or_create_wallet(user_id)
    return {
        "user_id": wallet.user_id,
        "balance": wallet.balance
    }
@router.on_event("startup")
@repeat_every(seconds=30)  # every 30 sec auto check
def auto_fail_pending_transactions():
    now = datetime.utcnow()

    # Find all expired pending transactions
    expired_txns = Transaction.objects(
        status="pending",
        expires_at__lt=now
    )

    for txn in expired_txns:
        txn.status = "FAILED"
        txn.save()

    print(f"Auto-Failed TXN Count: {len(expired_txns)}")