from fastapi import APIRouter, HTTPException,Depends,dependencies,FastAPI
from pydantic import BaseModel

from authx import AuthXConfig,AuthX, AuthXDependency

from backend.core.database import engine ,Base


# router=APIRouter()

# @router.post("/setup_db")
# async def setup_db():
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.drop_all)
#         await conn.run_sync(Base.metadata.create_all)
#     return {"ok": True}



