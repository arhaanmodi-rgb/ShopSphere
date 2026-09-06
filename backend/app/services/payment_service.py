import uuid
from sqlalchemy.orm import Session
from app.models.order import Order
from app.models.payment import Payment


def create_payment(
    db: Session,
    order_id: int,
    payment_method: str = "cod"
):
    # --------------------------------------
    # Find order
    # --------------------------------------
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise ValueError("Order not found.")

    # --------------------------------------
    # Check order status
    # --------------------------------------
    if order.status == "cancelled":
        raise ValueError("Cannot process payment for a cancelled order.")

    # --------------------------------------
    # Validate payment method (default: cod)
    # --------------------------------------
    normalized_method = payment_method.lower().strip() if payment_method else "cod"
    allowed_methods = {"cod", "cash_on_delivery", "card", "upi", "netbanking"}

    if normalized_method not in allowed_methods:
        raise ValueError(f"Invalid payment method: {payment_method}. Supported: cod, upi, card, netbanking.")

    # Map to standardized method name
    if normalized_method in ("cod", "cash_on_delivery"):
        canonical_method = "cod"
        prefix = "COD-"
        payment_status = "pending_delivery"
    else:
        canonical_method = normalized_method
        prefix = "TXN-"
        payment_status = "success"

    # --------------------------------------
    # Prevent duplicate active payment
    # --------------------------------------
    existing_payment = (
        db.query(Payment)
        .filter(
            Payment.order_id == order_id,
            Payment.status.in_(["success", "pending_delivery"])
        )
        .first()
    )

    if existing_payment:
        return existing_payment

    # --------------------------------------
    # Generate Transaction / Receipt ID
    # --------------------------------------
    transaction_id = prefix + uuid.uuid4().hex[:12].upper()

    payment = Payment(
        order_id=order.id,
        amount=order.total_amount,
        status=payment_status,
        payment_method=canonical_method,
        transaction_id=transaction_id
    )

    db.add(payment)

    # --------------------------------------
    # Confirm order for dispatch
    # --------------------------------------
    order.status = "confirmed"

    db.commit()
    db.refresh(payment)

    return payment