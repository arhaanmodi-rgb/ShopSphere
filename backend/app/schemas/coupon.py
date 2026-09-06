from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class CouponBase(BaseModel):
    code: str
    discount_type: str = "percentage"  # "percentage" or "flat"
    discount_value: Decimal = Field(gt=0)
    min_order_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    valid_until: datetime
    is_active: bool = True


class CouponCreate(CouponBase):
    pass


class CouponResponse(CouponBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CouponValidateRequest(BaseModel):
    code: str
    order_amount: Decimal


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_type: str | None = None
    discount_value: Decimal | None = None
    calculated_discount: Decimal = Decimal("0.00")
    min_order_amount: Decimal = Decimal("0.00")
    valid_until: datetime | None = None
    hours_remaining: float | None = None
    is_expiring_soon: bool = False
    message: str
