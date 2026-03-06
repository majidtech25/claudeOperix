from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Numeric, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
import uuid
import enum


class SalesDayStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class SalesDay(Base):
    __tablename__ = "sales_days"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    opened_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    closed_by_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    status: Mapped[SalesDayStatus] = mapped_column(SAEnum(SalesDayStatus), nullable=False, default=SalesDayStatus.OPEN)

    # Business date (the day, not the timestamp)
    business_date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD

    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Computed totals — populated on close (denormalized for performance)
    total_sales_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    total_transactions: Mapped[int] = mapped_column(default=0)
    closing_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="sales_days")
    opened_by: Mapped["User"] = relationship("User", foreign_keys=[opened_by_id], back_populates="sales_days_opened")
    closed_by: Mapped["User"] = relationship("User", foreign_keys=[closed_by_id], back_populates="sales_days_closed")
    sales: Mapped[list["Sale"]] = relationship("Sale", back_populates="sales_day")

    def __repr__(self):
        return f"<SalesDay {self.business_date} - {self.status}>"