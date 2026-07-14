from app.models import SiteSettings
from app.schemas import SettingsSchema
from fastapi import APIRouter, HTTPException


router = APIRouter(prefix="/settings", tags=["Settings"])

# -----------------------------
# GET SETTINGS
# -----------------------------
@router.get("/get")
def get_settings():
    s = SiteSettings.objects.first()
    if not s:
        return {"message": "No settings found"}
    return {
        "min_deposit": s.min_deposit,
        "max_deposit": s.max_deposit,
        "min_withdraw": s.min_withdraw,
        "max_withdraw": s.max_withdraw,
        "min_transfer": s.min_transfer,
        "max_transfer": s.max_transfer,
        "min_bid": s.min_bid,
        "max_bid": s.max_bid,
        "welcome_bonus": s.welcome_bonus,
        "referral_bonus" : s.referral_bonus,
        "website_link": s.website_link,
    }



@router.post("/update")
def update_settings(payload: SettingsSchema):
    s = SiteSettings.objects.first()

    if not s:
        s = SiteSettings()

    s.min_deposit = payload.min_deposit
    s.max_deposit = payload.max_deposit
    s.min_withdraw = payload.min_withdraw
    s.max_withdraw = payload.max_withdraw
    s.min_transfer = payload.min_transfer
    s.max_transfer = payload.max_transfer
    s.min_bid = payload.min_bid
    s.max_bid = payload.max_bid
    s.welcome_bonus = payload.welcome_bonus
    s.referral_bonus = payload.referral_bonus 
    s.website_link = payload.website_link

    s.save()
    return {"status": "success", "message": "Settings updated successfully"}


# -----------------------------
# DELETE SETTINGS (optional)
# -----------------------------
@router.delete("/delete")
def delete_settings():
    s = SiteSettings.objects.first()
    if not s:
        raise HTTPException(404, "Settings not found")
    s.delete()
    return {"status": "deleted"}
