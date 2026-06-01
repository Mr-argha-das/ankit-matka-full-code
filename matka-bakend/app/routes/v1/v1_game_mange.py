import json
from app.models import Market, RateChart

from fastapi import APIRouter, Query, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import FileResponse
from datetime import datetime, time
import os
import uuid
from mongoengine.errors import NotUniqueError
from ...auth import get_current_user, require_admin
from ...models import Bid, DepositQR, Result, Transaction, Wallet, User

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta



class MarketInput(BaseModel):
    name: str
    hindi: str
    open_time: str
    close_time: str
    is_active : bool = True
    status : bool = True
    marketType: str 

class RateChartInput(BaseModel):

    # -------- TYPE 1 --------
    single_digit_1: Optional[int] = None
    jodi_digit_1: Optional[int] = None
    single_pana_1: Optional[int] = None
    double_pana_1: Optional[int] = None
    tripple_pana_1: Optional[int] = None
    half_sangam_1: Optional[int] = None
    full_sangam_1: Optional[int] = None
    left_digit_1: Optional[int] = None
    right_digit_1: Optional[int] = None
    starline_single_digit_1: Optional[int] = None
    starline_single_pana_1: Optional[int] = None
    starline_double_pana_1: Optional[int] = None
    starline_tripple_pana_1: Optional[int] = None

    # -------- TYPE 2 --------
    single_digit_2: Optional[int] = None
    jodi_digit_2: Optional[int] = None
    single_pana_2: Optional[int] = None
    double_pana_2: Optional[int] = None
    tripple_pana_2: Optional[int] = None
    half_sangam_2: Optional[int] = None
    full_sangam_2: Optional[int] = None
    left_digit_2: Optional[int] = None
    right_digit_2: Optional[int] = None
    starline_single_digit_2: Optional[int] = None
    starline_single_pana_2: Optional[int] = None
    starline_double_pana_2: Optional[int] = None
    starline_tripple_pana_2: Optional[int] = None

    # -------- TYPE X --------
    single_digit_x: Optional[int] = None
    jodi_digit_x: Optional[int] = None
    single_pana_x: Optional[int] = None
    double_pana_x: Optional[int] = None
    tripple_pana_x: Optional[int] = None
    half_sangam_x: Optional[int] = None
    full_sangam_x: Optional[int] = None
    left_digit_x: Optional[int] = None
    right_digit_x: Optional[int] = None
    starline_single_digit_x: Optional[int] = None
    starline_single_pana_x: Optional[int] = None
    starline_double_pana_x: Optional[int] = None
    starline_tripple_pana_x: Optional[int] = None


router = APIRouter(prefix="/api/admin", tags=["Game Management"])

@router.get("/rate/")
def get_rate_chart():
    chart = RateChart.objects().first()
    if not chart:
        return {"message": "No rate chart found"}

    # FIX: Convert to JSON safe dict
    return json.loads(chart.to_json())

@router.post("/rate")
def create_or_update_rate_chart(data: RateChartInput,admin = Depends(require_admin)):
    chart = RateChart.objects().first()
    if not chart:
        chart = RateChart()
    data_dict = data.dict(exclude_unset=True)
    for key, value in data_dict.items():
        setattr(chart, key, value)
    chart.save()
    return {
        "message": "Rate chart updated successfully",
        "data": json.loads(chart.to_json())
    }


@router.post("/market/")
def create_market(data: MarketInput,admin = Depends(require_admin)):
    try:
        market = Market(
            name=data.name,
            hindi=data.hindi,
            open_time=data.open_time,
            close_time=data.close_time,
            marketType=data.marketType,
            is_active=data.is_active,
            status=data.status
        )
        market.save()
        return {"message": "Market created successfully", "id": str(market.id)}
    
    except NotUniqueError:
        raise HTTPException(status_code=400, detail="Market already exists")
 
