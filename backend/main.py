from fastapi import APIRouter,Depends, FastAPI
from backend.routers.routers import router
from backend.models.models import UserSchema

app=FastAPI()


app.include_router(router)

