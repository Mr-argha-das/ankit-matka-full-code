from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from ...models import Bid, Wallet, Market
from ...auth import get_current_user, require_admin

router = APIRouter(prefix="/user/bid", tags=["User Bids"])

VALID_GAMES = [
    "single", "jodi", "single_panna", "double_panna", "triple_panna",
    "sp", "dp", "tp", "half_sangam", "full_sangam"
]
def validate_digit(game_type, digit):

    # SINGLE → Only 1 digit
    if game_type == "single":
        if not digit.isdigit() or len(digit) != 1:
            raise HTTPException(400, "Single digit must be 0-9")

    # JODI → Only 2 digits
    if game_type == "jodi":
        if not digit.isdigit() or len(digit) != 2:
            raise HTTPException(400, "Jodi must be exactly 2 digits")

    # PANNA → 3 digits
    if game_type in ["single_panna", "double_panna", "triple_panna", "sp", "dp", "tp"]:
        if not digit.isdigit() or len(digit) != 3:
            raise HTTPException(400, "Panna must be 3 digits")

    # HALF SANGAM → Format: 123-4 or 678-3
    if game_type == "half_sangam":
        if "-" not in digit:
            raise HTTPException(400, "Half Sangam must be in format 'PANNAXX-DIGIT'")

        panna, single_digit = digit.split("-")

        if not panna.isdigit() or len(panna) != 3:
            raise HTTPException(400, "Half Sangam Panna must be 3 digits")

        if not single_digit.isdigit() or len(single_digit) != 1:
            raise HTTPException(400, "Half Sangam Digit must be 1 digit")

    # FULL SANGAM → Format: 123-678
    if game_type == "full_sangam":
        if "-" not in digit:
            raise HTTPException(400, "Full Sangam must be 'OPENPANNA-CLOSEPANNA'")

        open_panna, close_panna = digit.split("-")

        if not open_panna.isdigit() or len(open_panna) != 3:
            raise HTTPException(400, "Full Sangam OPEN PANNA must be 3 digits")

        if not close_panna.isdigit() or len(close_panna) != 3:
            raise HTTPException(400, "Full Sangam CLOSE PANNA must be 3 digits")


# ------------------------------
# PLACE BID API
# ------------------------------

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
        close_dt = close_dt + datetime.timedelta(days=1)

        # open_time <= now <= close_time(next day) → OPEN
        if open_dt <= now <= close_dt:
            return True

        # After close → CLOSED
        if now > close_dt:
            return False

        # AFTER midnight but before open_time → OPEN
        if midnight <= now < open_dt:
            return True

@router.post("/place")
def place_bid(
    market_id: str,
    game_type: str,
    session: str,
    points: int,
    digit: str = None,
    open_panna: str = None,
    close_panna: str = None,
    open_digit: str = None,
    close_digit: str = None,
    user=Depends(get_current_user)
):

    # ---------------- WALLET CHECK ----------------
    wallet = Wallet.objects(user_id=str(user.id)).first()
    if not wallet:
        raise HTTPException(status_code=400, detail="Wallet not found")

    if wallet.balance < points:
        raise HTTPException(status_code=400, detail="Insufficient Balance")

    # ---------------- MARKET CHECK ----------------
    market = Market.objects(id=market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Invalid Market ID")

    # ---------------- TIME PARSE ----------------
    def parse_time(t):
        return datetime.strptime(t, "%I:%M %p").time()

    now_dt = datetime.now()
    today = now_dt.date()

    open_time = parse_time(market.open_time)
    close_time = parse_time(market.close_time)

    open_dt = datetime.combine(today, open_time)
    close_dt = datetime.combine(today, close_time)

    # -------- HANDLE OVERNIGHT MARKET --------
    # Example: 10 PM to 2 AM
    if close_dt <= open_dt:
        close_dt += timedelta(days=1)

    # If after midnight but market is overnight
    if now_dt < open_dt and close_dt.day != open_dt.day:
        open_dt -= timedelta(days=1)

    # ---------------- TIME LOGIC ----------------

    # Before open time → only OPEN allowed
    if now_dt < open_dt:
        if session != "open":
            raise HTTPException(
                status_code=400,
                detail="Only OPEN session allowed before open time"
            )

    # Between open & close → only CLOSE allowed
    elif open_dt <= now_dt <= close_dt:
        if session != "close":
            raise HTTPException(
                status_code=400,
                detail="Only CLOSE session allowed after open time"
            )

    # After close → market closed
    else:
        raise HTTPException(
            status_code=400,
            detail="Market Closed"
        )

    # ---------------- VALIDATION ----------------

    if game_type not in VALID_GAMES:
        raise HTTPException(status_code=400, detail="Invalid Game Type")

    if session not in ["open", "close"]:
        raise HTTPException(status_code=400, detail="Invalid Session")

    # ---------------- SANGAM LOGIC ----------------

    if game_type == "full_sangam":
        if not open_panna or not close_panna:
            raise HTTPException(
                status_code=400,
                detail="Full Sangam requires open_panna & close_panna"
            )
        digit = f"{open_panna}-{close_panna}"

    elif game_type == "half_sangam":
        if open_panna and close_digit:
            digit = f"{open_panna}-{close_digit}"
        elif close_panna and open_digit:
            digit = f"{close_panna}-{open_digit}"
        else:
            raise HTTPException(
                status_code=400,
                detail="Half Sangam requires panna + digit combination"
            )

    elif digit is None:
        raise HTTPException(
            status_code=400,
            detail="Digit is required for this game type"
        )

    # Digit validation
    validate_digit(game_type, digit)

    # ---------------- WALLET DEDUCT ----------------
    wallet.update(
        dec__balance=points,
        set__updated_at=datetime.utcnow()
    )

    # ---------------- SAVE BID ----------------
    bid = Bid(
        user_id=str(user.id),
        market_id=market_id,
        game_type=game_type,
        session=session,
        digit=digit,
        points=points
    ).save()

    return {
        "msg": "Bid Successfully Placed",
        "bid": {
            "id": str(bid.id),
            "market_id": bid.market_id,
            "game_type": bid.game_type,
            "session": bid.session,
            "digit": bid.digit,
            "points": bid.points,
            "created_at": bid.created_at
        }
    }# ------------------------------
# MY BIDS
# ------------------------------

@router.get("/my-bids")
def my_bids(user=Depends(get_current_user)):
    bids = Bid.objects(user_id=str(user.id)).order_by("-created_at").limit(100)
    return [{
        "id": str(b.id),
        "market_id": b.market_id,
        "game_type": b.game_type,
        "session": b.session,
        "digit": b.digit,
        "points": b.points,
        "created_at": b.created_at
    } for b in bids]


# ------------------------------
# ADMIN: MARKET BIDS
# ------------------------------

@router.get("/market-bids")
def market_bids(market_id: str, admin=Depends(require_admin)):
    bids = Bid.objects(market_id=market_id).order_by("-created_at")
    return [{
        "id": str(b.id),
        "user_id": b.user_id,
        "game_type": b.game_type,
        "digit": b.digit,
        "points": b.points,
        "session": b.session,
        "created_at": b.created_at
    } for b in bids]
