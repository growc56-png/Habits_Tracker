from datetime import datetime
from babel.dates import format_date



from fastapi import HTTPException

from backend.models.models import UserModel,HabitModel,HabitDone,TimeDoneModel
from backend.core.database import engine
from backend.core.Auth import security,config
from fastapi import Response


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


async def login(username:str,password:str,db:AsyncSession,response:Response):

    res=await db.execute(select(UserModel).where(UserModel.username==username))
    if_good=res.scalars().first()

    if if_good!=None:
        passwrd=if_good.password
        if not pwd.verify(password,passwrd):
            raise HTTPException(status_code=401,detail='Incorrent login or password')
        else:
            token=security.create_access_token(uid=username)
            response.set_cookie(config.JWT_ACCESS_COOKIE_NAME,token)
            return {"Успешный вход"}

now=datetime.now()

day=format_date(now,format='EEEE', locale='ru')
time_str=now.strftime('%H:%M')

res_time=day+time_str

async def add_habit(name:str,desc:str, category:str, icon:str ,created_at:str,db:AsyncSession):
    habit=HabitModel(name=name,description=desc,category=category,icon=icon,created_at=res_time)
    db.add(habit)
    await db.commit()

    return {"Привычка успешно добавлена"}


             