from sqlalchemy.orm import Mapped,mapped_column
from sqlalchemy import Integer,ForeignKey,String
from typing import Annotated

from backend.core.database import Base

intnk=Annotated[int,mapped_column(autoincrement=True,primary_key=True)]

class UserModel(Base):
    __tablename__='users'
    id: Mapped[intnk]
    username: Mapped[str] = mapped_column(String(20),unique=True)
    password: Mapped[str] = mapped_column()

class HabitModel(Base):
    __tablename__='habits'
    id:Mapped[intnk]
    user_id: Mapped[int]=mapped_column(ForeignKey('users.id'))
    name: Mapped[str]=mapped_column(String(30))
    description: Mapped[str | None]=mapped_column()
    category: Mapped[str]=mapped_column()
    icon:Mapped[str]=mapped_column()
    created_at:Mapped[str]=mapped_column()


class HabitDone(Base):
    __tablename__='habit_done'
    id:Mapped[intnk]
    habit_id:Mapped[int]=mapped_column(ForeignKey('habits.id'),unique=True)
    user_id:Mapped[int]=mapped_column(ForeignKey('users.id'))
    completed_on:Mapped[str]=mapped_column(unique=True)


class TimeDoneModel(Base):
    __tablename__='timedone'

    id:Mapped[intnk]
    user_id:Mapped[int]=mapped_column(ForeignKey('users.id'))
    task_name:Mapped[str]=mapped_column()
    minutes:Mapped[int]=mapped_column()
    source:Mapped[str]=mapped_column()
    created_at:Mapped[str]=mapped_column()





