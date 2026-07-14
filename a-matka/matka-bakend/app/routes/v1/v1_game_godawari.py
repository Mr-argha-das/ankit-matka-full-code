import json
from app.new_models import MarketGod, RateChartGod, BidGod, ResultGod

from app.routes.v1.v1_bids_routes import compute_status
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, time, timedelta
import uuid
from mongoengine.errors import NotUniqueError
from ...auth import get_current_user, require_admin
from ...models import  Transaction, User, Wallet
from pydantic import BaseModel
from typing import Optional


router = APIRouter(prefix="/api/admin/Golidesawar", tags=["Golidesawar Game Management"])


# -----------------------------
# INPUT MODELS
# -----------------------------

class ResultDeclare(BaseModel):
    game_id: str
    date: str
    session: str      # open / close
    digit: str = None # 1 digit (open/close) or 2 digit (jodi)


class MarketInput(BaseModel):
    name: str
    hindi: str
    open_time: str
    close_time: str
    is_active: bool = True
    status: bool = True
    marketType: str


class RateChartGodInput(BaseModel):
    left_digit_1: Optional[int]
    left_digit_x: Optional[int]
    left_digit_2: Optional[int]

    right_digit_1: Optional[int]
    right_digit_x: Optional[int]
    right_digit_2: Optional[int]

    jodi_digit_1: Optional[int]
    jodi_digit_x: Optional[int]
    jodi_digit_2: Optional[int]
    
class UserBidModel(BaseModel):
    market_id: str
    game_type: str         
    digit: str
    points: int

# -----------------------------
# RATE CHART ROUTES
# -----------------------------

@router.get("/rate")
def get_rate_chart():
    chart = RateChartGod.objects().first()
    if not chart:
        return {"message": "No rate chart found"}

    data = chart.to_mongo().to_dict()
    data["_id"] = str(data["_id"])

    return data


@router.post("/rate/")
def create_or_update_rate_chart(data: RateChartGodInput):
    chart = RateChartGod.objects().first()
    if not chart:
        chart = RateChartGod()

    data_dict = data.dict(exclude_unset=True)
    for key, value in data_dict.items():
        setattr(chart, key, value)

    chart.save()

    return {
        "message": "Rate chart updated successfully",
        "data": json.loads(chart.to_json())
    }


# -----------------------------
# MARKET CRUD
# -----------------------------

@router.post("/market/")
def create_market(data: MarketInput, admin=Depends(require_admin)):
    try:
        market = MarketGod(**data.dict())
        market.save()
        return {"message": "Market created successfully", "id": str(market.id)}
    except NotUniqueError:
        raise HTTPException(status_code=400, detail="Market already exists")
    
@router.get("/user/markets/")
def get_user_markets(user=Depends(get_current_user)):
    markets = MarketGod.objects(is_active=True, marketType="Market")
    final_markets = []
    
    # TODAY DATE RANGE (12:00 AM – 11:59 PM)
    today = datetime.utcnow().date()
    print(today)
    start = datetime.combine(today, time.min)
    end = datetime.combine(today, time.max)

    for m in markets:
        data = json.loads(m.to_json())

        # AUTO CALCULATE STATUS
        auto_status = compute_status(m.open_time, m.close_time)
        data["status"] = auto_status

        # ---- GET TODAY'S RESULT FOR THIS MARKET ----
        todays_result = ResultGod.objects(
            market_id=str(m.id),
            date__gte=start,
            date__lte=end
        ).first()

        data["today_result"] = (
            json.loads(todays_result.to_json()) if todays_result else None
        )

        final_markets.append(data)

    return {
        "message": "Markets fetched successfully",
        "data": final_markets
    }


@router.get("/user/starline")
def get_user_markets(user=Depends(get_current_user)):
    markets = MarketGod.objects(is_active=True, marketType="Starline")
    final_markets = []
    
    # TODAY DATE RANGE (12:00 AM – 11:59 PM)
    today = datetime.utcnow().date()
    start = datetime.combine(today, time.min)
    end = datetime.combine(today, time.max)

    for m in markets:
        data = json.loads(m.to_json())

        # AUTO CALCULATE STATUS
        auto_status = compute_status(m.open_time, m.close_time)
        data["status"] = auto_status

        # ---- GET TODAY'S RESULT FOR THIS MARKET ----
        todays_result = ResultGod.objects(
            market_id=str(m.id),
            date__gte=start,
            date__lte=end
        ).first()

        data["today_result"] = (
            json.loads(todays_result.to_json()) if todays_result else None
        )

        final_markets.append(data)

    return {
        "message": "Markets fetched successfully",
        "data": final_markets
    }





@router.get("/market")
def get_markets():
    markets = MarketGod.objects()
    final_markets = []

    today = datetime.utcnow().date()
    print(today)
    start = datetime.combine(today, time.min)
    end = datetime.combine(today, time.max)

    for m in markets:
        data = json.loads(m.to_json())

        # AUTO CALCULATE STATUS
        auto_status = compute_status(m.open_time, m.close_time)
        data["status"] = auto_status

        # ---- GET TODAY'S RESULT FOR THIS MARKET ----
        todays_result = ResultGod.objects(
            market_id=str(m.id),
            date__gte=start,
            date__lte=end
        ).first()

        data["today_result"] = (
            json.loads(todays_result.to_json()) if todays_result else None
        )

        final_markets.append(data)

    return {"message": "Markets fetched successfully", "data": final_markets}


@router.get("/market/{market_id}")
def get_market(market_id: str, ):
    market = MarketGod.objects(id=market_id).first()
    if not market:
        raise HTTPException(404, "Market not found")

    data = json.loads(market.to_json())
    data["status"] = compute_status(market.open_time, market.close_time)

    today = datetime.utcnow().date()
    start = datetime.combine(today, time.min)
    end = datetime.combine(today, time.max)

    todays_result = ResultGod.objects(
        market_id=str(market.id),
        date__gte=start,
        date__lte=end
    ).first()

    data["today_result"] = (
        json.loads(todays_result.to_json()) if todays_result else None
    )

    return {"message": "Market fetched successfully", "data": data}


@router.put("/market/{market_id}")
def update_market(market_id: str, data: MarketInput, ):
    market = MarketGod.objects(id=market_id).first()
    if not market:
        raise HTTPException(404, "Market not found")

    for k, v in data.dict().items():
        setattr(market, k, v)

    try:
        market.save()
    except NotUniqueError:
        raise HTTPException(400, "Market name already exists")
    if market.is_active is False:
        today = datetime.utcnow().date()

        # Convert today's date + open/close time
        open_dt = datetime.strptime(f"{today} {market.open_time}", "%Y-%m-%d %H:%M")
        close_dt = datetime.strptime(f"{today} {market.close_time}", "%Y-%m-%d %H:%M")

        # 3. Find bids between open-close time
        bids = BidGod.objects(
            market_id=str(market.id),
            created_at__gte=open_dt,
            created_at__lte=close_dt
        )

        refund_count = 0

        for bid in bids:
            user_wallet = Wallet.objects(user_id=bid.user_id).first()
            if not user_wallet:
                continue

            # Refund user wallet
            user_wallet.balance += bid.points
            user_wallet.updated_at = datetime.utcnow()
            user_wallet.save()

            # Create transaction record
            Transaction(
                tx_id=str(uuid.uuid4()),
                user_id=bid.user_id,
                amount=bid.points,
                payment_method=f"Market Refund ({market.name})",
                status="SUCCESS"
            ).save()

            refund_count += 1

    return {"message": "Market updated successfully"}


@router.patch("/market/{market_id}/status")
def update_market_status(market_id: str, status: bool, admin=Depends(require_admin)):
    market = MarketGod.objects(id=market_id).first()
    if not market:
        raise HTTPException(404, "Market not found")

    market.status = status
    market.save()

    return {"message": "Market status updated", "status": status}


@router.delete("/market/{market_id}")
def delete_market(market_id: str, admin=Depends(require_admin)):
    market = MarketGod.objects(id=market_id).first()
    if not market:
        raise HTTPException(404, "Market not found")

    market.delete()
    return {"message": "Market deleted successfully"}


# -----------------------------
# RESULT DECLARE (FINAL FIXED)
# -----------------------------

