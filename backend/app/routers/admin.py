from app.utils.audit import log_audit_event
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.subscription import Subscription, SubscriptionStatus, PlanType
from app.models.sale import Sale
from app.models.sales_day import SalesDay
from app.models.product import Product
from app.dependencies import require_super_admin
from app.utils.security import create_access_token

router = APIRouter(prefix="/admin", tags=["Super Admin"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class OrgListItem(BaseModel):
    id: str
    name: str
    slug: str
    email: str
    phone: Optional[str]
    is_active: bool
    created_at: datetime
    plan: Optional[str]
    subscription_status: Optional[str]
    expires_at: Optional[datetime]
    user_count: int
    total_sales: int

    model_config = {"from_attributes": True}


class OrgDetail(BaseModel):
    id: str
    name: str
    slug: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    is_active: bool
    created_at: datetime
    plan: Optional[str]
    subscription_status: Optional[str]
    expires_at: Optional[datetime]
    trial_ends_at: Optional[datetime]
    max_users: Optional[int]
    user_count: int
    total_sales: int
    total_revenue: float
    users: list[dict]

    model_config = {"from_attributes": True}


class PlatformStats(BaseModel):
    total_organizations: int
    active_organizations: int
    suspended_organizations: int
    total_users: int
    total_sales: int
    total_revenue: float
    trial_orgs: int
    basic_orgs: int
    pro_orgs: int


class SubscriptionUpdate(BaseModel):
    plan: Optional[PlanType] = None
    status: Optional[SubscriptionStatus] = None
    extend_days: Optional[int] = None
    max_users: Optional[int] = None


class ImpersonateResponse(BaseModel):
    access_token: str
    org_id: str
    org_name: str
    token_type: str = "bearer"
    is_impersonation: bool = True
    read_only: bool = True


# ── Platform Stats ─────────────────────────────────────────────────────────────

@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    _: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    # Org counts
    total_orgs = await db.scalar(select(func.count(Organization.id)))
    active_orgs = await db.scalar(select(func.count(Organization.id)).where(Organization.is_active == True))
    suspended_orgs = await db.scalar(
        select(func.count(Subscription.id)).where(Subscription.status == SubscriptionStatus.SUSPENDED)
    )

    # User count (exclude superadmins)
    total_users = await db.scalar(
        select(func.count(User.id)).where(User.role != UserRole.SUPER_ADMIN)
    )

    # Sales stats
    total_sales = await db.scalar(select(func.count(Sale.id))) or 0
    total_revenue = await db.scalar(select(func.sum(Sale.total_amount))) or 0.0

    # Plan breakdown
    trial_orgs = await db.scalar(
        select(func.count(Subscription.id)).where(Subscription.plan == PlanType.TRIAL)
    ) or 0
    basic_orgs = await db.scalar(
        select(func.count(Subscription.id)).where(Subscription.plan == PlanType.BASIC)
    ) or 0
    pro_orgs = await db.scalar(
        select(func.count(Subscription.id)).where(Subscription.plan == PlanType.PRO)
    ) or 0

    return PlatformStats(
        total_organizations=total_orgs or 0,
        active_organizations=active_orgs or 0,
        suspended_organizations=suspended_orgs or 0,
        total_users=total_users or 0,
        total_sales=total_sales,
        total_revenue=float(total_revenue),
        trial_orgs=trial_orgs,
        basic_orgs=basic_orgs,
        pro_orgs=pro_orgs,
    )


# ── Organizations List ─────────────────────────────────────────────────────────

@router.get("/organizations", response_model=list[OrgListItem])
async def list_organizations(
    _: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
    search: str = "",
):
    result = await db.execute(
        select(Organization)
        .options(selectinload(Organization.subscription), selectinload(Organization.users))
        .order_by(Organization.created_at.desc())
    )
    orgs = result.scalars().all()

    items = []
    for org in orgs:
        if search and search.lower() not in org.name.lower() and search.lower() not in org.email.lower():
            continue

        # Count sales for this org
        sale_count = await db.scalar(
            select(func.count(Sale.id)).where(Sale.organization_id == org.id)
        ) or 0

        sub = org.subscription
        items.append(OrgListItem(
            id=org.id,
            name=org.name,
            slug=org.slug,
            email=org.email,
            phone=org.phone,
            is_active=org.is_active,
            created_at=org.created_at,
            plan=sub.plan if sub else None,
            subscription_status=sub.status if sub else None,
            expires_at=sub.expires_at if sub else None,
            user_count=len(org.users),
            total_sales=sale_count,
        ))

    return items


# ── Organization Detail ────────────────────────────────────────────────────────

@router.get("/organizations/{org_id}", response_model=OrgDetail)
async def get_organization(
    org_id: str,
    _: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Organization)
        .options(
            selectinload(Organization.subscription),
            selectinload(Organization.users),
        )
        .where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Revenue
    revenue = await db.scalar(
        select(func.sum(Sale.total_amount)).where(Sale.organization_id == org_id)
    ) or 0.0

    sale_count = await db.scalar(
        select(func.count(Sale.id)).where(Sale.organization_id == org_id)
    ) or 0

    sub = org.subscription
    users_data = [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat(),
        }
        for u in org.users
    ]

    return OrgDetail(
        id=org.id,
        name=org.name,
        slug=org.slug,
        email=org.email,
        phone=org.phone,
        address=org.address,
        is_active=org.is_active,
        created_at=org.created_at,
        plan=sub.plan if sub else None,
        subscription_status=sub.status if sub else None,
        expires_at=sub.expires_at if sub else None,
        trial_ends_at=sub.trial_ends_at if sub else None,
        max_users=sub.max_users if sub else None,
        user_count=len(org.users),
        total_sales=sale_count,
        total_revenue=float(revenue),
        users=users_data,
    )


# ── Activate / Suspend Org ─────────────────────────────────────────────────────

@router.patch("/organizations/{org_id}/activate")
async def activate_organization(
    org_id: str,
    _: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    org.is_active = True
    await db.commit()
    return {"message": f"Organization '{org.name}' activated"}


@router.patch("/organizations/{org_id}/suspend")
async def suspend_organization(
    org_id: str,
    _: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    org.is_active = False

    # Also suspend their subscription
    sub_result = await db.execute(
        select(Subscription).where(Subscription.organization_id == org_id)
    )
    sub = sub_result.scalar_one_or_none()
    if sub:
        sub.status = SubscriptionStatus.SUSPENDED

    await db.commit()
    return {"message": f"Organization '{org.name}' suspended"}


# ── Subscription Management ────────────────────────────────────────────────────

@router.patch("/organizations/{org_id}/subscription")
async def update_subscription(
    org_id: str,
    data: SubscriptionUpdate,
    _: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(Subscription.organization_id == org_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if data.plan is not None:
        sub.plan = data.plan
        # Update limits based on plan
        if data.plan == PlanType.TRIAL:
            sub.max_users = 1
        elif data.plan == PlanType.BASIC:
            sub.max_users = 3
        elif data.plan == PlanType.PRO:
            sub.max_users = 999

    if data.status is not None:
        sub.status = data.status

    if data.extend_days is not None:
        now = datetime.now(timezone.utc)
        expires = sub.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        base = max(expires, now)
        sub.expires_at = base + timedelta(days=data.extend_days)

    if data.max_users is not None:
        sub.max_users = data.max_users

    await db.commit()
    return {"message": "Subscription updated successfully"}


# ── Impersonation ──────────────────────────────────────────────────────────────

@router.post("/organizations/{org_id}/impersonate", response_model=ImpersonateResponse)
async def impersonate_organization(
    org_id: str,
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Issue a short-lived full-access token scoped to the target org owner.
    Token carries impersonation=True and impersonated_by=admin.id for audit trail.
    All writes made in this session are tagged in audit logs.
    """
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    owner_result = await db.execute(
        select(User).where(
            User.organization_id == org_id,
            User.role == UserRole.OWNER,
        )
    )
    owner = owner_result.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="No owner found for this organization")

    # Full access token — read_only removed, impersonated_by retained for audit trail
    token = create_access_token(
        data={
            "sub": owner.id,
            "role": owner.role,
            "org": org_id,
            "impersonation": True,
            "impersonated_by": admin.id,
        },
        expires_minutes=60,
    )

    log_audit_event(
        action="IMPERSONATION_STARTED",
        performed_by_id=admin.id,
        organization_id=org_id,
        target_resource="organization",
        target_id=org_id,
        metadata={"org_name": org.name, "owner_id": owner.id},
        impersonated_by=admin.id,
    )

    return ImpersonateResponse(
        access_token=token,
        org_id=org_id,
        org_name=org.name,
    )
from app.utils.security import hash_password, verify_password

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    admin.hashed_password = hash_password(data.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}