from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.product import Product
from app.models.flash_deal import FlashDeal
from app.schemas.flash_deal import FlashDealCreate, FlashDealUpdate, FlashDealResponse

router = APIRouter(
    prefix="/flash-deals",
    tags=["Flash Deals"]
)


def format_flash_deal(deal: FlashDeal, now: datetime) -> dict:
    original_price = float(deal.product.price) if deal.product else 0.0
    if deal.deal_price is not None and deal.deal_price > 0:
        deal_price = float(deal.deal_price)
        discount_percentage = round(((original_price - deal_price) / original_price) * 100, 1) if original_price > 0 else 0.0
    else:
        discount_percentage = float(deal.discount_percentage)
        deal_price = round(original_price * (1 - (discount_percentage / 100)), 2)

    # Calculate hours remaining
    ends_at_dt = deal.ends_at
    if ends_at_dt.tzinfo is None:
        ends_at_dt = ends_at_dt.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    diff_seconds = (ends_at_dt - now).total_seconds()
    hours_remaining = max(0.0, round(diff_seconds / 3600, 2))

    return {
        "id": deal.id,
        "product_id": deal.product_id,
        "product_name": deal.product.name if deal.product else f"Product #{deal.product_id}",
        "product_category": deal.product.category if deal.product else "General",
        "product_image": getattr(deal.product, "image", None),
        "original_price": original_price,
        "discount_percentage": discount_percentage,
        "deal_price": deal_price,
        "is_active": deal.is_active,
        "ends_at": deal.ends_at,
        "hours_remaining": hours_remaining,
    }


# ==========================================
# PUBLIC: GET ACTIVE FLASH DEALS
# ==========================================

@router.get("/", response_model=list[FlashDealResponse])
def get_active_flash_deals(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    deals = (
        db.query(FlashDeal)
        .filter(FlashDeal.is_active == True, FlashDeal.ends_at >= now)
        .order_by(FlashDeal.created_at.desc())
        .all()
    )
    return [format_flash_deal(d, now) for d in deals]


# ==========================================
# ADMIN: GET ALL FLASH DEALS
# ==========================================

@router.get("/admin/all", response_model=list[FlashDealResponse])
def get_all_flash_deals_admin(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    deals = db.query(FlashDeal).order_by(FlashDeal.created_at.desc()).all()
    return [format_flash_deal(d, now) for d in deals]


# ==========================================
# ADMIN: CREATE OR UPDATE FLASH DEAL
# ==========================================

@router.post("/admin", response_model=FlashDealResponse, status_code=status.HTTP_201_CREATED)
def create_flash_deal(
    req: FlashDealCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID #{req.product_id} not found."
        )

    # Check if a deal already exists for this product
    existing = db.query(FlashDeal).filter(FlashDeal.product_id == req.product_id).first()
    now = datetime.now(timezone.utc)

    if existing:
        existing.discount_percentage = req.discount_percentage
        existing.deal_price = req.deal_price
        existing.is_active = req.is_active
        existing.ends_at = req.ends_at
        db.commit()
        db.refresh(existing)
        return format_flash_deal(existing, now)

    deal = FlashDeal(
        product_id=req.product_id,
        discount_percentage=req.discount_percentage,
        deal_price=req.deal_price,
        is_active=req.is_active,
        ends_at=req.ends_at
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return format_flash_deal(deal, now)


# ==========================================
# ADMIN: TOGGLE FLASH DEAL STATUS
# ==========================================

@router.put("/admin/{deal_id}/toggle", response_model=FlashDealResponse)
def toggle_flash_deal_status(
    deal_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    deal = db.query(FlashDeal).filter(FlashDeal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flash deal not found"
        )
    deal.is_active = not deal.is_active
    db.commit()
    db.refresh(deal)
    return format_flash_deal(deal, datetime.now(timezone.utc))


# ==========================================
# ADMIN: DELETE FLASH DEAL
# ==========================================

@router.delete("/admin/{deal_id}", status_code=status.HTTP_200_OK)
def delete_flash_deal(
    deal_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    deal = db.query(FlashDeal).filter(FlashDeal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flash deal not found"
        )
    db.delete(deal)
    db.commit()
    return {"message": "Flash deal removed successfully", "id": deal_id}
