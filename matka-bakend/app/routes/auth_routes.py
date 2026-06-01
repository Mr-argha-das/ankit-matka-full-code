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
def check_access():
    record = DevloperAccess.objects.first()
    if record and record.value is False:
        raise HTTPException(status_code=401, detail="Access Blocked by Developer")
    return True


@router.post("/register", dependencies=[Depends(check_access)])
def register(payload: UserCreate):

    # 1. Check if mobile exists
    if User.objects(mobile=payload.mobile).first():
        raise HTTPException(400, "Mobile already registered")


    # 3. Generate referral code for the new user
    referral_code = generate_referral_code()

    # 4. Create new user
    new_user = User(
        username=payload.username,
        mobile=payload.mobile,
        password_hash=payload.password,
        referral_code=payload.referral_code,     
        referred_by=payload.referral_code if payload.referral_code else None,
    ).save()

    # 5. Create wallet
    Wallet(user_id=str(new_user.id), balance=5).save()

    if payload.referral_code:

        # Find referring user
        referrer = User.objects(referral_code=payload.referral_code).first()
        if not referrer:
            raise HTTPException(400, "Invalid referral code")

        settings = SiteSettings.objects().first()
        bonus_amount = settings.referral_bonus if settings else 0

        # Add bonus to referrer wallet
        ref_wallet = Wallet.objects(user_id=str(referrer.id)).first()
        ref_wallet.balance += bonus_amount
        ref_wallet.updated_at = datetime.utcnow()
        ref_wallet.save()
        Transaction(
        tx_id=str(uuid.uuid4()),
        user_id=str(referrer.id),
        amount=settings.referral_bonus,
        payment_method="Refrel Bonus",
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
            "balance": 0,
            "referral_code": referral_code,  
            "referred_by": payload.referral_code or None
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


