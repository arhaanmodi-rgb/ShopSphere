from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.core.dependencies import (
    get_current_user
)

from app.models.user import User

from app.schemas.cart import (
    CartItemCreate,
    CartItemResponse
)

from app.services.cart_service import (
    add_to_cart,
    get_or_create_cart,
    remove_from_cart
)


# ==========================================
# CART ROUTER
# ==========================================

router = APIRouter(
    prefix="/cart",
    tags=["Cart"]
)


# ==========================================
# GET CART
# ==========================================

@router.get("/")
def get_my_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    cart = get_or_create_cart(
        db,
        current_user.id
    )

    return {
        "cart_id": cart.id,
        "user_id": cart.user_id,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity
            }
            for item in cart.items
        ]
    }


# ==========================================
# ADD TO CART
# ==========================================

@router.post(
    "/items",
    response_model=CartItemResponse,
    status_code=status.HTTP_201_CREATED
)
def add_item(
    item_data: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:

        item = add_to_cart(
            db=db,
            user_id=current_user.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )

        return item

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )


# ==========================================
# REMOVE FROM CART
# ==========================================

@router.delete(
    "/items/{product_id}"
)
def remove_item(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:

        remove_from_cart(
            db=db,
            user_id=current_user.id,
            product_id=product_id
        )

        return {
            "message": "Product removed from cart."
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )