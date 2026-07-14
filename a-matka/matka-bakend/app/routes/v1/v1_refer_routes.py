from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from ...models import User, Wallet, SiteSettings
import datetime
import uuid
router = APIRouter(prefix="/admin", tags=["Admin Referral Management"])

@router.post("/update-referral-bonus")
def update_bonus(amount: float):
    settings = SiteSettings.objects().first()
    if not settings:
        settings = SiteSettings()

    settings.referral_bonus = amount
    settings.save()

    return {"message": "Referral bonus updated", "amount": amount}


