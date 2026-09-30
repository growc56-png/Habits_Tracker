from fastapi import APIRouter, HTTPException,Depends,dependencies,FastAPI,Response

from backend.core.Auth import config,security

from backend.core.database import engine



from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import async_session
from backend.queries.queries import reg, loginUser

from backend.schemas.schemas import UserAuthSchema,HabitSchema

from backend.models.models import Base




app=FastAPI()
router=APIRouter()





@router.post("/setup_db")
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)   
        await conn.run_sync(Base.metadata.create_all) 
    return {"ok": True}




async def get_session():
    async with async_session() as session:
        yield session 


@router.post("/register")
async def registration(data:UserAuthSchema, session: AsyncSession= Depends(get_session)):
    user=await reg(session,data.username, data.password)
    return {"ok":True, "user_id":user.id}


@router.post("/login")
async def login(data: UserAuthSchema, response: Response, session: AsyncSession=Depends(get_session)):
    
    user=await loginUser(session, data.username, data.password)
    if user is not None:
        token=security.create_access_token(uid=data.username)
        response.set_cookie(config.JWT_ACCESS_COOKIE_NAME,token)
    else:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return {"ok":True}

