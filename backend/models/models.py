from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey
from backend.core.database import Base


class UserSchemaModel(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column()
    password: Mapped[str] = mapped_column()


class HabitSchemaModel(Base):
    __tablename__ = "habits"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    habitname: Mapped[str] = mapped_column()
    description: Mapped[str] = mapped_column()
    category: Mapped[str] = mapped_column()
    icon: Mapped[str] = mapped_column()
    done: Mapped[bool] = mapped_column(default=False)
    user_id: Mapped[str]=mapped_column(ForeignKey("users.id"))
    