from sqlalchemy import Column, String, ForeignKey,Boolean, Integer
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase,Mapped, mapped_column,as_declarative

from backend.core.config import settings


@as_declarative()
class Abstractive():
    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)


class UserSchema(Abstractive):
    __tablename__="users"

    username: Mapped[str] = mapped_column()
    password: Mapped[str] = mapped_column()

class HabitSchema(Abstractive):
    __tablename__="habits"

    habit: Mapped[str]= mapped_column()
    done: Mapped[bool] = mapped_column()
   