@router.post("/result/declare")
def declare_result(payload: ResultDeclare, admin=Depends(require_admin)):

    session = payload.session.lower()

    if not payload.digit:
        raise HTTPException(400, "Digit is required")

    digit = payload.digit.strip()

    if len(digit) not in [1, 2]:
        raise HTTPException(400, "Digit must be 1 or 2 digits")

    result = ResultGod.objects(
        market_id=payload.game_id,
        date=payload.date
    ).first()

    if not result:
        result = ResultGod(
            market_id=payload.game_id,
            date=payload.date,
            open_digit="-",
            close_digit="-"
        )

    if session == "open":
        result.open_digit = digit[0]

    elif session == "close":
        result.close_digit = digit[-1]

        # agar 2 digit diya ho aur open pehle se empty ho
        if result.open_digit == "-" and len(digit) == 2:
            result.open_digit = digit[0]

    else:
        raise HTTPException(400, "Invalid session")

    result.save()

    # 🔥 settlement after save
    settle_results(payload.game_id, result)

    return {"message": "Result declared & settled successfully"}
# -----------------------------
# SETTLEMENT LOGIC
# -----------------------------
import uuid

def settle_results(market_id: str, result_obj):

    chart = RateChartGod.objects().first()
    if not chart:
        return

    open_digit = result_obj.open_digit
    close_digit = result_obj.close_digit

    bids = BidGod.objects(market_id=market_id)

    for bid in bids:

        # 🔒 Skip if already paid
        already_paid = Transaction.objects(
            bid_id=str(bid.id),
            payment_method="Win"
        ).first()

        if already_paid:
            continue

        win = False

        # ---------------- OPEN ----------------
        if bid.game_type == "open":
            if open_digit != "-" and bid.digit == open_digit:
                win = True

        # ---------------- CLOSE ----------------
        elif bid.game_type == "close":
            if close_digit != "-" and bid.digit == close_digit:
                win = True

        # ---------------- JODI ----------------
        elif bid.game_type == "jodi":
            if open_digit != "-" and close_digit != "-":
                if bid.digit == open_digit + close_digit:
                    win = True

        if not win:
            continue

        # ---------------- PAYOUT ----------------
        if bid.game_type == "jodi":
            rate = chart.jodi_digit_2
        else:
            rate = chart.single_digit_2

        amount = bid.points * rate

        wallet = Wallet.objects(user_id=str(bid.user_id)).first()
        if wallet:
            wallet.update(inc__balance=amount)

            Transaction(
                tx_id=str(uuid.uuid4()),
                user_id=str(bid.user_id),
                bid_id=str(bid.id),
                amount=amount,
                payment_method="Win",
                status="Approved"
            ).save()
# RESULT LIST
# -----------------------------

@router.get("/results")
def get_results(date: str, admin=Depends(require_admin)):
    results = ResultGod.objects(date=date)
    output = []

    for r in results:
        market = MarketGod.objects(id=r.market_id).first()

        output.append({
            "_id": str(r.id),
            "market_id": r.market_id,
            "game_name": market.name if market else "-",
            "date": r.date,
            "open_digit": r.open_digit,
            "close_digit": r.close_digit,
            "open_time": market.open_time if market else "-",
            "close_time": market.close_time if market else "-"
        })

    return {"data": output}


# -----------------------------
# FIND RESULT (FOR GO BUTTON)
# -----------------------------

@router.get("/result/find")
def find_result(date: str, game_id: str, session: str, admin=Depends(require_admin)):
    r = ResultGod.objects(market_id=game_id, date=date).first()

    if not r:
        return {"data": None}

    if session == "open":
        return {"data": {"open_digit": r.open_digit}}

    if session == "close":
        return {"data": {"close_digit": r.close_digit}}

    raise HTTPException(400, "Invalid session")


# -----------------------------
# DELETE RESULT
# -----------------------------

@router.delete("/result/{result_id}")
def delete_result(result_id: str, admin=Depends(require_admin)):
    r = ResultGod.objects(id=result_id).first()
    if not r:
        raise HTTPException(404, "Result not found")

    r.delete()
    return {"message": "Result deleted"}


# -----------------------------
# WINNING REPORT
# -----------------------------

# @router.get("/winning-report", dependencies=[Depends(require_admin)])
# def winning_report(
#     date: str = Query(...),
#     market_id: str = None
# ):
#     target_date = datetime.strptime(date, "%Y-%m-%d")

#     query = {"date__gte": target_date, "date__lte": target_date}
#     if market_id:
#         query["market_id"] = market_id

#     results = ResultGod.objects(**query)

