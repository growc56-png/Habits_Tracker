from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.models import UserSchemaModel, HabitSchemaModel


#registration
async def reg(session: AsyncSession, user: str, passw: str):
    User=UserSchemaModel(username=user,password=passw)
    
    session.add(User)
    await session.commit()
    await session.refresh(User)
    return User

#login
async def loginUser(session: AsyncSession, user:str , passw: str):
    res=await session.execute(
        select(UserSchemaModel).where(
            UserSchemaModel.username==user,
            UserSchemaModel.password==passw
        )
    )
    return res.scalar_one_or_none()


