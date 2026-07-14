from ..models import Bid
from ..models import Result
from ..models import Wallet
from app.routes.rates import GAME_RATES

def settle_results(market_id):
    market = Result.objects.filter(market_id=market_id).first()

    open_digit = market.open_digit
    close_digit = market.close_digit
    open_panna = market.open_panna
    close_panna = market.close_panna

    bids = Bid.objects(market_id=market_id)

    for bid in bids:
        win = False

        if bid.game_type == "single" and bid.digit == open_digit:
            win = True

        if bid.game_type == "jodi" and bid.digit == open_digit + close_digit:
            win = True

        if bid.game_type == "single_panna" and bid.digit == open_panna:
            win = True

        if bid.game_type == "double_panna" and bid.digit == close_panna:
            win = True

        if win:
            rate = GAME_RATES.get(bid.game_type)
            win_amount = bid.points * rate

            wallet = Wallet.objects(user_id=bid.user_id).first()
            wallet.update(inc__balance=win_amount)
