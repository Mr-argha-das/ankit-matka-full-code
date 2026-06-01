from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from mongoengine import connect
from app.config import settings
import os
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
class AddCORSHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            response = await call_next(request)
        except Exception as e:
            # FORCE CORS even on error
            response = JSONResponse(
                status_code=500,
                content={"error": str(e)}
            )

        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        return response
# -----------------------------
# 1. CONNECT MONGODB FIRST
# -----------------------------
connect(host=settings.MONGO_URI)

# -----------------------------
# 2. CREATE FASTAPI APP
# -----------------------------
app = FastAPI(title="Matka Satka Backend")


# CORS settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://game.natraj777.com",
        "https://api.natraj777.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AddCORSHeadersMiddleware)

# -----------------------------
# 3. AFTER CONNECT -> IMPORT ROUTES
# -----------------------------
from app.routes import (
    auth_routes,
    site_data_routes,
    notifications_routes,
    main_settings_routes,
    how_to_play_routes,
    admin_routes,
    user_routes,
    withdrawal_routes,
    bids_routes,
    chart,
    admin_result,
    market,
    jackpot,
    passbook,
    images_routes,
    deposit_qr
)

from app.routes.v1 import (
    v1_declare_market_reslult,
    v1_user_routes,
    v1_game_mange,
    v1_report_management,
    v1_bids_routes,
    v1_game_godawari,
    v1_deposit,
    v1_refer_routes,
    v1_devloper_routes,
    v1_autoPay_routes,
    v1_payment_routes,


)

# -----------------------------
# 4. MOUNT STATIC FILES
# -----------------------------
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")

# -----------------------------
# 5. ADD ROUTES
# -----------------------------
app.include_router(auth_routes.router)
app.include_router(v1_payment_routes.router)
app.include_router(admin_routes.router)
app.include_router(user_routes.router)
app.include_router(withdrawal_routes.router)
app.include_router(bids_routes.router)
app.include_router(chart.router)
app.include_router(admin_result.router)
app.include_router(market.router)
app.include_router(images_routes.router)
app.include_router(deposit_qr.router)
app.include_router(passbook.router)
app.include_router(how_to_play_routes.router)
app.include_router(site_data_routes.router)
app.include_router(main_settings_routes.router)
app.include_router(notifications_routes.router)
app.include_router(jackpot.router)
app.include_router(v1_user_routes.router)
app.include_router(v1_game_mange.router)
app.include_router(v1_declare_market_reslult.router)
app.include_router(v1_report_management.router)
app.include_router(v1_bids_routes.router)
app.include_router(v1_game_godawari.router)
app.include_router(v1_deposit.router)
app.include_router(v1_refer_routes.router)
app.include_router(v1_devloper_routes.router)
app.include_router(v1_autoPay_routes.router)

# -----------------------------
# 6. ROOT API
# -----------------------------
@app.get("/")
def root():
    return {"status": "ok", "message": "Matka backend running"}
