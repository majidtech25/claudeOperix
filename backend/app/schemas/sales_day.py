from pydantic import BaseModel
from datetime import datetime, date
from app.models.sales_day import SalesDayStatus


class SalesDayOpen(BaseModel):
    business_date: date  # YYYY-MM-DD


class SalesDayClose(BaseModel):
    closing_note: str | None = None


class SalesDayRead(BaseModel):
    id: str
    organization_id: str
    opened_by_id: str
    closed_by_id: str | None
    status: SalesDayStatus
    business_date: str
    opened_at: datetime
    closed_at: datetime | None
    total_sales_amount: float
    total_transactions: int
    closing_note: str | None

    model_config = {"from_attributes": True}