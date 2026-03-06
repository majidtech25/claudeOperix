from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
import uuid


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    subscription: Mapped["Subscription"] = relationship("Subscription", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    categories: Mapped[list["Category"]] = relationship("Category", back_populates="organization", cascade="all, delete-orphan")
    products: Mapped[list["Product"]] = relationship("Product", back_populates="organization", cascade="all, delete-orphan")
    inventory_logs: Mapped[list["InventoryLog"]] = relationship("InventoryLog", back_populates="organization", cascade="all, delete-orphan")
    sales_days: Mapped[list["SalesDay"]] = relationship("SalesDay", back_populates="organization", cascade="all, delete-orphan")
    sales: Mapped[list["Sale"]] = relationship("Sale", back_populates="organization", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Organization {self.name} ({self.slug})>"