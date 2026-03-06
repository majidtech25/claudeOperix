from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
import re

from app.database import get_db
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.subscription import Subscription, PlanType, SubscriptionStatus
from app.schemas.organization import OrganizationCreate, OrganizationRead, OrganizationUpdate
from app.schemas.subscription import SubscriptionRead
from app.utils.security import hash_password
from app.utils.audit import log_audit_event
from app.dependencies import get_current_active_user, require_owner_or_above, require_super_admin, get_organization_id
from app.config import settings

router = APIRouter(prefix="/organizations", tags=["Organizations"])


def slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug[:80]


@router.post("/register", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
async def register_organization(
    data: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — register a new business + create owner + start trial."""

    # Check email uniqueness
    existing = await db.execute(select(Organization).where(Organization.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An organization with this email already exists")

    existing_user = await db.execute(select(User).where(User.email == data.owner_email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    # Generate unique slug
    base_slug = slugify(data.name)
    slug = base_slug
    count = 1
    while True:
        existing_slug = await db.execute(select(Organization).where(Organization.slug == slug))
        if not existing_slug.scalar_one_or_none():
            break
        slug = f"{base_slug}-{count}"
        count += 1

    # Create organization
    org = Organization(
        name=data.name,
        slug=slug,
        email=data.email,
        phone=data.phone,
        address=data.address,
    )
    db.add(org)
    await db.flush()  # get org.id

    # Create owner user
    owner = User(
        organization_id=org.id,
        full_name=data.owner_full_name,
        email=data.owner_email,
        hashed_password=hash_password(data.owner_password),
        role=UserRole.OWNER,
    )
    db.add(owner)

    # Create trial subscription
    now = datetime.now(timezone.utc)
    trial_end = now + timedelta(days=settings.TRIAL_DURATION_DAYS)

    subscription = Subscription(
        organization_id=org.id,
        plan=PlanType.TRIAL,
        status=SubscriptionStatus.ACTIVE,
        expires_at=trial_end,
        trial_ends_at=trial_end,
        max_users=settings.TRIAL_MAX_USERS,
        can_use_credit=False,
        can_use_ai=False,
    )
    db.add(subscription)
    await db.commit()
    await db.refresh(org)

    log_audit_event(
        action="ORGANIZATION_REGISTERED",
        performed_by_id=owner.id,
        organization_id=org.id,
        target_resource="organization",
        target_id=org.id,
    )

    return org


@router.get("/me", response_model=OrganizationRead)
async def get_my_organization(
    org_id: str = Depends(get_organization_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.patch("/me", response_model=OrganizationRead)
async def update_my_organization(
    data: OrganizationUpdate,
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(require_owner_or_above),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)

    await db.commit()
    await db.refresh(org)
    return org


@router.get("/me/subscription", response_model=SubscriptionRead)
async def get_my_subscription(
    org_id: str = Depends(get_organization_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription).where(Subscription.organization_id == org_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found")
    return sub


# ── Super Admin: list all orgs ────────────────────────────────
@router.get("/", response_model=list[OrganizationRead])
async def list_all_organizations(
    _: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization))
    return result.scalars().all()