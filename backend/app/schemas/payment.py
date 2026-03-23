from pydantic import BaseModel
from datetime import datetime


class PaymentRead(BaseModel):
    id: str
    organization_id: str
    amount: float
    method: str
    status: str
    transaction_reference: str | None
    created_at: datetime

    model_config = {"from_attributes": True}