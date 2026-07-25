import json
from fastapi import APIRouter, HTTPException
from datetime import datetime
from zoneinfo import ZoneInfo
from ..models import Market

from datetime import datetime

IST = ZoneInfo("Asia/Kolkata")

def to_time(t: str):
    """Convert '09:00 AM' → time object"""
    return datetime.strptime(t, "%I:%M %p").time()

def is_market_running(open_time: str, close_time: str):
    now = datetime.now(IST)
    open_t = to_time(open_time)
    close_t = to_time(close_time)
    open_dt = now.replace(hour=open_t.hour, minute=open_t.minute, second=0, microsecond=0)
    close_dt = now.replace(hour=close_t.hour, minute=close_t.minute, second=0, microsecond=0)

    if close_dt > open_dt:
        return now <= close_dt

    return now >= open_dt or now <= close_dt

def get_digit(num_str: str):
    """Return last digit of sum or '-'"""
    if not num_str or num_str == "-" or len(num_str) != 3:
        return "-"
    total = sum(int(d) for d in num_str)
    return str(total % 10)

def build_result(result):
    """Build a public result string from the latest Result document."""
    if not result:
        return "***-**-***"

    open_panna = result.open_panna or "***"
    close_panna = result.close_panna or "***"
    open_digit = result.open_digit or get_digit(result.open_panna) or "*"
    close_digit = result.close_digit or get_digit(result.close_panna) or "*"
    open_digit = "*" if open_digit == "-" else open_digit
    close_digit = "*" if close_digit == "-" else close_digit
    return f"{open_panna}-{open_digit}{close_digit}-{close_panna}"


def serialize_public_market(market):
    latest_result = (
        Result.objects(market_id=str(market.id))
        .order_by("-date")
        .first()
    )
    running = bool(market.status) and is_market_running(
        market.open_time,
        market.close_time,
    )

    return {
        "id": str(market.id),
        "name": market.name,
        "open_time": market.open_time,
        "close_time": market.close_time,
        "open_result": latest_result.open_panna if latest_result else None,
        "close_result": latest_result.close_panna if latest_result else None,
        "final_result": build_result(latest_result),
        "status": "Market Running" if running else "Market Closed",
        "is_active": market.is_active,
    }

router = APIRouter(prefix="/market")


# ---------------------------
# CREATE MARKET
# ---------------------------
@router.post("/create")
def create_market(name: str, open_time: str, close_time: str):
    if Market.objects(name=name).first():
        raise HTTPException(400, "Market already exists")

    market = Market(
        name=name,
        open_time=open_time,
        close_time=close_time,
        marketType="Market",
    )
    market.save()
    return {"msg": "Market created successfully", "market": json.loads(market.to_json())}


# ---------------------------
# UPDATE MARKET
# ---------------------------
@router.put("/update/{market_id}")
def update_market(market_id: str, name: str = None, open_time: str = None, close_time: str = None):

    market = Market.objects(id=market_id).first()
    if not market:
        raise HTTPException(404, "Market not found")

    if name:
        market.name = name
    if open_time:
        market.open_time = open_time
    if close_time:
        market.close_time = close_time
    market.save()
    return {"msg": "Market updated", "market": json.loads(market.to_json())}



    return {"msg": "Market updated", "market": market}

# ---------------------------
# DELETE MARKET
# ---------------------------
@router.delete("/delete/{market_id}")
def delete_market(market_id: str):
    market = Market.objects(id=market_id).first()
    if not market:
        raise HTTPException(404, "Market not found")

    market.delete()
    return {"msg": "Market deleted successfully"}


# ---------------------------
# GET SINGLE MARKET (with status + result)
# ---------------------------
@router.get("/{market_id}")
def get_market(market_id: str):

    m = Market.objects(id=market_id).first()
    if not m:
        raise HTTPException(404, "Market not found")

    return serialize_public_market(m)

# ---------------------------
# GET ALL MARKETS (FULL + CLEAN)
# ---------------------------
@router.get("/")
def get_all_markets():

    markets = []

    query = Market.objects(
        is_active=True,
        marketType="Market",
    ).order_by("open_time")

    for m in query:
        markets.append(serialize_public_market(m))

    return {"status": "success", "count": len(markets), "markets": markets}

# [Unit]
# Description=FastAPI App
# After=network.target

# [Service]
# User=ubuntu
# Group=ubuntu
# WorkingDirectory=/var/www/satka-matka
# Environment="PATH=/var/www/satka-matka/venv/bin"
# ExecStart=/var/www/satka-matka/venv/bin/gunicorn -k uvicorn.workers.UvicornWorker app:app --bind 127.0.0.1:8000

# [Install]
# WantedBy=multi-user.target

from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from ..models import Result, Market



def last_digit(panna):
    if not panna or panna == "-" or len(panna) != 3:
        return "-"
    total = sum(int(d) for d in panna)
    return str(total % 10)


# ================================
# ⭐ MONTHLY CHART API
# ================================
@router.get("/chart/monthly/{market_id}")
def get_monthly_chart(market_id: str):

    # Check market exists
    market = Market.objects(id=market_id).first()
    if not market:
        raise HTTPException(404, "Market not found")

    # Get last 30 days result
    results = Result.objects(market_id=str(market_id)).order_by("-date")[:30]

    chart = []

    for r in results:

        # Extract day name (Mon, Tue…)
        date_obj = r.date
        if not isinstance(date_obj, datetime):
            date_obj = datetime.fromisoformat(str(date_obj))
        day_name = date_obj.strftime("%a")  # e.g. Wed, Tue

        chart.append({
            "date": date_obj.strftime("%Y-%m-%d"),
            "day": day_name,
            "open_panna": r.open_panna,
            "open_digit": r.open_digit or last_digit(r.open_panna),
            "close_panna": r.close_panna,
            "close_digit": r.close_digit or last_digit(r.close_panna)
        })

    return {
        "market_name": market.name,
        "chart_count": len(chart),
        "chart": chart
    }
