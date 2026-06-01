import json
from fastapi import APIRouter, Depends, HTTPException
import datetime, uuid
from ..auth import require_admin
from ..models import Draw, Market, Result, Bid, Wallet, Transaction, User
from ..schemas import DrawCreate

router = APIRouter(prefix="/admin")

GAME_RATES = {
    "single": 9,
    "jodi": 95,
    "single_panna": 140,
    "double_panna": 300,
    "triple_panna": 600,
    "sp": 900,
    "dp": 2700,
    "tp": 9000,
    "half_sangam": 1200,
    "full_sangam": 10000,
}


@router.post("/publish_draw")
def publish_draw(payload: DrawCreate, admin=Depends(require_admin)):
    d = Draw(market=payload.market, result_number=payload.result_number, published_by=admin).save()
    return {"success": True, "draw_id": str(d.id)}


@router.post("/settle_draw/{draw_id}")
def settle_draw(draw_id: str, admin=Depends(require_admin)):

    draw = Draw.objects(id=draw_id).first()
    if not draw:
        raise HTTPException(404, "Draw not found")
    if draw.settled:
        raise HTTPException(400, "Already settled")

    market = Market.objects(name=draw.market).first()
    if not market:
        raise HTTPException(404, "Market not found")

    is_open = (market.open_result == "-")
    session = "open" if is_open else "close"

    panna, digit = draw.result_number.split("-")

    if is_open:
        market.update(open_result=draw.result_number)
    else:
        market.update(close_result=draw.result_number)

    today = str(datetime.date.today())
    result = Result.objects(market_id=str(market.id), date=today).first() or Result(market_id=str(market.id), date=today)

    if session == "open":
        result.open_panna = panna
        result.open_digit = digit
    else:
        result.close_panna = panna
        result.close_digit = digit

    result.save()

    # RESULT VALUES
    open_d = result.open_digit
    close_d = result.close_digit
    open_p = result.open_panna
    close_p = result.close_panna

    jodi = open_d + close_d if open_d != "-" and close_d != "-" else ""

    bids = Bid.objects(market_id=str(market.id), session=session)
    wins, loses = [], []

    for b in bids:
        win = False

        if b.game_type == "single" and b.digit == digit: win = True
        if b.game_type == "jodi" and b.digit == jodi: win = True
        if b.game_type in ["single_panna", "triple_panna", "sp", "tp"] and b.digit == open_p: win = True
        if b.game_type in ["double_panna", "dp"] and b.digit == close_p: win = True

        if b.game_type == "half_sangam":
            if b.digit in [f"{open_p}-{close_d}", f"{close_p}-{open_d}"]:
                win = True

        if b.game_type == "full_sangam":
            if b.digit == f"{open_p}-{close_p}": win = True

        if win:
            amt = b.points * GAME_RATES[b.game_type]
            wallet = Wallet.objects(user_id=b.user_id).first()
            wallet.update(inc__balance=amt)

            Transaction(
                tx_id=str(uuid.uuid4()),
                user_id=b.user_id,
                amount=amt,
                payment_method="WIN",
                status="SUCCESS"
            ).save()

            wins.append({"bid_id": str(b.id), "amount": amt})
        else:
            loses.append(str(b.id))

    draw.update(set__settled=True)

    return {
        "success": True,
        "market": market.name,
        "session": session,
        "wins": wins,
        "loses": len(loses)
    }

@router.get("/users")
def get_all_users(admin=Depends(require_admin)):
    users = User.objects.all()
    return {
        "status": "success",
        "users": json.loads(users.to_json())
    }
