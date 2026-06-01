import json
from fastapi import APIRouter, HTTPException
from datetime import datetime
from ..models import Market

from datetime import datetime

def to_time(t: str):
    """Convert '09:00 AM' → time object"""
    return datetime.strptime(t, "%I:%M %p").time()

def get_digit(num_str: str):
    """Return last digit of sum or '-'"""
    if not num_str or num_str == "-" or len(num_str) != 3:
        return "-"
    total = sum(int(d) for d in num_str)
    return str(total % 10)

def build_result(open_result, close_result):
    """Build final result '248-4-112' """
    if open_result == "-" or close_result == "-":
        return "-"
    return f"{open_result}-{get_digit(open_result)}-{close_result}"

router = APIRouter(prefix="/market")


# ---------------------------
# CREATE MARKET
# ---------------------------
@router.post("/create")
def create_market(name: str, open_time: str, close_time: str , open_result : str = "-", close_result : str = "-"):
    if Market.objects(name=name).first():
        raise HTTPException(400, "Market already exists")

    market = Market(
        name=name,
        open_time=open_time,
        close_time=close_time,
        open_result=open_result,
        close_result=close_result
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

    now = datetime.now().time()
    open_t = to_time(m.open_time)
    close_t = to_time(m.close_time)

    status = "Market Running" if open_t <= now <= close_t else "Market Closed"
    final_result = build_result(m.open_result, m.close_result)

    data = {
        "id": str(m.id),
        "name": m.name,
        "open_time": m.open_time,
        "close_time": m.close_time,
        "open_result": m.open_result,
        "close_result": m.close_result,
        "final_result": final_result,
        "status": status
    }

    return data

# ---------------------------
# GET ALL MARKETS (FULL + CLEAN)
# ---------------------------
@router.get("/")
def get_all_markets():

    now = datetime.now().time()
    markets = []

    for m in Market.objects.order_by("open_time"):

        open_t = to_time(m.open_time)
        close_t = to_time(m.close_time)

        status = "Market Running" if open_t <= now <= close_t else "Market Closed"
        final_result = build_result(m.open_result, m.close_result)

        markets.append({
            "id": str(m.id),
            "name": m.name,
            "open_time": m.open_time,
            "close_time": m.close_time,
            "open_result": m.open_result,
            "close_result": m.close_result,
            "final_result": final_result,
            "status": status
        })

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
        date_obj = datetime.strptime(r.date, "%Y-%m-%d")
        day_name = date_obj.strftime("%a")  # e.g. Wed, Tue

        chart.append({
            "date": r.date,
            "day": day_name,
            "open_panna": r.open_panna,
            "open_digit": last_digit(r.open_panna),
            "close_panna": r.close_panna,
            "close_digit": last_digit(r.close_panna)
        })

    return {
        "market_name": market.name,
        "chart_count": len(chart),
        "chart": chart
    }
