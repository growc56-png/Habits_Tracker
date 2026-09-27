
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.models import UserSchema, HabitSchema



async def reg(session: AsyncSession, username: str, password: str):
    user=UserSchema()
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


