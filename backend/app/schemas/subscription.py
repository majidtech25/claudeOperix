from pydantic import BaseModel
from datetime import datetime
from app.models.subscription import PlanType, SubscriptionStatus


class SubscriptionRead(BaseModel):
    id: str
    organization_id: str
    plan: PlanType
    status: SubscriptionStatus
    started_at: datetime
    expires_at: datetime
    trial_ends_at: datetime | None
    max_users: int
    can_use_credit: bool
    can_use_ai: bool

    model_config = {"from_attributes": True}


class SubscriptionUpdate(BaseModel):
    plan: PlanType | None = None
    status: SubscriptionStatus | None = None
    expires_at: datetime | None = None