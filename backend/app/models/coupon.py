from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    DateTime
)
from app.database import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    code = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )

    discount_type = Column(
        String(20),  # 'percentage' or 'flat'
        nullable=False,
        default="percentage"
    )

    discount_value = Column(
        Numeric(10, 2),
        nullable=False
    )

    min_order_amount = Column(
        Numeric(10, 2),
        nullable=False,
        default=0.0
    )

    valid_until = Column(
        DateTime,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
