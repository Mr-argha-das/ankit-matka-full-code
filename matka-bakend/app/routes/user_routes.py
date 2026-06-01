import json
from app.utils import hash_password, verify_password
from fastapi import APIRouter, Depends, HTTPException, Form, Query
from datetime import datetime
import uuid
from ..models import Wallet, Transaction, User
from ..auth import get_current_user, require_admin
from bson import ObjectId
router = APIRouter(prefix="/user")


def get_or_create_wallet(uid):
    w = Wallet.objects(user_id=uid).first()
    if not w:
        w = Wallet(user_id=uid, balance=0).save()
    return w


@router.post("/add-money")
def add_money(amount: float = Form(...), payment_method: str = Form(...), user=Depends(get_current_user)):
    if amount <= 0:
        raise HTTPException(400, "Invalid amount")

    tx = Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(user.id),
        amount=amount,
        payment_method=payment_method,
        status="PENDING"
    ).save()

    return {"message": "Payment request created", "transaction_id": tx.tx_id}

@router.get("/deposit-requiest-normal")
def deposit_requiest_normal(user=Depends(require_admin)):
    deposit = Transaction.objects(status="PENDING").order_by("-created_at")
    return [{
        "tx_id": d.tx_id,
        "user": json.loads(User.objects(id=d.user_id).first().to_json()) if User.objects(id=d.user_id).first() else {},
        "amount": d.amount,
        "payment_method": d.payment_method,
        "created_at": d.created_at
    } for d in deposit]


@router.post("/approve-deposit-normal")
def approve_deposit_normal(
    tx_id: str = Form(...),
    amount: float = Form(...),
    user=Depends(require_admin)
):
    tx = Transaction.objects(tx_id=tx_id).first()
    if not tx:
        raise HTTPException(404, "Transaction not found")

    if tx.status != "PENDING":
        raise HTTPException(400, "Transaction already processed")

    # Update wallet
    wallet = get_or_create_wallet(tx.user_id)
    wallet.update(inc__balance=amount)

    tx.status = "SUCCESS"
    tx.amount = amount
    tx.updated_at = datetime.utcnow()
    tx.save()

    return {"message": "Deposit Approved", "amount_added": amount}

@router.post("/failed-deposit-normal")
def faild_deposit_normal(
    tx_id: str = Form(...),
    amount: float = Form(...),
    user=Depends(require_admin)
):
    tx = Transaction.objects(tx_id=tx_id).first()
    if not tx:
        raise HTTPException(404, "Transaction not found")

    if tx.status != "PENDING":
        raise HTTPException(400, "Transaction already processed")

    # Update wallet
    wallet = get_or_create_wallet(tx.user_id)
    wallet.update(inc__balance=amount)

    tx.status = "FAILED"
    tx.amount = amount
    tx.updated_at = datetime.utcnow()
    tx.save()

    return {"message": "Deposit Failed", "amount_added": amount}


@router.get("/balance")
def balance(user=Depends(get_current_user)):
    w = get_or_create_wallet(str(user.id))
    return {"balance": w.balance}


@router.get("/transactions")
def transactions(user=Depends(get_current_user)):
    tr = Transaction.objects(user_id=str(user.id)).order_by("-created_at")
    return [{
        "tx_id": t.tx_id,
        "amount": t.amount,
        "method": t.payment_method,
        "status": t.status,
        "created_at": t.created_at
    } for t in tr]


@router.get("/transactions-wallet-history")
def transactions_wallet_history(user=Depends(get_current_user)):
    tr = Transaction.objects(user_id=str(user.id)).order_by("-created_at")
    return [{
        "tx_id": t.tx_id,
        "amount": t.amount,
        "method": t.payment_method,
        "status": t.status,
        "created_at": t.created_at
    } for t in tr]




@router.get("/winning_history")
def winning_history(
    start_date: str = Query(None, description="Format: YYYY-MM-DD"),
    end_date: str = Query(None, description="Format: YYYY-MM-DD"),
    user=Depends(get_current_user)
):

    query = {
        "user_id": str(user.id),
        "payment_method": "WIN",
        "status": "SUCCESS"
    }

    # -------------------------
    # DATE FILTERS APPLY HERE
    # -------------------------
    if start_date:
        try:
            s_date = datetime.strptime(start_date, "%Y-%m-%d")
            query["created_at__gte"] = s_date
        except:
            return {"error": "Invalid start_date format. Use YYYY-MM-DD"}

    if end_date:
        try:
            e_date = datetime.strptime(end_date, "%Y-%m-%d")
            query["created_at__lte"] = e_date
        except:
            return {"error": "Invalid end_date format. Use YYYY-MM-DD"}

    # Run Query
    wins = Transaction.objects(**query).order_by("-created_at")

    return {
        "success": True,
        "winning_count": wins.count(),
        "wins": [{
            "tx_id": w.tx_id,
            "amount": w.amount,
            "date": w.created_at
        } for w in wins]
    }

@router.get("/profile")
def get_profile(user=Depends(get_current_user)):
    return json.loads(user.to_json())

@router.get('/me')
def read_users_me(current_user: User = Depends(get_current_user)):
    return json.loads(current_user.to_json())



@router.get("/profile2")
def get_profile2(user=Depends(get_current_user)):
    return json.loads(user.to_json())


@router.put("/profile")
def update_profile(
    username: str = Form(...),
    mobile: str = Form(...),
    user=Depends(get_current_user)
):  
    user.username = username
    user.mobile = mobile
    user.save()
    return {"message": "Profile updated successfully"}

@router.post("/update-password")
def update_password(
    old_password: str = Form(...),
    new_password: str = Form(...),
    user = Depends(get_current_user)
):
    # 1️⃣ Check old password
    if not verify_password(old_password, user.password_hash):
        raise HTTPException(400, "Old password is incorrect")

    # 2️⃣ Hash new password
    new_hash = hash_password(new_password)

    # 3️⃣ Save updated password
    user.update(password_hash=new_password)

    return {"message": "Password updated successfully"}

@router.get("/all-users", dependencies=[Depends(require_admin)])
def all_users():
    users = User.objects().order_by("-created_at")
    return [{
        "user_id": str(u.id),
        "username": u.username,
        "mobile": u.mobile,
        "role": u.role,
        "created_at": u.created_at
    } for u in users]

@router.get("/{user_id}")
def user_by_id(user_id: str):
    # Validate ObjectId
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user ID")

    user = User.objects(id=user_id).first()

    

    return {
        "user_id": str(user.id),
        "username": user.username,
        "mobile": user.mobile,
        "role": user.role,
        "password": user.password_hash,
        "created_at": user.created_at
    }