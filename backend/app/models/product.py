from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
import uuid


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    category_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("categories.id"), nullable=True, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Pricing
    selling_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    cost_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Inventory
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    track_inventory: Mapped[bool] = mapped_column(Boolean, default=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="products")
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    inventory_logs: Mapped[list["InventoryLog"]] = relationship("InventoryLog", back_populates="product")
    sale_items: Mapped[list["SaleItem"]] = relationship("SaleItem", back_populates="product")

    def __repr__(self):
        return f"<Product {self.name} (stock: {self.stock_quantity})>"