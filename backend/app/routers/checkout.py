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

from app.schemas.checkout import (
    CheckoutResponse
)

from app.services.checkout_service import (
    validate_checkout
)


router = APIRouter(
    prefix="/checkout",
    tags=["Checkout"]
)


# ============================================================
# PREVIEW CHECKOUT
# ============================================================

@router.get(
    "/",
    response_model=CheckoutResponse
)
def checkout_preview(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    try:

        checkout = validate_checkout(
            db=db,
            user_id=current_user.id
        )

        return checkout

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )