from sqlalchemy import String, DateTime, ForeignKey, Text, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
import uuid
import enum


class InventoryActionType(str, enum.Enum):
    SALE = "sale"                   # Auto-deducted by sale
    RESTOCK = "restock"             # Manual addition
    ADJUSTMENT = "adjustment"       # Manual correction (up or down)
    RETURN = "return"               # Customer return
    DAMAGE = "damage"               # Write-off due to damage
    OPENING_STOCK = "opening_stock" # Initial stock entry


class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    performed_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    sale_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sales.id"), nullable=True)

    action: Mapped[InventoryActionType] = mapped_column(SAEnum(InventoryActionType), nullable=False)

    quantity_before: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_change: Mapped[int] = mapped_column(Integer, nullable=False)  # positive = added, negative = removed
    quantity_after: Mapped[int] = mapped_column(Integer, nullable=False)

    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # Inventory logs are IMMUTABLE — no updated_at

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="inventory_logs")
    product: Mapped["Product"] = relationship("Product", back_populates="inventory_logs")
    performed_by: Mapped["User"] = relationship("User", back_populates="inventory_logs")

    def __repr__(self):
        return f"<InventoryLog {self.action} {self.quantity_change} on product {self.product_id}>"