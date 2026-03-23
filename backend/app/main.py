from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import app.models.payment

from app.config import settings
from app.database import init_db
from app.routers import (
    auth_router,
    organizations_router,
    users_router,
    category_router,
    product_router,
    inventory_router,
    sales_days_router,
    sales_router,
    subscriptions_router,
    admin_router,
    billing_router,
)

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
audit_logger = logging.getLogger("audit")
audit_handler = logging.StreamHandler()
audit_handler.setFormatter(logging.Formatter("%(asctime)s [AUDIT] %(message)s"))
audit_logger.addHandler(audit_handler)


# ── Lifespan ─────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logging.info("🚀 Starting RetailDiscipline ERP...")
    await init_db()
    logging.info("✅ Database initialized")
    yield
    # Shutdown
    logging.info("👋 Shutting down...")


# ── App ───────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-tenant SaaS ERP — Sales Discipline & Inventory Control",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────
API_PREFIX = "/api/v1"
app.include_router(admin_router, prefix="/api/v1")
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(organizations_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(category_router, prefix=API_PREFIX)
app.include_router(product_router, prefix=API_PREFIX)
app.include_router(inventory_router, prefix=API_PREFIX)
app.include_router(sales_days_router, prefix=API_PREFIX)
app.include_router(sales_router, prefix=API_PREFIX)
app.include_router(subscriptions_router, prefix=API_PREFIX)
app.include_router(billing_router, prefix=API_PREFIX)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}