from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.inventory import InventoryLog, InventoryActionType
from app.schemas.inventory import InventoryAdjustment, InventoryLogRead
from app.dependencies import (
    get_current_active_user, require_owner_or_above,
    get_organization_id, require_active_subscription,
)
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.post("/adjust", response_model=InventoryLogRead, status_code=status.HTTP_201_CREATED)
async def adjust_inventory(
    data: InventoryAdjustment,
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(require_owner_or_above),
    _sub: User = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    """Manual inventory adjustment — owner only. Creates immutable audit log."""

    # Fetch and validate product belongs to org
    result = await db.execute(
        select(Product).where(Product.id == data.product_id, Product.organization_id == org_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if not product.track_inventory:
        raise HTTPException(status_code=400, detail="This product does not track inventory")

    quantity_before = product.stock_quantity
    new_quantity = quantity_before + data.quantity_change

    if new_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Current: {quantity_before}, requested change: {data.quantity_change}",
        )

    # Update product stock
    product.stock_quantity = new_quantity

    # Create immutable inventory log
    log = InventoryLog(
        organization_id=org_id,
        product_id=product.id,
        performed_by_id=current_user.id,
        action=data.action,
        quantity_before=quantity_before,
        quantity_change=data.quantity_change,
        quantity_after=new_quantity,
        note=data.note,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    log_audit_event(
    action="INVENTORY_ADJUSTED",
    performed_by_id=current_user.id,
    organization_id=org_id,
    target_resource="product",
    target_id=product.id,
    metadata={"change": data.quantity_change, "action": data.action},
    impersonated_by=getattr(current_user, "_impersonated_by", None),  # ← add this
)

    return log


@router.get("/logs", response_model=list[InventoryLogRead])
async def get_inventory_logs(
    org_id: str = Depends(get_organization_id),
    _: User = Depends(require_owner_or_above),
    db: AsyncSession = Depends(get_db),
    product_id: str | None = None,
    limit: int = 100,
):
    query = select(InventoryLog).where(InventoryLog.organization_id == org_id)
    if product_id:
        query = query.where(InventoryLog.product_id == product_id)
    query = query.order_by(InventoryLog.created_at.desc()).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/low-stock")
async def get_low_stock_products(
    org_id: str = Depends(get_organization_id),
    _: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(
            Product.organization_id == org_id,
            Product.is_active == True,
            Product.track_inventory == True,
            Product.stock_quantity <= Product.low_stock_threshold,
        )
    )
    products = result.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "stock_quantity": p.stock_quantity,
            "low_stock_threshold": p.low_stock_threshold,
        }
        for p in products
    ]