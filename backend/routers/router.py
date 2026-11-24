# APIRouter — группирует эндпоинты, Depends — подставляет зависимости в функцию
from fastapi import APIRouter, Depends, HTTPException
# AuthJWT — работа с JWT-токенами: проверка и 
from backend.core.Auth import security

# Base — база моделей для создания таблиц, UserModel — таблица пользователей
from backend.models.models import Base, UserModel,HabitModel,HabitDone
# движок БД и зависимость get_db (выдаёт сессию БД)
from backend.core.database import async_session, engine, get_db
# Pydantic-схемы: валидируют данные из запроса (username, password, name и т.д.)
from backend.schemas.schemas import UserSchema, HabitSchema
# Response нужен, чтобы login мог положить токен в куки
from fastapi import Response
# наши функции работы с БД
from backend.queries.queries import registration, login, AddHabit

# тип сессии SQLAlchemy — просто подсказка типов
from sqlalchemy.ext.asyncio import AsyncSession
# select — конструктор SQL-запроса "SELECT ... WHERE ..."
from sqlalchemy import select

from pydantic import BaseModel





router = APIRouter()


# Пересоздаёт все таблицы в базе (данные стираются — только для разработки!)
@router.post("/setup_db")
async def setup():
    # открываем соединение: всё внутри выполнится одной транзакцией
    async with engine.begin() as con:
        await con.run_sync(Base.metadata.drop_all)   # удаляем старые таблицы
        await con.run_sync(Base.metadata.create_all) # создаём их заново
    return {"ok": True}


# Регистрация: создаёт пользователя с хешированным паролем
@router.post('/registration')
async def reg(user_reg: UserSchema, response: Response, db: AsyncSession = Depends(get_db)):
    # user_reg — уже проверенные данные запроса: user_reg.username и user_reg.password
    user = await registration(user_reg.username, user_reg.password, db)
    return user


# Вход: проверяет пароль и кладёт JWT-токен в куки браузера
@router.post('/login')
async def log(user_reg: UserSchema, response: Response, db: AsyncSession = Depends(get_db)):
    # response передаём, чтобы внутри login сработал response.set_cookie(...)
    user = await login(user_reg.username, user_reg.password, db=db, response=response)
    return user


# Добавление привычки — доступно только залогиненным
@router.post('/habits')
async def add_habit(
    hb: HabitSchema,
    # access_token_required — зависимость authx: сама проверит куку SIGMA_TOKEN
    # и не пустит запрос дальше, если токена нет или он просрочен
    credentials=Depends(security.access_token_required),
    db: AsyncSession = Depends(get_db),
):
    # credentials.subject — то, что мы положили в токен при входе (uid=username)
    username = credentials.sub

    # ищем пользователя в базе и берём его id
    res = await db.execute(select(UserModel).where(UserModel.username == username))
    user = res.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    habit = await AddHabit(
        user_id=user.id,
        name=hb.name,
        desc=hb.description,
        category=hb.category,
        icon=hb.icon,
        db=db,
    )
    return habit



@router.get('/habits')
async def get_habits(db:AsyncSession=Depends(get_db),credentials=Depends(security.access_token_required)):
    username=credentials.sub

    res = await db.execute(select(UserModel).where(UserModel.username==username))
    user=res.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="Пользователь не найден")



    habits_users=await db.execute(select(HabitModel).where(HabitModel.user_id==user.id))

    habits_all=habits_users.scalars().all()

    return habits_all