#     if not results:
#         return {"message": "No results found"}

#     chart = RateChartGod.objects().first()
#     if not chart:
#         raise HTTPException(400, "Rate chart missing")

#     reports = []

#     for res in results:
#         bids = BidGod.objects(market_id=res.market_id)

#         for bid in bids:
#             win = False

#             if bid.game_type == "single":
#                 if bid.session == "open" and bid.open_digit == res.open_digit:
#                     win = True
#                 if bid.session == "close" and bid.close_digit == res.close_digit:
#                     win = True

#             if bid.game_type == "jodi":
#                 if bid.open_digit + bid.close_digit == res.open_digit + res.close_digit:
#                     win = True

#             if win:
#                 amount = (chart.jodi_digit_2 if bid.game_type == "jodi" else chart.single_digit_2) * bid.points

#                 reports.append({
#                     "user_id": bid.user_id,
#                     "market_id": bid.market_id,
#                     "game_type": bid.game_type,
#                     "session": bid.session,
#                     "open_digit": bid.open_digit,
#                     "close_digit": bid.close_digit,
#                     "points": bid.points,
#                     "win_amount": amount
#                 })

#     return {"count": len(reports), "data": reports}
@router.get("/winning-report", dependencies=[Depends(require_admin)])
def winning_report(
    date: str = Query(...),
    market_id: str = None
):
    target_date = datetime.strptime(date, "%Y-%m-%d")
    query = {"date__gte": target_date, "date__lte": target_date}
    if market_id:
        query["market_id"] = market_id

    results = ResultGod.objects(**query)

    if not results:
        return {"message": "No results found", "data": []}

    chart = RateChartGod.objects().first()
    if not chart:
        raise HTTPException(400, "Rate chart missing")

    reports = []

    for res in results:
        bids = BidGod.objects(market_id=res.market_id)
        market = MarketGod.objects(id=res.market_id).first()
        market_name = market.name if market else "Unknown Market"

        for bid in bids:
            user = User.objects(id=bid.user_id).first()
            username = user.username if user else "Unknown User"
            mobile = user.mobile if user else "N/A"

            win = False
            if bid.game_type == "single":
                if bid.session == "open" and bid.open_digit == res.open_digit:
                    win = True
                if bid.session == "close" and bid.close_digit == res.close_digit:
                    win = True

            if bid.game_type == "jodi":
                if bid.open_digit + bid.close_digit == res.open_digit + res.close_digit:
                    win = True

            if win:
                amount = (chart.jodi_digit_2 if bid.game_type == "jodi" else chart.single_digit_2) * bid.points

                reports.append({
                    "user_id": bid.user_id,
                    "user": username,
                    "mobile": mobile,
                    "market_id": bid.market_id,
                    "market_name": market_name,
                    "game_type": bid.game_type,
                    "session": bid.session,
                    "open_digit": bid.open_digit,
                    "close_digit": bid.close_digit,
                    "open_panna": getattr(bid, "open_panna", None),
                    "close_panna": getattr(bid, "close_panna", None),
                    "points": bid.points,
                    "win_amount": amount,
                    "date": target_date.strftime("%Y-%m-%d"),
                })

    return {"count": len(reports), "data": reports}


@router.get("/win-history")
def get_win_history(user=Depends(get_current_user)):

    win_transactions = Transaction.objects(
        user_id=str(user.id),
        payment_method="Win"
    ).order_by("-created_at")

    win_list = []

    for tx in win_transactions:

        bid = BidGod.objects(id=tx.bid_id).first()
        if not bid:
            continue

        market = MarketGod.objects(id=bid.market_id).first()

        win_list.append({
            "market_id": bid.market_id,
            "market_name": market.name if market else "-",
            "date": bid.created_at,
            "game_type": bid.game_type,
            "session": bid.session,
            "open_digit": bid.open_digit,
            "close_digit": bid.close_digit,
            "points": bid.points,
            "win_amount": tx.amount,
            "tx_id": tx.tx_id
        })

    return {
        "message": "Winning history fetched",
        "count": len(win_list),
        "data": win_list
    }

class UserBidRequest(BaseModel):
    market_id: str
    game_type: str      # "open", "close", "jodi"
    digit: str
    points: int

def parse_time(value: str):
    """Convert string like '10:00 AM' to time object"""
    return datetime.strptime(value, "%I:%M %p").time()


