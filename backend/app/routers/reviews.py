from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.review import Review
from app.schemas.review import (
    ReviewCreate,
    ReviewResponse,
    ProductReviewStats
)

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)


# ==========================================
# GET REVIEWS FOR A PRODUCT
# ==========================================

@router.get("/product/{product_id}", response_model=ProductReviewStats)
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    review_list = []
    breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    total_rating = 0

    for r in reviews:
        breakdown[r.rating] = breakdown.get(r.rating, 0) + 1
        total_rating += r.rating
        review_list.append(
            ReviewResponse(
                id=r.id,
                product_id=r.product_id,
                user_id=r.user_id,
                user_name=r.user.name if r.user else "Verified Customer",
                user_email=r.user.email if r.user else None,
                rating=r.rating,
                title=r.title,
                comment=r.comment,
                created_at=r.created_at
            )
        )

    count = len(reviews)
    avg = round(total_rating / count, 1) if count > 0 else 4.8

    return ProductReviewStats(
        average_rating=avg,
        total_reviews=count,
        rating_breakdown=breakdown,
        reviews=review_list
    )


# ==========================================
# CREATE A REVIEW (AUTH REQUIRED)
# ==========================================

@router.post("/product/{product_id}", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    product_id: int,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=data.rating,
        title=data.title,
        comment=data.comment.strip()
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        user_name=current_user.name or current_user.email,
        user_email=current_user.email,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        created_at=review.created_at
    )
