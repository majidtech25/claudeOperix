from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
import uuid
import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"   # Platform level
    OWNER = "owner"               # Tenant: business owner
    EMPLOYEE = "employee"         # Tenant: staff member


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True, index=True)
    # nullable for super_admin who belongs to no org

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")
    sales: Mapped[list["Sale"]] = relationship("Sale", back_populates="employee")
    sales_days_opened: Mapped[list["SalesDay"]] = relationship("SalesDay", foreign_keys="SalesDay.opened_by_id", back_populates="opened_by")
    sales_days_closed: Mapped[list["SalesDay"]] = relationship("SalesDay", foreign_keys="SalesDay.closed_by_id", back_populates="closed_by")
    inventory_logs: Mapped[list["InventoryLog"]] = relationship("InventoryLog", back_populates="performed_by")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"