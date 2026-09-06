from datetime import datetime
from pydantic import BaseModel


class FlashDealCreate(BaseModel):
    product_id: int
    discount_percentage: float = 35.0
    deal_price: float | None = None
    is_active: bool = True
    ends_at: datetime


class FlashDealUpdate(BaseModel):
    discount_percentage: float | None = None
    deal_price: float | None = None
    is_active: bool | None = None
    ends_at: datetime | None = None


class FlashDealResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_category: str
    product_image: str | None = None
    original_price: float
    discount_percentage: float
    deal_price: float
    is_active: bool
    ends_at: datetime
    hours_remaining: float

    class Config:
        from_attributes = True
