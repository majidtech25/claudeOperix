"""
Run with:
  cd backend
  python create_superadmin.py
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# Must import ALL models so SQLAlchemy can resolve relationships
import app.models.organization
import app.models.subscription
import app.models.category
import app.models.user
import app.models.product
import app.models.inventory
import app.models.sales_day
import app.models.sale

from app.config import settings
from app.models.user import User, UserRole
from app.utils.security import hash_password
import uuid

engine = create_async_engine(settings.DATABASE_URL)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def create_superadmin():
    email    = "admin@operix.co.ke"
    password = "SuperAdmin@2024!"
    name     = "Operix Super Admin"

    async with SessionLocal() as db:
        user = User(
            id=str(uuid.uuid4()),
            full_name=name,
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.SUPER_ADMIN,
            organization_id=None,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        print(f"✅ Superadmin created: {email} / {password}")
        print("⚠️  Change this password immediately after first login!")

asyncio.run(create_superadmin())