

from fastapi import HTTPException

from backend.models.models import UserModel,HabitModel
from backend.core.database import engine


from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from sqlalchemy import text


from passlib.context import CryptContext

pwd=CryptContext(schemes=['pbkdf2_sha256'],deprecated="auto")



async def registration(username:str,password:str,db:AsyncSession):
    async with engine.connect() as conn:
        res=await db.execute(select(UserModel).where(UserModel.username==username))
        exist_or_not=res.scalars().first()

        if exist_or_not!=None:
            return {"Пользователь с таким именем уже существует."}
        else:
            hash_pass=pwd.hash(password)
            user=UserModel(username=username,password=hash_pass)
            db.add(user)
            await db.commit()
            return {"Пользователь успешно создан"}


async def login(username:str,password:str,db:AsyncSession):

    res=await db.execute(select(UserModel).where(UserModel.username==username))
    if_good=res.scalars().first()

    if if_good!=None:
        passwrd=if_good.password
        if not pwd.verify(password,passwrd):
            raise HTTPException(status_code=401,detail='Incorrent login or password')
        else:
            return {"Успешный вход"}
             