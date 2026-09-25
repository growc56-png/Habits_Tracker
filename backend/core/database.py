from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase,Mapped, mapped_column

from backend.core.config import settings







engine = create_async_engine(settings.DATABASE_URL, echo=True)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

class Authorization(Base):
    __tablename__='data'

    id:Mapped[int]=mapped_column(primary_key=True)
    username: Mapped[str]
    password: Mapped[str]


