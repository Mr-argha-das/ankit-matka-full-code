import json
import uuid
from datetime import datetime, timedelta
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ...auth import get_current_user
from ...models import Transaction, Wallet, siteData

router = APIRouter(prefix="/payment", tags=["Payment"])


class CreateUpiPaymentRequest(BaseModel):
    amount: float
    user_id: str | None = None


class ConfirmUpiPaymentRequest(BaseModel):
    tx_id: str
    status: str
    upi_txn_id: str | None = None
    approval_ref_no: str | None = None
    raw_response: dict | str | None = None


def get_or_create_wallet(user_id: str):
    wallet = Wallet.objects(user_id=user_id).first()
    if wallet:
        return wallet
    return Wallet(user_id=user_id, balance=0).save()


def get_deposit_upi_id() -> str:
    data = siteData.objects().first()
    upi_id = (data.upi_id if data else "") or ""
    upi_id = upi_id.strip()
    if not upi_id:
        raise HTTPException(400, "Deposit UPI ID is not configured")
    return upi_id


def normalize_upi_status(status: str) -> str:
    normalized = (status or "").strip().upper()
    if normalized in {"SUCCESS", "COMPLETED", "APPROVED", "OK", "00"}:
        return "SUCCESS"
    if normalized in {"SUBMITTED", "PENDING", "PROCESSING"}:
        return "PENDING"
    return "FAILED"


def build_upi_link(upi_id: str, amount: float, tx_id: str) -> str:
    params = {
        "pa": upi_id,
        "pn": "Matka Wallet",
        "am": f"{amount:.2f}",
        "cu": "INR",
        "tn": f"Wallet Deposit {tx_id}",
        "tr": tx_id,
    }
    return f"upi://pay?{urlencode(params)}"


@router.post("/create-order")
def create_order(data: CreateUpiPaymentRequest, user=Depends(get_current_user)):
    if data.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    upi_id = get_deposit_upi_id()
    tx_id = f"UPI{uuid.uuid4().hex[:12].upper()}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    tx = Transaction(
        tx_id=tx_id,
        user_id=str(user.id),
        amount=data.amount,
        status="PENDING",
        payment_method="UPI Intent",
        upi_id=upi_id,
        expires_at=expires_at,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    ).save()

    upi_link = build_upi_link(upi_id, data.amount, tx_id)

    return {
        "tx_id": tx.tx_id,
        "status": tx.status,
        "amount": tx.amount,
        "upi_id": upi_id,
        "upi_link": upi_link,
        "expires_at": tx.expires_at,
    }


@router.post("/confirm-upi")
def confirm_upi_payment(data: ConfirmUpiPaymentRequest, user=Depends(get_current_user)):
    tx = Transaction.objects(tx_id=data.tx_id, user_id=str(user.id)).first()
    if not tx:
        raise HTTPException(404, "Transaction not found")

    if tx.status == "SUCCESS":
        return {
            "message": "Payment already confirmed",
            "status": tx.status,
            "balance": get_or_create_wallet(tx.user_id).balance,
        }

    if tx.expires_at and tx.expires_at < datetime.utcnow():
        tx.status = "FAILED"
        tx.updated_at = datetime.utcnow()
        tx.raw_response = json.dumps(data.raw_response or data.status)
        tx.save()
        raise HTTPException(400, "Payment session expired")

    status = normalize_upi_status(data.status)
    raw_response = data.raw_response
    if isinstance(raw_response, dict):
        raw_response = json.dumps(raw_response)
    elif raw_response is not None:
        raw_response = str(raw_response)

    if data.upi_txn_id:
        duplicate = Transaction.objects(
            upi_txn_id=data.upi_txn_id,
            status="SUCCESS",
            tx_id__ne=tx.tx_id,
        ).first()
        if duplicate:
            raise HTTPException(400, "Duplicate UPI transaction")

    tx.status = status
    tx.upi_txn_id = data.upi_txn_id
    tx.approval_ref_no = data.approval_ref_no
    tx.raw_response = raw_response
    tx.updated_at = datetime.utcnow()

    if status == "SUCCESS":
        wallet = get_or_create_wallet(tx.user_id)
        wallet.balance += tx.amount
        wallet.updated_at = datetime.utcnow()
        wallet.save()
        tx.confirmed_at = datetime.utcnow()
        tx.save()
        return {
            "message": "Payment confirmed and wallet credited",
            "status": tx.status,
            "balance": wallet.balance,
        }

    tx.save()
    return {
        "message": "Payment status updated",
        "status": tx.status,
        "balance": get_or_create_wallet(tx.user_id).balance,
    }


@router.get("/status/{tx_id}")
def payment_status(tx_id: str, user=Depends(get_current_user)):
    tx = Transaction.objects(tx_id=tx_id, user_id=str(user.id)).first()
    if not tx:
        raise HTTPException(404, "Transaction not found")

    return {
        "tx_id": tx.tx_id,
        "amount": tx.amount,
        "status": tx.status,
        "payment_method": tx.payment_method,
        "upi_txn_id": tx.upi_txn_id,
        "approval_ref_no": tx.approval_ref_no,
        "created_at": tx.created_at,
        "updated_at": tx.updated_at,
        "confirmed_at": tx.confirmed_at,
    }
