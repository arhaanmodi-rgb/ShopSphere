from decimal import Decimal

from pydantic import BaseModel


class CheckoutItem(BaseModel):

    product_id: int
    name: str
    quantity: int
    price: Decimal
    item_total: Decimal


class CheckoutResponse(BaseModel):

    user_id: int
    items: list[CheckoutItem]
    total_amount: Decimal