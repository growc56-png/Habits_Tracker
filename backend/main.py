from fastapi import APIRouter,Depends, FastAPI
from backend.routers.routers import router
from backend.models.models import UserSchemaModel, HabitSchemaModel
from fastapi.middleware.cors import CORSMiddleware



app=FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

