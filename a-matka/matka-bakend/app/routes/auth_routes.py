from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException
from ..models import DevloperAccess, SiteSettings, Transaction, User, Wallet
from ..schemas import UserCreate, LoginSchema, Token, UserOut
from ..utils import hash_password, verify_password, create_access_token

import random
import string

router = APIRouter(prefix="/auth", tags=["auth"])

# @router.post("/register", response_model=UserOut)
# def register(payload: UserCreate):

#     # 1. Check if mobile exists
#     if User.objects(mobile=payload.mobile).first():
#         raise HTTPException(400, "Mobile already registered")

#     # 2. Create user with password hash
#     hashed = hash_password(payload.password)

#     new_user = User(
#         username=payload.username,
#         mobile=payload.mobile,
#         role=payload.role,
#         password_hash=hashed,

#         # Referral details
#         referred_by=payload.referral_code if payload.referral_code else None,
#     ).save()

#     # 3. Create wallet for new user
#     Wallet(user_id=str(new_user.id), balance=0).save()

#     # ---------------------------------------------------
#     # 4. REFERRAL BONUS LOGIC
#     # ---------------------------------------------------
#     if payload.referral_code:

#         # Find the referring user
#         referrer = User.objects(referral_code=payload.referral_code).first()

#         if not referrer:
#             raise HTTPException(400, "Invalid referral code")

#         # Load referral bonus setting set by admin
#         settings = SiteSettings.objects().first()
#         bonus_amount = settings.referral_bonus if settings else 0

#         # Add bonus to referrer's wallet
#         ref_wallet = Wallet.objects(user_id=str(referrer.id)).first()
#         ref_wallet.balance += bonus_amount
#         ref_wallet.updated_at = datetime.datetime.utcnow()
#         ref_wallet.save()

#     # ---------------------------------------------------
#     # Response
#     # ---------------------------------------------------
#     return UserOut(
#         id=str(new_user.id),
#         username=new_user.username,
#         mobile=new_user.mobile,
#         balance=new_user.balance,
#         role=new_user.role
#     )



# ---- FUNCTION TO GENERATE UNIQUE REFERRAL CODE ----
def generate_referral_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


def generate_unique_referral_code():
    for _ in range(20):
        code = generate_referral_code()
        if not User.objects(referral_code=code).first():
            return code
    raise HTTPException(status_code=500, detail="Could not generate referral code")


def check_access():
    record = DevloperAccess.objects.first()
    if record and record.value is False:
        raise HTTPException(status_code=401, detail="Access Blocked by Developer")
    return True


@router.post("/register", dependencies=[Depends(check_access)])
def register(payload: UserCreate):
    username = payload.username.strip()
    mobile = payload.mobile.strip()
    password = payload.password.strip()
    referral_input = (payload.referral_code or "").strip().upper() or None

    if not username:
        raise HTTPException(400, "Username is required")

    if not mobile.isdigit() or len(mobile) != 10:
        raise HTTPException(400, "Mobile must be 10 digits")

    if not password:
        raise HTTPException(400, "Password is required")

    # 1. Check if mobile exists
    if User.objects(mobile=mobile).first():
        raise HTTPException(400, "Mobile already registered")

    referrer = None
    if referral_input:
        referrer = User.objects(referral_code=referral_input).first()
        if not referrer:
            raise HTTPException(400, "Invalid referral code")

    # 3. Generate referral code for the new user
    referral_code = generate_unique_referral_code()
    settings = SiteSettings.objects().first()
    initial_balance = settings.welcome_bonus if settings else 5

    # 4. Create new user
    new_user = User(
        username=username,
        mobile=mobile,
        password_hash=password,
        referral_code=referral_code,
        referred_by=referral_input,
    ).save()

    # 5. Create wallet
    Wallet(user_id=str(new_user.id), balance=initial_balance).save()

    if referrer:
        bonus_amount = settings.referral_bonus if settings else 0

        ref_wallet = Wallet.objects(user_id=str(referrer.id)).first()
        if not ref_wallet:
            ref_wallet = Wallet(user_id=str(referrer.id), balance=0).save()

        if bonus_amount > 0:
            ref_wallet.balance += bonus_amount
            ref_wallet.updated_at = datetime.utcnow()
            ref_wallet.save()
            Transaction(
                tx_id=str(uuid.uuid4()),
                user_id=str(referrer.id),
                amount=bonus_amount,
                payment_method="Referral Bonus",
                status="SUCCESS"
            ).save()

    token = create_access_token(str(new_user.id))

    new_user.update(last_login=datetime.utcnow())

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(new_user.id),
            "username": new_user.username,
            "mobile": new_user.mobile,
            "role": new_user.role,
            "balance": initial_balance,
            "referral_code": referral_code,  
            "referred_by": referral_input
        }
    }

@router.post("/token", dependencies=[Depends(check_access)])
def login(payload: LoginSchema):
    # 1. Find user
    user = User.objects(mobile=payload.mobile).first()
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect mobile or password")

    # 2. Verify password
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect mobile or password")

    # 3. Create token
    token = create_access_token(str(user.id))

    # 4. Update last login
    user.update(last_login=datetime.utcnow())

    # 5. Load wallet balance
    wallet = Wallet.objects(user_id=str(user.id)).first()
    balance = wallet.balance if wallet else 0

    return {
        "access_token": token,
        "token_type" :"bearer",
        "userId":str(user.id),
    }

