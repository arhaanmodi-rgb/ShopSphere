from fastapi import FastAPI

from app.database import Base, engine

# ==========================================
# MODELS
# ==========================================

from app.models.product import Product
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.coupon import Coupon
from app.models.review import Review
from app.models.flash_deal import FlashDeal

# ==========================================
# ROUTERS
# ==========================================

from app.routers.products import router as product_router
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.orders import router as order_router
from app.routers.checkout import router as checkout_router
from app.routers.payments import router as payment_router
from app.routers.admin import router as admin_router
from app.routers.coupons import router as coupon_router
from app.routers.reviews import router as review_router
from app.routers.flash_deals import router as flash_deal_router

# ==========================================
# CREATE DATABASE TABLES
# ==========================================

Base.metadata.create_all(bind=engine)


from fastapi.middleware.cors import CORSMiddleware

# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="ShopSphere API",
    description="Backend API for ShopSphere e-commerce platform",
    version="1.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# REGISTER ROUTERS
# ==========================================

app.include_router(product_router)
app.include_router(auth_router)
app.include_router(cart_router)
app.include_router(order_router)
app.include_router(checkout_router)
app.include_router(payment_router)
app.include_router(admin_router)
app.include_router(coupon_router)
app.include_router(review_router)
app.include_router(flash_deal_router)


# ==========================================
# ROOT ENDPOINT
# ==========================================

@app.get("/")
def root():

    return {
        "message": "ShopSphere API is running!"
    }