# @router.post("/bid")
# def place_user_bid(payload: UserBidRequest, user=Depends(get_current_user)):

#     # Validate points
#     if payload.points <= 0:
#         raise HTTPException(400, "Points must be greater than 0")

#     digit = payload.digit.strip()

#     # -------------------------------
#     # Time-based session validation
#     # -------------------------------
#     market = MarketGod.objects(id=payload.market_id).first()
#     if not market:
#         raise HTTPException(404, "Invalid Market ID")

#     now = datetime.now().time()

#     # FIX: convert string → time
#     open_time = parse_time(market.open_time)
#     close_time = parse_time(market.close_time)

#     # Decide allowed session based on time
#     if now < open_time:
#         allowed_session = "open"

#     elif open_time <= now <= close_time:
#         allowed_session = "close"

#     else:
#         raise HTTPException(400, "Market closed, you cannot place a bid now")

#     # -------------------------------
#     # DIGIT validation
#     # -------------------------------
#     if payload.game_type == "open":
#         if len(digit) != 1:
#             raise HTTPException(400, "Open digit must be 1 digit")
#         session = "open"

#     elif payload.game_type == "close":
#         if len(digit) != 1:
#             raise HTTPException(400, "Close digit must be 1 digit")
#         session = "close"

#     elif payload.game_type == "jodi":
#         if len(digit) != 2:
#             raise HTTPException(400, "Jodi must be 2 digits")
#         session = "close"   # jodi always close

#     else:
#         raise HTTPException(400, "Invalid game type")

#     # -------------------------------
#     # ENFORCE TIME SESSION RULE
#     # -------------------------------
#     if session != allowed_session:
#         raise HTTPException(
#             400,
#             f"You can place only {allowed_session.upper()} session bid at this time"
#         )

#     # -------------------------------
#     # Wallet check
#     # -------------------------------
#     wallet = Wallet.objects(user_id=str(user.id)).first()
#     if not wallet:
#         raise HTTPException(404, "Wallet not found")

#     if wallet.balance < payload.points:
#         raise HTTPException(400, "Insufficient wallet balance")

#     wallet.update(dec__balance=payload.points)

#     # -------------------------------
#     # Prepare digits
#     # -------------------------------
#     if payload.game_type == "open":
#         open_digit = digit
#         close_digit = "-"

#     elif payload.game_type == "close":
#         open_digit = "-"
#         close_digit = digit

#     else:  # jodi
#         open_digit = digit[0]
#         close_digit = digit[1]

#     # -------------------------------
#     # Save bid
#     # -------------------------------
#     bid = BidGod(
#         user_id=str(user.id),
#         market_id=payload.market_id,
#         game_type="jodi" if payload.game_type == "jodi" else "single",
#         session=session,
#         open_digit=open_digit,
#         close_digit=close_digit,
#         points=payload.points
#     ).save()

#     return {
#         "message": "Bid placed successfully",
#         "data": {
#             "session": session,
#             "open_digit": open_digit,
#             "close_digit": close_digit,
#             "points": payload.points
#         }
#     }


@router.post("/bid",)
def place_user_bid(payload: UserBidRequest, user=Depends(get_current_user)):

    # Validate points
    if payload.points <= 0:
        raise HTTPException(400, "Points must be greater than 0")

    digit = payload.digit.strip()

    # Game validations
    if payload.game_type == "open":
        if len(digit) != 1:
            raise HTTPException(400, "Open digit must be 1 digit")

    elif payload.game_type == "close":
        if len(digit) != 1:
            raise HTTPException(400, "Close digit must be 1 digit")

    elif payload.game_type == "jodi":
        if len(digit) != 2:
            raise HTTPException(400, "Jodi must be 2 digits")

    else:
        raise HTTPException(400, "Invalid game type")

    # Check wallet
    wallet = Wallet.objects(user_id=str(user.id)).first()
    if not wallet:
        raise HTTPException(404, "Wallet not found")

    if wallet.balance < payload.points:
        raise HTTPException(400, "Insufficient wallet balance")

    # ❌ REMOVE same-day restriction
    # User can place unlimited bids in same market

    # Deduct wallet balance
    wallet.update(dec__balance=payload.points)

    # Prepare bid fields
    if payload.game_type == "open":
        session = "open"
        open_digit = digit
        close_digit = "-"

    elif payload.game_type == "close":
        session = "close"
        open_digit = "-"
        close_digit = digit

    else:  # jodi
        session = "close"
        open_digit = digit[0]
        close_digit = digit[1]

    # Save the bid
    bid = BidGod(
        user_id=str(user.id),
        market_id=payload.market_id,
        game_type="jodi" if payload.game_type == "jodi" else "single",
        session=session,
        open_digit=open_digit,
        close_digit=close_digit,
        points=payload.points
    )
    bid.save()

    return {
        "message": "Bid placed successfully",
        "data": {
            "open_digit": open_digit,
            "close_digit": close_digit,
            "session": session,
            "points": payload.points
        }
    }

