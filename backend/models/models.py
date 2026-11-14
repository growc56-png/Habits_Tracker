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
    id: Mapped[intnk]
    habit: Mapped[str]=mapped_column(String(30))
    description: Mapped[str | None]=mapped_column()
    done: Mapped[bool]=mapped_column()
    users_d: Mapped[int]=mapped_column(ForeignKey('users.id'))