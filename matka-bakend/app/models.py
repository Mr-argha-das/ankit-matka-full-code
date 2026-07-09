from mongoengine import Document, StringField, EmailField, DateTimeField, FloatField, IntField, ReferenceField, BooleanField, ListField, EmbeddedDocumentField, EmbeddedDocument

import datetime
from mongoengine import Document, StringField
from pydantic import BaseModel

import uuid

class User(Document):
    meta = {"collection": "users", "strict": False}
    username = StringField(required=True)
    mobile = StringField(required=True, unique=True)
    password_hash = StringField(required=True)

    role = StringField(choices=["player","admin"], default="player")
    balance = FloatField(default=5.0)
    created_at = DateTimeField(default=datetime.datetime.utcnow)

    is_bet = BooleanField(default=True)
    status = BooleanField(default=True)
    last_login = DateTimeField(default=datetime.datetime.utcnow)
    
    # Referral
    referral_code = StringField(
       default=lambda: str(uuid.uuid4())[:8],
       unique=True,
       sparse=True  ) 
    referred_by = StringField()   
 # Active / Inactive




class Draw(Document):
    meta = {"collection":"draws", "indexes":[{"fields":["-created_at"]}]}
    market = StringField(required=True)  # 'open' or 'close' or custom
    result_number = StringField(required=True)  # result of draw
    published_by = ReferenceField(User)
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    settled = BooleanField(default=False)

class Transaction(Document):

    tx_id = StringField(required=True, unique=True)

    user_id = StringField(required=True)

    razorpay_order_id = StringField()

    razorpay_payment_id = StringField()

    amount = FloatField(required=True)

    status = StringField(default="PENDING")

    payment_method = StringField(default="")

    upi_id = StringField()

    upi_txn_id = StringField()

    approval_ref_no = StringField()

    raw_response = StringField()

    expires_at = DateTimeField()

    created_at = DateTimeField(default=datetime.datetime.utcnow)

    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    confirmed_at = DateTimeField()

    meta = {
        "collection": "transactions"
    }

class Wallet(Document):
    user_id = StringField(required=True, unique=True)
    balance = FloatField(default=0)
    updated_at =DateTimeField(default=datetime.datetime.utcnow)

class Withdrawal(Document):
    wd_id = StringField(default=lambda: str(uuid.uuid4()))
    user_id = StringField(required=True)
    amount = FloatField(required=True)
    method = StringField(required=True)  # Paytm / PhonePe / GooglePay
    number = StringField(required=False)
    status = StringField(default="pending")  
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    confirmed_at = DateTimeField()
    account_holder_name = StringField(required=False)
    account_no = StringField(required=False)
    ifc_code = StringField(required=False)



class DepositQR(Document):
    user_id = StringField(required=True)
    image_url = StringField(required=True)
    trnx_id = StringField(required=False)
    status = StringField(default="pending")  
    amount = FloatField(default=0)
    method = StringField()
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)



class Market(Document):
    name = StringField(required=True, unique=True)
    hindi = StringField()

    open_time = StringField(required=True)
    close_time = StringField(required=True)
    marketType = StringField(required=True,choices=["Market", "Starline"])  # Regular / Starline / Jackpot
    
    is_active = BooleanField(default=True)
    status = BooleanField(default=True)  # Open / Close
   

class Bid(Document):
    user_id = StringField(required=True)
    market_id = StringField(required=True)
    game_type = StringField(required=True)  # single, jodi, sp, dp, tp, panna, sangam
    session = StringField(required=True)    # open / close

    digit = StringField(required=True)
    points = IntField(required=True)
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    bid_date = DateTimeField(default=datetime.datetime.utcnow)
    is_settled = BooleanField(default=False)


class Result(Document):
    market_id = StringField(required=True)
    date = DateTimeField(required=True, default=datetime.datetime.utcnow)
    open_panna = StringField()
    close_panna = StringField()
    open_digit = StringField()
    close_digit = StringField()
    



class StarlineSlot(Document):
    meta = {"collection": "starline_slots"}

    name = StringField(required=True)                # e.g., "Slot 1"
    start_time = StringField(required=True)          # "10:00"
    end_time = StringField(required=True)            # "10:15" (admin decides)
    games = ListField(StringField())                 # Allowed games
    is_active = BooleanField(default=True)


