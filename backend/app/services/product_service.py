from sqlalchemy.orm import Session

from app.models.product import Product


def get_all_products(db: Session):
    return db.query(Product).all()


def get_product_by_id(db: Session, product_id: int):
    return db.query(Product).filter(
        Product.id == product_id
    ).first()


def create_product(db: Session, product_data):
    product = Product(
        name=product_data.name,
        category=product_data.category,
        price=product_data.price
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


def update_product(db: Session, product_id: int, product_data):
    product = get_product_by_id(db, product_id)

    if product is None:
        return None

    product.name = product_data.name
    product.category = product_data.category
    product.price = product_data.price

    db.commit()
    db.refresh(product)

    return product


def delete_product(db: Session, product_id: int):
    product = get_product_by_id(db, product_id)

    if product is None:
        return None

    db.delete(product)
    db.commit()

    return product