# from fastapi import APIRouter, Depends, HTTPException
# from ..schemas import BetCreate
# from ..auth import get_current_user
# from ..models import Bet, Transaction, User
# import datetime

# router = APIRouter(prefix="/bets", tags=["bets"])

# @router.post("/place")
# def place_bet(payload: BetCreate, user = Depends(get_current_user)):
#     # basic validations
#     if payload.stake <= 0:
#         raise HTTPException(400, "Stake must be positive")
#     # simple per-bet max check
#     MAX_BET = 50000
#     if payload.stake > MAX_BET:
#         raise HTTPException(400, f"Max stake is {MAX_BET}")

#     # check balance
#     if user.balance < payload.stake:
#         raise HTTPException(400, "Insufficient balance")

#     # lock balance by deducting immediately
#     user.update(balance=user.balance - payload.stake)
#     # transaction record
#     t = Transaction(user=user, kind="bet", amount=-payload.stake, balance_after=user.balance - payload.stake,
#                     meta_info=f"Bet {payload.market}:{payload.number}").save()

#     bet = Bet(user=user, market=payload.market, number=payload.number, stake=payload.stake, odds=1.0).save()
#     return {"bet_id": str(bet.id), "status": bet.status, "stake": bet.stake}

# @router.get("/my")
# def my_bets(user = Depends(get_current_user)):
#     bets = Bet.objects(user=user).order_by("-created_at").limit(100)
#     out = []
#     for b in bets:
#         out.append({
#             "id": str(b.id),
#             "market": b.market,
#             "number": b.number,
#             "stake": b.stake,
#             "status": b.status,
#             "result": b.result,
#             "payout": b.payout
#         })
#     return out
