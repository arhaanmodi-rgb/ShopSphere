from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_admin
)
from app.models.user import User
from app.schemas.order import (
    OrderResponse,
    OrderStatusUpdate,
    OrderCreateRequest,
    ReturnExchangeRequest
)
from app.services.order_service import (
    create_order_from_cart,
    create_order_direct,
    get_user_orders,
    get_user_order,
    cancel_user_order,
    request_return_or_exchange,
    update_order_status
)


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


# ==========================================
# CREATE ORDER
# ==========================================

@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED
)
def create_order(
    order_data: OrderCreateRequest | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if order_data and order_data.items:
            order = create_order_direct(
                db=db,
                user_id=current_user.id,
                items_data=order_data.items,
                shipping_address=order_data.shipping_address,
                payment_method=order_data.payment_method or "cod"
            )
        else:
            shipping_address = order_data.shipping_address if order_data else None
            payment_method = (order_data.payment_method if order_data else None) or "cod"
            order = create_order_from_cart(
                db=db,
                user_id=current_user.id,
                shipping_address=shipping_address,
                payment_method=payment_method
            )
        return order
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


# ==========================================
# GET MY ORDERS
# ==========================================

@router.get(
    "/",
    response_model=list[OrderResponse]
)
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_orders(
        db=db,
        user_id=current_user.id
    )


# ==========================================
# GET ONE OF MY ORDERS
# ==========================================

@router.get(
    "/{order_id}",
    response_model=OrderResponse
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = get_user_order(
        db=db,
        user_id=current_user.id,
        order_id=order_id
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found."
        )

    return order


# ==========================================
# CUSTOMER CANCEL ORDER (WITHIN 24 HOURS)
# ==========================================

@router.put(
    "/{order_id}/cancel",
    response_model=OrderResponse
)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        order = cancel_user_order(
            db=db,
            user_id=current_user.id,
            order_id=order_id
        )
        return order
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


# ==========================================
# CUSTOMER RETURN OR EXCHANGE (WITHIN 10 DAYS OF DELIVERY)
# ==========================================

@router.post(
    "/{order_id}/return-exchange",
    response_model=OrderResponse
)
def submit_return_or_exchange(
    order_id: int,
    req: ReturnExchangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        order = request_return_or_exchange(
            db=db,
            user_id=current_user.id,
            order_id=order_id,
            req_type=req.type,
            reason=req.reason,
            comments=req.comments
        )
        return order
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


# ==========================================
# ADMIN — UPDATE ORDER STATUS
# ==========================================

@router.put(
    "/{order_id}/status",
    response_model=OrderResponse
)
def change_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    try:
        order = update_order_status(
            db=db,
            order_id=order_id,
            new_status=status_data.status
        )
        return order
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )