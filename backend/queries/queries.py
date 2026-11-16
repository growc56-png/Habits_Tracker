

from fastapi import HTTPException

from backend.models.models import UserModel,HabitModel
from backend.core.database import engine


from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from sqlalchemy import text


async def registration(username:str,password:str,db:AsyncSession):
    async with engine.connect() as conn:
        res=await db.execute(select(UserModel).where(UserModel.username==username))
        exist_or_not=res.scalars().first()

        if exist_or_not!=None:
            return {"Пользователь с таким именем уже существует."}
        else:
            user=UserModel(username=username,password=password)
            db.add(user)
            await db.commit()
            return {"Пользователь успешно создан"}


async def login(username:str,password:str,db:AsyncSession):
    async with engine.connect() as conn:
         res=await db.execute(select(UserModel).where(UserModel.username==username).where(UserModel.password==password))
         if_good=res.scalars().first()

         if if_good==None:
             raise HTTPException(status_code=401,detail="Incorrect login or password")
         else:
             return {"Успешный вход"}

        
        
