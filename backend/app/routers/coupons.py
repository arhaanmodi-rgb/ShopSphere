from datetime import datetime, timezone
from decimal import Decimal
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.coupon import Coupon
from app.schemas.coupon import (
    CouponCreate,
    CouponResponse,
    CouponValidateRequest,
    CouponValidateResponse
)

router = APIRouter(
    prefix="/coupons",
    tags=["Coupons"]
)


# ==========================================
# PUBLIC: GET ACTIVE COUPONS
# ==========================================

@router.get("/active", response_model=list[CouponResponse])
def get_active_coupons(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    coupons = (
        db.query(Coupon)
        .filter(Coupon.is_active == True, Coupon.valid_until >= now)
        .order_by(Coupon.valid_until.asc())
        .all()
    )
    return coupons


# ==========================================
# PUBLIC: VALIDATE COUPON AGAINST CART
# ==========================================

@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(
    req: CouponValidateRequest,
    db: Session = Depends(get_db)
):
    clean_code = req.code.strip().upper()
    now = datetime.utcnow()

    coupon = (
        db.query(Coupon)
        .filter(Coupon.code.ilike(clean_code))
        .first()
    )

    if not coupon:
        return CouponValidateResponse(
            valid=False,
            code=clean_code,
            message="Invalid promo code. Please check and try again."
        )

    if not coupon.is_active:
        return CouponValidateResponse(
            valid=False,
            code=coupon.code,
            message=f"Coupon '{coupon.code}' is no longer active."
        )

    if now > coupon.valid_until:
        return CouponValidateResponse(
            valid=False,
            code=coupon.code,
            valid_until=coupon.valid_until,
            message=f"Coupon '{coupon.code}' expired on {coupon.valid_until.strftime('%d %b %Y, %I:%M %p')}."
        )

    # Check minimum order amount requirement
    min_req = Decimal(str(coupon.min_order_amount))
    current_amount = Decimal(str(req.order_amount))

    if current_amount < min_req:
        diff = min_req - current_amount
        return CouponValidateResponse(
            valid=False,
            code=coupon.code,
            min_order_amount=min_req,
            valid_until=coupon.valid_until,
            message=f"Coupon '{coupon.code}' requires a minimum order of ₹{min_req:,.2f}. Add ₹{diff:,.2f} more to apply!"
        )

    # Calculate discount
    discount_val = Decimal(str(coupon.discount_value))
    if coupon.discount_type == "percentage":
        calculated = (current_amount * discount_val) / Decimal("100.00")
    else:
        calculated = min(discount_val, current_amount)

    # Calculate expiry countdown & last 5-hour urgency
    remaining_secs = (coupon.valid_until - now).total_seconds()
    hours_remaining = max(0.0, remaining_secs / 3600.0)
    is_expiring_soon = 0.0 < hours_remaining <= 5.0

    discount_desc = f"{discount_val}% OFF" if coupon.discount_type == "percentage" else f"₹{discount_val:,.2f} FLAT OFF"

    return CouponValidateResponse(
        valid=True,
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=discount_val,
        calculated_discount=calculated.quantize(Decimal("0.01")),
        min_order_amount=min_req,
        valid_until=coupon.valid_until,
        hours_remaining=round(hours_remaining, 2),
        is_expiring_soon=is_expiring_soon,
        message=f"Promo code '{coupon.code}' applied! You save ₹{calculated:,.2f} ({discount_desc})."
    )


# ==========================================
# ADMIN: GET ALL COUPONS
# ==========================================

@router.get("/admin", response_model=list[CouponResponse])
def get_all_coupons_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(Coupon).order_by(Coupon.id.desc()).all()


# ==========================================
# ADMIN: CREATE NEW COUPON
# ==========================================

@router.post("/admin", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon_admin(
    data: CouponCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    clean_code = data.code.strip().upper()
    existing = db.query(Coupon).filter(Coupon.code.ilike(clean_code)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coupon code '{clean_code}' already exists."
        )

    # Remove timezone offset if provided so it stores consistently
    valid_until_dt = data.valid_until.replace(tzinfo=None) if data.valid_until.tzinfo else data.valid_until

    coupon = Coupon(
        code=clean_code,
        discount_type=data.discount_type.lower(),
        discount_value=data.discount_value,
        min_order_amount=data.min_order_amount,
        valid_until=valid_until_dt,
        is_active=data.is_active
    )

    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


# ==========================================
# ADMIN: TOGGLE COUPON ACTIVE STATUS
# ==========================================

@router.put("/admin/{coupon_id}/toggle", response_model=CouponResponse)
def toggle_coupon_status(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found.")

    coupon.is_active = not coupon.is_active
    db.commit()
    db.refresh(coupon)
    return coupon


# ==========================================
# ADMIN: DELETE COUPON
# ==========================================

@router.delete("/admin/{coupon_id}")
def delete_coupon_admin(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found.")

    code_name = coupon.code
    db.delete(coupon)
    db.commit()
    return {"message": f"Coupon '{code_name}' deleted successfully.", "id": coupon_id}
