from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
import uuid
import enum


class PlanType(str, enum.Enum):
    TRIAL = "trial"
    BASIC = "basic"
    PRO = "pro"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), unique=True, nullable=False, index=True)

    plan: Mapped[PlanType] = mapped_column(SAEnum(PlanType), nullable=False, default=PlanType.TRIAL)
    status: Mapped[SubscriptionStatus] = mapped_column(SAEnum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.ACTIVE)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    max_users: Mapped[int] = mapped_column(default=1)
    can_use_credit: Mapped[bool] = mapped_column(Boolean, default=False)
    can_use_ai: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="subscription")

    def __repr__(self):
        return f"<Subscription {self.plan} - {self.status}>"