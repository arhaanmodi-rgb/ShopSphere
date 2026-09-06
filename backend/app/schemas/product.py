from decimal import Decimal

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=150
    )

    category: str = Field(
        min_length=2,
        max_length=100
    )

    price: Decimal = Field(
        gt=0
    )

    stock_quantity: int = Field(
        ge=0
    )


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    price: Decimal | None = None
    stock_quantity: int | None = None


class ProductStockUpdate(BaseModel):
    stock_quantity: int


class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    price: Decimal
    stock_quantity: int

    class Config:
        from_attributes = True