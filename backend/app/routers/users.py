from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.subscription import Subscription
from app.schemas.user import UserCreate, UserRead, UserUpdate, PasswordChange
from app.utils.security import hash_password, verify_password
from app.dependencies import get_current_active_user, require_owner_or_above, get_organization_id, require_active_subscription

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(require_owner_or_above),
    _: User = Depends(require_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    """Owner creates employees. Enforces plan user limit."""

    # Check subscription user limit
    sub_result = await db.execute(select(Subscription).where(Subscription.organization_id == org_id))
    subscription = sub_result.scalar_one_or_none()

    user_count_result = await db.execute(
        select(func.count(User.id)).where(User.organization_id == org_id, User.is_active == True)
    )
    current_count = user_count_result.scalar()

    if subscription and current_count >= subscription.max_users:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User limit reached for your plan ({subscription.max_users} users). Upgrade to add more.",
        )

    # Prevent creating another owner on trial
    if data.role == UserRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot create additional owners. Contact support.")

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already in use")

    user = User(
        organization_id=org_id,
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/", response_model=list[UserRead])
async def list_users(
    org_id: str = Depends(get_organization_id),
    _: User = Depends(require_owner_or_above),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.organization_id == org_id))
    return result.scalars().all()


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: str,
    org_id: str = Depends(get_organization_id),
    _: User = Depends(require_owner_or_above),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == user_id, User.organization_id == org_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: str,
    data: UserUpdate,
    org_id: str = Depends(get_organization_id),
    _: User = Depends(require_owner_or_above),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == user_id, User.organization_id == org_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user


@router.post("/me/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(data.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}