@router.get("/admin/bids/all", tags=["Golidesawar Admin"])
def get_all_bids_admin(
    user=Depends(get_current_user),
    date: str = Query(None),         # Format: YYYY-MM-DD
    session: str = Query(None),      # Open / Close
    market_name: str = Query(None)   # Market name filter
):
    query = BidGod.objects()

    # --------------------------------------
    # FILTER: DATE
    # --------------------------------------
    if date:
        try:
            start = datetime.strptime(date, "%Y-%m-%d")
            end = datetime.strptime(date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.filter(created_at__gte=start, created_at__lte=end)
        except:
            return {"message": "Invalid date format. Use YYYY-MM-DD"}

    # --------------------------------------
    # FILTER: SESSION
    # --------------------------------------
    if session:
        query = query.filter(session=session)

    # --------------------------------------
    # FILTER: MARKET NAME
    # --------------------------------------
    if market_name:
        markets = MarketGod.objects(name__icontains=market_name)
        market_ids = [str(m.id) for m in markets]
        query = query.filter(market_id__in=market_ids)

    # Fetch bids after filters
    bids = query.order_by("-created_at")

    result = []
    for b in bids:
        # Get Market
        market = MarketGod.objects(id=b.market_id).first()
        market_name = market.name if market else "Unknown Market"

        # Get User
        u = User.objects(id=b.user_id).first()
        username = u.username if u else "Unknown User"
        mobile = u.mobile if u else "N/A"

        result.append({
            "id": str(b.id),
            "market_id": b.market_id,
            "market_name": market_name,

            "user_id": b.user_id,
            "username": username,
            "mobile": mobile,

            "game_type": b.game_type,
            "session": b.session,
            "open_digit": b.open_digit,
            "close_digit": b.close_digit,
            "points": b.points,

            "created_at": b.created_at,
        })

    return {"message": "All bids fetched", "data": result}




@router.get("/bids", tags=["Golidesawar User"])
def get_user_bids(
    market_id: str,
    date: str = Query(...),
    user=Depends(get_current_user)
):
    """
    Return today's bids for logged-in user (1 bid per day rule)
    """

    # Convert date to full datetime range
    try:
        start = datetime.strptime(date + " 00:00:00", "%Y-%m-%d %H:%M:%S")
        end = datetime.strptime(date + " 23:59:59", "%Y-%m-%d %H:%M:%S")
    except:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")

    bids = BidGod.objects(
        user_id=str(user.id),
        market_id=market_id,
        created_at__gte=start,
        created_at__lte=end
    )

    result = []
    for b in bids:
        result.append({
            "id": str(b.id),
            "market_id": b.market_id,
            "game_type": b.game_type,
            "session": b.session,
            "open_digit": b.open_digit,
            "close_digit": b.close_digit,
            "points": b.points,
            "created_at": b.created_at,
        })

    return {"message": "User bids fetched", "data": result}


@router.get("/bids/all", tags=["Golidesawar User"])
def get_all_user_bids(user=Depends(get_current_user)):
    """
    Return ALL bids made by this user across ALL markets.
    Sorted by latest first.
    """
    bids = BidGod.objects(user_id=str(user.id)).order_by("-created_at")

    output = []
    for b in bids:
        output.append({
            "id": str(b.id),
            "market_id": b.market_id,
            "game_type": b.game_type,
            "session": b.session,
            "open_digit": b.open_digit,
            "close_digit": b.close_digit,
            "points": b.points,
            "created_at": b.created_at,
        })

    return {
        "message": "All user bids fetched",
        "count": len(output),
        "data": output
    }
