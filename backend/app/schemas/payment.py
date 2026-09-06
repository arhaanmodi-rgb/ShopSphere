from decimal import Decimal

from pydantic import BaseModel


class PaymentCreate(BaseModel):
    payment_method: str = "cod"


class PaymentResponse(BaseModel):

    id: int
    order_id: int
    amount: Decimal
    status: str
    payment_method: str
    transaction_id: str | None

    class Config:
        from_attributes = True