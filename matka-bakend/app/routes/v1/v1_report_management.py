from app.auth import require_admin
from app.models import Bid, DepositQR, Market, RateChart, Result, User, Withdrawal
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form,Query
from fastapi.responses import FileResponse
from datetime import datetime
import os
import uuid
from datetime import datetime, timedelta


router = APIRouter(prefix="/admin", tags=["Report Management"])

@router.get("/withdrawal/report", dependencies=[Depends(require_admin)])
def withdrawal_report():
    withdrawals = Withdrawal.objects().order_by("-created_at")

    report = []

    for w in withdrawals:
        user = User.objects(id=w.user_id).first()

        report.append({
            "wd_id": w.wd_id,
            "user_id": w.user_id,
            "username": user.username if user else None,
            "mobile": user.mobile if user else None,
            "amount": w.amount,
            "method": w.method,
            "number": w.number,
            "status": w.status,
            "created_at": w.created_at,
            "confirmed_at": w.confirmed_at
        })

    return {
        "message": "Withdrawal report fetched successfully",
        "count": len(report),
        "data": report
    }

@router.get("/bids/history", dependencies=[Depends(require_admin)])
def get_bid_history(
    date: str = Query(None),
    market_id: str = Query(None),
    game_type: str = Query(None),
    session: str = Query(None),     # open / close / All
    search: str = Query(None),      # username / mobile
    admin = Depends(require_admin)
):
    filters = {}

    # --- DATE FILTER ---
    if date:
        try:
            start = datetime.strptime(date, "%d/%m/%Y")
            end = start + timedelta(days=1)
            filters["created_at__gte"] = start
            filters["created_at__lt"] = end
        except:
            raise HTTPException(400, "Invalid date format. Use DD/MM/YYYY")

    # --- MARKET FILTER ---
    if market_id and market_id != "all":
        filters["market_id"] = market_id

    # --- GAME TYPE FILTER ---
    if game_type and game_type != "all":
        filters["game_type"] = game_type

    # --- SESSION FILTER ---
    if session and session.lower() != "all":
        filters["session"] = session.lower()

    # --- BASE QUERY ---
    bids = Bid.objects(**filters).order_by("-created_at")

    # --- SEARCH (username/mobile) ---
    if search:
        user_ids = [
            str(u.id)
            for u in User.objects(
                __raw__={
                    "$or": [
                        {"username": {"$regex": search, "$options": "i"}},
                        {"mobile": {"$regex": search, "$options": "i"}},
                    ]
                }
            )
        ]
        bids = bids.filter(user_id__in=user_ids)

    # --- FORMAT OUTPUT ---
    results = []
    for b in bids:
        user = User.objects(id=b.user_id).first()
        market = Market.objects(id=b.market_id).first()

        results.append({
            "bid_id": str(b.id),
            "name": user.username if user else "",
            "mobile": user.mobile if user else "",
            "bid_date": b.created_at.strftime("%d %b %Y"),
            "bid_time": b.created_at.strftime("%H:%M:%S"),
            "market_name": market.name if market else "",
            "game_type": b.game_type,
            "session": b.session,
            "digit": b.digit,
            "points": b.points,
        })

    return {"data": results}

@router.post("/bids/edit", dependencies=[Depends(require_admin)])
def edit_bid(
    bid_id: str,
    points: int = None,
    digit: str = None,
    session: str = None,
    game_type: str = None
):
    bid = Bid.objects(id=bid_id).first()
    if not bid:
        raise HTTPException(404, "Bid not found")

    if points is not None:
        bid.points = points

    if digit is not None:
        bid.digit = digit

    if session is not None:
        bid.session = session.lower()

    if game_type is not None:
        bid.game_type = game_type

    bid.save()

    return {"message": "Bid updated successfully"}

@router.delete("/bids/delete/{bid_id}", dependencies=[Depends(require_admin)])
def delete_bid(bid_id: str):
    bid = Bid.objects(id=bid_id).first()
    if not bid:
        raise HTTPException(404, "Bid not found")

    bid.delete()

    return {"message": "Bid deleted successfully"}

