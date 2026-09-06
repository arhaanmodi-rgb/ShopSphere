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

from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse
)

from app.services.payment_service import (
    create_payment
)


router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


@router.post(
    "/{order_id}",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED
)
def make_payment(
    order_id: int,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    try:

        payment = create_payment(
            db=db,
            order_id=order_id,
            payment_method=(
                payment_data.payment_method
            )
        )

        return payment

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )