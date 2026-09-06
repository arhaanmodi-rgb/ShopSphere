from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.cart import Cart
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User


# ============================================================
# HELPER: FORMAT ORDER FOR RESPONSE
# ============================================================

def format_order_response(order: Order) -> dict:
    now = datetime.now(timezone.utc)
    created_at = order.created_at or now
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    # Calculate cancellation eligibility (within 24 hours of placement)
    hours_since_creation = (now - created_at).total_seconds() / 3600.0
    non_cancellable_statuses = {
        "cancelled",
        "delivered",
        "return_requested",
        "exchange_requested",
        "returned",
        "exchanged",
    }
    can_cancel = (order.status not in non_cancellable_statuses) and (hours_since_creation <= 24.0)
    hours_left_to_cancel = max(0.0, round(24.0 - hours_since_creation, 2)) if can_cancel else 0.0

    # Calculate return/exchange eligibility (within 10 days of delivery)
    delivery_time = order.delivered_at or created_at
    if delivery_time.tzinfo is None:
        delivery_time = delivery_time.replace(tzinfo=timezone.utc)

    days_since_delivery = (now - delivery_time).total_seconds() / (3600.0 * 24.0)
    can_return_exchange = (order.status == "delivered") and (days_since_delivery <= 10.0)
    days_left_to_return = max(0, 10 - int(days_since_delivery)) if can_return_exchange else 0

    return {
        "id": order.id,
        "user_id": order.user_id,
        "user_email": order.user.email if order.user else None,
        "user_name": order.user.name if order.user else None,
        "total_amount": order.total_amount,
        "status": order.status,
        "shipping_address": order.shipping_address or "Standard Delivery Address",
        "payment_method": order.payment_method or "cod",
        "created_at": order.created_at,
        "delivered_at": order.delivered_at,
        "return_exchange_type": order.return_exchange_type,
        "return_exchange_reason": order.return_exchange_reason,
        "can_cancel": can_cancel,
        "hours_left_to_cancel": hours_left_to_cancel,
        "can_return_exchange": can_return_exchange,
        "days_left_to_return": days_left_to_return,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else f"Product #{item.product_id}",
                "quantity": item.quantity,
                "price_at_purchase": item.price_at_purchase
            }
            for item in order.items
        ]
    }


# ============================================================
# CREATE ORDER DIRECT (FROM CHECKOUT)
# ============================================================

def create_order_direct(
    db: Session,
    user_id: int,
    items_data: list,
    shipping_address: str = None,
    payment_method: str = "cod"
) -> dict:
    if not items_data:
        raise ValueError("Cannot create order with no items.")

    try:
        products = []
        for item in items_data:
            p_id = item.product_id if hasattr(item, "product_id") else item.get("product_id")
            qty = item.quantity if hasattr(item, "quantity") else item.get("quantity", 1)

            product = db.query(Product).filter(Product.id == p_id).with_for_update().first()
            if not product:
                raise ValueError(f"Product #{p_id} not found.")

            if product.stock_quantity < qty:
                raise ValueError(
                    f"Not enough stock for {product.name}. Available: {product.stock_quantity}, requested: {qty}."
                )
            products.append((qty, product))

        order = Order(
            user_id=user_id,
            total_amount=Decimal("0.00"),
            status="pending",
            shipping_address=shipping_address or "Standard Delivery Address",
            payment_method=payment_method or "cod",
            created_at=datetime.now(timezone.utc)
        )
        db.add(order)
        db.flush()

        total = Decimal("0.00")
        for qty, product in products:
            price = Decimal(str(product.price))
            item_total = price * qty
            total += item_total

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                price_at_purchase=price
            )
            db.add(order_item)
            product.stock_quantity -= qty

        # Calculate delivery fee: 80 INR if subtotal < 999 INR, else Free Delivery
        delivery_fee = Decimal("80.00") if (total > 0 and total < Decimal("999.00")) else Decimal("0.00")
        order.total_amount = total + delivery_fee
        db.commit()
        db.refresh(order)
        return format_order_response(order)

    except Exception:
        db.rollback()
        raise


# ============================================================
# CREATE ORDER FROM CART
# ============================================================

def create_order_from_cart(
    db: Session,
    user_id: int,
    shipping_address: str = None,
    payment_method: str = "cod"
) -> dict:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        raise ValueError("Cart not found.")

    if not cart.items:
        raise ValueError("Cannot create order from an empty cart.")

    try:
        products = []
        for cart_item in cart.items:
            product = db.query(Product).filter(Product.id == cart_item.product_id).with_for_update().first()
            if not product:
                raise ValueError(f"Product {cart_item.product_id} not found.")

            if product.stock_quantity < cart_item.quantity:
                raise ValueError(
                    f"Not enough stock for {product.name}. Available: {product.stock_quantity}, requested: {cart_item.quantity}."
                )
            products.append((cart_item, product))

        order = Order(
            user_id=user_id,
            total_amount=Decimal("0.00"),
            status="pending",
            shipping_address=shipping_address or "Standard Delivery Address",
            payment_method=payment_method or "cod",
            created_at=datetime.now(timezone.utc)
        )
        db.add(order)
        db.flush()

        total = Decimal("0.00")
        for cart_item, product in products:
            price = Decimal(str(product.price))
            quantity = cart_item.quantity
            item_total = price * quantity
            total += item_total

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                price_at_purchase=price
            )
            db.add(order_item)
            product.stock_quantity -= quantity

        # Calculate delivery fee: 80 INR if subtotal < 999 INR, else Free Delivery
        delivery_fee = Decimal("80.00") if (total > 0 and total < Decimal("999.00")) else Decimal("0.00")
        order.total_amount = total + delivery_fee
        for cart_item in list(cart.items):
            db.delete(cart_item)

        db.commit()
        db.refresh(order)
        return format_order_response(order)

    except Exception:
        db.rollback()
        raise


# ============================================================
# GET ALL ORDERS OF CURRENT USER
# ============================================================

def get_user_orders(
    db: Session,
    user_id: int
) -> list[dict]:
    orders = (
        db.query(Order)
        .filter(Order.user_id == user_id)
        .order_by(Order.id.desc())
        .all()
    )
    return [format_order_response(o) for o in orders]


# ============================================================
# GET ONE ORDER OF CURRENT USER
# ============================================================

def get_user_order(
    db: Session,
    user_id: int,
    order_id: int
) -> dict | None:
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )
    if not order:
        return None
    return format_order_response(order)


# ============================================================
# CANCEL ORDER (USER: ONLY WITHIN 24 HOURS)
# ============================================================

def cancel_user_order(
    db: Session,
    user_id: int,
    order_id: int
) -> dict:
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )
    if not order:
        raise ValueError("Order not found.")

    if order.status == "cancelled":
        raise ValueError("Order is already cancelled.")

    if order.status in ["delivered", "return_requested", "exchange_requested", "returned", "exchanged"]:
        raise ValueError("Delivered orders cannot be cancelled. Please use the Return / Exchange option.")

    now = datetime.now(timezone.utc)
    created_at = order.created_at or now
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    hours_since_creation = (now - created_at).total_seconds() / 3600.0
    if hours_since_creation > 24.0:
        raise ValueError(
            "Order cancellation is only permitted within 24 hours of placement. "
            f"This order was placed {int(hours_since_creation)} hours ago."
        )

    try:
        # Restore product inventory
        for order_item in order.items:
            if order_item.product_id is not None:
                product = (
                    db.query(Product)
                    .filter(Product.id == order_item.product_id)
                    .with_for_update()
                    .first()
                )
                if product:
                    product.stock_quantity += order_item.quantity

        order.status = "cancelled"
        db.commit()
        db.refresh(order)
        return format_order_response(order)

    except Exception:
        db.rollback()
        raise


# ============================================================
# REQUEST RETURN / EXCHANGE (USER: ONLY WITHIN 10 DAYS OF DELIVERY)
# ============================================================

def request_return_or_exchange(
    db: Session,
    user_id: int,
    order_id: int,
    req_type: str,
    reason: str,
    comments: str = None
) -> dict:
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )
    if not order:
        raise ValueError("Order not found.")

    if order.status != "delivered":
        raise ValueError("Return or Exchange can only be requested after the order is Delivered.")

    now = datetime.now(timezone.utc)
    delivery_time = order.delivered_at or order.created_at or now
    if delivery_time.tzinfo is None:
        delivery_time = delivery_time.replace(tzinfo=timezone.utc)

    days_since_delivery = (now - delivery_time).total_seconds() / (3600.0 * 24.0)
    if days_since_delivery > 10.0:
        raise ValueError(
            "Return or Exchange is only permitted within 10 days of delivery. "
            f"Your order was delivered {int(days_since_delivery)} days ago."
        )

    if req_type not in ["return", "exchange"]:
        raise ValueError("Invalid request type. Must be 'return' or 'exchange'.")

    try:
        new_status = "return_requested" if req_type == "return" else "exchange_requested"
        order.status = new_status
        order.return_exchange_type = req_type
        full_reason = f"{reason} - {comments}" if comments else reason
        order.return_exchange_reason = full_reason[:500]

        db.commit()
        db.refresh(order)
        return format_order_response(order)

    except Exception:
        db.rollback()
        raise


# ============================================================
# GET ALL ORDERS FOR ADMIN
# ============================================================

def get_all_orders_for_admin(
    db: Session
) -> list[dict]:
    orders = (
        db.query(Order)
        .order_by(Order.id.desc())
        .all()
    )
    return [format_order_response(o) for o in orders]


# ============================================================
# UPDATE ORDER STATUS (ADMIN)
# ============================================================

def update_order_status(
    db: Session,
    order_id: int,
    new_status: str
) -> dict:
    allowed_statuses = {
        "pending",
        "order_received",
        "confirmed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "return_requested",
        "exchange_requested",
        "returned",
        "exchanged"
    }

    if new_status not in allowed_statuses:
        raise ValueError(
            f"Invalid status '{new_status}'. Allowed statuses: {', '.join(sorted(allowed_statuses))}"
        )

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ValueError("Order not found.")

    if order.status == new_status:
        return format_order_response(order)

    try:
        # If cancelled or returned, restore stock
        if new_status in ["cancelled", "returned"] and order.status not in ["cancelled", "returned"]:
            for order_item in order.items:
                if order_item.product_id is None:
                    continue
                product = (
                    db.query(Product)
                    .filter(Product.id == order_item.product_id)
                    .with_for_update()
                    .first()
                )
                if product:
                    product.stock_quantity += order_item.quantity

        if new_status == "delivered" and not order.delivered_at:
            order.delivered_at = datetime.now(timezone.utc)

        order.status = new_status
        db.commit()
        db.refresh(order)
        return format_order_response(order)

    except Exception:
        db.rollback()
        raise