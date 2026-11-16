from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.models import Base
from backend.core.database import engine, get_db
from backend.schemas.schemas import UserSchema
from backend.queries.queries import registration, login

router = APIRouter()


@router.post("/setup_db")
async def setup():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    return {"ok": True}


@router.post("/registration")
async def reg(user_reg: UserSchema, db: AsyncSession = Depends(get_db)):
    return await registration(user_reg.username, user_reg.password, db)


@router.post("/login")
async def log(user_login: UserSchema, db: AsyncSession = Depends(get_db)):
    return await login(user_login.username, user_login.password, db)
