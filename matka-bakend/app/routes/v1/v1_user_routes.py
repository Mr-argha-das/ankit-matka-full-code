import json
import uuid

from bson import ObjectId
from app.utils import hash_password, verify_password
from ...models import Market, RateChart, Result, User, Transaction, Wallet,Withdrawal,Bid
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends,Form
from pydantic import BaseModel
from ...auth import get_current_user, require_admin
router = APIRouter(prefix="/api/v1/admin", tags=["Admin user management"])

@router.get("/users")
def all_users(user=Depends(require_admin)):
    users = User.objects().order_by("-created_at")
    return {
        "message": "Users fetched successfully",
        "count": len(users),
        "users": json.loads(users.to_json())
    }

class StatusUpdate(BaseModel):
    status: bool

@router.put("/users/{user_id}/status")
def update_status(user_id: str, payload: StatusUpdate, user=Depends(require_admin)):
    user = User.objects(id=user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.update(status=payload.status)
    return {"message": "Status updated successfully"}

class BetUpdate(BaseModel):
    is_bet: bool

@router.put("/users/{user_id}/is-bet")
def update_is_bet(user_id: str, payload: BetUpdate,user=Depends(require_admin)):
    user = User.objects(id=user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.update(is_bet=payload.is_bet)
    return {"message": "Bet Permission updated successfully"}


# Unapproved Users
@router.get("/users/status/disapprove")
def inactive_users(user=Depends(require_admin)):
    users = User.objects(status=False)
    return {
        "message": "Inactive users fetched successfully",
        "count": len(users),
        "users": json.loads(users.to_json())    
    }

# Approved Users
@router.get("/users/status/approve")
def active_users(user=Depends(require_admin)):
    users = User.objects(status=True)
    return {
        "message": "Active users fetched successfully",
        "count": len(users),
        "users": json.loads(users.to_json())
    }
from datetime import datetime


# Login Today Users
@router.get("/users/today-logins")
def todays_logins(user=Depends(require_admin)):
    today = datetime.utcnow().date()

    users = User.objects(last_login__gte=datetime.combine(today, datetime.min.time()),
                         last_login__lte=datetime.combine(today, datetime.max.time()))

    return {
        "message": "Today's logins fetched successfully",
        "count": len(users),
        "users": json.loads(users.to_json())
    }

@router.get("/user/add-money")
def add_money(amount: float, user_id: str, user=Depends(require_admin)):
    user = User.objects(id=user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if amount <= 0:
        raise HTTPException(400, "Invalid amount")
    wallet = Wallet.objects(user_id=user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=0)
        wallet.save()

    # Deposit money
    wallet.balance += amount
    wallet.updated_at = datetime.utcnow()
    wallet.save()
    Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(user_id),
        amount=amount,
        payment_method="Deposit",
        status="SUCCESS",
        
        
    ).save()
    user.update(inc__balance=amount)
    return {"message": f"Added {amount} to user {user.username} successfully"}

@router.get("/user/witdrawal-money")
def deduct_money(amount: float, user_id: str, user=Depends(require_admin)):
    if not user:
        raise HTTPException(404, "User not found")

    if amount <= 0:
        raise HTTPException(400, "Invalid amount")

   
    wallet = Wallet.objects(user_id=str(user_id)).first()
    print(wallet.to_json())
    if wallet.balance < amount:
        raise HTTPException(400, "User balance insufficient")

    wallet.balance -= amount
    wallet.updated_at = datetime.utcnow()
    wallet.save()

    Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(wallet.user_id),
        amount=-amount,
        payment_method="Withdrawal",
        status="SUCCESS"
    ).save()


    

    return {"message": f"Deducted {amount} from user {user.username} successfully"}



@router.post("/user/update-password")
def update_password(
    user_id: str = Form(...),
    user=Depends(require_admin),
    new_password: str = Form(...),
    
):
    user = User.objects(id=user_id).first()
    new_hash = new_password
    user.update(password_hash=new_hash)

    return {"message": "Password updated successfully"}



@router.get("/user/user-details/{user_id}")
def user_details(user_id: str, use2r=Depends(require_admin)):
    user = User.objects(id=user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    total = Transaction.objects(user_id=str(user_id), status="SUCCESS",payment_method="Deposit").sum("amount") or 0.0
    total2 = Withdrawal.objects(user_id=str(user_id), status="SUCCESS").sum("amount") or 0.0
    bids = Bid.objects(user_id=str(user.id)).order_by("-created_at").limit(100)
    totalWitdh = Transaction.objects(user_id=str(user_id), status="SUCCESS",payment_method="Withdrawal")
    totalDeposit = Transaction.objects(user_id=str(user_id), status="SUCCESS",payment_method="Deposit")
    query = {
        "user_id": str(user.id),
        "payment_method": "WIN",
        "status": "SUCCESS"
    }
    wins = Transaction.objects(**query).order_by("-created_at")
    return {
        "data": {
            "@wallet": Wallet.objects(user_id=user_id).first().balance,
            "@user":json.loads(user.to_json()),
            "@total_deposit": total,
            "@total_withdrawal": total2,
            "@user_bids": json.loads(bids.to_json()),
            "@wins": json.loads(wins.to_json()),
            "@total_withdrawal_tx": json.loads(totalWitdh.to_json()),
            "@total_deposit_tx": json.loads(totalDeposit.to_json())
        }
    }


# Today Registered Users
@router.get("/users/today-created")
def today_created_users(admin_user = Depends(require_admin)):
    today = datetime.utcnow().date()

    users = User.objects(
        created_at__gte=datetime.combine(today, datetime.min.time()),
        created_at__lte=datetime.combine(today, datetime.max.time())
    )

    return {
        "message": "Today's created users fetched successfully",
        "count": len(users),
        "users": json.loads(users.to_json())
    }

@router.get("/user/win-history")
def win_history(
    from_date: str,
    to_date: str,
    user=Depends(get_current_user)
):

    # Date conversion
    try:
        start = datetime.datetime.strptime(from_date, "%Y-%m-%d").date()
        end = datetime.datetime.strptime(to_date, "%Y-%m-%d").date()
    except:
        raise HTTPException(400, "Date must be in YYYY-MM-DD format")

    # Load rate chart
    chart = RateChart.objects().first()
    if not chart:
        raise HTTPException(500, "Rate chart not found")

    RATE_MAP = {
        "single": chart.single_digit_2,
        "jodi": chart.jodi_digit_2,
        "single_panna": chart.single_pana_2,
        "double_panna": chart.double_pana_2,
        "triple_panna": chart.tripple_pana_2,
        "half_sangam": chart.half_sangam_2,
        "full_sangam": chart.full_sangam_2,
    }

    # Fetch only bids in date range
    bids = Bid.objects(
        user_id=str(user.id),
        date__gte=from_date,
        date__lte=to_date
    )

    win_data = []

    for bid in bids:

        # Find market
        market = Market.objects(id=bid.market_id).first()
        if not market:
            continue

        # Find result for that bid date
        result = Result.objects(
            market_id=bid.market_id,
            date=bid.date
        ).first()
        if not result:
            continue

        win = False

        # WIN LOGIC
        if bid.game_type == "single" and bid.digit == result.open_digit:
            win = True

        if bid.game_type == "jodi" and bid.ddigit == result.open_digit + result.close_digit:
            win = True

        if bid.game_type == "single_panna" and bid.digit == result.open_panna:
            win = True

        if bid.game_type == "double_panna" and bid.digit == result.close_panna:
            win = True

        if bid.game_type == "triple_panna":
            if bid.session == "open" and bid.digit == result.open_panna:
                win = True
            if bid.session == "close" and bid.digit == result.close_panna:
                win = True

        if bid.game_type == "half_sangam":
            panna, digitx = bid.digit.split("-")
            if panna == result.open_panna and digitx == result.close_digit:
                win = True
            if panna == result.close_panna and digitx == result.open_digit:
                win = True

        if bid.game_type == "full_sangam":
            op, cp = bid.digit.split("-")
            if op == result.open_panna and cp == result.close_panna:
                win = True

        # skip if not win
        if not win:
            continue

        # Calculate win amount
        rate = RATE_MAP.get(bid.game_type, 0)
        win_amount = bid.points * rate

        # Transaction match (optional)
        tx = Transaction.objects(
            user_id=str(user.id),
            amount=win_amount
        ).order_by("-id").first()

        win_data.append({
            "game_name": market.name,
            "game_type": bid.game_type,
            "digit_or_panna": bid.digit,
            "points": bid.points,
            "win_amount": win_amount,
            "date": bid.date,
            "session": bid.session,
            "declared_result": {
                "open_digit": result.open_digit,
                "open_panna": result.open_panna,
                "close_digit": result.close_digit,
                "close_panna": result.close_panna
            },
            "declared_time": {
                "open_declared_at": getattr(result, "open_declared_at", None),
                "close_declared_at": getattr(result, "close_declared_at", None),
            },
            "tx_id": tx.tx_id if tx else None
        })

    return {"wins": win_data}

@router.get("/{user_id}/update-password")
def user_by_id(user_id: str, password: str):
    # Validate ObjectId
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user ID")

    user = User.objects(id=user_id).first()
    user.update(password_hash=password)


    return {
        "user_id": str(user.id),
        "username": user.username,
        "mobile": user.mobile,
        "role": user.role,
        "password": user.password_hash,
        "created_at": user.created_at
    }
