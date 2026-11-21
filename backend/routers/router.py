from fastapi import APIRouter,Depends

from backend.models.models import Base
from backend.core.database import async_session,engine,get_db
from backend.schemas.schemas import UserSchema,HabitSchema
# from backend.core.config import engine
from fastapi import Response
from backend.queries.queries import registration,login,AddHabit

from sqlalchemy.ext.asyncio import AsyncSession

from datetime import datetime
from babel.dates import format_date

now=datetime.now()

day=format_date(now,format='EEEE', locale='ru')
time_str=now.strftime('%H:%M')

res_time=day+time_str






router=APIRouter()


@router.post("/setup_db")
async def setup():
    async with engine.begin() as con:
        await con.run_sync(Base.metadata.drop_all)
        await con.run_sync(Base.metadata.create_all)
    return {"ok:", True}


@router.post('/registration')
async def reg(user_reg:UserSchema,response:Response, db:AsyncSession=Depends(get_db)):
    user=await registration(user_reg.username,user_reg.password,db)
    return user

@router.post('/login')
async def log(user_reg:UserSchema,response:Response,db:AsyncSession=Depends(get_db)):
    user=await login(user_reg.username, user_reg.password,db=db,response=response)
    return user

@router.post('/habits')
async def add_habit(hb:HabitSchema,db:AsyncSession=Depends(get_db)):
    habit=await AddHabit(hb.name,hb.description,hb.category,hb.icon,hb.created_at,db)
    return habit




    
               

    
