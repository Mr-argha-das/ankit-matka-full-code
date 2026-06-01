from fastapi import APIRouter, Depends
from ..auth import get_current_user
from ..models import Market, Transaction, Withdrawal, Bid, DepositQR
from datetime import datetime
router = APIRouter(prefix="/passbook", tags=["Passbook"])


@router.get("/history")
def passbook_history(
    start_date: str = None,
    end_date: str = None,
    user=Depends(get_current_user)
):
    user_id = str(user.id)
    entries = []

    start_dt = None
    end_dt = None

    if start_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")

    if end_date:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")

        # include whole day:
        end_dt = end_dt.replace(hour=23, minute=59, second=59)

    # ---------------------------------
    # Helper to check date range
    # ---------------------------------
    def in_range(date):
        if start_dt and date < start_dt:
            return False
        if end_dt and date > end_dt:
            return False
        return True

    # -----------------------------
    # 1️⃣ Deposits
    # -----------------------------
    deposits = Transaction.objects(
        user_id=user_id,
        payment_method="DEPOSIT"
    )
    for d in deposits:
        if in_range(d.created_at):
            entries.append({
                "type": "DEPOSIT",
                "amount": d.amount,
                "status": d.status,
                "tx_id": d.tx_id,
                "created_at": d.created_at
            })

    # -----------------------------
    # 2️⃣ Wins
    # -----------------------------
    wins = Transaction.objects(
        user_id=user_id,
        payment_method="WIN"
    )
    for w in wins:
        if in_range(w.created_at):
            entries.append({
                "type": "WIN",
                "amount": w.amount,
                "status": w.status,
                "tx_id": w.tx_id,
                "created_at": w.created_at
            })

    # -----------------------------
    # 3️⃣ Withdrawals
    # -----------------------------
    withdrawals = Withdrawal.objects(user_id=user_id)
    for w in withdrawals:
        if in_range(w.created_at):
            entries.append({
                "type": "WITHDRAWAL",
                "amount": w.amount,
                "method": w.method,
                "status": w.status,
                "created_at": w.created_at
            })

    # -----------------------------
    # 4️⃣ Bids
    # -----------------------------
    bids = Bid.objects(user_id=user_id)
    for b in bids:
        if in_range(b.created_at):
            entries.append({
                "type": "BID",
                "game_type": b.game_type,
                "market_id": Market.objects(id=b.market_id).first().name if Market.objects(id=b.market_id).first() else "Deleted Market",
                "session": b.session,
                "digit": b.digit,
                "debit": b.points,
                "created_at": b.created_at
            })

    # -----------------------------
    # 5️⃣ QR Deposit
    # -----------------------------
    qr = DepositQR.objects(user_id=user_id)
    for q in qr:
        if in_range(q.created_at):
            entries.append({
                "type": "QR_DEPOSIT",
                "image_url": q.image_url,
                "amount": q.amount,
                "status": q.status,
                "created_at": q.created_at
            })

    # -----------------------------
    # SORT BY DATE
    # -----------------------------
    entries = sorted(entries, key=lambda x: x["created_at"], reverse=True)

    return {
        "success": True,
        "count": len(entries),
        "history": entries
    }