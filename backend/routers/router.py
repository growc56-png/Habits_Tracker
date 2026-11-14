from fastapi import APIRouter,Depends

from backend.models.models import Base
from backend.core.database import async_session,engine,get_db
from backend.schemas.schemas import UserSchema
# from backend.core.config import engine
from backend.queries.queries import registration,login

from sqlalchemy.ext.asyncio import AsyncSession





router=APIRouter()


@router.post("/setup_db")
async def setup():
    async with engine.begin() as con:
        await con.run_sync(Base.metadata.drop_all)
        await con.run_sync(Base.metadata.create_all)
    return {"ok:", True}


@router.post('/registration')
async def reg(user_reg:UserSchema, db:AsyncSession=Depends(get_db)):
    user=await registration(user_reg.username,user_reg.password,db)
    return user

    
               

    

