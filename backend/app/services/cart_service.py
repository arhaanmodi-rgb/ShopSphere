from sqlalchemy.orm import Session

from app.models.cart import Cart, CartItem
from app.models.product import Product


# ==========================================
# GET OR CREATE USER CART
# ==========================================

def get_or_create_cart(
    db: Session,
    user_id: int
):

    cart = (
        db.query(Cart)
        .filter(Cart.user_id == user_id)
        .first()
    )

    if cart:
        return cart

    cart = Cart(
        user_id=user_id
    )

    db.add(cart)
    db.commit()
    db.refresh(cart)

    return cart


# ==========================================
# ADD PRODUCT TO CART
# ==========================================

def add_to_cart(
    db: Session,
    user_id: int,
    product_id: int,
    quantity: int
):

    # Check product exists
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise ValueError("Product not found.")

    # Get user's cart
    cart = get_or_create_cart(
        db,
        user_id
    )

    # Check whether product already exists
    item = (
        db.query(CartItem)
        .filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == product_id
        )
        .first()
    )

    if item:

        # Increase existing quantity
        item.quantity += quantity

    else:

        # Create new cart item
        item = CartItem(
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity
        )

        db.add(item)

    db.commit()
    db.refresh(item)

    return item


# ==========================================
# GET USER CART
# ==========================================

def get_cart(
    db: Session,
    user_id: int
):

    return (
        db.query(Cart)
        .filter(Cart.user_id == user_id)
        .first()
    )


# ==========================================
# REMOVE ITEM
# ==========================================

def remove_from_cart(
    db: Session,
    user_id: int,
    product_id: int
):

    cart = get_cart(
        db,
        user_id
    )

    if not cart:
        raise ValueError("Cart is empty.")

    item = (
        db.query(CartItem)
        .filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == product_id
        )
        .first()
    )

    if not item:
        raise ValueError(
            "Product is not in the cart."
        )

    db.delete(item)
    db.commit()

    return True