@router.get("/user/markets/")
def get_user_markets(user=Depends(get_current_user)):
    markets = Market.objects(is_active=True, marketType="Market")
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
        todays_result = Result.objects(
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

@router.get("/user/starline/")
def get_user_markets(user=Depends(get_current_user)):
    markets = Market.objects(is_active=True, marketType="Starline")
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
        todays_result = Result.objects(
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


from datetime import datetime, timedelta

def compute_status(open_time: str, close_time: str):
    fmt = "%I:%M %p"
    now = datetime.now()

    # parse to time
    open_t = datetime.strptime(open_time, fmt).time()
    close_t = datetime.strptime(close_time, fmt).time()

    # build datetime with today's date
    open_dt = now.replace(hour=open_t.hour, minute=open_t.minute, second=0, microsecond=0)
    close_dt = now.replace(hour=close_t.hour, minute=close_t.minute, second=0, microsecond=0)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    next_midnight = midnight + timedelta(days=1)

    # ----------------------------------------------------
    # CASE A: Close time is SAME-DAY (close < 12 AM)
    # ----------------------------------------------------
    if close_dt > open_dt:  # normal same-day close

        # Now < open_time → OPEN (rule: early morning open)
        if now < open_dt:
            return True

        # open <= now <= close → OPEN
        if open_dt <= now <= close_dt:
            return True

        # now > close → CLOSED until midnight
        if now > close_dt:
            return False

    # ----------------------------------------------------
    # CASE B: Close time NEXT DAY (close < open)
    # ----------------------------------------------------
    else:
        # close is next-day
        close_dt = close_dt + timedelta(days=1)

        # open_time <= now <= close_time(next day) → OPEN
        if open_dt <= now <= close_dt:
            return True

        # After close → CLOSED
        if now > close_dt:
            return False

        # AFTER midnight but before open_time → OPEN
        if midnight <= now < open_dt:
            return True


    
@router.get("/market")
def get_markets():
    markets = Market.objects()
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
        todays_result = Result.objects(
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

@router.get("/market/{market_id}")
def get_market(market_id: str):
    market = Market.objects(id=market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")

    data = json.loads(market.to_json())

    # AUTO CALCULATE STATUS
    data["status"] = compute_status(market.open_time, market.close_time)

    # TODAY DATE RANGE
    today = datetime.utcnow().date()
    start = datetime.combine(today, time.min)
    end = datetime.combine(today, time.max)

    todays_result = Result.objects(
        market_id=str(market.id),
        date__gte=start,
        date__lte=end
    ).first()

    if todays_result:
        data["today_result"] = json.loads(todays_result.to_json())
    else:
        data["today_result"] = None

    return {
        "message": "Market fetched successfully",
        "data": data
    }




@router.put("/market/{market_id}")
def update_market(market_id: str, data: MarketInput,admin = Depends(require_admin)):
    market = Market.objects(id=market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")

    market.name = data.name
    market.hindi = data.hindi
    market.open_time = data.open_time
    market.close_time = data.close_time
    market.marketType = data.marketType
    market.is_active = data.is_active
    market.status = data.status

    try:
        market.save()
        
        
    except NotUniqueError:
        raise HTTPException(status_code=400, detail="Market name already exists")
    if market.is_active is False:
        today = datetime.utcnow().date()

        # Convert today's date + open/close time
        open_dt = datetime.strptime(f"{today} {market.open_time}", "%Y-%m-%d %H:%M")
        close_dt = datetime.strptime(f"{today} {market.close_time}", "%Y-%m-%d %H:%M")

        # 3. Find bids between open-close time
        bids = Bid.objects(
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
def update_market_status(market_id: str, status: bool,admin = Depends(require_admin)):
    market = Market.objects(id=market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")

    market.status = status
    market.save()

    return {"message": "Market status updated", "status": status}



@router.delete("/market/{market_id}")
def delete_market(market_id: str,admin = Depends(require_admin)):
    market = Market.objects(id=market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")

    market.delete()
    return {"message": "Market deleted successfully"}




@router.get("/market-chart")
def get_market_results(market_id: str = Query(None), ):
    """
    Return results in required simple format:
    [
        {
            "market_id": "MK01",
            "market_name": "Kalyan",
            "date": "2025-02-10",
            "open_panna": "234",
            "open_digit": "2",
            "close_panna": "680",
            "close_digit": "7",
            "status": "closed"
        }
    ]
    """

    def build_response(market, result):
        return {
            "market_id": str(market.id),
            "market_name": market.name,
            "date": result.date.strftime("%Y-%m-%d") if result else None,
            "open_panna": result.open_panna if result else None,
            "open_digit": result.open_digit if result else None,
            "close_panna": result.close_panna if result else None,
            "close_digit": result.close_digit if result else None,
            "status": "closed" if result else "open",
        }

    # If a specific market_id is requested
    if market_id:
        market = Market.objects(id=market_id).first()
        if not market:
            raise HTTPException(status_code=404, detail="Market not found")

        result = Result.objects(market_id=market_id).order_by("-date").first()
        return [build_response(market, result)]

    # Return ALL markets
    all_markets = Market.objects()
    final_output = []

    for m in all_markets:
        result = Result.objects(market_id=str(m.id)).order_by("-date").first()
        final_output.append(build_response(m, result))

    return final_output

@router.get("/{market_id}/toggle")
def toggle_market_status(market_id: str):

    # 1. Find market
    market = Market.objects(id=market_id).first()
    if not market:
        raise HTTPException(404, "Market not found")

    # 2. Toggle the status
    market.is_active = not market.is_active
    market.save()

    # If market deactivated → process refund
    if market.is_active is False:
        today = datetime.utcnow().date()

        # Convert today's date + open/close time
        open_dt = datetime.strptime(f"{today} {market.open_time}", "%Y-%m-%d %H:%M")
        close_dt = datetime.strptime(f"{today} {market.close_time}", "%Y-%m-%d %H:%M")

        # 3. Find bids between open-close time
        bids = Bid.objects(
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

        return {
            "message": "Market deactivated successfully",
            "refunded_bids": refund_count,
            "market_status": market.is_active
        }

    # If activated → simply return
    return {
        "message": "Market activated successfully",
        "market_status": market.is_active
    }