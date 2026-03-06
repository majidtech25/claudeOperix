from pydantic import BaseModel, field_validator
from datetime import datetime


# ── Categories ──────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str
    description: str | None = None


class CategoryRead(BaseModel):
    id: str
    organization_id: str
    name: str
    description: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


# ── Products ─────────────────────────────────────────────────
class ProductCreate(BaseModel):
    name: str
    sku: str | None = None
    description: str | None = None
    category_id: str | None = None
    selling_price: float
    cost_price: float | None = None
    stock_quantity: int = 0
    low_stock_threshold: int = 5
    track_inventory: bool = True

    @field_validator("selling_price")
    @classmethod
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError("Selling price must be greater than 0")
        return v

    @field_validator("stock_quantity")
    @classmethod
    def stock_non_negative(cls, v):
        if v < 0:
            raise ValueError("Stock quantity cannot be negative")
        return v


class ProductRead(BaseModel):
    id: str
    organization_id: str
    category_id: str | None
    name: str
    sku: str | None
    description: str | None
    selling_price: float
    cost_price: float | None
    stock_quantity: int
    low_stock_threshold: int
    track_inventory: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductUpdate(BaseModel):
    name: str | None = None
    sku: str | None = None
    description: str | None = None
    category_id: str | None = None
    selling_price: float | None = None
    cost_price: float | None = None
    low_stock_threshold: int | None = None
    track_inventory: bool | None = None
    is_active: bool | None = None