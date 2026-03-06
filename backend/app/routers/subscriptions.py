from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionRead, SubscriptionUpdate
from app.dependencies import require_super_admin
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/admin/subscriptions", tags=["Super Admin - Subscriptions"])


@router.get("/", response_model=list[SubscriptionRead])
async def list_subscriptions(
    _: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription))
    return result.scalars().all()


@router.get("/{subscription_id}", response_model=SubscriptionRead)
async def get_subscription(
    subscription_id: str,
    _: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription).where(Subscription.id == subscription_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub


@router.patch("/{subscription_id}", response_model=SubscriptionRead)
async def update_subscription(
    subscription_id: str,
    data: SubscriptionUpdate,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Super Admin: upgrade plan, suspend, reactivate."""
    result = await db.execute(select(Subscription).where(Subscription.id == subscription_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    update_data = data.model_dump(exclude_unset=True)

    # Update plan limits when plan changes
    if "plan" in update_data:
        from app.models.subscription import PlanType
        from app.config import settings
        plan = update_data["plan"]
        if plan == PlanType.TRIAL:
            sub.max_users = settings.TRIAL_MAX_USERS
            sub.can_use_credit = False
            sub.can_use_ai = False
        elif plan == PlanType.BASIC:
            sub.max_users = settings.BASIC_MAX_USERS
            sub.can_use_credit = False
            sub.can_use_ai = False
        elif plan == PlanType.PRO:
            sub.max_users = 999
            sub.can_use_credit = True
            sub.can_use_ai = True

    for field, value in update_data.items():
        setattr(sub, field, value)

    await db.commit()
    await db.refresh(sub)

    log_audit_event(
        action="SUBSCRIPTION_UPDATED",
        performed_by_id=current_user.id,
        organization_id=sub.organization_id,
        target_resource="subscription",
        target_id=sub.id,
        metadata=update_data,
    )

    return sub