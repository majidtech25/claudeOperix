from app.routers.auth import router as auth_router
from app.routers.organizations import router as organizations_router
from app.routers.users import router as users_router
from app.routers.products import category_router, product_router
from app.routers.inventory import router as inventory_router
from app.routers.sales_days import router as sales_days_router
from app.routers.sales import router as sales_router
from app.routers.subscriptions import router as subscriptions_router

__all__ = [
    "auth_router",
    "organizations_router",
    "users_router",
    "category_router",
    "product_router",
    "inventory_router",
    "sales_days_router",
    "sales_router",
    "subscriptions_router",
]