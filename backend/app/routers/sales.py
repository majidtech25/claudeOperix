from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.sales_day import SalesDay, SalesDayStatus
from app.models.sale import Sale, SaleItem, PaymentMethod
from app.models.inventory import InventoryLog, InventoryActionType
from app.schemas.sale import SaleCreate, SaleRead, DailySummaryReport
from app.dependencies import (
    get_current_active_user, get_organization_id, require_active_subscription,
)

router = APIRouter(prefix="/sales", tags=["Sales"])


def generate_receipt_number(org_id: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    short_id = str(uuid.uuid4())[:6].upper()
    return f"RCP-{timestamp}-{short_id}"


@router.post("/", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
async def create_sale(
    data: SaleCreate,
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    """
    Record a sale. Atomic operation:
    1. Validates open sales day exists
    2. Validates all products
    3. Checks stock for all items
    4. Creates Sale + SaleItems
    5. Deducts stock + creates InventoryLogs
    All-or-nothing. No partial writes.
    """

    # 1. Validate open sales day
    day_result = await db.execute(
        select(SalesDay).where(
            SalesDay.organization_id == org_id,
            SalesDay.status == SalesDayStatus.OPEN,
        )
    )
    open_day = day_result.scalar_one_or_none()
    if not open_day:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No open sales day. Please open a sales day before recording sales.",
        )

    # 2 & 3. Validate products and stock in one pass
    total_amount = 0.0
    resolved_items = []

    for item_data in data.items:
        prod_result = await db.execute(
            select(Product).where(
                Product.id == item_data.product_id,
                Product.organization_id == org_id,
                Product.is_active == True,
            )
        )
        product = prod_result.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item_data.product_id} not found or inactive",
            )

        if product.track_inventory and product.stock_quantity < item_data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}, requested: {item_data.quantity}",
            )

        subtotal = float(product.selling_price) * item_data.quantity
        total_amount += subtotal
        resolved_items.append((product, item_data.quantity, float(product.selling_price), subtotal))

    # 4. Create Sale
    sale = Sale(
        organization_id=org_id,
        sales_day_id=open_day.id,
        employee_id=current_user.id,
        receipt_number=generate_receipt_number(org_id),
        total_amount=total_amount,
        payment_method=data.payment_method,
        note=data.note,
    )
    db.add(sale)
    await db.flush()  # get sale.id

    # 5. Create SaleItems + Deduct stock + InventoryLogs atomically
    for product, quantity, unit_price, subtotal in resolved_items:
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            product_name=product.name,  # snapshot
            quantity=quantity,
            unit_price=unit_price,       # snapshot
            subtotal=subtotal,
        )
        db.add(sale_item)

        if product.track_inventory:
            qty_before = product.stock_quantity
            product.stock_quantity -= quantity

            inv_log = InventoryLog(
                organization_id=org_id,
                product_id=product.id,
                performed_by_id=current_user.id,
                sale_id=sale.id,
                action=InventoryActionType.SALE,
                quantity_before=qty_before,
                quantity_change=-quantity,
                quantity_after=product.stock_quantity,
                note=f"Auto-deducted by sale {sale.receipt_number}",
            )
            db.add(inv_log)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Sale).where(Sale.id == sale.id)
    )
    sale = result.scalar_one()
    # Eagerly load items
    items_result = await db.execute(
        select(SaleItem).where(SaleItem.sale_id == sale.id)
    )
    sale.items  # trigger load via relationship — SQLAlchemy async needs explicit load
    await db.refresh(sale)

    return sale


@router.get("/", response_model=list[SaleRead])
async def list_sales(
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    sales_day_id: str | None = None,
):
    from sqlalchemy.orm import selectinload
    query = (
        select(Sale)
        .options(selectinload(Sale.items))
        .where(Sale.organization_id == org_id)
    )
    if sales_day_id:
        query = query.where(Sale.sales_day_id == sales_day_id)

    # Employees only see their own sales
    from app.models.user import UserRole
    if current_user.role == UserRole.EMPLOYEE:
        query = query.where(Sale.employee_id == current_user.id)

    query = query.order_by(Sale.created_at.desc()).limit(200)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/report/daily/{day_id}", response_model=DailySummaryReport)
async def daily_report(
    day_id: str,
    org_id: str = Depends(get_organization_id),
    _: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Daily summary report — read-only, derived from immutable data."""
    from sqlalchemy.orm import selectinload

    day_result = await db.execute(
        select(SalesDay).where(SalesDay.id == day_id, SalesDay.organization_id == org_id)
    )
    day = day_result.scalar_one_or_none()
    if not day:
        raise HTTPException(status_code=404, detail="Sales day not found")

    sales_result = await db.execute(
        select(Sale)
        .options(selectinload(Sale.items), selectinload(Sale.employee))
        .where(Sale.sales_day_id == day_id)
    )
    sales = sales_result.scalars().all()

    # Sales by employee
    by_employee: dict[str, dict] = {}
    product_totals: dict[str, dict] = {}

    for sale in sales:
        emp_id = sale.employee_id
        if emp_id not in by_employee:
            by_employee[emp_id] = {
                "employee_id": emp_id,
                "employee_name": sale.employee.full_name if sale.employee else "Unknown",
                "total_sales": 0,
                "transaction_count": 0,
            }
        by_employee[emp_id]["total_sales"] += float(sale.total_amount)
        by_employee[emp_id]["transaction_count"] += 1

        for item in sale.items:
            pid = item.product_id
            if pid not in product_totals:
                product_totals[pid] = {
                    "product_id": pid,
                    "product_name": item.product_name,
                    "total_quantity": 0,
                    "total_revenue": 0,
                }
            product_totals[pid]["total_quantity"] += item.quantity
            product_totals[pid]["total_revenue"] += float(item.subtotal)

    top_products = sorted(product_totals.values(), key=lambda x: x["total_revenue"], reverse=True)[:10]

    return DailySummaryReport(
        sales_day_id=day.id,
        business_date=day.business_date,
        status=day.status,
        total_amount=float(day.total_sales_amount),
        total_transactions=day.total_transactions,
        sales_by_employee=list(by_employee.values()),
        top_products=top_products,
    )


@router.get("/{sale_id}", response_model=SaleRead)
async def get_sale(
    sale_id: str,
    org_id: str = Depends(get_organization_id),
    _: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Sale)
        .options(selectinload(Sale.items))
        .where(Sale.id == sale_id, Sale.organization_id == org_id)
    )
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale