from fastapi import APIRouter, HTTPException
from app.models import siteData
from app.schemas import siteDataSchema

router = APIRouter(prefix="/sitedata", tags=["siteData"])


@router.get("/get")
def get_site_data():
    d = siteData.objects.first()

    if not d:
        return {
            "mobile_number": "",
            "whatsapp_number": "",
            "telegram_link": "",
            "dashboard_notification_line": "",
            "add_fund_notification_line": "",
            "upi_id": "",
            "upi_gateway_merchant_id": "",
            "manual_upi": "",
            "video1": "",
            "video2": "",
            "video3": "",
            "video4": "",
            "auto_result": True,
            "withdraw_money_html": "",
            "add_money_html": "",
            "notice_board_html": "",
            "withdraw_terms_html": "",
        }

    # Convert MongoEngine doc to clean dict
    data = {
        "mobile_number": d.mobile_number,
        "whatsapp_number": d.whatsapp_number,
        "telegram_link": d.telegram_link,
        "dashboard_notification_line": d.dashboard_notification_line,
        "add_fund_notification_line": d.add_fund_notification_line,
        "upi_id": d.upi_id,
        "upi_gateway_merchant_id": d.upi_gateway_merchant_id,
        "manual_upi": d.manual_upi,
        "video1": d.video1,
        "video2": d.video2,
        "video3": d.video3,
        "video4": d.video4,
        "auto_result": d.auto_result,
        "withdraw_money_html": d.withdraw_money_html,
        "add_money_html": d.add_money_html,
        "notice_board_html": d.notice_board_html,
        "withdraw_terms_html": d.withdraw_terms_html,
    }

    return data


@router.post("/update")
def update_site_data(payload: siteDataSchema):
    d = siteData.objects.first()
    if not d:
        d = siteData()

    # Pydantic v2 uses model_dump()
    payload_data = payload.model_dump()

    for field, value in payload_data.items():
        if value is not None:
            setattr(d, field, value)

    d.save()
    return {"status": "success", "message": "siteData updated"}


@router.delete("/delete")
def delete_site_data():
    d = siteData.objects.first()
    if not d:
        raise HTTPException(status_code=404, detail="Not Found")

    d.delete()
    return {"status": "deleted"}
