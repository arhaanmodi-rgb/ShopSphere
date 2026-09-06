from pydantic import BaseModel, Field


# ==========================================
# ADD TO CART
# ==========================================

class CartItemCreate(BaseModel):

    product_id: int

    quantity: int = Field(
        default=1,
        ge=1
    )


# ==========================================
# CART ITEM RESPONSE
# ==========================================

class CartItemResponse(BaseModel):

    id: int
    product_id: int
    quantity: int

    class Config:
        from_attributes = True


# ==========================================
# CART RESPONSE
# ==========================================

class CartResponse(BaseModel):

    id: int
    user_id: int
    items: list[CartItemResponse] = []

    class Config:
        from_attributes = True