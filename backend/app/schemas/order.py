from datetime import datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel


# ==========================================
# ORDER ITEM CREATE
# ==========================================

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


# ==========================================
# ORDER CREATE REQUEST (DIRECT)
# ==========================================

class OrderCreateRequest(BaseModel):
    items: list[OrderItemCreate]
    shipping_address: str | None = None
    payment_method: str | None = "cod"


# ==========================================
# ORDER ITEM RESPONSE
# ==========================================

class OrderItemResponse(BaseModel):
    id: int
    product_id: int | None
    product_name: str | None = None
    quantity: int
    price_at_purchase: Decimal

    class Config:
        from_attributes = True


# ==========================================
# ORDER RESPONSE
# ==========================================

class OrderResponse(BaseModel):
    id: int
    user_id: int
    user_email: str | None = None
    user_name: str | None = None
    total_amount: Decimal
    status: str
    shipping_address: str | None = None
    payment_method: str | None = None
    created_at: datetime | None = None
    delivered_at: datetime | None = None
    return_exchange_type: str | None = None
    return_exchange_reason: str | None = None
    can_cancel: bool = False
    hours_left_to_cancel: float = 0.0
    can_return_exchange: bool = False
    days_left_to_return: int = 0
    items: list[OrderItemResponse]

    class Config:
        from_attributes = True


# ==========================================
# ORDER STATUS UPDATE
# ==========================================

class OrderStatusUpdate(BaseModel):
    status: str


# ==========================================
# RETURN / EXCHANGE REQUEST
# ==========================================

class ReturnExchangeRequest(BaseModel):
    type: Literal["return", "exchange"]
    reason: str
    comments: str | None = None