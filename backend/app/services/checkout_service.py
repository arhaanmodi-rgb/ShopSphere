from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.cart import Cart
from app.models.product import Product


def validate_checkout(
    db: Session,
    user_id: int
):
    """
    Validate the user's cart before creating an order.

    Checks:
    1. Cart exists
    2. Cart is not empty
    3. Products still exist
    4. Requested quantities are available
    """

    cart = (
        db.query(Cart)
        .filter(
            Cart.user_id == user_id
        )
        .first()
    )

    if not cart:
        raise ValueError(
            "Cart not found."
        )

    if not cart.items:
        raise ValueError(
            "Cart is empty."
        )

    total = Decimal("0.00")

    items = []

    for cart_item in cart.items:

        product = (
            db.query(Product)
            .filter(
                Product.id == cart_item.product_id
            )
            .first()
        )

        if not product:
            raise ValueError(
                f"Product {cart_item.product_id} "
                f"not found."
            )

        if product.stock_quantity < cart_item.quantity:
            raise ValueError(
                f"Not enough stock for "
                f"{product.name}. "
                f"Available: "
                f"{product.stock_quantity}, "
                f"requested: "
                f"{cart_item.quantity}."
            )

        price = Decimal(
            str(product.price)
        )

        item_total = (
            price * cart_item.quantity
        )

        total += item_total

        items.append({
            "product_id": product.id,
            "name": product.name,
            "quantity": cart_item.quantity,
            "price": price,
            "item_total": item_total
        })

    return {
        "user_id": user_id,
        "items": items,
        "total_amount": total
    }