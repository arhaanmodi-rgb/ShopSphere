from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database import Base


class Payment(Base):

    __tablename__ = "payments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    status = Column(
        String(30),
        nullable=False,
        default="pending"
    )

    payment_method = Column(
        String(30),
        nullable=False
    )

    transaction_id = Column(
        String(100),
        unique=True,
        nullable=True
    )

    order = relationship(
        "Order"
    )