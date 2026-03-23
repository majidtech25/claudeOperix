from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User
from app.models.sales_day import SalesDay, SalesDayStatus
from app.models.sale import Sale
from app.schemas.sales_day import SalesDayOpen, SalesDayClose, SalesDayRead
from app.dependencies import (
    get_current_active_user, require_owner_or_above,
    get_organization_id, require_active_subscription,
)
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/sales-days", tags=["Sales Days"])


async def get_open_day(org_id: str, db: AsyncSession) -> SalesDay | None:
    result = await db.execute(
        select(SalesDay).where(
            SalesDay.organization_id == org_id,
            SalesDay.status == SalesDayStatus.OPEN,
        )
    )
    return result.scalar_one_or_none()


@router.post("/open", response_model=SalesDayRead, status_code=status.HTTP_201_CREATED)
async def open_sales_day(
    data: SalesDayOpen,
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    """Open a new sales day. Only one can be open at a time — discipline enforced."""
    existing_open = await get_open_day(org_id, db)
    if existing_open:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A sales day is already open (ID: {existing_open.id}). Close it before opening a new one.",
        )

    sales_day = SalesDay(
        organization_id=org_id,
        opened_by_id=current_user.id,
        status=SalesDayStatus.OPEN,
        business_date=data.business_date.isoformat(),
    )
    db.add(sales_day)
    await db.commit()
    await db.refresh(sales_day)

    log_audit_event(
    action="SALES_DAY_OPENED",
    performed_by_id=current_user.id,
    organization_id=org_id,
    target_resource="sales_day",
    target_id=sales_day.id,
    metadata={"business_date": sales_day.business_date},
    impersonated_by=getattr(current_user, "_impersonated_by", None),  # ← add this
    )

    return sales_day


@router.post("/close", response_model=SalesDayRead)
async def close_sales_day(
    data: SalesDayClose,
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(require_owner_or_above),
    _sub: User = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    """Close the current open sales day. Computes totals and makes it immutable."""
    open_day = await get_open_day(org_id, db)
    if not open_day:
        raise HTTPException(status_code=404, detail="No open sales day found")

    # Compute totals from sales
    sales_result = await db.execute(
        select(Sale).where(Sale.sales_day_id == open_day.id)
    )
    sales = sales_result.scalars().all()

    total_amount = sum(float(s.total_amount) for s in sales)
    total_transactions = len(sales)

    # Close the day — immutable from this point
    open_day.status = SalesDayStatus.CLOSED
    open_day.closed_by_id = current_user.id
    open_day.closed_at = datetime.now(timezone.utc)
    open_day.total_sales_amount = total_amount
    open_day.total_transactions = total_transactions
    open_day.closing_note = data.closing_note

    await db.commit()
    await db.refresh(open_day)

    log_audit_event(
    action="SALES_DAY_CLOSED",
    performed_by_id=current_user.id,
    organization_id=org_id,
    target_resource="sales_day",
    target_id=open_day.id,
    metadata={"total_amount": total_amount, "total_transactions": total_transactions},
    impersonated_by=getattr(current_user, "_impersonated_by", None),  # ← add this
    )

    return open_day


@router.get("/current", response_model=SalesDayRead | None)
async def get_current_open_day(
    org_id: str = Depends(get_organization_id),
    _: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the currently open sales day, or null if none."""
    return await get_open_day(org_id, db)


@router.get("/", response_model=list[SalesDayRead])
async def list_sales_days(
    org_id: str = Depends(get_organization_id),
    _: User = Depends(require_owner_or_above),
    db: AsyncSession = Depends(get_db),
    limit: int = 30,
):
    result = await db.execute(
        select(SalesDay)
        .where(SalesDay.organization_id == org_id)
        .order_by(SalesDay.opened_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{day_id}", response_model=SalesDayRead)
async def get_sales_day(
    day_id: str,
    org_id: str = Depends(get_organization_id),
    _: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SalesDay).where(SalesDay.id == day_id, SalesDay.organization_id == org_id)
    )
    day = result.scalar_one_or_none()
    if not day:
        raise HTTPException(status_code=404, detail="Sales day not found")
    return day