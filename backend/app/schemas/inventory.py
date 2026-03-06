from pydantic import BaseModel, field_validator
from datetime import datetime
from app.models.inventory import InventoryActionType


class InventoryAdjustment(BaseModel):
    product_id: str
    action: InventoryActionType
    quantity_change: int
    note: str | None = None

    @field_validator("quantity_change")
    @classmethod
    def validate_quantity(cls, v, info):
        # Sales/damage/adjustment-down should be negative, restocks positive
        # We allow the caller to pass the correct sign
        if v == 0:
            raise ValueError("Quantity change cannot be zero")
        return v


class InventoryLogRead(BaseModel):
    id: str
    organization_id: str
    product_id: str
    performed_by_id: str
    sale_id: str | None
    action: InventoryActionType
    quantity_before: int
    quantity_change: int
    quantity_after: int
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}