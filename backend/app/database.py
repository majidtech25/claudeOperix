from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables on startup."""
    # Import each model module directly so SQLAlchemy Base knows all tables.
    # Do NOT import via app.models.__init__ — use direct module imports to avoid circular chains.
    import app.models.organization  # noqa: F401
    import app.models.user  # noqa: F401
    import app.models.subscription  # noqa: F401
    import app.models.category  # noqa: F401
    import app.models.product  # noqa: F401
    import app.models.inventory  # noqa: F401
    import app.models.sales_day  # noqa: F401
    import app.models.sale  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)