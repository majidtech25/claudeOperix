from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError

from app.database import get_db
from app.utils.security import decode_token
from app.models.user import User, UserRole
from app.models.subscription import Subscription, SubscriptionStatus
from datetime import datetime, timezone

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def require_owner_or_above(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role not in (UserRole.OWNER, UserRole.SUPER_ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner or Super Admin access required",
        )
    return current_user


async def require_super_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required",
        )
    return current_user


async def require_active_subscription(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Core subscription enforcement dependency.
    Attach this to ALL write endpoints in tenant layer.
    Super admins bypass this check.
    """
    if current_user.role == UserRole.SUPER_ADMIN:
        return current_user

    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with an organization",
        )

    result = await db.execute(
        select(Subscription).where(Subscription.organization_id == current_user.organization_id)
    )
    subscription = result.scalar_one_or_none()

    if subscription is None:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No subscription found for this organization",
        )

    # Check expiry dynamically.
    # SQLite returns naive datetimes, PostgreSQL returns aware — handle both.
    now_utc = datetime.now(timezone.utc)
    expires_at = subscription.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now_utc:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription has expired. Please renew to continue.",
        )

    if subscription.status == SubscriptionStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription is suspended. Please contact support.",
        )

    if subscription.status == SubscriptionStatus.EXPIRED:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription is expired.",
        )

    return current_user


def get_organization_id(current_user: User = Depends(get_current_active_user)) -> str:
    """Extract and validate organization_id from current user — enforces tenant isolation."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with an organization",
        )
    return current_user.organization_id

async def require_write_access(
    current_user: User = Depends(get_current_active_user),
    token: str = Depends(oauth2_scheme),
) -> User:
    """
    Previously blocked writes on impersonation tokens.
    Now allows full access but attaches impersonation context
    to the request state for audit logging.
    Super admin impersonation sessions have full owner-level access.
    """
    try:
        payload = decode_token(token)
        impersonated_by = payload.get("impersonated_by")
        if impersonated_by:
            # Tag the user object so routers can pass this to audit logs
            current_user._impersonated_by = impersonated_by
        else:
            current_user._impersonated_by = None
    except JWTError:
        current_user._impersonated_by = None
    return current_user