from decimal import Decimal
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductStockUpdate,
    ProductResponse
)
from app.schemas.order import (
    OrderResponse,
    OrderStatusUpdate
)
from app.services.order_service import (
    get_all_orders_for_admin,
    update_order_status
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# ==========================================
# ADMIN STATS & KPIS
# ==========================================

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), Decimal("0.00"))).filter(Order.status != "cancelled").scalar()
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.status.in_(["pending", "order_received", "confirmed"])).count()
    shipped_orders = db.query(Order).filter(Order.status == "shipped").count()
    out_for_delivery_orders = db.query(Order).filter(Order.status == "out_for_delivery").count()
    delivered_orders = db.query(Order).filter(Order.status == "delivered").count()
    cancelled_orders = db.query(Order).filter(Order.status == "cancelled").count()
    total_products = db.query(Product).count()
    out_of_stock_products = db.query(Product).filter(Product.stock_quantity <= 0).count()
    total_users = db.query(User).count()

    return {
        "total_revenue": float(total_revenue),
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "shipped_orders": shipped_orders,
        "out_for_delivery_orders": out_for_delivery_orders,
        "delivered_orders": delivered_orders,
        "cancelled_orders": cancelled_orders,
        "total_products": total_products,
        "out_of_stock_products": out_of_stock_products,
        "total_users": total_users
    }


# ==========================================
# ADMIN GET ALL ORDERS
# ==========================================

@router.get(
    "/orders",
    response_model=list[OrderResponse]
)
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return get_all_orders_for_admin(db=db)


# ==========================================
# ADMIN UPDATE ORDER STATUS
# ==========================================

@router.put(
    "/orders/{order_id}/status",
    response_model=OrderResponse
)
def update_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    try:
        return update_order_status(
            db=db,
            order_id=order_id,
            new_status=status_data.status
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


# ==========================================
# ADMIN GET ALL PRODUCTS
# ==========================================

@router.get(
    "/products",
    response_model=list[ProductResponse]
)
def list_admin_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(Product).order_by(Product.id.asc()).all()


# ==========================================
# ADMIN CREATE PRODUCT
# ==========================================

@router.post(
    "/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    product = Product(
        name=product_data.name,
        category=product_data.category,
        price=product_data.price,
        stock_quantity=product_data.stock_quantity
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


# ==========================================
# ADMIN TOGGLE / UPDATE PRODUCT STOCK
# ==========================================

@router.put(
    "/products/{product_id}/stock",
    response_model=ProductResponse
)
def update_product_stock(
    product_id: int,
    stock_data: ProductStockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )

    product.stock_quantity = stock_data.stock_quantity
    db.commit()
    db.refresh(product)
    return product


# ==========================================
# ADMIN UPDATE PRODUCT DETAILS
# ==========================================

@router.put(
    "/products/{product_id}",
    response_model=ProductResponse
)
def update_product_details(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )

    if product_data.name is not None:
        product.name = product_data.name
    if product_data.category is not None:
        product.category = product_data.category
    if product_data.price is not None:
        product.price = product_data.price
    if product_data.stock_quantity is not None:
        product.stock_quantity = product_data.stock_quantity

    db.commit()
    db.refresh(product)
    return product


# ==========================================
# ADMIN DELETE PRODUCT
# ==========================================

@router.delete(
    "/products/{product_id}"
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )

    db.delete(product)
    db.commit()

    return {
        "message": f"Product #{product_id} ('{product.name}') deleted successfully.",
        "id": product_id
    }