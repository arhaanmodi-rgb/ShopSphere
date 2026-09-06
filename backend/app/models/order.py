from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Numeric,
    DateTime
)
from sqlalchemy.orm import relationship
from app.database import Base


# ==========================================
# ORDER
# ==========================================

class Order(Base):
    __tablename__ = "orders"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    total_amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    status = Column(
        String(30),
        nullable=False,
        default="pending"
    )

    shipping_address = Column(
        String(500),
        nullable=True,
        default="Standard Delivery Address"
    )

    payment_method = Column(
        String(50),
        nullable=True,
        default="cod"
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=True
    )

    delivered_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    return_exchange_type = Column(
        String(50),
        nullable=True
    )

    return_exchange_reason = Column(
        String(500),
        nullable=True
    )

    items = relationship(
        "OrderItem",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    user = relationship(
        "User",
        lazy="joined"
    )


# ==========================================
# ORDER ITEM
# ==========================================

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey(
            "orders.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey(
            "products.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    price_at_purchase = Column(
        Numeric(10, 2),
        nullable=False
    )

    product = relationship(
        "Product",
        lazy="joined"
    )