class JackpotSlot(Document):
    meta = {"collection": "jackpot_slots"}

    name = StringField(required=True)
    start_time = StringField(required=True)
    end_time = StringField(required=True)
    games = ListField(StringField())
    is_active = BooleanField(default=True)


# How to Play

class HowToPlay(Document):
    content = StringField(required=True)   # HTML content from TinyMCE
    video_id = StringField()               # YouTube video ID

    meta = {"collection": "how_to_play"}


# Main Setting
class SiteSettings(Document):
    min_deposit = FloatField(default=0)
    max_deposit = FloatField(default=0)
    min_withdraw = FloatField(default=0)
    max_withdraw = FloatField(default=0)
    min_transfer = FloatField(default=0)
    max_transfer = FloatField(default=0)
    min_bid = FloatField(default=0)
    max_bid = FloatField(default=0)
    welcome_bonus = FloatField(default=0)
    referral_bonus = FloatField(default=0)
    website_link = StringField(default="")
    meta = {"collection": "site_settings"}


# Site data 

class siteData(Document):
    # Basic contacts
    mobile_number = StringField(default="")
    whatsapp_number = StringField(default="")
    telegram_link = StringField(default="")

    # Notification lines
    dashboard_notification_line = StringField(default="")
    add_fund_notification_line = StringField(default="")

    # UPI Fields
    upi_id = StringField(default="")
    upi_gateway_merchant_id = StringField(default="")
    manual_upi = StringField(default="")

    # Videos
    video1 = StringField(default="")
    video2 = StringField(default="")
    video3 = StringField(default="")
    video4 = StringField(default="")

    # Dropdown
    auto_result = BooleanField(default=True)

    # HTML Editors
    withdraw_money_html = StringField(default="")
    add_money_html = StringField(default="")
    notice_board_html = StringField(default="")
    withdraw_terms_html = StringField(default="")

    meta = {"collection": "site_data"}


class Notification(Document):
    title = StringField(required=True)
    created_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {"collection": "notifications", "ordering": ["-created_at"]}

class RateChart(Document):
    meta = {"collection": "rate_chart"}

    # Values for Type 1
    single_digit_1 = IntField(default=10)
    jodi_digit_1 = IntField(default=10)
    single_pana_1 = IntField(default=10)
    double_pana_1 = IntField(default=10)
    tripple_pana_1 = IntField(default=10)
    half_sangam_1 = IntField(default=10)
    full_sangam_1 = IntField(default=10)
    left_digit_1 = IntField(default=10)
    right_digit_1 = IntField(default=10)
    starline_single_digit_1 = IntField(default=10)
    starline_single_pana_1 = IntField(default=10)
    starline_double_pana_1 = IntField(default=10)
    starline_tripple_pana_1 = IntField(default=10)

    # Values for Type 2
    single_digit_2 = IntField(default=100)
    jodi_digit_2 = IntField(default=995)
    single_pana_2 = IntField(default=1500)
    double_pana_2 = IntField(default=3000)
    tripple_pana_2 = IntField(default=7000)
    half_sangam_2 = IntField(default=10000)
    full_sangam_2 = IntField(default=100000)
    left_digit_2 = IntField(default=100)
    right_digit_2 = IntField(default=100)
    starline_single_digit_2 = IntField(default=100)
    starline_single_pana_2 = IntField(default=1500)
    starline_double_pana_2 = IntField(default=3000)
    starline_tripple_pana_2 = IntField(default=7000)

    # Values for Type X
    single_digit_x = IntField(default=0)
    jodi_digit_x = IntField(default=0)
    single_pana_x = IntField(default=0)
    double_pana_x = IntField(default=0)
    tripple_pana_x = IntField(default=0)
    half_sangam_x = IntField(default=0)
    full_sangam_x = IntField(default=0)
    left_digit_x = IntField(default=0)
    right_digit_x = IntField(default=0)
    starline_single_digit_x = IntField(default=0)
    starline_single_pana_x = IntField(default=0)
    starline_double_pana_x = IntField(default=0)
    starline_tripple_pana_x = IntField(default=0)

class DevloperAccess(Document):
    value = BooleanField(default=True)
