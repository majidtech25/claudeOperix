from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.schemas.product import (
    CategoryCreate, CategoryRead, CategoryUpdate,
    ProductCreate, ProductRead, ProductUpdate,
)
from app.dependencies import (
    get_current_active_user, require_owner_or_above,
    get_organization_id, require_active_subscription,
)

# ── Categories ───────────────────────────────────────────────
category_router = APIRouter(prefix="/categories", tags=["Categories"])


@category_router.post("/", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    org_id: str = Depends(get_organization_id),
    _sub: User = Depends(require_active_subscription),
    _role: User = Depends(require_owner_or_above),
    db: AsyncSession = Depends(get_db),
):
    category = Category(organization_id=org_id, **data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@category_router.get("/", response_model=list[CategoryRead])
async def list_categories(
    org_id: str = Depends(get_organization_id),
    _: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.organization_id == org_id, Category.is_active == True)
    )
    return result.scalars().all()


@category_router.patch("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    org_id: str = Depends(get_organization_id),
    _: User = Depends(require_owner_or_above),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.organization_id == org_id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)
    return category


# ── Products ─────────────────────────────────────────────────
product_router = APIRouter(prefix="/products", tags=["Products"])


@product_router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    org_id: str = Depends(get_organization_id),
    _sub: User = Depends(require_active_subscription),
    _role: User = Depends(require_owner_or_above),
    db: AsyncSession = Depends(get_db),
):
    # Validate category belongs to org
    if data.category_id:
        cat = await db.execute(
            select(Category).where(Category.id == data.category_id, Category.organization_id == org_id)
        )
        if not cat.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Category not found in your organization")

    product = Product(organization_id=org_id, **data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@product_router.get("/", response_model=list[ProductRead])
async def list_products(
    org_id: str = Depends(get_organization_id),
    _: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.organization_id == org_id, Product.is_active == True)
    )
    return result.scalars().all()


@product_router.get("/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: str,
    org_id: str = Depends(get_organization_id),
    _: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.organization_id == org_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@product_router.patch("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    org_id: str = Depends(get_organization_id),
    _sub: User = Depends(require_active_subscription),
    _role: User = Depends(require_owner_or_above),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.organization_id == org_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)
    return product