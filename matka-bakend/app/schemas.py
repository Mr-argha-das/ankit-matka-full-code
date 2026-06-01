from pydantic import BaseModel, Field
from pydantic import BaseModel, EmailStr
from typing import Optional
import datetime

class UserCreate(BaseModel):
    username: str
    mobile: str
    password: str
    referral_code : str | None = None

class LoginSchema(BaseModel):
    mobile: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class HowToPlaySchema(BaseModel):
    content: str
    video_id: str | None = None

class SettingsSchema(BaseModel):
    min_deposit: float
    max_deposit: float
    min_withdraw: float
    max_withdraw: float
    min_transfer: float
    max_transfer: float
    min_bid: float
    max_bid: float
    welcome_bonus: float
    referral_bonus :float
    website_link: str


class UserOut(BaseModel):
    id: str
    username: str
    mobile: str
    balance: float
    role: str

class BetCreate(BaseModel):
    market: str
    number: str
    stake: float

class DrawCreate(BaseModel):
    market: str
    result_number: str



# Site data 

class siteDataSchema(BaseModel):
    mobile_number: str | None = None
    whatsapp_number: str | None = None
    telegram_link: str | None = None

    dashboard_notification_line: str | None = None
    add_fund_notification_line: str | None = None

    upi_id: str | None = None
    upi_gateway_merchant_id: str | None = None
    manual_upi: str | None = None

    video1: str | None = None
    video2: str | None = None
    video3: str | None = None
    video4: str | None = None

    auto_result: bool | None = True

    withdraw_money_html: str | None = None
    add_money_html: str | None = None
    notice_board_html: str | None = None
    withdraw_terms_html: str | None = None

class NotificationSchema(BaseModel):
    title: str
    # created_at: datetime.datetime