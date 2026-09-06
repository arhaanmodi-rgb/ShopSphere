import csv
import json
import os
from decimal import Decimal
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:ShopSphere123@localhost:5432/shopsphere")
CSV_PATH = r"C:\Users\LENOVO\.gemini\antigravity\brain\036b526e-61c2-4d0e-9c19-aef648613c4e\.user_uploaded\media_1788697174656.csv"
FRONTEND_DATA_PATH = r"e:\ShopSphere\frontend\src\data\products.ts"

# Rich curated Unsplash image pools for each product type
IMAGE_POOLS = {
    "iPhone 13": [
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1574755393849-623942496936?auto=format&fit=crop&w=800&q=80",
    ],
    "OnePlus 11": [
        "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
    ],
    "Samsung Galaxy S21": [
        "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584006682522-dc17d6c0d9ac?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=800&q=80",
    ],
    "HP Pavilion": [
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80",
    ],
    "Dell Laptop": [
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80",
    ],
    "Sony Headphones": [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
    ],
    "Boat Earbuds": [
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80",
    ],
    "Zara Shirt": [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
    ],
    "Nike T-shirt": [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    ],
    "Adidas Hoodie": [
        "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80",
    ],
    "Levi's Jeans": [
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
    ],
    "Puma Jacket": [
        "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80",
    ],
    "H&M Sweatshirt": [
        "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
    ],
    "Puma Sneakers": [
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80",
    ],
    "Nike Air Max": [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=80",
    ],
    "Adidas Ultraboost": [
        "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    ],
    "Reebok Shoes": [
        "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=800&q=80",
    ],
    "RayBan Sunglasses": [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80",
    ],
    "Fossil Watch": [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    ],
    "Wildcraft Backpack": [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=800&q=80",
    ],
    "American Tourister Bag": [
        "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    ]
}

def get_image_for_product(name, subcat, index):
    pool = IMAGE_POOLS.get(name)
    if not pool:
        for k, v in IMAGE_POOLS.items():
            if subcat.lower() in k.lower() or k.lower() in subcat.lower():
                pool = v
                break
    if not pool:
        pool = ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"]
    return pool[index % len(pool)]

def main():
    print("Reading CSV...")
    with open(CSV_PATH, mode="r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    # Take first 220 rows to provide a massive catalog of 220+ products across all areas
    selected_rows = rows[:220]
    print(f"Loaded {len(selected_rows)} products from CSV.")

    frontend_products = []
    db_products = []

    for idx, r in enumerate(selected_rows, start=1):
        name = r["product_name"]
        cat = r["category"]
        subcat = r["subcategory"]
        brand = r["brand"]
        price = float(r["discounted_price"]) if float(r["discounted_price"]) > 0 else float(r["price"])
        original_price = float(r["price"])
        discount = int(r["discount_percent"])
        rating = float(r["rating"])
        reviews_count = int(r["reviews_count"])
        stock_status = r["stock_status"]
        stock_qty = 35 if stock_status == "In Stock" else (10 if stock_status == "Limited Stock" else 0)
        description = r["description"]
        img = get_image_for_product(name, subcat, idx)

        display_name = f"{brand} {name}" if not name.startswith(brand) else name
        frontend_product = {
            "id": idx,
            "productId": r["product_id"],
            "name": display_name,
            "brand": brand,
            "price": round(price, 2),
            "originalPrice": round(original_price, 2),
            "discountPercent": discount,
            "category": cat,
            "subcategory": subcat,
            "image": img,
            "rating": rating,
            "reviewsCount": reviews_count,
            "description": description,
            "stock": stock_qty,
            "stockStatus": stock_status,
            "featured": idx <= 8 or rating >= 4.5
        }
        frontend_products.append(frontend_product)

        db_products.append({
            "id": idx,
            "name": display_name,
            "category": cat,
            "price": Decimal(str(round(price, 2))),
            "stock_quantity": stock_qty
        })

    # Write frontend products.ts
    ts_code = f"""export interface Product {{
  id: number;
  productId?: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  category: string;
  subcategory?: string;
  image: string;
  rating?: number;
  reviewsCount?: number;
  description?: string;
  stock?: number;
  stockStatus?: string;
  featured?: boolean;
}}

export const products: Product[] = {json.dumps(frontend_products, indent=2)};
"""
    with open(FRONTEND_DATA_PATH, "w", encoding="utf-8") as f:
        f.write(ts_code)
    print(f"Successfully generated {FRONTEND_DATA_PATH} with {len(frontend_products)} products.")

    # Seed Database
    from app.models.product import Product
    from app.database import engine
    
    Session = sessionmaker(bind=engine)
    session = Session()

    print("Populating PostgreSQL database...")
    for p_data in db_products:
        existing = session.query(Product).filter(Product.id == p_data["id"]).first()
        if existing:
            existing.name = p_data["name"]
            existing.category = p_data["category"]
            existing.price = p_data["price"]
            existing.stock_quantity = p_data["stock_quantity"]
        else:
            p = Product(
                id=p_data["id"],
                name=p_data["name"],
                category=p_data["category"],
                price=p_data["price"],
                stock_quantity=p_data["stock_quantity"]
            )
            session.add(p)
    
    session.commit()
    count = session.query(Product).count()
    print(f"Database products count: {count}")
    session.close()

if __name__ == "__main__":
    main()
