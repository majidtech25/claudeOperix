from pydantic import BaseModel, field_validator
from datetime import datetime
from app.models.sale import PaymentMethod


class SaleItemCreate(BaseModel):
    product_id: str
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        return v


class SaleCreate(BaseModel):
    payment_method: PaymentMethod = PaymentMethod.CASH
    note: str | None = None
    items: list[SaleItemCreate]

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Sale must have at least one item")
        return v


class SaleItemRead(BaseModel):
    id: str
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class SaleRead(BaseModel):
    id: str
    organization_id: str
    sales_day_id: str
    employee_id: str
    receipt_number: str
    total_amount: float
    payment_method: PaymentMethod
    note: str | None
    created_at: datetime
    items: list[SaleItemRead]

    model_config = {"from_attributes": True}


# ── Reports ──────────────────────────────────────────────────
class DailySummaryReport(BaseModel):
    sales_day_id: str
    business_date: str
    status: str
    total_amount: float
    total_transactions: int
    sales_by_employee: list[dict]
    top_products: list[dict]