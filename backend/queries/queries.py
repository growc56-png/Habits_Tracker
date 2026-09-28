from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.models import UserSchema, HabitSchema


#registration
async def reg(session: AsyncSession, user: str, passw: str):
    User=UserSchema(username=user,password=passw)
    
    session.add(User)
    await session.commit()
    await session.refresh(User)
    return User

#login
async def loginUser(session: AsyncSession, user:str , passw: str):
    res=await session.execute(
        select(UserSchema).where(
            UserSchema.username==user,
            UserSchema.password==passw
        )
    )
    return res.scalar_one_or_none()
    