@router.get("/win/history")
def winning_report(
    date: str = Query(..., description="DD/MM/YYYY"),
    market_id: str = Query("all"),
    game_type: str = Query("all"),
    session: str = Query("all"),
    search: str = Query(None),
    admin=Depends(require_admin)
):
    # ---- DATE FILTER ----
    try:
        start = datetime.strptime(date, "%d/%m/%Y")
        end = start + timedelta(days=1)
    except:
        raise HTTPException(400, "Invalid date format. Use DD/MM/YYYY")

    filters = {
        "created_at__gte": start,
        "created_at__lt": end
    }

    # ---- MARKET FILTER ----
    if market_id != "all":
        filters["market_id"] = market_id

    # ---- GAME TYPE FILTER ----
    if game_type != "all":
        filters["game_type"] = game_type

    # ---- SESSION FILTER ----
    if session != "all":
        filters["session"] = session.lower()

    # ---- BASE BIDS ----
    bids = Bid.objects(**filters)

    # ---- SEARCH BY USER ----
    if search:
        user_ids = [
            str(u.id)
            for u in User.objects(
                __raw__={
                    "$or": [
                        {"username": {"$regex": search, "$options": "i"}},
                        {"mobile": {"$regex": search, "$options": "i"}},
                    ]
                }
            )
        ]
        bids = bids.filter(user_id__in=user_ids)

    # ---- LOAD RATE CHART ----
    chart = RateChart.objects().first()

    RATE_MAP = {
        "single": chart.single_digit_2,
        "jodi": chart.jodi_digit_2,
        "single_panna": chart.single_pana_2,
        "double_panna": chart.double_pana_2,
        "triple_panna": chart.tripple_pana_2,
        "half_sangam": chart.half_sangam_2,
        "full_sangam": chart.full_sangam_2,
    }

    results = []

    for b in bids:
        # --- Get Market Result ---
        result = Result.objects(
            market_id=b.market_id,
            date=start
        ).first()

        if not result:
            continue

        win = False

        # SINGLE DIGIT (open session)
        if b.game_type == "single" and b.digit == result.open_digit:
            win = True

        # JODI
        if b.game_type == "jodi" and b.digit == (result.open_digit + result.close_digit):
            win = True

        # SINGLE PANNA
        if b.game_type == "single_panna" and b.digit == result.open_panna:
            win = True

        # DOUBLE PANNA
        if b.game_type == "double_panna" and b.digit == result.close_panna:
            win = True

        # TRIPLE PANNA
        if b.game_type == "triple_panna":
            if b.session == "open" and b.digit == result.open_panna:
                win = True
            if b.session == "close" and b.digit == result.close_panna:
                win = True

        # HALF SANGAM
        if b.game_type == "half_sangam":
            panna, digit = b.digit.split("-")
            if panna == result.open_panna and digit == result.close_digit:
                win = True

        # FULL SANGAM
        if b.game_type == "full_sangam":
            op, cp = b.digit.split("-")
            if op == result.open_panna and cp == result.close_panna:
                win = True

        if not win:
            continue

        # ---- Calculate Win Amount ----
        rate = RATE_MAP.get(b.game_type, 0)
        win_amount = b.points * rate

        # ---- USER ----
        user = User.objects(id=b.user_id).first()
        market = Market.objects(id=b.market_id).first()

        results.append({
            "bid_id": str(b.id),
            "name": user.username if user else "",
            "mobile": user.mobile if user else "",
            "market": market.name if market else "",
            "game_type": b.game_type,
            "session": b.session,
            "digit": b.digit,
            "points": b.points,
            "win_amount": win_amount,
            "bid_time": b.created_at.strftime("%H:%M:%S"),
            "status": "Won"
        })

    return {"data": results}


@router.get("/admin/deposit", dependencies=[Depends(require_admin)])
def admin_deposit_report(
    status: str = Query("ALL"),
    user_id: str = None,
    search: str = None,
    from_date: str = None,
    to_date: str = None
):

    q = {}

    # Filter by status
    if status != "ALL":
        q["status"] = status

    # Filter by user_id
    if user_id:
        q["user_id"] = user_id

    # Date Range Filter
    if from_date and to_date:
        try:
            start = datetime.strptime(from_date, "%Y-%m-%d")
            end = datetime.strptime(to_date, "%Y-%m-%d")
            q["created_at__gte"] = start
            q["created_at__lte"] = end
        except:
            raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")

    deposits = DepositQR.objects(**q).order_by("-created_at")

    # Search by username / mobile
    if search:
        users = User.objects(
            __raw__={
                "$or": [
                    {"username": {"$regex": search, "$options": "i"}},
                    {"mobile": {"$regex": search, "$options": "i"}},
                ]
            }
        )

        allowed_ids = [str(u.id) for u in users]
        deposits = [d for d in deposits if d.user_id in allowed_ids]

    # Prepare Output
    output = []
    for d in deposits:
        user = User.objects(id=d.user_id).first()

        output.append({
            "id": str(d.id),
            "user_id": d.user_id,
            "username": user.username if user else "-",
            "mobile": user.mobile if user else "-",
            "amount": d.amount,
            "image_url": d.image_url,
            "status": d.status,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
        })

    return output