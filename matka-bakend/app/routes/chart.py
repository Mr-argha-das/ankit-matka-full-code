from fastapi import APIRouter, Depends

from ..models import Result

router = APIRouter(prefix="/chart")
from ..auth import get_current_user, require_admin
@router.get("/{market_id}")
def get_chart(market_id: str, user=Depends(get_current_user)):
    return list(Result.objects(market_id=market_id))
