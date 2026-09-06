from datetime import datetime
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str | None = None
    comment: str = Field(min_length=3)


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    user_name: str | None = None
    user_email: str | None = None
    rating: int
    title: str | None = None
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProductReviewStats(BaseModel):
    average_rating: float
    total_reviews: int
    rating_breakdown: dict[int, int]
    reviews: list[ReviewResponse]
