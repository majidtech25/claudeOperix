from sqlalchemy import String, DateTime, ForeignKey, Text, Numeric, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
import uuid
import enum


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    MOBILE_MONEY = "mobile_money"
    CARD = "card"


class Sale(Base):
    """
    A sale transaction — immutable after creation.
    Belongs to one SalesDay, one Organization, one Employee.
    """
    __tablename__ = "sales"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    sales_day_id: Mapped[str] = mapped_column(String(36), ForeignKey("sales_days.id"), nullable=False, index=True)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    receipt_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod), nullable=False, default=PaymentMethod.CASH)

    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # Sales are IMMUTABLE — no updated_at

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="sales")
    sales_day: Mapped["SalesDay"] = relationship("SalesDay", back_populates="sales")
    employee: Mapped["User"] = relationship("User", back_populates="sales")
    items: Mapped[list["SaleItem"]] = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    inventory_logs: Mapped[list["InventoryLog"]] = relationship(
        "InventoryLog",
        primaryjoin="Sale.id == foreign(InventoryLog.sale_id)",
        viewonly=True,
    )

    def __repr__(self):
        return f"<Sale {self.receipt_number} - {self.total_amount}>"


class SaleItem(Base):
    """
    Line items within a sale — immutable after creation.
    Captures the price at time of sale (denormalized intentionally).
    """
    __tablename__ = "sale_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sale_id: Mapped[str] = mapped_column(String(36), ForeignKey("sales.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False, index=True)

    product_name: Mapped[str] = mapped_column(String(255), nullable=False)  # Snapshot at time of sale
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)  # Price at time of sale
    subtotal: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    # Relationships
    sale: Mapped["Sale"] = relationship("Sale", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="sale_items")

    def __repr__(self):
        return f"<SaleItem {self.product_name} x{self.quantity} @ {self.unit_price}>"