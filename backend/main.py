from fastapi import APIRouter,Depends, FastAPI
from backend.routers.routers import router
from backend.models.models import UserSchema
from fastapi.middleware.cors import CORSMiddleware



app=FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_methods=["*"],


)

app.include_router(router)

