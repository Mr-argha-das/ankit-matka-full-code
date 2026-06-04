from fastapi import APIRouter, Depends, Query

from app.core.dependencies import require_permissions
from app.schemas.leave import LeaveCreate, LeaveDecision
from app.services.leave import LeaveService
from app.utils.serializers import document_to_dict, documents_to_dicts

router = APIRouter()
service = LeaveService()


@router.get("")
def list_leaves(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), search: str | None = None, _=Depends(require_permissions("leaves:read"))):
    items, total = service.list(page=page, page_size=page_size, search=search)
    return {"items": documents_to_dicts(items), "total": total, "page": page, "page_size": page_size}


@router.post("")
def apply_leave(payload: LeaveCreate, _=Depends(require_permissions("leaves:create"))):
    return document_to_dict(service.apply(payload.model_dump(exclude_none=True)))


@router.post("/{leave_id}/decision")
def decide_leave(leave_id: str, payload: LeaveDecision, _=Depends(require_permissions("leaves:approve"))):
    return document_to_dict(service.decide(leave_id, payload.status, payload.remarks))
