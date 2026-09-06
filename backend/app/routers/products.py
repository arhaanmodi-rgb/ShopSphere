from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse
from app.core.dependencies import require_admin


# ==========================================
# PRODUCT ROUTER
# ==========================================

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# ==========================================
# GET ALL PRODUCTS
# PUBLIC
# ==========================================

@router.get(
    "/",
    response_model=list[ProductResponse]
)
def get_products(
    db: Session = Depends(get_db)
):
    products = db.query(Product).all()

    return products


# ==========================================
# GET PRODUCT BY ID
# PUBLIC
# ==========================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
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

    return product


# ==========================================
# CREATE PRODUCT
# ADMIN ONLY
# ==========================================

@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):

    product = Product(
        name=product_data.name,
        category=product_data.category,
        price=product_data.price
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


# ==========================================
# UPDATE PRODUCT
# ADMIN ONLY
# ==========================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
def update_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
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

    product.name = product_data.name
    product.category = product_data.category
    product.price = product_data.price

    db.commit()
    db.refresh(product)

    return product


# ==========================================
# DELETE PRODUCT
# ADMIN ONLY
# ==========================================

@router.delete(
    "/{product_id}"
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
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
        "message": "Product deleted successfully.",
        "product_id": product_id
    }