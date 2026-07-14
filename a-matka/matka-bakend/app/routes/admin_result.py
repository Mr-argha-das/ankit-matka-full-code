from fastapi import APIRouter, Depends, HTTPException
from ..models import Market, Result, Bid, Wallet, User
from ..auth import get_current_user, require_admin
import datetime
from pydantic import BaseModel

class ResultInput(BaseModel):
    market_id: str
    date: str
    open_digit: str = "-"
    close_digit: str = "-"
    open_panna: str = "-"
    close_panna: str = "-"

router = APIRouter(prefix="/admin/result")

# --------------------------
# GAME RATES
# --------------------------
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


# -----------------------------------------------------
#  SETTLEMENT LOGIC (ALL GAME TYPES + SANGAM INCLUDED)
# -----------------------------------------------------
def settle_results(market_id: str, result_obj: Result):

    open_digit = result_obj.open_digit
    close_digit = result_obj.close_digit
    open_panna = result_obj.open_panna
    close_panna = result_obj.close_panna

    bids = Bid.objects(market_id=market_id)

    for bid in bids:
        win = False

        # --------------------
        # SINGLE DIGIT
        # --------------------
        if bid.game_type == "single" and bid.digit == open_digit:
            win = True

        # --------------------
        # JODI
        # --------------------
        if bid.game_type == "jodi" and bid.digit == open_digit + close_digit:
            win = True

        # --------------------
        # PANNA (Open)
        # --------------------
        if bid.game_type in ["single_panna", "sp"] and bid.digit == open_panna:
            win = True

        # --------------------
        # PANNA (Close)
        # --------------------
        if bid.game_type in ["double_panna", "dp"] and bid.digit == close_panna:
            win = True

        # --------------------
        # TRIPLE PANNA
        # --------------------
        if bid.game_type in ["triple_panna", "tp"]:
            if bid.session == "open" and bid.digit == open_panna:
                win = True
            if bid.session == "close" and bid.digit == close_panna:
                win = True

        # --------------------
        # HALF SANGAM (Open panna + Close digit)
        # EXAMPLE: 123-4  == open_panna-close_digit
        # --------------------
        if bid.game_type == "half_sangam":
            panna, digit = bid.digit.split("-")

            if panna == open_panna and digit == close_digit:
                win = True

        # --------------------
        # FULL SANGAM (Open panna + Close panna)
        # EXAMPLE: 123-678
        # --------------------
        if bid.game_type == "full_sangam":
            op, cp = bid.digit.split("-")
            if op == open_panna and cp == close_panna:
                win = True

        # -----------------------
        # If Won → Add Balance
        # -----------------------
        if win:
            rate = GAME_RATES.get(bid.game_type, 0)
            win_amount = bid.points * rate

            wallet = Wallet.objects(user_id=bid.user_id).first()
            if wallet:
                wallet.update(inc__balance=win_amount)


# -----------------------------------------------------
#      DECLARE RESULT API (ADMIN)
# -----------------------------------------------------

@router.post("/declare")
def declare_result(
    result_input: ResultInput,
    admin=Depends(require_admin)
):

    # Validate Market
    try:
        Market.objects.get(id=result_input.market_id)
    except:
        raise HTTPException(404, "Market not found")

    # Check if result already exists for this date
    existing = Result.objects(market_id=result_input.market_id, date=result_input.date).first()
    if existing:
        result_obj = existing
        result_obj.update(
            open_digit=result_input.open_digit,
            close_digit=result_input.close_digit,
            open_panna=result_input.open_panna,
            close_panna=result_input.close_panna,
        )
    else:
        result_obj = Result(
            market_id=result_input.market_id,
            date=result_input.date,
            open_digit=result_input.open_digit,
            close_digit=result_input.close_digit,
            open_panna=result_input.open_panna,
            close_panna=result_input.close_panna,
        ).save()

    # Run Settlement
    settle_results(result_input.market_id, result_obj)

    return {
        "msg": "Result declared & settlement completed",
        "market_id": result_input.market_id,
        "date": result_input.date,
        "open_digit": result_input.open_digit,
        "close_digit": result_input.close_digit,
        "open_panna": result_input.open_panna,
        "close_panna": result_input.close_panna
    }


@router.get("/winning")
def winning_history(user = Depends(get_current_user)):
    user_id = str(user.id)

    # User ke saare winning bids
    winning_bids = Bid.objects(user_id=user_id)

    history = []

    for bid in winning_bids:

        # Market find
        market = Market.objects(id=bid.market_id).first()
        result = Result.objects(market_id=bid.market_id).first()

        if not market or not result:
            continue

        # Settlement logic duplicate nhi karna — sirf check karna ki win hai?
        win = False
        open_digit = result.open_digit
        close_digit = result.close_digit
        open_panna = result.open_panna
        close_panna = result.close_panna

        # -------------------- MATCHING LOGIC ----------------------
        if bid.game_type == "single" and bid.digit == open_digit:
            win = True

        if bid.game_type == "jodi" and bid.digit == open_digit + close_digit:
            win = True

        if bid.game_type in ["single_panna", "sp"] and bid.digit == open_panna:
            win = True

        if bid.game_type in ["double_panna", "dp"] and bid.digit == close_panna:
            win = True

        if bid.game_type in ["triple_panna", "tp"]:
            if bid.session == "open" and bid.digit == open_panna:
                win = True
            if bid.session == "close" and bid.digit == close_panna:
                win = True

        if bid.game_type == "half_sangam":
            panna, digit = bid.digit.split("-")
            if panna == open_panna and digit == close_digit:
                win = True

        if bid.game_type == "full_sangam":
            panna1, panna2 = bid.digit.split("-")
            if panna1 == open_panna and panna2 == close_panna:
                win = True

        if not win:
            continue

        # WINNING RATE (same rate table)
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

        win_amount = bid.points * GAME_RATES.get(bid.game_type, 0)

        history.append({
            "market_name": market.name,
            "game_type": bid.game_type,
            "digit": bid.digit,
            "session": bid.session,
            "points": bid.points,
            "win_amount": win_amount,
            "date": result.date,
            "result": {
                "open_digit": open_digit,
                "close_digit": close_digit,
                "open_panna": open_panna,
                "close_panna": close_panna
            }
        })

    return {
        "total_wins": len(history),
        "history": history

    }
