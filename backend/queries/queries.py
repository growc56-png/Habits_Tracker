from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.models import UserModel


async def registration(username: str, password: str, db: AsyncSession):
    result = await db.execute(select(UserModel).where(UserModel.username == username))
    existing_user = result.scalars().first()
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="Пользователь с таким именем уже существует.")

    user = UserModel(username=username, password=password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"ok": True, "user_id": user.id}


async def login(username: str, password: str, db: AsyncSession):
    result = await db.execute(
        select(UserModel).where(
            UserModel.username == username,
            UserModel.password == password
        )
    )
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="Неверное имя пользователя или пароль.")
    return {"ok": True, "user_id": user.id, "username": user.username}
